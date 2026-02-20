const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics (admin only)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const stats = {};

    // Admin dashboard
    if (req.user.role === 'admin') {
      // Total cards
      const cardsResult = await pool.query('SELECT COUNT(*) as count FROM cards');
      stats.total_cards = parseInt(cardsResult.rows[0].count);

      // Active cards
      const activeCardsResult = await pool.query("SELECT COUNT(*) as count FROM cards WHERE status = 'active'");
      stats.active_cards = parseInt(activeCardsResult.rows[0].count);

      // Total vehicles (buses, planes, ships)
      const busesResult = await pool.query('SELECT COUNT(*) as count FROM buses');
      stats.total_buses = parseInt(busesResult.rows[0].count);
      try {
        const byTypeResult = await pool.query(
          "SELECT transport_type, COUNT(*) as count FROM buses GROUP BY transport_type"
        );
        stats.vehicles_by_type = (byTypeResult.rows || []).reduce((acc, r) => {
          acc[r.transport_type || 'bus'] = parseInt(r.count);
          return acc;
        }, { bus: 0, plane: 0, ship: 0 });
      } catch (e) {
        stats.vehicles_by_type = { bus: stats.total_buses, plane: 0, ship: 0 };
      }

      // Total operators (bus owners)
      const ownersResult = await pool.query('SELECT COUNT(*) as count FROM bus_owners');
      stats.total_owners = parseInt(ownersResult.rows[0].count);

      // Total transactions today
      const todayTransactionsResult = await pool.query(
        "SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM transactions WHERE DATE(created_at) = CURRENT_DATE AND transaction_type = 'fare_payment'"
      );
      stats.today_transactions = parseInt(todayTransactionsResult.rows[0].count);
      stats.today_revenue = parseFloat(todayTransactionsResult.rows[0].total);

      // Total revenue (all time)
      const totalRevenueResult = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE transaction_type = 'fare_payment' AND status = 'completed'"
      );
      stats.total_revenue = parseFloat(totalRevenueResult.rows[0].total);

      // Pending MyCash transactions
      const pendingMyCashResult = await pool.query(
        "SELECT COUNT(*) as count FROM mycash_transactions WHERE status IN ('pending', 'otp_sent')"
      );
      stats.pending_mycash_transactions = parseInt(pendingMyCashResult.rows[0].count);
    }
    // Bus owner dashboard
    else if (req.user.role === 'bus_owner') {
      // Get bus owner ID
      const ownerResult = await pool.query('SELECT id FROM bus_owners WHERE user_id = $1', [req.user.id]);
      if (ownerResult.rows.length === 0) {
        // Bus owner registered but no record yet - return empty stats
        return res.json({ 
          stats: {
            total_buses: 0,
            active_buses: 0,
            today_transactions: 0,
            today_revenue: 0,
            month_revenue: 0,
            total_revenue: 0,
            pending_settlement: 0,
            message: 'Please contact administrator to complete your bus owner setup'
          }
        });
      }
      const ownerId = ownerResult.rows[0].id;

      // Total buses owned
      const busesResult = await pool.query('SELECT COUNT(*) as count FROM buses WHERE bus_owner_id = $1', [ownerId]);
      stats.total_buses = parseInt(busesResult.rows[0].count);

      // Active buses
      const activeBusesResult = await pool.query("SELECT COUNT(*) as count FROM buses WHERE bus_owner_id = $1 AND status = 'active'", [ownerId]);
      stats.active_buses = parseInt(activeBusesResult.rows[0].count);

      // Today's transactions
      const todayTransactionsResult = await pool.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(t.amount), 0) as total 
         FROM transactions t
         INNER JOIN buses b ON t.bus_id = b.id
         WHERE b.bus_owner_id = $1 AND DATE(t.created_at) = CURRENT_DATE AND t.transaction_type = 'fare_payment' AND t.status = 'completed'`,
        [ownerId]
      );
      stats.today_transactions = parseInt(todayTransactionsResult.rows[0].count);
      stats.today_revenue = parseFloat(todayTransactionsResult.rows[0].total);

      // Total revenue (all time)
      const totalRevenueResult = await pool.query(
        `SELECT COALESCE(SUM(t.amount), 0) as total 
         FROM transactions t
         INNER JOIN buses b ON t.bus_id = b.id
         WHERE b.bus_owner_id = $1 AND t.transaction_type = 'fare_payment' AND t.status = 'completed'`,
        [ownerId]
      );
      stats.total_revenue = parseFloat(totalRevenueResult.rows[0].total);

      // This month's revenue
      const monthRevenueResult = await pool.query(
        `SELECT COALESCE(SUM(t.amount), 0) as total 
         FROM transactions t
         INNER JOIN buses b ON t.bus_id = b.id
         WHERE b.bus_owner_id = $1 AND t.transaction_type = 'fare_payment' AND t.status = 'completed' 
         AND DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)`,
        [ownerId]
      );
      stats.month_revenue = parseFloat(monthRevenueResult.rows[0].total);

      // Pending settlement
      const ownerInfoResult = await pool.query('SELECT pending_settlement FROM bus_owners WHERE id = $1', [ownerId]);
      stats.pending_settlement = parseFloat(ownerInfoResult.rows[0]?.pending_settlement || 0);
    }
    // Agent dashboard
    else if (req.user.role === 'agent') {
      // Total cards issued by this agent
      const cardsResult = await pool.query('SELECT COUNT(*) as count FROM cards WHERE issued_by = $1', [req.user.id]);
      stats.total_cards = parseInt(cardsResult.rows[0].count);

      // Active cards issued
      const activeCardsResult = await pool.query("SELECT COUNT(*) as count FROM cards WHERE issued_by = $1 AND status = 'active'", [req.user.id]);
      stats.active_cards = parseInt(activeCardsResult.rows[0].count);
    }

    res.json({ stats });
  } catch (error) {
    const status = 500;
    res.status(status).json({ error: error.message || 'Internal server error', status });
  }
});

// Get transaction report
router.get('/transactions', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { start_date, end_date, transaction_type, limit = 1000 } = req.query;

    let query = `
      SELECT 
        t.*,
        c.card_uid,
        b.bus_number,
        bo.name as bus_owner_name
      FROM transactions t
      LEFT JOIN cards c ON t.card_id = c.id
      LEFT JOIN buses b ON t.bus_id = b.id
      LEFT JOIN bus_owners bo ON b.bus_owner_id = bo.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND t.created_at >= $${paramCount++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND t.created_at <= $${paramCount++}`;
      params.push(end_date);
    }
    if (transaction_type) {
      query += ` AND t.transaction_type = $${paramCount++}`;
      params.push(transaction_type);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramCount++}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json({ transactions: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get MyCash transactions report
router.get('/mycash', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { start_date, end_date, status, limit = 1000 } = req.query;

    let query = `
      SELECT 
        mt.*,
        c.card_uid
      FROM mycash_transactions mt
      LEFT JOIN cards c ON mt.card_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND mt.created_at >= $${paramCount++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND mt.created_at <= $${paramCount++}`;
      params.push(end_date);
    }
    if (status) {
      query += ` AND mt.status = $${paramCount++}`;
      params.push(status);
    }

    query += ` ORDER BY mt.created_at DESC LIMIT $${paramCount++}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json({ transactions: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
