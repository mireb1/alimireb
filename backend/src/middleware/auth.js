const User = require('../models/User');
const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { sendError, asyncHandler } = require('../utils/response');

/**
 * Middleware d'authentification JWT
 * Vérifie si l'utilisateur est connecté
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // Extraire le token du header Authorization
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    return sendError(res, 401, 'Token d\'authentification requis');
  }

  try {
    // Vérifier et décoder le token
    const decoded = verifyToken(token);
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return sendError(res, 401, 'Utilisateur non trouvé');
    }

    if (!user.isActive) {
      return sendError(res, 401, 'Compte utilisateur désactivé');
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error.message);
    return sendError(res, 401, 'Token invalide ou expiré');
  }
});

/**
 * Middleware pour vérifier les rôles
 * @param {...String} roles - Rôles autorisés
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentification requise');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'Accès refusé - Privilèges insuffisants');
    }

    next();
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est admin
 */
const requireAdmin = authorize('admin');

/**
 * Middleware d'authentification optionnelle
 * N'échoue pas si aucun token n'est fourni
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
      req.token = token;
    }
  } catch (error) {
    // Ignore les erreurs de token en mode optionnel
    console.log('Token optionnel invalide:', error.message);
  }

  next();
});

/**
 * Middleware pour vérifier la propriété d'une ressource
 * L'utilisateur doit être le propriétaire ou admin
 */
const requireOwnership = (resourceField = 'createdBy') => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentification requise');
    }

    // Les admins ont accès à tout
    if (req.user.role === 'admin') {
      return next();
    }

    // Vérifier la propriété (à implémenter selon le contexte)
    if (req.resource && req.resource[resourceField]) {
      if (req.resource[resourceField].toString() !== req.user._id.toString()) {
        return sendError(res, 403, 'Accès refusé - Vous n\'êtes pas propriétaire de cette ressource');
      }
    }

    next();
  });
};

/**
 * Middleware pour limiter les tentatives de connexion
 */
const loginLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max par IP
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

/**
 * Middleware pour extraire l'ID utilisateur des paramètres
 * et vérifier qu'il correspond à l'utilisateur connecté (sauf admin)
 */
const requireSelfOrAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return sendError(res, 401, 'Authentification requise');
  }

  const targetUserId = req.params.userId || req.params.id;
  
  // Les admins peuvent accéder à tous les profils
  if (req.user.role === 'admin') {
    return next();
  }

  // Les utilisateurs ne peuvent accéder qu'à leur propre profil
  if (targetUserId !== req.user._id.toString()) {
    return sendError(res, 403, 'Accès refusé - Vous ne pouvez accéder qu\'à votre propre profil');
  }

  next();
});

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  optionalAuth,
  requireOwnership,
  requireSelfOrAdmin,
  loginLimiter
};
