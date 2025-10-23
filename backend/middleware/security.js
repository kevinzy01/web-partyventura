const helmet = require('helmet');

/**
 * Configuración de Helmet para headers de seguridad
 * Protege contra ataques comunes (XSS, clickjacking, etc.)
 */
const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://*.persicity.ai"], 
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"], 
      scriptSrcAttr: ["'unsafe-inline'"], 
      imgSrc: ["'self'", "data:", "http:", "https:", "https://*.tile.openstreetmap.org", "https://*.persicity.ai"], 
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:*", "https://*.ngrok.io", "https://*.ngrok-free.app", "https://*.tile.openstreetmap.org", "https://*.persicity.ai", "https://unpkg.com"], 
      fontSrc: ["'self'", "data:", "https://*.persicity.ai", "https://unpkg.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Previene clickjacking
  frameguard: {
    action: 'deny'
  },
  // Fuerza HTTPS (en producción)
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },
  // Previene MIME type sniffing
  noSniff: true,
  // Deshabilita X-Powered-By header
  hidePoweredBy: true,
  // Habilita XSS filter del navegador
  xssFilter: true,
});

/**
 * Middleware personalizado para agregar headers adicionales
 */
const additionalHeaders = (req, res, next) => {
  // Política de referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permisos de features del navegador
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Prevenir carga de recursos de terceros
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  next();
};

/**
 * Middleware de logging de seguridad
 * Registra actividad sospechosa
 */
const securityLogger = (req, res, next) => {
  // Detectar patrones sospechosos en URLs
  const suspiciousPatterns = [
    /\.\./,           // Path traversal
    /<script/i,       // XSS
    /union.*select/i, // SQL Injection
    /;\s*drop/i,      // SQL Injection
    /\$where/i,       // NoSQL Injection
  ];

  const url = req.originalUrl || req.url;
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(url));

  if (isSuspicious) {
    console.warn(`🚨 ALERTA DE SEGURIDAD - Petición sospechosa detectada:
    IP: ${req.ip}
    Método: ${req.method}
    URL: ${url}
    User-Agent: ${req.get('user-agent')}
    Timestamp: ${new Date().toISOString()}
    `);
  }

  next();
};

module.exports = {
  securityHeaders,
  additionalHeaders,
  securityLogger
};
