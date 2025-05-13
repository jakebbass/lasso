const express = require('express');
const router = express.Router();
const { 
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  updateOrderPayment,
  cancelOrder,
  getDeliveryRoutes,
  processRecurringOrders
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Protected routes
router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);

// Admin routes
router.get('/', protect, admin, getOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/payment', protect, admin, updateOrderPayment);
router.get('/delivery-routes', protect, admin, getDeliveryRoutes);
router.post('/process-recurring', protect, admin, processRecurringOrders);

module.exports = router;
