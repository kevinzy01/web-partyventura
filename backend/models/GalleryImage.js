const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
  // Título de la imagen
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  // Descripción
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // URL o path de la imagen
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  
  // URL de la thumbnail (opcional)
  thumbnailUrl: {
    type: String,
    trim: true
  },
  
  // Nombre del archivo original
  filename: {
    type: String,
    required: true
  },
  
  // Tamaño del archivo en bytes
  fileSize: {
    type: Number,
    required: true
  },
  
  // Tipo MIME
  mimeType: {
    type: String,
    required: true
  },
  
  // Dimensiones de la imagen
  dimensions: {
    width: Number,
    height: Number
  },
  
  // Categoría
  category: {
    type: String,
    enum: ['eventos', 'instalaciones', 'fiestas', 'equipo', 'otros'],
    default: 'otros'
  },
  
  // Tags/etiquetas para búsqueda
  tags: [{
    type: String,
    trim: true
  }],
  
  // Orden de visualización
  order: {
    type: Number,
    default: 0
  },
  
  // Estado activo/visible
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Destacada (para mostrar en portada)
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Ubicación de visualización (hero o galeria)
  displayLocation: {
    type: String,
    enum: ['hero', 'galeria'],
    default: 'galeria'
  },
  
  // Contador de vistas
  views: {
    type: Number,
    default: 0
  },
  
  // Texto alternativo para accesibilidad
  altText: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Metadata adicional
  metadata: {
    type: Map,
    of: String
  },
  
  // Auditoría
  uploadedBy: {
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
galleryImageSchema.index({ category: 1, isActive: 1, order: 1 });
galleryImageSchema.index({ isFeatured: 1, isActive: 1 });
galleryImageSchema.index({ tags: 1 });

// Método para incrementar vistas
galleryImageSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Método para obtener representación pública
galleryImageSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    imageUrl: this.imageUrl,
    thumbnailUrl: this.thumbnailUrl,
    dimensions: this.dimensions,
    category: this.category,
    tags: this.tags,
    altText: this.altText,
    isFeatured: this.isFeatured,
    createdAt: this.createdAt
  };
};

// Método estático para obtener imágenes destacadas
galleryImageSchema.statics.getFeatured = function(limit = 6) {
  return this.find({ 
    isFeatured: true, 
    isActive: true 
  })
  .sort({ order: 1, createdAt: -1 })
  .limit(limit);
};

// Método estático para obtener por categoría
galleryImageSchema.statics.getByCategory = function(category) {
  return this.find({ 
    category, 
    isActive: true 
  }).sort({ order: 1, createdAt: -1 });
};

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
