require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/database');
const { sendError } = require('./src/utils/response');

// Routes
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const leadRoutes = require('./src/routes/leads');

// Initialiser l'application Express
const app = express();

// Connecter à la base de données
connectDB();

// Middlewares de sécurité et performance
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());

// Configuration CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permettre les requêtes sans origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5500',
      'http://localhost:8080'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limite par IP
  message: {
    success: false,
    message: 'Trop de requêtes. Réessayez plus tard.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalLimiter);

// Logging en développement
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Mireb Commercial en fonctionnement',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/leads', leadRoutes);

// Route par défaut
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API Mireb Commercial',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      leads: '/api/leads'
    }
  });
});

// Gestion des routes non trouvées
app.all('*', (req, res) => {
  sendError(res, 404, `Route ${req.originalUrl} non trouvée`);
});

// Middleware de gestion d'erreurs global
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);

  // Erreur de validation Mongoose
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    return sendError(res, 400, 'Erreurs de validation', errors);
  }

  // Erreur de cast MongoDB (ID invalide)
  if (error.name === 'CastError') {
    return sendError(res, 400, 'Ressource non trouvée - ID invalide');
  }

  // Erreur de duplication MongoDB
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return sendError(res, 409, `${field} déjà utilisé`);
  }

  // Erreur JWT
  if (error.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Token invalide');
  }

  if (error.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token expiré');
  }

  // Erreur CORS
  if (error.message.includes('CORS')) {
    return sendError(res, 403, 'Accès refusé par CORS');
  }

  // Erreur générique
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erreur interne du serveur' 
    : error.message;

  sendError(res, statusCode, message);
});

// Démarrage du serveur
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`
🚀 Serveur Mireb Commercial démarré !
📍 Port: ${PORT}
🌍 Environnement: ${process.env.NODE_ENV}
📝 API: http://localhost:${PORT}
🔥 Ready to serve requests!
  `);
});

// Gestion des arrêts gracieux
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM reçu. Arrêt gracieux...');
  server.close(() => {
    console.log('✅ Serveur fermé.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT reçu. Arrêt gracieux...');
  server.close(() => {
    console.log('✅ Serveur fermé.');
    process.exit(0);
  });
});

// Gestion des rejets de promesses non gérés
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
