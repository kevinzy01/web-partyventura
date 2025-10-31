// ===================================
// ADMIN CONTROLLER
// Gestión de administradores (solo superadmin)
// ===================================

const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// @desc    Obtener todos los administradores
// @route   GET /api/admins
// @access  Private (Solo superadmin)
exports.getAdmins = async (req, res) => {
  try {
    // Verificar que el usuario sea superadmin
    if (req.user.rol !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    // Solo obtener admins y superadmins (NO empleados)
    const admins = await Admin.find({ 
      rol: { $in: ['admin', 'superadmin'] } 
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error('Error al obtener administradores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los administradores'
    });
  }
};

// @desc    Crear nuevo administrador
// @route   POST /api/admins
// @access  Private (Solo superadmin)
exports.createAdmin = async (req, res) => {
  try {
    // Verificar que el usuario sea superadmin
    if (req.user.rol !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { nombreUsuario, email, password, rol } = req.body;

    console.log('📥 Datos recibidos:', { nombreUsuario, email: email || '(vacío)', rol, password: password ? '(presente)' : '(ausente)' });

    // Validar campos requeridos (email es opcional)
    if (!nombreUsuario || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos requeridos (nombreUsuario y password)'
      });
    }

    // Verificar si el usuario ya existe
    const query = { username: nombreUsuario };  // El modelo usa "username"
    if (email && email.trim()) {
      query.$or = [{ username: nombreUsuario }, { email }];
      delete query.username;
    }
    
    const existingAdmin = await Admin.findOne(query);

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un administrador con ese nombre de usuario o email'
      });
    }

    // Crear el administrador (modelo espera "username" y "nombre")
    const newAdminData = {
      username: nombreUsuario,   // Modelo usa "username"
      nombre: nombreUsuario,     // Modelo requiere "nombre"
      password,
      rol: rol || 'admin'
    };
    
    if (email && email.trim()) {
      newAdminData.email = email;
    }
    
    console.log('💾 Creando admin con:', { ...newAdminData, password: '(oculto)' });
    
    const admin = await Admin.create(newAdminData);

    // No devolver la contraseña
    const adminData = admin.toObject();
    delete adminData.password;

    console.log('✅ Admin creado exitosamente:', adminData._id);

    res.status(201).json({
      success: true,
      message: 'Administrador creado exitosamente',
      data: adminData
    });
  } catch (error) {
    console.error('❌ Error al crear administrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el administrador',
      error: error.message
    });
  }
};

// @desc    Actualizar administrador
// @route   PUT /api/admins/:id
// @access  Private (Solo superadmin)
exports.updateAdmin = async (req, res) => {
  try {
    // Verificar que el usuario sea superadmin
    if (req.user.rol !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { id } = req.params;
    const { nombreUsuario, email, rol, password } = req.body;

    // Buscar el administrador
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado'
      });
    }

    // Verificar que no se está actualizando a un usuario/email ya existente
    if (nombreUsuario || email) {
      const existingAdmin = await Admin.findOne({
        _id: { $ne: id },
        $or: [
          { nombreUsuario: nombreUsuario || admin.nombreUsuario },
          { email: email || admin.email }
        ]
      });

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un administrador con ese nombre de usuario o email'
        });
      }
    }

    // Actualizar campos
    if (nombreUsuario) admin.nombreUsuario = nombreUsuario;
    if (email) admin.email = email;
    if (rol) admin.rol = rol;
    
    // Si se proporciona nueva contraseña
    if (password) {
      admin.password = password; // El pre-save hook se encarga del hash
    }

    // Resetear intentos fallidos si se actualiza
    admin.intentosFallidos = 0;
    admin.bloqueadoHasta = null;

    await admin.save();

    // No devolver la contraseña
    const adminData = admin.toObject();
    delete adminData.password;

    res.status(200).json({
      success: true,
      message: 'Administrador actualizado exitosamente',
      data: adminData
    });
  } catch (error) {
    console.error('Error al actualizar administrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el administrador'
    });
  }
};

// @desc    Eliminar administrador
// @route   DELETE /api/admins/:id
// @access  Private (Solo superadmin)
exports.deleteAdmin = async (req, res) => {
  try {
    // Verificar que el usuario sea superadmin
    if (req.user.rol !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { id } = req.params;

    // No permitir que un superadmin se elimine a sí mismo
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado'
      });
    }

    await admin.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Administrador eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar administrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el administrador'
    });
  }
};

// @desc    Cambiar rol de administrador
// @route   PATCH /api/admins/:id/role
// @access  Private (Solo superadmin)
exports.changeRole = async (req, res) => {
  try {
    // Verificar que el usuario sea superadmin
    if (req.user.rol !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { id } = req.params;
    const { rol } = req.body;

    if (!rol || !['admin', 'superadmin'].includes(rol)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Use "admin" o "superadmin"'
      });
    }

    // No permitir que un superadmin se quite su propio rol
    if (id === req.user._id.toString() && rol !== 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'No puedes cambiar tu propio rol de superadmin'
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      id,
      { rol },
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: admin
    });
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el rol'
    });
  }
};

// @desc    Desbloquear administrador
// @route   PATCH /api/admins/:id/unlock
// @access  Private (Solo superadmin)
exports.unlockAdmin = async (req, res) => {
  try {
    // Verificar que el usuario sea superadmin
    if (req.user.rol !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { id } = req.params;

    const admin = await Admin.findByIdAndUpdate(
      id,
      {
        intentosFallidos: 0,
        bloqueadoHasta: null
      },
      { new: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Administrador desbloqueado exitosamente',
      data: admin
    });
  } catch (error) {
    console.error('Error al desbloquear administrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desbloquear el administrador'
    });
  }
};

