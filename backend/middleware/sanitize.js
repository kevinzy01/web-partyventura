const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

/**
 * Middleware de sanitización contra NoSQL Injection
 * Elimina claves que empiecen con $ o contengan .
 */
const sanitizeData = mongoSanitize({
  replaceWith: '_', // Reemplaza caracteres prohibidos con _
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️ Intento de NoSQL Injection detectado - IP: ${req.ip} - Key: ${key}`);
  },
});

/**
 * Middleware contra HTTP Parameter Pollution
 * Previene duplicación maliciosa de parámetros
 */
const preventPollution = hpp({
  whitelist: ['categoria', 'fecha', 'estado'] // Parámetros que pueden estar duplicados
});

/**
 * Función de sanitización manual para strings
 * Elimina caracteres peligrosos de HTML/JavaScript
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/[<>]/g, '') // Elimina < y >
    .replace(/javascript:/gi, '') // Elimina javascript:
    .replace(/on\w+=/gi, '') // Elimina eventos onclick=, onerror=, etc.
    .trim();
};

/**
 * Middleware personalizado de sanitización de body
 * Se aplica después de express.json()
 */
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  next();
};

module.exports = {
  sanitizeData,
  preventPollution,
  sanitizeString,
  sanitizeBody
};
