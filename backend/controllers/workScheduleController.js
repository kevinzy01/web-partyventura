const WorkSchedule = require('../models/WorkSchedule');
const Admin = require('../models/Admin');

// ==================== OPERACIONES CRUD ====================

// Crear nuevo horario laboral (solo superadmin)
exports.createWorkSchedule = async (req, res) => {
  try {
    console.log('📝 Creando horario laboral...');
    console.log('Usuario:', req.user.username);
    console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const { empleadoId, fecha, turno, horaInicio, horaFin, notas, color } = req.body;
    
    // Verificar que el empleado existe
    const empleado = await Admin.findById(empleadoId);
    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }
    
    // Verificar que el empleado tiene rol 'empleado'
    if (empleado.rol !== 'empleado') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden asignar horarios a usuarios con rol "empleado"'
      });
    }
    
    // Verificar solapamientos
    const verificacion = await WorkSchedule.verificarSolapamiento(
      empleadoId,
      fecha,
      horaInicio,
      horaFin
    );
    
    if (verificacion.solapamiento) {
      return res.status(409).json({
        success: false,
        message: 'El horario se solapa con un turno existente',
        conflicto: verificacion.horario.toAdminJSON()
      });
    }
    
    // Crear el horario
    const scheduleData = {
      empleado: empleadoId,
      empleadoNombre: empleado.nombre,
      fecha,
      turno,
      horaInicio,
      horaFin,
      notas: notas || '',
      color: color || '#f97316',
      creadoPor: req.user._id
    };
    
    const workSchedule = new WorkSchedule(scheduleData);
    await workSchedule.save();
    
    console.log('✅ Horario laboral creado:', workSchedule._id);
    
    res.status(201).json({
      success: true,
      message: 'Horario laboral creado exitosamente',
      data: workSchedule.toAdminJSON()
    });
  } catch (error) {
    console.error('❌ Error al crear horario laboral:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear horario laboral'
    });
  }
};

// Obtener todos los horarios laborales con filtros (solo superadmin)
exports.getAllWorkSchedules = async (req, res) => {
  try {
    const { empleadoId, fechaInicio, fechaFin, estado, mes, anio } = req.query;
    
    const filter = {};
    
    // Filtro por empleado
    if (empleadoId) {
      filter.empleado = empleadoId;
    }
    
    // Filtro por estado
    if (estado) {
      filter.estado = estado;
    }
    
    // Filtro por rango de fechas
    if (fechaInicio || fechaFin) {
      filter.fecha = {};
      if (fechaInicio) filter.fecha.$gte = new Date(fechaInicio);
      if (fechaFin) filter.fecha.$lte = new Date(fechaFin);
    }
    
    // Filtro por mes/año
    if (mes && anio) {
      const mesNum = parseInt(mes);
      const anioNum = parseInt(anio);
      const fechaMesInicio = new Date(anioNum, mesNum - 1, 1);
      const fechaMesFin = new Date(anioNum, mesNum, 0, 23, 59, 59, 999);
      filter.fecha = { $gte: fechaMesInicio, $lte: fechaMesFin };
    }
    
    const workSchedules = await WorkSchedule.find(filter)
      .populate('empleado', 'nombre username email rol')
      .populate('creadoPor', 'nombre username')
      .populate('modificadoPor', 'nombre username')
      .sort({ fecha: -1, horaInicio: 1 });
    
    res.json({
      success: true,
      count: workSchedules.length,
      data: workSchedules.map(ws => ws.toAdminJSON())
    });
  } catch (error) {
    console.error('Error al obtener horarios laborales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios laborales',
      error: error.message
    });
  }
};

// Obtener horarios de un empleado específico (empleado o admin)
exports.getMyWorkSchedules = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, mes, anio } = req.query;
    
    // El empleado solo puede ver sus propios horarios
    const empleadoId = req.user._id;
    
    const filter = {
      empleado: empleadoId,
      estado: { $ne: 'cancelado' } // No mostrar cancelados
    };
    
    // Filtro por rango de fechas
    if (fechaInicio || fechaFin) {
      filter.fecha = {};
      if (fechaInicio) filter.fecha.$gte = new Date(fechaInicio);
      if (fechaFin) filter.fecha.$lte = new Date(fechaFin);
    }
    
    // Filtro por mes/año
    if (mes && anio) {
      const mesNum = parseInt(mes);
      const anioNum = parseInt(anio);
      const fechaMesInicio = new Date(anioNum, mesNum - 1, 1);
      const fechaMesFin = new Date(anioNum, mesNum, 0, 23, 59, 59, 999);
      filter.fecha = { $gte: fechaMesInicio, $lte: fechaMesFin };
    }
    
    const workSchedules = await WorkSchedule.find(filter)
      .sort({ fecha: 1, horaInicio: 1 });
    
    res.json({
      success: true,
      count: workSchedules.length,
      data: workSchedules.map(ws => ws.toPublicJSON())
    });
  } catch (error) {
    console.error('Error al obtener mis horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios',
      error: error.message
    });
  }
};

