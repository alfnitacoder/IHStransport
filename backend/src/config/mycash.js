require('dotenv').config();

module.exports = {
  apiUrl: process.env.MYCASH_API_URL || 'https://www.gifts.digicelpacific.com/mycash',
  apiKey: process.env.MYCASH_API_KEY,
  username: process.env.MYCASH_USERNAME,
  password: process.env.MYCASH_PASSWORD,
  merchantMobile: process.env.MYCASH_MERCHANT_MOBILE,
  productId: process.env.MYCASH_PRODUCT_ID || '373'
};
