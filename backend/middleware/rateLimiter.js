const rateLimit = require('express-rate-limit');

/**
 * Rate limiter general para todas las rutas
 * Previene ataques de fuerza bruta y DDoS
 * 
 * NOTA: Límites aumentados para desarrollo con Ngrok
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Máximo 500 peticiones por IP (aumentado para Ngrok)
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP. Por favor, inténtalo más tarde.'
  },
  standardHeaders: true, // Retorna info en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  // Confiar en los proxies (importante para Ngrok)
  trustProxy: true
});

/**
 * Rate limiter estricto para autenticación
 * Previene ataques de fuerza bruta en login
 * 
 * NOTA: Límites aumentados para desarrollo con Ngrok
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Máximo 20 intentos de login (aumentado de 5)
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Por favor, espera 15 minutos.'
  },
  skipSuccessfulRequests: true, // No cuenta las peticiones exitosas
  trustProxy: true
});

/**
 * Rate limiter para formularios de contacto
 * Previene spam en formularios públicos
 */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Máximo 10 mensajes por hora (aumentado de 5)
  message: {
    success: false,
    message: 'Has enviado demasiados mensajes. Por favor, espera 1 hora antes de intentar de nuevo.'
  },
  trustProxy: true
});

/**
 * Rate limiter para newsletter
 * Previene suscripciones masivas
 */
const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Máximo 5 suscripciones por hora
  message: {
    success: false,
    message: 'Has realizado demasiadas suscripciones. Por favor, espera 1 hora.'
  },
  trustProxy: true
});

/**
 * Rate limiter para creación de contenido
 * Previene spam de publicaciones
 */
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // Máximo 50 creaciones por hora (aumentado de 20)
  message: {
    success: false,
    message: 'Has creado demasiado contenido. Por favor, espera antes de continuar.'
  },
  trustProxy: true
});

module.exports = {
  generalLimiter,
  authLimiter,
  contactLimiter,
  newsletterLimiter,
  createLimiter
};
