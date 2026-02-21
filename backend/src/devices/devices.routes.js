const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// --- Public: NFC app registers when online (no auth) ---
// POST /api/devices/register { device_id or validator_id }
router.post('/register', async (req, res) => {
  try {
    const deviceId = (req.body.device_id || req.body.validator_id || '').trim();
    console.log('[devices/register]', deviceId || '(empty)');
    if (!deviceId) {
      return res.status(400).json({ error: 'device_id or validator_id is required' });
    }

    const existing = await pool.query('SELECT id, device_id, status FROM nfc_devices WHERE device_id = $1', [deviceId]);
    const now = new Date().toISOString();

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE nfc_devices SET last_seen_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [now, existing.rows[0].id]
      );
      const updated = await pool.query(
        `SELECT d.*, bo.name as owner_name, b.bus_number, b.route_name FROM nfc_devices d
         LEFT JOIN bus_owners bo ON d.bus_owner_id = bo.id LEFT JOIN buses b ON d.bus_id = b.id WHERE d.id = $1`,
        [existing.rows[0].id]
      );
      return res.json({ device: updated.rows[0], created: false });
    }

    const result = await pool.query(
      `INSERT INTO nfc_devices (device_id, status, last_seen_at) VALUES ($1, 'unassigned', $2) RETURNING *`,
      [deviceId, now]
    );
    res.status(201).json({ device: result.rows[0], created: true });
  } catch (error) {
    if (error.message && error.message.includes('last_seen_at')) {
      // Old DB without last_seen_at: insert/update without it
      const deviceId = (req.body.device_id || req.body.validator_id || '').trim();
      if (!deviceId) return res.status(400).json({ error: 'device_id or validator_id is required' });
      const existing = await pool.query('SELECT id FROM nfc_devices WHERE device_id = $1', [deviceId]);
      if (existing.rows.length > 0) {
        const updated = await pool.query('SELECT * FROM nfc_devices WHERE id = $1', [existing.rows[0].id]);
        return res.json({ device: updated.rows[0], created: false });
      }
      const result = await pool.query(
        `INSERT INTO nfc_devices (device_id, status) VALUES ($1, 'unassigned') RETURNING *`,
        [deviceId]
      );
      return res.status(201).json({ device: result.rows[0], created: true });
    }
    if (error.code === '23505' || error.message.includes('UNIQUE')) {
      return res.status(200).json({ error: 'Device already registered' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get all NFC devices (admin: all; bus_owner: only their devices)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT d.*, bo.name as owner_name,
        b.bus_number, b.route_name, b.transport_type
      FROM nfc_devices d
      LEFT JOIN bus_owners bo ON d.bus_owner_id = bo.id
      LEFT JOIN buses b ON d.bus_id = b.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (req.user.role === 'bus_owner') {
      const ownerResult = await pool.query('SELECT id FROM bus_owners WHERE user_id = $1', [req.user.id]);
      if (ownerResult.rows.length === 0) {
        return res.json({ devices: [] });
      }
      query += ` AND d.bus_owner_id = $${paramCount++}`;
      params.push(ownerResult.rows[0].id);
    }

    query += ' ORDER BY d.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ devices: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create NFC device (admin only)
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { device_id, label } = req.body;
    if (!device_id || !device_id.trim()) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    const result = await pool.query(
      `INSERT INTO nfc_devices (device_id, label, status)
       VALUES ($1, $2, 'unassigned')
       RETURNING *`,
      [device_id.trim(), (label && label.trim()) || null]
    );
    res.status(201).json({ device: result.rows[0] });
  } catch (error) {
    if (error.code === '23505' || error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Device ID already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update device: assign to operator and/or bus (admin only)
router.patch('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { bus_owner_id, bus_id, label, status } = req.body;

    const current = await pool.query('SELECT * FROM nfc_devices WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    const device = current.rows[0];
    const deviceIdStr = device.device_id;

    // If clearing bus assignment, clear bus.device_id for the bus that had this device
    if (bus_id === null || bus_id === '') {
      await pool.query(
        "UPDATE buses SET device_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE device_id = $1",
        [deviceIdStr]
      );
    }

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (bus_owner_id !== undefined) {
      updates.push(`bus_owner_id = $${paramCount++}`);
      params.push(bus_owner_id === '' || bus_owner_id === null ? null : bus_owner_id);
    }
    if (bus_id !== undefined) {
      updates.push(`bus_id = $${paramCount++}`);
      params.push(bus_id === '' || bus_id === null ? null : bus_id);
    }
    if (label !== undefined) {
      updates.push(`label = $${paramCount++}`);
      params.push(label === '' ? null : label);
    }
    if (status !== undefined && ['active', 'inactive', 'unassigned'].includes(status)) {
      updates.push(`status = $${paramCount++}`);
      params.push(status);
    }

    if (updates.length === 0) {
      const withJoins = await pool.query(
        `SELECT d.*, bo.name as owner_name, b.bus_number, b.route_name, b.transport_type
         FROM nfc_devices d
         LEFT JOIN bus_owners bo ON d.bus_owner_id = bo.id
         LEFT JOIN buses b ON d.bus_id = b.id
         WHERE d.id = $1`,
        [id]
      );
      return res.json({ device: withJoins.rows[0] });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await pool.query(
      `UPDATE nfc_devices SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    // Sync bus.device_id: if device is assigned to a bus, set that bus's device_id
    const updated = await pool.query('SELECT * FROM nfc_devices WHERE id = $1', [id]);
    const next = updated.rows[0];
    if (next.bus_id) {
      await pool.query(
        'UPDATE buses SET device_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [deviceIdStr, next.bus_id]
      );
      // Clear device_id from any other bus that had it
      await pool.query(
        "UPDATE buses SET device_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id != $1 AND device_id = $2",
        [next.bus_id, deviceIdStr]
      );
    }

    const withJoins = await pool.query(
      `SELECT d.*, bo.name as owner_name, b.bus_number, b.route_name, b.transport_type
       FROM nfc_devices d
       LEFT JOIN bus_owners bo ON d.bus_owner_id = bo.id
       LEFT JOIN buses b ON d.bus_id = b.id
       WHERE d.id = $1`,
      [id]
    );
    res.json({ device: withJoins.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete device (admin only)
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const device = await pool.query('SELECT device_id, bus_id FROM nfc_devices WHERE id = $1', [id]);
    if (device.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    await pool.query("UPDATE buses SET device_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE device_id = $1", [device.rows[0].device_id]);
    await pool.query('DELETE FROM nfc_devices WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
