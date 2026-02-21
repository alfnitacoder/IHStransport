#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/config/database');

const cardUid = process.argv[2] || '250E8B1B08';
const initialBalance = parseFloat(process.argv[3]) || 0;

async function main() {
  try {
    const uid = String(cardUid).trim().replace(/[^0-9A-Fa-f]/g, '').toUpperCase() || cardUid;
    const existing = await pool.query('SELECT id, card_uid, balance, status FROM cards WHERE card_uid = $1 OR UPPER(REPLACE(REPLACE(REPLACE(card_uid, \':\', \'\'), \' \', \'\'), \'-\', \'\')) = $2', [uid, uid]);
    if (existing.rows.length > 0) {
      console.log('Card already registered:', existing.rows[0].card_uid, '| balance:', existing.rows[0].balance, '| status:', existing.rows[0].status);
      process.exit(0);
      return;
    }
    const admin = await pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
    const issuedBy = admin.rows.length > 0 ? admin.rows[0].id : null;
    await pool.query(
      'INSERT INTO cards (card_uid, balance, status, issued_by) VALUES ($1, $2, $3, $4)',
      [uid, initialBalance, 'active', issuedBy]
    );
    console.log('✅ Card registered:', uid, '| balance:', initialBalance, '| status: active');
    process.exit(0);
  } catch (err) {
    if (err.code === '23505' || err.message.includes('UNIQUE')) {
      console.log('Card already exists with this UID.');
      process.exit(0);
      return;
    }
    console.error('❌', err.message);
    process.exit(1);
  } finally {
    if (pool.end) await pool.end();
    else if (pool.close) pool.close();
  }
}

main();
