#!/usr/bin/env node
// A conservative release guard for the empty public starter package.
// It supplements manual privacy review; it cannot identify every personal fact.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { readCSVRows } = require('../dashboard/csv-store.js');

const TABLES = ['application_log', 'automation_rules', 'blocker_queue', 'daily_dashboard', 'follow_up', 'job_pool', 'resume_rules'];
const PRIVATE_PATH = /(^|\/)(?:job_search|my-materials|drafts|backups|\.tmp|tmp|\.playwright-mcp|node_modules|test-results|playwright-report)(\/|$)|(^|\/)(?:candidate_profile|answer_bank|experience_bank|application_rules|resume_routing)\.(?:json|md)$|(^|\/)\.env(?:\.|$)|\.(?:bak|tmp|pdf|docx?|png|jpe?g|webp|zip|sqlite|db|pem|key)$/i;
const CONTENT_RULES = [
  ['machine-specific absolute path', /(?:\b[A-Za-z]:[\\/]|\/(?:Users|home)\/[A-Za-z0-9_.-]+\/)/],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['access token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9_-]{24,})\b/],
];

function inspectPublicPackage(root) {
  const errors = [];
  const report = (file, message) => errors.push(`${file}: ${message}`);
  // Git's publishable inventory omits ignored private working files. Never echo
  // matching content: diagnostics must not leak the very values being detected.
  let files;
  try {
    files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  } catch (_) {
    return ['Unable to inspect Git file inventory; run this check inside the release checkout.'];
  }
  for (const file of new Set(files)) {
    if (PRIVATE_PATH.test(file)) report(file, 'private or binary artifact must not be published');
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute)) continue; // A tracked deletion has no outgoing content.
    if (fs.lstatSync(absolute).isSymbolicLink()) { report(file, 'symlinks are not allowed in the release package'); continue; }
    const buffer = fs.readFileSync(absolute);
    if (buffer.includes(0)) { report(file, 'unexpected binary content'); continue; }
    const content = buffer.toString('utf8');
    for (const [label, pattern] of CONTENT_RULES) if (pattern.test(content)) report(file, label);
    if (file.endsWith('.csv') && !TABLES.some(name => file === `dashboard/${name}.csv` || file === `templates/dashboard-template/${name}.csv`)) {
      report(file, 'unexpected CSV outside the empty starter tables');
    }
  }
  for (const name of TABLES) {
    const headers = [];
    for (const directory of ['dashboard', 'templates/dashboard-template']) {
      const file = `${directory}/${name}.csv`;
      try {
        const table = readCSVRows(path.join(root, file));
        if (table.dataRows.length) report(file, 'starter table must contain only its header');
        headers.push(JSON.stringify(table.header));
      } catch (_) { report(file, 'missing or invalid starter CSV'); }
    }
    if (headers.length === 2 && headers[0] !== headers[1]) report(`${name}.csv`, 'dashboard and template schemas differ');
  }
  try {
    const file = 'dashboard/company_categories.json';
    const data = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    if (data.version !== 1 || !data.companies || Array.isArray(data.companies) || Object.keys(data.companies).length || Object.keys(data).some(key => !['version', 'companies'].includes(key))) {
      report(file, 'release classification store must be empty');
    }
  } catch (_) { report('dashboard/company_categories.json', 'missing or invalid empty classification store'); }
  try {
    const file = 'templates/candidate_profile.template.json';
    const data = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    if (!data.candidate || Object.values(data.candidate).some(value => value !== '')) report(file, 'candidate identity/contact fields must be blank');
    if (!data.current_status || Object.values(data.current_status).some(value => value !== '')) report(file, 'current status fields must be blank');
    if (!data.targets || Object.values(data.targets).some(value => value !== '' && !(Array.isArray(value) && value.length === 0))) report(file, 'target preferences must be blank');
    if (!data.compensation || ['base_salary_range', 'total_compensation_range', 'notes'].some(key => data.compensation[key] !== '')) report(file, 'compensation fields must be blank');
    if (!data.work_authorization || ['country', 'current_authorization', 'answer_exactly_as'].some(key => data.work_authorization[key] !== '') || ['requires_sponsorship_now', 'requires_sponsorship_in_future'].some(key => data.work_authorization[key] !== null)) report(file, 'work authorization facts must be blank or unknown');
    if (!Array.isArray(data.resume_files) || data.resume_files.some(resume => Object.values(resume).some(value => value !== ''))) report(file, 'resume references must be blank');
    for (const section of ['education', 'employment', 'application_completion', 'application_history']) if (data[section]) report(file, 'unexpected personal-history section');
  } catch (_) { report('templates/candidate_profile.template.json', 'missing or invalid blank profile template'); }
  try {
    const file = 'templates/application-progress.template.json';
    const data = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    if (!data.target || Object.values(data.target).some(value => value !== '') || data.updated_at !== null) report(file, 'checkpoint must not contain a real target or timestamp');
    if (!data.authorization || data.authorization.fill_authorized !== false || data.authorization.submit_authorized !== false) report(file, 'checkpoint template must not carry actual authorization');
    // Only these workflow defaults may be populated in a blank checkpoint.
    // The usage object is explanatory prose and remains part of manual review.
    const defaults = {
      schema_version: 1,
      'sections.*.inspection': 'uninspected',
      'sections.*.state': 'not_started',
      'unresolved_items.*.blocked_scope': 'field',
      'unresolved_items.*.status': 'open',
      'handoff.submission_approval_needed': true,
      'outcome.status': 'in_progress',
    };
    function visit(value, key = '') {
      if (key === 'usage') return;
      if (Array.isArray(value)) return value.forEach(item => visit(item, `${key}.*`));
      if (value !== null && typeof value === 'object') return Object.entries(value).forEach(([child, item]) => visit(item, key ? `${key}.${child}` : child));
      if (value !== '' && value !== null && value !== false && defaults[key] !== value) report(file, 'checkpoint contains populated progress or evidence');
    }
    visit(data);
  } catch (_) { report('templates/application-progress.template.json', 'missing or invalid blank checkpoint template'); }
  return errors;
}

if (require.main === module) {
  const errors = inspectPublicPackage(path.resolve(__dirname, '..'));
  if (errors.length) {
    console.error('Public package check failed:\n' + errors.map(error => `- ${error}`).join('\n'));
    process.exitCode = 1;
  } else console.log('Public package check passed: empty starter data, matching schemas, blank profile/checkpoint targets, and no detected private artifacts or tokens. Manual privacy review is still required.');
}

module.exports = { inspectPublicPackage };
