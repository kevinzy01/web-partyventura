require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');

// Middlewares de seguridad
const { securityHeaders, additionalHeaders, securityLogger } = require('./middleware/security');
const { sanitizeData, preventPollution, sanitizeBody } = require('./middleware/sanitize');
const { generalLimiter } = require('./middleware/rateLimiter');

// Crear aplicación Express
const app = express();

// ====================================
// CONFIGURACIÓN DE PROXY (Para Ngrok)
// ====================================
// Confiar en el primer proxy (Ngrok)
app.set('trust proxy', 1);

// Conectar a la base de datos
connectDB();

// ====================================
// SEGURIDAD - APLICAR PRIMERO
// ====================================

// Headers de seguridad (Helmet)
app.use(securityHeaders);
app.use(additionalHeaders);

// Logger de seguridad
app.use(securityLogger);

// Rate limiting general
app.use(generalLimiter);

// ====================================
// MIDDLEWARE BÁSICO
// ====================================

// CORS configurado - Permisivo para desarrollo y Ngrok
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman) o desde cualquier origen en desarrollo
    const allowedOrigins = [
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:5501',
      'http://127.0.0.1:5501',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Permitir ngrok.io, ngrok-free.app, y localhost
    if (!origin || 
        allowedOrigins.includes(origin) || 
        origin.includes('ngrok') ||
        origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true); // Permisivo en desarrollo
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ====================================
// SANITIZACIÓN DE DATOS
// ====================================

// Sanitizar datos contra NoSQL injection
app.use(sanitizeData);

// Prevenir HTTP Parameter Pollution
app.use(preventPollution);

// Sanitizar body personalizado
app.use(sanitizeBody);

// ====================================
// ARCHIVOS ESTÁTICOS
// ====================================

// Servir archivos estáticos del frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/src', express.static(path.join(__dirname, '../frontend/src')));

// Redirigir /public/* a raíz (para compatibilidad)
app.use('/public', express.static(path.join(__dirname, '../frontend/public')));

// Servir archivos estáticos (imágenes subidas) con CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ====================================
// RUTAS DE LA API
// ====================================

// Middleware temporal de debugging para Ngrok
app.use((req, res, next) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 DEBUG REQUEST:');
  console.log('  Method:', req.method);
  console.log('  Original URL:', req.originalUrl);
  console.log('  Path:', req.path);
  console.log('  Base URL:', req.baseUrl);
  console.log('  Host:', req.headers.host);
  console.log('  Origin:', req.headers.origin);
  console.log('  X-Forwarded-For:', req.headers['x-forwarded-for']);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  next();
});

// Autenticación (debe ir primero)
app.use('/api/auth', require('./routes/auth'));

// Rutas públicas y privadas
app.use('/api/contact', require('./routes/contact'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/news', require('./routes/news'));

// Gestión de administradores (solo superadmin)
app.use('/api/admins', require('./routes/admins'));

// Gestión de horarios y tarifas (solo superadmin)
app.use('/api/schedules', require('./routes/schedules'));

// Gestión de eventos (admin y superadmin)
app.use('/api/events', require('./routes/events'));

// Gestión de galería (admin y superadmin)
app.use('/api/gallery', require('./routes/gallery'));

// Control horario (empleados, admin y superadmin)
app.use('/api/time-records', require('./routes/timeRecords'));

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API de Partyventura funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Error de Multer (subida de archivos)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Error al subir el archivo'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Configurar puerto
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║   🎉 PARTYVENTURA API INICIADA            ║
║                                            ║
║   🚀 Servidor: http://localhost:${PORT}     ║
║   📡 Estado: ACTIVO                        ║
║   🌍 Entorno: ${process.env.NODE_ENV || 'development'}              ║
║                                            ║
║   📋 Endpoints disponibles:                ║
║   • POST   /api/contact                    ║
║   • POST   /api/newsletter                 ║
║   • GET    /api/news                       ║
║   • POST   /api/news                       ║
║   • PUT    /api/news/:id                   ║
║   • DELETE /api/news/:id                   ║
║   • GET    /api/health                     ║
║                                            ║
╚════════════════════════════════════════════╝
  `);
  
  // Inicializar tareas programadas (cron jobs)
  try {
    require('./cron-jobs');
    console.log('✅ Sistema de tareas programadas iniciado\n');
  } catch (error) {
    console.error('⚠️  No se pudo iniciar el sistema de cron jobs:', error.message);
    console.log('   El servidor seguirá funcionando sin tareas automáticas\n');
  }
});

module.exports = app;
