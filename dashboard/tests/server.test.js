const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { fixture, EVENTS } = require('./test-helpers.js');
const { readCSVRows } = require('../csv-store.js');

const event = { jobRowIndex: 1, company: '示例科技', job_title: '示例岗位', date: '2026-10-14', time: '10:00', event_type: '二面' };
const endJob = { rowIndex: 1, company: '示例科技', job_title: '示例岗位', status: 'Offer' };

test('calendar add preserves logical row identity and retries without duplicates', async t => {
  const app = await fixture(t);
  const response = await app.post('/api/calendar/add', event);
  assert.equal(response.status, 200);
  assert.equal(response.json.current_stage, '二面');
  const jobs = readCSVRows(path.join(app.root, 'job_pool.csv')).dataRows;
  assert.equal(jobs[0][3], 'unchanged');
  assert.equal(jobs[1][3], '二面');
  assert.equal((await app.post('/api/calendar/add', event)).json.unchanged, true);
  assert.equal(readCSVRows(path.join(app.root, 'follow_up.csv')).dataRows.length, 1);
});

test('calendar update refuses another event of the same job after rows shift', async t => {
  const app = await fixture(t);
  await app.post('/api/calendar/add', event);
  await app.post('/api/calendar/add', { ...event, date: '2026-10-15', event_type: '三面' });
  const before = app.read('follow_up.csv');
  const response = await app.post('/api/calendar/update', { ...event, followUpRowIndex: 1,
    event_type: '错改', expectedEvent: { date: event.date, time: event.time, event_type: event.event_type } });
  assert.equal(response.status, 409);
  assert.equal(app.read('follow_up.csv'), before);
  const missing = await app.post('/api/calendar/update', { ...event, followUpRowIndex: 0 });
  assert.equal(missing.status, 400);
});

test('calendar edit and delete verify originals, preserve extra columns, and report stage semantics', async t => {
  const app = await fixture(t, { events: EVENTS.trimEnd() + ',form_progress\n' });
  await app.post('/api/calendar/add', event);
  const updated = await app.post('/api/calendar/update', { ...event, followUpRowIndex: 0,
    event_type: '终面', expectedEvent: { date: event.date, time: event.time, event_type: event.event_type } });
  assert.equal(updated.status, 200);
  assert.equal(updated.json.current_stage, '终面');
  assert.ok(readCSVRows(path.join(app.root, 'follow_up.csv')).header.includes('form_progress'));
  const stale = await app.post('/api/calendar/delete', { ...event, followUpRowIndex: 0 });
  assert.equal(stale.status, 409);
  const removed = await app.post('/api/calendar/delete', { ...event, followUpRowIndex: 0, event_type: '终面' });
  assert.equal(removed.status, 200);
  assert.equal(removed.json.current_stage_unchanged, true);
  assert.equal(readCSVRows(path.join(app.root, 'follow_up.csv')).dataRows.length, 0);
});

test('invalid dates/times cannot update a file and leap days are accepted', async t => {
  const app = await fixture(t);
  const jobs = app.read('job_pool.csv'), events = app.read('follow_up.csv');
  for (const invalid of [{ date: '2026-02-31' }, { date: '2026-02-29' }, { date: '2026-13-01' },
    { date: '0000-01-01' }, { time: '24:00' }, { time: '12:60' }, { time: null }]) {
    assert.equal((await app.post('/api/calendar/add', { ...event, ...invalid })).status, 400);
  }
  assert.equal(app.read('job_pool.csv'), jobs);
  assert.equal(app.read('follow_up.csv'), events);
  assert.equal((await app.post('/api/calendar/add', { ...event, date: '2028-02-29' })).status, 200);
});

test('failed second CSV commit rolls back both files and returns failure', async t => {
  const app = await fixture(t, { makeIO: root => ({ ...fs, renameSync(from, to) {
    if (to === path.join(root, 'follow_up.csv') && from.endsWith('.tmp')) throw new Error('Injected disk failure');
    return fs.renameSync(from, to);
  } }) });
  const before = ['job_pool.csv', 'follow_up.csv'].map(app.read);
  const response = await app.post('/api/calendar/add', event);
  assert.equal(response.status, 500);
  assert.equal(response.json.ok, false);
  assert.deepEqual(['job_pool.csv', 'follow_up.csv'].map(app.read), before);
  assert.equal(fs.readdirSync(app.root).filter(name => /\.(tmp|bak)$/.test(name)).length, 0);
});

test('a corrupt CSV fails closed without rewriting user data', async t => {
  const app = await fixture(t, { jobs: 'company,job_title,status,current_stage\n示例科技,示例岗位,Submitted\n' });
  const before = app.read('job_pool.csv');
  const response = await app.post('/api/update-status', { ...endJob, rowIndex: 0 });
  assert.equal(response.status, 500);
  assert.match(response.json.error, /3 columns; expected 4/);
  assert.equal(app.read('job_pool.csv'), before);
});

