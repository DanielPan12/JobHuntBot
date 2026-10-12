const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { readCSVRows, createCSVStore } = require('../csv-store.js');

const root = path.resolve(__dirname, '..');
const frontendSource = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');

function frontendRows(text) {
  const start = frontendSource.indexOf('  function parseCSV(text)');
  const end = frontendSource.indexOf('  // ---------- data ----------', start);
  assert.ok(start >= 0 && end > start);
  const context = {};
  vm.createContext(context);
  vm.runInContext(frontendSource.slice(start, end), context);
  return context.parseCSV(text);
}

test('blank lines do not shift server job and follow-up indices', () => {
  const csv = 'company,job_title,status,current_stage\r\n' +
    '甲,"quoted, title",Submitted,"line one\nline two"\r\n\r\n' +
    '示例科技,示例岗位,Submitted,面试中\r\n\n';
  const backend = createCSVStore({ readFileSync: () => csv });
  const rows = backend.readCSVRows('fixture.csv').dataRows;
  const client = frontendRows(csv);
  assert.equal(rows.length, client.length);
  client.forEach((row, index) => {
    assert.equal(rows[index][0], row.company);
    assert.equal(rows[index][1], row.job_title);
  });
});

test('dashboard CSVs have identical browser/server logical row order', () => {
  for (const name of ['job_pool.csv', 'follow_up.csv']) {
    const file = path.join(root, name);
    const text = fs.readFileSync(file, 'utf8');
    const { header, dataRows } = readCSVRows(file);
    const client = frontendRows(text);
    assert.equal(dataRows.length, client.length, name);
    client.forEach((row, index) => header.forEach((col, colIndex) => {
      assert.equal(dataRows[index][colIndex] ?? '', row[col], name + ': ' + index + '/' + col);
    }));
  }
});
