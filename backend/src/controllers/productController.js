const Product = require('../models/Product');
const { sendSuccess, sendError, sendPaginatedResponse, asyncHandler } = require('../utils/response');

/**
 * @desc    Obtenir tous les produits avec filtres et pagination
 * @route   GET /api/products
 * @access  Public
 */
const getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    categorie,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    featured
  } = req.query;

  // Construction de la requête
  const query = { isActive: true };

  // Filtres
  if (categorie) {
    query.categorie = categorie;
  }

  if (minPrice || maxPrice) {
    query.prix = {};
    if (minPrice) query.prix.$gte = Number(minPrice);
    if (maxPrice) query.prix.$lte = Number(maxPrice);
  }

  if (featured !== undefined) {
    query.featured = featured === 'true';
  }

  // Recherche textuelle
  if (search) {
    query.$or = [
      { nom: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Options de tri
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Exécution de la requête avec pagination
  const products = await Product.find(query)
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('createdBy', 'name email')
    .exec();

  const total = await Product.countDocuments(query);

  sendPaginatedResponse(
    res,
    products,
    parseInt(page),
    parseInt(limit),
    total,
    'Produits récupérés avec succès'
  );
});

/**
 * @desc    Obtenir un produit par ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id)
    .populate('createdBy', 'name email');

  if (!product) {
    return sendError(res, 404, 'Produit non trouvé');
  }

  if (!product.isActive) {
    return sendError(res, 404, 'Produit non disponible');
  }

  // Incrémenter les vues
  await product.incrementViews();

  sendSuccess(res, 200, 'Produit récupéré avec succès', { product });
});

/**
 * @desc    Créer un nouveau produit
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const { nom, prix, images, categorie, stock, description, featured } = req.body;

  const product = await Product.create({
    nom,
    prix,
    images,
    categorie,
    stock,
    description,
    featured: featured || false,
    createdBy: req.user._id
  });

  const populatedProduct = await Product.findById(product._id)
    .populate('createdBy', 'name email');

  sendSuccess(res, 201, 'Produit créé avec succès', { product: populatedProduct });
});

/**
 * @desc    Mettre à jour un produit
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const product = await Product.findById(id);

  if (!product) {
    return sendError(res, 404, 'Produit non trouvé');
  }

  // Mettre à jour les champs autorisés
  const allowedFields = ['nom', 'prix', 'images', 'categorie', 'stock', 'description', 'featured', 'isActive'];
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      product[field] = updateData[field];
    }
  });

  await product.save();

  const updatedProduct = await Product.findById(product._id)
    .populate('createdBy', 'name email');

  sendSuccess(res, 200, 'Produit mis à jour avec succès', { product: updatedProduct });
});

/**
 * @desc    Supprimer un produit (soft delete)
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return sendError(res, 404, 'Produit non trouvé');
  }

  // Soft delete
  product.isActive = false;
  await product.save();

  sendSuccess(res, 200, 'Produit supprimé avec succès');
});

/**
 * @desc    Supprimer définitivement un produit
 * @route   DELETE /api/products/:id/permanent
 * @access  Private/Admin
 */
const permanentDeleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    return sendError(res, 404, 'Produit non trouvé');
  }

  sendSuccess(res, 200, 'Produit supprimé définitivement');
});

/**
 * @desc    Obtenir les catégories avec compteurs
 * @route   GET /api/products/categories/stats
 * @access  Public
 */
const getCategoriesStats = asyncHandler(async (req, res) => {
  const stats = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$categorie', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const categories = stats.map(stat => ({
    name: stat._id,
    count: stat.count
  }));

  sendSuccess(res, 200, 'Statistiques des catégories récupérées', { categories });
});

/**
 * @desc    Rechercher des produits
 * @route   GET /api/products/search
 * @access  Public
 */
const searchProducts = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 12 } = req.query;

  if (!q || q.trim().length === 0) {
    return sendError(res, 400, 'Terme de recherche requis');
  }

  const searchQuery = {
    isActive: true,
    $or: [
      { nom: { $regex: q.trim(), $options: 'i' } },
      { description: { $regex: q.trim(), $options: 'i' } }
    ]
  };

  const products = await Product.find(searchQuery)
    .sort({ views: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('createdBy', 'name email');

  const total = await Product.countDocuments(searchQuery);

  sendPaginatedResponse(
    res,
    products,
    parseInt(page),
    parseInt(limit),
    total,
    `${total} produit(s) trouvé(s) pour "${q}"`
  );
});

/**
 * @desc    Obtenir les produits populaires
 * @route   GET /api/products/popular
 * @access  Public
 */
const getPopularProducts = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;

  const products = await Product.find({ isActive: true })
    .sort({ views: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .populate('createdBy', 'name email');

  sendSuccess(res, 200, 'Produits populaires récupérés', { products });
});

/**
 * @desc    Obtenir les produits mis en avant
 * @route   GET /api/products/featured
 * @access  Public
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;

  const products = await Product.find({ 
    isActive: true, 
    featured: true 
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('createdBy', 'name email');

  sendSuccess(res, 200, 'Produits mis en avant récupérés', { products });
});

/**
 * @desc    Mettre à jour le stock d'un produit
 * @route   PATCH /api/products/:id/stock
 * @access  Private/Admin
 */
const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, operation = 'set' } = req.body;

  if (typeof quantity !== 'number') {
    return sendError(res, 400, 'Quantité invalide');
  }

  const product = await Product.findById(id);

  if (!product) {
    return sendError(res, 404, 'Produit non trouvé');
  }

  switch (operation) {
    case 'add':
      product.stock += quantity;
      break;
    case 'subtract':
      product.stock = Math.max(0, product.stock - quantity);
      break;
    case 'set':
    default:
      product.stock = Math.max(0, quantity);
      break;
  }

  await product.save();

  sendSuccess(res, 200, 'Stock mis à jour avec succès', { 
    product: {
      id: product._id,
      nom: product.nom,
      stock: product.stock,
      stockStatus: product.stockStatus
    }
  });
});

/**
 * @desc    Obtenir les statistiques des produits (admin)
 * @route   GET /api/products/admin/stats
 * @access  Private/Admin
 */
const getProductStats = asyncHandler(async (req, res) => {
  const stats = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
        totalViews: { $sum: '$views' },
        averagePrice: { $avg: '$prix' },
        totalStock: { $sum: '$stock' },
        lowStockProducts: { $sum: { $cond: [{ $lte: ['$stock', 5] }, 1, 0] } }
      }
    }
  ]);

  const categoryStats = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$categorie', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } },
    { $sort: { count: -1 } }
  ]);

  sendSuccess(res, 200, 'Statistiques récupérées', {
    general: stats[0] || {},
    categories: categoryStats
  });
});

module.exports = {
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
};
