const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // Título del evento
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  // Descripción del evento
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Fecha y hora de inicio
  startDate: {
    type: Date,
    required: true
  },
  
  // Fecha y hora de fin
  endDate: {
    type: Date,
    required: true
  },
  
  // Ubicación del evento
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Tipo de evento
  eventType: {
    type: String,
    enum: ['fiesta', 'cumpleaños', 'corporativo', 'boda', 'otro'],
    default: 'fiesta'
  },
  
  // Imagen del evento (URL o path)
  image: {
    type: String,
    trim: true
  },
  
  // Color para el calendario (hex)
  color: {
    type: String,
    default: '#FF6B35',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Color debe ser un código hexadecimal válido'
    }
  },
  
  // Capacidad máxima
  maxCapacity: {
    type: Number,
    min: 0
  },
  
  // Precio (opcional)
  price: {
    type: Number,
    min: 0
  },
  
  // Estado del evento
  status: {
    type: String,
    enum: ['programado', 'en-curso', 'completado', 'cancelado'],
    default: 'programado'
  },
  
  // Visibilidad pública
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Permitir reservas
  allowBooking: {
    type: Boolean,
    default: false
  },
  
  // Tags/etiquetas
  tags: [{
    type: String,
    trim: true
  }],
  
  // Información de contacto para el evento
  contactInfo: {
    email: String,
    phone: String
  },
  
  // Notas internas (solo para admins)
  notes: {
    type: String,
    maxlength: 1000
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

// Índices
eventSchema.index({ startDate: 1, isPublic: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventType: 1 });

// Virtual para verificar si el evento está activo
eventSchema.virtual('isActive').get(function() {
  return this.status !== 'cancelado' && this.endDate > new Date();
});

// Método para obtener representación pública
eventSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    startDate: this.startDate,
    endDate: this.endDate,
    location: this.location,
    eventType: this.eventType,
    image: this.image,
    color: this.color,
    maxCapacity: this.maxCapacity,
    price: this.price,
    status: this.status,
    tags: this.tags,
    contactInfo: this.contactInfo
  };
};

// Método para obtener eventos del mes
eventSchema.statics.getEventsForMonth = function(year, month) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  
  return this.find({
    startDate: { $gte: startOfMonth, $lte: endOfMonth },
    isPublic: true,
    status: { $ne: 'cancelado' }
  }).sort({ startDate: 1 });
};

module.exports = mongoose.model('Event', eventSchema);
