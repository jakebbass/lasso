const express = require('express');
const router = express.Router();
const { 
  createPaymentIntent,
  handleWebhook,
  getPaymentStatus,
  refundPayment
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

// Webhook route (public)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.post('/create-payment-intent', protect, createPaymentIntent);
router.get('/:paymentId/status', protect, getPaymentStatus);

// Admin routes
router.post('/:paymentId/refund', protect, admin, refundPayment);

module.exports = router;
