const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');
const mycashEnv = require('../config/mycash');
const { getMycashConfig } = require('../config/mycash-loader');
const mycashService = require('../payments/mycash.service');

const router = express.Router();

const MYCASH_KEYS = ['apiUrl', 'apiKey', 'username', 'password', 'merchantMobile', 'productId'];

function maskSecret(str, showLast = 4) {
  if (!str || str.length <= showLast) return str ? '••••' : '';
  return '••••' + str.slice(-showLast);
}

// MyCash API connection status (admin only) – must be before GET /mycash
router.get('/mycash/status', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const config = await getMycashConfig();
    const merchantMobile = config.merchantMobile || mycashEnv.merchantMobile || '67810000041';
    await mycashService.paymentRequest(
      'STATUS-TEST-' + Date.now(),
      '0.01',
      merchantMobile,
      'Connection test'
    );
    return res.json({ connected: true, message: 'MyCash API is reachable and credentials accepted.' });
  } catch (error) {
    const code = error.mycashCode != null ? error.mycashCode : (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' ? 'network' : null);
    const message = error.message || 'Could not reach MyCash API';
    return res.json({
      connected: false,
      code,
      message,
      mycash_status: error.mycashStatus || null
    });
  }
});

// Get MyCash settings (admin only) – returns masked secrets
router.get('/mycash', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT key, value FROM system_settings WHERE key = ANY($1)",
      [MYCASH_KEYS.map(k => 'mycash_' + k)]
    );
    const fromDb = {};
    result.rows.forEach(r => {
      fromDb[r.key.replace('mycash_', '')] = r.value;
    });

    const apiUrl = fromDb.apiUrl ?? mycashEnv.apiUrl ?? '';
    const apiKey = fromDb.apiKey != null ? maskSecret(fromDb.apiKey) : (mycashEnv.apiKey ? maskSecret(mycashEnv.apiKey) : '');
    const username = fromDb.username ?? mycashEnv.username ?? '';
    const password = fromDb.password != null ? '••••••••' : (mycashEnv.password ? '••••••••' : '');
    const merchantMobile = fromDb.merchantMobile ?? mycashEnv.merchantMobile ?? '';
    const productId = fromDb.productId ?? mycashEnv.productId ?? '';

    res.json({
      apiUrl,
      apiKey,
      username,
      password,
      merchantMobile,
      productId
    });
  } catch (error) {
    console.error('GET settings/mycash error:', error);
    res.status(500).json({ error: 'Failed to load MyCash settings' });
  }
});

// Update MyCash settings (admin only) – only updates provided fields
router.put('/mycash', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { apiUrl, apiKey, username, password, merchantMobile, productId } = req.body;
    const updates = [];

    if (apiUrl !== undefined) updates.push({ key: 'mycash_apiUrl', value: String(apiUrl).trim() });
    if (apiKey !== undefined && String(apiKey).trim() !== '') updates.push({ key: 'mycash_apiKey', value: String(apiKey).trim() });
    if (username !== undefined) updates.push({ key: 'mycash_username', value: String(username).trim() });
    if (password !== undefined && String(password).trim() !== '') updates.push({ key: 'mycash_password', value: String(password).trim() });
    if (merchantMobile !== undefined) updates.push({ key: 'mycash_merchantMobile', value: String(merchantMobile).trim() });
    if (productId !== undefined) updates.push({ key: 'mycash_productId', value: String(productId).trim() });

    for (const u of updates) {
      await pool.query(
        `INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        [u.key, u.value]
      );
    }

    res.json({ success: true, message: 'MyCash settings updated' });
  } catch (error) {
    console.error('PUT settings/mycash error:', error);
    res.status(500).json({ error: 'Failed to update MyCash settings' });
  }
});

module.exports = router;
