// Script de prueba para verificar el sistema de control horario
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const TimeRecord = require('../models/TimeRecord');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura';

async function testTimeRecords() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // 1. Verificar empleados
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣  VERIFICANDO EMPLEADOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const empleados = await Admin.find({ rol: 'empleado' });
    console.log(`Total de empleados: ${empleados.length}`);
    
    empleados.forEach(emp => {
      console.log(`  • ${emp.nombre || emp.username} (${emp.email})`);
    });
    
    // 2. Verificar registros
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣  VERIFICANDO REGISTROS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const totalRegistros = await TimeRecord.countDocuments();
    console.log(`Total de registros: ${totalRegistros}`);
    
    if (totalRegistros > 0) {
      const registrosRecientes = await TimeRecord.find()
        .sort({ fecha: -1 })
        .limit(5)
        .populate('empleado', 'nombre username');
      
      console.log('\n📋 Últimos 5 registros:');
      registrosRecientes.forEach((r, i) => {
        const fecha = new Date(r.fecha);
        const empleadoNombre = r.empleado?.nombre || r.empleado?.username || 'Desconocido';
        console.log(`  ${i + 1}. ${empleadoNombre} - ${r.tipo.toUpperCase()} - ${fecha.toLocaleString('es-ES')}`);
        if (r.horasTrabajadas) {
          console.log(`     ⏰ Horas trabajadas: ${r.horasTrabajadas.toFixed(2)}h`);
        }
      });
    }
    
    // 3. Resumen de hoy
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3️⃣  REGISTROS DE HOY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const registrosHoy = await TimeRecord.find({
      fecha: { $gte: today, $lt: tomorrow }
    }).populate('empleado', 'nombre username');
    
    console.log(`Total registros hoy: ${registrosHoy.length}`);
    
    if (registrosHoy.length > 0) {
      registrosHoy.forEach(r => {
        const hora = new Date(r.fecha).toLocaleTimeString('es-ES');
        const empleadoNombre = r.empleado?.nombre || r.empleado?.username || 'Desconocido';
        const icon = r.tipo === 'entrada' ? '✅' : '🚪';
        console.log(`  ${icon} ${hora} - ${empleadoNombre} - ${r.tipo.toUpperCase()}`);
      });
    }
    
    // 4. Resumen mensual
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4️⃣  RESUMEN DEL MES ACTUAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const mes = today.getMonth() + 1;
    const anio = today.getFullYear();
    console.log(`Mes: ${mes}/${anio}\n`);
    
    for (const empleado of empleados) {
      const resumen = await TimeRecord.getResumenMensual(empleado._id, mes, anio);
      const nombre = empleado.nombre || empleado.username;
      console.log(`👤 ${nombre}:`);
      console.log(`   Total horas: ${resumen.totalHoras.toFixed(2)}h`);
      console.log(`   Días trabajados: ${resumen.totalDias}`);
    }
    
    console.log('\n✅ Prueba completada exitosamente');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testTimeRecords();
