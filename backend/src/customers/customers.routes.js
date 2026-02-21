const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin
router.use(authenticateToken);
router.use(authorize('admin'));

// List all customers (users with role customer)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, phone, full_name, created_at, updated_at
       FROM users WHERE role = 'customer' ORDER BY created_at DESC`
    );
    res.json({ customers: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const { username, password, email, phone, full_name } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, email, role, phone, full_name)
       VALUES ($1, $2, $3, 'customer', $4, $5)
       RETURNING id, username, email, phone, full_name, created_at`,
      [username, hashedPassword, email || null, phone || null, full_name || null]
    );
    res.status(201).json({ customer: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update customer
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, new_password } = req.body;

    const check = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [id, 'customer']
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${idx++}`);
      values.push(full_name);
    }
    if (email !== undefined) {
      updates.push(`email = $${idx++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${idx++}`);
      values.push(phone);
    }
    if (new_password && new_password.trim()) {
      const hashed = await bcrypt.hash(new_password.trim(), 10);
      updates.push(`password_hash = $${idx++}`);
      values.push(hashed);
    }

    if (updates.length === 0) {
      const current = await pool.query(
        'SELECT id, username, email, phone, full_name, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );
      return res.json({ customer: current.rows[0] });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, username, email, phone, full_name, created_at, updated_at`;
    const result = await pool.query(sql, values);
    res.json({ customer: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
