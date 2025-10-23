const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { protect, requireAdmin } = require('../middleware/auth');
const { galleryUpload, handleMulterError } = require('../middleware/upload');

// Rutas públicas (sin autenticación)
router.get('/public', galleryController.getPublicImages);
router.get('/featured', galleryController.getFeaturedImages);

// Rutas protegidas (admin y superadmin)
router.use(protect);
router.use(requireAdmin);

router.get('/', galleryController.getImages);
router.get('/:id', galleryController.getImageById);
router.post(
  '/', 
  galleryUpload.single('image'),
  handleMulterError,
  galleryController.uploadImage
);
router.put('/:id', galleryController.updateImage);
router.delete('/:id', galleryController.deleteImage);
router.patch('/:id/toggle-status', galleryController.toggleImageStatus);
router.patch('/:id/toggle-featured', galleryController.toggleFeatured);

module.exports = router;
