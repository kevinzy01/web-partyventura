const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireSuperAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { validateObjectId } = require('../middleware/validateObjectId');
const workScheduleController = require('../controllers/workScheduleController');

// ==================== VALIDACIONES ====================

// Validación para crear horario laboral
const createWorkScheduleValidation = [
  body('empleadoId')
    .trim()
    .notEmpty().withMessage('El ID del empleado es obligatorio')
    .isMongoId().withMessage('ID de empleado inválido'),
  
  body('fecha')
    .trim()
    .notEmpty().withMessage('La fecha es obligatoria')
    .isISO8601().withMessage('Formato de fecha inválido')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      // Permitir fechas desde hoy en adelante
      if (fecha < hoy) {
        throw new Error('No se pueden crear horarios para fechas pasadas');
      }
      return true;
    }),
  
  body('turno')
    .trim()
    .notEmpty().withMessage('El tipo de turno es obligatorio')
    .isIn(['mañana', 'tarde', 'completo']).withMessage('Turno inválido. Usar: mañana, tarde o completo'),
  
  body('horaInicio')
    .trim()
    .notEmpty().withMessage('La hora de inicio es obligatoria')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido. Usar HH:MM'),
  
  body('horaFin')
    .trim()
    .notEmpty().withMessage('La hora de fin es obligatoria')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido. Usar HH:MM'),
  
  body('notas')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las notas no pueden exceder 500 caracteres'),
  
  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Formato de color inválido. Usar formato hex (#RRGGBB)')
];

// Validación para actualizar horario laboral
const updateWorkScheduleValidation = [
  param('id')
    .isMongoId().withMessage('ID de horario inválido'),
  
  body('empleadoId')
    .optional()
    .trim()
    .isMongoId().withMessage('ID de empleado inválido'),
  
  body('fecha')
    .optional()
    .trim()
    .isISO8601().withMessage('Formato de fecha inválido'),
  
  body('turno')
    .optional()
    .trim()
    .isIn(['mañana', 'tarde', 'completo']).withMessage('Turno inválido. Usar: mañana, tarde o completo'),
  
  body('horaInicio')
    .optional()
    .trim()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido. Usar HH:MM'),
  
  body('horaFin')
    .optional()
    .trim()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido. Usar HH:MM'),
  
  body('estado')
    .optional()
    .trim()
    .isIn(['programado', 'confirmado', 'cancelado', 'completado']).withMessage('Estado inválido'),
  
  body('notas')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las notas no pueden exceder 500 caracteres'),
  
  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Formato de color inválido. Usar formato hex (#RRGGBB)')
];

// Validación para consultas de vista semanal
const weeklyViewValidation = [
  query('fecha')
    .trim()
    .notEmpty().withMessage('La fecha es obligatoria para la vista semanal')
    .isISO8601().withMessage('Formato de fecha inválido'),
  
  query('empleadoId')
    .optional()
    .trim()
    .isMongoId().withMessage('ID de empleado inválido')
];

// Validación para consultas de vista mensual
const monthlyViewValidation = [
  query('mes')
    .trim()
    .notEmpty().withMessage('El mes es obligatorio')
    .isInt({ min: 1, max: 12 }).withMessage('Mes debe estar entre 1 y 12'),
  
  query('anio')
    .trim()
    .notEmpty().withMessage('El año es obligatorio')
    .isInt({ min: 2024, max: 2100 }).withMessage('Año inválido'),
  
  query('empleadoId')
    .optional()
    .trim()
    .isMongoId().withMessage('ID de empleado inválido')
];

// Validación para consultas generales
const queryFiltersValidation = [
  query('empleadoId')
    .optional()
    .trim()
    .isMongoId().withMessage('ID de empleado inválido'),
  
  query('fechaInicio')
    .optional()
    .trim()
    .isISO8601().withMessage('Formato de fecha de inicio inválido'),
  
  query('fechaFin')
    .optional()
    .trim()
    .isISO8601().withMessage('Formato de fecha de fin inválido'),
  
  query('estado')
    .optional()
    .trim()
    .isIn(['programado', 'confirmado', 'cancelado', 'completado']).withMessage('Estado inválido'),
  
  query('mes')
    .optional()
    .trim()
    .isInt({ min: 1, max: 12 }).withMessage('Mes debe estar entre 1 y 12'),
  
  query('anio')
    .optional()
    .trim()
    .isInt({ min: 2024, max: 2100 }).withMessage('Año inválido')
];

// Validación para eliminación múltiple
const deleteMultipleValidation = [
  body('ids')
    .isArray({ min: 1 }).withMessage('Se requiere un array de IDs con al menos un elemento')
    .custom((ids) => {
      if (!ids.every(id => /^[0-9a-fA-F]{24}$/.test(id))) {
        throw new Error('Uno o más IDs son inválidos');
      }
      return true;
    })
];

// ==================== RUTAS ====================

// Rutas solo para SUPERADMIN (gestión completa)
router.post(
  '/',
  auth,
  requireSuperAdmin,
  createWorkScheduleValidation,
  validate,
  workScheduleController.createWorkSchedule
);

router.get(
  '/all',
  auth,
  requireSuperAdmin,
  queryFiltersValidation,
  validate,
  workScheduleController.getAllWorkSchedules
);

router.put(
  '/:id',
  auth,
  requireSuperAdmin,
  updateWorkScheduleValidation,
  validate,
  workScheduleController.updateWorkSchedule
);

router.delete(
  '/:id',
  auth,
  requireSuperAdmin,
  validateObjectId('id'),
  workScheduleController.deleteWorkSchedule
);

router.post(
  '/delete-multiple',
  auth,
  requireSuperAdmin,
  deleteMultipleValidation,
  validate,
  workScheduleController.deleteMultipleSchedules
);

// Rutas para EMPLEADOS y ADMIN (consulta de horarios propios)
router.get(
  '/my-schedules',
  auth,
  queryFiltersValidation,
  validate,
  workScheduleController.getMyWorkSchedules
);

router.get(
  '/weekly',
  auth,
  weeklyViewValidation,
  validate,
  workScheduleController.getWeeklyView
);

router.get(
  '/monthly',
  auth,
  monthlyViewValidation,
  validate,
  workScheduleController.getMonthlyView
);

router.get(
  '/resume/:empleadoId?',
  auth,
  monthlyViewValidation,
  validate,
  workScheduleController.getMonthlyResume
);

router.get(
  '/:id',
  auth,
  validateObjectId('id'),
  workScheduleController.getWorkScheduleById
);

module.exports = router;
