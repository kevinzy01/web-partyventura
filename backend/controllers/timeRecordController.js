const TimeRecord = require('../models/TimeRecord');
const Admin = require('../models/Admin');

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

    // Si es salida, calcular horas trabajadas
    if (tipo === 'salida' && ultimoRegistro) {
      nuevoRegistro.entradaAsociada = ultimoRegistro._id;
      nuevoRegistro.horasTrabajadas = TimeRecord.calcularHorasTrabajadas(
        ultimoRegistro.fecha,
        nuevoRegistro.fecha
      );
    }

    await nuevoRegistro.save();

    res.status(201).json({
      success: true,
      message: `${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada correctamente`,
      data: nuevoRegistro.toPublicJSON()
    });

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

    res.json({
      success: true,
      data: {
        registros: registros,
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
