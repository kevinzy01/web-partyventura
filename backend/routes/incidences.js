const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, requireSuperAdmin } = require('../middleware/auth');
const { incidenciaUpload, handleMulterError } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { validateObjectId } = require('../middleware/validateObjectId');
const incidenceController = require('../controllers/incidenceController');

// ==================== VALIDACIONES ====================

/**
 * Validación para crear incidencia
 */
const createIncidenceValidation = [
  body('fecha')
    .notEmpty().withMessage('La fecha es requerida')
    .isISO8601().withMessage('Formato de fecha inválido')
    .custom((value) => {
      const fecha = new Date(value);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      if (fecha < sevenDaysAgo) {
        throw new Error('La fecha no puede ser más de 7 días en el pasado');
      }
      return true;
    }),
  
  body('tipo')
    .notEmpty().withMessage('El tipo de incidencia es requerido')
    .isIn(['falta', 'retraso', 'ausencia_justificada', 'baja_medica'])
    .withMessage('Tipo inválido. Debe ser: falta, retraso, ausencia_justificada o baja_medica'),
  
  body('motivo')
    .notEmpty().withMessage('El motivo es requerido')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('El motivo debe tener entre 10 y 500 caracteres'),
  
  body('notificarA')
    .optional()
    .isMongoId().withMessage('ID de superadmin inválido')
];

/**
 * Validación para revisar incidencia
 */
const revisarIncidenciaValidation = [
  body('estado')
    .notEmpty().withMessage('El estado es requerido')
    .isIn(['aprobada', 'rechazada'])
    .withMessage('Estado inválido. Debe ser "aprobada" o "rechazada"'),
  
  body('comentarioAdmin')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('El comentario no puede exceder 500 caracteres')
];

// ==================== RUTAS DE EMPLEADOS ====================

/**
 * @route   POST /api/incidences
 * @desc    Crear nueva incidencia (solo empleados)
 * @access  Private (empleado)
 */
router.post(
  '/',
  auth,
  incidenciaUpload.single('documento'), // Campo 'documento' en FormData
  handleMulterError,
  createIncidenceValidation,
  validate,
  incidenceController.createIncidence
);

/**
 * @route   GET /api/incidences/mis-incidencias
 * @desc    Obtener incidencias del empleado actual
 * @access  Private (empleado)
 * @query   ?tipo=falta&estado=pendiente&mes=11&anio=2025&page=1&limit=50
 */
router.get(
  '/mis-incidencias',
  auth,
  incidenceController.getMisIncidencias
);

/**
 * @route   GET /api/incidences/:id
 * @desc    Obtener detalle de una incidencia
 * @access  Private (empleado dueño o superadmin)
 */
router.get(
  '/:id',
  auth,
  validateObjectId('id'),
  incidenceController.getIncidencia
);

/**
 * @route   GET /api/incidences/:id/documento
 * @desc    Ver/Descargar documento adjunto de una incidencia
 * @access  Private (empleado dueño o superadmin)
 */
router.get(
  '/:id/documento',
  auth,
  validateObjectId('id'),
  incidenceController.getDocumento
);

// ==================== RUTAS DE SUPERADMIN ====================

/**
 * @route   GET /api/incidences/admin/todas
 * @desc    Obtener todas las incidencias con filtros (solo superadmin)
 * @access  Private (superadmin)
 * @query   ?empleadoId=xxx&tipo=falta&estado=pendiente&mes=11&anio=2025&page=1&limit=50
 */
router.get(
  '/admin/todas',
  auth,
  requireSuperAdmin,
  incidenceController.getAllIncidencias
);

/**
 * @route   GET /api/incidences/admin/pendientes
 * @desc    Obtener solo incidencias pendientes (solo superadmin)
 * @access  Private (superadmin)
 */
router.get(
  '/admin/pendientes',
  auth,
  requireSuperAdmin,
  incidenceController.getPendientes
);

/**
 * @route   GET /api/incidences/admin/:id
 * @desc    Obtener detalle de una incidencia específica (solo superadmin)
 * @access  Private (superadmin)
 */
router.get(
  '/admin/:id',
  auth,
  requireSuperAdmin,
  validateObjectId('id'),
  incidenceController.getIncidencia
);

/**
 * @route   GET /api/incidences/admin/estadisticas
 * @desc    Obtener estadísticas de incidencias (solo superadmin)
 * @access  Private (superadmin)
 * @query   ?empleadoId=xxx&mes=11&anio=2025
 */
router.get(
  '/admin/estadisticas',
  auth,
  requireSuperAdmin,
  incidenceController.getEstadisticas
);

/**
 * @route   PATCH /api/incidences/admin/:id/revisar
 * @desc    Revisar incidencia - aprobar o rechazar (solo superadmin)
 * @access  Private (superadmin)
 */
router.patch(
  '/admin/:id/revisar',
  auth,
  requireSuperAdmin,
  validateObjectId('id'),
  revisarIncidenciaValidation,
  validate,
  incidenceController.revisarIncidencia
);

/**
 * @route   DELETE /api/incidences/admin/:id
 * @desc    Eliminar incidencia (solo superadmin)
 * @access  Private (superadmin)
 */
router.delete(
  '/admin/:id',
  auth,
  requireSuperAdmin,
  validateObjectId('id'),
  incidenceController.deleteIncidencia
);

module.exports = router;
