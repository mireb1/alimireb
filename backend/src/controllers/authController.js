const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError, asyncHandler, sanitizeUser } = require('../utils/response');

/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 409, 'Un utilisateur avec cet email existe déjà');
  }

  // Créer le nouvel utilisateur
  const user = await User.create({
    name,
    email,
    password,
    role: 'user'
  });

  // Générer le token JWT
  const token = generateToken(user);

  // Mettre à jour le dernier login
  await user.updateLastLogin();

  // Renvoyer la réponse sans le mot de passe
  const userData = sanitizeUser(user);

  sendSuccess(res, 201, 'Utilisateur créé avec succès', {
    user: userData,
    token
  });
});

/**
 * @desc    Connexion utilisateur
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Chercher l'utilisateur avec le mot de passe
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return sendError(res, 401, 'Email ou mot de passe incorrect');
  }

  // Vérifier si le compte est actif
  if (!user.isActive) {
    return sendError(res, 401, 'Votre compte a été désactivé. Contactez l\'administrateur.');
  }

  // Vérifier le mot de passe
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return sendError(res, 401, 'Email ou mot de passe incorrect');
  }

  // Générer le token JWT
  const token = generateToken(user);

  // Mettre à jour le dernier login
  await user.updateLastLogin();

  // Renvoyer la réponse sans le mot de passe
  const userData = sanitizeUser(user);

  sendSuccess(res, 200, 'Connexion réussie', {
    user: userData,
    token
  });
});

/**
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const userData = sanitizeUser(req.user);
  
  sendSuccess(res, 200, 'Profil récupéré avec succès', { user: userData });
});

/**
 * @desc    Mettre à jour le profil de l'utilisateur connecté
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, profileImage } = req.body;
  
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return sendError(res, 404, 'Utilisateur non trouvé');
  }

  // Mettre à jour les champs autorisés
  if (name) user.name = name;
  if (profileImage !== undefined) user.profileImage = profileImage;

  await user.save();

  const userData = sanitizeUser(user);
  
  sendSuccess(res, 200, 'Profil mis à jour avec succès', { user: userData });
});

/**
 * @desc    Changer le mot de passe de l'utilisateur connecté
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validation basique
  if (!currentPassword || !newPassword) {
    return sendError(res, 400, 'Ancien et nouveau mot de passe requis');
  }

  if (newPassword.length < 6) {
    return sendError(res, 400, 'Le nouveau mot de passe doit contenir au moins 6 caractères');
  }

  // Récupérer l'utilisateur avec le mot de passe
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return sendError(res, 404, 'Utilisateur non trouvé');
  }

  // Vérifier l'ancien mot de passe
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return sendError(res, 400, 'Mot de passe actuel incorrect');
  }

  // Mettre à jour le mot de passe
  user.password = newPassword;
  await user.save();

  sendSuccess(res, 200, 'Mot de passe modifié avec succès');
});

/**
 * @desc    Vérifier la validité du token
 * @route   GET /api/auth/verify
 * @access  Private
 */
const verifyToken = asyncHandler(async (req, res) => {
  // Si on arrive ici, c'est que le token est valide (middleware auth)
  const userData = sanitizeUser(req.user);
  
  sendSuccess(res, 200, 'Token valide', { user: userData });
});

/**
 * @desc    Déconnexion (côté client principalement)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Côté serveur, on peut log la déconnexion
  console.log(`Utilisateur ${req.user.email} déconnecté à ${new Date().toISOString()}`);
  
  sendSuccess(res, 200, 'Déconnexion réussie');
});

/**
 * @desc    Obtenir tous les utilisateurs (admin seulement)
 * @route   GET /api/auth/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;
  
  const query = {};
  
  // Filtrer par rôle si spécifié
  if (role) {
    query.role = role;
  }
  
  // Recherche par nom ou email
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  sendSuccess(res, 200, 'Utilisateurs récupérés avec succès', {
    users: users.map(sanitizeUser),
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  });
});

/**
 * @desc    Activer/désactiver un utilisateur (admin seulement)
 * @route   PUT /api/auth/users/:id/status
 * @access  Private/Admin
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findById(id);
  
  if (!user) {
    return sendError(res, 404, 'Utilisateur non trouvé');
  }

  // Empêcher la désactivation de son propre compte
  if (user._id.toString() === req.user._id.toString()) {
    return sendError(res, 400, 'Vous ne pouvez pas modifier le statut de votre propre compte');
  }

  user.isActive = isActive;
  await user.save();

  const userData = sanitizeUser(user);
  
  sendSuccess(res, 200, `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`, { user: userData });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyToken,
  logout,
  getAllUsers,
  toggleUserStatus
};
