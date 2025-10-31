const mongoose = require('mongoose');
const path = require('path');

// Cargar variables de entorno manualmente
const fs = require('fs');
const envPath = path.join(__dirname, '../backend/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length) {
      process.env[key.trim()] = value.join('=').trim();
    }
  });
}

const Admin = require('../backend/models/Admin');

async function diagnoseDatabase() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura');
    console.log('✅ Conectado a MongoDB\n');

    // Obtener todos los admins
    const allAdmins = await Admin.find({}).select('+password');
    
    console.log('='.repeat(80));
    console.log('📊 DIAGNÓSTICO COMPLETO DE BASE DE DATOS');
    console.log('='.repeat(80));
    console.log(`Total de usuarios en la BD: ${allAdmins.length}\n`);

    allAdmins.forEach((admin, index) => {
      console.log(`\n${index + 1}. Usuario: ${admin.username}`);
      console.log(`   Nombre: ${admin.nombre}`);
      console.log(`   Email: ${admin.email || '(sin email)'}`);
      console.log(`   Rol (tipo de usuario): ${admin.rol}`);
      console.log(`   Rol de empleado (rol en parque): ${admin.rolEmpleado || '(sin asignar)'}`);
      console.log(`   Activo: ${admin.activo}`);
      console.log(`   ID: ${admin._id}`);
      console.log(`   Creado: ${admin.createdAt}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('📈 RESUMEN POR ROL DE USUARIO:');
    console.log('='.repeat(80));
    
    const byRol = allAdmins.reduce((acc, admin) => {
      acc[admin.rol] = (acc[admin.rol] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(byRol).forEach(([rol, count]) => {
      console.log(`  ${rol}: ${count} usuario(s)`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('📈 RESUMEN POR ROL DE EMPLEADO (para usuarios con rol=empleado):');
    console.log('='.repeat(80));
    
    const empleados = allAdmins.filter(a => a.rol === 'empleado');
    console.log(`Total empleados: ${empleados.length}`);
    
    if (empleados.length > 0) {
      const byRolEmpleado = empleados.reduce((acc, admin) => {
        const rolEmp = admin.rolEmpleado || 'sin asignar';
        acc[rolEmp] = (acc[rolEmp] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(byRolEmpleado).forEach(([rol, count]) => {
        console.log(`  ${rol}: ${count} empleado(s)`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('🔍 VALIDACIÓN DE ESQUEMA:');
    console.log('='.repeat(80));
    
    allAdmins.forEach((admin) => {
      const issues = [];
      
      // Validar que empleados tengan rolEmpleado
      if (admin.rol === 'empleado' && !admin.rolEmpleado) {
        issues.push(`❌ Empleado "${admin.nombre}" no tiene rolEmpleado asignado`);
      }
      
      // Validar que no-empleados NO tengan rolEmpleado
      if (admin.rol !== 'empleado' && admin.rolEmpleado) {
        issues.push(`⚠️ Usuario "${admin.nombre}" (rol=${admin.rol}) tiene rolEmpleado="${admin.rolEmpleado}" (inconsistente)`);
      }
      
      // Validar que rolEmpleado sea válido
      if (admin.rolEmpleado && !['monitor', 'cocina', 'barra'].includes(admin.rolEmpleado)) {
        issues.push(`❌ Empleado "${admin.nombre}" tiene rolEmpleado inválido: "${admin.rolEmpleado}"`);
      }
      
      if (issues.length > 0) {
        issues.forEach(issue => console.log(issue));
      }
    });
    
    console.log('\n✅ Diagnóstico completado\n');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

diagnoseDatabase();
