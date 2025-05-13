const express = require('express');
const router = express.Router();
const { 
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductAvailability,
  updateProductAvailability
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getProducts);
router.get('/availability', getProductAvailability);
router.get('/:id', getProductById);

// Admin routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.put('/availability', protect, admin, updateProductAvailability);

module.exports = router;
