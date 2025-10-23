const rateLimit = require('express-rate-limit');

/**
 * Rate limiters específicos para diferentes tipos de operaciones
 * Previene abuso y ataques DoS
 */

// Rate limiter para operaciones de lectura públicas
const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP. Por favor, intenta más tarde.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Incluir info en headers RateLimit-*
  legacyHeaders: false, // Deshabilitar headers X-RateLimit-*
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Usar IP del cliente
    return req.ip;
  }
});

// Rate limiter para uploads de archivos
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 uploads por hora
  message: {
    success: false,
    message: 'Demasiadas subidas de archivos. Has alcanzado el límite de 50 por hora.',
    errorCode: 'UPLOAD_RATE_LIMIT',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Limitar por usuario autenticado o IP
    return req.user?._id?.toString() || req.ip;
  }
});

// Rate limiter para operaciones de escritura (CREATE)
const createLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 30, // 30 creaciones por ventana
  message: {
    success: false,
    message: 'Demasiadas operaciones de creación. Por favor, espera unos minutos.',
    errorCode: 'CREATE_RATE_LIMIT',
    retryAfter: '10 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  }
});

// Rate limiter para operaciones de actualización (UPDATE)
const updateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 50, // 50 actualizaciones por ventana
  message: {
    success: false,
    message: 'Demasiadas operaciones de actualización. Por favor, espera unos minutos.',
    errorCode: 'UPDATE_RATE_LIMIT',
    retryAfter: '10 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  }
});

// Rate limiter para operaciones de eliminación (DELETE)
const deleteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 20, // 20 eliminaciones por ventana
  message: {
    success: false,
    message: 'Demasiadas operaciones de eliminación. Por favor, espera unos minutos.',
    errorCode: 'DELETE_RATE_LIMIT',
    retryAfter: '10 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  }
});

// Rate limiter estricto para operaciones sensibles
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Solo 10 operaciones por hora
  message: {
    success: false,
    message: 'Has excedido el límite de operaciones sensibles. Por favor, contacta al administrador.',
    errorCode: 'STRICT_RATE_LIMIT',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  }
});

// Rate limiter general (ya existente, pero mejorado)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requests por ventana (más permisivo para uso general)
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Por favor, intenta más tarde.',
    errorCode: 'GENERAL_RATE_LIMIT',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

module.exports = {
  publicReadLimiter,
  uploadLimiter,
  createLimiter,
  updateLimiter,
  deleteLimiter,
  strictLimiter,
  generalLimiter
};
