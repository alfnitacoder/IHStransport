require('dotenv').config();

// Dev mode: use SQLite unless DB_TYPE is explicitly set to postgres/pg
const useSqlite =
  process.env.DB_TYPE === 'sqlite' ||
  (process.env.NODE_ENV !== 'production' && process.env.DB_TYPE !== 'pg' && process.env.DB_TYPE !== 'postgres');

if (useSqlite) {
  module.exports = require('./sqlite-adapter');
  return;
}

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bus_cashless',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
