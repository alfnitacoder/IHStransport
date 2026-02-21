const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { authenticateToken, authorize } = require('./middleware/auth');
const pool = require('./config/database');
const authRoutes = require('./auth/auth.routes');
const cardsRoutes = require('./cards/cards.routes');
const paymentsRoutes = require('./payments/payments.routes');
const busesRoutes = require('./buses/buses.routes');
const busLocationRoutes = require('./buses/location.routes');
const ownersRoutes = require('./owners/owners.routes');
const customersRoutes = require('./customers/customers.routes');
const reportsRoutes = require('./reports/reports.routes');
const settingsRoutes = require('./settings/settings.routes');
const devicesRoutes = require('./devices/devices.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Normalize trailing slash so /api/cards/2/ matches /api/cards/2
app.use((req, res, next) => {
  if (req.path.endsWith('/') && req.path.length > 1) {
    req.url = req.path.slice(0, -1) + (req.url.slice(req.path.length) || '');
  }
  next();
});

// Log API requests (so we see what path/method actually hits the server)
app.use('/api', (req, res, next) => {
  console.log('[API]', req.method, req.originalUrl || req.url);
  next();
});

// Health check (includes PostgreSQL ping)
app.get('/health', async (req, res) => {
  const out = { status: 'ok', timestamp: new Date().toISOString() };
  try {
    await pool.query('SELECT 1');
    out.database = 'postgresql';
    out.db_ok = true;
  } catch (err) {
    out.database = 'postgresql';
    out.db_ok = false;
    out.db_error = err.message;
  }
  res.json(out);
});

// API root (avoids 404 when client hits GET /api with no path)
app.get('/api', (req, res) => {
  res.json({ api: 'IHStransport', version: '1.0', endpoints: ['/api/auth', '/api/cards', '/api/devices', '/api/customers', '/api/payments', '/api/buses', '/api/owners', '/api/reports', '/api/settings'] });
});

// PATCH /api/cards/:cardId — must be before app.use('/api/cards') so Express matches it first
app.route('/api/cards/:cardId').patch(authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { cardId } = req.params;
    const { customer_id, balance } = req.body;
    const check = await pool.query('SELECT id FROM cards WHERE id = $1', [cardId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    const updates = [];
    const values = [];
    let idx = 1;
    if (customer_id !== undefined) {
      updates.push(`customer_id = $${idx++}`);
      values.push(customer_id === '' || customer_id === null ? null : customer_id);
    }
    if (balance !== undefined) {
      updates.push(`balance = $${idx++}`);
      values.push(parseFloat(balance));
    }
    if (updates.length === 0) {
      const current = await pool.query(
        'SELECT c.*, u.full_name as customer_name FROM cards c LEFT JOIN users u ON c.customer_id = u.id WHERE c.id = $1',
        [cardId]
      );
      return res.json({ card: current.rows[0] });
    }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(cardId);
    const sql = `UPDATE cards SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    await pool.query(sql, values);
    const withName = await pool.query(
      'SELECT c.*, u.full_name as customer_name FROM cards c LEFT JOIN users u ON c.customer_id = u.id WHERE c.id = $1',
      [cardId]
    );
    res.json({ card: withName.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/payments', paymentsRoutes);
// Mount location routes first so /api/buses/locations/all is not caught by buses GET /:id
app.use('/api/buses', busLocationRoutes);
app.use('/api/buses', busesRoutes);
app.use('/api/owners', ownersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler (no matching route)
app.use((req, res) => {
  const path = `${req.method} ${req.originalUrl || req.url}`;
  console.warn('[404]', path);
  res.status(404).json({
    error: 'Route not found',
    path
  });
});

// Listen on all interfaces so NFC device on same network can connect (e.g. http://<this-machine-ip>:3001)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  const db = require('./config/database');
  if (db.isSqlite) {
    console.log('📂 Using SQLite (dev). First time? Run: npm run migrate:sqlite (from backend) for admin user + default fare.');
  } else {
    const dbHost = process.env.DB_HOST || 'localhost';
    console.log(`🐘 Using PostgreSQL at ${dbHost}. First time? Run: npm run migrate:pg (from backend) with DB_* set in .env`);
  }
  console.log(`📱 For validator app, use API URL: http://<this-machine-ip>:${PORT}`);
});

module.exports = app;
