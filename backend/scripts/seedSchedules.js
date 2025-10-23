const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const Admin = require('../models/Admin');

const seedSchedules = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/partyventura');
    console.log('✅ Conectado a MongoDB');
    
    // Buscar un usuario admin para asignar como createdBy
    const admin = await Admin.findOne({ rol: 'superadmin' });
    
    if (!admin) {
      console.log('⚠️  No se encontró un usuario superadmin. Creando uno...');
      console.log('Por favor, ejecuta primero el script de seed para usuarios.');
      process.exit(1);
    }
    
    console.log(`✅ Usuario encontrado: ${admin.username}`);
    
    // Limpiar schedules existentes
    await Schedule.deleteMany({});
    console.log('🗑️  Schedules anteriores eliminados');
    
    // Crear horarios de ejemplo
    const horarios = [
      {
        type: 'horario',
        title: 'Horario Fines de Semana',
        description: 'Abierto viernes y sábados',
        days: ['viernes', 'sábado'],
        openTime: '23:00',
        closeTime: '06:00',
        icon: '🎉',
        order: 1,
        isActive: true,
        createdBy: admin._id
      },
      {
        type: 'horario',
        title: 'Horario Jueves',
        description: 'Especial universitarios',
        days: ['jueves'],
        openTime: '22:00',
        closeTime: '04:00',
        icon: '🎓',
        order: 2,
        isActive: true,
        createdBy: admin._id
      },
      {
        type: 'horario',
        title: 'Eventos Especiales',
        description: 'Consultar calendario',
        days: ['lunes', 'martes', 'miércoles', 'domingo'],
        openTime: '20:00',
        closeTime: '02:00',
        icon: '✨',
        order: 3,
        isActive: false,
        createdBy: admin._id
      }
    ];
    
    // Crear tarifas de ejemplo
    const tarifas = [
      {
        type: 'tarifa',
        title: 'Entrada General',
        description: 'Incluye una consumición',
        price: 12,
        currency: 'EUR',
        unit: 'por persona',
        icon: '🎫',
        order: 1,
        isActive: true,
        createdBy: admin._id
      },
      {
        type: 'tarifa',
        title: 'Reserva VIP',
        description: 'Mesa reservada para 6 personas',
        price: 150,
        currency: 'EUR',
        unit: 'por mesa',
        icon: '👑',
        order: 2,
        isActive: true,
        createdBy: admin._id
      },
      {
        type: 'tarifa',
        title: 'Botella Premium',
        description: 'Ron, Vodka o Ginebra',
        price: 80,
        currency: 'EUR',
        unit: 'por botella',
        icon: '🍾',
        order: 3,
        isActive: true,
        createdBy: admin._id
      },
      {
        type: 'tarifa',
        title: 'Entrada Reducida',
        description: 'Estudiantes con carnet',
        price: 8,
        currency: 'EUR',
        unit: 'por persona',
        icon: '🎓',
        order: 4,
        isActive: true,
        createdBy: admin._id
      }
    ];
    
    // Insertar todos los schedules
    const allSchedules = [...horarios, ...tarifas];
    await Schedule.insertMany(allSchedules);
    
    console.log(`✅ ${horarios.length} horarios creados`);
    console.log(`✅ ${tarifas.length} tarifas creadas`);
    console.log('🎉 Seed completado exitosamente');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error al hacer seed:', error);
    process.exit(1);
  }
};

seedSchedules();
