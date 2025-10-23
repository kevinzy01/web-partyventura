# 🧪 Guía de Pruebas Rápidas - Gestión de Administradores

## Pre-requisitos

1. Servidor backend corriendo en `http://localhost:5000`
2. Al menos un usuario con rol `superadmin` en la base de datos

---

## Opción A: Pruebas desde el Frontend

### 1. Acceder al Panel
```
http://localhost:5000/admin.html
```

### 2. Iniciar Sesión
- Usuario: `superadmin` (o el usuario que tengas)
- Contraseña: tu contraseña

### 3. Verificar Tab Visible
✅ Deberías ver el tab "👥 Administradores" después de iniciar sesión

### 4. Ver Lista de Admins
1. Clic en tab "Administradores"
2. Deberías ver al menos tu propio usuario
3. Tu tarjeta debería mostrar "(tú)" y NO tener botones de acción

### 5. Crear Nuevo Admin
1. Clic en "➕ Nuevo Administrador"
2. Rellenar:
   - Usuario: `prueba1`
   - Email: `prueba1@partyventura.com`
   - Contraseña: `test123`
   - Rol: `Administrador`
3. Clic en "Guardar"
4. ✅ Debería aparecer toast verde "Administrador creado"
5. ✅ Debería aparecer en la lista

### 6. Editar Admin
1. En la tarjeta de "prueba1", clic "✏️ Editar"
2. Cambiar email a: `prueba1-editado@partyventura.com`
3. Dejar contraseña en blanco
4. Clic en "Guardar"
5. ✅ Email actualizado en la tarjeta

### 7. Cambiar Rol
1. En "prueba1", clic "🔄 Cambiar Rol"
2. Confirmar
3. ✅ Badge cambia a "Super Admin" (morado)

### 8. Eliminar Admin
1. En "prueba1", clic "🗑️ Eliminar"
2. Confirmar dos veces
3. ✅ Desaparece de la lista

---

## Opción B: Pruebas con API (Postman/Thunder Client)

### 1. Obtener Token JWT

**Endpoint**: `POST http://localhost:5000/api/auth/login`

**Body** (JSON):
```json
{
  "username": "superadmin",
  "password": "tu_contraseña"
}
```

**Respuesta esperada**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "superadmin",
    "rol": "superadmin"
  }
}
```

📝 **Copiar el token** para usar en las siguientes peticiones

---

### 2. Listar Administradores

**Endpoint**: `GET http://localhost:5000/api/admins`

**Headers**:
```
Authorization: Bearer TU_TOKEN_AQUI
```

**Respuesta esperada**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "username": "superadmin",
      "email": "superadmin@partyventura.com",
      "rol": "superadmin",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "ultimoAcceso": "2024-01-20T15:00:00.000Z",
      "intentosFallidos": 0
    }
  ]
}
```

---

### 3. Crear Nuevo Administrador

**Endpoint**: `POST http://localhost:5000/api/admins`

**Headers**:
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "username": "admin_test",
  "email": "test@partyventura.com",
  "password": "password123",
  "rol": "admin"
}
```

**Respuesta esperada** (201):
```json
{
  "success": true,
  "message": "Administrador creado exitosamente",
  "data": {
    "_id": "...",
    "username": "admin_test",
    "email": "test@partyventura.com",
    "rol": "admin"
  }
}
```

---

### 4. Actualizar Administrador

**Endpoint**: `PUT http://localhost:5000/api/admins/ID_DEL_ADMIN`

**Headers**:
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "username": "admin_test_updated",
  "email": "test_updated@partyventura.com"
}
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "Administrador actualizado exitosamente",
  "data": {
    "_id": "...",
    "username": "admin_test_updated",
    "email": "test_updated@partyventura.com",
    "rol": "admin"
  }
}
```

---

### 5. Cambiar Rol

**Endpoint**: `PATCH http://localhost:5000/api/admins/ID_DEL_ADMIN/role`

**Headers**:
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "rol": "superadmin"
}
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "Rol actualizado exitosamente",
  "data": {
    "_id": "...",
    "username": "admin_test_updated",
    "rol": "superadmin"
  }
}
```

---

### 6. Desbloquear Administrador

**Endpoint**: `PATCH http://localhost:5000/api/admins/ID_DEL_ADMIN/unlock`

**Headers**:
```
Authorization: Bearer TU_TOKEN_AQUI
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "Administrador desbloqueado exitosamente",
  "data": {
    "_id": "...",
    "username": "admin_test_updated",
    "intentosFallidos": 0
  }
}
```

---

### 7. Eliminar Administrador

**Endpoint**: `DELETE http://localhost:5000/api/admins/ID_DEL_ADMIN`

**Headers**:
```
Authorization: Bearer TU_TOKEN_AQUI
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "Administrador eliminado exitosamente"
}
```

---

## Pruebas de Seguridad

### ❌ 1. Sin Token (debe fallar)

