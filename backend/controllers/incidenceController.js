const Incidence = require('../models/Incidence');
const Admin = require('../models/Admin');
const WorkSchedule = require('../models/WorkSchedule');
const path = require('path');
const fs = require('fs');
const sendEmail = require('../config/email');
const incidenceStatusChangeEmail = require('../templates/incidenceStatusChangeEmail');

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
    if (!['pendiente', 'en_revision', 'aprobada', 'rechazada'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser: pendiente, en_revision, aprobada o rechazada'
      });
    }
    
    // Actualizar incidencia usando findByIdAndUpdate para evitar problemas de caché
    const incidencia = await Incidence.findByIdAndUpdate(
      id,
      {
        estado,
        comentarioAdmin: comentarioAdmin || null,
        revisadoPor: req.user._id,
        fechaRevision: new Date()
      },
      { 
        new: true, 
        runValidators: false // Desactivar validadores de Mongoose temporalmente
      }
    ).populate('empleado', 'nombre username email rolEmpleado')
      .populate('revisadoPor', 'nombre username');
    
    if (!incidencia) {
      return res.status(404).json({
        success: false,
        message: 'Incidencia no encontrada'
      });
    }
    
    console.log('✅ Incidencia revisada');
    
    // Enviar email de notificación al empleado (solo para estados finales)
    if (estado === 'aprobada' || estado === 'rechazada') {
      try {
        if (incidencia.empleado && incidencia.empleado.email) {
          console.log('📧 Enviando email de notificación a:', incidencia.empleado.email);
          
          const htmlContent = incidenceStatusChangeEmail(
            incidencia.empleado.nombre,
            incidencia,
            estado,
            comentarioAdmin
          );
          
          await sendEmail({
            to: incidencia.empleado.email,
            subject: `Actualización de Incidencia - ${estado === 'aprobada' ? 'Aprobada ✅' : 'Rechazada ❌'}`,
            html: htmlContent
          });
          
          console.log('✅ Email enviado correctamente');
        }
      } catch (emailError) {
        console.error('⚠️ Error al enviar email de notificación:', emailError.message);
        // No lanzar error, el proceso principal ya completó
      }
    } else {
      console.log('ℹ️ Email no enviado - estado intermedio:', estado);
    }
    
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

/**
 * Ver/Descargar documento adjunto de una incidencia
 * GET /api/incidences/:id/documento
 */
exports.getDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const empleadoId = req.user._id;
    
    console.log('📄 Solicitando documento de incidencia:', id);
    console.log('Usuario:', req.user.username, '- Rol:', req.user.rol);
    
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
        message: 'No tienes permiso para ver este documento'
      });
    }
    
    if (!incidencia.documentoAdjunto) {
      return res.status(404).json({
        success: false,
        message: 'Esta incidencia no tiene documento adjunto'
      });
    }
    
    // Construir ruta absoluta del archivo
    const filePath = path.join(__dirname, '..', incidencia.documentoAdjunto);
    
    console.log('Ruta del archivo:', filePath);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      console.error('❌ Archivo no encontrado en:', filePath);
      return res.status(404).json({
        success: false,
        message: 'El archivo no existe en el servidor'
      });
    }
    
    // Obtener información del archivo
    const fileName = path.basename(filePath);
    const fileExtension = path.extname(fileName).toLowerCase();
    
    // Determinar Content-Type según extensión
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    const contentType = contentTypes[fileExtension] || 'application/octet-stream';
    
    console.log('Tipo de archivo:', contentType);
    console.log('Nombre de archivo:', fileName);
    
    // Configurar headers de respuesta
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    
    // Para navegadores que no soportan inline para PDFs
    if (fileExtension === '.pdf') {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    
    // Enviar el archivo
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('❌ Error al enviar archivo:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error al enviar el archivo'
          });
        }
      } else {
        console.log('✅ Documento enviado correctamente');
      }
    });
    
  } catch (error) {
    console.error('Error al obtener documento:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener documento',
        error: error.message
      });
    }
  }
};
