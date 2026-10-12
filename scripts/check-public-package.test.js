const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { inspectPublicPackage } = require('./check-public-package.js');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jobhunt-public-check-'));
  t.after(() => {
    const resolved = path.resolve(root);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('jobhunt-public-check-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  execFileSync('git', ['init', '--quiet', root]);
  const source = path.resolve(__dirname, '..');
  for (const directory of ['dashboard', 'templates/dashboard-template']) {
    fs.mkdirSync(path.join(root, directory), { recursive: true });
    for (const name of fs.readdirSync(path.join(source, directory)).filter(name => name.endsWith('.csv'))) {
      fs.copyFileSync(path.join(source, directory, name), path.join(root, directory, name));
    }
  }
  for (const file of ['dashboard/company_categories.json', 'templates/candidate_profile.template.json', 'templates/application-progress.template.json']) {
    fs.copyFileSync(path.join(source, file), path.join(root, file));
  }
  return root;
}

test('empty public starter package passes', t => {
  assert.deepEqual(inspectPublicPackage(fixture(t)), []);
});

test('populated tracking data and classifications are rejected', t => {
  const root = fixture(t);
  const file = path.join(root, 'dashboard/job_pool.csv');
  const header = fs.readFileSync(file, 'utf8').trim().split(',');
  const row = header.map(() => 'fictional');
  fs.appendFileSync(file, row.join(',') + '\n');
  fs.writeFileSync(path.join(root, 'dashboard/company_categories.json'), JSON.stringify({ version: 1, companies: { 'Fictional Co': {} } }));
  const errors = inspectPublicPackage(root);
  assert.ok(errors.some(error => error.includes('starter table must contain only its header')));
  assert.ok(errors.some(error => error.includes('classification store must be empty')));
});

test('personalized templates and private files are rejected', t => {
  const root = fixture(t);
  const file = path.join(root, 'templates/candidate_profile.template.json');
  const profile = JSON.parse(fs.readFileSync(file, 'utf8'));
  profile.candidate.legal_name = 'Fictional Candidate';
  fs.writeFileSync(file, JSON.stringify(profile));
  fs.writeFileSync(path.join(root, 'candidate_profile.json'), '{}');
  const errors = inspectPublicPackage(root);
  assert.ok(errors.some(error => error.includes('identity/contact fields must be blank')));
  assert.ok(errors.some(error => error.includes('private or binary artifact')));
});

test('secret diagnostics contain labels but never the detected value', t => {
  const root = fixture(t);
  const fakeToken = 'ghp_' + 'x'.repeat(36);
  fs.writeFileSync(path.join(root, 'notes.md'), fakeToken);
  const errors = inspectPublicPackage(root);
  assert.ok(errors.some(error => error.includes('access token')));
  assert.ok(errors.every(error => !error.includes(fakeToken)));
});

test('mismatched template schemas are rejected', t => {
  const root = fixture(t);
  fs.appendFileSync(path.join(root, 'templates/dashboard-template/job_pool.csv'), 'unexpected_column\n');
  assert.ok(inspectPublicPackage(root).length > 0);
});

test('salary details and saved application evidence are rejected', t => {
  const root = fixture(t);
  const file = path.join(root, 'templates/candidate_profile.template.json');
  const profile = JSON.parse(fs.readFileSync(file, 'utf8'));
  profile.compensation.base_salary_range = 'fictional salary';
  fs.writeFileSync(file, JSON.stringify(profile));
  const progressFile = path.join(root, 'templates/application-progress.template.json');
  const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
  progress.outcome.confirmation_evidence = 'fictional confirmation';
  fs.writeFileSync(progressFile, JSON.stringify(progress));
  const errors = inspectPublicPackage(root);
  assert.ok(errors.some(error => error.includes('compensation fields must be blank')));
  assert.ok(errors.some(error => error.includes('populated progress or evidence')));
});
