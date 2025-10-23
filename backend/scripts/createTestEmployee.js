// Script para crear un empleado de prueba
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// Conectar a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura';

async function createTestEmployee() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Verificar si ya existe y eliminarlo
    const existingEmployee = await Admin.findOne({ username: 'empleado.test' });
    if (existingEmployee) {
      console.log('⚠️  El empleado de prueba ya existe, eliminándolo...');
      await Admin.deleteOne({ username: 'empleado.test' });
      console.log('✅ Empleado anterior eliminado');
    }
    
    // Crear el empleado (el pre-save hook hasheará la contraseña)
    console.log('🔄 Creando empleado de prueba...');
    const employee = new Admin({
      username: 'empleado.test',
      email: 'empleado@partyventura.com',
      password: 'Test123!', // Se hasheará automáticamente
      nombre: 'Juan Pérez',
      rol: 'empleado',
      activo: true
    });
    
    await employee.save();
    
    console.log('✅ Empleado de prueba creado exitosamente!');
    console.log('\n📋 CREDENCIALES DEL EMPLEADO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 Usuario:    empleado.test');
    console.log('🔑 Contraseña: Test123!');
    console.log('👤 Nombre:     Juan Pérez');
    console.log('📧 Email:      empleado@partyventura.com');
    console.log('🎭 Rol:        empleado');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Puedes iniciar sesión en: http://localhost:3000/login.html');
    console.log('   El sistema te redirigirá automáticamente al portal de empleados.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestEmployee();
