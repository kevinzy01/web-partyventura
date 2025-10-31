const mongoose = require('mongoose');

const workScheduleSchema = new mongoose.Schema({
  empleado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'El empleado es obligatorio'],
    index: true
  },
  
  empleadoNombre: {
    type: String,
    required: [true, 'El nombre del empleado es obligatorio'],
    trim: true
  },
  
  fecha: {
    type: Date,
    required: [true, 'La fecha es obligatoria'],
    index: true
  },
  
  // Tipo de turno
  turno: {
    type: String,
    enum: ['mañana', 'tarde', 'completo'],
    required: [true, 'El tipo de turno es obligatorio']
  },
  
  // Horario específico
  horaInicio: {
    type: String, // Formato: "HH:MM"
    required: [true, 'La hora de inicio es obligatoria'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Formato de hora inválido. Usar HH:MM (00:00 - 23:59)'
    }
  },
  
  horaFin: {
    type: String, // Formato: "HH:MM"
    required: [true, 'La hora de fin es obligatoria'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Formato de hora inválido. Usar HH:MM (00:00 - 23:59)'
    }
  },
  
  // Estado del horario
  estado: {
    type: String,
    enum: ['programado', 'confirmado', 'cancelado', 'completado'],
    default: 'programado'
  },
  
  // Notas o instrucciones especiales
  notas: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres'],
    trim: true
  },
  
  // Color para visualización en calendario (hex)
  color: {
    type: String,
    default: '#f97316', // Naranja corporativo
    validate: {
      validator: function(v) {
        return /^#[0-9A-Fa-f]{6}$/.test(v);
      },
      message: 'Formato de color inválido. Usar formato hex (#RRGGBB)'
    }
  },
  
  // Horas totales del turno (calculado)
  horasTotales: {
    type: Number,
    min: 0,
    max: 24
  },
  
  // Auditoría - quién creó/modificó
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  modificadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
  
}, {
  timestamps: true
});

// Índices compuestos para búsquedas eficientes
workScheduleSchema.index({ empleado: 1, fecha: -1 });
workScheduleSchema.index({ fecha: 1, estado: 1 });
workScheduleSchema.index({ empleado: 1, fecha: 1 }, { unique: false }); // Permitir múltiples turnos mismo día si es necesario

// Middleware pre-save para calcular horas totales
workScheduleSchema.pre('save', function(next) {
  if (this.horaInicio && this.horaFin) {
    const [horaIni, minIni] = this.horaInicio.split(':').map(Number);
    const [horaFin, minFin] = this.horaFin.split(':').map(Number);
    
    const minutosInicio = horaIni * 60 + minIni;
    const minutosFin = horaFin * 60 + minFin;
    
    // Si horaFin es menor, asumimos que cruza la medianoche
    let diferenciaMinutos = minutosFin - minutosInicio;
    if (diferenciaMinutos < 0) {
      diferenciaMinutos += 24 * 60; // Agregar 24 horas
    }
    
    this.horasTotales = Math.round((diferenciaMinutos / 60) * 100) / 100;
  }
  next();
});

// Validación personalizada: horaFin debe ser mayor que horaInicio (mismo día)
workScheduleSchema.pre('save', function(next) {
  if (this.horaInicio && this.horaFin) {
    const [horaIni, minIni] = this.horaInicio.split(':').map(Number);
    const [horaFin, minFin] = this.horaFin.split(':').map(Number);
    
    const minutosInicio = horaIni * 60 + minIni;
    const minutosFin = horaFin * 60 + minFin;
    
    // Para turnos en el mismo día, horaFin debe ser mayor
    if (minutosFin <= minutosInicio) {
      return next(new Error('La hora de fin debe ser posterior a la hora de inicio'));
    }
  }
  next();
});

// Validación: horarios dentro del rango del parque
workScheduleSchema.pre('save', function(next) {
  const fecha = new Date(this.fecha);
  const diaSemana = fecha.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
  
  const [horaIni] = this.horaInicio.split(':').map(Number);
  const [horaFin] = this.horaFin.split(':').map(Number);
  
  // Lunes a Jueves: 17:00 - 22:00
  // Viernes a Domingo (5,6,0): 10:00 - 22:00
  // Festivos: 10:00 - 22:00 (no validamos festivos automáticamente)
  
  if (diaSemana >= 1 && diaSemana <= 4) { // Lunes a Jueves
    if (horaIni < 17 || horaFin > 22) {
      return next(new Error('Los horarios de lunes a jueves deben estar entre 17:00 y 22:00'));
    }
  } else { // Viernes a Domingo
    if (horaIni < 10 || horaFin > 22) {
      return next(new Error('Los horarios de viernes a domingo deben estar entre 10:00 y 22:00'));
    }
  }
  
  next();
});

// Método estático: Obtener horarios por empleado y rango de fechas
workScheduleSchema.statics.getHorariosPorEmpleado = function(empleadoId, fechaInicio, fechaFin) {
  const query = { empleado: empleadoId };
  
  if (fechaInicio || fechaFin) {
    query.fecha = {};
    if (fechaInicio) query.fecha.$gte = new Date(fechaInicio);
    if (fechaFin) query.fecha.$lte = new Date(fechaFin);
  }
  
  return this.find(query).sort({ fecha: 1 });
};

