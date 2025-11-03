/**
 * Script de Prueba: Sesión Corta de 8 Segundos
 * 
 * Prueba el fix del bug donde sesiones < 36 segundos (0.01h) no creaban WorkSchedules
 * 
 * Flujo:
 * 1. Limpiar registros de hoy de test_monitor
 * 2. Simular entrada a las 01:15:23
 * 3. Simular salida a las 01:15:31 (8 segundos después)
 * 4. Verificar que se creó TimeRecord con horasTrabajadas = 0.00
 * 5. Verificar que se creó WorkSchedule automático (el fix)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TimeRecord = require('../models/TimeRecord');
const WorkSchedule = require('../models/WorkSchedule');
const Admin = require('../models/Admin');

const empleadoId = '67234c2a3e62c76e1da67ba4'; // test_monitor

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // 1. Verificar que el empleado existe
    const empleado = await Admin.findById(empleadoId);
    if (!empleado) {
      console.error('❌ Empleado no encontrado');
      process.exit(1);
    }
    console.log(`👤 Empleado: ${empleado.nombre} (${empleado.rolEmpleado})\n`);
    
    // 2. Limpiar registros de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const deletedRecords = await TimeRecord.deleteMany({
      empleado: empleadoId,
      fecha: { $gte: hoy }
    });
    
    const deletedSchedules = await WorkSchedule.deleteMany({
      empleado: empleadoId,
      fecha: { $gte: hoy }
    });
    
    console.log(`🧹 Registros eliminados: ${deletedRecords.deletedCount} TimeRecords, ${deletedSchedules.deletedCount} WorkSchedules\n`);
    
    // 3. Crear TimeRecords simulando sesión de 8 segundos
    const entrada = new Date();
    entrada.setHours(1, 15, 23, 0);
    
    const salida = new Date(entrada);
    salida.setSeconds(entrada.getSeconds() + 8); // +8 segundos
    
    const entradaRecord = await TimeRecord.create({
      empleado: empleadoId,
      empleadoNombre: empleado.nombre,
      tipo: 'entrada',
      fecha: entrada,
      notas: '🧪 Test de sesión corta'
    });
    
    console.log(`✅ Entrada creada: ${entrada.toLocaleTimeString('es-ES')}`);
    
    // Calcular horas trabajadas manualmente
    const horasTrabajadas = TimeRecord.calcularHorasTrabajadas(entrada, salida);
    
    const salidaRecord = await TimeRecord.create({
      empleado: empleadoId,
      empleadoNombre: empleado.nombre,
      tipo: 'salida',
      fecha: salida,
      entradaAsociada: entradaRecord._id,
      horasTrabajadas: horasTrabajadas,
      notas: '🧪 Test de sesión corta'
    });
    
    console.log(`🚪 Salida creada: ${salida.toLocaleTimeString('es-ES')}`);
    console.log(`⏱️  Duración: 8 segundos`);
    console.log(`📊 Horas trabajadas: ${horasTrabajadas}h (redondeado a 2 decimales)\n`);
    
    // 4. Esperar un momento y verificar WorkSchedules
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 5. Buscar WorkSchedules de hoy
    const workSchedules = await WorkSchedule.find({
      empleado: empleadoId,
      fecha: { $gte: hoy }
    }).populate('empleado', 'nombre rolEmpleado').sort({ fecha: 1 });
    
    console.log(`\n📅 WorkSchedules encontrados: ${workSchedules.length}\n`);
    
    if (workSchedules.length === 0) {
      console.log('❌ NO SE CREÓ WORKSCHEDULE (BUG NO RESUELTO)\n');
      console.log('CAUSA POSIBLE: verificarYGestionarHorario() no se llamó\n');
    } else {
      workSchedules.forEach((schedule, index) => {
        console.log(`WorkSchedule #${index + 1}:`);
        console.log(`  📅 Fecha: ${schedule.fecha.toISOString().split('T')[0]}`);
        console.log(`  ⏰ Horario: ${schedule.horaInicio} - ${schedule.horaFin}`);
        console.log(`  🕐 Turno: ${schedule.turno}`);
        console.log(`  ⏱️  Horas: ${schedule.horasTotales}h`);
        console.log(`  📊 Estado: ${schedule.estado}`);
        console.log(`  🎨 Color: ${schedule.color}`);
        console.log(`  📝 Notas: ${schedule.notas || 'Sin notas'}`);
        
        // Detectar si es auto-creado
        const isAutoCreated = schedule.notas && schedule.notas.includes('🤖');
        console.log(`  ${isAutoCreated ? '🤖 AUTO-CREADO (FIX FUNCIONA ✅)' : '👤 MANUAL'}`);
        console.log('');
      });
      
      console.log('✅ FIX FUNCIONÓ: WorkSchedule creado para sesión de 8 segundos\n');
    }
    
    // 6. Resumen final
    console.log('═══════════════════════════════════════');
    console.log('RESUMEN DEL TEST');
    console.log('═══════════════════════════════════════');
    console.log(`Entrada:          ${entrada.toLocaleTimeString('es-ES')}`);
    console.log(`Salida:           ${salida.toLocaleTimeString('es-ES')}`);
    console.log(`Duración:         8 segundos`);
    console.log(`Horas calculadas: ${horasTrabajadas}h`);
    console.log(`WorkSchedules:    ${workSchedules.length} creados`);
    console.log(`Resultado:        ${workSchedules.length > 0 ? '✅ FIX EXITOSO' : '❌ BUG PERSISTE'}`);
    console.log('═══════════════════════════════════════\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error en test:', error);
    process.exit(1);
  }
}

runTest();
