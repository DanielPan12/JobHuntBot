const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { temporaryDirectory } = require('./test-helpers.js');
const { readTable, inspectTables, audit } = require('../scripts/audit-data.js');

test('audit reads BOM, multiline quoted cells and blank records without shifting fields', () => {
  assert.deepEqual(readTable('\uFEFFa,b\r\nx,"line1\r\nline2, ""quote"""\r\n\r\n').rows, [{ a: 'x', b: 'line1\r\nline2, "quote"' }]);
  assert.throws(() => readTable('a,b\nx,y,z'), /columns/);
  assert.throws(() => readTable('a,a\nx,y'), /duplicate/);
  assert.throws(() => readTable('a,b\nx,"y'), /unterminated/);
});

test('company summaries preserve history without demanding another application attempt', () => {
  assert.deepEqual(inspectTables({ job_pool: [{ company: '甲', job_title: '公司汇总', status: 'Submitted', record_type: 'company_summary', cohort_match_status: 'Yes' }] }), []);
});

test('separate roles and post-submission discrepancies are not auto-resolved', () => {
  const tables = {
    job_pool: [{ company: '甲', job_title: '产品', job_url: '/1', status: 'Needs user', cohort_match_status: 'Yes', next_action: '补充日期' }],
    blocker_queue: [{ company: '甲', job_title: '采购', job_url: '/2', status: 'open', user_action_needed: '核对志愿顺序' }],
    application_log: [{ company: '甲', job_title: '采购', job_url: '/2', status: 'Submitted', submission_evidence: 'success', job_description: 'JD' }],
  };
  const before = JSON.stringify(tables);
  assert.ok(inspectTables(tables).some(i => i.code === 'unqueued_work'));
  assert.equal(JSON.stringify(tables), before);
});

test('invalid statuses, duplicate records, missing evidence and absent resumes are reported', () => {
  const row = { company: '甲', job_title: '产品', job_url: '/1', status: 'Wrong', cohort_match_status: 'Yes' };
  const codes = inspectTables({ job_pool: [row, { ...row }], application_log: [{ status: 'Submitted' }], resume_rules: [{ role_family: 'PM', resume_file_path: 'missing.pdf' }] }, { exists: () => false }).map(i => i.code);
  for (const code of ['invalid_status', 'duplicate_role', 'missing_evidence', 'missing_resume']) assert.ok(codes.includes(code));
});

test('empty standalone dashboard needs no private profile and still audits an existing profile', t => {
  const root = temporaryDirectory(t);
  const dashboard = path.join(root, 'dashboard');
  fs.mkdirSync(dashboard);
  const source = path.resolve(__dirname, '..');
  for (const name of ['job_pool', 'application_log', 'blocker_queue', 'follow_up', 'daily_dashboard', 'resume_rules', 'automation_rules']) {
    const header = fs.readFileSync(path.join(source, name + '.csv'), 'utf8').split(/\r?\n/)[0];
    fs.writeFileSync(path.join(dashboard, name + '.csv'), header + '\n');
  }
  fs.writeFileSync(path.join(dashboard, 'company_categories.json'), JSON.stringify({ version: 1, companies: {} }));
  assert.equal(audit(dashboard).errors, 0);
  fs.writeFileSync(path.join(root, 'candidate_profile.json'), '{invalid');
  assert.ok(audit(dashboard).issues.some(issue => issue.code === 'invalid_profile'));
  fs.writeFileSync(path.join(root, 'candidate_profile.json'), '{}');
  assert.equal(audit(dashboard).errors, 0);
});
