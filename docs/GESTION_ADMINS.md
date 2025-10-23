# 🔐 Gestión de Administradores - Partyventura

## Descripción General

El sistema de gestión de administradores permite a los **Super Administradores** crear, editar y eliminar cuentas de administradores, así como gestionar sus roles y permisos.

## Roles de Usuario

### Administrador (`admin`)
- ✅ Gestionar noticias (crear, editar, eliminar)
- ✅ Ver y responder mensajes de contacto
- ✅ Ver estadísticas del panel
- ❌ **NO** puede gestionar otros administradores

### Super Administrador (`superadmin`)
- ✅ Todas las funciones de un Administrador
- ✅ **Gestión completa de administradores**
- ✅ Crear nuevos administradores
- ✅ Editar información de administradores
- ✅ Eliminar administradores
- ✅ Cambiar roles (admin ↔ superadmin)
- ✅ Desbloquear cuentas bloqueadas

## Acceso a la Gestión de Administradores

### Visibilidad del Tab
- El tab "Administradores" **solo es visible para Super Administradores**
- Los administradores normales no verán esta opción en el panel

### Acceder
1. Iniciar sesión como Super Administrador
2. En el panel de administración, verás el tab "👥 Administradores"
3. Hacer clic en el tab para ver la lista de administradores

## Funcionalidades

### 1. Ver Lista de Administradores

Al acceder al tab de Administradores, verás una lista con:
- **Avatar** con la inicial del nombre
- **Nombre y usuario**
- **Email**
- **Estado**: Activo o Bloqueado
- **Rol**: Admin o Super Admin
- **Fecha de creación**
- **Último acceso**
- **Intentos fallidos** (si está bloqueado)

### 2. Crear Nuevo Administrador

**Botón**: "➕ Nuevo Administrador"

**Campos requeridos**:
- **Usuario**: Nombre de usuario único (mínimo 3 caracteres)
- **Email**: Dirección de email válida y única
- **Contraseña**: Mínimo 6 caracteres (OBLIGATORIA para nuevos admins)
- **Rol**: Seleccionar entre Administrador o Super Administrador

**Validaciones**:
- El nombre de usuario no puede estar duplicado
- El email no puede estar duplicado
- La contraseña debe tener al menos 6 caracteres
- Todos los campos son obligatorios

### 3. Editar Administrador Existente

**Botón**: "✏️ Editar" (en cada tarjeta de administrador)

**Campos editables**:
- Usuario
- Email
- Contraseña (OPCIONAL - déjala en blanco para mantener la actual)
- Rol

**Restricciones**:
- ❌ No puedes editar tu propia cuenta
- ✅ Puedes cambiar cualquier campo de otros administradores
- ✅ Si no cambias la contraseña, se mantiene la actual

### 4. Cambiar Rol

**Botón**: "🔄 Cambiar Rol"

**Funcionalidad**:
- Alterna entre `admin` ↔ `superadmin`
- Confirmación antes de cambiar
- Actualización instantánea

**Restricciones**:
- ❌ No puedes cambiar tu propio rol
- ⚠️ Si cambias un superadmin a admin, perderá acceso a la gestión de administradores

### 5. Desbloquear Administrador

**Botón**: "🔓 Desbloquear" (solo visible si está bloqueado)

**Cuándo se bloquea una cuenta**:
- Después de **5 intentos fallidos** de inicio de sesión
- El contador se resetea automáticamente tras el desbloqueo

**Funcionalidad**:
- Resetea los intentos fallidos a 0
- Permite al administrador volver a iniciar sesión
- Confirmación antes de desbloquear

### 6. Eliminar Administrador

**Botón**: "🗑️ Eliminar"

**Restricciones**:
- ❌ No puedes eliminar tu propia cuenta
- ⚠️ **Acción irreversible** - requiere doble confirmación
- Se elimina permanentemente de la base de datos

## Seguridad

