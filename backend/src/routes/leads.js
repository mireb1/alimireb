const express = require('express');
const router = express.Router();

const {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
  scheduleFollowUp,
  getLeadStats,
  getMyLeads,
  exportLeads
} = require('../controllers/leadController');

const {
  authenticate,
  requireAdmin
} = require('../middleware/auth');

const {
  validateLead,
  validateLeadUpdate,
  validateObjectId,
  validatePagination
} = require('../middleware/validation');

// Route publique pour créer un lead
router.post('/', validateLead, createLead);

// Routes privées (authentification requise)
router.use(authenticate);

// Routes pour tous les utilisateurs connectés
router.get('/my-leads', validatePagination, getMyLeads);

// Routes admin uniquement
router.get('/', requireAdmin, validatePagination, getAllLeads);
router.get('/stats', requireAdmin, getLeadStats);
router.get('/export', requireAdmin, exportLeads);
router.get('/:id', requireAdmin, validateObjectId, getLeadById);
router.put('/:id', requireAdmin, validateObjectId, validateLeadUpdate, updateLead);
router.delete('/:id', requireAdmin, validateObjectId, deleteLead);
router.patch('/:id/assign', requireAdmin, validateObjectId, assignLead);
router.patch('/:id/follow-up', requireAdmin, validateObjectId, scheduleFollowUp);

module.exports = router;
