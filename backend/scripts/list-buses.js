#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/config/database');

async function main() {
  const fixBus1 = process.argv.includes('--fix-bus-1');
  try {
    const r = await pool.query(
      'SELECT id, bus_number, route_name, transport_type, device_id, status FROM buses ORDER BY id'
    );
    console.log('Buses in database:', r.rows.length);
    if (r.rows.length === 0) {
      const seed = process.argv.includes('--seed-one');
      if (seed) {
        const owners = await pool.query('SELECT id FROM bus_owners LIMIT 1');
        if (owners.rows.length === 0) {
          console.log('No bus_owners. Run: node database/create_test_users.js (from project root)');
          process.exit(1);
        }
        await pool.query(
          `INSERT INTO buses (bus_owner_id, bus_number, transport_type, status) VALUES ($1, $2, $3, $4)`,
          [owners.rows[0].id, 'DEV-001', 'bus', 'active']
        );
        const one = await pool.query('SELECT id, bus_number, status FROM buses ORDER BY id LIMIT 1');
        console.log('Created bus:', one.rows[0], '\nSet BUS_ID=' + one.rows[0].id + ' in the validator app.');
      } else {
        console.log('\nNo buses found. Add a vehicle in the web app: Fleet → Add vehicle.');
        console.log('Or run: node scripts/list-buses.js --seed-one (creates one dev bus).');
      }
      process.exit(0);
      return;
    }
    r.rows.forEach((b) => {
      const mark = b.status !== 'active' ? ' (inactive – fare will reject)' : '';
      console.log('  id:', b.id, '|', b.bus_number, '| status:', b.status, '| device_id:', b.device_id || '(none)', mark);
    });

    const bus1 = r.rows.find((b) => b.id === 1);
    if (!bus1) {
      console.log('\nNo bus with id=1. Either:');
      console.log('  – Use one of the IDs above as BUS_ID in the validator app, or');
      console.log('  – Add a new vehicle in Fleet; if the table was empty before, it may get id=1.');
    } else if (bus1.status !== 'active') {
      if (fixBus1) {
        await pool.query("UPDATE buses SET status = 'active' WHERE id = 1");
        console.log('\nUpdated bus id=1 to status=active. Try tapping again.');
      } else {
        console.log('\nBus id=1 exists but is not active. Run: node scripts/list-buses.js --fix-bus-1');
      }
    } else {
      console.log('\nBus id=1 is active. If the validator still rejects, check BUS_ID in the app matches 1.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    if (pool.end) await pool.end();
  }
}

main();
