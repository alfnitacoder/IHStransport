const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all cards
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, customer_id } = req.query;
    let query = 'SELECT c.*, u.full_name as customer_name FROM cards c LEFT JOIN users u ON c.customer_id = u.id WHERE 1=1';
    const params = [];
    let paramCount = 1;

    // Customers can only see their own cards
    if (req.user.role === 'customer') {
      query += ` AND c.customer_id = $${paramCount++}`;
      params.push(req.user.id);
    } else {
      // Admin and agents can filter by status and customer_id
      if (status) {
        query += ` AND c.status = $${paramCount++}`;
        params.push(status);
      }

      if (customer_id) {
        query += ` AND c.customer_id = $${paramCount++}`;
        params.push(customer_id);
      }
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ cards: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get card by UID
router.get('/:cardUid', authenticateToken, async (req, res) => {
  try {
    const { cardUid } = req.params;
    
    const result = await pool.query(
      'SELECT c.*, u.full_name as customer_name FROM cards c LEFT JOIN users u ON c.customer_id = u.id WHERE c.card_uid = $1',
      [cardUid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ card: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new card (admin/agent only)
router.post('/', authenticateToken, authorize('admin', 'agent'), async (req, res) => {
  try {
    const { card_uid, customer_id, initial_balance } = req.body;

    if (!card_uid) {
      return res.status(400).json({ error: 'Card UID is required' });
    }

    const balance = initial_balance || 0;

    const result = await pool.query(
      'INSERT INTO cards (card_uid, balance, customer_id, issued_by, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [card_uid, balance, customer_id || null, req.user.id, 'active']
    );

    res.status(201).json({ card: result.rows[0] });
  } catch (error) {
    // PostgreSQL: 23505 = unique_violation; SQLite: message contains 'UNIQUE'
    if (error.code === '23505' || (error.message && error.message.includes('UNIQUE'))) {
      return res.status(400).json({ error: 'Card UID already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update card balance
router.patch('/:cardId/balance', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { cardId } = req.params;
    const { balance } = req.body;

    if (balance === undefined) {
      return res.status(400).json({ error: 'Balance is required' });
    }

    const result = await pool.query(
      'UPDATE cards SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [balance, cardId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ card: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update card: assign customer and/or set balance (admin only)
router.patch('/:cardId', authenticateToken, authorize('admin'), async (req, res) => {
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
    const result = await pool.query(sql, values);
    const withName = await pool.query(
      'SELECT c.*, u.full_name as customer_name FROM cards c LEFT JOIN users u ON c.customer_id = u.id WHERE c.id = $1',
      [cardId]
    );
    res.json({ card: withName.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update card status
router.patch('/:cardId/status', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { cardId } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'blocked', 'expired', 'lost'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    const result = await pool.query(
      'UPDATE cards SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, cardId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ card: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
