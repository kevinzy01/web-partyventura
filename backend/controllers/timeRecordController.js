const TimeRecord = require('../models/TimeRecord');
const Admin = require('../models/Admin');
const WorkSchedule = require('../models/WorkSchedule');

/**
 * Determinar turno basado en horas trabajadas
 * @param {string} horaInicio - Hora de inicio en formato HH:MM
 * @param {string} horaFin - Hora de fin en formato HH:MM
 * @returns {string} - 'mañana', 'tarde', o 'completo'
 */
function determinarTurno(horaInicio, horaFin) {
  const [horaInicioNum] = horaInicio.split(':').map(Number);
  const [horaFinNum] = horaFin.split(':').map(Number);
  
  // Mañana: antes de las 14:00
  if (horaInicioNum < 14 && horaFinNum <= 17) {
    return 'mañana';
  }
  
  // Tarde: después de las 14:00
  if (horaInicioNum >= 14) {
    return 'tarde';
  }
  
  // Completo: cruza el mediodía o más de 7 horas
  return 'completo';
}

/**
 * Verificar, completar o crear horario automáticamente
 * @param {ObjectId} empleadoId - ID del empleado
 * @param {Object} empleado - Objeto empleado completo
 * @param {Date} fechaEntrada - Fecha de entrada
 * @param {Date} fechaSalida - Fecha de salida
 * @param {Number} horasTrabajadas - Horas trabajadas calculadas
 * @returns {Object|null} - Resultado de la operación
 */
async function verificarYGestionarHorario(empleadoId, empleado, fechaEntrada, fechaSalida, horasTrabajadas) {
  try {
    // Obtener la fecha del turno (usar fecha de entrada)
    const fechaTurno = new Date(fechaEntrada);
    fechaTurno.setHours(0, 0, 0, 0);
    
    const siguienteDia = new Date(fechaTurno);
    siguienteDia.setDate(siguienteDia.getDate() + 1);
    
    // Buscar horario asignado para ese día
    const horario = await WorkSchedule.findOne({
      empleado: empleadoId,
      fecha: {
        $gte: fechaTurno,
        $lt: siguienteDia
      }
    }).sort({ createdAt: -1 }); // El más reciente primero
    
    // ========================================
    // CASO 1: NO HAY HORARIO ASIGNADO
    // ========================================
    if (!horario) {
      console.log(`📝 No hay horario asignado - Creando horario automático...`);
      
      // Extraer horas de las fechas
      const horaInicio = fechaEntrada.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      const horaFin = fechaSalida.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      // Determinar tipo de turno
      const turno = determinarTurno(horaInicio, horaFin);
      
      // Crear nuevo horario automático
      const nuevoHorario = new WorkSchedule({
        empleado: empleadoId,
        empleadoNombre: empleado.nombre || empleado.username,
        fecha: fechaTurno,
        turno: turno,
        horaInicio: horaInicio,
        horaFin: horaFin,
        estado: 'completado', // Ya está completado porque ya se trabajó
        notas: `🤖 Horario creado automáticamente tras fichaje sin asignación previa.\n` +
               `Entrada: ${fechaEntrada.toLocaleString('es-ES')}\n` +
               `Salida: ${fechaSalida.toLocaleString('es-ES')}\n` +
               `Horas trabajadas: ${horasTrabajadas}h`,
        color: '#10b981', // Verde para horarios auto-creados
        creadoPor: empleadoId, // El propio empleado lo "crea" al fichar
        horasTotales: horasTrabajadas
      });
      
      await nuevoHorario.save();
      
      console.log(`✅ Horario automático creado: ${nuevoHorario._id}`);
      console.log(`   - Turno: ${turno}`);
      console.log(`   - Horario: ${horaInicio} - ${horaFin}`);
      console.log(`   - Horas: ${horasTrabajadas}h`);
      
      return {
        creado: true,
        completado: true,
        horario: nuevoHorario.toAdminJSON(),
        mensaje: `Horario creado automáticamente: ${turno} (${horasTrabajadas}h)`
      };
    }
    
    // ========================================
    // CASO 2: HAY HORARIO ASIGNADO
    // ========================================
    
    // Si ya está completado o cancelado, no hacer nada
    if (horario.estado === 'completado' || horario.estado === 'cancelado') {
      console.log(`ℹ️ Horario ${horario._id} ya está en estado: ${horario.estado}`);
      return {
        creado: false,
        completado: false,
        razon: 'ya_procesado',
        mensaje: `Ya existe un horario ${horario.estado} para este día`
      };
    }
    
    // Calcular diferencia entre horas trabajadas y horas programadas
    const diferencia = Math.abs(horasTrabajadas - horario.horasTotales);
    const margenMinutos = 5;
    const margenHoras = margenMinutos / 60; // 0.083 horas
    
    console.log(`🔍 Verificación automática de horario:
      - Horario ID: ${horario._id}
      - Horas programadas: ${horario.horasTotales}h
      - Horas trabajadas: ${horasTrabajadas}h
      - Diferencia: ${diferencia.toFixed(3)}h
      - Margen permitido: ${margenHoras.toFixed(3)}h (${margenMinutos} min)`);
    
    // Si la diferencia está dentro del margen de 5 minutos
    if (diferencia <= margenHoras) {
      horario.estado = 'completado';
      horario.notas = (horario.notas || '') + 
        `\n✅ Auto-completado: Turno realizado correctamente (${horasTrabajadas}h trabajadas)`;
      
      await horario.save();
      
      console.log(`✅ Horario ${horario._id} marcado como COMPLETADO automáticamente`);
      
      return {
        creado: false,
        completado: true,
        horario: horario.toAdminJSON(),
        mensaje: `Turno completado automáticamente (${horasTrabajadas}h/${horario.horasTotales}h)`
      };
    } else {
      console.log(`⚠️ Horario NO completado: diferencia de ${(diferencia * 60).toFixed(1)} minutos excede el margen`);
      
      return {
        creado: false,
        completado: false,
        razon: 'diferencia_horas',
        diferencia: diferencia,
        mensaje: `Turno registrado pero no completado automáticamente (diferencia: ${(diferencia * 60).toFixed(1)} min)`
      };
    }
    
  } catch (error) {
    console.error('❌ Error al gestionar horario:', error);
    return null;
  }
}