// Obtener horario específico por ID
exports.getWorkScheduleById = async (req, res) => {
  try {
    const workSchedule = await WorkSchedule.findById(req.params.id)
      .populate('empleado', 'nombre username email')
      .populate('creadoPor', 'nombre username')
      .populate('modificadoPor', 'nombre username');
    
    if (!workSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }
    
    // Si es empleado, solo puede ver sus propios horarios
    if (req.user.rol === 'empleado' && workSchedule.empleado._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este horario'
      });
    }
    
    const data = req.user.rol === 'empleado' ? 
      workSchedule.toPublicJSON() : 
      workSchedule.toAdminJSON();
    
    res.json({
      success: true,
      data
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

// Actualizar horario laboral (solo superadmin)
exports.updateWorkSchedule = async (req, res) => {
  try {
    const { empleadoId, fecha, turno, horaInicio, horaFin, estado, notas, color } = req.body;
    
    const workSchedule = await WorkSchedule.findById(req.params.id);
    
    if (!workSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }
    
    // Si cambian las horas o la fecha, verificar solapamientos
    if (
      (horaInicio && horaInicio !== workSchedule.horaInicio) ||
      (horaFin && horaFin !== workSchedule.horaFin) ||
      (fecha && fecha !== workSchedule.fecha.toISOString().split('T')[0])
    ) {
      const verificacion = await WorkSchedule.verificarSolapamiento(
        empleadoId || workSchedule.empleado,
        fecha || workSchedule.fecha,
        horaInicio || workSchedule.horaInicio,
        horaFin || workSchedule.horaFin,
        req.params.id // Excluir el horario actual
      );
      
      if (verificacion.solapamiento) {
        return res.status(409).json({
          success: false,
          message: 'El nuevo horario se solapa con un turno existente',
          conflicto: verificacion.horario.toAdminJSON()
        });
      }
    }
    
    // Si cambia el empleado, actualizar el nombre
    if (empleadoId && empleadoId !== workSchedule.empleado.toString()) {
      const nuevoEmpleado = await Admin.findById(empleadoId);
      if (!nuevoEmpleado) {
        return res.status(404).json({
          success: false,
          message: 'Empleado no encontrado'
        });
      }
      
      if (nuevoEmpleado.rol !== 'empleado') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden asignar horarios a usuarios con rol "empleado"'
        });
      }
      
      workSchedule.empleado = empleadoId;
      workSchedule.empleadoNombre = nuevoEmpleado.nombre;
    }
    
    // Actualizar campos
    if (fecha) workSchedule.fecha = fecha;
    if (turno) workSchedule.turno = turno;
    if (horaInicio) workSchedule.horaInicio = horaInicio;
    if (horaFin) workSchedule.horaFin = horaFin;
    if (estado) workSchedule.estado = estado;
    if (notas !== undefined) workSchedule.notas = notas;
    if (color) workSchedule.color = color;
    
    workSchedule.modificadoPor = req.user._id;
    
    await workSchedule.save();
    
    await workSchedule.populate('empleado', 'nombre username email');
    await workSchedule.populate('creadoPor', 'nombre username');
    await workSchedule.populate('modificadoPor', 'nombre username');
    
    res.json({
      success: true,
      message: 'Horario actualizado exitosamente',
      data: workSchedule.toAdminJSON()
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
      message: error.message || 'Error al actualizar horario',
      error: error.message
    });
  }
};

// Eliminar horario laboral (solo superadmin)
exports.deleteWorkSchedule = async (req, res) => {
  try {
    const workSchedule = await WorkSchedule.findByIdAndDelete(req.params.id);
    
    if (!workSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Horario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar horario',
      error: error.message
    });
  }
};

// ==================== VISTAS ESPECIALES ====================

