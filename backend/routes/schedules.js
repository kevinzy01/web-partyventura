const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect, requireSuperAdmin } = require('../middleware/auth');

// Rutas públicas (sin autenticación)
router.get('/public', scheduleController.getPublicSchedules);

// Rutas protegidas (solo superadmin)
router.use(protect);
router.use(requireSuperAdmin);

router.get('/', scheduleController.getSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', scheduleController.createSchedule);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);
router.patch('/:id/toggle-status', scheduleController.toggleScheduleStatus);

module.exports = router;
