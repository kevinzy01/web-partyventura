const mongoose = require('mongoose');

const timeRecordSchema = new mongoose.Schema({
  empleado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'El empleado es obligatorio']
  },
  empleadoNombre: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['entrada', 'salida'],
    required: [true, 'El tipo de registro es obligatorio']
  },
  fecha: {
    type: Date,
    default: Date.now,
    required: true
  },
  ubicacion: {
    type: String,
    default: 'Manual'
  },
  notas: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  },
  // Para cálculos posteriores
  horasTrabajadas: {
    type: Number, // En horas decimales
    default: null
  },
  // Referencia al registro de entrada correspondiente (solo para salidas)
  entradaAsociada: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeRecord',
    default: null
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
timeRecordSchema.index({ empleado: 1, fecha: -1 });
timeRecordSchema.index({ fecha: -1 });
timeRecordSchema.index({ tipo: 1 });

// Método para calcular horas trabajadas entre entrada y salida
timeRecordSchema.statics.calcularHorasTrabajadas = function(entrada, salida) {
  if (!entrada || !salida) return null;
  
  const diferenciaMs = new Date(salida) - new Date(entrada);
  const horas = diferenciaMs / (1000 * 60 * 60);
  
  return Math.round(horas * 100) / 100; // Redondear a 2 decimales
};

// Método para obtener registros por empleado y rango de fechas
timeRecordSchema.statics.getRegistrosPorEmpleado = function(empleadoId, fechaInicio, fechaFin) {
  const query = { empleado: empleadoId };
  
  if (fechaInicio || fechaFin) {
    query.fecha = {};
    if (fechaInicio) query.fecha.$gte = new Date(fechaInicio);
    if (fechaFin) query.fecha.$lte = new Date(fechaFin);
  }
  
  return this.find(query).sort({ fecha: -1 });
};

// Método para obtener el último registro de un empleado
timeRecordSchema.statics.getUltimoRegistro = function(empleadoId) {
  return this.findOne({ empleado: empleadoId }).sort({ fecha: -1 });
};

// Método para obtener resumen mensual de horas
timeRecordSchema.statics.getResumenMensual = async function(empleadoId, mes, anio) {
  const fechaInicio = new Date(anio, mes - 1, 1);
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59);
  
  const registros = await this.find({
    empleado: empleadoId,
    fecha: { $gte: fechaInicio, $lte: fechaFin }
  }).sort({ fecha: 1 });
  
  let totalHoras = 0;
  let entradaPendiente = null;
  
  registros.forEach(registro => {
    if (registro.tipo === 'entrada') {
      entradaPendiente = registro;
    } else if (registro.tipo === 'salida' && entradaPendiente) {
      const horas = this.calcularHorasTrabajadas(entradaPendiente.fecha, registro.fecha);
      if (horas) totalHoras += horas;
      entradaPendiente = null;
    }
  });
  
  return {
    mes,
    anio,
    totalHoras: Math.round(totalHoras * 100) / 100,
    totalDias: registros.length > 0 ? Math.ceil(registros.length / 2) : 0,
    registros: registros.length
  };
};

// Virtual para formato de fecha legible
timeRecordSchema.virtual('fechaFormateada').get(function() {
  return this.fecha.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Método para JSON público
timeRecordSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    empleadoId: this.empleado,
    empleadoNombre: this.empleadoNombre,
    tipo: this.tipo,
    fecha: this.fecha,
    fechaFormateada: this.fechaFormateada,
    ubicacion: this.ubicacion,
    notas: this.notas,
    horasTrabajadas: this.horasTrabajadas,
    entradaAsociada: this.entradaAsociada,
    createdAt: this.createdAt
  };
};

const TimeRecord = mongoose.model('TimeRecord', timeRecordSchema);

module.exports = TimeRecord;
