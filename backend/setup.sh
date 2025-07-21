#!/bin/bash

echo "🚀 Configuration du Backend Mireb Commercial"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    echo "✅ Dépendances installées"
else
    echo "✅ Dépendances déjà installées"
fi

echo ""
echo "🗃️  Configuration de la base de données"
echo ""
echo "Pour ce projet, vous avez plusieurs options :"
echo ""
echo "1️⃣  MongoDB Atlas (Recommandé - Cloud gratuit)"
echo "   - Créez un compte sur https://cloud.mongodb.com/"
echo "   - Créez un cluster gratuit"
echo "   - Obtenez votre URI de connexion"
echo "   - Modifiez MONGODB_URI dans le fichier .env"
echo ""
echo "2️⃣  MongoDB Local"
echo "   - Installez MongoDB Community Edition"
echo "   - Démarrez le service MongoDB"
echo "   - Utilisez: mongodb://localhost:27017/mireb_commercial"
echo ""
echo "3️⃣  Docker MongoDB"
echo "   docker run -d -p 27017:27017 --name mongodb mongo:latest"
echo ""

# Créer les dossiers de logs si nécessaires
mkdir -p logs

# Afficher les informations de démarrage
echo "📝 Instructions de démarrage :"
echo ""
echo "1. Configurez votre base de données MongoDB"
echo "2. Modifiez le fichier .env avec vos paramètres"
echo "3. Initialisez les données : npm run seed"
echo "4. Démarrez le serveur : npm run dev"
echo ""
echo "🌐 Le serveur sera accessible sur : http://localhost:3001"
echo "📚 Documentation API : http://localhost:3001"
echo "🏥 Health check : http://localhost:3001/health"
echo ""
echo "👤 Compte admin par défaut :"
echo "   Email: mirebshop@gmail.com"
echo "   Mot de passe: Fiacre-19"
echo ""
echo "🔗 Liens utiles :"
echo "   - MongoDB Atlas: https://cloud.mongodb.com/"
echo "   - MongoDB Community: https://www.mongodb.com/try/download/community"
echo "   - Documentation: ./README.md"
echo ""

# Test de connectivité basique
echo "🧪 Test des modules Node.js..."
node -e "
try {
  require('express');
  require('mongoose');
  require('bcryptjs');
  require('jsonwebtoken');
  console.log('✅ Tous les modules principaux sont disponibles');
} catch (error) {
  console.log('❌ Erreur de module:', error.message);
  process.exit(1);
}
"

echo ""
echo "✅ Configuration terminée !"
echo "📋 Prochaines étapes :"
echo "   1. Configurez votre base de données MongoDB"
echo "   2. Lancez: npm run seed (après avoir configuré MongoDB)"
echo "   3. Lancez: npm run dev"
