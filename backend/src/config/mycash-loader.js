const pool = require('./database');
const envConfig = require('./mycash');

const KEY_PREFIX = 'mycash_';
const KEYS = ['apiUrl', 'apiKey', 'username', 'password', 'merchantMobile', 'productId'];

/**
 * Get MyCash config: DB overrides env. Used by mycash.service for every request.
 */
async function getMycashConfig() {
  try {
    const result = await pool.query(
      "SELECT key, value FROM system_settings WHERE key = ANY($1)",
      [KEYS.map(k => KEY_PREFIX + k)]
    );
    const fromDb = {};
    result.rows.forEach(r => {
      fromDb[r.key.replace(KEY_PREFIX, '')] = r.value;
    });

    return {
      apiUrl: fromDb.apiUrl ?? envConfig.apiUrl ?? 'https://www.gifts.digicelpacific.com/mycash',
      apiKey: fromDb.apiKey ?? envConfig.apiKey,
      username: fromDb.username ?? envConfig.username,
      password: fromDb.password ?? envConfig.password,
      merchantMobile: fromDb.merchantMobile ?? envConfig.merchantMobile,
      productId: fromDb.productId ?? envConfig.productId ?? '373'
    };
  } catch (err) {
    console.error('getMycashConfig error:', err.message);
    return { ...envConfig };
  }
}

module.exports = { getMycashConfig };
