const express = require('express');
const router = express.Router();
const timeRecordController = require('../controllers/timeRecordController');
const { auth, requireSuperAdmin } = require('../middleware/auth');

// ==========================================
// RUTAS PARA EMPLEADOS (requieren auth)
// ==========================================

// Registrar entrada/salida
router.post('/registro', auth, timeRecordController.registrarTiempo);

// Obtener último registro del empleado
router.get('/ultimo', auth, timeRecordController.getUltimoRegistro);

// Obtener historial del empleado
router.get('/mis-registros', auth, timeRecordController.getMisRegistros);

// Obtener resumen mensual del empleado
router.get('/mi-resumen', auth, timeRecordController.getMiResumenMensual);

// ==========================================
// RUTAS PARA SUPERADMIN
// ==========================================

// Obtener todos los registros (con filtros)
router.get('/admin/todos', auth, requireSuperAdmin, timeRecordController.getTodosLosRegistros);

// Obtener resumen de todos los empleados
router.get('/admin/resumen', auth, requireSuperAdmin, timeRecordController.getResumenEmpleados);

// Editar registro (correcciones)
router.put('/admin/:id', auth, requireSuperAdmin, timeRecordController.editarRegistro);

// Eliminar registro
router.delete('/admin/:id', auth, requireSuperAdmin, timeRecordController.eliminarRegistro);

module.exports = router;
