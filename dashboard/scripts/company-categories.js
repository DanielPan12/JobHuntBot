// Company-level categories are maintained by the discovery agent, not guessed
// from company names. This CLI propagates historical labels and validates coverage.
const fs = require('node:fs');
const path = require('node:path');
const { companyKey, categoryNames } = require('../dashboard-model.js');
const root = path.resolve(__dirname, '..');
const registryPath = path.join(root, 'company_categories.json');

function parseCSV(text) {
  const { parseCSV: parseRows, validateRows } = require('../csv-store.js');
  const records = parseRows(text);
  const header = records.shift();
  const rows = records.filter(row => !(row.length === 1 && row[0] === ''));
  validateRows(header, rows);
  return rows.map(row => Object.fromEntries(header.map((column, index) => [column, row[index]])));
}

function readJobs() { return parseCSV(fs.readFileSync(path.join(root, 'job_pool.csv'), 'utf8')); }
function readRegistry() {
  return fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, 'utf8')) : { version: 1, companies: {} };
}
function writeRegistry(registry) {
  registry.companies = Object.fromEntries(Object.entries(registry.companies).sort(([a], [b]) => a.localeCompare(b, 'zh-CN')));
  const temp = registryPath + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(registry, null, 2) + '\n');
  fs.renameSync(temp, registryPath);
}
function checkCoverage(jobs, registry) {
  const missing = [], invalid = [];
  const names = new Map(jobs.map(row => [companyKey(row.company), row.company]));
  for (const [key, company] of names) {
    const entry = registry.companies[key];
    if (!entry) missing.push(company);
    else if (!categoryNames.includes(entry.category) || !entry.reason || !entry.updated_on ||
      !Array.isArray(entry.evidence) || !entry.evidence.length ||
      !['existing', 'recommended', 'user'].includes(entry.basis) || companyKey(entry.company) !== key) invalid.push(company);
  }
  return { companies: names.size, rows: jobs.length, missing, invalid };
}

if (require.main === module) {
  try {
    const [command, inputFile] = process.argv.slice(2);
    const registry = readRegistry();
    if (command === '--set') {
      // JSON input avoids shell-quoting ambiguity in explanations and evidence.
      const entry = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
      const key = companyKey(entry.company);
      if (!key || !categoryNames.includes(entry.category) || !entry.reason || !entry.updated_on ||
        !Array.isArray(entry.evidence) || !entry.evidence.length ||
        !['recommended', 'user'].includes(entry.basis)) throw new Error('Entry needs company, category, reason, updated_on, evidence and basis (recommended/user)');
      const current = registry.companies[key];
      if (current && current.category !== entry.category && entry.basis !== 'user') {
        throw new Error('Changing an existing category requires a user-confirmed entry; recommendations do not override it');
      }
      if (current && current.basis !== 'recommended' && entry.basis === 'recommended') {
        throw new Error('Preserve the existing classification provenance');
      }
      registry.companies[key] = entry;
      writeRegistry(registry);
    } else if (command !== '--check') {
      throw new Error('Usage: node company-categories.js --check | --set entry.json');
    }
    const result = checkCoverage(readJobs(), registry);
    console.log(JSON.stringify(result, null, 2));
    if (result.missing.length || result.invalid.length) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { parseCSV, readJobs, readRegistry, writeRegistry, checkCoverage };