/**
 * Registrar entrada/salida (para empleados)
 */
exports.registrarTiempo = async (req, res) => {
  try {
    const { tipo, notas, ubicacion } = req.body;
    const empleadoId = req.user._id;

    // Verificar que el usuario sea empleado
    const empleado = await Admin.findById(empleadoId);
    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Obtener el último registro del empleado
    const ultimoRegistro = await TimeRecord.getUltimoRegistro(empleadoId);

    // Validar secuencia de entrada/salida
    if (ultimoRegistro) {
      if (tipo === 'entrada' && ultimoRegistro.tipo === 'entrada') {
        return res.status(400).json({
          success: false,
          message: 'Ya tienes una entrada registrada. Debes registrar una salida primero.'
        });
      }
      if (tipo === 'salida' && ultimoRegistro.tipo === 'salida') {
        return res.status(400).json({
          success: false,
          message: 'Ya tienes una salida registrada. Debes registrar una entrada primero.'
        });
      }
    } else if (tipo === 'salida') {
      return res.status(400).json({
        success: false,
        message: 'No puedes registrar una salida sin una entrada previa.'
      });
    }

    // Crear el registro
    const nuevoRegistro = new TimeRecord({
      empleado: empleadoId,
      empleadoNombre: empleado.nombre || empleado.username,
      tipo,
      notas,
      ubicacion: ubicacion || 'Manual'
    });

    let verificacionHorario = null;

    // Si es salida, calcular horas trabajadas y gestionar horario
    if (tipo === 'salida' && ultimoRegistro) {
      nuevoRegistro.entradaAsociada = ultimoRegistro._id;
      nuevoRegistro.horasTrabajadas = TimeRecord.calcularHorasTrabajadas(
        ultimoRegistro.fecha,
        nuevoRegistro.fecha
      );
      
      // ✨ GESTIONAR HORARIO: VERIFICAR/COMPLETAR O CREAR AUTOMÁTICAMENTE
      if (nuevoRegistro.horasTrabajadas) {
        verificacionHorario = await verificarYGestionarHorario(
          empleadoId,
          empleado,
          ultimoRegistro.fecha,
          nuevoRegistro.fecha,
          nuevoRegistro.horasTrabajadas
        );
      }
    }

    await nuevoRegistro.save();

    // Preparar respuesta con información adicional
    const respuesta = {
      success: true,
      message: `${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada correctamente`,
      data: nuevoRegistro.toPublicJSON()
    };
    
    // Agregar información de gestión de horario si existe
    if (verificacionHorario) {
      respuesta.horarioGestionado = verificacionHorario;
      
      if (verificacionHorario.creado) {
        respuesta.message += ` - ${verificacionHorario.mensaje}`;
      } else if (verificacionHorario.completado) {
        respuesta.message += ` - ${verificacionHorario.mensaje}`;
      }
    }

    res.status(201).json(respuesta);

  } catch (error) {
    console.error('Error al registrar tiempo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el tiempo',
      error: error.message
    });
  }
};

/**
 * Obtener último registro del empleado actual
 */
exports.getUltimoRegistro = async (req, res) => {
  try {
    const empleadoId = req.user._id;
    
    const ultimoRegistro = await TimeRecord.getUltimoRegistro(empleadoId);

    res.json({
      success: true,
      data: ultimoRegistro ? ultimoRegistro.toPublicJSON() : null
    });

  } catch (error) {
    console.error('Error al obtener último registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el último registro',
      error: error.message
    });
  }
};

/**
 * Obtener historial del empleado actual
 */
