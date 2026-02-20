const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const mycashService = require('./mycash.service');

const router = express.Router();

// Initiate MyCash top-up
router.post('/topup/initiate', authenticateToken, async (req, res) => {
  try {
    const { card_id, amount, customer_mobile } = req.body;

    if (!card_id || !amount || !customer_mobile) {
      return res.status(400).json({ error: 'Card ID, amount, and customer mobile are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Check if card exists
    const cardResult = await pool.query('SELECT * FROM cards WHERE id = $1', [card_id]);
    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const orderId = `TOPUP-${uuidv4()}`;

    // Create MyCash transaction record
    const transactionResult = await pool.query(
      'INSERT INTO mycash_transactions (order_id, card_id, customer_mobile, amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [orderId, card_id, customer_mobile, amount, 'pending']
    );

    // Initiate payment request with MyCash
    const paymentRequest = await mycashService.paymentRequest(
      orderId,
      amount,
      customer_mobile,
      `Top-up card ${cardResult.rows[0].card_uid}`
    );

    // Update transaction with request_id
    await pool.query(
      'UPDATE mycash_transactions SET request_id = $1 WHERE order_id = $2',
      [paymentRequest.requestId, orderId]
    );

    res.json({
      order_id: orderId,
      request_id: paymentRequest.requestId,
      message: 'Payment request created. Please send OTP to complete the transaction.'
    });
  } catch (error) {
    const status = 500;
    res.status(status).json({
      error: error.message,
      status,
      mycash_code: error.mycashCode ?? null,
      mycash_status: error.mycashStatus ?? null
    });
  }
});

// Send OTP for MyCash payment
router.post('/topup/send-otp', authenticateToken, async (req, res) => {
  try {
    const { request_id } = req.body;

    if (!request_id) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    // Get transaction
    const transactionResult = await pool.query(
      'SELECT * FROM mycash_transactions WHERE request_id = $1',
      [request_id]
    );

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionResult.rows[0];

    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Transaction is not in pending status' });
    }

    // Send OTP via MyCash
    const otpResponse = await mycashService.sendOTP(request_id);

    // Update transaction status
    await pool.query(
      'UPDATE mycash_transactions SET status = $1, otp_sent_at = CURRENT_TIMESTAMP WHERE request_id = $2',
      ['otp_sent', request_id]
    );

    res.json({
      message: 'OTP sent successfully to customer mobile',
      request_id
    });
  } catch (error) {
    const status = 500;
    res.status(status).json({
      error: error.message,
      status,
      mycash_code: error.mycashCode ?? null,
      mycash_status: error.mycashStatus ?? null
    });
  }
});

// Approve MyCash payment with OTP
router.post('/topup/approve', authenticateToken, async (req, res) => {
  try {
    const { request_id, otp } = req.body;

    if (!request_id || !otp) {
      return res.status(400).json({ error: 'Request ID and OTP are required' });
    }

    // Get transaction
    const transactionResult = await pool.query(
      'SELECT * FROM mycash_transactions WHERE request_id = $1',
      [request_id]
    );

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionResult.rows[0];

    if (transaction.status !== 'otp_sent') {
      return res.status(400).json({ error: 'OTP must be sent first' });
    }

    // Approve payment with MyCash
    const approvalResponse = await mycashService.approvePayment(request_id, otp);

    if (approvalResponse.status === 'approved') {
      // Update card balance
      await pool.query('BEGIN');
      
      try {
        // Get current balance
        const cardResult = await pool.query('SELECT balance FROM cards WHERE id = $1', [transaction.card_id]);
        const currentBalance = parseFloat(cardResult.rows[0].balance);
        const newBalance = currentBalance + parseFloat(transaction.amount);

        // Update card balance
        await pool.query(
          'UPDATE cards SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newBalance, transaction.card_id]
        );

        // Create transaction record
        await pool.query(
          'INSERT INTO transactions (card_id, amount, fare_amount, balance_before, balance_after, transaction_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [transaction.card_id, transaction.amount, 0, currentBalance, newBalance, 'top_up', 'completed']
        );

        // Update MyCash transaction
        await pool.query(
          'UPDATE mycash_transactions SET status = $1, transaction_id = $2, reference_number = $3, approved_at = CURRENT_TIMESTAMP WHERE request_id = $4',
          ['approved', approvalResponse.transactionId, approvalResponse.referenceNumber, request_id]
        );

        await pool.query('COMMIT');

        res.json({
          message: 'Payment approved and card topped up successfully',
          transaction_id: approvalResponse.transactionId,
          reference_number: approvalResponse.referenceNumber,
          new_balance: newBalance
        });
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } else {
      // Payment failed
      await pool.query(
        'UPDATE mycash_transactions SET status = $1, error_message = $2 WHERE request_id = $3',
        ['failed', approvalResponse.message || 'Payment approval failed', request_id]
      );

      res.status(400).json({ error: 'Payment approval failed', details: approvalResponse });
    }
  } catch (error) {
    const status = 500;
    res.status(status).json({
      error: error.message,
      status,
      mycash_code: error.mycashCode ?? null,
      mycash_status: error.mycashStatus ?? null
    });
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { card_id, bus_id, limit = 100 } = req.query;
    let query = 'SELECT t.*, c.card_uid, b.bus_number FROM transactions t LEFT JOIN cards c ON t.card_id = c.id LEFT JOIN buses b ON t.bus_id = b.id WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (card_id) {
      query += ` AND t.card_id = $${paramCount++}`;
      params.push(card_id);
    }

    if (bus_id) {
      query += ` AND t.bus_id = $${paramCount++}`;
      params.push(bus_id);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramCount++}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json({ transactions: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process bus fare payment (for NFC devices)
router.post('/fare', async (req, res) => {
  try {
    const { 
      card_uid, 
      bus_id, 
      fare_amount, 
      device_timestamp,
      latitude,
      longitude,
      location_accuracy
    } = req.body;

    if (!card_uid || !bus_id || !fare_amount) {
      return res.status(400).json({ error: 'Card UID, bus ID, and fare amount are required' });
    }

    await pool.query('BEGIN');

    try {
      // Get card
      const cardResult = await pool.query('SELECT * FROM cards WHERE card_uid = $1', [card_uid]);
      if (cardResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ error: 'Card not found' });
      }

      const card = cardResult.rows[0];

      if (card.status !== 'active') {
        await pool.query('ROLLBACK');
        return res.status(400).json({ error: `Card is ${card.status}` });
      }

      if (parseFloat(card.balance) < parseFloat(fare_amount)) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      const balanceBefore = parseFloat(card.balance);
      const balanceAfter = balanceBefore - parseFloat(fare_amount);

      // Update card balance
      await pool.query(
        'UPDATE cards SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [balanceAfter, card.id]
      );

      // Create transaction with GPS coordinates
      const transactionResult = await pool.query(
        `INSERT INTO transactions (
          card_id, bus_id, amount, fare_amount, balance_before, balance_after, 
          transaction_type, status, device_timestamp, synced_at,
          latitude, longitude, location_accuracy
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10, $11, $12) RETURNING *`,
        [
          card.id, bus_id, fare_amount, fare_amount, balanceBefore, balanceAfter, 
          'fare_payment', 'completed', device_timestamp || new Date(),
          latitude || null, longitude || null, location_accuracy || null
        ]
      );

      // Update bus location if GPS coordinates provided
      if (latitude && longitude) {
        await pool.query(
          `UPDATE buses 
           SET last_latitude = $1, last_longitude = $2, last_location_update = CURRENT_TIMESTAMP 
           WHERE id = $3`,
          [latitude, longitude, bus_id]
        );

        // Record location history
        await pool.query(
          `INSERT INTO bus_locations (bus_id, latitude, longitude, accuracy, recorded_at) 
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [bus_id, latitude, longitude, location_accuracy || null]
        );
      }

      await pool.query('COMMIT');

      res.json({
        success: true,
        transaction: transactionResult.rows[0],
        new_balance: balanceAfter
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
