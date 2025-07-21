# Mireb Commercial - Backend API

API REST sécurisée pour l'application e-commerce Mireb Commercial, construite avec Node.js, Express et MongoDB.

## 🚀 Fonctionnalités

- **Authentification JWT** sécurisée avec hachage bcrypt
- **Gestion des produits** complète (CRUD)
- **Système de leads** pour la capture de prospects
- **API REST** avec validation des données
- **Base de données MongoDB** avec Mongoose
- **Sécurité** avec Helmet, CORS, Rate Limiting
- **Documentation** des endpoints
- **Prêt pour le déploiement** (Vercel, Heroku, AWS)

## 📁 Structure du projet

```
backend/
├── src/
│   ├── controllers/     # Logique métier
│   ├── models/         # Modèles MongoDB
│   ├── routes/         # Définition des routes
│   ├── middleware/     # Middlewares custom
│   ├── config/         # Configuration (DB, etc.)
│   └── utils/          # Utilitaires et helpers
├── .env               # Variables d'environnement
├── server.js          # Point d'entrée
└── package.json       # Dépendances et scripts
```

## 🛠️ Installation et démarrage

### 1. Installation des dépendances

```bash
cd backend
npm install
```

### 2. Configuration de l'environnement

Copiez le fichier `.env` et modifiez les variables selon vos besoins :

```bash
# Configuration de base
NODE_ENV=development
PORT=3001

# Base de données MongoDB
MONGODB_URI=mongodb://localhost:27017/mireb_commercial

# JWT Secret
JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000
```

### 3. Démarrage de MongoDB

Assurez-vous que MongoDB est installé et en cours d'exécution :

```bash
# Sur macOS avec Homebrew
brew services start mongodb-community

# Sur Linux
sudo systemctl start mongod

# Ou utilisez MongoDB Atlas (cloud)
```

### 4. Initialisation des données

```bash
npm run seed
```

Cette commande va créer :
- Un compte administrateur par défaut
- Des produits de démonstration

### 5. Démarrage du serveur

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

Le serveur sera accessible sur `http://localhost:3001`

## 📚 API Endpoints

### Authentification (`/api/auth`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| POST | `/register` | Inscription | Public |
| POST | `/login` | Connexion | Public |
| GET | `/profile` | Profil utilisateur | Privé |
| PUT | `/profile` | Modifier profil | Privé |
| PUT | `/change-password` | Changer mot de passe | Privé |
| GET | `/verify` | Vérifier token | Privé |
| POST | `/logout` | Déconnexion | Privé |
| GET | `/users` | Liste utilisateurs | Admin |

### Produits (`/api/products`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/` | Liste des produits | Public |
| GET | `/:id` | Détail d'un produit | Public |
| GET | `/search` | Recherche | Public |
| GET | `/popular` | Produits populaires | Public |
| GET | `/featured` | Produits vedettes | Public |
| GET | `/categories/stats` | Stats catégories | Public |
| POST | `/` | Créer produit | Admin |
| PUT | `/:id` | Modifier produit | Admin |
| DELETE | `/:id` | Supprimer produit | Admin |
| PATCH | `/:id/stock` | Mettre à jour stock | Admin |

### Leads (`/api/leads`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| POST | `/` | Créer un lead | Public |
| GET | `/` | Liste des leads | Admin |
| GET | `/:id` | Détail d'un lead | Admin |
| PUT | `/:id` | Modifier lead | Admin |
| DELETE | `/:id` | Supprimer lead | Admin |
| GET | `/stats` | Statistiques | Admin |
| GET | `/my-leads` | Mes leads assignés | Privé |
| PATCH | `/:id/assign` | Assigner lead | Admin |
| PATCH | `/:id/follow-up` | Programmer suivi | Admin |

## 🔒 Sécurité

### Authentification
- Mots de passe hachés avec bcrypt (salt 12)
- Tokens JWT sécurisés avec expiration
- Validation des données d'entrée
- Rate limiting sur les connexions

### Protection API
- Helmet.js pour les headers de sécurité
- CORS configuré
- Rate limiting global
- Validation des paramètres

### Base de données
- Validation Mongoose stricte
- Index pour les performances
- Soft delete pour les données importantes

## 📊 Monitoring et logs

### Logs en développement
```bash
# Le serveur utilise Morgan pour les logs HTTP
GET /api/products 200 15.234 ms - 1024
POST /api/auth/login 200 89.123 ms - 256
```

### Health check
```bash
curl http://localhost:3001/health
```

## 🚀 Déploiement

### Variables d'environnement de production

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mireb
JWT_SECRET=super_secret_key_production
FRONTEND_URL=https://votresite.com
```

### Déploiement sur Vercel

1. Connectez votre repository GitHub
2. Configurez les variables d'environnement
3. Déployez automatiquement

```bash
npm i -g vercel
vercel --prod
```

### Déploiement sur Heroku

```bash
# Créer app Heroku
heroku create mireb-api

# Configurer MongoDB Atlas
heroku addons:create mongolab:sandbox

# Variables d'environnement
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=votre_secret

# Déployer
git push heroku main
```

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec coverage
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 📝 Développement

### Ajout d'un nouveau endpoint

1. Créer le contrôleur dans `src/controllers/`
2. Ajouter les validations dans `src/middleware/validation.js`
3. Définir la route dans `src/routes/`
4. Tester l'endpoint

### Structure d'une réponse API

```json
{
  "success": true,
  "message": "Données récupérées avec succès",
  "data": { ... },
  "meta": {
    "pagination": { ... }
  },
  "timestamp": "2025-01-21T10:00:00.000Z"
}
```

### Gestion d'erreurs

```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    {
      "field": "email",
      "message": "Email requis",
      "value": ""
    }
  ],
  "timestamp": "2025-01-21T10:00:00.000Z"
}
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Email: mirebshop@gmail.com
- WhatsApp: +243842267252

---

**Développé avec ❤️ pour Mireb Commercial**
