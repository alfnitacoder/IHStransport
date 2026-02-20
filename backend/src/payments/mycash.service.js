const axios = require('axios');
const { getMycashConfig } = require('../config/mycash-loader');
const { parseMycashError, MYCASH_ERROR_CODES } = require('./mycash-errors');

class MyCashService {
  async paymentRequest(orderId, amount, customerMobile, description) {
    const config = await getMycashConfig();
    try {
      const response = await axios.post(
        `${config.apiUrl}/paymentRequest`,
        {
          orderId,
          amount: amount.toString(),
          customerMobile,
          description: description || 'Card Top-Up',
          merchantMobile: config.merchantMobile,
          ...(config.productId && { productId: config.productId })
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          auth: {
            username: config.username,
            password: config.password
          }
        }
      );

      return response.data;
    } catch (error) {
      const parsed = parseMycashError(error);
      console.error('MyCash paymentRequest error:', error.response?.data || error.message);
      const err = new Error(parsed.message);
      err.mycashCode = parsed.code;
      err.mycashStatus = MYCASH_ERROR_CODES[parsed.code] || parsed.description;
      throw err;
    }
  }

  async sendOTP(requestId) {
    const config = await getMycashConfig();
    try {
      const response = await axios.post(
        `${config.apiUrl}/sendOTP`,
        {
          requestId
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          auth: {
            username: config.username,
            password: config.password
          }
        }
      );

      return response.data;
    } catch (error) {
      const parsed = parseMycashError(error);
      console.error('MyCash sendOTP error:', error.response?.data || error.message);
      const err = new Error(parsed.message);
      err.mycashCode = parsed.code;
      err.mycashStatus = MYCASH_ERROR_CODES[parsed.code] || parsed.description;
      throw err;
    }
  }

  async approvePayment(requestId, otp) {
    const config = await getMycashConfig();
    try {
      const response = await axios.post(
        `${config.apiUrl}/approvePayment`,
        {
          requestId,
          otp
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          auth: {
            username: config.username,
            password: config.password
          }
        }
      );

      return response.data;
    } catch (error) {
      const parsed = parseMycashError(error);
      console.error('MyCash approvePayment error:', error.response?.data || error.message);
      const err = new Error(parsed.message);
      err.mycashCode = parsed.code;
      err.mycashStatus = MYCASH_ERROR_CODES[parsed.code] || parsed.description;
      throw err;
    }
  }
}

module.exports = new MyCashService();
