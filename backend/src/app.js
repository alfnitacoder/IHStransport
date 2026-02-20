const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./auth/auth.routes');
const cardsRoutes = require('./cards/cards.routes');
const paymentsRoutes = require('./payments/payments.routes');
const busesRoutes = require('./buses/buses.routes');
const busLocationRoutes = require('./buses/location.routes');
const ownersRoutes = require('./owners/owners.routes');
const reportsRoutes = require('./reports/reports.routes');
const settingsRoutes = require('./settings/settings.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/buses', busesRoutes);
app.use('/api/buses', busLocationRoutes);
app.use('/api/owners', ownersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
