# 👥 Sistema de Roles: Empleados vs Administradores

## 📋 Descripción General

El sistema de Partyventura tiene tres roles de usuario:

1. **🔧 Superadmin**: Acceso completo a todas las funcionalidades
2. **👨‍💼 Admin**: Acceso a la mayoría de funcionalidades administrativas
3. **👷 Empleado**: Solo acceso al sistema de fichaje (control horario)

## 🚫 Restricciones de Empleados

Los empleados tienen las siguientes restricciones:

### ❌ NO tienen acceso a:
- Panel de administración (`admin.html`)
- Gestión de eventos
- Gestión de galería
- Gestión de noticias
- Gestión de otros administradores
- Configuración de horarios y tarifas
- Visualización de mensajes de contacto
- Gestión de newsletter

### ✅ SÍ tienen acceso a:
- Portal del empleado (`employee.html`)
- Sistema de fichaje (entrada/salida)
- Visualización de su propio historial de fichajes
- Resumen de sus horas trabajadas

## 🔒 Implementación de Seguridad

### Backend

#### 1. Middleware de Autenticación (`backend/middleware/auth.js`)

```javascript
// Bloquear acceso de empleados al panel de admin
const blockEmployeeAccess = (req, res, next) => {
  if (req.user.rol === 'empleado') {
    return res.status(403).json({
      message: 'Los empleados no tienen acceso al panel de administración.'
    });
  }
  next();
};
```

#### 2. Protección de Rutas

**Rutas protegidas para Admin/SuperAdmin:**
- `/api/events/*` → Requiere `requireAdmin`
- `/api/gallery/*` → Requiere `requireAdmin`
- `/api/news/*` → Requiere `requireAdmin`
- `/api/admins/*` → Requiere `requireSuperAdmin`
- `/api/schedules/*` → Requiere `requireSuperAdmin`
- `/api/contact/*` → Requiere autenticación básica
- `/api/newsletter/*` → Requiere autenticación básica

**Rutas accesibles para Empleados:**
- `/api/time-records/registro` → Fichar entrada/salida
- `/api/time-records/ultimo` → Ver último fichaje
- `/api/time-records/mis-registros` → Ver historial propio
- `/api/time-records/mi-resumen` → Ver resumen mensual

### Frontend

#### 1. Redirección Automática en Login (`frontend/public/login.html`)

```javascript
// Después del login exitoso
if (rol === 'empleado') {
  window.location.href = '../src/employee.html';
} else {
  window.location.href = '../src/admin.html';
}
```

#### 2. Protección de Páginas (`frontend/src/js/modules/auth.js`)

```javascript
// En admin.html
Auth.initGuard(true); // Requiere rol de admin/superadmin

// En employee.html
Auth.initGuard(false); // Solo requiere autenticación
```

#### 3. Validación de Rol

Si un empleado intenta acceder directamente a `admin.html`:
1. Se detecta que el rol es 'empleado'
2. Se muestra un alert con el mensaje de error
3. Se redirige automáticamente a `employee.html`

## 📝 Flujo de Autenticación

### Para Empleados:
```
Login → Verificar credenciales → Detectar rol='empleado' 
  → Redirigir a employee.html → Acceso solo a fichaje
```

### Para Administradores:
```
Login → Verificar credenciales → Detectar rol='admin'/'superadmin' 
  → Redirigir a admin.html → Acceso a panel completo
```

## 🔑 Creación de Empleados

Los empleados solo pueden ser creados por un **Superadmin** a través de:

1. Panel de Admin → Sección "Administradores"
2. Botón "+ Nuevo Administrador"
3. Seleccionar rol "Empleado" en el formulario
4. El empleado solo tendrá acceso al sistema de fichaje

## ⚠️ Notas Importantes

1. **Los empleados NO pueden:**
   - Ver información de otros empleados
   - Modificar sus propios fichajes
   - Acceder a ninguna funcionalidad administrativa

2. **Los administradores SÍ pueden:**
   - Ver todos los fichajes de todos los empleados
   - Editar/eliminar fichajes
   - Exportar reportes de asistencia
   - Gestionar todo el contenido del sitio

3. **Seguridad:**
   - La validación de roles se hace tanto en frontend como backend
   - El token JWT incluye el ID del usuario, no el rol (el rol se consulta en cada petición)
   - Los empleados no pueden elevar sus privilegios modificando localStorage

## 🧪 Pruebas

Para probar el sistema de roles:

1. **Crear un empleado:**
   - Login como superadmin
   - Ir a "Administradores" → "+ Nuevo"
   - Rol: "Empleado"

2. **Probar acceso de empleado:**
   - Cerrar sesión
   - Login con credenciales del empleado
   - Verificar que se redirige a `employee.html`
   - Intentar acceder manualmente a `/src/admin.html`
   - Verificar que se bloquea y redirige

3. **Probar sistema de fichaje:**
   - Como empleado, fichar entrada
   - Verificar que aparece en el historial
   - Intentar editar un fichaje (no debería poder)

## 📞 Soporte

Para cualquier duda sobre el sistema de roles, contacta al equipo de desarrollo.
