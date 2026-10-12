const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'dashboard.html'), 'utf8');
const start = html.indexOf('  function parseCSV(text)');
const end = html.indexOf('  // ---------- data ----------', start);
const context = vm.createContext({});
vm.runInContext(html.slice(start, end), context);

test('browser rejects malformed CSV instead of displaying partial records or incorrect counts', () => {
  for (const source of [
    'company,status\nAcme,"Submitted',
    'company,status\nAcme,Sub"mitted\n',
    'company,status\nAcme,"Submitted"extra\n',
    'company,status\nAcme\n',
    'company,status\nAcme,Submitted,extra\n',
    'company,company\nAcme,Submitted\n',
    'company,status\ncompany,status\n',
  ]) assert.throws(() => context.parseCSV(source), /CSV/);
  const rows = context.parseCSV('\uFEFFcompany,notes\r\nAcme,"multi\nline, ""quote"""\r\n\r\n');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].company, 'Acme');
  assert.equal(rows[0].notes, 'multi\nline, "quote"');
});
