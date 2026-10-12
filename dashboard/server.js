// Zero-dependency local dashboard server. Run with: node server.js
// All mutations use validated CSV snapshots and recoverable file replacements.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createCSVStore } = require('./csv-store.js');

const PORT = 8420;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8', '.json': 'application/json; charset=utf-8',
};
const JOB_COLUMNS = ['company', 'job_title', 'status', 'current_stage'];
const EVENT_COLUMNS = ['date', 'company', 'job_title', 'contact', 'channel', 'event_type', 'deadline', 'next_action', 'status', 'notes', 'time'];

function problem(status, message) { const error = new Error(message); error.httpStatus = status; return error; }
function sendJSON(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readJSONBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0, oversized = false;
    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > 1e6) {
        oversized = true; chunks.length = 0;
        reject(problem(413, 'JSON body exceeds 1 MB'));
      } else if (!oversized) chunks.push(chunk);
    });
    req.on('end', () => {
      if (oversized) return;
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
        resolve(body);
      } catch (_) { reject(problem(400, 'Body must be a valid JSON object')); }
    });
    req.on('error', reject);
    req.on('aborted', () => reject(problem(400, 'Request body was interrupted')));
  });
}

function validateEvent({ date, time, event_type }) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date.startsWith('0000')) {
    throw problem(400, 'date must be a real YYYY-MM-DD date');
  }
  const parsed = new Date(date + 'T00:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw problem(400, 'date must be a real YYYY-MM-DD date');
  }
  if (typeof time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw problem(400, 'time must be HH:MM from 00:00 to 23:59');
  }
  if (typeof event_type !== 'string' || !event_type.trim()) throw problem(400, 'event_type is required');
}

function isWithin(root, filePath) {
  const relative = path.relative(root, filePath);
  return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}

