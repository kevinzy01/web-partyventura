#!/usr/bin/env node

/**
 * Script de Diagnóstico: Verifica qué hay en la base de datos
 * Uso: node diagnose-db.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function diagnosticDB() {
  try {
    console.log('🔍 Iniciando diagnóstico de base de datos...\n');
    
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura';
    console.log(`📍 Conectando a: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');
    
    // Obtener todos los usuarios
    const allAdmins = await Admin.find().select('-password');
    console.log(`📊 TOTAL DE USUARIOS EN LA BD: ${allAdmins.length}\n`);
    
    if (allAdmins.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      await mongoose.connection.close();
      return;
    }
    
    // Mostrar todos los usuarios con sus roles
    console.log('📋 DETALLE DE USUARIOS:');
    console.log('='.repeat(80));
    
    allAdmins.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.nombre}`);
      console.log(`   Username: "${admin.username}"`);
      console.log(`   Email: "${admin.email || 'N/A'}"`);
      console.log(`   Rol: "${admin.rol}"`);
      console.log(`   RolEmpleado: "${admin.rolEmpleado || 'N/A'}"`);
      console.log(`   Activo: ${admin.activo}`);
      console.log(`   ID: ${admin._id}`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Estadísticas
    console.log('\n📈 ESTADÍSTICAS:');
    const roleStats = {};
    allAdmins.forEach(admin => {
      roleStats[admin.rol] = (roleStats[admin.rol] || 0) + 1;
    });
    
    console.log('  Distribución de roles:');
    Object.entries(roleStats).forEach(([rol, count]) => {
      console.log(`    - ${rol}: ${count}`);
    });
    
    const empleados = allAdmins.filter(a => a.rol === 'empleado');
    if (empleados.length > 0) {
      console.log('\n  Distribución de roles de empleados:');
      const empleadoRoles = {};
      empleados.forEach(emp => {
        empleadoRoles[emp.rolEmpleado || 'N/A'] = (empleadoRoles[emp.rolEmpleado || 'N/A'] || 0) + 1;
      });
      Object.entries(empleadoRoles).forEach(([rol, count]) => {
        console.log(`    - ${rol}: ${count}`);
      });
    }
    
    // Verificar problemas
    console.log('\n⚠️  VERIFICACIONES:');
    
    let hasIssues = false;
    
    // Verificar si hay empleados sin rolEmpleado
    const empleadosSinRol = empleados.filter(e => !e.rolEmpleado);
    if (empleadosSinRol.length > 0) {
      console.log(`  ❌ ${empleadosSinRol.length} empleado(s) sin rolEmpleado definido`);
      empleadosSinRol.forEach(e => {
        console.log(`     - ${e.nombre} (${e.username})`);
      });
      hasIssues = true;
    }
    
    // Verificar si hay usuarios con rol incorrecto
    const incorrectRoles = allAdmins.filter(a => !['admin', 'superadmin', 'empleado'].includes(a.rol));
    if (incorrectRoles.length > 0) {
      console.log(`  ❌ ${incorrectRoles.length} usuario(s) con rol incorrecto`);
      incorrectRoles.forEach(u => {
        console.log(`     - ${u.nombre}: rol="${u.rol}"`);
      });
      hasIssues = true;
    }
    
    if (!hasIssues && empleados.length > 0) {
      console.log('  ✅ No se detectaron problemas');
    }
    
    console.log('\n✅ Diagnóstico completado\n');
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

diagnosticDB();
