const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const eventController = require('../controllers/eventController');
const { protect, requireAdmin } = require('../middleware/auth');

// Configuración de multer para subir imágenes de eventos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/events/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Aceptar solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Rutas públicas (sin autenticación)
router.get('/public', eventController.getPublicEvents);
router.get('/calendar', eventController.getCalendarEvents);

// Rutas protegidas (admin y superadmin)
router.use(protect);
router.use(requireAdmin);

router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.post('/', upload.single('image'), eventController.createEvent);
router.put('/:id', upload.single('image'), eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);
router.patch('/:id/status', eventController.updateEventStatus);

module.exports = router;
