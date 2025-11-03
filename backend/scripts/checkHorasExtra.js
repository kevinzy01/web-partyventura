const mongoose = require('mongoose');
const WorkSchedule = require('../models/WorkSchedule');

mongoose.connect('mongodb://localhost:27017/partyventura')
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    
    const horariosExtra = await WorkSchedule.find({ color: '#10b981' })
      .populate('empleado', 'nombre username rolEmpleado')
      .sort({ fecha: -1 });
    
    console.log('\n📊 Horarios EXTRA encontrados:', horariosExtra.length);
    
    if (horariosExtra.length === 0) {
      console.log('❌ No hay horarios con color #10b981 en la base de datos');
    } else {
      console.log('\n🕒 Detalles:');
      horariosExtra.forEach((h, idx) => {
        console.log(`\n${idx + 1}. ${h.empleadoNombre}`);
        console.log(`   Fecha: ${h.fecha.toISOString().split('T')[0]}`);
        console.log(`   Turno: ${h.turno}`);
        console.log(`   Horario: ${h.horaInicio} - ${h.horaFin}`);
        console.log(`   Color: ${h.color}`);
        console.log(`   Estado: ${h.estado}`);
        console.log(`   Notas: ${h.notas}`);
      });
    }
    
    // Verificar TODOS los horarios de noviembre 2025
    console.log('\n\n📅 Todos los horarios de Noviembre 2025:');
    const todosNoviembre = await WorkSchedule.find({
      fecha: {
        $gte: new Date('2025-11-01'),
        $lte: new Date('2025-11-30')
      }
    })
    .populate('empleado', 'nombre username rolEmpleado')
    .sort({ fecha: 1 });
    
    console.log(`Total: ${todosNoviembre.length}`);
    todosNoviembre.forEach((h, idx) => {
      console.log(`\n${idx + 1}. ${h.empleadoNombre || 'N/A'}`);
      console.log(`   Fecha: ${h.fecha.toISOString().split('T')[0]}`);
      console.log(`   Turno: ${h.turno}`);
      console.log(`   Color: ${h.color}`);
      console.log(`   Estado: ${h.estado}`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
