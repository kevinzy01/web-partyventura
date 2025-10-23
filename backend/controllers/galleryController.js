const GalleryImage = require('../models/GalleryImage');
const path = require('path');
const fs = require('fs').promises;

// Obtener todas las imágenes (con filtros opcionales)
exports.getImages = async (req, res) => {
  try {
    const { category, isActive, isFeatured, tags, displayLocation } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (tags) filter.tags = { $in: tags.split(',') };
    
    // Filtro especial para displayLocation que también incluye imágenes sin el campo
    if (displayLocation) {
      filter.$or = [
        { displayLocation: displayLocation },
        { displayLocation: { $exists: false } } // Incluir imágenes antiguas sin el campo
      ];
    }
    
    const images = await GalleryImage.find(filter)
      .populate('uploadedBy', 'username email')
      .populate('updatedBy', 'username email')
      .sort({ order: 1, createdAt: -1 });
    
    res.json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error al obtener imágenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener imágenes',
      error: error.message
    });
  }
};

// Obtener imágenes públicas (sin autenticación)
exports.getPublicImages = async (req, res) => {
  try {
    const { category, isFeatured, limit, displayLocation } = req.query;
    
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    
    // Filtro especial para displayLocation que también incluye imágenes sin el campo
    if (displayLocation) {
      filter.$or = [
        { displayLocation: displayLocation },
        { displayLocation: { $exists: false } } // Incluir imágenes antiguas sin el campo
      ];
    }
    
    let query = GalleryImage.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .select('-uploadedBy -updatedBy -__v');
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const images = await query;
    
    res.json({
      success: true,
      count: images.length,
      data: images.map(image => image.toPublicJSON())
    });
  } catch (error) {
    console.error('Error al obtener imágenes públicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener imágenes',
      error: error.message
    });
  }
};

// Obtener imágenes destacadas
exports.getFeaturedImages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const images = await GalleryImage.getFeatured(limit);
    
    res.json({
      success: true,
      count: images.length,
      data: images.map(image => image.toPublicJSON())
    });
  } catch (error) {
    console.error('Error al obtener imágenes destacadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener imágenes destacadas',
      error: error.message
    });
  }
};

// Obtener una imagen específica
exports.getImageById = async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id)
      .populate('uploadedBy', 'username email')
      .populate('updatedBy', 'username email');
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error('Error al obtener imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener imagen',
      error: error.message
    });
  }
};

// Subir nueva imagen (admin y superadmin)
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }
    
    const imageData = {
      title: req.body.title || req.file.originalname,
      description: req.body.description,
      imageUrl: `/uploads/gallery/${req.file.filename}`,
      thumbnailUrl: req.body.thumbnailUrl,
      filename: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      category: req.body.category || 'otros',
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      altText: req.body.altText,
      isFeatured: req.body.isFeatured === 'true',
      displayLocation: req.body.displayLocation || 'galeria',
      order: req.body.order ? parseInt(req.body.order) : 0,
      uploadedBy: req.user._id
    };
    
    // Si se proporcionan dimensiones
    if (req.body.width && req.body.height) {
      imageData.dimensions = {
        width: parseInt(req.body.width),
        height: parseInt(req.body.height)
      };
    }
    
    const image = new GalleryImage(imageData);
    await image.save();
    
    await image.populate('uploadedBy', 'username email');
    
    res.status(201).json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: image
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    
    // Eliminar archivo si hubo error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo:', unlinkError);
      }
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al subir imagen',
      error: error.message
    });
  }
};

// Actualizar información de imagen (admin y superadmin)
exports.updateImage = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };
    
    // No permitir cambiar el uploader
    delete updateData.uploadedBy;
    delete updateData.imageUrl;
    delete updateData.filename;
    
    // Convertir tags si viene como string
    if (req.body.tags && typeof req.body.tags === 'string') {
      updateData.tags = JSON.parse(req.body.tags);
    }
    
    const image = await GalleryImage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('uploadedBy', 'username email')
    .populate('updatedBy', 'username email');
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Imagen actualizada exitosamente',
      data: image
    });
  } catch (error) {
    console.error('Error al actualizar imagen:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar imagen',
      error: error.message
    });
  }
};

// Eliminar imagen (admin y superadmin)
exports.deleteImage = async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }
    
    // Eliminar archivo físico
    const filePath = path.join(__dirname, '..', 'uploads', 'gallery', image.filename);
    try {
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error('Error al eliminar archivo físico:', fileError);
      // Continuar aunque falle la eliminación del archivo
    }
    
    await image.deleteOne();
    
    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar imagen',
      error: error.message
    });
  }
};

// Toggle estado activo/inactivo (admin y superadmin)
exports.toggleImageStatus = async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }
    
    image.isActive = !image.isActive;
    image.updatedBy = req.user._id;
    await image.save();
    
    await image.populate('uploadedBy', 'username email');
    await image.populate('updatedBy', 'username email');
    
    res.json({
      success: true,
      message: `Imagen ${image.isActive ? 'activada' : 'desactivada'} exitosamente`,
      data: image
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de la imagen',
      error: error.message
    });
  }
};

// Toggle destacado (admin y superadmin)
exports.toggleFeatured = async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }
    
    image.isFeatured = !image.isFeatured;
    image.updatedBy = req.user._id;
    await image.save();
    
    await image.populate('uploadedBy', 'username email');
    await image.populate('updatedBy', 'username email');
    
    res.json({
      success: true,
      message: `Imagen ${image.isFeatured ? 'marcada como destacada' : 'desmarcada'} exitosamente`,
      data: image
    });
  } catch (error) {
    console.error('Error al cambiar destacado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado destacado',
      error: error.message
    });
  }
};
