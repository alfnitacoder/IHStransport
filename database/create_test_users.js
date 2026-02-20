// This script should be run from the project root
// Usage: node database/create_test_users.js

const path = require('path');
const fs = require('fs');

// Change to backend directory to resolve modules
process.chdir(path.join(__dirname, '..', 'backend'));

const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

async function createTestUsers() {
  try {
    console.log('Creating test users...');

    // Create bus owner user
    const ownerPassword = await bcrypt.hash('owner123', 10);
    const ownerCheck = await pool.query('SELECT id FROM users WHERE username = $1', ['busowner']);
    
    let ownerUserId;
    if (ownerCheck.rows.length === 0) {
      const ownerResult = await pool.query(
        'INSERT INTO users (username, password_hash, role, full_name, email, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        ['busowner', ownerPassword, 'bus_owner', 'Bus Owner Test', 'owner@example.com', '555-0100']
      );
      ownerUserId = ownerResult.rows[0].id;
      console.log('✅ Bus owner user created (username: busowner, password: owner123)');
    } else {
      ownerUserId = ownerCheck.rows[0].id;
      console.log('ℹ️  Bus owner user already exists');
    }

    // Create bus owner record
    const ownerRecordCheck = await pool.query('SELECT id FROM bus_owners WHERE user_id = $1', [ownerUserId]);
    if (ownerRecordCheck.rows.length === 0) {
      await pool.query(
        'INSERT INTO bus_owners (user_id, name, phone, settlement_method, bank_account) VALUES ($1, $2, $3, $4, $5)',
        [ownerUserId, 'Bus Owner Test', '555-0100', 'bank_transfer', 'ACC123456']
      );
      console.log('✅ Bus owner record created');
    }

    // Create customer user
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customerCheck = await pool.query('SELECT id FROM users WHERE username = $1', ['customer']);
    
    if (customerCheck.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (username, password_hash, role, full_name, email, phone) VALUES ($1, $2, $3, $4, $5, $6)',
        ['customer', customerPassword, 'customer', 'Customer Test', 'customer@example.com', '555-0200']
      );
      console.log('✅ Customer user created (username: customer, password: customer123)');
    } else {
      console.log('ℹ️  Customer user already exists');
    }

    // Create agent user
    const agentPassword = await bcrypt.hash('agent123', 10);
    const agentCheck = await pool.query('SELECT id FROM users WHERE username = $1', ['agent']);
    
    if (agentCheck.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (username, password_hash, role, full_name, email, phone) VALUES ($1, $2, $3, $4, $5, $6)',
        ['agent', agentPassword, 'agent', 'Agent Test', 'agent@example.com', '555-0300']
      );
      console.log('✅ Agent user created (username: agent, password: agent123)');
    } else {
      console.log('ℹ️  Agent user already exists');
    }

    console.log('\n📋 Test Users Created:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:     admin / admin123');
    console.log('Bus Owner: busowner / owner123');
    console.log('Customer:  customer / customer123');
    console.log('Agent:     agent / agent123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create test users:', error);
    process.exit(1);
  }
}

createTestUsers();
