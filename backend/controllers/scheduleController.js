const Schedule = require('../models/Schedule');

// Obtener todos los horarios y tarifas (con filtros opcionales)
exports.getSchedules = async (req, res) => {
  try {
    const { type, isActive } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const schedules = await Schedule.find(filter)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .sort({ order: 1, createdAt: -1 });
    
    res.json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios y tarifas',
      error: error.message
    });
  }
};

// Obtener horarios y tarifas públicos (sin autenticación)
exports.getPublicSchedules = async (req, res) => {
  try {
    const { type } = req.query;
    
    const filter = { isActive: true };
    if (type) filter.type = type;
    
    const schedules = await Schedule.find(filter)
      .sort({ order: 1 })
      .select('-createdBy -updatedBy -__v');
    
    res.json({
      success: true,
      count: schedules.length,
      data: schedules.map(schedule => schedule.toPublicJSON())
    });
  } catch (error) {
    console.error('Error al obtener horarios públicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios',
      error: error.message
    });
  }
};

// Obtener un horario específico
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Error al obtener horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horario',
      error: error.message
    });
  }
};

// Crear nuevo horario o tarifa (solo superadmin)
exports.createSchedule = async (req, res) => {
  try {
    console.log('📝 Creando schedule...');
    console.log('Usuario:', req.user);
    console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const scheduleData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    console.log('Datos a guardar:', JSON.stringify(scheduleData, null, 2));
    
    const schedule = new Schedule(scheduleData);
    await schedule.save();
    
    console.log('✅ Schedule guardado:', schedule._id);
    
    await schedule.populate('createdBy', 'username email');
    
    res.status(201).json({
      success: true,
      message: 'Horario/tarifa creado exitosamente',
      data: schedule
    });
  } catch (error) {
    console.error('❌ Error al crear horario:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear horario/tarifa',
      error: error.message
    });
  }
};

// Actualizar horario o tarifa (solo superadmin)
exports.updateSchedule = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };
    
    // No permitir cambiar el creador
    delete updateData.createdBy;
    
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'username email')
    .populate('updatedBy', 'username email');
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Horario/tarifa actualizado exitosamente',
      data: schedule
    });
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar horario/tarifa',
      error: error.message
    });
  }
};

// Eliminar horario o tarifa (solo superadmin)
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Horario/tarifa eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar horario/tarifa',
      error: error.message
    });
  }
};

// Cambiar estado activo/inactivo (solo superadmin)
exports.toggleScheduleStatus = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }
    
    schedule.isActive = !schedule.isActive;
    schedule.updatedBy = req.user._id;
    await schedule.save();
    
    await schedule.populate('createdBy', 'username email');
    await schedule.populate('updatedBy', 'username email');
    
    res.json({
      success: true,
      message: `Horario ${schedule.isActive ? 'activado' : 'desactivado'} exitosamente`,
      data: schedule
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del horario',
      error: error.message
    });
  }
};
