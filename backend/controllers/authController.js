const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const transporter = require('../config/email');
const resetPasswordEmail = require('../templates/resetPasswordEmail');

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

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar recuperación de contraseña
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validar que se proporcionó un email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, proporciona un email'
      });
    }

    // Buscar admin por email
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    // Por seguridad, siempre retornamos el mismo mensaje (no revelar si el email existe)
    const mensajeExito = 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña';

    if (!admin) {
      // No revelar que el email no existe
      return res.json({
        success: true,
        message: mensajeExito
      });
    }

    // Verificar que la cuenta esté activa
    if (!admin.activo) {
      return res.json({
        success: true,
        message: mensajeExito
      });
    }

    // Generar token de reset
    const resetToken = admin.generarResetToken();
    await admin.save({ validateBeforeSave: false });

    // Crear URL de reset
    const protocol = req.get('host').includes('localhost') ? 'http' : 'https';
    const resetUrl = `${protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;

    // Preparar y enviar email
    try {
      const htmlContent = resetPasswordEmail(resetUrl, admin.nombre);

      await transporter.sendMail({
        from: `"Partyventura Admin" <${process.env.EMAIL_USER}>`,
        to: admin.email,
        subject: '🔒 Recuperación de Contraseña - Partyventura',
        html: htmlContent
      });

      console.log(`✅ Email de recuperación enviado a: ${admin.email}`);

      res.json({
        success: true,
        message: mensajeExito
      });

    } catch (emailError) {
      console.error('❌ Error al enviar email:', emailError);

      // Si falla el envío del email, limpiar el token
      admin.limpiarResetToken();
      await admin.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Error al enviar el email de recuperación. Intenta de nuevo más tarde.'
      });
    }

  } catch (error) {
    console.error('❌ Error en forgotPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Restablecer contraseña con token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validaciones
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de recuperación no proporcionado'
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, proporciona la nueva contraseña y su confirmación'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Hashear el token recibido
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar admin con token válido y no expirado
    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.'
      });
    }

    // Establecer nueva contraseña
    admin.password = password;

    // Limpiar token de reset
    admin.limpiarResetToken();

    // Resetear intentos fallidos si los hubiera
    admin.intentosFallidos = 0;
    admin.bloqueadoHasta = null;

    // Guardar (el pre-save hook hasheará la contraseña)
    await admin.save();

    console.log(`✅ Contraseña restablecida exitosamente para: ${admin.username}`);

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
    });

  } catch (error) {
    console.error('❌ Error en resetPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};