**Endpoint**: `GET http://localhost:5000/api/admins`

**Headers**: (ninguno)

**Respuesta esperada** (401):
```json
{
  "success": false,
  "message": "No se proporcionó token de autenticación"
}
```

---

### ❌ 2. Como Admin Normal (debe fallar)

1. Crear un admin normal (rol: "admin")
2. Hacer login con ese admin para obtener su token
3. Intentar listar admins con ese token

**Respuesta esperada** (403):
```json
{
  "success": false,
  "message": "Acceso denegado. Se requiere rol de super administrador"
}
```

---

### ❌ 3. Auto-eliminación (debe fallar)

**Endpoint**: `DELETE http://localhost:5000/api/admins/TU_PROPIO_ID`

**Headers**: `Authorization: Bearer TU_TOKEN`

**Respuesta esperada** (400):
```json
{
  "success": false,
  "message": "No puedes eliminar tu propia cuenta"
}
```

---

### ❌ 4. Auto-degradación (debe fallar)

**Endpoint**: `PATCH http://localhost:5000/api/admins/TU_PROPIO_ID/role`

**Headers**: 
```
Authorization: Bearer TU_TOKEN
Content-Type: application/json
```

**Body**:
```json
{
  "rol": "admin"
}
```

**Respuesta esperada** (400):
```json
{
  "success": false,
  "message": "No puedes cambiar tu propio rol"
}
```

---

### ❌ 5. Usuario Duplicado (debe fallar)

Intentar crear admin con username que ya existe

**Respuesta esperada** (400):
```json
{
  "success": false,
  "message": "El nombre de usuario ya existe"
}
```

---

### ❌ 6. Email Duplicado (debe fallar)

Intentar crear admin con email que ya existe

**Respuesta esperada** (400):
```json
{
  "success": false,
  "message": "El email ya está registrado"
}
```

---

## Checklist de Validación

### Backend
- [ ] ✅ Ruta `/api/admins` registrada en server.js
- [ ] ✅ Todas las rutas requieren autenticación JWT
- [ ] ✅ Todas las rutas validan rol superadmin
- [ ] ✅ No se puede auto-eliminar
- [ ] ✅ No se puede auto-degradar
- [ ] ✅ Contraseñas se hashean con bcrypt
- [ ] ✅ Validación de duplicados funciona
- [ ] ✅ Rate limiting activo (5 creaciones/hora)

### Frontend
- [ ] ✅ Tab solo visible para superadmin
- [ ] ✅ Lista de admins carga correctamente
- [ ] ✅ Modal se abre y cierra correctamente
- [ ] ✅ Formulario de creación funciona
- [ ] ✅ Formulario de edición carga datos
- [ ] ✅ Cambio de rol funciona
- [ ] ✅ Desbloqueo funciona
- [ ] ✅ Eliminación funciona
- [ ] ✅ No se muestran botones para propia cuenta
- [ ] ✅ Toasts aparecen correctamente
- [ ] ✅ Confirmaciones funcionan

### UI/UX
- [ ] ✅ Diseño responsive (móvil y desktop)
- [ ] ✅ Badges de estado visibles
- [ ] ✅ Avatares con iniciales
- [ ] ✅ Colores consistentes con el diseño
- [ ] ✅ Animaciones suaves
- [ ] ✅ Textos claros y descriptivos

---

## Errores Comunes y Soluciones

### "Cannot GET /api/admins"
❌ **Problema**: Ruta no registrada
✅ **Solución**: Verificar que `server.js` tenga `app.use('/api/admins', require('./routes/admins'))`

### "403 Forbidden"
❌ **Problema**: Usuario no es superadmin
✅ **Solución**: Cambiar rol en la base de datos o usar cuenta de superadmin

### "Tab no aparece"
❌ **Problema**: Usuario no es superadmin o JavaScript no se cargó
✅ **Solución**: 
1. Verificar rol en consola: `Auth.getUser().rol`
2. Verificar consola del navegador por errores
3. Verificar que `admin.js` se cargó correctamente

### "Modal no se abre"
❌ **Problema**: Event listeners no inicializados
✅ **Solución**: Verificar que `initAdminManagement()` se llama en DOMContentLoaded

### "Lista vacía pero hay admins"
❌ **Problema**: Error en la petición o respuesta
✅ **Solución**: Abrir consola del navegador y verificar errores

---

## Prueba Rápida de 5 Minutos

1. ✅ Iniciar servidor: `node backend/server.js`
2. ✅ Abrir: `http://localhost:5000/admin.html`
3. ✅ Login como superadmin
4. ✅ Verificar tab "Administradores" visible
5. ✅ Crear admin de prueba
6. ✅ Editar ese admin
7. ✅ Cambiar su rol
8. ✅ Eliminarlo
9. ✅ Verificar que no puedes editar/eliminar tu propia cuenta

**Si todo funciona**: ✅ Sistema 100% operativo

---

**Última actualización**: Enero 2024
