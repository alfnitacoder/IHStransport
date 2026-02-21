#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'development.sqlite');

if (!fs.existsSync(DB_PATH)) {
  console.error('SQLite database not found at:', DB_PATH);
  console.error('Run from backend: npm run migrate:sqlite (to create DB), then npm run cards:sqlite');
  process.exit(1);
}

const Database = require('better-sqlite3');
const db = new Database(DB_PATH, { readonly: true });

try {
  const rows = db.prepare(`
    SELECT c.id, c.card_uid, c.balance, c.status, c.customer_id, c.created_at,
           u.full_name AS customer_name
    FROM cards c
    LEFT JOIN users u ON c.customer_id = u.id
    ORDER BY c.id
  `).all();

  console.log('Available cards in SQLite (' + DB_PATH + '):\n');
  if (rows.length === 0) {
    console.log('  (no cards)');
  } else {
    console.log('  id  | card_uid (last 8) | balance  | status  | customer');
    console.log('  ' + '-'.repeat(70));
    for (const r of rows) {
      const uid = (r.card_uid || '').slice(-8);
      const cust = (r.customer_name || (r.customer_id ? '#' + r.customer_id : '-'));
      console.log('  ' + [r.id, uid.padEnd(16), (r.balance != null ? r.balance.toFixed(2) : '-').padEnd(8), (r.status || '-').padEnd(8), cust].join(' | '));
    }
    console.log('\n  Total: ' + rows.length + ' card(s)');
  }
} finally {
  db.close();
}
