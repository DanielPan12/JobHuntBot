// Strict CSV reads and recoverable, atomic replacements for dashboard mutations.
// Agent-side editors should use this helper as well: uncoordinated external
// writers cannot be fully locked by a local HTTP server.
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');

function parseCSV(text) {
  text = String(text).replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', quoted = false, closed = false, started = false;
  const finishField = () => { row.push(field); field = ''; closed = false; started = false; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === ',') finishField();
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      finishField(); rows.push(row); row = [];
    } else if (closed) throw new Error('CSV has text after a closing quote');
    else if (c === '"') {
      if (started) throw new Error('CSV has a quote inside an unquoted field');
      quoted = true; started = true;
    } else { field += c; started = true; }
  }
  if (quoted) throw new Error('CSV has an unterminated quoted field');
  if (started || closed || row.length) { finishField(); rows.push(row); }
  return rows;
}

function validateRows(header, dataRows) {
  if (!Array.isArray(header) || !header.length || header.some(name => !name.trim())) {
    throw new Error('CSV needs a non-empty header');
  }
  if (new Set(header).size !== header.length) throw new Error('CSV contains duplicate column names');
  dataRows.forEach((row, index) => {
    if (row.length !== header.length) {
      throw new Error(`CSV record ${index + 2} has ${row.length} columns; expected ${header.length}`);
    }
    if (row.every((value, column) => value === header[column])) {
      throw new Error(`CSV record ${index + 2} repeats the header`);
    }
  });
}

function stringifyCSV(rows) {
  return rows.map(row => row.map(value => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(','))
    .join('\r\n') + '\r\n';
}

function createCSVStore(io = fs) {
  function readCSVRows(filePath) {
    const source = io.readFileSync(filePath, 'utf8');
    const rows = parseCSV(source);
    const header = rows.shift();
    // Keep the browser's logical indices: physical blank lines are not records.
    const dataRows = rows.filter(row => !(row.length === 1 && row[0] === ''));
    validateRows(header, dataRows);
    return { filePath, header, dataRows, source };
  }

  function writeCSVFiles(files) {
    if (new Set(files.map(file => file.filePath)).size !== files.length) {
      throw new Error('A CSV transaction cannot contain the same file twice');
    }
    const prepared = [];
    let failure;
    try {
      for (const file of files) {
        validateRows(file.header, file.dataRows);
        if (typeof file.source !== 'string') throw new Error('CSV write needs its original source snapshot');
        const entry = { ...file, content: stringifyCSV([file.header, ...file.dataRows]), committed: false };
        const suffix = '.' + randomUUID();
        entry.tempPath = file.filePath + suffix + '.tmp';
        entry.backupPath = file.filePath + suffix + '.bak';
        prepared.push(entry);
        io.writeFileSync(entry.tempPath, entry.content, { encoding: 'utf8', flag: 'wx' });
        io.writeFileSync(entry.backupPath, entry.source, { encoding: 'utf8', flag: 'wx' });
      }
      const assertUnchanged = entry => {
        if (io.readFileSync(entry.filePath, 'utf8') !== entry.source) {
          const error = new Error('Dashboard data changed during this edit; refresh and try again');
          error.httpStatus = 409;
          throw error;
        }
      };
      prepared.forEach(assertUnchanged);
      for (const entry of prepared) {
        assertUnchanged(entry);
        io.renameSync(entry.tempPath, entry.filePath);
        entry.committed = true;
      }
    } catch (error) {
      failure = error;
      const recoveryFiles = [];
      for (const entry of [...prepared].reverse()) {
        if (!entry.committed) continue;
        try {
          // Do not roll back over a newer edit made outside this process.
          if (io.readFileSync(entry.filePath, 'utf8') !== entry.content) {
            throw new Error('File changed after commit');
          }
          io.renameSync(entry.backupPath, entry.filePath);
        } catch (_) { entry.keepBackup = true; recoveryFiles.push(entry.backupPath); }
      }
      if (recoveryFiles.length) {
        failure = new Error('CSV write failed and rollback needs manual recovery. Original snapshots: ' + recoveryFiles.join(', '));
        failure.httpStatus = 500;
        failure.recoveryFiles = recoveryFiles;
      }
    } finally {
      for (const entry of prepared) {
        for (const file of [entry.tempPath, ...(entry.keepBackup ? [] : [entry.backupPath])]) {
          try { io.unlinkSync(file); } catch (_) { /* Absent or locked cleanup files do not change commit success. */ }
        }
      }
    }
    if (failure) throw failure;
  }
  return { readCSVRows, writeCSVFiles };
}

module.exports = { parseCSV, stringifyCSV, validateRows, createCSVStore, ...createCSVStore() };
