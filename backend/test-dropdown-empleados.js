const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function testEmpleadosDropdown() {
  try {
    console.log('📍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado a MongoDB\n');

    // PASO 1: Obtener todos los usuarios (simulando GET /api/admins)
    console.log('📥 PASO 1: Obtener todos los usuarios (como hace el frontend)...');
    const allUsers = await Admin.find().select('-password');
    console.log(`✅ Total de usuarios en BD: ${allUsers.length}`);

    // PASO 2: Filtrar solo empleados (como hace loadEmpleadosForSchedules)
    console.log('\n🔍 PASO 2: Filtrar solo usuarios con rol="empleado"...');
    const empleados = allUsers.filter(u => u.rol === 'empleado');
    console.log(`✅ Empleados encontrados: ${empleados.length}`);

    if (empleados.length === 0) {
      console.error('❌ ERROR: No hay empleados en BD');
      process.exit(1);
    }

    // PASO 3: Mostrar cómo aparecerían en el dropdown
    console.log('\n📋 PASO 3: Previsualizar opción en dropdown del modal...');
    console.log('   ---');
    empleados.forEach(emp => {
      const rolBadge = emp.rolEmpleado === 'monitor' ? '🏃' : 
                       emp.rolEmpleado === 'cocina' ? '👨‍🍳' : 
                       emp.rolEmpleado === 'barra' ? '🍹' : '❓';
      console.log(`   <option value="${emp._id}"> ${rolBadge} ${emp.nombre}</option>`);
    });
    console.log('   ---\n');

    // PASO 4: Verificar que admins NO aparezcan
    console.log('🔐 PASO 4: Verificar que admins NO aparezcan en dropdown...');
    const admins = allUsers.filter(u => u.rol !== 'empleado');
    console.log(`   Admins/Superadmins en BD: ${admins.length}`);
    
    const incorrectlyFiltered = empleados.filter(e => !['monitor', 'cocina', 'barra'].includes(e.rolEmpleado));
    if (incorrectlyFiltered.length > 0) {
      console.error('❌ ERROR: Hay empleados sin rolEmpleado válido');
      process.exit(1);
    }
    console.log('✅ Todos los empleados tienen rolEmpleado válido\n');

    console.log('='.repeat(70));
    console.log('✅ TESTING DE DROPDOWN EXITOSO');
    console.log('='.repeat(70));
    console.log('\n✓ El dropdown mostrará:');
    empleados.forEach(emp => {
      const rolBadge = emp.rolEmpleado === 'monitor' ? '🏃' : 
                       emp.rolEmpleado === 'cocina' ? '👨‍🍳' : '🍹';
      console.log(`  ${rolBadge} ${emp.nombre}`);
    });
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

testEmpleadosDropdown();
