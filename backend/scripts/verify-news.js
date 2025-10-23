require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const News = require('../models/News');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura';

const verifyNews = async () => {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const news = await News.find().sort({ fechaPublicacion: -1 });
    
    console.log(`📊 Total de noticias en BD: ${news.length}\n`);
    
    if (news.length === 0) {
      console.log('❌ No hay noticias en la base de datos');
    } else {
      console.log('📰 Noticias encontradas:\n');
      news.forEach((n, index) => {
        console.log(`${index + 1}. ${n.titulo}`);
        console.log(`   ID: ${n._id}`);
        console.log(`   Categoría: ${n.categoria}`);
        console.log(`   Publicado: ${n.publicado ? 'Sí' : 'No'}`);
        console.log(`   Fecha: ${n.fechaPublicacion.toLocaleDateString('es-ES')}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

verifyNews();
