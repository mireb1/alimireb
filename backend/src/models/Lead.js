const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  tel: {
    type: String,
    required: [true, 'Le numéro de téléphone est requis'],
    trim: true,
    validate: {
      validator: function(v) {
        // Validation pour numéros internationaux (format flexible)
        return /^[\+]?[1-9][\d]{0,15}$/.test(v.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Veuillez entrer un numéro de téléphone valide'
    }
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Le message ne peut pas dépasser 500 caractères'],
    default: ''
  },
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Le produit est requis']
  },
  status: {
    type: String,
    enum: ['nouveau', 'contacte', 'interesse', 'converti', 'perdu'],
    default: 'nouveau'
  },
  source: {
    type: String,
    enum: ['website', 'whatsapp', 'direct'],
    default: 'website'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Les notes ne peuvent pas dépasser 1000 caractères'],
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  followUpDate: {
    type: Date
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ produit: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ tel: 1 });

// Virtual pour formater le numéro de téléphone
leadSchema.virtual('formattedTel').get(function() {
  // Supprime tous les caractères non numériques sauf le +
  const cleaned = this.tel.replace(/[^\d\+]/g, '');
  
  // Ajoute + si ce n'est pas déjà présent et que ça commence par un chiffre
  if (!cleaned.startsWith('+') && /^\d/.test(cleaned)) {
    return `+${cleaned}`;
  }
  
  return cleaned;
});

// Virtual pour le lien WhatsApp
leadSchema.virtual('whatsappLink').get(function() {
  const phone = this.formattedTel.replace(/[^\d]/g, '');
  const productName = this.produit && this.produit.nom ? this.produit.nom : 'produit';
  const message = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par votre ${productName}. ${this.message || ''}`
  );
  return `https://wa.me/${phone}?text=${message}`;
});

// Virtual pour calculer l'âge du lead
leadSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
});

// Méthode pour mettre à jour le statut
leadSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  if (notes) {
    this.notes = this.notes ? `${this.notes}\n\n${new Date().toISOString()}: ${notes}` : notes;
  }
  return this.save();
};

// Méthode pour assigner à un utilisateur
leadSchema.methods.assignTo = function(userId, notes = '') {
  this.assignedTo = userId;
  if (notes) {
    this.notes = this.notes ? `${this.notes}\n\n${new Date().toISOString()}: Assigné - ${notes}` : notes;
  }
  return this.save();
};

// Méthode pour planifier un suivi
leadSchema.methods.scheduleFollowUp = function(date, notes = '') {
  this.followUpDate = date;
  if (notes) {
    this.notes = this.notes ? `${this.notes}\n\n${new Date().toISOString()}: Suivi programmé - ${notes}` : notes;
  }
  return this.save();
};

// Méthode statique pour obtenir les statistiques
leadSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
};

// Méthode statique pour les leads nécessitant un suivi
leadSchema.statics.getNeedingFollowUp = function() {
  const now = new Date();
  return this.find({
    followUpDate: { $lte: now },
    status: { $nin: ['converti', 'perdu'] },
    isArchived: false
  }).populate('produit assignedTo');
};

module.exports = mongoose.model('Lead', leadSchema);
