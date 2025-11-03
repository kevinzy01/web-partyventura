const Incidence = require('../models/Incidence');
const Admin = require('../models/Admin');
const WorkSchedule = require('../models/WorkSchedule');
const path = require('path');
const fs = require('fs');

// ==================== EMPLEADOS ====================

/**
 * Crear nueva incidencia (solo empleados)
 * POST /api/incidences
 */
exports.createIncidence = async (req, res) => {
  try {
    console.log('📝 Creando incidencia...');
    console.log('Usuario:', req.user.username);
    console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
    console.log('Archivo:', req.file ? req.file.filename : 'No hay archivo');
    
    const { fecha, tipo, motivo, notificarA } = req.body;
    const empleadoId = req.user._id;
    
    // Validar que es empleado
    if (req.user.rol !== 'empleado') {
      return res.status(403).json({
        success: false,
        message: 'Solo los empleados pueden crear incidencias'
      });
    }
    
    // Validar documento para baja médica
    if (tipo === 'baja_medica' && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'El documento es obligatorio para bajas médicas'
      });
    }
    
    // Normalizar fecha a medianoche
    const fechaIncidencia = new Date(fecha);
    fechaIncidencia.setHours(0, 0, 0, 0);
    
    // Validar que la fecha no sea más de 7 días en el pasado
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    if (fechaIncidencia < sevenDaysAgo) {
      // Si hay archivo, eliminarlo
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'No puedes reportar incidencias de más de 7 días atrás'
      });
    }
    
    // Buscar si existe horario asignado ese día
    let horasAfectadas = 0;
    let horarioAfectadoId = null;
    
    const horario = await WorkSchedule.findOne({
      empleado: empleadoId,
      fecha: fechaIncidencia,
      estado: { $ne: 'cancelado' }
    });
    
    if (horario) {
      horasAfectadas = horario.horasTotales || 0;
      horarioAfectadoId = horario._id;
      console.log(`✅ Horario encontrado: ${horasAfectadas}h`);
    } else {
      console.log('⚠️ No hay horario asignado para esa fecha');
    }
    
    // Validar superadmin notificado (si se proporcionó)
    let notificarAId = null;
    if (notificarA) {
      const superadmin = await Admin.findOne({
        _id: notificarA,
        rol: 'superadmin'
      });
      
      if (!superadmin) {
        // Si hay archivo, eliminarlo
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'El superadmin seleccionado no es válido'
        });
      }
      notificarAId = superadmin._id;
    }
    
    // Crear incidencia
    const incidencia = new Incidence({
      empleado: empleadoId,
      empleadoNombre: req.user.nombre,
      fecha: fechaIncidencia,
      tipo,
      motivo,
      documentoAdjunto: req.file ? `/uploads/incidencias/${req.file.filename}` : null,
      horasAfectadas,
      horarioAfectado: horarioAfectadoId,
      notificarA: notificarAId
    });
    
    await incidencia.save();
    
    console.log('✅ Incidencia creada:', incidencia._id);
    
    // TODO: Enviar email de notificación al superadmin (Fase futura)
    
    res.status(201).json({
      success: true,
      message: 'Incidencia registrada correctamente',
      data: incidencia.toEmployeeJSON()
    });
    
  } catch (error) {
    console.error('❌ Error al crear incidencia:', error);
    
    // Si hay archivo subido, eliminarlo en caso de error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo:', unlinkError);
      }
    }
    
    // Manejo de errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    // Error de duplicado (índice único)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una incidencia de este tipo para la fecha seleccionada'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear incidencia',
      error: error.message
    });
  }
};

/**
 * Obtener incidencias del empleado actual
 * GET /api/incidences/mis-incidencias
 */
exports.getMisIncidencias = async (req, res) => {
  try {
    const empleadoId = req.user._id;
    
    // Validar que es empleado
    if (req.user.rol !== 'empleado') {
      return res.status(403).json({
        success: false,
        message: 'Solo los empleados pueden acceder a esta ruta'
      });
    }
    
    const { tipo, estado, mes, anio, page = 1, limit = 50 } = req.query;
    
    // Construir filtro
    const filter = { empleado: empleadoId };
    
    if (tipo) filter.tipo = tipo;
    if (estado) filter.estado = estado;
    
    if (mes && anio) {
      const inicioMes = new Date(anio, mes - 1, 1);
      const finMes = new Date(anio, mes, 0, 23, 59, 59, 999);
      filter.fecha = { $gte: inicioMes, $lte: finMes };
    }
    
    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [incidencias, total] = await Promise.all([
      Incidence.find(filter)
        .sort({ fecha: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Incidence.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: incidencias.map(inc => inc.toEmployeeJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error al obtener incidencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener incidencias',
      error: error.message
    });
  }
};

/**
 * Obtener detalle de una incidencia específica
 * GET /api/incidences/:id
 */
exports.getIncidencia = async (req, res) => {
  try {
    const { id } = req.params;
    const empleadoId = req.user._id;
    
    const incidencia = await Incidence.findById(id);
    
    if (!incidencia) {
      return res.status(404).json({
        success: false,
        message: 'Incidencia no encontrada'
      });
    }
    
    // Validar permisos: solo el empleado dueño o superadmin
    if (req.user.rol === 'empleado' && incidencia.empleado.toString() !== empleadoId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta incidencia'
      });
    }
    
    const responseMethod = req.user.rol === 'empleado' ? 'toEmployeeJSON' : 'toAdminJSON';
    
    res.json({
      success: true,
      data: incidencia[responseMethod]()
    });
    
  } catch (error) {
    console.error('Error al obtener incidencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener incidencia',
      error: error.message
    });
  }
};