exports.getMisRegistros = async (req, res) => {
  try {
    const empleadoId = req.user._id;
    const { fechaInicio, fechaFin, limit = 50 } = req.query;

    const registros = await TimeRecord.getRegistrosPorEmpleado(
      empleadoId,
      fechaInicio,
      fechaFin
    ).limit(parseInt(limit));

    res.json({
      success: true,
      data: registros.map(r => r.toPublicJSON()),
      total: registros.length
    });

  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los registros',
      error: error.message
    });
  }
};

/**
 * Obtener resumen mensual del empleado actual
 */
exports.getMiResumenMensual = async (req, res) => {
  try {
    const empleadoId = req.user._id;
    const { mes, anio } = req.query;

    if (!mes || !anio) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren los parámetros mes y año'
      });
    }

    const resumen = await TimeRecord.getResumenMensual(
      empleadoId,
      parseInt(mes),
      parseInt(anio)
    );

    res.json({
      success: true,
      data: resumen
    });

  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen mensual',
      error: error.message
    });
  }
};

/**
 * ADMIN: Obtener todos los registros de todos los empleados
 */
exports.getTodosLosRegistros = async (req, res) => {
  try {
    const { empleadoId, fechaInicio, fechaFin, tipo, page = 1, limit = 100 } = req.query;

    const query = {};
    if (empleadoId) query.empleado = empleadoId;
    if (tipo) query.tipo = tipo;
    if (fechaInicio || fechaFin) {
      query.fecha = {};
      if (fechaInicio) {
        const startDate = new Date(fechaInicio);
        startDate.setHours(0, 0, 0, 0);
        query.fecha.$gte = startDate;
      }
      if (fechaFin) {
        const endDate = new Date(fechaFin);
        endDate.setHours(23, 59, 59, 999);
        query.fecha.$lte = endDate;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const registros = await TimeRecord.find(query)
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('empleado', 'nombre username email');

    const total = await TimeRecord.countDocuments(query);

    // Formatear registros para manejar empleados eliminados
    const registrosFormateados = registros.map(registro => {
      const registroObj = registro.toObject();
      
      // Si el empleado fue eliminado, usar el nombre guardado en el registro
      if (!registroObj.empleado) {
        registroObj.empleado = {
          _id: null,
          nombre: registroObj.empleadoNombre,
          username: registroObj.empleadoNombre,
          email: '(empleado eliminado)'
        };
      }
      
      return registroObj;
    });

    res.json({
      success: true,
      data: {
        registros: registrosFormateados,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRecords: total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los registros',
      error: error.message
    });
  }
};

/**
 * ADMIN: Obtener resumen de todos los empleados
 */
exports.getResumenEmpleados = async (req, res) => {
  try {
    const { mes, anio } = req.query;

    if (!mes || !anio) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren los parámetros mes y año'
      });
    }

    // Obtener todos los empleados
    const empleados = await Admin.find({ rol: 'empleado' }, 'nombre username email');

    // Calcular resumen para cada empleado
    const resumenes = await Promise.all(
      empleados.map(async (empleado) => {
        const resumen = await TimeRecord.getResumenMensual(
          empleado._id,
          parseInt(mes),
          parseInt(anio)
        );

        return {
          empleadoId: empleado._id,
          empleadoNombre: empleado.nombre || empleado.username,
          empleadoEmail: empleado.email,
          ...resumen
        };
      })
    );

    res.json({
      success: true,
      data: resumenes,
      total: empleados.length
    });

  } catch (error) {
    console.error('Error al obtener resumen de empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de empleados',
      error: error.message
    });
  }
};

/**
 * ADMIN: Eliminar registro
 */
exports.eliminarRegistro = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await TimeRecord.findByIdAndDelete(id);

    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Registro eliminado correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el registro',
      error: error.message
    });
  }
};

/**
 * ADMIN: Editar registro (correcciones)
 */
exports.editarRegistro = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, tipo, notas, ubicacion } = req.body;

    const registro = await TimeRecord.findById(id);

    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
      });
    }

    // Actualizar campos permitidos
    if (fecha) registro.fecha = new Date(fecha);
    if (tipo) registro.tipo = tipo;
    if (notas !== undefined) registro.notas = notas;
    if (ubicacion) registro.ubicacion = ubicacion;

    // Recalcular horas si es una salida
    if (registro.tipo === 'salida' && registro.entradaAsociada) {
      const entrada = await TimeRecord.findById(registro.entradaAsociada);
      if (entrada) {
        registro.horasTrabajadas = TimeRecord.calcularHorasTrabajadas(
          entrada.fecha,
          registro.fecha
        );
      }
    }

    await registro.save();

    res.json({
      success: true,
      message: 'Registro actualizado correctamente',
      data: registro.toPublicJSON()
    });

  } catch (error) {
    console.error('Error al editar registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al editar el registro',
      error: error.message
    });
  }
};