test('missing follow-up columns are rejected on update instead of returning false success', async t => {
  const app = await fixture(t, { events: 'company,job_title,date,time\n示例科技,示例岗位,2026-10-14,10:00\n' });
  const before = app.read('follow_up.csv');
  const response = await app.post('/api/calendar/update', { ...event, followUpRowIndex: 0,
    expectedEvent: { date: event.date, time: event.time, event_type: '' } });
  assert.equal(response.status, 500);
  assert.equal(app.read('follow_up.csv'), before);
});

test('outcome updates reject stale rows, incompatible statuses and company summaries', async t => {
  const app = await fixture(t);
  assert.equal((await app.post('/api/update-status', { ...endJob, rowIndex: 0 })).status, 409);
  assert.equal((await app.post('/api/update-status', endJob)).status, 200);
  assert.equal((await app.post('/api/update-status', endJob)).json.unchanged, true);
  assert.equal((await app.post('/api/update-status', { ...endJob, status: 'Rejected' })).status, 409);
  for (const [status, type] of [['Pending', 'role'], ['Submitted', 'company_summary']]) {
    fs.writeFileSync(path.join(app.root, 'job_pool.csv'), `company,job_title,status,current_stage,record_type\n示例科技,示例岗位,${status},,${type}\n`);
    assert.equal((await app.post('/api/update-status', { ...endJob, rowIndex: 0 })).status, 409);
    assert.equal((await app.post('/api/calendar/add', { ...event, jobRowIndex: 0 })).status, 409);
  }
});

test('concurrent requests preserve separate updates', async t => {
  const app = await fixture(t);
  const results = await Promise.all([
    app.post('/api/update-status', endJob),
    app.post('/api/update-status', { rowIndex: 0, company: '甲', job_title: 'Other', status: 'Rejected' }),
  ]);
  assert.deepEqual(results.map(result => result.status), [200, 200]);
  assert.deepEqual(readCSVRows(path.join(app.root, 'job_pool.csv')).dataRows.map(row => row[2]), ['Rejected', 'Offer']);
});

test('same-title postings cannot overwrite one another after a URL or row change', async t => {
  const app = await fixture(t, { jobs: 'company,job_title,status,current_stage,job_url\n示例科技,示例岗位,Submitted,,https://example.com/a\n示例科技,示例岗位,Submitted,,https://example.com/b\n' });
  const before = app.read('job_pool.csv');
  assert.equal((await app.post('/api/update-status', { ...endJob, job_url: 'https://example.com/a' })).status, 409);
  assert.equal((await app.post('/api/calendar/add', { ...event, job_url: 'https://example.com/a' })).status, 409);
  assert.equal((await app.post('/api/update-status', endJob)).status, 409);
  assert.equal(app.read('job_pool.csv'), before);
  assert.equal((await app.post('/api/update-status', { ...endJob, job_url: 'https://example.com/b' })).status, 200);
});

test('bad JSON, oversized requests and malformed URLs do not take down the server', async t => {
  const app = await fixture(t);
  for (const raw of ['{', 'null', '[]', '"text"']) {
    assert.equal((await app.request('/api/update-status', { method: 'POST', raw })).status, 400);
  }
  assert.equal((await app.request('/api/update-status', { method: 'POST', raw: 'x'.repeat(1_000_001) })).status, 413);
  for (const url of ['/%E0%A4%A', '/%00']) assert.equal((await app.request(url)).status, 400);
  assert.equal((await app.request('/')).status, 200);
});

test('static traversal, symlink escape and cross-origin mutations are rejected', async t => {
  const app = await fixture(t);
  const sibling = path.basename(app.root) + '-outside';
  // A shared prefix used to pass the startsWith(ROOT) boundary check.
  assert.equal((await app.request('/..%5c' + sibling + '%5csecret.csv')).status, 403);
  assert.equal((await app.request('/%2e%2e/' + sibling + '/secret.csv')).status, 403);
  fs.symlinkSync(path.dirname(app.root), path.join(app.root, 'outside'), 'junction');
  assert.equal((await app.request('/outside/' + path.basename(app.root) + '/job_pool.csv')).status, 200);
  assert.equal((await app.request('/outside/secret.csv')).status, 404);
  // A real path outside the root is rejected even when the symlink name is inside it.
  assert.equal((await app.request('/outside')).status, 403);
  const crossOrigin = await app.request('/api/update-status', { method: 'POST', payload: endJob, headers: { Origin: 'https://example.com' } });
  assert.equal(crossOrigin.status, 403);
  assert.equal((await app.request('/', { headers: { Host: 'attacker.example' } })).status, 403);
  assert.equal((await app.request('/api/update-status', { method: 'POST', payload: endJob, headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await app.request('/api/update-status')).status, 405);
});
