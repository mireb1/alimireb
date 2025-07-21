const Lead = require('../models/Lead');
const Product = require('../models/Product');
const { sendSuccess, sendError, sendPaginatedResponse, asyncHandler } = require('../utils/response');

/**
 * @desc    Créer un nouveau lead
 * @route   POST /api/leads
 * @access  Public
 */
const createLead = asyncHandler(async (req, res) => {
  const { nom, tel, message, produit } = req.body;

  // Vérifier que le produit existe
  const productExists = await Product.findById(produit);
  if (!productExists) {
    return sendError(res, 404, 'Produit non trouvé');
  }

  if (!productExists.isActive) {
    return sendError(res, 400, 'Ce produit n\'est plus disponible');
  }

  const lead = await Lead.create({
    nom,
    tel,
    message,
    produit
  });

  const populatedLead = await Lead.findById(lead._id)
    .populate('produit', 'nom prix images');

  // Log pour les admins
  console.log(`📞 Nouveau lead reçu: ${nom} (${tel}) pour ${productExists.nom}`);

  sendSuccess(res, 201, 'Demande envoyée avec succès! Nous vous contacterons bientôt.', { 
    lead: populatedLead 
  });
});

/**
 * @desc    Obtenir tous les leads (admin)
 * @route   GET /api/leads
 * @access  Private/Admin
 */
const getAllLeads = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    assignedTo,
    search,
    dateFrom,
    dateTo,
    produit
  } = req.query;

  // Construction de la requête
  const query = { isArchived: false };

  // Filtres
  if (status) {
    query.status = status;
  }

  if (assignedTo) {
    query.assignedTo = assignedTo;
  }

  if (produit) {
    query.produit = produit;
  }

  // Recherche par nom ou téléphone
  if (search) {
    query.$or = [
      { nom: { $regex: search, $options: 'i' } },
      { tel: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];
  }

  // Filtres de date
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const leads = await Lead.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('produit', 'nom prix images')
    .populate('assignedTo', 'name email');

  const total = await Lead.countDocuments(query);

  sendPaginatedResponse(
    res,
    leads,
    parseInt(page),
    parseInt(limit),
    total,
    'Leads récupérés avec succès'
  );
});

/**
 * @desc    Obtenir un lead par ID
 * @route   GET /api/leads/:id
 * @access  Private/Admin
 */
const getLeadById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lead = await Lead.findById(id)
    .populate('produit', 'nom prix images description')
    .populate('assignedTo', 'name email');

  if (!lead) {
    return sendError(res, 404, 'Lead non trouvé');
  }

  sendSuccess(res, 200, 'Lead récupéré avec succès', { lead });
});

/**
 * @desc    Mettre à jour un lead
 * @route   PUT /api/leads/:id
 * @access  Private/Admin
 */
const updateLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes, assignedTo, followUpDate } = req.body;

  const lead = await Lead.findById(id);

  if (!lead) {
    return sendError(res, 404, 'Lead non trouvé');
  }

  // Mettre à jour les champs
  if (status) {
    await lead.updateStatus(status, notes);
  }

  if (assignedTo) {
    await lead.assignTo(assignedTo, notes);
  }

  if (followUpDate) {
    await lead.scheduleFollowUp(new Date(followUpDate), notes);
  }

  // Si on a juste des notes à ajouter
  if (notes && !status && !assignedTo && !followUpDate) {
    lead.notes = lead.notes ? 
      `${lead.notes}\n\n${new Date().toISOString()}: ${notes}` : 
      notes;
    await lead.save();
  }

  const updatedLead = await Lead.findById(lead._id)
    .populate('produit', 'nom prix images')
    .populate('assignedTo', 'name email');

  sendSuccess(res, 200, 'Lead mis à jour avec succès', { lead: updatedLead });
});

/**
 * @desc    Supprimer un lead (soft delete)
 * @route   DELETE /api/leads/:id
 * @access  Private/Admin
 */
const deleteLead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lead = await Lead.findById(id);

  if (!lead) {
    return sendError(res, 404, 'Lead non trouvé');
  }

  lead.isArchived = true;
  await lead.save();

  sendSuccess(res, 200, 'Lead archivé avec succès');
});