### Protecciones Backend
- ✅ Todas las rutas requieren autenticación JWT
- ✅ Validación de rol `superadmin` en cada operación
- ✅ Prevención de auto-eliminación
- ✅ Prevención de auto-degradación de rol
- ✅ Validación de duplicados (usuario y email)
- ✅ Hash seguro de contraseñas con bcrypt
- ✅ Rate limiting en creación de admins (máx 5 por hora)

### Protecciones Frontend
- ✅ Validación de formularios antes de enviar
- ✅ Confirmaciones para acciones destructivas
- ✅ Mensajes de error claros
- ✅ Ocultamiento de opciones peligrosas (no se puede modificar la propia cuenta)

## API Endpoints

### `GET /api/admins`
Lista todos los administradores (solo superadmin)

**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "username": "admin1",
      "email": "admin1@partyventura.com",
      "rol": "admin",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "ultimoAcceso": "2024-01-20T14:20:00.000Z",
      "intentosFallidos": 0
    }
  ]
}
```

### `POST /api/admins`
Crear nuevo administrador (solo superadmin)

**Body**:
```json
{
  "username": "nuevoadmin",
  "email": "nuevo@partyventura.com",
  "password": "contraseña123",
  "rol": "admin"
}
```

### `PUT /api/admins/:id`
Actualizar administrador (solo superadmin)

**Body**:
```json
{
  "username": "adminactualizado",
  "email": "actualizado@partyventura.com",
  "password": "nuevacontraseña", // Opcional
  "rol": "superadmin"
}
```

### `DELETE /api/admins/:id`
Eliminar administrador (solo superadmin, no puede eliminarse a sí mismo)

### `PATCH /api/admins/:id/role`
Cambiar rol de administrador (solo superadmin)

**Body**:
```json
{
  "rol": "superadmin"
}
```

### `PATCH /api/admins/:id/unlock`
Desbloquear administrador (solo superadmin)

## Buenas Prácticas

### ✅ Recomendaciones
1. **Mantén al menos 2 super administradores** por seguridad
2. **Usa contraseñas fuertes** (mínimo 10 caracteres, con mayúsculas, minúsculas, números y símbolos)
3. **Revisa periódicamente** la lista de administradores activos
4. **Elimina cuentas inactivas** que ya no se usen
5. **Documenta cambios importantes** (especialmente cambios de rol)
6. **Desbloquea cuentas solo después de verificar** la identidad del usuario

### ❌ Evitar
1. No compartir credenciales de super administrador
2. No crear administradores sin necesidad
3. No dejar cuentas bloqueadas sin investigar la causa
4. No usar contraseñas débiles o predecibles
5. No eliminar administradores sin confirmar que no se necesitan

## Troubleshooting

### No veo el tab de "Administradores"
**Causa**: No tienes rol de super administrador
**Solución**: Contacta con otro super administrador para que cambie tu rol

### Error al crear administrador: "Usuario ya existe"
**Causa**: El nombre de usuario ya está en uso
**Solución**: Elige un nombre de usuario diferente

### Error al crear administrador: "Email ya existe"
**Causa**: El email ya está registrado
**Solución**: Usa un email diferente

### No puedo editar/eliminar mi propia cuenta
**Causa**: Protección de seguridad - es el comportamiento esperado
**Solución**: Pide a otro super administrador que haga los cambios

### Administrador bloqueado
**Causa**: 5 intentos fallidos de inicio de sesión
**Solución**: Usa el botón "🔓 Desbloquear" como super administrador

## Registro de Cambios

### Versión 1.0 (Enero 2024)
- ✅ Sistema completo de gestión de administradores
- ✅ CRUD completo (crear, leer, actualizar, eliminar)
- ✅ Sistema de roles (admin, superadmin)
- ✅ Bloqueo automático por intentos fallidos
- ✅ Desbloqueo manual
- ✅ Validaciones de seguridad
- ✅ Interfaz responsive
- ✅ Confirmaciones para acciones destructivas

## Soporte

Si encuentras algún problema o necesitas ayuda:
1. Revisa esta documentación
2. Verifica los logs del servidor (backend/logs/)
3. Contacta al equipo de desarrollo

---

**Última actualización**: Enero 2024
**Autor**: Equipo Partyventura