// Obtener vista semanal de horarios (calendario)
exports.getWeeklyView = async (req, res) => {
  try {
    const { fecha, empleadoId } = req.query;
    
    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida'
      });
    }
    
    const fechaRef = new Date(fecha);
    const diaSemana = fechaRef.getDay();
    
    // Calcular inicio de semana (lunes)
    const inicioSemana = new Date(fechaRef);
    inicioSemana.setDate(fechaRef.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
    inicioSemana.setHours(0, 0, 0, 0);
    
    // Calcular fin de semana (domingo)
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);
    
    const filter = {
      fecha: { $gte: inicioSemana, $lte: finSemana },
      estado: { $ne: 'cancelado' }
    };
    
    // Si es empleado, solo ve sus horarios
    if (req.user.rol === 'empleado') {
      filter.empleado = req.user._id;
    } else if (empleadoId) {
      // Si es admin y especifica empleado
      filter.empleado = empleadoId;
    }
    
    const horarios = await WorkSchedule.find(filter)
      .populate('empleado', 'nombre username')
      .sort({ fecha: 1, horaInicio: 1 });
    
    // Organizar por días de la semana
    const semana = {
      inicioSemana: inicioSemana.toISOString().split('T')[0],
      finSemana: finSemana.toISOString().split('T')[0],
      dias: []
    };
    
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      const diaStr = dia.toISOString().split('T')[0];
      
      const horariosDelDia = horarios.filter(h => {
        const fechaH = new Date(h.fecha).toISOString().split('T')[0];
        return fechaH === diaStr;
      });
      
      semana.dias.push({
        fecha: diaStr,
        diaSemana: dia.toLocaleDateString('es-ES', { weekday: 'long' }),
        horarios: horariosDelDia.map(h => 
          req.user.rol === 'empleado' ? h.toPublicJSON() : h.toAdminJSON()
        )
      });
    }
    
    res.json({
      success: true,
      data: semana
    });
  } catch (error) {
    console.error('Error al obtener vista semanal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener vista semanal',
      error: error.message
    });
  }
};

// Obtener vista mensual de horarios
exports.getMonthlyView = async (req, res) => {
  try {
    const { mes, anio, empleadoId } = req.query;
    
    if (!mes || !anio) {
      return res.status(400).json({
        success: false,
        message: 'Mes y año son requeridos'
      });
    }
    
    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);
    
    const fechaInicio = new Date(anioNum, mesNum - 1, 1);
    const fechaFin = new Date(anioNum, mesNum, 0, 23, 59, 59, 999);
    
    const filter = {
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      estado: { $ne: 'cancelado' }
    };
    
    // Si es empleado, solo ve sus horarios
    if (req.user.rol === 'empleado') {
      filter.empleado = req.user._id;
    } else if (empleadoId) {
      // Si es admin y especifica empleado
      filter.empleado = empleadoId;
    }
    
    const horarios = await WorkSchedule.find(filter)
      .populate('empleado', 'nombre username')
      .sort({ fecha: 1, horaInicio: 1 });
    
    // Obtener resumen
    let resumen = null;
    if (empleadoId) {
      resumen = await WorkSchedule.getResumenMensual(empleadoId, mesNum, anioNum);
    } else if (req.user.rol === 'empleado') {
      resumen = await WorkSchedule.getResumenMensual(req.user._id, mesNum, anioNum);
    }
    
    res.json({
      success: true,
      count: horarios.length,
      data: {
        mes: mesNum,
        anio: anioNum,
        horarios: horarios.map(h => 
          req.user.rol === 'empleado' ? h.toPublicJSON() : h.toAdminJSON()
        ),
        resumen
      }
    });
  } catch (error) {
    console.error('Error al obtener vista mensual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener vista mensual',
      error: error.message
    });
  }
};

// Obtener resumen de horas del mes para un empleado
exports.getMonthlyResume = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const empleadoId = req.params.empleadoId || req.user._id;
    
    // Verificar permisos: superadmin puede ver cualquier empleado, empleado solo el suyo
    if (req.user.rol === 'empleado' && empleadoId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este resumen'
      });
    }
    
    if (!mes || !anio) {
      return res.status(400).json({
        success: false,
        message: 'Mes y año son requeridos'
      });
    }
    
    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);
    
    const resumen = await WorkSchedule.getResumenMensual(empleadoId, mesNum, anioNum);
    
    res.json({
      success: true,
      data: resumen
    });
  } catch (error) {
    console.error('Error al obtener resumen mensual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen',
      error: error.message
    });
  }
};

// ==================== OPERACIONES POR LOTES ====================

// Eliminar múltiples horarios (solo superadmin)
exports.deleteMultipleSchedules = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs'
      });
    }
    
    const result = await WorkSchedule.deleteMany({ _id: { $in: ids } });
    
    res.json({
      success: true,
      message: `${result.deletedCount} horario(s) eliminado(s) exitosamente`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error al eliminar horarios múltiples:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar horarios',
      error: error.message
    });
  }
};
