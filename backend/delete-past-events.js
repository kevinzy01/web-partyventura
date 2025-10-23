/**
 * Script para eliminar eventos anteriores al día de hoy
 * (pero mantiene los del último mes para historial)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

// Conectar a la base de datos
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura';

async function eliminarEventosAnterioresHoy() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    console.log('🗑️  Eliminando eventos anteriores al día de hoy...\n');

    // Fecha de hoy a las 00:00
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    console.log(`📅 Fecha actual: ${hoy.toLocaleDateString('es-ES')}`);
    console.log(`   (Se eliminarán eventos que finalizaron antes de hoy)\n`);

    // Buscar eventos anteriores a hoy
    const eventosAnteriores = await Event.find({
      endDate: { $lt: hoy }
    }).sort({ startDate: 1 });

    if (eventosAnteriores.length === 0) {
      console.log('✨ No hay eventos anteriores a hoy para eliminar.\n');
    } else {
      console.log(`🔍 Encontrados ${eventosAnteriores.length} eventos anteriores:\n`);
      
      // Mostrar eventos que se van a eliminar
      eventosAnteriores.forEach((evento, index) => {
        const fecha = new Date(evento.startDate);
        console.log(`   ${index + 1}. ${evento.title}`);
        console.log(`      📅 Fecha: ${fecha.toLocaleDateString('es-ES')} ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`);
        console.log(`      🎭 Tipo: ${evento.eventType}`);
        console.log(`      📊 Estado: ${evento.status}`);
        console.log('');
      });

      // Eliminar eventos
      const resultado = await Event.deleteMany({
        endDate: { $lt: hoy }
      });

      console.log(`✅ ${resultado.deletedCount} eventos eliminados exitosamente.\n`);
    }

    // Estadísticas finales
    const totalEventos = await Event.countDocuments();
    const eventosHoy = await Event.countDocuments({
      startDate: { $gte: hoy, $lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000) }
    });
    const eventosFuturos = await Event.countDocuments({
      startDate: { $gte: new Date(hoy.getTime() + 24 * 60 * 60 * 1000) }
    });

    console.log('📊 ESTADO ACTUAL DE LA BASE DE DATOS:\n');
    console.log(`   📍 Total de eventos: ${totalEventos}`);
    console.log(`   📅 Eventos de hoy: ${eventosHoy}`);
    console.log(`   🔮 Eventos futuros: ${eventosFuturos}`);
    console.log('');

    // Mostrar próximos eventos
    if (eventosHoy > 0 || eventosFuturos > 0) {
      console.log('🎯 PRÓXIMOS EVENTOS:\n');
      const proximosEventos = await Event.find({
        startDate: { $gte: hoy }
      }).sort({ startDate: 1 }).limit(5);

      proximosEventos.forEach((evento, index) => {
        const fecha = new Date(evento.startDate);
        const esHoy = fecha.toDateString() === hoy.toDateString();
        console.log(`   ${index + 1}. ${evento.title} ${esHoy ? '(HOY)' : ''}`);
        console.log(`      📅 ${fecha.toLocaleDateString('es-ES')} a las ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`);
        console.log('');
      });
    }

    console.log('✨ Proceso completado exitosamente.\n');

  } catch (error) {
    console.error('❌ Error durante la eliminación:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar
console.log('═══════════════════════════════════════════════════');
console.log('      ELIMINAR EVENTOS ANTERIORES A HOY           ');
console.log('═══════════════════════════════════════════════════');
console.log(`   Ejecutado: ${new Date().toLocaleString('es-ES')}`);
console.log('═══════════════════════════════════════════════════\n');

eliminarEventosAnterioresHoy();
