/**
 * Script para insertar eventos de ejemplo en el calendario
 * Crea eventos para la semana anterior y la semana actual
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const Admin = require('./models/Admin');

// Conectar a la base de datos
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/partyventura';
mongoose.connect(mongoUri)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err);
    process.exit(1);
  });

async function crearEventosEjemplo() {
  try {
    console.log('📅 Creando eventos de ejemplo...\n');

    // Buscar un admin para asignar como creador
    const admin = await Admin.findOne({ rol: 'superadmin' });
    
    if (!admin) {
      console.error('❌ No se encontró ningún superadmin. Crea uno primero.');
      process.exit(1);
    }

    console.log(`👤 Usando admin: ${admin.username}`);

    // Obtener fecha actual
    const hoy = new Date();
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // Limpiar eventos existentes (opcional)
    const respuesta = 'si'; // Cambiar a 'no' si no quieres eliminar eventos existentes
    if (respuesta.toLowerCase() === 'si') {
      await Event.deleteMany({});
      console.log('🗑️  Eventos anteriores eliminados\n');
    }

    // Eventos para crear
    const eventos = [];

    // SEMANA ANTERIOR (7 días atrás hasta ayer)
    for (let i = 13; i >= 7; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      
      eventos.push({
        title: `Fiesta de ${diasSemana[fecha.getDay()]}`,
        description: `Evento especial para celebrar el ${diasSemana[fecha.getDay()]}. Diversión garantizada con música, juegos y mucha emoción.`,
        startDate: new Date(fecha.setHours(18, 0, 0)),
        endDate: new Date(fecha.setHours(22, 0, 0)),
        location: 'Sala Principal',
        eventType: 'fiesta',
        color: '#FF6B35',
        maxCapacity: 50,
        price: 15,
        status: 'completado',
        isPublic: true,
        allowBooking: false,
        tags: ['fiesta', 'música', 'diversión'],
        createdBy: admin._id
      });
    }

    // Evento especial de mitad de semana pasada
    const eventoEspecial1 = new Date(hoy);
    eventoEspecial1.setDate(eventoEspecial1.getDate() - 10);
    eventos.push({
      title: '🎃 Noche de Terror',
      description: 'Prepárate para una noche escalofriante con decoración de Halloween, disfraces y juegos de miedo.',
      startDate: new Date(eventoEspecial1.setHours(20, 0, 0)),
      endDate: new Date(eventoEspecial1.setHours(23, 30, 0)),
      location: 'Todo el parque',
      eventType: 'fiesta',
      color: '#9333EA',
      maxCapacity: 100,
      price: 20,
      status: 'completado',
      isPublic: true,
      allowBooking: false,
      tags: ['halloween', 'terror', 'disfraces'],
      createdBy: admin._id
    });

    // SEMANA ACTUAL (hace 6 días hasta hoy)
    // Lunes - Evento deportivo
    const lunes = new Date(hoy);
    lunes.setDate(lunes.getDate() - 6);
    eventos.push({
      title: '⚽ Torneo de Fútbol Trampolín',
      description: 'Competencia deportiva de fútbol en trampolines. Equipos de 5 jugadores. ¡Inscríbete con tu grupo!',
      startDate: new Date(lunes.setHours(17, 0, 0)),
      endDate: new Date(lunes.setHours(20, 0, 0)),
      location: 'Zona Deportiva',
      eventType: 'corporativo',
      color: '#10B981',
      maxCapacity: 40,
      price: 12,
      status: 'completado',
      isPublic: true,
      allowBooking: true,
      tags: ['deporte', 'torneo', 'fútbol'],
      createdBy: admin._id
    });

    // Martes - Cumpleaños
    const martes = new Date(hoy);
    martes.setDate(martes.getDate() - 5);
    eventos.push({
      title: '🎂 Cumpleaños de Emma',
      description: 'Celebración de cumpleaños privada. Incluye decoración temática de princesas, tarta y animación.',
      startDate: new Date(martes.setHours(16, 30, 0)),
      endDate: new Date(martes.setHours(19, 30, 0)),
      location: 'Sala VIP 1',
      eventType: 'cumpleaños',
      color: '#EC4899',
      maxCapacity: 25,
      price: 250,
      status: 'completado',
      isPublic: false,
      allowBooking: false,
      tags: ['cumpleaños', 'infantil', 'privado'],
      createdBy: admin._id
    });

    // Miércoles - Evento corporativo
    const miercoles = new Date(hoy);
    miercoles.setDate(miercoles.getDate() - 4);
    eventos.push({
      title: '💼 Team Building Empresa Tech',
      description: 'Jornada de integración empresarial con actividades de teambuilding y dinámicas de grupo.',
      startDate: new Date(miercoles.setHours(10, 0, 0)),
      endDate: new Date(miercoles.setHours(14, 0, 0)),
      location: 'Instalación completa',
      eventType: 'corporativo',
      color: '#3B82F6',
      maxCapacity: 60,
      price: 800,
      status: 'completado',
      isPublic: false,
      allowBooking: true,
      tags: ['corporativo', 'teambuilding', 'empresa'],
      createdBy: admin._id
    });

    // Jueves - Sesión especial
    const jueves = new Date(hoy);
    jueves.setDate(jueves.getDate() - 3);
    eventos.push({
      title: '✨ Noche de las Estrellas',
      description: 'Sesión nocturna especial con luces LED, música electrónica y efectos visuales impresionantes.',
      startDate: new Date(jueves.setHours(21, 0, 0)),
      endDate: new Date(jueves.setHours(23, 59, 0)),
      location: 'Sala Principal',
      eventType: 'fiesta',
      color: '#8B5CF6',
      maxCapacity: 80,
      price: 18,
      status: 'completado',
      isPublic: true,
      allowBooking: true,
      tags: ['fiesta', 'luces', 'nocturna'],
      createdBy: admin._id
    });

    // Viernes - Gran fiesta
    const viernes = new Date(hoy);
    viernes.setDate(viernes.getDate() - 2);
    eventos.push({
      title: '🎉 Viernes de Locura',
      description: 'La fiesta más grande de la semana. DJ en vivo, concursos con premios y mucha diversión.',
      startDate: new Date(viernes.setHours(19, 0, 0)),
      endDate: new Date(viernes.setHours(23, 0, 0)),
      location: 'Todo el parque',
      eventType: 'fiesta',
      color: '#EF4444',
      maxCapacity: 120,
      price: 22,
      status: 'completado',
      isPublic: true,
      allowBooking: true,
      tags: ['fiesta', 'dj', 'viernes'],
      createdBy: admin._id
    });

    // Sábado - Evento familiar
    const sabado = new Date(hoy);
    sabado.setDate(sabado.getDate() - 1);
    eventos.push({
      title: '👨‍👩‍👧‍👦 Día Familiar',
      description: 'Jornada especial para toda la familia. Actividades para niños y adultos, con monitores especializados.',
      startDate: new Date(sabado.setHours(11, 0, 0)),
      endDate: new Date(sabado.setHours(14, 0, 0)),
      location: 'Todas las áreas',
      eventType: 'fiesta',
      color: '#F59E0B',
      maxCapacity: 100,
      price: 15,
      status: 'completado',
      isPublic: true,
      allowBooking: true,
      tags: ['familiar', 'niños', 'sábado'],
      createdBy: admin._id
    });

    eventos.push({
      title: '🌙 Noche Teen',
      description: 'Sesión nocturna exclusiva para adolescentes (12-17 años). Música actual, juegos y zona chill.',
      startDate: new Date(sabado.setHours(20, 0, 0)),
      endDate: new Date(sabado.setHours(23, 30, 0)),
      location: 'Sala Principal',
      eventType: 'fiesta',
      color: '#06B6D4',
      maxCapacity: 70,
      price: 16,
      status: 'completado',
      isPublic: true,
      allowBooking: true,
      tags: ['adolescentes', 'nocturna', 'teen'],
      createdBy: admin._id
    });

    // HOY - Eventos actuales
    eventos.push({
      title: '🎊 Mega Fiesta Dominical',
      description: 'Gran cierre de semana con actividades especiales, música en vivo y sorteos. ¡No te lo pierdas!',
      startDate: new Date(hoy.setHours(12, 0, 0)),
      endDate: new Date(hoy.setHours(21, 0, 0)),
      location: 'Todo el parque',
      eventType: 'fiesta',
      color: '#DC2626',
      maxCapacity: 150,
      price: 20,
      status: 'en-curso',
      isPublic: true,
      allowBooking: true,
      tags: ['domingo', 'mega-fiesta', 'especial'],
      notes: 'Evento principal del día. Máxima promoción.',
      createdBy: admin._id
    });

    eventos.push({
      title: '🎂 Pack Cumpleaños Express',
      description: 'Celebración de cumpleaños sin reserva previa. 1 hora + tarta + animación básica.',
      startDate: new Date(hoy.setHours(17, 0, 0)),
      endDate: new Date(hoy.setHours(18, 30, 0)),
      location: 'Sala VIP 2',
      eventType: 'cumpleaños',
      color: '#EC4899',
      maxCapacity: 15,
      price: 120,
      status: 'programado',
      isPublic: true,
      allowBooking: true,
      tags: ['cumpleaños', 'express', 'disponible'],
      createdBy: admin._id
    });

    // PRÓXIMA SEMANA - Eventos futuros
    // Lunes próximo
    const proximoLunes = new Date(hoy);
    proximoLunes.setDate(proximoLunes.getDate() + 1);
    eventos.push({
      title: '🎭 Taller de Acrobacias',
      description: 'Aprende técnicas de acrobacias y saltos avanzados con nuestros instructores profesionales.',
      startDate: new Date(proximoLunes.setHours(18, 0, 0)),
      endDate: new Date(proximoLunes.setHours(20, 0, 0)),
      location: 'Zona de Entrenamiento',
      eventType: 'otro',
      color: '#14B8A6',
      maxCapacity: 20,
      price: 25,
      status: 'programado',
      isPublic: true,
      allowBooking: true,
      tags: ['taller', 'acrobacias', 'formación'],
      createdBy: admin._id
    });

    // Viernes próximo
    const proximoViernes = new Date(hoy);
    proximoViernes.setDate(proximoViernes.getDate() + 5);
    eventos.push({
      title: '🎃 Halloween Party 2025',
      description: 'La fiesta de Halloween más terrorífica del año. Premios al mejor disfraz, decoración escalofriante y música de miedo.',
      startDate: new Date(proximoViernes.setHours(20, 0, 0)),
      endDate: new Date(proximoViernes.setHours(23, 59, 0)),
      location: 'Todo el parque',
      eventType: 'fiesta',
      color: '#9333EA',
      maxCapacity: 200,
      price: 25,
      status: 'programado',
      isPublic: true,
      allowBooking: true,
      tags: ['halloween', 'disfraces', 'especial'],
      notes: 'Evento destacado del mes. Promocionar intensamente.',
      createdBy: admin._id
    });

    // Insertar todos los eventos
    const eventosCreados = await Event.insertMany(eventos);
    
    console.log(`\n✅ ${eventosCreados.length} eventos creados exitosamente!\n`);
    
    // Mostrar resumen
    console.log('📊 RESUMEN DE EVENTOS:\n');
    
    const programados = eventosCreados.filter(e => e.status === 'programado').length;
    const enCurso = eventosCreados.filter(e => e.status === 'en-curso').length;
    const completados = eventosCreados.filter(e => e.status === 'completado').length;
    
    console.log(`   📅 Programados: ${programados}`);
    console.log(`   ▶️  En curso: ${enCurso}`);
    console.log(`   ✅ Completados: ${completados}`);
    console.log(`   📍 Total: ${eventosCreados.length}\n`);
    
    console.log('🎨 TIPOS DE EVENTOS:\n');
    const tipos = {};
    eventosCreados.forEach(e => {
      tipos[e.eventType] = (tipos[e.eventType] || 0) + 1;
    });
    Object.entries(tipos).forEach(([tipo, cantidad]) => {
      console.log(`   ${tipo}: ${cantidad}`);
    });
    
    console.log('\n🗓️  EVENTOS POR DÍA (últimos 14 días):\n');
    const eventosPorDia = {};
    eventosCreados.forEach(e => {
      const fecha = new Date(e.startDate);
      const key = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      eventosPorDia[key] = (eventosPorDia[key] || 0) + 1;
    });
    Object.entries(eventosPorDia).sort().forEach(([fecha, cantidad]) => {
      console.log(`   ${fecha}: ${cantidad} evento(s)`);
    });
    
    console.log('\n✨ ¡Ahora puedes ver el calendario con todos estos eventos!\n');
    console.log('👉 Abre http://localhost:5173 y navega hasta el calendario\n');

  } catch (error) {
    console.error('❌ Error al crear eventos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar
crearEventosEjemplo();
