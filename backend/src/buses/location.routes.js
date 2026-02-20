const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Update bus location (for GPS-enabled devices)
router.post('/:id/location', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy, speed, heading } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Check if bus exists and user has access
    const busResult = await pool.query(
      'SELECT b.*, bo.user_id as owner_user_id FROM buses b LEFT JOIN bus_owners bo ON b.bus_owner_id = bo.id WHERE b.id = $1',
      [id]
    );

    if (busResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    const bus = busResult.rows[0];

    // Bus owners can only update their own buses
    if (req.user.role === 'bus_owner' && bus.owner_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('BEGIN');

    try {
      // Update bus current location
      await pool.query(
        `UPDATE buses 
         SET last_latitude = $1, last_longitude = $2, last_location_update = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [latitude, longitude, id]
      );

      // Record location history
      await pool.query(
        `INSERT INTO bus_locations (bus_id, latitude, longitude, accuracy, speed, heading, recorded_at) 
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [id, latitude, longitude, accuracy || null, speed || null, heading || null]
      );

      await pool.query('COMMIT');

      res.json({
        success: true,
        message: 'Bus location updated',
        location: { latitude, longitude, accuracy, speed, heading }
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bus current location
router.get('/:id/location', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, bus_number, last_latitude, last_longitude, last_location_update FROM buses WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    const bus = result.rows[0];

    // Bus owners can only see their own buses
    if (req.user.role === 'bus_owner') {
      const ownerCheck = await pool.query(
        'SELECT bo.id FROM bus_owners bo INNER JOIN buses b ON b.bus_owner_id = bo.id WHERE b.id = $1 AND bo.user_id = $2',
        [id, req.user.id]
      );
      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ location: bus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bus location history
router.get('/:id/location/history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, limit = 100 } = req.query;

    // Check access
    const busResult = await pool.query(
      'SELECT b.*, bo.user_id as owner_user_id FROM buses b LEFT JOIN bus_owners bo ON b.bus_owner_id = bo.id WHERE b.id = $1',
      [id]
    );

    if (busResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    const bus = busResult.rows[0];

    if (req.user.role === 'bus_owner' && bus.owner_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = `
      SELECT * FROM bus_locations 
      WHERE bus_id = $1
    `;
    const params = [id];
    let paramCount = 2;

    if (start_date) {
      query += ` AND recorded_at >= $${paramCount++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND recorded_at <= $${paramCount++}`;
      params.push(end_date);
    }

    query += ` ORDER BY recorded_at DESC LIMIT $${paramCount++}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json({ locations: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all buses with current locations (for map view)
router.get('/locations/all', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        b.id,
        b.bus_number,
        b.route_name,
        b.status,
        b.last_latitude,
        b.last_longitude,
        b.last_location_update,
        bo.name as owner_name
      FROM buses b
      LEFT JOIN bus_owners bo ON b.bus_owner_id = bo.id
      WHERE b.last_latitude IS NOT NULL AND b.last_longitude IS NOT NULL
    `;
    const params = [];

    // Bus owners can only see their own buses
    if (req.user.role === 'bus_owner') {
      const ownerResult = await pool.query('SELECT id FROM bus_owners WHERE user_id = $1', [req.user.id]);
      if (ownerResult.rows.length > 0) {
        query += ` AND b.bus_owner_id = $1`;
        params.push(ownerResult.rows[0].id);
      } else {
        return res.json({ buses: [] });
      }
    }

    query += ' ORDER BY b.last_location_update DESC';

    const result = await pool.query(query, params);
    res.json({ buses: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
