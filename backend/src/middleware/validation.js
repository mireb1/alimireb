const { body, param, query, validationResult } = require('express-validator');
const { sendValidationError } = require('../utils/response');

/**
 * Middleware pour traiter les résultats de validation
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return sendValidationError(res, errors.array());
  }
  
  next();
};

/**
 * Validations pour l'authentification
 */
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide'),
  
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
  
  handleValidationErrors
];

/**
 * Validations pour les produits
 */
const validateProduct = [
  body('nom')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom du produit doit contenir entre 2 et 100 caractères'),
  
  body('prix')
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Le stock doit être un nombre entier positif'),
  
  body('categorie')
    .isIn(['Électronique', 'Mode', 'Maison & Jardin', 'Automobile', 'Santé & Beauté', 'Sports & Loisirs', 'Industrie & BTP'])
    .withMessage('Catégorie invalide'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La description doit contenir entre 10 et 2000 caractères'),
  
  body('images')
    .isArray({ min: 1 })
    .withMessage('Au moins une image est requise'),
  
  body('images.*')
    .isURL()
    .withMessage('Chaque image doit être une URL valide'),
  
  handleValidationErrors
];

const validateProductUpdate = [
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom du produit doit contenir entre 2 et 100 caractères'),
  
  body('prix')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le stock doit être un nombre entier positif'),
  
  body('categorie')
    .optional()
    .isIn(['Électronique', 'Mode', 'Maison & Jardin', 'Automobile', 'Santé & Beauté', 'Sports & Loisirs', 'Industrie & BTP'])
    .withMessage('Catégorie invalide'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La description doit contenir entre 10 et 2000 caractères'),
  
  body('images')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Au moins une image est requise'),
  
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Chaque image doit être une URL valide'),
  
  handleValidationErrors
];

/**
 * Validations pour les leads
 */
const validateLead = [
  body('nom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'),
  
  body('tel')
    .trim()
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Veuillez entrer un numéro de téléphone valide'),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Le message ne peut pas dépasser 500 caractères'),
  
  body('produit')
    .isMongoId()
    .withMessage('ID produit invalide'),
  
  handleValidationErrors
];

const validateLeadUpdate = [
  body('status')
    .optional()
    .isIn(['nouveau', 'contacte', 'interesse', 'converti', 'perdu'])
    .withMessage('Statut invalide'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Les notes ne peuvent pas dépasser 1000 caractères'),
  
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('ID utilisateur invalide'),
  
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Date de suivi invalide'),
  
  handleValidationErrors
];

/**
 * Validations pour les paramètres
 */
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('ID invalide'),
  
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  
  handleValidationErrors
];

const validateProductQuery = [
  query('categorie')
    .optional()
    .isIn(['Électronique', 'Mode', 'Maison & Jardin', 'Automobile', 'Santé & Beauté', 'Sports & Loisirs', 'Industrie & BTP'])
    .withMessage('Catégorie invalide'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix minimum doit être positif'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix maximum doit être positif'),
  
  query('sortBy')
    .optional()
    .isIn(['nom', 'prix', 'createdAt', 'views'])
    .withMessage('Tri invalide'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordre de tri invalide'),
  
  handleValidationErrors
];

/**
 * Validations pour la recherche
 */
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('La requête de recherche doit contenir entre 1 et 100 caractères'),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProduct,
  validateProductUpdate,
  validateLead,
  validateLeadUpdate,
  validateObjectId,
  validatePagination,
  validateProductQuery,
  validateSearch,
  handleValidationErrors
};
