#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/config/database');

async function main() {
  try {
    const r = await pool.query('SELECT 1 AS ok');
    console.log('✅ Database connection OK');
    console.log('   Host:', process.env.DB_HOST || 'localhost', '| DB:', process.env.DB_NAME || 'bus_cashless');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  } finally {
    if (pool.end) await pool.end();
    else if (pool.close) pool.close();
  }
}

main();
