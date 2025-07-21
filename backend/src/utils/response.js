/**
 * Utilitaires pour les réponses API standardisées
 */

/**
 * Envoie une réponse de succès
 * @param {Object} res - L'objet response Express
 * @param {Number} statusCode - Code de statut HTTP
 * @param {String} message - Message de succès
 * @param {Object} data - Données à renvoyer
 * @param {Object} meta - Métadonnées (pagination, etc.)
 */
const sendSuccess = (res, statusCode = 200, message = 'Succès', data = null, meta = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Envoie une réponse d'erreur
 * @param {Object} res - L'objet response Express
 * @param {Number} statusCode - Code de statut HTTP
 * @param {String} message - Message d'erreur
 * @param {Object} errors - Détails des erreurs
 */
const sendError = (res, statusCode = 500, message = 'Erreur interne du serveur', errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors !== null) {
    response.errors = errors;
  }

  // Log l'erreur en développement
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Erreur API:', {
      statusCode,
      message,
      errors,
      timestamp: response.timestamp
    });
  }

  return res.status(statusCode).json(response);
};

/**
 * Envoie une réponse de validation d'erreur
 * @param {Object} res - L'objet response Express
 * @param {Array} validationErrors - Erreurs de validation
 */
const sendValidationError = (res, validationErrors) => {
  const errors = validationErrors.map(error => ({
    field: error.param || error.path,
    message: error.msg || error.message,
    value: error.value
  }));

  return sendError(res, 400, 'Erreurs de validation', errors);
};

/**
 * Envoie une réponse avec pagination
 * @param {Object} res - L'objet response Express
 * @param {Array} data - Données à paginer
 * @param {Number} page - Page actuelle
 * @param {Number} limit - Limite par page
 * @param {Number} total - Total d'éléments
 * @param {String} message - Message de succès
 */
const sendPaginatedResponse = (res, data, page, limit, total, message = 'Données récupérées avec succès') => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const meta = {
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    }
  };

  return sendSuccess(res, 200, message, data, meta);
};

/**
 * Gère les erreurs Mongoose
 * @param {Error} error - L'erreur Mongoose
 * @returns {Object} Erreur formatée
 */
const handleMongooseError = (error) => {
  let statusCode = 500;
  let message = 'Erreur de base de données';
  let errors = null;

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Erreurs de validation';
    errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
  } else if (error.code === 11000) {
    statusCode = 409;
    message = 'Conflit - Données déjà existantes';
    const field = Object.keys(error.keyPattern)[0];
    errors = [{
      field,
      message: `${field} déjà utilisé`,
      value: error.keyValue[field]
    }];
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Format d\'ID invalide';
    errors = [{
      field: error.path,
      message: `Format invalide pour ${error.path}`,
      value: error.value
    }];
  }

  return { statusCode, message, errors };
};

/**
 * Middleware pour gérer les erreurs asynchrones
 * @param {Function} fn - Fonction asynchrone
 * @returns {Function} Middleware Express
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Nettoie les données sensibles d'un objet utilisateur
 * @param {Object} user - Objet utilisateur
 * @returns {Object} Utilisateur nettoyé
 */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginatedResponse,
  handleMongooseError,
  asyncHandler,
  sanitizeUser
};
