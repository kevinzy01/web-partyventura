const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

/**
 * Generar token JWT
 */
const generarToken = (adminId) => {
  return jwt.sign(
    { id: adminId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión de administrador
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar entrada
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, proporciona usuario y contraseña'
      });
    }

    // Buscar admin y traer password
    const admin = await Admin.findOne({ username }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si está bloqueado
    if (admin.estaBloqueado()) {
      const minutos = Math.ceil((admin.bloqueadoHasta - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutos} minutos.`
      });
    }

    // Verificar si está activo
    if (!admin.activo) {
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta ha sido desactivada. Contacta al administrador.'
      });
    }

    // Verificar password
    const passwordCorrecto = await admin.compararPassword(password);

    if (!passwordCorrecto) {
      await admin.registrarIntentoFallido();
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Login exitoso - resetear intentos fallidos
    await admin.resetearIntentos();

    // Generar token
    const token = generarToken(admin._id);

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          nombre: admin.nombre,
          rol: admin.rol
        }
      }
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del administrador actual
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        nombre: admin.nombre,
        rol: admin.rol,
        ultimoAcceso: admin.ultimoAcceso
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña del administrador
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, proporciona la contraseña actual y la nueva'
      });
    }

    if (passwordNuevo.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const admin = await Admin.findById(req.user._id).select('+password');

    // Verificar password actual
    const passwordCorrecto = await admin.compararPassword(passwordActual);
    if (!passwordCorrecto) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Actualizar password
    admin.password = passwordNuevo;
    await admin.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión (invalidar token en el cliente)
 * @access  Private
 */
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
};
