require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// Simulation des données sans MongoDB pour la démonstration
const { sendSuccess, sendError } = require('./src/utils/response');

const app = express();

// Middlewares de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Configuration CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Logging en développement
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Données de démonstration en mémoire
let demoProducts = [
  {
    id: 1,
    nom: "Smartphone Samsung Galaxy A24",
    prix: 299,
    images: [
      "https://via.placeholder.com/600x400?text=Samsung+Galaxy+A24",
      "https://via.placeholder.com/600x400?text=Samsung+A24+Back"
    ],
    categorie: "Électronique",
    stock: 15,
    description: "<p>Smartphone <b>Samsung Galaxy A24</b> avec écran 6,5\" Super AMOLED.</p>",
    isActive: true,
    featured: true,
    views: 45,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    nom: "Robe Africaine Wax Premium",
    prix: 45,
    images: ["https://via.placeholder.com/600x400?text=Robe+Wax+Africaine"],
    categorie: "Mode",
    stock: 30,
    description: "<p>Magnifique <b>robe africaine</b> en tissu wax 100% coton.</p>",
    isActive: true,
    featured: true,
    views: 32,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    nom: "Casque Audio Bluetooth Premium",
    prix: 89,
    images: ["https://via.placeholder.com/600x400?text=Casque+Bluetooth"],
    categorie: "Électronique",
    stock: 25,
    description: "<p><b>Casque audio Bluetooth</b> haute qualité avec réduction de bruit.</p>",
    isActive: true,
    featured: false,
    views: 28,
    createdAt: new Date().toISOString()
  }
];

let demoLeads = [];
let nextLeadId = 1;

// Routes de démonstration

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Mireb Commercial en mode DEMO',
    timestamp: new Date().toISOString(),
    version: '1.0.0-demo',
    environment: 'demo',
    note: 'Connectez une vraie base de données MongoDB pour utiliser toutes les fonctionnalités'
  });
});

// Route d'accueil
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 Bienvenue sur l\'API Mireb Commercial (Mode Démo)',
    version: '1.0.0-demo',
    status: 'API fonctionnelle en mode démonstration',
    endpoints: {
      auth: '/api/auth (Nécessite MongoDB)',
      products: '/api/products ✅',
      leads: '/api/leads ✅',
      health: '/health ✅'
    },
    note: 'Pour utiliser toutes les fonctionnalités, configurez MongoDB et redémarrez avec npm run dev'
  });
});

// Routes produits (simulation)
app.get('/api/products', (req, res) => {
  const { page = 1, limit = 12, categorie, search } = req.query;
  
  let products = demoProducts.filter(p => p.isActive);
  
  if (categorie) {
    products = products.filter(p => p.categorie === categorie);
  }
  
  if (search) {
    products = products.filter(p => 
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  const total = products.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = products.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    message: 'Produits récupérés (mode démo)',
    data: paginatedProducts,
    meta: {
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: endIndex < total,
        hasPrevPage: page > 1
      }
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = demoProducts.find(p => p.id == req.params.id && p.isActive);
  
  if (!product) {
    return sendError(res, 404, 'Produit non trouvé');
  }
  
  // Incrémenter les vues
  product.views += 1;
  
  sendSuccess(res, 200, 'Produit récupéré (mode démo)', { product });
});

app.get('/api/products/categories/stats', (req, res) => {
  const categories = {};
  demoProducts.forEach(product => {
    if (product.isActive) {
      categories[product.categorie] = (categories[product.categorie] || 0) + 1;
    }
  });
  
  const stats = Object.entries(categories).map(([name, count]) => ({ name, count }));
  
  sendSuccess(res, 200, 'Statistiques des catégories (mode démo)', { categories: stats });
});

// Routes leads (simulation)
app.post('/api/leads', (req, res) => {
  const { nom, tel, message, produit } = req.body;
  
  // Validation basique
  if (!nom || !tel || !produit) {
    return sendError(res, 400, 'Nom, téléphone et produit requis');
  }
  
  const product = demoProducts.find(p => p.id == produit);
  if (!product) {
    return sendError(res, 404, 'Produit non trouvé');
  }
  
  const newLead = {
    id: nextLeadId++,
    nom,
    tel,
    message: message || '',
    produit: product,
    status: 'nouveau',
    createdAt: new Date().toISOString()
  };
  
  demoLeads.push(newLead);
  
  console.log(`📞 Nouveau lead reçu (DEMO): ${nom} (${tel}) pour ${product.nom}`);
  
  sendSuccess(res, 201, 'Demande envoyée avec succès! (mode démo)', { lead: newLead });
});

app.get('/api/leads', (req, res) => {
  sendSuccess(res, 200, 'Leads récupérés (mode démo)', { 
    leads: demoLeads,
    note: 'En mode démo - Connectez MongoDB pour la persistance' 
  });
});

// Routes d'authentification (simulation)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'mirebshop@gmail.com' && password === 'Fiacre-19') {
    sendSuccess(res, 200, 'Connexion réussie (mode démo)', {
      user: {
        id: 'demo-admin',
        name: 'Admin Demo',
        email: 'mirebshop@gmail.com',
        role: 'admin'
      },
      token: 'demo-jwt-token-not-secure',
      note: 'Token de démonstration - Connectez MongoDB pour la vraie authentification'
    });
  } else {
    sendError(res, 401, 'Email ou mot de passe incorrect');
  }
});

// Route pour toutes les autres demandes auth
app.all('/api/auth/*', (req, res) => {
  res.json({
    success: false,
    message: 'Authentification complète nécessite MongoDB',
    demo: true,
    action: 'Configurez MongoDB et utilisez npm run dev pour l\'authentification complète'
  });
});

// Gestion des routes non trouvées
app.all('*', (req, res) => {
  sendError(res, 404, `Route ${req.originalUrl} non trouvée`);
});

// Gestion des erreurs
app.use((error, req, res, next) => {
  console.error('❌ Erreur:', error.message);
  sendError(res, 500, 'Erreur interne du serveur (mode démo)');
});

// Démarrage du serveur
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`
🎯 SERVEUR MIREB COMMERCIAL (MODE DÉMONSTRATION)
📍 Port: ${PORT}
🌍 Environnement: demo
📝 API: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/health

⚠️  MODE DÉMONSTRATION ACTIF
   - Produits: Fonctionnel ✅
   - Leads: Fonctionnel ✅ (temporaire)
   - Auth: Basique ⚡ (demo seulement)
   
🗄️  Pour activer toutes les fonctionnalités:
   1. Configurez MongoDB (Atlas recommandé)
   2. Modifiez MONGODB_URI dans .env
   3. Lancez: npm run seed
   4. Redémarrez avec: npm run dev

🔗 MongoDB Atlas: https://cloud.mongodb.com/
🎯 Prêt pour les tests!
  `);
});

process.on('SIGTERM', () => {
  console.log('👋 Arrêt du serveur demo...');
  server.close(() => process.exit(0));
});

module.exports = app;
