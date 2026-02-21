/**
 * SQLite adapter that mimics pg Pool interface for development/testing.
 * Converts $1, $2, ... placeholders to ? and returns { rows }.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/development.sqlite');

// Ensure data directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(DB_PATH);

// Use WAL for better concurrency; enable foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Auto-initialize schema when DB has no tables (dev convenience)
const tableCount = db.prepare("SELECT count(*) as n FROM sqlite_master WHERE type='table'").get();
if (tableCount && tableCount.n === 0) {
  const schemaPath = path.join(__dirname, '../../../database/schema.sqlite.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('[SQLite] Schema applied (first run)');
  }
}

/**
 * Convert pg-style $1, $2, ... placeholders to ? and return [sql, params] in correct order.
 */
function convertPlaceholders(sql, params) {
  if (!params || params.length === 0) return [sql, []];
  const order = [];
  const re = /\$(\d+)/g;
  let m;
  while ((m = re.exec(sql)) !== null) order.push(parseInt(m[1], 10));
  const uniq = [...new Set(order)];
  let outSql = sql;
  for (const n of uniq) {
    const reN = new RegExp('\\$' + n + '\\b', 'g');
    outSql = outSql.replace(reN, '?');
  }
  // Preserve order of appearance so repeated placeholders get correct param count (e.g. fare UID match)
  const outParams = order.map((n) => params[n - 1]);
  return [outSql, outParams];
}

/**
 * Run a single query. Returns Promise<{ rows }> to match pg.
 */
function query(sql, params = []) {
  return Promise.resolve().then(() => {
    const [convertedSql, convertedParams] = convertPlaceholders(sql, params);
    const stmt = db.prepare(convertedSql);
    const returnsRows = /RETURNING|^\s*(SELECT|WITH)\s/i.test(convertedSql.trim());
    if (returnsRows) {
      const rows = stmt.all(...convertedParams);
      return { rows };
    }
    stmt.run(...convertedParams);
    return { rows: [] };
  });
}

/**
 * Run multiple statements (e.g. schema file). No placeholder conversion.
 */
function exec(sql) {
  db.exec(sql);
}

const pool = {
  query,
  exec,
  db,
  isSqlite: true,
  close() {
    if (db && typeof db.close === 'function') db.close();
  }
};

// pg Pool has on('error') - no-op for sqlite
pool.on = () => pool;

console.log('[SQLite] Dev database:', DB_PATH);

module.exports = pool;
