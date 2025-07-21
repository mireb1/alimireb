const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyToken,
  logout,
  getAllUsers,
  toggleUserStatus
} = require('../controllers/authController');

const {
  authenticate,
  requireAdmin,
  loginLimiter
} = require('../middleware/auth');

const {
  validateRegister,
  validateLogin,
  validateObjectId
} = require('../middleware/validation');

// Routes publiques
router.post('/register', validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);

// Routes privées (authentification requise)
router.use(authenticate); // Toutes les routes suivantes nécessitent une authentification

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/verify', verifyToken);
router.post('/logout', logout);

// Routes admin uniquement
router.get('/users', requireAdmin, getAllUsers);
router.put('/users/:id/status', requireAdmin, validateObjectId, toggleUserStatus);

module.exports = router;
