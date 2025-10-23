/**
 * Script de inicialización de administrador
 * Ejecutar: node scripts/initAdmin.js
 * 
 * Este script crea el primer usuario administrador
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const Admin = require('../models/Admin');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function initAdmin() {
  try {
    console.log('\n🔧 INICIALIZACIÓN DE ADMINISTRADOR\n');
    
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Verificar si ya existe un admin
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log('⚠️  Ya existe un administrador en la base de datos.');
      const continuar = await question('¿Deseas crear otro administrador? (s/n): ');
      if (continuar.toLowerCase() !== 's') {
        console.log('❌ Operación cancelada');
        process.exit(0);
      }
    }

    // Solicitar datos del administrador
    console.log('\nIngresa los datos del nuevo administrador:\n');
    
    const username = await question('Usuario (min. 3 caracteres): ');
    if (username.length < 3) {
      console.log('❌ El usuario debe tener al menos 3 caracteres');
      process.exit(1);
    }

    const email = await question('Email: ');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      console.log('❌ Email inválido');
      process.exit(1);
    }

    const nombre = await question('Nombre completo: ');
    if (!nombre) {
      console.log('❌ El nombre es obligatorio');
      process.exit(1);
    }

    const password = await question('Contraseña (min. 6 caracteres): ');
    if (password.length < 6) {
      console.log('❌ La contraseña debe tener al menos 6 caracteres');
      process.exit(1);
    }

    const rolInput = await question('Rol (admin/superadmin) [admin]: ');
    const rol = rolInput || 'admin';
    if (!['admin', 'superadmin'].includes(rol)) {
      console.log('❌ Rol inválido. Debe ser admin o superadmin');
      process.exit(1);
    }

    // Crear administrador
    const admin = new Admin({
      username,
      email,
      nombre,
      password,
      rol
    });

    await admin.save();
    
    console.log('\n✅ ¡Administrador creado exitosamente!');
    console.log('\n📝 Detalles:');
    console.log(`   Usuario: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nombre: ${admin.nombre}`);
    console.log(`   Rol: ${admin.rol}`);
    console.log(`   ID: ${admin._id}`);
    console.log('\n💡 Ahora puedes iniciar sesión en el panel de administración.\n');

  } catch (error) {
    if (error.code === 11000) {
      console.error('\n❌ Error: El usuario o email ya existe');
    } else {
      console.error('\n❌ Error al crear administrador:', error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
    mongoose.connection.close();
  }
}

initAdmin();