// Método estático: Obtener horarios de la semana para un empleado
workScheduleSchema.statics.getHorariosSemana = function(empleadoId, fecha) {
  const fechaRef = new Date(fecha);
  const diaSemana = fechaRef.getDay();
  
  // Calcular inicio de semana (lunes)
  const inicioSemana = new Date(fechaRef);
  inicioSemana.setDate(fechaRef.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
  inicioSemana.setHours(0, 0, 0, 0);
  
  // Calcular fin de semana (domingo)
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);
  
  return this.find({
    empleado: empleadoId,
    fecha: { $gte: inicioSemana, $lte: finSemana }
  }).sort({ fecha: 1 });
};

// Método estático: Obtener horarios del mes para un empleado
workScheduleSchema.statics.getHorariosMes = function(empleadoId, mes, anio) {
  const fechaInicio = new Date(anio, mes - 1, 1);
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999);
  
  return this.find({
    empleado: empleadoId,
    fecha: { $gte: fechaInicio, $lte: fechaFin }
  }).sort({ fecha: 1 });
};

// Método estático: Verificar solapamientos de horarios
workScheduleSchema.statics.verificarSolapamiento = async function(empleadoId, fecha, horaInicio, horaFin, excluirId = null) {
  const fechaObj = new Date(fecha);
  fechaObj.setHours(0, 0, 0, 0);
  
  const fechaFin = new Date(fechaObj);
  fechaFin.setHours(23, 59, 59, 999);
  
  const query = {
    empleado: empleadoId,
    fecha: { $gte: fechaObj, $lte: fechaFin },
    estado: { $ne: 'cancelado' }
  };
  
  // Si estamos actualizando, excluir el horario actual
  if (excluirId) {
    query._id = { $ne: excluirId };
  }
  
  const horariosExistentes = await this.find(query);
  
  // Convertir horas a minutos para comparación
  const [horaIniNueva, minIniNueva] = horaInicio.split(':').map(Number);
  const [horaFinNueva, minFinNueva] = horaFin.split(':').map(Number);
  const minInicioNuevo = horaIniNueva * 60 + minIniNueva;
  const minFinNuevo = horaFinNueva * 60 + minFinNueva;
  
  for (const horario of horariosExistentes) {
    const [horaIniExistente, minIniExistente] = horario.horaInicio.split(':').map(Number);
    const [horaFinExistente, minFinExistente] = horario.horaFin.split(':').map(Number);
    const minInicioExistente = horaIniExistente * 60 + minIniExistente;
    const minFinExistenteTotal = horaFinExistente * 60 + minFinExistente;
    
    // Verificar solapamiento
    if (
      (minInicioNuevo >= minInicioExistente && minInicioNuevo < minFinExistenteTotal) ||
      (minFinNuevo > minInicioExistente && minFinNuevo <= minFinExistenteTotal) ||
      (minInicioNuevo <= minInicioExistente && minFinNuevo >= minFinExistenteTotal)
    ) {
      return {
        solapamiento: true,
        horario: horario
      };
    }
  }
  
  return { solapamiento: false };
};

// Método estático: Obtener resumen de horas programadas del mes
workScheduleSchema.statics.getResumenMensual = async function(empleadoId, mes, anio) {
  const fechaInicio = new Date(anio, mes - 1, 1);
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999);
  
  const horarios = await this.find({
    empleado: empleadoId,
    fecha: { $gte: fechaInicio, $lte: fechaFin },
    estado: { $ne: 'cancelado' }
  });
  
  const totalHoras = horarios.reduce((sum, horario) => sum + (horario.horasTotales || 0), 0);
  const diasTrabajo = new Set(horarios.map(h => h.fecha.toDateString())).size;
  
  return {
    mes,
    anio,
    totalHoras: Math.round(totalHoras * 100) / 100,
    diasTrabajo,
    turnosProgramados: horarios.length,
    estadisticas: {
      programados: horarios.filter(h => h.estado === 'programado').length,
      confirmados: horarios.filter(h => h.estado === 'confirmado').length,
      completados: horarios.filter(h => h.estado === 'completado').length
    }
  };
};

// Virtual para formato de fecha legible
workScheduleSchema.virtual('fechaFormateada').get(function() {
  return this.fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual para día de la semana
workScheduleSchema.virtual('diaSemana').get(function() {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return dias[this.fecha.getDay()];
});

// Método para JSON público (para empleados)
workScheduleSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    fecha: this.fecha,
    fechaFormateada: this.fechaFormateada,
    diaSemana: this.diaSemana,
    turno: this.turno,
    horaInicio: this.horaInicio,
    horaFin: this.horaFin,
    horasTotales: this.horasTotales,
    estado: this.estado,
    notas: this.notas,
    color: this.color
  };
};

// Método para JSON completo (para administradores)
workScheduleSchema.methods.toAdminJSON = function() {
  return {
    id: this._id,
    empleado: {
      id: this.empleado,
      nombre: this.empleadoNombre
    },
    fecha: this.fecha,
    fechaFormateada: this.fechaFormateada,
    diaSemana: this.diaSemana,
    turno: this.turno,
    horaInicio: this.horaInicio,
    horaFin: this.horaFin,
    horasTotales: this.horasTotales,
    estado: this.estado,
    notas: this.notas,
    color: this.color,
    creadoPor: this.creadoPor,
    modificadoPor: this.modificadoPor,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const WorkSchedule = mongoose.model('WorkSchedule', workScheduleSchema);

module.exports = WorkSchedule;
