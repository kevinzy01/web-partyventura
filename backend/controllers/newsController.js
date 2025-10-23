const News = require('../models/News');
const fs = require('fs').promises;
const path = require('path');

// Función auxiliar para crear slug
const createSlug = (titulo) => {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/--+/g, '-') // Reemplazar múltiples guiones con uno solo
    .trim();
};

// @desc    Obtener todas las noticias
// @route   GET /api/news
// @access  Public
exports.getAllNews = async (req, res) => {
  try {
    const { categoria, publicado, limit = 10, page = 1 } = req.query;
    
    const query = {};
    if (categoria) query.categoria = categoria;
    if (publicado !== undefined) query.publicado = publicado === 'true';

    const news = await News.find(query)
      .sort({ fechaPublicacion: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await News.countDocuments(query);

    res.status(200).json({
      success: true,
      count: news.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: news
    });
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las noticias'
    });
  }
};

// @desc    Obtener una noticia por ID o slug
// @route   GET /api/news/:idOrSlug
// @access  Public
exports.getNewsById = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    // Buscar por ID o slug
    const news = await News.findOne({
      $or: [
        { _id: idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? idOrSlug : null },
        { slug: idOrSlug }
      ]
    });

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Noticia no encontrada'
      });
    }

    // Incrementar vistas
    news.vistas += 1;
    await news.save();

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error al obtener noticia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la noticia'
    });
  }
};

// @desc    Crear nueva noticia
// @route   POST /api/news
// @access  Private
exports.createNews = async (req, res) => {
  try {
    const { titulo, contenido, resumen, categoria, publicado } = req.body;

    // Validar campos requeridos
    if (!titulo || !contenido || !resumen) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos requeridos'
      });
    }

    // Crear slug único
    let slug = createSlug(titulo);
    let slugExists = await News.findOne({ slug });
    let counter = 1;
    
    while (slugExists) {
      slug = `${createSlug(titulo)}-${counter}`;
      slugExists = await News.findOne({ slug });
      counter++;
    }

    // Procesar imagen si existe
    let imagenPath = null;
    if (req.file) {
      imagenPath = `/uploads/${req.file.filename}`;
    }

    const news = await News.create({
      titulo,
      slug,
      contenido,
      resumen,
      categoria: categoria || 'general',
      publicado: publicado !== undefined ? publicado : true,
      imagen: imagenPath
    });

    res.status(201).json({
      success: true,
      message: 'Noticia creada correctamente',
      data: news
    });
  } catch (error) {
    console.error('Error al crear noticia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la noticia',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Actualizar noticia
// @route   PUT /api/news/:id
// @access  Private
exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, contenido, resumen, categoria, publicado } = req.body;

    let news = await News.findById(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Noticia no encontrada'
      });
    }

    // Si se cambia el título, actualizar el slug
    if (titulo && titulo !== news.titulo) {
      let slug = createSlug(titulo);
      let slugExists = await News.findOne({ slug, _id: { $ne: id } });
      let counter = 1;
      
      while (slugExists) {
        slug = `${createSlug(titulo)}-${counter}`;
        slugExists = await News.findOne({ slug, _id: { $ne: id } });
        counter++;
      }
      
      news.slug = slug;
    }

    // Actualizar imagen si se proporciona una nueva
    if (req.file) {
      // Eliminar imagen anterior si existe
      if (news.imagen) {
        const oldImagePath = path.join(__dirname, '..', news.imagen);
        try {
          await fs.unlink(oldImagePath);
        } catch (err) {
          console.error('Error al eliminar imagen anterior:', err);
        }
      }
      news.imagen = `/uploads/${req.file.filename}`;
    }

    // Actualizar campos
    if (titulo) news.titulo = titulo;
    if (contenido) news.contenido = contenido;
    if (resumen) news.resumen = resumen;
    if (categoria) news.categoria = categoria;
    if (publicado !== undefined) news.publicado = publicado;

    await news.save();

    res.status(200).json({
      success: true,
      message: 'Noticia actualizada correctamente',
      data: news
    });
  } catch (error) {
    console.error('Error al actualizar noticia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la noticia'
    });
  }
};

// @desc    Eliminar noticia
// @route   DELETE /api/news/:id
// @access  Private
exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Noticia no encontrada'
      });
    }

    // Eliminar imagen asociada si existe
    if (news.imagen) {
      const imagePath = path.join(__dirname, '..', news.imagen);
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.error('Error al eliminar imagen:', err);
      }
    }

    await news.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Noticia eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la noticia'
    });
  }
};
