const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseCSV, createCSVStore, readCSVRows, writeCSVFiles } = require('../csv-store.js');
const { temporaryDirectory } = require('./test-helpers.js');

test('strict CSV supports BOM, escaped quotes and multiline fields, and rejects damaged records', () => {
  assert.deepEqual(parseCSV('\uFEFFcompany,notes\r\n"甲","line1\nline2, ""quoted"""\r\n'),
    [['company', 'notes'], ['甲', 'line1\nline2, "quoted"']]);
  for (const csv of ['a,b\n"unfinished,b', 'a,b\n"closed"tail,b', 'a,b\nunquoted"quote,b']) {
    assert.throws(() => parseCSV(csv), /CSV/);
  }
  for (const csv of ['', 'a,a\n1,2', 'a,b\n1', 'a,b\na,b']) {
    const store = createCSVStore({ readFileSync: () => csv });
    assert.throws(() => store.readCSVRows('fixture.csv'), /CSV/);
  }
});

test('snapshot conflicts preserve external changes without truncation', t => {
  const root = temporaryDirectory(t), filePath = path.join(root, 'table.csv');
  fs.writeFileSync(filePath, 'a,b\n1,2\n');
  const table = readCSVRows(filePath);
  table.dataRows[0][1] = 'mine';
  const external = 'a,b\n1,external\n';
  fs.writeFileSync(filePath, external);
  assert.throws(() => writeCSVFiles([table]), error => error.httpStatus === 409);
  assert.equal(fs.readFileSync(filePath, 'utf8'), external);
  assert.deepEqual(fs.readdirSync(root), ['table.csv']);
});

test('a staging failure leaves all originals intact', t => {
  const root = temporaryDirectory(t), a = path.join(root, 'a.csv'), b = path.join(root, 'b.csv');
  fs.writeFileSync(a, 'a,b\n1,2\n'); fs.writeFileSync(b, 'a,b\n3,4\n');
  const tables = [a, b].map(readCSVRows);
  tables.forEach(table => { table.dataRows[0][1] = 'new'; });
  const store = createCSVStore({ ...fs, writeFileSync(file, ...args) {
    if (file.startsWith(b) && file.endsWith('.tmp')) throw new Error('Disk full');
    return fs.writeFileSync(file, ...args);
  } });
  assert.throws(() => store.writeCSVFiles(tables), /Disk full/);
  for (const table of tables) assert.equal(fs.readFileSync(table.filePath, 'utf8'), table.source);
  assert.deepEqual(fs.readdirSync(root), ['a.csv', 'b.csv']);
});

test('failed rollback keeps a named original backup and reports incomplete recovery', t => {
  const root = temporaryDirectory(t), a = path.join(root, 'a.csv'), b = path.join(root, 'b.csv');
  fs.writeFileSync(a, 'a,b\n1,2\n'); fs.writeFileSync(b, 'a,b\n3,4\n');
  const tables = [a, b].map(readCSVRows);
  tables.forEach(table => { table.dataRows[0][1] = 'new'; });
  const store = createCSVStore({ ...fs, renameSync(from, to) {
    if (to === b || from.endsWith('.bak')) throw new Error('File locked');
    return fs.renameSync(from, to);
  } });
  let failure;
  try { store.writeCSVFiles(tables); } catch (error) { failure = error; }
  assert.equal(failure.httpStatus, 500);
  assert.match(failure.message, /manual recovery/);
  assert.equal(failure.recoveryFiles.length, 1);
  assert.equal(fs.readFileSync(failure.recoveryFiles[0], 'utf8'), tables[0].source);
  assert.equal(fs.readFileSync(b, 'utf8'), tables[1].source);
});
