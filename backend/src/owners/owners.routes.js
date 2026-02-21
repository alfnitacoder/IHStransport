const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all bus owners (admin); or own operator only (bus_owner, for device assign dropdown)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'bus_owner') {
      const result = await pool.query(
        'SELECT bo.*, u.username, u.email FROM bus_owners bo LEFT JOIN users u ON bo.user_id = u.id WHERE bo.user_id = $1',
        [req.user.id]
      );
      return res.json({ owners: result.rows });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const result = await pool.query(
      `SELECT bo.*, u.username, u.email,
        (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
         INNER JOIN buses b ON t.bus_id = b.id
         WHERE b.bus_owner_id = bo.id AND t.transaction_type = 'fare_payment' AND t.status = 'completed') AS total_revenue
       FROM bus_owners bo
       LEFT JOIN users u ON bo.user_id = u.id
       ORDER BY bo.created_at DESC`
    );
    res.json({ owners: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get users who signed up as bus_owner but have no operator (bus_owners) record yet
router.get('/pending', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.created_at
       FROM users u
       LEFT JOIN bus_owners bo ON bo.user_id = u.id
       WHERE u.role = 'bus_owner' AND bo.id IS NULL
       ORDER BY u.created_at DESC`
    );
    res.json({ pending: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bus owner by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Bus owners can only see their own data
    if (req.user.role === 'bus_owner') {
      const ownerCheck = await pool.query('SELECT id FROM bus_owners WHERE user_id = $1', [req.user.id]);
      if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].id.toString() !== id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const result = await pool.query(
      'SELECT bo.*, u.username, u.email FROM bus_owners bo LEFT JOIN users u ON bo.user_id = u.id WHERE bo.id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bus owner not found' });
    }

    res.json({ owner: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create bus owner (admin only)
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { user_id, name, phone, settlement_method, bank_account } = req.body;

    if (!user_id || !name || !phone) {
      return res.status(400).json({ error: 'User ID, name, and phone are required' });
    }

    const result = await pool.query(
      'INSERT INTO bus_owners (user_id, name, phone, settlement_method, bank_account) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, name, phone, settlement_method || 'bank_transfer', bank_account || null]
    );

    res.status(201).json({ owner: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update bus owner
router.patch('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, settlement_method, bank_account } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      params.push(name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      params.push(phone);
    }
    if (settlement_method !== undefined) {
      updates.push(`settlement_method = $${paramCount++}`);
      params.push(settlement_method);
    }
    if (bank_account !== undefined) {
      updates.push(`bank_account = $${paramCount++}`);
      params.push(bank_account);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await pool.query(
      `UPDATE bus_owners SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bus owner not found' });
    }

    res.json({ owner: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bus owner revenue summary
router.get('/:id/revenue', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    // Check access
    if (req.user.role === 'bus_owner') {
      const ownerCheck = await pool.query('SELECT id FROM bus_owners WHERE user_id = $1', [req.user.id]);
      if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].id.toString() !== id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(t.amount), 0) as total_revenue,
        COUNT(DISTINCT t.bus_id) as total_buses
      FROM transactions t
      INNER JOIN buses b ON t.bus_id = b.id
      WHERE b.bus_owner_id = $1 AND t.transaction_type = 'fare_payment' AND t.status = 'completed'
    `;
    const params = [id];
    let paramCount = 2;

    if (start_date) {
      query += ` AND t.created_at >= $${paramCount++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND t.created_at <= $${paramCount++}`;
      params.push(end_date);
    }

    const result = await pool.query(query, params);
    res.json({ revenue: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
