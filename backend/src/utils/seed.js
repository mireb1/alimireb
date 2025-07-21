require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Product = require('../models/Product');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB pour le seeding');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

const seedAdmin = async () => {
  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ 
      email: 'mirebcommercial@gmail.com' 
    });

    if (existingAdmin) {
      console.log('👤 Administrateur déjà existant');
      return existingAdmin;
    }

    // Créer l'administrateur par défaut
    const admin = await User.create({
      name: 'Administrateur Mireb',
      email: 'mirebcommercial@gmail.com',
      password: 'Fiacre-19',
      role: 'admin',
      isActive: true
    });

    console.log('✅ Administrateur créé:', admin.email);
    return admin;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
  }
};

const seedProducts = async (adminId) => {
  try {
    // Vérifier si des produits existent déjà
    const existingProducts = await Product.countDocuments();
    
    if (existingProducts > 0) {
      console.log('📦 Produits déjà existants:', existingProducts);
      return;
    }

    // Produits de démonstration
    const sampleProducts = [
      {
        nom: 'Smartphone Samsung Galaxy A24',
        prix: 299,
        images: [
          'https://via.placeholder.com/600x400?text=Samsung+Galaxy+A24',
          'https://via.placeholder.com/600x400?text=Samsung+A24+Back'
        ],
        categorie: 'Électronique',
        stock: 15,
        description: '<p>Smartphone <b>Samsung Galaxy A24</b> avec écran 6,5" Super AMOLED, appareil photo 50MP, batterie 5000mAh et stockage 128GB.</p><ul><li>Écran 6,5" Super AMOLED</li><li>Appareil photo principal 50MP</li><li>Batterie 5000mAh</li><li>128GB de stockage</li><li>Android 13</li></ul>',
        featured: true,
        createdBy: adminId
      },
      {
        nom: 'Robe Africaine Wax Premium',
        prix: 45,
        images: [
          'https://via.placeholder.com/600x400?text=Robe+Wax+Africaine',
          'https://via.placeholder.com/600x400?text=Robe+Wax+Detail'
        ],
        categorie: 'Mode',
        stock: 30,
        description: '<p>Magnifique <b>robe africaine</b> en tissu wax 100% coton. Design traditionnel moderne, taille unique ajustable.</p><ul><li>Tissu wax 100% coton</li><li>Design traditionnel</li><li>Taille unique (S-XL)</li><li>Lavable en machine</li><li>Origine: Afrique de l\'Ouest</li></ul>',
        featured: true,
        createdBy: adminId
      },
      {
        nom: 'Casque Audio Bluetooth Premium',
        prix: 89,
        images: [
          'https://via.placeholder.com/600x400?text=Casque+Bluetooth',
          'https://via.placeholder.com/600x400?text=Casque+Detail'
        ],
        categorie: 'Électronique',
        stock: 25,
        description: '<p><b>Casque audio Bluetooth</b> haute qualité avec réduction de bruit active et autonomie 30h.</p><ul><li>Bluetooth 5.0</li><li>Réduction de bruit active</li><li>Autonomie 30 heures</li><li>Charge rapide</li><li>Microphone intégré</li></ul>',
        featured: false,
        createdBy: adminId
      },
      {
        nom: 'Ensemble de Cuisine 12 Pièces',
        prix: 120,
        images: [
          'https://via.placeholder.com/600x400?text=Ensemble+Cuisine',
          'https://via.placeholder.com/600x400?text=Ustensiles+Detail'
        ],
        categorie: 'Maison & Jardin',
        stock: 18,
        description: '<p><b>Ensemble complet</b> d\'ustensiles de cuisine en acier inoxydable, 12 pièces essentielles.</p><ul><li>Acier inoxydable premium</li><li>12 pièces essentielles</li><li>Résistant à la corrosion</li><li>Passe au lave-vaisselle</li><li>Garantie 2 ans</li></ul>',
        featured: false,
        createdBy: adminId
      },
      {
        nom: 'Parfum Unisexe Luxury',
        prix: 65,
        images: [
          'https://via.placeholder.com/600x400?text=Parfum+Luxury',
          'https://via.placeholder.com/600x400?text=Parfum+Bottle'
        ],
        categorie: 'Santé & Beauté',
        stock: 40,
        description: '<p><b>Parfum unisexe</b> aux notes florales et boisées, longue tenue 8-10 heures.</p><ul><li>Notes de tête: bergamote, citron</li><li>Notes de cœur: jasmin, rose</li><li>Notes de fond: cèdre, musc</li><li>Tenue: 8-10 heures</li><li>Flacon 100ml</li></ul>',
        featured: false,
        createdBy: adminId
      },
      {
        nom: 'Chaussures de Sport Running',
        prix: 75,
        images: [
          'https://via.placeholder.com/600x400?text=Chaussures+Sport',
          'https://via.placeholder.com/600x400?text=Running+Shoes'
        ],
        categorie: 'Sports & Loisirs',
        stock: 35,
        description: '<p><b>Chaussures de running</b> légères et respirantes, idéales pour le sport et la marche quotidienne.</p><ul><li>Semelle amortissante</li><li>Matière respirante</li><li>Design ergonomique</li><li>Disponible du 38 au 46</li><li>Antidérapant</li></ul>',
        featured: false,
        createdBy: adminId
      }
    ];

    // Insérer les produits
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ ${products.length} produits de démonstration créés`);

    return products;
  } catch (error) {
    console.error('❌ Erreur lors de la création des produits:', error);
  }
};

const seedData = async () => {
  console.log('🌱 Démarrage du seeding...');
  
  try {
    await connectDB();
    
    // Créer l'admin
    const admin = await seedAdmin();
    
    // Créer les produits de démonstration
    if (admin) {
      await seedProducts(admin._id);
    }
    
    console.log('✅ Seeding terminé avec succès!');
    console.log(`
📊 Données créées:
- Admin: ${process.env.DEFAULT_ADMIN_EMAIL || 'mirebshop@gmail.com'}
- Mot de passe: ${process.env.DEFAULT_ADMIN_PASSWORD || 'Fiacre-19'}
- Produits de démonstration ajoutés

🚀 Vous pouvez maintenant démarrer le serveur avec: npm run dev
    `);
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
};

// Exécuter le seeding si appelé directement
if (require.main === module) {
  seedData();
}

module.exports = { seedData, seedAdmin, seedProducts };
