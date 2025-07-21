const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  prix: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  images: [{
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v) || 
               /^https:\/\/via\.placeholder\.com/.test(v);
      },
      message: 'L\'URL de l\'image doit être valide'
    }
  }],
  categorie: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: [
      'Électronique', 
      'Mode', 
      'Maison & Jardin', 
      'Automobile',
      'Santé & Beauté', 
      'Sports & Loisirs', 
      'Industrie & BTP'
    ]
  },
  stock: {
    type: Number,
    required: [true, 'Le stock est requis'],
    min: [0, 'Le stock ne peut pas être négatif'],
    default: 0
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
productSchema.index({ nom: 'text', description: 'text' });
productSchema.index({ categorie: 1 });
productSchema.index({ prix: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ createdAt: -1 });

// Virtual pour vérifier si le produit est en stock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Virtual pour calculer le statut du stock
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= 5) return 'low_stock';
  return 'in_stock';
});

// Middleware pour valider qu'au moins une image est fournie
productSchema.pre('save', function(next) {
  if (this.images.length === 0) {
    this.images = ['https://via.placeholder.com/600x400?text=No+Image'];
  }
  next();
});

// Méthode pour incrémenter les vues
productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Méthode pour mettre à jour le stock
productSchema.methods.updateStock = function(quantity) {
  this.stock = Math.max(0, this.stock + quantity);
  return this.save();
};

// Méthode statique pour rechercher des produits
productSchema.statics.searchProducts = function(query, options = {}) {
  const {
    page = 1,
    limit = 12,
    categorie,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const searchQuery = { isActive: true };

  // Recherche textuelle
  if (query) {
    searchQuery.$text = { $search: query };
  }

  // Filtres
  if (categorie) {
    searchQuery.categorie = categorie;
  }

  if (minPrice || maxPrice) {
    searchQuery.prix = {};
    if (minPrice) searchQuery.prix.$gte = Number(minPrice);
    if (maxPrice) searchQuery.prix.$lte = Number(maxPrice);
  }

  // Pagination
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  return this.find(searchQuery)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'name email');
};

module.exports = mongoose.model('Product', productSchema);
