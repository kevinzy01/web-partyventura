const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { newsletterLimiter } = require('../middleware/rateLimiter');
const {
  subscribe,
  getAllSubscribers,
  unsubscribe
} = require('../controllers/newsletterController');

// Validaciones
const newsletterValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail()
];

// Rutas públicas
router.post('/', newsletterLimiter, newsletterValidation, validate, subscribe);
router.delete('/:email', unsubscribe);

// Rutas privadas (Admin) - Protegidas con JWT
router.get('/', auth, getAllSubscribers);

module.exports = router;
