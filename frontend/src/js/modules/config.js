// ===================================
// CONFIG.JS - Configuración Global
// Partyventura
// ===================================

// === CONFIGURACIÓN DE ENTORNO ===
// Cambia MODE entre 'development' y 'production'
const MODE = 'development'; // Cambiar a 'production' cuando uses Ngrok

// Configuración de URLs
const CONFIG_URLS = {
  development: {
    api: 'http://localhost:5000/api',
    server: 'http://localhost:5000'
  },
  production: {
    // ⚠️ ACTUALIZA ESTAS URLs CON TU URL DE NGROK
    // Ejemplo: 'https://a1b2-c3d4-e5f6.ngrok-free.app'
    api: 'https://nonfloating-neda-nonpharmaceutically.ngrok-free.dev/api',
    server: 'https://nonfloating-neda-nonpharmaceutically.ngrok-free.dev'
  }
};

// Seleccionar configuración según el modo
const API_URL = CONFIG_URLS[MODE].api;
const SERVER_URL = CONFIG_URLS[MODE].server;

// Log de configuración (para debug)
console.log(`🔧 Modo: ${MODE}`);
console.log(`🌐 API: ${API_URL}`);
console.log(`🖼️  Server: ${SERVER_URL}`);

// Validar configuración
if (MODE === 'production' && API_URL.includes('TU_URL_DE_NGROK_AQUI')) {
  console.warn('⚠️ ADVERTENCIA: URLs de producción no configuradas. Actualiza config.js');
}

// Configuración de validación
const VALIDATION = {
  nombre: {
    min: 2,
    max: 100
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  mensaje: {
    min: 10,
    max: 1000
  }
};

// Timeouts
const TIMEOUTS = {
  notification: 5000, // 5 segundos
  modal: 10000, // 10 segundos
  autoplay: 4000 // 4 segundos para carousel
};

// Export para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_URL, SERVER_URL, VALIDATION, TIMEOUTS };
}
