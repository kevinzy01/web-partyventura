const mongoose = require('mongoose');

const incidenceSchema = new mongoose.Schema({
  // Referencia al empleado
  empleado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'El empleado es requerido']
  },
  
  // Campo desnormalizado para casos donde el empleado es eliminado
  empleadoNombre: {
    type: String,
    required: true
  },
  
  // Fecha de la incidencia
  fecha: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    validate: {
      validator: function(value) {
        // No permitir fechas más de 7 días en el pasado
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        
        const incidenceDate = new Date(value);
        incidenceDate.setHours(0, 0, 0, 0);
        
        return incidenceDate >= sevenDaysAgo;
      },
      message: 'La fecha no puede ser más de 7 días en el pasado'
    }
  },
  
  // Tipo de incidencia
  tipo: {
    type: String,
    enum: {
      values: ['falta', 'retraso', 'ausencia_justificada', 'baja_medica'],
      message: 'Tipo inválido. Debe ser: falta, retraso, ausencia_justificada o baja_medica'
    },
    required: [true, 'El tipo de incidencia es requerido']
  },
  
  // Motivo/descripción del empleado
  motivo: {
    type: String,
    required: [true, 'El motivo es requerido'],
    trim: true,
    minlength: [10, 'El motivo debe tener al menos 10 caracteres'],
    maxlength: [500, 'El motivo no puede exceder 500 caracteres']
  },
  
  // Estado de la incidencia
  estado: {
    type: String,
    enum: {
      values: ['pendiente', 'aprobada', 'rechazada'],
      message: 'Estado inválido'
    },
    default: 'pendiente'
  },
  
  // Ruta del documento adjunto (opcional, obligatorio para baja_medica)
  documentoAdjunto: {
    type: String,
    default: null,
    validate: {
      validator: function(value) {
        // Si es baja médica, el documento es obligatorio
        if (this.tipo === 'baja_medica' && !value) {
          return false;
        }
        return true;
      },
      message: 'El documento es obligatorio para bajas médicas'
    }
  },
  
  // Horas afectadas (calculado del horario asignado)
  horasAfectadas: {
    type: Number,
    default: 0,
    min: [0, 'Las horas afectadas no pueden ser negativas']
  },
  
  // Referencia al horario afectado (si existe)
  horarioAfectado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkSchedule',
    default: null
  },
  
  // Comentario del superadmin al revisar
  comentarioAdmin: {
    type: String,
    trim: true,
    maxlength: [500, 'El comentario no puede exceder 500 caracteres'],
    default: null
  },
  
  // Superadmin que revisó la incidencia
  revisadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  // Fecha de revisión
  fechaRevision: {
    type: Date,
    default: null
  },
  
  // Superadmin notificado por email (seleccionado en frontend)
  notificarA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

// ===================================
// ÍNDICES
// ===================================

// Índice compuesto: evitar duplicados (mismo empleado + misma fecha + mismo tipo)
incidenceSchema.index({ empleado: 1, fecha: 1, tipo: 1 }, { unique: true });

// Índice para búsquedas por fecha
incidenceSchema.index({ fecha: -1 });

// Índice para búsquedas por estado
incidenceSchema.index({ estado: 1 });

// Índice para búsquedas por empleado
incidenceSchema.index({ empleado: 1 });

// ===================================
// MÉTODOS DE INSTANCIA
// ===================================

/**
 * Formatear incidencia para respuesta al empleado
 */
incidenceSchema.methods.toEmployeeJSON = function() {
  return {
    id: this._id,
    fecha: this.fecha,
    fechaFormateada: this.fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }),
    tipo: this.tipo,
    motivo: this.motivo,
    estado: this.estado,
    documentoAdjunto: this.documentoAdjunto,
    horasAfectadas: this.horasAfectadas,
    comentarioAdmin: this.comentarioAdmin,
    fechaRevision: this.fechaRevision,
    createdAt: this.createdAt
  };
};

