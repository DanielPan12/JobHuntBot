// Read-only checks for the CSV database. Findings never change application facts.
const fs = require('node:fs');
const path = require('node:path');
const { companyKey, sameRole, recordsForRole } = require('../dashboard-model.js');
const { checkCoverage } = require('./company-categories.js');
const { parseCSV, validateRows } = require('../csv-store.js');

function readTable(text) {
  const records = parseCSV(text);
  const header = records.shift();
  const dataRows = records.filter(r => !(r.length === 1 && r[0] === ''));
  validateRows(header, dataRows);
  return { header, rows: dataRows.map(r => Object.fromEntries(header.map((h, i) => [h, r[i]]))) };
}

const required = {
  job_pool: ['company', 'job_title', 'job_url', 'status', 'cohort_match_status', 'blocker', 'next_action'],
  application_log: ['attempt_date', 'company', 'job_title', 'job_url', 'status', 'submission_evidence', 'job_description'],
  blocker_queue: ['company', 'job_title', 'job_url', 'status', 'why_blocked', 'user_action_needed'],
  follow_up: ['date', 'company', 'job_title', 'event_type', 'status', 'time'],
  daily_dashboard: ['date', 'found_count', 'submitted_count', 'skipped_count', 'blocked_count', 'needs_user_count', 'pending_count'],
  resume_rules: ['role_family', 'resume_file_path'],
  automation_rules: ['date', 'rule', 'status'],
};
function inspectTables(tables, options = {}) {
  const issues = [];
  const add = (severity, code, table, row, message) => issues.push({ severity, code, table, record: row ? tables[table].indexOf(row) + 1 : null, company: row?.company, job_title: row?.job_title, message });
  const jobs = tables.job_pool || [], logs = tables.application_log || [], blockers = tables.blocker_queue || [];
  const allowed = new Set(['Pending', 'Needs user', 'Blocked', 'Submitted', 'Offer', 'Rejected', 'Skipped']);
  const seen = new Map();
  for (const row of jobs) {
    if (row.record_type && !['role', 'company_summary'].includes(row.record_type)) add('error', 'invalid_record_type', 'job_pool', row, 'Use role / company_summary');
    if (!allowed.has(row.status)) add('error', 'invalid_status', 'job_pool', row, `Unknown status: ${row.status}`);
    if (!row.company || !row.job_title) add('error', 'missing_identity', 'job_pool', row, 'Company and role are required');
    if (!['', 'Yes', 'No', 'Unclear'].includes(row.cohort_match_status)) add('error', 'invalid_cohort', 'job_pool', row, 'Use Yes / No / Unclear');
    if (['Pending', 'Needs user'].includes(row.status) && !row.cohort_match_status) add('warning', 'missing_cohort', 'job_pool', row, 'Eligibility has not been recorded');
    const key = JSON.stringify([companyKey(row.company), row.job_title, row.job_url]);
    if (seen.has(key)) add('warning', 'duplicate_role', 'job_pool', row, `Also recorded at logical record ${seen.get(key)}; inspect cycle and history before merging`);
    else seen.set(key, jobs.indexOf(row) + 1);
    if (['Needs user', 'Blocked'].includes(row.status)) {
      if (!row.blocker && !row.next_action) add('error', 'missing_resume_step', 'job_pool', row, 'Waiting record has no blocker or next step');
      if (!blockers.some(b => !['resolved', 'abandoned'].includes(b.status) && sameRole(row, b))) add('warning', 'unqueued_work', 'job_pool', row, 'Waiting item exists only in job_pool; dashboard must include it and continuation should save a checkpoint');
    }
    if (row.record_type !== 'company_summary' && row.status === 'Submitted' && !recordsForRole(row, logs, jobs).some(log => ['Submitted', 'Offer', 'Rejected'].includes(log.status))) add('warning', 'missing_attempt', 'job_pool', row, 'No exact role/URL application log match; check aliases or missing evidence');
  }
  for (const row of logs) {
    if (!allowed.has(row.status)) add('error', 'invalid_status', 'application_log', row, `Unknown status: ${row.status}`);
    if (row.status === 'Submitted' && !row.submission_evidence && !row.confirmation_text && !row.confirmation_url) add('warning', 'missing_evidence', 'application_log', row, 'Submitted entry has no confirmation evidence');
    if (row.status === 'Submitted' && !row.job_description) add('warning', 'missing_jd', 'application_log', row, 'Historical JD missing; do not invent or replace with a different current posting');
  }
  for (const row of blockers) {
    if (!['open', 'retry later', 'resolved', 'abandoned'].includes(row.status)) add('error', 'invalid_status', 'blocker_queue', row, `Unknown status: ${row.status}`);
    if (!['resolved', 'abandoned'].includes(row.status) && !row.user_action_needed && !row.next_retry_strategy) add('warning', 'missing_resume_step', 'blocker_queue', row, 'Open item has no actionable next step');
  }
  for (const row of tables.daily_dashboard || []) {
    for (const col of required.daily_dashboard.filter(c => c.endsWith('_count'))) {
      if (!/^\d+$/.test(row[col] || '')) add('error', 'invalid_count', 'daily_dashboard', row, `Invalid non-negative count: ${col}`);
    }
  }
  for (const row of tables.resume_rules || []) {
    if (options.exists && !options.exists(row.resume_file_path)) add('error', 'missing_resume', 'resume_rules', row, `Resume file missing for ${row.role_family}`);
  }
  return issues;
}

function audit(root = path.resolve(__dirname, '..')) {
  const tables = {}, issues = [], counts = {};
  for (const [name, columns] of Object.entries(required)) {
    try {
      const table = readTable(fs.readFileSync(path.join(root, name + '.csv'), 'utf8'));
      const missing = columns.filter(c => !table.header.includes(c));
      if (missing.length) throw new Error('Missing columns: ' + missing.join(', '));
      tables[name] = table.rows; counts[name] = table.rows.length;
    } catch (error) { issues.push({ severity: 'error', code: 'invalid_csv', table: name, message: error.message }); }
  }
  issues.push(...inspectTables(tables, { exists: file => Boolean(file) && fs.existsSync(path.resolve(root, '../..', file)) }));
  // The shareable dashboard starts empty and can run before profile onboarding.
  // When the user creates a profile, validate it without requiring private data
  // to be distributed with this package.
  const profilePath = path.join(root, '../candidate_profile.json');
  if (fs.existsSync(profilePath)) {
    try { JSON.parse(fs.readFileSync(profilePath, 'utf8')); }
    catch (error) { issues.push({ severity: 'error', code: 'invalid_profile', message: error.message }); }
  }
  try {
    const coverage = checkCoverage(tables.job_pool || [], JSON.parse(fs.readFileSync(path.join(root, 'company_categories.json'), 'utf8')));
    for (const company of [...coverage.missing, ...coverage.invalid]) issues.push({ severity: 'error', code: 'invalid_category', company, message: 'Missing or invalid company classification' });
  } catch (error) { issues.push({ severity: 'error', code: 'invalid_json', message: error.message }); }
  return { counts, errors: issues.filter(i => i.severity === 'error').length, warnings: issues.filter(i => i.severity === 'warning').length, issues };
}
if (require.main === module) {
  const result = audit(process.argv[2] ? path.resolve(process.argv[2]) : undefined);
  console.log(JSON.stringify(result, null, 2));
  if (result.errors) process.exitCode = 1;
}
module.exports = { readTable, inspectTables, audit };
