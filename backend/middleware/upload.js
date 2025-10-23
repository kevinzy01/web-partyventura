const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que existen las carpetas de uploads
const uploadsDir = path.join(__dirname, '../uploads');
const galleryDir = path.join(__dirname, '../uploads/gallery');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

// Configuración de almacenamiento para galería
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, galleryDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, basename + '-' + uniqueSuffix + ext);
  }
});

// Configurar almacenamiento general (para otras funcionalidades)
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp-nombreoriginal
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para validar tipos de archivo
const imageFilter = (req, file, cb) => {
  // Aceptar solo imágenes
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
  }
};

// Configurar multer para galería
const galleryUpload = multer({
  storage: galleryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Límite de 10MB para galería
  },
  fileFilter: imageFilter
});

// Configurar multer general
const upload = multer({
  storage: generalStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB general
  },
  fileFilter: imageFilter
});

// Middleware para manejo de errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. El tamaño máximo permitido es 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error al subir archivo: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

module.exports = {
  upload,
  galleryUpload,
  handleMulterError
};

