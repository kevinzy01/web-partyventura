require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const News = require('../models/News');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura';

// Crear slug
const createSlug = (titulo) => {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

const createSampleNews = async () => {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existen noticias
    const existingNews = await News.countDocuments();
    console.log(`📊 Noticias actuales en BD: ${existingNews}`);

    // Crear noticias de ejemplo
    const sampleNews = [
      {
        titulo: 'Inauguración de nueva sala de eventos',
        slug: createSlug('Inauguración de nueva sala de eventos'),
        resumen: 'Descubre nuestra nueva sala totalmente renovada con capacidad para 200 personas y las últimas tecnologías en sonido e iluminación.',
        contenido: `
          <h2>Nueva Sala de Eventos Partyventura</h2>
          <p>Nos complace anunciar la inauguración de nuestra nueva sala de eventos, completamente renovada y equipada con la última tecnología.</p>
          
          <h3>Características principales:</h3>
          <ul>
            <li>Capacidad para 200 personas</li>
            <li>Sistema de sonido profesional de última generación</li>
            <li>Iluminación LED programable con efectos especiales</li>
            <li>Aire acondicionado central</li>
            <li>Barra completa y zona de catering</li>
            <li>Baños renovados y accesibles</li>
          </ul>

          <p>La nueva sala está disponible para todo tipo de eventos: cumpleaños, bodas, eventos corporativos, conciertos y mucho más.</p>
          
          <p><strong>¡Reserva ahora y obtén un 20% de descuento en tu primera celebración!</strong></p>
        `,
        categoria: 'eventos',
        imagenDestacada: '/uploads/sample-sala.jpg',
        publicado: true,
        fechaPublicacion: new Date()
      },
      {
        titulo: 'Promoción especial de verano',
        slug: createSlug('Promoción especial de verano'),
        resumen: 'Aprovecha nuestras ofertas de verano: descuentos de hasta el 30% en reservas para eventos entre julio y agosto.',
        contenido: `
          <h2>Ofertas de Verano en Partyventura</h2>
          <p>Este verano, celebra tus eventos con descuentos increíbles.</p>
          
          <h3>Promociones disponibles:</h3>
          <ul>
            <li>30% de descuento en eventos de lunes a jueves</li>
            <li>20% de descuento en fines de semana</li>
            <li>Decoración temática incluida sin costo adicional</li>
            <li>2 horas extras gratis en reservas de más de 6 horas</li>
          </ul>

          <p>La promoción es válida para reservas realizadas durante julio y agosto de 2025.</p>
          
          <p><strong>Términos y condiciones aplican. Reserva sujeta a disponibilidad.</strong></p>
        `,
        categoria: 'promociones',
        imagenDestacada: '/uploads/sample-promocion.jpg',
        publicado: true,
        fechaPublicacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Hace 2 días
      },
      {
        titulo: 'Nuevos paquetes personalizados para bodas',
        slug: createSlug('Nuevos paquetes personalizados para bodas'),
        resumen: 'Haz realidad la boda de tus sueños con nuestros nuevos paquetes todo incluido, diseñados especialmente para ti.',
        contenido: `
          <h2>Paquetes de Boda Partyventura</h2>
          <p>Celebra el día más importante de tu vida en nuestras instalaciones con paquetes personalizados.</p>
          
          <h3>Incluye:</h3>
          <ul>
            <li>Coordinador de eventos dedicado</li>
            <li>Decoración floral personalizada</li>
            <li>Menú de 5 tiempos con opciones vegetarianas</li>
            <li>Barra libre de 5 horas</li>
            <li>DJ profesional o banda en vivo</li>
            <li>Fotografía y video profesional</li>
            <li>Pastel de boda de diseño exclusivo</li>
          </ul>

          <p>Agenda una cita con nuestros coordinadores para conocer más detalles y personalizar tu paquete.</p>
          
          <p><strong>Consulta disponibilidad y precios contactándonos directamente.</strong></p>
        `,
        categoria: 'eventos',
        imagenDestacada: '/uploads/sample-boda.jpg',
        publicado: true,
        fechaPublicacion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // Hace 5 días
      }
    ];

    console.log(`\n📝 Creando ${sampleNews.length} noticias de ejemplo...\n`);

    for (const newsData of sampleNews) {
      const news = await News.create(newsData);
      console.log(`✅ Noticia creada: "${news.titulo}" (ID: ${news._id})`);
    }

    console.log(`\n✨ ¡${sampleNews.length} noticias de ejemplo creadas exitosamente!`);
    console.log(`📊 Total de noticias en BD: ${await News.countDocuments()}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear noticias de ejemplo:', error);
    process.exit(1);
  }
};

// Ejecutar
createSampleNews();
