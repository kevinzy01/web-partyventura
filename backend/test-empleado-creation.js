const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testEmpleadoCreation() {
  try {
    // Conectar a MongoDB
    console.log('📍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado a MongoDB');

    // PASO 1: Verificar que no exista empleado previo
    console.log('\n📋 PASO 1: Verificar empleado previo...');
    const existingEmpleado = await Admin.findOne({ username: 'test_monitor' });
    if (existingEmpleado) {
      console.log('⚠️ Empleado "test_monitor" ya existe, eliminando...');
      await Admin.deleteOne({ username: 'test_monitor' });
      console.log('✅ Empleado anterior eliminado');
    }

    // PASO 2: Crear empleado de prueba
    console.log('\n🔧 PASO 2: Crear empleado de prueba...');
    
    console.log('📝 Datos del empleado:');
    console.log('  - Username: test_monitor');
    console.log('  - Nombre: Test Monitor');
    console.log('  - Email: test.monitor@partyventura.com');
    console.log('  - Rol (acceso): empleado');
    console.log('  - RolEmpleado (puesto): monitor');

    // Crear instancia primero para que el middleware pre-save se ejecute
    const empleado = new Admin({
      username: 'test_monitor',
      nombre: 'Test Monitor',
      email: 'test.monitor@partyventura.com',
      password: '123456',
      rol: 'empleado',           // TIPO DE ACCESO
      rolEmpleado: 'monitor',    // PUESTO DE TRABAJO
      activo: true
    });

    // Guardar ejecuta el middleware pre-save que hashea la contraseña
    await empleado.save();
    console.log('✅ Empleado creado exitosamente (con password hasheada)');
    console.log('  - ID:', empleado._id);

    // PASO 3: Verificar datos guardados
    console.log('\n✔️ PASO 3: Verificar datos en BD...');
    const empleadoVerificado = await Admin.findById(empleado._id).select('-password');
    console.log('📊 Datos guardados en BD:');
    console.log('  - Username:', empleadoVerificado.username);
    console.log('  - Nombre:', empleadoVerificado.nombre);
    console.log('  - Email:', empleadoVerificado.email);
    console.log('  - Rol:', empleadoVerificado.rol, '(acceso al sistema)');
    console.log('  - RolEmpleado:', empleadoVerificado.rolEmpleado, '(puesto de trabajo)');
    console.log('  - Activo:', empleadoVerificado.activo);

    // PASO 4: Verificar que rol es exactamente 'empleado'
    console.log('\n🔍 PASO 4: Verificaciones de integridad...');
    if (empleadoVerificado.rol !== 'empleado') {
      console.error('❌ ERROR: rol no es "empleado"');
      process.exit(1);
    }
    console.log('✅ Rol es "empleado" (correcto)');

    if (!['monitor', 'cocina', 'barra'].includes(empleadoVerificado.rolEmpleado)) {
      console.error('❌ ERROR: rolEmpleado no es válido');
      process.exit(1);
    }
    console.log('✅ RolEmpleado es "monitor" (correcto)');

    // PASO 5: Simular GET /api/admins/empleados (filtrar por rol='empleado')
    console.log('\n📥 PASO 5: Simular GET /api/admins/empleados...');
    const empleados = await Admin.find({ rol: 'empleado' }).select('-password');
    console.log(`✅ Encontrados ${empleados.length} empleado(s) con rol='empleado'`);
    empleados.forEach(emp => {
      console.log(`  - ${emp.nombre} (${emp.rolEmpleado === 'monitor' ? '🏃' : emp.rolEmpleado === 'cocina' ? '👨‍🍳' : '🍹'})`);
    });

    // PASO 6: Verificar que no aparezca en GET /api/admins (solo admin/superadmin)
    console.log('\n🔐 PASO 6: Verificar que no aparezca en listado de admins...');
    const admins = await Admin.find({ rol: { $in: ['admin', 'superadmin'] } }).select('-password');
    const isEmpleadoInAdminList = admins.some(a => a.username === 'test_monitor');
    if (isEmpleadoInAdminList) {
      console.error('❌ ERROR: Empleado aparece en listado de admins');
      process.exit(1);
    }
    console.log(`✅ Empleado NO aparece en listado de admins (correcto)`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ TESTING EXITOSO - Sistema de dos roles funcionando correctamente');
    console.log('='.repeat(70));
    console.log('\n📋 PRÓXIMOS PASOS PARA TESTING MANUAL:');
    console.log('1. Abrir panel admin en http://localhost:3000/admin.html');
    console.log('2. Ir a "Gestión de Empleados" → debería ver "🏃 Test Monitor"');
    console.log('3. Ir a "Horarios Laborales" → "Asignar Horario"');
    console.log('   → Dropdown debería mostrar "🏃 Test Monitor"');
    console.log('4. Hacer logout y login con test_monitor / 123456');
    console.log('   → Debería abrir portal de empleados (NO panel admin)');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error durante testing:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
  }
}

testEmpleadoCreation();
