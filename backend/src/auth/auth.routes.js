const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, role, phone, full_name } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    const allowedRoles = ['customer', 'bus_owner'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Only Customer and Bus Owner signup is allowed.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash, email, role, phone, full_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, role, email',
      [username, hashedPassword, email, role, phone, full_name]
    );

    const newUser = result.rows[0];

    // When signing up as operator (bus_owner), create a bus_owners row so they show in Operators list
    if (role === 'bus_owner' && newUser.id) {
      const ownerName = (full_name && full_name.trim()) || username;
      const ownerPhone = (phone && phone.trim()) || '—';
      await pool.query(
        'INSERT INTO bus_owners (user_id, name, phone, settlement_method) VALUES ($1, $2, $3, $4)',
        [newUser.id, ownerName, ownerPhone, 'bank_transfer']
      );
    }

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, phone, full_name, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
