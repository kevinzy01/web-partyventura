const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function cleanupCorruptEmpleados() {
  try {
    console.log('📍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado a MongoDB\n');

    // Buscar empleados sin rolEmpleado o con rolEmpleado inválido
    console.log('🔍 Buscando empleados corruptos...');
    const corruptEmpleados = await Admin.find({
      rol: 'empleado',
      $or: [
        { rolEmpleado: null },
        { rolEmpleado: { $exists: false } },
        { rolEmpleado: { $nin: ['monitor', 'cocina', 'barra'] } }
      ]
    });

    console.log(`📊 Empleados corruptos encontrados: ${corruptEmpleados.length}\n`);

    if (corruptEmpleados.length === 0) {
      console.log('✅ No hay empleados corruptos');
    } else {
      for (const emp of corruptEmpleados) {
        console.log(`❌ Empleado corrupto:`);
        console.log(`   Nombre: ${emp.nombre}`);
        console.log(`   Username: ${emp.username}`);
        console.log(`   Rol: ${emp.rol}`);
        console.log(`   RolEmpleado: ${emp.rolEmpleado || 'N/A'}`);
        console.log(`   ID: ${emp._id}`);
        
        // Eliminar empleado corrupto
        await Admin.deleteOne({ _id: emp._id });
        console.log(`   ✅ Eliminado\n`);
      }
      
      console.log(`✅ ${corruptEmpleados.length} empleado(s) corrupto(s) eliminado(s)`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión a MongoDB cerrada');
  }
}

cleanupCorruptEmpleados();
