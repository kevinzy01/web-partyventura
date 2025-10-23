/**
 * Script de limpieza automática de eventos
 * - Elimina eventos con más de 1 mes de antigüedad de la base de datos
 * - Se debe ejecutar diariamente a las 00:01 mediante un cron job
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

// Conectar a la base de datos
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura';

async function limpiarEventosAntiguos() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    console.log('🗑️  Iniciando limpieza de eventos antiguos...\n');

    // Calcular fecha límite (hace 1 mes)
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() - 1);
    fechaLimite.setHours(0, 0, 0, 0);

    console.log(`📅 Fecha límite: ${fechaLimite.toLocaleDateString('es-ES')}`);
    console.log(`   (Se eliminarán eventos anteriores a esta fecha)\n`);

    // Buscar eventos antiguos
    const eventosAntiguos = await Event.find({
      endDate: { $lt: fechaLimite }
    });

    if (eventosAntiguos.length === 0) {
      console.log('✨ No hay eventos antiguos para eliminar.');
      console.log('   La base de datos está limpia.\n');
    } else {
      console.log(`🔍 Encontrados ${eventosAntiguos.length} eventos para eliminar:\n`);
      
      // Mostrar eventos que se van a eliminar
      eventosAntiguos.forEach((evento, index) => {
        const fecha = new Date(evento.startDate);
        console.log(`   ${index + 1}. ${evento.title}`);
        console.log(`      Fecha: ${fecha.toLocaleDateString('es-ES')}`);
        console.log(`      Tipo: ${evento.eventType}`);
        console.log(`      Estado: ${evento.status}`);
        console.log('');
      });

      // Eliminar eventos
      const resultado = await Event.deleteMany({
        endDate: { $lt: fechaLimite }
      });

      console.log(`✅ ${resultado.deletedCount} eventos eliminados exitosamente.\n`);
    }

    // Estadísticas finales
    const totalEventos = await Event.countDocuments();
    const eventosFuturos = await Event.countDocuments({
      startDate: { $gte: new Date() }
    });
    const eventosPasadosRecientes = await Event.countDocuments({
      endDate: { $lt: new Date(), $gte: fechaLimite }
    });

    console.log('📊 ESTADO ACTUAL DE LA BASE DE DATOS:\n');
    console.log(`   📍 Total de eventos: ${totalEventos}`);
    console.log(`   📅 Eventos futuros: ${eventosFuturos}`);
    console.log(`   ⏳ Eventos pasados (último mes): ${eventosPasadosRecientes}`);
    console.log('');

    console.log('✨ Limpieza completada exitosamente.\n');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar limpieza
console.log('═══════════════════════════════════════════════════');
console.log('   LIMPIEZA AUTOMÁTICA DE EVENTOS - PARTYVENTURA   ');
console.log('═══════════════════════════════════════════════════');
console.log(`   Fecha: ${new Date().toLocaleString('es-ES')}`);
console.log('═══════════════════════════════════════════════════\n');

limpiarEventosAntiguos();
