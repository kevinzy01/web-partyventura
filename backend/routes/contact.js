const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimiter');
const {
  sendContactMessage,
  getAllMessages,
  getMessageById,
  updateMessage,
  deleteMessage
} = require('../controllers/contactController');

// Validaciones
const contactValidation = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('mensaje')
    .trim()
    .notEmpty().withMessage('El mensaje es obligatorio')
    .isLength({ min: 10, max: 1000 }).withMessage('El mensaje debe tener entre 10 y 1000 caracteres')
];

// Rutas públicas
router.post('/', contactLimiter, contactValidation, validate, sendContactMessage);

// Rutas privadas (Admin) - Protegidas con JWT
router.get('/', auth, getAllMessages);
router.get('/:id', auth, getMessageById);
router.put('/:id', auth, updateMessage);
router.delete('/:id', auth, deleteMessage);

module.exports = router;
