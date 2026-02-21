#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/config/database');

async function main() {
  try {
    // Buses with GPS set (what the transport map shows)
    const buses = await pool.query(`
      SELECT id, bus_number, route_name, last_latitude, last_longitude, last_location_update
      FROM buses
      WHERE last_latitude IS NOT NULL AND last_longitude IS NOT NULL
      ORDER BY last_location_update DESC NULLS LAST
    `);
    console.log('Buses with location (Fleet Location Map):', buses.rows.length);
    buses.rows.forEach((b) => {
      const at = b.last_location_update ? new Date(b.last_location_update).toISOString() : 'never';
      console.log('  bus_id=%s %s | %.6f, %.6f | updated %s', b.id, b.bus_number || '', b.last_latitude, b.last_longitude, at);
    });

    // Recent bus_locations rows (last 20)
    const recent = await pool.query(`
      SELECT bl.bus_id, b.bus_number, bl.latitude, bl.longitude, bl.accuracy, bl.recorded_at
      FROM bus_locations bl
      LEFT JOIN buses b ON b.id = bl.bus_id
      ORDER BY bl.recorded_at DESC
      LIMIT 20
    `);
    console.log('\nRecent location rows (last 20):', recent.rows.length);
    recent.rows.forEach((r) => {
      const at = r.recorded_at ? new Date(r.recorded_at).toISOString() : '';
      console.log('  bus_id=%s %s | %.6f, %.6f | %s', r.bus_id, r.bus_number || '', r.latitude, r.longitude, at);
    });

    if (buses.rows.length === 0 && recent.rows.length === 0) {
      console.log('\nNo location data yet. Ensure the NFC app is sending POST /api/devices/location');
      console.log('and the device is registered and assigned to a bus. Check server logs for [NFC location].');
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  process.exit(0);
}

main();
