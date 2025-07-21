const express = require('express');
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  permanentDeleteProduct,
  getCategoriesStats,
  searchProducts,
  getPopularProducts,
  getFeaturedProducts,
  updateStock,
  getProductStats
} = require('../controllers/productController');

const {
  authenticate,
  requireAdmin,
  optionalAuth
} = require('../middleware/auth');

const {
  validateProduct,
  validateProductUpdate,
  validateObjectId,
  validatePagination,
  validateProductQuery,
  validateSearch
} = require('../middleware/validation');

// Routes publiques
router.get('/', validatePagination, validateProductQuery, getAllProducts);
router.get('/search', validatePagination, validateSearch, searchProducts);
router.get('/popular', getPopularProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories/stats', getCategoriesStats);
router.get('/:id', validateObjectId, getProductById);

// Routes admin uniquement
router.post('/', authenticate, requireAdmin, validateProduct, createProduct);
router.put('/:id', authenticate, requireAdmin, validateObjectId, validateProductUpdate, updateProduct);
router.delete('/:id', authenticate, requireAdmin, validateObjectId, deleteProduct);
router.delete('/:id/permanent', authenticate, requireAdmin, validateObjectId, permanentDeleteProduct);
router.patch('/:id/stock', authenticate, requireAdmin, validateObjectId, updateStock);
router.get('/admin/stats', authenticate, requireAdmin, getProductStats);

module.exports = router;
