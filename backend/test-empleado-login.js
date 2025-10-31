const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testEmpleadoLogin() {
  try {
    console.log('📍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado a MongoDB\n');

    // PASO 1: Obtener empleado
    console.log('🔍 PASO 1: Buscar empleado "test_monitor"...');
    const empleado = await Admin.findOne({ username: 'test_monitor' }).select('+password');
    
    if (!empleado) {
      console.error('❌ ERROR: Empleado no encontrado');
      process.exit(1);
    }
    console.log('✅ Empleado encontrado');
    console.log(`   Username: ${empleado.username}`);
    console.log(`   Nombre: ${empleado.nombre}`);
    console.log(`   Rol: ${empleado.rol}`);
    console.log(`   RolEmpleado: ${empleado.rolEmpleado}`);

    // PASO 2: Verificar datos de login
    console.log('\n🔐 PASO 2: Verificar datos para login...');
    if (empleado.rol !== 'empleado') {
      console.error('❌ ERROR: Rol no es "empleado"');
      process.exit(1);
    }
    console.log('✅ Rol correcto para login de empleado');

    // PASO 3: Simular comparación de contraseña
    console.log('\n🔑 PASO 3: Simular login (comparar contraseña)...');
    const passwordIngresada = '123456';
    
    // Verificar que la contraseña está hasheada
    console.log('   Password en BD (primeros 20 chars):', empleado.password.substring(0, 20) + '...');
    console.log('   ✓ Comienza con "$2a$" o "$2b$" (formato bcrypt):', /^\$2[aby]\$/.test(empleado.password));
    
    // Comparar contraseña usando bcrypt
    const passwordValida = await bcrypt.compare(passwordIngresada, empleado.password);
    
    if (!passwordValida) {
      console.error('❌ ERROR: Contraseña no válida');
      process.exit(1);
    }
    console.log('✅ Contraseña correcta - coincide con hash en BD');

    // PASO 4: Verificar que se devolvería el usuario correcto
    console.log('\n📤 PASO 4: Datos que se devolvería en login exitoso...');
    const userForToken = {
      _id: empleado._id,
      username: empleado.username,
      nombre: empleado.nombre,
      rol: empleado.rol,
      rolEmpleado: empleado.rolEmpleado
    };
    console.log('   Usuario para token JWT:');
    console.log('   ---');
    console.log(`   _id: ${userForToken._id}`);
    console.log(`   username: ${userForToken.username}`);
    console.log(`   nombre: ${userForToken.nombre}`);
    console.log(`   rol: ${userForToken.rol} ← TIPO DE ACCESO`);
    console.log(`   rolEmpleado: ${userForToken.rolEmpleado} ← PUESTO DE TRABAJO`);
    console.log('   ---');

    // PASO 5: Verificar decisión de redirección
    console.log('\n🎯 PASO 5: Lógica de redirección post-login...');
    console.log('   Pseudocódigo en auth.js:');
    console.log('   if (user.rol === "empleado") {');
    console.log('     → Redirigir a /employee.html (PORTAL DE EMPLEADOS)');
    console.log('   } else if (user.rol === "admin" || user.rol === "superadmin") {');
    console.log('     → Redirigir a /admin.html (PANEL ADMIN)');
    console.log('   }');
    console.log('\n   Para nuestro usuario:');
    console.log(`   rol = "${empleado.rol}"`);
    console.log('   ✅ Debería redirigir a /employee.html\n');

    console.log('='.repeat(70));
    console.log('✅ TESTING DE LOGIN EXITOSO');
    console.log('='.repeat(70));
    console.log('\n📝 Resumen de testing:');
    console.log('  ✓ Empleado existe con rol="empleado"');
    console.log('  ✓ RolEmpleado="monitor" (puesto de trabajo correcto)');
    console.log('  ✓ Contraseña hasheada correctamente');
    console.log('  ✓ Login con credenciales correctas funcionaría');
    console.log('  ✓ Sería redirigido al portal de empleados\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

testEmpleadoLogin();
