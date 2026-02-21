#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/config/database');

async function main() {
  try {
    const r = await pool.query(
      "SELECT id, card_uid, balance, status, UPPER(TRIM(REPLACE(REPLACE(REPLACE(card_uid, ':', ''), ' ', ''), '-', ''))) as normalized FROM cards ORDER BY id"
    );
    console.log('Cards in database:', r.rows.length);
    r.rows.forEach((c) => {
      console.log('  id:', c.id, '| card_uid:', JSON.stringify(c.card_uid), '| normalized:', c.normalized, '| balance:', c.balance, '| status:', c.status);
    });
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    if (pool.end) await pool.end();
  }
}

main();
