const mongoose = require('mongoose');
require('dotenv').config();

const Admin = require('./models/Admin');

async function fixEmpleados() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar empleados sin rolEmpleado
    const empleadosSinRol = await Admin.find({ 
      rol: 'empleado',
      $or: [
        { rolEmpleado: null },
        { rolEmpleado: { $exists: false } }
      ]
    });

    console.log(`📋 Encontrados ${empleadosSinRol.length} empleados sin rolEmpleado:\n`);

    if (empleadosSinRol.length === 0) {
      console.log('✅ No hay empleados que necesiten corrección.');
      await mongoose.disconnect();
      process.exit(0);
    }

    empleadosSinRol.forEach((emp, idx) => {
      console.log(`  ${idx + 1}. ${emp.nombre} (${emp.username}) - ID: ${emp._id}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('🔧 OPCIONES DE CORRECCIÓN:');
    console.log('='.repeat(80));
    console.log('1. Asignar rolEmpleado="monitor" a todos');
    console.log('2. Asignar rolEmpleado="cocina" a todos');
    console.log('3. Asignar rolEmpleado="barra" a todos');
    console.log('4. ELIMINAR estos empleados (recomendado si son de prueba)');
    console.log('5. Salir sin cambios');
    console.log('='.repeat(80));

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('\nSelecciona una opción (1-5): ', async (answer) => {
      let action;
      let rolToAssign;

      switch(answer.trim()) {
        case '1':
          action = 'update';
          rolToAssign = 'monitor';
          break;
        case '2':
          action = 'update';
          rolToAssign = 'cocina';
          break;
        case '3':
          action = 'update';
          rolToAssign = 'barra';
          break;
        case '4':
          action = 'delete';
          break;
        case '5':
          console.log('\n❌ Cancelado. No se realizaron cambios.');
          await mongoose.disconnect();
          process.exit(0);
          return;
        default:
          console.log('\n❌ Opción inválida. Saliendo...');
          await mongoose.disconnect();
          process.exit(1);
          return;
      }

      if (action === 'update') {
        console.log(`\n🔄 Actualizando ${empleadosSinRol.length} empleados con rolEmpleado="${rolToAssign}"...`);
        
        const result = await Admin.updateMany(
          { 
            rol: 'empleado',
            $or: [
              { rolEmpleado: null },
              { rolEmpleado: { $exists: false } }
            ]
          },
          { $set: { rolEmpleado: rolToAssign } }
        );

        console.log(`✅ Actualizados ${result.modifiedCount} empleados`);
        
        // Verificar
        const updated = await Admin.find({ rol: 'empleado', rolEmpleado: rolToAssign });
        console.log('\n📋 Empleados actualizados:');
        updated.forEach((emp, idx) => {
          console.log(`  ${idx + 1}. ${emp.nombre} - rolEmpleado: ${emp.rolEmpleado}`);
        });

      } else if (action === 'delete') {
        console.log(`\n🗑️  Eliminando ${empleadosSinRol.length} empleados de prueba...`);
        
        const result = await Admin.deleteMany({
          rol: 'empleado',
          $or: [
            { rolEmpleado: null },
            { rolEmpleado: { $exists: false } }
          ]
        });

        console.log(`✅ Eliminados ${result.deletedCount} empleados`);
      }

      console.log('\n✅ Proceso completado\n');
      readline.close();
      await mongoose.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixEmpleados();
