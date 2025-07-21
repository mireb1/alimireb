const jwt = require('jsonwebtoken');

/**
 * Génère un token JWT pour un utilisateur
 * @param {Object} user - L'objet utilisateur
 * @returns {String} Token JWT
 */
const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'mireb-api',
      audience: 'mireb-app'
    }
  );
};

/**
 * Vérifie et décode un token JWT
 * @param {String} token - Le token à vérifier
 * @returns {Object} Payload décodé
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'mireb-api',
      audience: 'mireb-app'
    });
  } catch (error) {
    throw new Error('Token invalide');
  }
};

/**
 * Décode un token sans vérification (pour debug)
 * @param {String} token - Le token à décoder
 * @returns {Object} Payload décodé
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Vérifie si un token est expiré
 * @param {String} token - Le token à vérifier
 * @returns {Boolean} True si expiré
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Extrait le token du header Authorization
 * @param {String} authHeader - Le header Authorization
 * @returns {String|null} Le token ou null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
};

/**
 * Génère un token de refresh (pour une implémentation future)
 * @param {Object} user - L'objet utilisateur
 * @returns {String} Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    type: 'refresh'
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET + '_refresh',
    {
      expiresIn: '30d',
      issuer: 'mireb-api',
      audience: 'mireb-app'
    }
  );
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  extractTokenFromHeader,
  generateRefreshToken
};
