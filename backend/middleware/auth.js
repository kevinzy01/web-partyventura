const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT
 * Verifica el token JWT en el header Authorization
 */
const auth = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. No se proporcionó token de autenticación.'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Cargar información completa del usuario desde la base de datos
    const Admin = require('../models/Admin');
    const user = await Admin.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }
    
    if (!user.activo) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada.'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error en la autenticación.'
    });
  }
};

/**
 * Middleware opcional de autenticación
 * Añade información del usuario si el token es válido, pero permite continuar sin token
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
    next();
  } catch (error) {
    // Si el token es inválido, simplemente continuar sin usuario
    next();
  }
};

/**
 * Middleware para verificar rol de superadmin
 * Requiere que se haya ejecutado auth() antes
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Se requiere autenticación.'
    });
  }

  if (req.user.rol !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de superadministrador.'
    });
  }

  next();
};

/**
 * Middleware para verificar rol de admin o superadmin
 * Requiere que se haya ejecutado auth() antes
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Se requiere autenticación.'
    });
  }

  if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de administrador.'
    });
  }

  next();
};

/**
 * Middleware para verificar que el usuario NO sea solo empleado
 * Los empleados no tienen acceso al panel de administración
 * Requiere que se haya ejecutado auth() antes
 */
const blockEmployeeAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Se requiere autenticación.'
    });
  }

  if (req.user.rol === 'empleado') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Los empleados no tienen acceso al panel de administración.'
    });
  }

  next();
};

// Alias para compatibilidad
const protect = auth;

module.exports = { 
  auth, 
  optionalAuth, 
  protect, 
  requireSuperAdmin, 
  requireAdmin,
  blockEmployeeAccess
};
