/**
 * Script de Prueba REAL: Test del Fix de Sesiones Cortas
 * 
 * Este script SIMULA una petición HTTP al controlador, NO crea registros directamente.
 * Así podemos probar que el fix en timeRecordController.js funciona correctamente.
 * 
 * IMPORTANTE: Este script requiere que el servidor esté APAGADO.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const timeRecordController = require('../controllers/timeRecordController');
const Admin = require('../models/Admin');
const TimeRecord = require('../models/TimeRecord');
const WorkSchedule = require('../models/WorkSchedule');

const empleadoId = '69050a1d17606e3345b6a869'; // test_monitor

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // 1. Verificar empleado
    const empleado = await Admin.findById(empleadoId);
    if (!empleado) {
      console.error('❌ Empleado no encontrado');
      process.exit(1);
    }
    console.log(`👤 Empleado: ${empleado.nombre} (${empleado.rolEmpleado})\n`);
    
    // 2. Limpiar registros de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    await TimeRecord.deleteMany({ empleado: empleadoId, fecha: { $gte: hoy } });
    await WorkSchedule.deleteMany({ empleado: empleadoId, fecha: { $gte: hoy } });
    console.log('🧹 Registros de hoy limpiados\n');
    
    // 3. Mock de req/res para simular petición HTTP
    const mockReq = (tipo, notas = '') => ({
      user: { _id: empleadoId },
      body: { tipo, notas }
    });
    
    const mockRes = () => {
      const res = {};
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.jsonData = data;
        return res;
      };
      return res;
    };
    
    console.log('═══════════════════════════════════════');
    console.log('TEST: Sesión de 8 segundos');
    console.log('═══════════════════════════════════════\n');
    
    // 4. Simular ENTRADA
    console.log('📍 PASO 1: Fichar Entrada');
    const entradaReq = mockReq('entrada', '🧪 Test sesión corta - entrada');
    const entradaRes = mockRes();
    
    await timeRecordController.registrarTiempo(entradaReq, entradaRes);
    
    if (entradaRes.statusCode === 201) {
      console.log(`✅ Entrada registrada: ${entradaRes.jsonData.data.fecha}`);
      console.log(`   Notas: ${entradaRes.jsonData.data.notas}\n`);
    } else {
      console.error('❌ Error al registrar entrada:', entradaRes.jsonData);
      process.exit(1);
    }
    
    // 5. Esperar 8 segundos
    console.log('⏳ Esperando 8 segundos...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    console.log('✅ 8 segundos transcurridos\n');
    
    // 6. Simular SALIDA
    console.log('📍 PASO 2: Fichar Salida');
    const salidaReq = mockReq('salida', '🧪 Test sesión corta - salida');
    const salidaRes = mockRes();
    
    await timeRecordController.registrarTiempo(salidaReq, salidaRes);
    
    if (salidaRes.statusCode === 201) {
      const registro = salidaRes.jsonData.data;
      console.log(`✅ Salida registrada: ${registro.fecha}`);
      console.log(`   Horas trabajadas: ${registro.horasTrabajadas}h`);
      console.log(`   Notas: ${registro.notas}`);
      
      // 7. Verificar si se creó WorkSchedule
      if (salidaRes.jsonData.verificacionHorario) {
        console.log(`\n🤖 VERIFICACIÓN DE HORARIO:`);
        console.log(`   Estado: ${salidaRes.jsonData.verificacionHorario.estado}`);
        console.log(`   Mensaje: ${salidaRes.jsonData.verificacionHorario.mensaje}`);
        
        if (salidaRes.jsonData.verificacionHorario.horario) {
          const horario = salidaRes.jsonData.verificacionHorario.horario;
          console.log(`\n📅 WORKSCHEDULE CREADO:`);
          console.log(`   Turno: ${horario.turno}`);
          console.log(`   Horario: ${horario.horaInicio} - ${horario.horaFin}`);
          console.log(`   Horas: ${horario.horasTotales}h`);
          console.log(`   Estado: ${horario.estado}`);
          console.log(`   Notas: ${horario.notas}`);
        }
      }
      
    } else {
      console.error('❌ Error al registrar salida:', salidaRes.jsonData);
      process.exit(1);
    }
    
    // 8. Verificar en BD directamente
    console.log('\n═══════════════════════════════════════');
    console.log('VERIFICACIÓN EN BASE DE DATOS');
    console.log('═══════════════════════════════════════\n');
    
    const timeRecords = await TimeRecord.find({
      empleado: empleadoId,
      fecha: { $gte: hoy }
    }).sort({ fecha: 1 });
    
    console.log(`📊 TimeRecords: ${timeRecords.length}`);
    timeRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.tipo} - ${record.fecha.toLocaleTimeString('es-ES')} - ${record.horasTrabajadas || '-'}h`);
    });
    
    const workSchedules = await WorkSchedule.find({
      empleado: empleadoId,
      fecha: { $gte: hoy }
    }).sort({ fecha: 1 });
    
    console.log(`\n📅 WorkSchedules: ${workSchedules.length}`);
    workSchedules.forEach((schedule, index) => {
      const isAutoCreated = schedule.notas && schedule.notas.includes('🤖');
      console.log(`   ${index + 1}. ${schedule.turno} (${schedule.horaInicio}-${schedule.horaFin}) - ${schedule.horasTotales}h - ${isAutoCreated ? '🤖 AUTO' : '👤 MANUAL'}`);
      if (schedule.notas) {
        console.log(`      Notas: ${schedule.notas.substring(0, 60)}...`);
      }
    });
    
    console.log('\n═══════════════════════════════════════');
    console.log('RESULTADO FINAL');
    console.log('═══════════════════════════════════════');
    
    if (workSchedules.length > 0) {
      const hasAutoCreated = workSchedules.some(s => s.notas && s.notas.includes('🤖'));
      if (hasAutoCreated) {
        console.log('✅ FIX EXITOSO: WorkSchedule auto-creado para sesión de 8 segundos');
      } else {
        console.log('⚠️  WorkSchedule encontrado pero NO es auto-creado');
      }
    } else {
      console.log('❌ BUG PERSISTE: NO se creó WorkSchedule');
    }
    
    console.log('═══════════════════════════════════════\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error en test:', error);
    process.exit(1);
  }
}

runTest();
