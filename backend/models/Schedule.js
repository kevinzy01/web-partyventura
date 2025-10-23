const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  // Tipo de horario: 'general', 'especial', 'tarifa'
  type: {
    type: String,
    enum: ['horario', 'tarifa'],
    required: true
  },
  
  // Título del horario/tarifa
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Descripción
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Para horarios: días de la semana
  days: [{
    type: String,
    enum: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
  }],
  
  // Para horarios: horario de apertura/cierre
  openTime: {
    type: String, // Formato: "HH:MM"
    required: function() {
      return this.type === 'horario' && this.days && this.days.length > 0;
    },
    validate: {
      validator: function(v) {
        if (!v || v === '') return true; // Permitir vacío
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Formato de hora inválido. Usar HH:MM'
    }
  },
  
  closeTime: {
    type: String, // Formato: "HH:MM"
    required: function() {
      return this.type === 'horario' && this.days && this.days.length > 0;
    },
    validate: {
      validator: function(v) {
        if (!v || v === '') return true; // Permitir vacío
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Formato de hora inválido. Usar HH:MM'
    }
  },
  
  // Para tarifas: precio
  price: {
    type: Number,
    min: 0
  },
  
  // Para tarifas: moneda
  currency: {
    type: String,
    default: 'EUR',
    maxlength: 3
  },
  
  // Para tarifas: unidad (por hora, por día, por persona, etc.)
  unit: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  // Ícono (opcional, para mostrar en frontend)
  icon: {
    type: String,
    trim: true
  },
  
  // Orden de visualización
  order: {
    type: Number,
    default: 0
  },
  
  // Estado activo/inactivo
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Información adicional en formato JSON
  metadata: {
    type: Map,
    of: String
  },
  
  // Auditoría
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
  
}, {
  timestamps: true
});

// Índices para mejorar búsquedas
scheduleSchema.index({ type: 1, isActive: 1, order: 1 });

// Método para obtener representación pública
scheduleSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    type: this.type,
    title: this.title,
    description: this.description,
    days: this.days,
    openTime: this.openTime,
    closeTime: this.closeTime,
    price: this.price,
    currency: this.currency,
    unit: this.unit,
    icon: this.icon,
    order: this.order,
    isActive: this.isActive
  };
};

module.exports = mongoose.model('Schedule', scheduleSchema);
