const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    minlength: [5, 'El título debe tener al menos 5 caracteres'],
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  contenido: {
    type: String,
    required: [true, 'El contenido es obligatorio'],
    minlength: [20, 'El contenido debe tener al menos 20 caracteres']
  },
  resumen: {
    type: String,
    required: [true, 'El resumen es obligatorio'],
    maxlength: [300, 'El resumen no puede exceder 300 caracteres']
  },
  imagen: {
    type: String,
    default: null
  },
  categoria: {
    type: String,
    enum: ['eventos', 'promociones', 'noticias', 'general'],
    default: 'general'
  },
  publicado: {
    type: Boolean,
    default: true
  },
  vistas: {
    type: Number,
    default: 0
  },
  fechaPublicacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice para búsquedas
newsSchema.index({ titulo: 'text', contenido: 'text' });

module.exports = mongoose.model('News', newsSchema);
