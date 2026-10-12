const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { createDashboardServer } = require('../server.js');

const JOBS = 'company,job_title,status,current_stage\n甲,Other,Submitted,unchanged\n\n示例科技,示例岗位,Submitted,面试中\n';
const EVENTS = 'date,company,job_title,contact,channel,event_type,deadline,next_action,status,notes,time\n';

function temporaryDirectory(t) {
  const parent = path.resolve(os.tmpdir());
  const root = fs.mkdtempSync(path.join(parent, 'jobhunt-dashboard-test-'));
  t.after(() => {
    // Only recursively remove the exact directory created by this fixture.
    const target = path.resolve(root);
    if (path.dirname(target) !== parent || !path.basename(target).startsWith('jobhunt-dashboard-test-')) throw new Error('Unsafe cleanup path');
    fs.rmSync(target, { recursive: true, force: true });
  });
  return root;
}

async function fixture(t, { jobs = JOBS, events = EVENTS, makeIO } = {}) {
  const root = temporaryDirectory(t);
  fs.writeFileSync(path.join(root, 'job_pool.csv'), jobs);
  fs.writeFileSync(path.join(root, 'follow_up.csv'), events);
  fs.writeFileSync(path.join(root, 'dashboard.html'), '<!doctype html><title>Fixture</title>');
  const server = createDashboardServer({ root, io: makeIO ? makeIO(root) : fs });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const port = server.address().port;
  function request(urlPath, { method = 'GET', payload, raw, headers = {} } = {}) {
    const body = raw ?? (payload === undefined ? undefined : JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port, path: urlPath, method,
        headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers } }, res => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json; try { json = JSON.parse(text); } catch (_) {}
          resolve({ status: res.statusCode, json, text, headers: res.headers });
        });
      });
      req.on('error', reject);
      req.end(body);
    });
  }
  const post = (urlPath, payload) => request(urlPath, { method: 'POST', payload });
  return { root, request, post, read: name => fs.readFileSync(path.join(root, name), 'utf8') };
}

module.exports = { temporaryDirectory, fixture, JOBS, EVENTS };
