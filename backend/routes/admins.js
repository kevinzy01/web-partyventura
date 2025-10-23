// ===================================
// ADMIN ROUTES
// Rutas para gestión de administradores
// ===================================

const express = require('express');
const router = express.Router();
const {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  changeRole,
  unlockAdmin,
  getEmpleados,
  getEmpleado,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado
} = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const { createLimiter } = require('../middleware/rateLimiter');

// Todas las rutas requieren autenticación
router.use(auth);

// Rutas de administradores
router.route('/')
  .get(getAdmins)
  .post(createLimiter, createAdmin);

router.route('/:id')
  .put(updateAdmin)
  .delete(deleteAdmin);

router.patch('/:id/role', changeRole);
router.patch('/:id/unlock', unlockAdmin);

// Rutas de empleados
router.route('/empleados')
  .get(getEmpleados)
  .post(createLimiter, createEmpleado);

router.route('/empleados/:id')
  .get(getEmpleado)
  .put(updateEmpleado)
  .delete(deleteEmpleado);

module.exports = router;