function createDashboardServer({ root = __dirname, io = fs } = {}) {
  root = path.resolve(root);
  const realRoot = io.realpathSync(root);
  const store = createCSVStore(io);
  function load(name, columns) {
    let table;
    try { table = store.readCSVRows(path.join(root, name)); }
    catch (error) { throw problem(500, 'Could not read ' + name + ': ' + error.message); }
    if (columns.some(column => !table.header.includes(column))) {
      throw problem(500, name + ' is missing an expected column');
    }
    table.get = (row, column) => row[table.header.indexOf(column)];
    table.set = (row, column, value) => { row[table.header.indexOf(column)] = value; };
    return table;
  }
  function locate(table, index, company, title) {
    if (!Number.isInteger(index) || index < 0) throw problem(400, 'Row index must be a non-negative integer');
    const row = table.dataRows[index];
    if (!row || table.get(row, 'company') !== company || table.get(row, 'job_title') !== title) {
      throw problem(409, 'This row no longer matches; refresh the dashboard and try again');
    }
    return row;
  }
  function submittedJob(payload) {
    const table = load('job_pool.csv', JOB_COLUMNS);
    const row = locate(table, payload.jobRowIndex, payload.company, payload.job_title);
    verifyJobURL(table, row, payload);
    if (table.get(row, 'record_type') === 'company_summary') throw problem(409, 'Company summaries are not individual applications');
    if (table.get(row, 'status') !== 'Submitted') throw problem(409, 'Calendar events require an already-submitted job; refresh the dashboard');
    return { table, row };
  }
  function verifyJobURL(table, row, payload) {
    // Identical company/title pairs can be distinct postings or recruitment cycles.
    if (table.header.includes('job_url') && (typeof payload.job_url !== 'string' || table.get(row, 'job_url') !== payload.job_url)) {
      throw problem(409, 'This posting URL no longer matches; refresh the dashboard and try again');
    }
  }
  function eventMatches(table, row, expected) {
    return expected && ['date', 'time', 'event_type'].every(key =>
      typeof expected[key] === 'string' && table.get(row, key) === expected[key]);
  }
  function updateStatus(payload) {
    if (!['Offer', 'Rejected'].includes(payload.status)) throw problem(400, 'status must be Offer or Rejected');
    const table = load('job_pool.csv', JOB_COLUMNS);
    const row = locate(table, payload.rowIndex, payload.company, payload.job_title);
    verifyJobURL(table, row, payload);
    if (table.get(row, 'record_type') === 'company_summary') throw problem(409, 'Company summaries are not individual applications');
    const current = table.get(row, 'status');
    if (current === payload.status) return { ok: true, status: current, unchanged: true };
    if (current !== 'Submitted') throw problem(409, 'This job is no longer Submitted; refresh before changing its outcome');
    table.set(row, 'status', payload.status);
    store.writeCSVFiles([table]);
    // application_log records the actual submission attempt and its evidence.
    // An outcome does not rewrite that historical Submitted fact.
    return { ok: true, status: payload.status };
  }
  function addEvent(payload) {
    validateEvent(payload);
    const job = submittedJob(payload);
    const events = load('follow_up.csv', EVENT_COLUMNS);
    const stage = payload.event_type.trim();
    const duplicateIndex = events.dataRows.findIndex(row =>
      events.get(row, 'company') === payload.company && events.get(row, 'job_title') === payload.job_title &&
      eventMatches(events, row, { ...payload, event_type: stage }));
    // Retrying a completed request after a lost response must not add an event twice.
    if (duplicateIndex !== -1) return { ok: true, followUpRowIndex: duplicateIndex,
      current_stage: job.table.get(job.row, 'current_stage'), unchanged: true };
    const row = new Array(events.header.length).fill('');
    for (const column of ['date', 'time', 'company', 'job_title']) events.set(row, column, payload[column]);
    events.set(row, 'event_type', stage);
    events.set(row, 'status', 'Scheduled');
    events.dataRows.push(row);
    job.table.set(job.row, 'current_stage', stage);
    store.writeCSVFiles([job.table, events]);
    return { ok: true, followUpRowIndex: events.dataRows.length - 1, current_stage: stage };
  }
  function updateEvent(payload) {
    validateEvent(payload);
    if (!payload.expectedEvent || !['date', 'time', 'event_type'].every(key => typeof payload.expectedEvent[key] === 'string')) {
      throw problem(400, 'expectedEvent must contain the original date, time and event_type; refresh the dashboard');
    }
    const events = load('follow_up.csv', EVENT_COLUMNS);
    const row = locate(events, payload.followUpRowIndex, payload.company, payload.job_title);
    if (!eventMatches(events, row, payload.expectedEvent)) {
      throw problem(409, 'This event changed since it was opened; refresh before editing');
    }
    const job = submittedJob(payload);
    const stage = payload.event_type.trim();
    events.set(row, 'date', payload.date);
    events.set(row, 'time', payload.time);
    events.set(row, 'event_type', stage);
    job.table.set(job.row, 'current_stage', stage);
    store.writeCSVFiles([events, job.table]);
    return { ok: true, current_stage: stage };
  }
  function deleteEvent(payload) {
    const events = load('follow_up.csv', EVENT_COLUMNS);
    const row = locate(events, payload.followUpRowIndex, payload.company, payload.job_title);
    if (!eventMatches(events, row, payload)) throw problem(409, 'This event changed; refresh before deleting');
    events.dataRows.splice(payload.followUpRowIndex, 1);
    store.writeCSVFiles([events]);
    // There is no reliable previous stage to restore when deleting a calendar row.
    return { ok: true, current_stage_unchanged: true };
  }
  const routes = {
    '/api/update-status': updateStatus, '/api/calendar/add': addEvent,
    '/api/calendar/update': updateEvent, '/api/calendar/delete': deleteEvent,
  };

  return http.createServer(async (req, res) => {
    try {
      // Loopback binding alone does not prevent a remote page from targeting it.
      const host = req.headers.host || '';
      let hostname;
      try { hostname = new URL('http://' + host).hostname; } catch (_) { throw problem(400, 'Invalid Host header'); }
      if (!['localhost', '127.0.0.1'].includes(hostname)) throw problem(403, 'Only a localhost Host is allowed');
      let urlPath;
      try { urlPath = decodeURIComponent(req.url.split('?')[0]); }
      catch (_) { throw problem(400, 'Malformed URL encoding'); }
      if (urlPath.includes('\0')) throw problem(400, 'Invalid URL path');
      // Backslashes are filesystem separators on Windows; reject them uniformly
      // before path resolution so the same URL has the same boundary on all OSes.
      if (urlPath.includes('\\')) throw problem(403, 'Forbidden');
      if (Object.hasOwn(routes, urlPath)) {
        if (req.method !== 'POST') throw problem(405, 'Method not allowed');
        if (req.headers.origin && req.headers.origin !== 'http://' + host) throw problem(403, 'Cross-origin writes are not allowed');
        if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) throw problem(415, 'Content-Type must be application/json');
        const payload = await readJSONBody(req);
        // No await between reading snapshots and committing: API writes cannot
        // interleave inside this process; external changes trigger snapshot checks.
        return sendJSON(res, 200, routes[urlPath](payload));
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') throw problem(405, 'Method not allowed');
      const servedPath = urlPath === '/' ? '/dashboard.html' : urlPath;
      const filePath = path.resolve(root, '.' + servedPath);
      if (!isWithin(root, filePath)) throw problem(403, 'Forbidden');
      let realPath, content;
      try {
        realPath = io.realpathSync(filePath);
        if (!isWithin(realRoot, realPath)) throw problem(403, 'Forbidden');
        // Do not serve transaction/recovery snapshots or directory listings.
        if (!MIME[path.extname(realPath)] || !io.statSync(realPath).isFile()) throw problem(404, 'Not found');
        content = io.readFileSync(realPath);
      } catch (error) { throw error.httpStatus ? error : problem(404, 'Not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(realPath)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (!res.headersSent && !res.destroyed) sendJSON(res, error.httpStatus || 500, { ok: false, error: error.message });
    }
  });
}

if (require.main === module) {
  const server = createDashboardServer();
  // Keep the established launcher behavior and avoid binding to the local network.
  server.listen(PORT, '127.0.0.1', () => {
    console.log('求职进度仪表盘已启动: http://localhost:' + PORT + '/dashboard.html');
    console.log('保持这个窗口开着；关掉窗口就会停止服务。按 Ctrl+C 手动停止。');
  });
  server.on('error', error => { console.error('仪表盘启动失败：' + error.message); process.exitCode = 1; });
}

module.exports = { createDashboardServer, validateEvent, isWithin };
