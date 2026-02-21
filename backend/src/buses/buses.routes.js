const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all buses
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT b.*, bo.name as owner_name, bo.phone as owner_phone FROM buses b LEFT JOIN bus_owners bo ON b.bus_owner_id = bo.id WHERE 1=1';
    const params = [];
    let paramCount = 1;

    // Bus owners can only see their own buses
    if (req.user.role === 'bus_owner') {
      const ownerResult = await pool.query('SELECT id FROM bus_owners WHERE user_id = $1', [req.user.id]);
      if (ownerResult.rows.length > 0) {
        query += ` AND b.bus_owner_id = $${paramCount++}`;
        params.push(ownerResult.rows[0].id);
      } else {
        return res.json({ buses: [] });
      }
    }

    query += ' ORDER BY b.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ buses: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bus by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT b.*, bo.name as owner_name FROM buses b LEFT JOIN bus_owners bo ON b.bus_owner_id = bo.id WHERE b.id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    res.json({ bus: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new vehicle (admin picks operator; bus_owner uses self)
router.post('/', authenticateToken, authorize('admin', 'bus_owner'), async (req, res) => {
  try {
    const { bus_owner_id: bodyOwnerId, bus_number, transport_type, route_name, device_id } = req.body;
    const type = ['bus', 'plane', 'ship'].includes(transport_type) ? transport_type : 'bus';

    let bus_owner_id;
    if (req.user.role === 'bus_owner') {
      const ownerResult = await pool.query('SELECT id FROM bus_owners WHERE user_id = $1', [req.user.id]);
      if (ownerResult.rows.length === 0) {
        return res.status(403).json({ error: 'Operator record not found. Contact admin.' });
      }
      bus_owner_id = ownerResult.rows[0].id;
    } else {
      if (!bodyOwnerId) {
        return res.status(400).json({ error: 'Owner ID and vehicle number are required' });
      }
      bus_owner_id = bodyOwnerId;
    }

    if (!bus_number) {
      return res.status(400).json({ error: 'Vehicle number is required' });
    }

    const result = await pool.query(
      'INSERT INTO buses (bus_owner_id, bus_number, transport_type, route_name, device_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [bus_owner_id, bus_number, type, route_name || null, device_id || null, 'active']
    );
    const newBus = result.rows[0];

    if (device_id && newBus.id) {
      await pool.query(
        'UPDATE nfc_devices SET bus_id = $1, bus_owner_id = $2, updated_at = CURRENT_TIMESTAMP WHERE device_id = $3',
        [newBus.id, bus_owner_id, device_id]
      );
    }

    res.status(201).json({ bus: newBus });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Bus number or device ID already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update vehicle (admin: any; bus_owner: own only)
router.patch('/:id', authenticateToken, authorize('admin', 'bus_owner'), async (req, res) => {
  try {
    const { id } = req.params;
    const { bus_number, transport_type, route_name, device_id, status, bus_owner_id: bodyBusOwnerId } = req.body;

    if (req.user.role === 'bus_owner') {
      const ownerResult = await pool.query('SELECT id FROM bus_owners WHERE user_id = $1', [req.user.id]);
      if (ownerResult.rows.length === 0) {
        return res.status(403).json({ error: 'Operator record not found.' });
      }
      const ownCheck = await pool.query(
        'SELECT id FROM buses WHERE id = $1 AND bus_owner_id = $2',
        [id, ownerResult.rows[0].id]
      );
      if (ownCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Bus not found' });
      }
    }

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (bus_number !== undefined) {
      updates.push(`bus_number = $${paramCount++}`);
      params.push(bus_number);
    }
    if (req.user.role === 'admin' && bodyBusOwnerId !== undefined) {
      updates.push(`bus_owner_id = $${paramCount++}`);
      params.push(bodyBusOwnerId || null);
    }
    if (transport_type !== undefined && ['bus', 'plane', 'ship'].includes(transport_type)) {
      updates.push(`transport_type = $${paramCount++}`);
      params.push(transport_type);
    }
    if (route_name !== undefined) {
      updates.push(`route_name = $${paramCount++}`);
      params.push(route_name);
    }
    if (device_id !== undefined) {
      updates.push(`device_id = $${paramCount++}`);
      params.push(device_id);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    if (device_id !== undefined) {
      const current = await pool.query('SELECT device_id, bus_owner_id FROM buses WHERE id = $1', [id]);
      if (current.rows.length > 0) {
        const oldDeviceId = current.rows[0].device_id;
        const bus_owner_id = current.rows[0].bus_owner_id;
        if (oldDeviceId) {
          await pool.query(
            'UPDATE nfc_devices SET bus_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE device_id = $1',
            [oldDeviceId]
          );
        }
        if (device_id) {
          await pool.query(
            'UPDATE nfc_devices SET bus_id = $1, bus_owner_id = $2, updated_at = CURRENT_TIMESTAMP WHERE device_id = $3',
            [id, bus_owner_id, device_id]
          );
        }
      }
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await pool.query(
      `UPDATE buses SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    if (req.user.role === 'admin' && bodyBusOwnerId !== undefined) {
      await pool.query(
        'UPDATE nfc_devices SET bus_owner_id = $1, updated_at = CURRENT_TIMESTAMP WHERE bus_id = $2',
        [bodyBusOwnerId || null, id]
      );
    }

    res.json({ bus: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bus revenue statistics
router.get('/:id/revenue', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(amount), 0) as total_revenue,
        DATE(created_at) as date
      FROM transactions 
      WHERE bus_id = $1 AND transaction_type = 'fare_payment' AND status = 'completed'
    `;
    const params = [id];
    let paramCount = 2;

    if (start_date) {
      query += ` AND created_at >= $${paramCount++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND created_at <= $${paramCount++}`;
      params.push(end_date);
    }

    query += ' GROUP BY DATE(created_at) ORDER BY date DESC';

    const result = await pool.query(query, params);
    res.json({ revenue: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