/**
 * Formatear incidencia para respuesta al admin
 */
incidenceSchema.methods.toAdminJSON = function() {
  const empleadoData = this.empleado && typeof this.empleado === 'object'
    ? {
        id: this.empleado._id,
        nombre: this.empleado.nombre,
        username: this.empleado.username,
        email: this.empleado.email,
        rolEmpleado: this.empleado.rolEmpleado
      }
    : {
        id: this.empleado,
        nombre: this.empleadoNombre
      };
  
  const revisadoPorData = this.revisadoPor && typeof this.revisadoPor === 'object'
    ? {
        id: this.revisadoPor._id,
        nombre: this.revisadoPor.nombre,
        username: this.revisadoPor.username
      }
    : null;

  return {
    id: this._id,
    empleado: empleadoData,
    fecha: this.fecha,
    fechaFormateada: this.fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }),
    tipo: this.tipo,
    motivo: this.motivo,
    estado: this.estado,
    documentoAdjunto: this.documentoAdjunto,
    horasAfectadas: this.horasAfectadas,
    horarioAfectado: this.horarioAfectado,
    comentarioAdmin: this.comentarioAdmin,
    revisadoPor: revisadoPorData,
    fechaRevision: this.fechaRevision,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// ===================================
// MÉTODOS ESTÁTICOS
// ===================================

/**
 * Obtener estadísticas de incidencias para el dashboard
 */
incidenceSchema.statics.getEstadisticas = async function(filtros = {}) {
  const match = {};
  
  if (filtros.empleadoId) {
    match.empleado = mongoose.Types.ObjectId(filtros.empleadoId);
  }
  
  if (filtros.mes && filtros.anio) {
    const inicioMes = new Date(filtros.anio, filtros.mes - 1, 1);
    const finMes = new Date(filtros.anio, filtros.mes, 0, 23, 59, 59, 999);
    match.fecha = { $gte: inicioMes, $lte: finMes };
  }
  
  const [estadisticas] = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalIncidencias: { $sum: 1 },
        pendientes: {
          $sum: { $cond: [{ $eq: ['$estado', 'pendiente'] }, 1, 0] }
        },
        aprobadas: {
          $sum: { $cond: [{ $eq: ['$estado', 'aprobada'] }, 1, 0] }
        },
        rechazadas: {
          $sum: { $cond: [{ $eq: ['$estado', 'rechazada'] }, 1, 0] }
        },
        totalHorasPerdidas: { $sum: '$horasAfectadas' },
        porTipo: {
          $push: {
            tipo: '$tipo',
            count: 1
          }
        }
      }
    }
  ]);
  
  // Agrupar por tipo
  const porTipo = {
    falta: 0,
    retraso: 0,
    ausencia_justificada: 0,
    baja_medica: 0
  };
  
  if (estadisticas && estadisticas.porTipo) {
    estadisticas.porTipo.forEach(item => {
      if (porTipo.hasOwnProperty(item.tipo)) {
        porTipo[item.tipo]++;
      }
    });
  }
  
  return estadisticas ? {
    totalIncidencias: estadisticas.totalIncidencias || 0,
    pendientes: estadisticas.pendientes || 0,
    aprobadas: estadisticas.aprobadas || 0,
    rechazadas: estadisticas.rechazadas || 0,
    totalHorasPerdidas: estadisticas.totalHorasPerdidas || 0,
    porTipo
  } : {
    totalIncidencias: 0,
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0,
    totalHorasPerdidas: 0,
    porTipo
  };
};

// ===================================
// MIDDLEWARE
// ===================================

// Antes de guardar, validar documento para baja médica
incidenceSchema.pre('save', function(next) {
  if (this.tipo === 'baja_medica' && !this.documentoAdjunto) {
    return next(new Error('El documento es obligatorio para bajas médicas'));
  }
  next();
});

const Incidence = mongoose.model('Incidence', incidenceSchema);

module.exports = Incidence;
