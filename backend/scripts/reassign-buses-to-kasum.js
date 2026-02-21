#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/config/database');

async function main() {
  try {
    const fromName = 'Bus Owner Test';
    const toName = 'Kasum';

    const fromOwner = await pool.query('SELECT id, name FROM bus_owners WHERE name = $1', [fromName]);
    const toOwner = await pool.query('SELECT id, name FROM bus_owners WHERE name = $1', [toName]);

    if (fromOwner.rows.length === 0) {
      console.log('No operator named "' + fromName + '" found.');
      process.exit(1);
    }
    if (toOwner.rows.length === 0) {
      console.log('No operator named "' + toName + '" found.');
      process.exit(1);
    }

    const fromId = fromOwner.rows[0].id;
    const toId = toOwner.rows[0].id;

    const buses = await pool.query('SELECT id, bus_number FROM buses WHERE bus_owner_id = $1', [fromId]);
    if (buses.rows.length === 0) {
      console.log('No buses owned by "' + fromName + '". Nothing to reassign.');
      process.exit(0);
    }

    console.log('Reassigning', buses.rows.length, 'vehicle(s) from', fromName, 'to', toName, '...');
    await pool.query('UPDATE buses SET bus_owner_id = $1, updated_at = CURRENT_TIMESTAMP WHERE bus_owner_id = $2', [toId, fromId]);
    await pool.query('UPDATE nfc_devices SET bus_owner_id = $1, updated_at = CURRENT_TIMESTAMP WHERE bus_owner_id = $2', [toId, fromId]);

    console.log('Done. Vehicles now owned by', toName + ':');
    for (const b of buses.rows) {
      console.log('  - id=' + b.id + ' ' + b.bus_number);
    }
    console.log('Revenue for these vehicles will now show under', toName + '.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    if (pool.end) await pool.end();
  }
}

main();
