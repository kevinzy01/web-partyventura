const Event = require('../models/Event');

// Obtener todos los eventos (con filtros opcionales)
exports.getEvents = async (req, res) => {
  try {
    const { status, eventType, startDate, endDate, isPublic } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (eventType) filter.eventType = eventType;
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
    
    // Filtro por rango de fechas
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }
    
    const events = await Event.find(filter)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .sort({ startDate: 1 });
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos',
      error: error.message
    });
  }
};

// Obtener eventos públicos (sin autenticación)
exports.getPublicEvents = async (req, res) => {
  try {
    const { month, year, eventType, limit } = req.query;
    
    const filter = {
      isPublic: true,
      status: { $ne: 'cancelado' }
    };
    
    // Filtrar por tipo de evento
    if (eventType) filter.eventType = eventType;
    
    // Filtrar por mes específico
    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      filter.startDate = { $gte: startOfMonth, $lte: endOfMonth };
    } else {
      // Solo eventos futuros si no se especifica mes
      filter.endDate = { $gte: new Date() };
    }
    
    let query = Event.find(filter)
      .sort({ startDate: 1 })
      .select('-notes -createdBy -updatedBy -__v');
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const events = await query;
    
    res.json({
      success: true,
      count: events.length,
      data: events.map(event => event.toPublicJSON())
    });
  } catch (error) {
    console.error('Error al obtener eventos públicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos',
      error: error.message
    });
  }
};

// Obtener eventos del calendario (para vista de calendario)
exports.getCalendarEvents = async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren las fechas de inicio y fin'
      });
    }
    
    const events = await Event.find({
      startDate: {
        $gte: new Date(start),
        $lte: new Date(end)
      },
      isPublic: true,
      status: { $ne: 'cancelado' }
    }).select('title startDate endDate color eventType');
    
    // Formatear para FullCalendar o similar
    const calendarEvents = events.map(event => ({
      id: event._id,
      title: event.title,
      start: event.startDate,
      end: event.endDate,
      color: event.color,
      extendedProps: {
        eventType: event.eventType
      }
    }));
    
    res.json({
      success: true,
      data: calendarEvents
    });
  } catch (error) {
    console.error('Error al obtener eventos del calendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos del calendario',
      error: error.message
    });
  }
};

// Obtener un evento específico
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evento',
      error: error.message
    });
  }
};

// Crear nuevo evento (admin y superadmin)
exports.createEvent = async (req, res) => {
  try {
    // Validar fechas manualmente
    if (req.body.startDate && req.body.endDate) {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      
      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
      }
    }
    
    const eventData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    // Si se subió una imagen, agregar la ruta
    if (req.file) {
      eventData.image = `/uploads/events/${req.file.filename}`;
    }
    
    const event = new Event(eventData);
    await event.save();
    
    await event.populate('createdBy', 'username email');
    
    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: event
    });
  } catch (error) {
    console.error('Error al crear evento:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear evento',
      error: error.message
    });
  }
};

// Actualizar evento (admin y superadmin)
exports.updateEvent = async (req, res) => {
  try {
    // Validar fechas manualmente
    if (req.body.startDate && req.body.endDate) {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      
      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
      }
    }
    
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };
    
    // Si se subió una nueva imagen, agregar la ruta
    if (req.file) {
      updateData.image = `/uploads/events/${req.file.filename}`;
    }
    
    // No permitir cambiar el creador
    delete updateData.createdBy;
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'username email')
    .populate('updatedBy', 'username email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: event
    });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar evento',
      error: error.message
    });
  }
};

// Eliminar evento (admin y superadmin)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar evento',
      error: error.message
    });
  }
};

// Cambiar estado del evento (admin y superadmin)
exports.updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['programado', 'en-curso', 'completado', 'cancelado'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedBy: req.user._id
      },
      { new: true }
    )
    .populate('createdBy', 'username email')
    .populate('updatedBy', 'username email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Estado del evento actualizado exitosamente',
      data: event
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del evento',
      error: error.message
    });
  }
};