// ===================================
// GESTIÓN DE EMPLEADOS
// ===================================

// @desc    Obtener todos los empleados
// @route   GET /api/admins/empleados
// @access  Private (Admin y Superadmin)
exports.getEmpleados = async (req, res) => {
  try {
    // Verificar que el usuario sea admin o superadmin
    if (!['admin', 'superadmin'].includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    // Solo obtener empleados
    const empleados = await Admin.find({ 
      rol: 'empleado' 
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: empleados.length,
      data: empleados
    });
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los empleados'
    });
  }
};

// @desc    Obtener empleado por ID
// @route   GET /api/admins/empleados/:id
// @access  Private (Admin y Superadmin)
exports.getEmpleado = async (req, res) => {
  try {
    // Verificar que el usuario sea admin o superadmin
    if (!['admin', 'superadmin'].includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const empleado = await Admin.findOne({
      _id: req.params.id,
      rol: 'empleado'
    }).select('-password');

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: empleado
    });
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el empleado'
    });
  }
};

// @desc    Crear nuevo empleado
// @route   POST /api/admins/empleados
// @access  Private (Admin y Superadmin)
exports.createEmpleado = async (req, res) => {
  try {
    // Verificar que el usuario sea admin o superadmin
    if (!['admin', 'superadmin'].includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { nombreUsuario, email, password, nombre, rolEmpleado } = req.body;

    console.log('📥 Datos recibidos para empleado:', { nombreUsuario, email: email || '(vacío)', nombre, rolEmpleado });

    // Validar campos requeridos
    if (!nombreUsuario || !password || !nombre || !rolEmpleado) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos requeridos (nombreUsuario, password, nombre y rolEmpleado)'
      });
    }
    
    // Validar que el rol sea válido
    if (!['monitor', 'cocina', 'barra'].includes(rolEmpleado)) {
      return res.status(400).json({
        success: false,
        message: 'El rol de empleado debe ser: monitor, cocina o barra'
      });
    }

    // Verificar si el usuario ya existe
    const query = { username: nombreUsuario };
    if (email && email.trim()) {
      query.$or = [{ username: nombreUsuario }, { email }];
      delete query.username;
    }
    
    const existingUser = await Admin.findOne(query);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con ese nombre de usuario o email'
      });
    }

    // Crear el empleado
    const newEmpleadoData = {
      username: nombreUsuario,
      nombre: nombre,
      password,
      rol: 'empleado',  // Siempre empleado
      rolEmpleado: rolEmpleado
    };
    
    if (email && email.trim()) {
      newEmpleadoData.email = email;
    }
    
    console.log('💾 Creando empleado con:', { ...newEmpleadoData, password: '(oculto)' });
    
    const empleado = await Admin.create(newEmpleadoData);

    // No devolver la contraseña
    const empleadoData = empleado.toObject();
    delete empleadoData.password;

    console.log('✅ Empleado creado exitosamente:', empleadoData._id);

    res.status(201).json({
      success: true,
      message: 'Empleado creado exitosamente',
      data: empleadoData
    });
  } catch (error) {
    console.error('❌ Error al crear empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el empleado',
      error: error.message
    });
  }
};

// @desc    Actualizar empleado
// @route   PUT /api/admins/empleados/:id
// @access  Private (Admin y Superadmin)
exports.updateEmpleado = async (req, res) => {
  try {
    // Verificar que el usuario sea admin o superadmin
    if (!['admin', 'superadmin'].includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { id } = req.params;
    const { nombreUsuario, email, nombre, password, rolEmpleado } = req.body;

    const empleado = await Admin.findById(id);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Verificar que es un empleado
    if (empleado.rol !== 'empleado') {
      return res.status(400).json({
        success: false,
        message: 'Este usuario no es un empleado'
      });
    }
    
    // Validar rolEmpleado si se proporciona
    if (rolEmpleado && !['monitor', 'cocina', 'barra'].includes(rolEmpleado)) {
      return res.status(400).json({
        success: false,
        message: 'El rol de empleado debe ser: monitor, cocina o barra'
      });
    }

    // Actualizar campos
    if (nombreUsuario) empleado.username = nombreUsuario;
    if (nombre) empleado.nombre = nombre;
    if (email !== undefined) empleado.email = email || null;
    if (password) empleado.password = password;
    if (rolEmpleado) empleado.rolEmpleado = rolEmpleado;

    await empleado.save();

    const empleadoData = empleado.toObject();
    delete empleadoData.password;

    res.status(200).json({
      success: true,
      message: 'Empleado actualizado exitosamente',
      data: empleadoData
    });
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el empleado'
    });
  }
};

// @desc    Eliminar empleado
// @route   DELETE /api/admins/empleados/:id
// @access  Private (Admin y Superadmin)
exports.deleteEmpleado = async (req, res) => {
  try {
    // Verificar que el usuario sea admin o superadmin
    if (!['admin', 'superadmin'].includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { id } = req.params;

    const empleado = await Admin.findById(id);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Verificar que es un empleado
    if (empleado.rol !== 'empleado') {
      return res.status(400).json({
        success: false,
        message: 'Este usuario no es un empleado'
      });
    }

    await empleado.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Empleado eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el empleado'
    });
  }
};
