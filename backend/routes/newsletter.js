const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { newsletterLimiter } = require('../middleware/rateLimiter');
const {
  subscribe,
  getAllSubscribers,
  unsubscribe,
  sendBulkEmail,
  toggleSubscriberStatus,
  deleteSubscriber
} = require('../controllers/newsletterController');

// Validaciones
const newsletterValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail()
];

const bulkEmailValidation = [
  body('asunto')
    .trim()
    .notEmpty().withMessage('El asunto es obligatorio')
    .isLength({ min: 3, max: 200 }).withMessage('El asunto debe tener entre 3 y 200 caracteres'),
  body('mensaje')
    .trim()
    .notEmpty().withMessage('El mensaje es obligatorio')
    .isLength({ min: 10 }).withMessage('El mensaje debe tener al menos 10 caracteres')
];

// Rutas públicas
router.post('/subscribe', newsletterLimiter, newsletterValidation, validate, subscribe);
router.delete('/unsubscribe/:email', unsubscribe);

// Rutas privadas (Admin) - Protegidas con JWT
router.get('/', auth, getAllSubscribers);
router.post('/send-bulk', auth, bulkEmailValidation, validate, sendBulkEmail);
router.patch('/:id/toggle', auth, toggleSubscriberStatus);
router.delete('/:id', auth, deleteSubscriber);

module.exports = router;
