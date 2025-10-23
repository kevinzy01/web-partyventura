const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { createLimiter } = require('../middleware/rateLimiter');
const { upload } = require('../middleware/upload');
const {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews
} = require('../controllers/newsController');

// Validaciones
const newsValidation = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ min: 5, max: 200 }).withMessage('El título debe tener entre 5 y 200 caracteres'),
  body('contenido')
    .trim()
    .notEmpty().withMessage('El contenido es obligatorio')
    .isLength({ min: 20 }).withMessage('El contenido debe tener al menos 20 caracteres'),
  body('resumen')
    .trim()
    .notEmpty().withMessage('El resumen es obligatorio')
    .isLength({ max: 300 }).withMessage('El resumen no puede exceder 300 caracteres'),
  body('categoria')
    .optional()
    .isIn(['eventos', 'promociones', 'noticias', 'general']).withMessage('Categoría no válida')
];

// Rutas públicas
router.get('/', getAllNews);
router.get('/:idOrSlug', getNewsById);

// Rutas privadas (Admin) - Protegidas con JWT
router.post('/', auth, createLimiter, upload.single('imagen'), newsValidation, validate, createNews);
router.put('/:id', auth, upload.single('imagen'), updateNews);
router.delete('/:id', auth, deleteNews);

module.exports = router;
