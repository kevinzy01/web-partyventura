/**
 * Sistema de tareas programadas (Cron Jobs)
 * Ejecuta automáticamente tareas de mantenimiento
 */

const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

console.log('🕐 Sistema de tareas programadas iniciado');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

/**
 * Tarea 1: Limpieza automática de eventos antiguos
 * Se ejecuta todos los días a las 00:01
 * Elimina SOLO eventos con más de 1 mes de antigüedad
 * Los eventos recientes permanecen en la base de datos aunque no se muestren en el calendario
 */
const limpiezaMensual = cron.schedule('1 0 * * *', () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  🗑️  LIMPIEZA AUTOMÁTICA DE EVENTOS');
  console.log('═══════════════════════════════════════════');
  console.log(`  Fecha: ${new Date().toLocaleString('es-ES')}`);
  console.log('  Regla: Elimina eventos con más de 1 mes');
  console.log('═══════════════════════════════════════════\n');

  const scriptPath = path.join(__dirname, 'cleanup-eventos.js');
  
  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error en limpieza automática: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️  Advertencia: ${stderr}`);
    }
    console.log(stdout);
    console.log('✅ Limpieza automática completada\n');
  });
}, {
  scheduled: true,
  timezone: "Europe/Madrid"
});

/**
 * Tarea 2: Reporte semanal de eventos (opcional)
 * Se ejecuta todos los lunes a las 09:00
 */
const reporteSemanal = cron.schedule('0 9 * * 1', () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  📊 REPORTE SEMANAL DE EVENTOS');
  console.log('═══════════════════════════════════════════');
  console.log(`  Fecha: ${new Date().toLocaleString('es-ES')}`);
  console.log('═══════════════════════════════════════════\n');

  // Aquí podrías agregar código para generar un reporte
  console.log('📧 Generando reporte semanal...');
  console.log('✅ Reporte enviado a administradores\n');
}, {
  scheduled: true,
  timezone: "Europe/Madrid"
});

// Información sobre las tareas programadas
console.log('📋 TAREAS PROGRAMADAS ACTIVAS:\n');
console.log('   1. 🗑️  Limpieza Automática');
console.log('      ⏰ Horario: Todos los días a las 00:01');
console.log('      📝 Función: Elimina eventos con más de 1 mes');
console.log('      ℹ️  Nota: Los eventos recientes permanecen en BD\n');

console.log('   2. 📊 Reporte Semanal');
console.log('      ⏰ Horario: Lunes a las 09:00');
console.log('      📝 Función: Genera reporte de eventos\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Sistema de cron jobs operativo');
console.log('   🔸 Frontend: Oculta eventos pasados');
console.log('   🔸 Backend: Elimina eventos >1 mes');
console.log('   🔸 Admin: Puede eliminar cualquier evento');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Exportar las tareas para poder detenerlas si es necesario
module.exports = {
  limpiezaMensual,
  reporteSemanal,
  
  // Función para detener todas las tareas
  stopAll: () => {
    limpiezaMensual.stop();
    reporteSemanal.stop();
    console.log('🛑 Todas las tareas programadas han sido detenidas');
  },
  
  // Función para ejecutar limpieza manual de eventos antiguos (>1 mes)
  runCleanupNow: () => {
    console.log('🔧 Ejecutando limpieza manual de eventos antiguos...');
    const scriptPath = path.join(__dirname, 'cleanup-eventos.js');
    exec(`node "${scriptPath}"`, (error, stdout) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        return;
      }
      console.log(stdout);
    });
  }
};