/**
 * @desc    Assigner un lead à un utilisateur
 * @route   PATCH /api/leads/:id/assign
 * @access  Private/Admin
 */
const assignLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assignedTo, notes } = req.body;

  const lead = await Lead.findById(id);

  if (!lead) {
    return sendError(res, 404, 'Lead non trouvé');
  }

  await lead.assignTo(assignedTo, notes);

  const updatedLead = await Lead.findById(lead._id)
    .populate('produit', 'nom prix images')
    .populate('assignedTo', 'name email');

  sendSuccess(res, 200, 'Lead assigné avec succès', { lead: updatedLead });
});

/**
 * @desc    Planifier un suivi pour un lead
 * @route   PATCH /api/leads/:id/follow-up
 * @access  Private/Admin
 */
const scheduleFollowUp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { followUpDate, notes } = req.body;

  if (!followUpDate) {
    return sendError(res, 400, 'Date de suivi requise');
  }

  const lead = await Lead.findById(id);

  if (!lead) {
    return sendError(res, 404, 'Lead non trouvé');
  }

  await lead.scheduleFollowUp(new Date(followUpDate), notes);

  const updatedLead = await Lead.findById(lead._id)
    .populate('produit', 'nom prix images')
    .populate('assignedTo', 'name email');

  sendSuccess(res, 200, 'Suivi programmé avec succès', { lead: updatedLead });
});

/**
 * @desc    Obtenir les statistiques des leads
 * @route   GET /api/leads/stats
 * @access  Private/Admin
 */
const getLeadStats = asyncHandler(async (req, res) => {
  // Statistiques par statut
  const statusStats = await Lead.getStats();

  // Leads nécessitant un suivi
  const needingFollowUp = await Lead.getNeedingFollowUp();

  // Statistiques par période
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentStats = await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
        isArchived: false
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Top produits générateurs de leads
  const topProducts = await Lead.aggregate([
    { $match: { isArchived: false } },
    { $group: { _id: '$produit', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    {
      $project: {
        count: 1,
        product: { $arrayElemAt: ['$productInfo', 0] }
      }
    }
  ]);

  // Taux de conversion
  const totalLeads = await Lead.countDocuments({ isArchived: false });
  const convertedLeads = await Lead.countDocuments({ 
    status: 'converti', 
    isArchived: false 
  });
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(2) : 0;

  sendSuccess(res, 200, 'Statistiques récupérées', {
    byStatus: statusStats,
    needingFollowUp: needingFollowUp.length,
    recentActivity: recentStats,
    topProducts,
    conversion: {
      total: totalLeads,
      converted: convertedLeads,
      rate: `${conversionRate}%`
    }
  });
});

/**
 * @desc    Obtenir les leads assignés à l'utilisateur connecté
 * @route   GET /api/leads/my-leads
 * @access  Private
 */
const getMyLeads = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const query = {
    assignedTo: req.user._id,
    isArchived: false
  };

  if (status) {
    query.status = status;
  }

  const leads = await Lead.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('produit', 'nom prix images');

  const total = await Lead.countDocuments(query);

  sendPaginatedResponse(
    res,
    leads,
    parseInt(page),
    parseInt(limit),
    total,
    'Vos leads récupérés avec succès'
  );
});

/**
 * @desc    Exporter les leads au format CSV (admin)
 * @route   GET /api/leads/export
 * @access  Private/Admin
 */
const exportLeads = asyncHandler(async (req, res) => {
  const { status, dateFrom, dateTo } = req.query;

  const query = { isArchived: false };

  if (status) query.status = status;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const leads = await Lead.find(query)
    .populate('produit', 'nom prix')
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 });

  // Préparer les données CSV
  const csvData = leads.map(lead => ({
    Date: lead.createdAt.toISOString().split('T')[0],
    Nom: lead.nom,
    Telephone: lead.tel,
    Produit: lead.produit?.nom || 'N/A',
    Prix: lead.produit?.prix || 0,
    Status: lead.status,
    Message: lead.message.replace(/[\n\r]/g, ' '),
    Assigne: lead.assignedTo?.name || 'Non assigné',
    Age: lead.ageInDays + ' jours'
  }));

  sendSuccess(res, 200, 'Données d\'export récupérées', { 
    leads: csvData,
    count: csvData.length 
  });
});

module.exports = {
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
};
