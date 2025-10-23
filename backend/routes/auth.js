const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { forgotPasswordLimiter, resetPasswordLimiter } = require('../middleware/specificRateLimiters');
const {
  login,
  getMe,
  changePassword,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

// Validaciones
const loginValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('El usuario es obligatorio')
    .isLength({ min: 3 }).withMessage('El usuario debe tener al menos 3 caracteres'),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

const changePasswordValidation = [
  body('passwordActual')
    .notEmpty().withMessage('La contraseña actual es obligatoria'),
  body('passwordNuevo')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe proporcionar un email válido')
    .normalizeEmail()
];

const resetPasswordValidation = [
  body('token')
    .trim()
    .notEmpty().withMessage('El token de recuperación es obligatorio'),
  body('password')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('confirmPassword')
    .notEmpty().withMessage('La confirmación de contraseña es obligatoria')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden')
];

// Rutas públicas
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPasswordValidation, validate, resetPassword);

// Rutas privadas
router.get('/me', auth, getMe);
router.post('/change-password', auth, changePasswordValidation, validate, changePassword);
router.post('/logout', auth, logout);

module.exports = router;
