const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    unique: true,
    trim: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
    maxlength: [50, 'El nombre de usuario no puede exceder 50 caracteres']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No retornar password en queries por defecto
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email no válido']
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  rol: {
    type: String,
    enum: ['admin', 'superadmin', 'empleado'],
    default: 'empleado'
  },
  activo: {
    type: Boolean,
    default: true
  },
  ultimoAcceso: {
    type: Date,
    default: null
  },
  intentosFallidos: {
    type: Number,
    default: 0
  },
  bloqueadoHasta: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Encriptar password antes de guardar
adminSchema.pre('save', async function(next) {
  // Solo hashear si el password fue modificado
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
adminSchema.methods.compararPassword = async function(passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

// Método para verificar si está bloqueado
adminSchema.methods.estaBloqueado = function() {
  return this.bloqueadoHasta && this.bloqueadoHasta > Date.now();
};

// Método para registrar intento fallido
adminSchema.methods.registrarIntentoFallido = async function() {
  this.intentosFallidos += 1;
  
  // Bloquear después de 5 intentos fallidos por 15 minutos
  if (this.intentosFallidos >= 5) {
    this.bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000);
  }
  
  await this.save();
};

// Método para resetear intentos fallidos
adminSchema.methods.resetearIntentos = async function() {
  this.intentosFallidos = 0;
  this.bloqueadoHasta = null;
  this.ultimoAcceso = Date.now();
  await this.save();
};

module.exports = mongoose.model('Admin', adminSchema);