// ==================== SUPERADMIN ====================

/**
 * Obtener todas las incidencias (solo superadmin)
 * GET /api/incidences/admin/todas
 */
exports.getAllIncidencias = async (req, res) => {
  try {
    const { empleadoId, tipo, estado, mes, anio, page = 1, limit = 50 } = req.query;
    
    // Construir filtro
    const filter = {};
    
    if (empleadoId) filter.empleado = empleadoId;
    if (tipo) filter.tipo = tipo;
    if (estado) filter.estado = estado;
    
    if (mes && anio) {
      const inicioMes = new Date(anio, mes - 1, 1);
      const finMes = new Date(anio, mes, 0, 23, 59, 59, 999);
      filter.fecha = { $gte: inicioMes, $lte: finMes };
    }
    
    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [incidencias, total] = await Promise.all([
      Incidence.find(filter)
        .populate('empleado', 'nombre username email rolEmpleado')
        .populate('revisadoPor', 'nombre username')
        .sort({ fecha: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Incidence.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: incidencias.map(inc => inc.toAdminJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error al obtener incidencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener incidencias',
      error: error.message
    });
  }
};

/**
 * Obtener solo incidencias pendientes (solo superadmin)
 * GET /api/incidences/admin/pendientes
 */
exports.getPendientes = async (req, res) => {
  try {
    const incidencias = await Incidence.find({ estado: 'pendiente' })
      .populate('empleado', 'nombre username email rolEmpleado')
      .sort({ fecha: -1, createdAt: -1 });
    
    res.json({
      success: true,
      data: incidencias.map(inc => inc.toAdminJSON()),
      count: incidencias.length
    });
    
  } catch (error) {
    console.error('Error al obtener pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener incidencias pendientes',
      error: error.message
    });
  }
};

/**
 * Revisar incidencia (aprobar/rechazar) (solo superadmin)
 * PATCH /api/incidences/admin/:id/revisar
 */
exports.revisarIncidencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, comentarioAdmin } = req.body;
    
    console.log('🔍 Revisando incidencia:', id);
    console.log('Nuevo estado:', estado);
    console.log('Comentario:', comentarioAdmin);
    
    // Validar estado
    if (!['aprobada', 'rechazada'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser "aprobada" o "rechazada"'
      });
    }
    
    const incidencia = await Incidence.findById(id);
    
    if (!incidencia) {
      return res.status(404).json({
        success: false,
        message: 'Incidencia no encontrada'
      });
    }
    
    // Actualizar incidencia
    incidencia.estado = estado;
    incidencia.comentarioAdmin = comentarioAdmin || null;
    incidencia.revisadoPor = req.user._id;
    incidencia.fechaRevision = new Date();
    
    await incidencia.save();
    
    // Populate para respuesta
    await incidencia.populate('empleado', 'nombre username email rolEmpleado');
    await incidencia.populate('revisadoPor', 'nombre username');
    
    console.log('✅ Incidencia revisada');
    
    // TODO: Enviar email al empleado notificando la revisión (Fase futura)
    
    res.json({
      success: true,
      message: `Incidencia ${estado} correctamente`,
      data: incidencia.toAdminJSON()
    });
    
  } catch (error) {
    console.error('Error al revisar incidencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al revisar incidencia',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de incidencias (solo superadmin)
 * GET /api/incidences/admin/estadisticas
 */
exports.getEstadisticas = async (req, res) => {
  try {
    const { empleadoId, mes, anio } = req.query;
    
    const filtros = {};
    if (empleadoId) filtros.empleadoId = empleadoId;
    if (mes && anio) {
      filtros.mes = parseInt(mes);
      filtros.anio = parseInt(anio);
    }
    
    const estadisticas = await Incidence.getEstadisticas(filtros);
    
    res.json({
      success: true,
      data: estadisticas
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Eliminar incidencia (solo superadmin)
 * DELETE /api/incidences/admin/:id
 */
exports.deleteIncidencia = async (req, res) => {
  try {
    const { id } = req.params;
    
    const incidencia = await Incidence.findById(id);
    
    if (!incidencia) {
      return res.status(404).json({
        success: false,
        message: 'Incidencia no encontrada'
      });
    }
    
    // Eliminar archivo adjunto si existe
    if (incidencia.documentoAdjunto) {
      const filePath = path.join(__dirname, '..', incidencia.documentoAdjunto);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Archivo eliminado:', filePath);
      }
    }
    
    await incidencia.deleteOne();
    
    console.log('✅ Incidencia eliminada:', id);
    
    res.json({
      success: true,
      message: 'Incidencia eliminada correctamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar incidencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar incidencia',
      error: error.message
    });
  }
};
