#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/config/database');

async function main() {
  try {
    console.log('=== Buses and their owners (revenue goes to the owner) ===\n');
    const buses = await pool.query(
      `SELECT b.id, b.bus_number, b.device_id, b.bus_owner_id, bo.name as owner_name
       FROM buses b
       LEFT JOIN bus_owners bo ON b.bus_owner_id = bo.id
       ORDER BY b.id`
    );
    for (const row of buses.rows) {
      console.log(`Bus id=${row.id}  number="${row.bus_number}"  device_id=${row.device_id || '—'}  → Owner: ${row.owner_name || '—'} (bus_owner_id=${row.bus_owner_id})`);
    }

    console.log('\n=== Last 10 fare transactions (which bus → which owner gets revenue) ===\n');
    const tx = await pool.query(
      `SELECT t.id, t.bus_id, t.amount, t.created_at, b.bus_number, bo.name as owner_name
       FROM transactions t
       LEFT JOIN buses b ON t.bus_id = b.id
       LEFT JOIN bus_owners bo ON b.bus_owner_id = bo.id
       WHERE t.transaction_type = 'fare_payment' AND t.status = 'completed'
       ORDER BY t.created_at DESC LIMIT 10`
    );
    for (const row of tx.rows) {
      console.log(`  bus_id=${row.bus_id} (${row.bus_number || '?'})  amount=${row.amount}  → ${row.owner_name || '—'}  ${row.created_at}`);
    }

    console.log('\n→ To send revenue to Kasum: in Transport, Edit the vehicle that your device uses (Bus ID = BUS_ID in app), set Operator to Kasum, Save.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    if (pool.end) await pool.end();
  }
}

main();
