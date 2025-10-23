// Script para verificar el empleado de prueba
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura';

async function checkEmployee() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    const employee = await Admin.findOne({ username: 'empleado.test' }).select('+password');
    
    if (!employee) {
      console.log('❌ NO SE ENCONTRÓ el empleado empleado.test');
      console.log('\n💡 Ejecuta: node scripts/createTestEmployee.js');
    } else {
      console.log('✅ EMPLEADO ENCONTRADO:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('ID:       ', employee._id);
      console.log('Username: ', employee.username);
      console.log('Email:    ', employee.email);
      console.log('Nombre:   ', employee.nombre);
      console.log('Rol:      ', employee.rol);
      console.log('Activo:   ', employee.activo);
      console.log('Bloqueado:', employee.bloqueadoHasta ? 'SÍ' : 'NO');
      console.log('Intentos: ', employee.intentosLogin || 0);
      console.log('Password: ', employee.password ? 'EXISTE (hash)' : 'NO EXISTE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Verificar password
      if (employee.password) {
        const passwordTest = 'Test123!';
        const isMatch = await employee.compararPassword(passwordTest);
        console.log('\n🔑 Verificación de contraseña "Test123!":', isMatch ? '✅ CORRECTA' : '❌ INCORRECTA');
      } else {
        console.log('\n❌ ERROR: El empleado NO tiene contraseña guardada');
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkEmployee();
