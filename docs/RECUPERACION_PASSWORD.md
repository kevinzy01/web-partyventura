# 🔐 Sistema de Recuperación de Contraseña - Partyventura

## 📋 Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Flujo del Usuario](#flujo-del-usuario)
- [Seguridad](#seguridad)
- [API Endpoints](#api-endpoints)
- [Configuración](#configuración)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## 📌 Descripción General

Sistema completo de recuperación de contraseña para el panel de administración de Partyventura. Permite a los usuarios restablecer su contraseña mediante un enlace seguro enviado por email.

### Características Principales

✅ **Token seguro de un solo uso** - Hasheado con SHA-256  
✅ **Expiración temporal** - Enlaces válidos por 1 hora  
✅ **Rate limiting estricto** - Previene abuso y ataques  
✅ **Email HTML profesional** - Template responsive con instrucciones claras  
✅ **Validación completa** - Frontend y backend  
✅ **Indicador de fortaleza** - Visualización de seguridad de contraseña  
✅ **UX optimizada** - Interfaz moderna y responsive  

### Stack Tecnológico

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Nodemailer (SMTP Gmail)
- Crypto (generación de tokens)
- express-validator
- express-rate-limit

**Frontend:**
- HTML5 + CSS3
- JavaScript Vanilla
- TailwindCSS (utility classes)

---

## 🏗️ Arquitectura

### 1. Base de Datos (Modelo Admin)

**Campos nuevos:**
```javascript
{
  resetPasswordToken: {
    type: String,
    select: false        // No retornar en queries por defecto
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  }
}
```

**Métodos:**
- `generarResetToken()` - Crea token aleatorio, lo hashea y establece expiración
- `limpiarResetToken()` - Elimina token y expiración después de uso
- `compararPassword()` - Valida contraseña (ya existente)

### 2. Controladores (authController.js)

#### `forgotPassword()`
1. Recibe email del usuario
2. Valida email (pero no revela si existe)
3. Genera token de reset
4. Guarda token hasheado en BD
5. Envía email con enlace de recuperación
6. Retorna mensaje genérico (seguridad)

#### `resetPassword()`
1. Recibe token + nueva contraseña
2. Hashea token recibido
3. Busca admin con token válido y no expirado
4. Valida contraseñas (coincidencia, longitud)
5. Actualiza contraseña (auto-hash por pre-save hook)
6. Limpia token de reset
7. Retorna éxito

### 3. Rate Limiting

**Forgot Password:**
- 3 solicitudes por hora
- Limitado por email o IP
- Previene spam de emails

**Reset Password:**
- 5 intentos cada 15 minutos
- Limitado por IP
- Previene fuerza bruta

### 4. Template de Email

Diseño profesional con:
- Logo circular de Partyventura
- Gradiente naranja corporativo
- Botón CTA destacado
- Enlace alternativo (por si el botón no funciona)
- Advertencias de seguridad
- Info de expiración (1 hora)
- Responsive (móvil y desktop)

### 5. Frontend

**forgot-password.html:**
- Formulario simple (solo email)
- Validación client-side
- Loading state con spinner
- Redirección automática al login tras éxito

**reset-password.html:**
- Extrae token de URL query params
- Formulario de nueva contraseña + confirmación
- Toggle de visibilidad de contraseña
- Indicador de fortaleza de contraseña
- Validación de coincidencia
- Pantalla de éxito con redirección

---

## 🔄 Flujo del Usuario

### Paso 1: Solicitar Recuperación
```
Usuario → /login.html → Click "¿Olvidaste tu contraseña?"
       ↓
Usuario → /forgot-password.html → Ingresar email
       ↓
POST /api/auth/forgot-password
       ↓
Email enviado (si existe en BD)
       ↓
Mensaje: "Si el email está registrado, recibirás instrucciones..."
```

### Paso 2: Recibir Email
```
Bandeja de entrada
       ↓
Email de "Partyventura Admin"
       ↓
Asunto: "🔒 Recuperación de Contraseña - Partyventura"
       ↓
Click en botón "Restablecer Contraseña"
       ↓
Abre: /reset-password.html?token=abc123...
```

### Paso 3: Restablecer Contraseña
```
/reset-password.html?token=...
       ↓
Formulario: Nueva contraseña + Confirmación
       ↓
POST /api/auth/reset-password
       ↓
Contraseña actualizada en BD
       ↓
Pantalla de éxito → Redirección a /login.html
```

---

## 🔒 Seguridad

### 1. Generación de Token

```javascript
// Token aleatorio de 32 bytes (256 bits)
const resetToken = crypto.randomBytes(32).toString('hex');

// Hashear token antes de guardar en BD (SHA-256)
this.resetPasswordToken = crypto
  .createHash('sha256')
  .update(resetToken)
  .digest('hex');
```

**Razón:** Incluso si la BD es comprometida, los tokens en texto plano no están expuestos.

### 2. Expiración de Token

```javascript
// 1 hora = 60 minutos * 60 segundos * 1000 milisegundos
this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
```

**Razón:** Ventana temporal limitada reduce riesgo de uso malicioso.

### 3. Búsqueda de Token Válido

```javascript
const admin = await Admin.findOne({
  resetPasswordToken: hashedToken,
  resetPasswordExpire: { $gt: Date.now() }  // Mayor que ahora
});
```

**Razón:** Solo tokens no expirados son aceptados.

### 4. Respuesta Genérica

```javascript
// SIEMPRE retornar el mismo mensaje
const mensajeExito = 'Si el email está registrado, recibirás instrucciones...';
```

**Razón:** No revela si un email existe en el sistema (previene enumeración de usuarios).

### 5. Rate Limiting

```javascript
// Forgot Password: 3 por hora
max: 3,
windowMs: 60 * 60 * 1000

// Reset Password: 5 cada 15 minutos
max: 5,
windowMs: 15 * 60 * 1000
```

**Razón:** Previene ataques de fuerza bruta y spam.

### 6. Limpieza de Token

```javascript
// Después de uso exitoso o fallido
admin.limpiarResetToken();
await admin.save();
```

**Razón:** Tokens de un solo uso, no reutilizables.

### 7. Validación en Múltiples Capas

**Frontend:**
- Email válido (regex)
- Contraseña >= 6 caracteres
- Contraseñas coinciden

**Middleware (express-validator):**
- Email válido y normalizado
- Contraseña >= 6 caracteres
- Confirmación coincide

**Backend (controlador):**
- Token presente
- Admin existe y activo
- Token no expirado

---

## 📡 API Endpoints

### POST /api/auth/forgot-password

**Rate Limit:** 3 solicitudes/hora por email o IP

**Request:**
```json
{
  "email": "admin@example.com"
}
```

**Response (siempre 200 OK):**
```json
{
  "success": true,
  "message": "Si el email está registrado, recibirás instrucciones para restablecer tu contraseña"
}
```

**Errores posibles:**
```json
// 400 - Email no proporcionado
{
  "success": false,
  "message": "Por favor, proporciona un email"
}

// 429 - Rate limit excedido
{
  "success": false,
  "message": "Demasiadas solicitudes de recuperación de contraseña. Intenta de nuevo en 1 hora.",
  "errorCode": "FORGOT_PASSWORD_RATE_LIMIT"
}

// 500 - Error al enviar email
{
  "success": false,
  "message": "Error al enviar el email de recuperación. Intenta de nuevo más tarde."
}
```

---

### POST /api/auth/reset-password

**Rate Limit:** 5 intentos/15min por IP

**Request:**
```json
{
  "token": "abc123def456...",
  "password": "nuevaPassword123",
  "confirmPassword": "nuevaPassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña."
}
```

**Errores posibles:**
```json
// 400 - Token no proporcionado
{
  "success": false,
  "message": "Token de recuperación no proporcionado"
}

// 400 - Contraseñas no coinciden
{
  "success": false,
  "message": "Las contraseñas no coinciden"
}

// 400 - Contraseña muy corta
{
  "success": false,
  "message": "La contraseña debe tener al menos 6 caracteres"
}

// 400 - Token inválido o expirado
{
  "success": false,
  "message": "Token inválido o expirado. Solicita un nuevo enlace de recuperación."
}

// 429 - Rate limit excedido
{
  "success": false,
  "message": "Demasiados intentos de restablecimiento. Intenta de nuevo en 15 minutos."
}
```

---

## ⚙️ Configuración

### 1. Variables de Entorno (.env)

```env
# Email Configuration (REQUERIDO)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-password-de-aplicacion

# JWT (Ya existentes)
JWT_SECRET=tu-secret-aqui
JWT_EXPIRE=24h

# MongoDB (Ya existente)
MONGODB_URI=mongodb://localhost:27017/partyventura
```

### 2. Gmail - Contraseñas de Aplicación

**⚠️ IMPORTANTE:** No uses tu contraseña normal de Gmail.

**Pasos para obtener contraseña de aplicación:**

1. Ve a tu **Cuenta de Google**
2. **Seguridad** → **Verificación en dos pasos** (actívala si no lo está)
3. **Contraseñas de aplicaciones**
4. Selecciona "Correo" y "Otro" (escribe "Partyventura")
5. Copia la contraseña generada (16 caracteres)
6. Pégala en `.env` como `EMAIL_PASS`

### 3. Verificar Configuración

**Inicio del servidor debe mostrar:**
```
✅ Servidor de email listo para enviar mensajes
```

**Si ves error:**
```
❌ Error en configuración de email: Invalid login
```
Verifica `EMAIL_USER` y `EMAIL_PASS`.

---

## 🧪 Testing

### Test Manual Completo

#### 1. Solicitar Recuperación

**URL:** `http://localhost:5000/forgot-password.html`

**Casos de prueba:**

✅ **Email válido existente:**
- Ingresar email de admin registrado
- Verificar mensaje: "Si el email está registrado..."
- **Revisar bandeja de entrada** (puede tardar 5-30 segundos)
- Verificar que llegó el email

✅ **Email válido NO existente:**
- Ingresar email que no existe
- Debe mostrar **el mismo mensaje** (seguridad)
- **No debe enviar email** (revisar logs del servidor)

✅ **Email inválido:**
- Ingresar "noesunmail"
- Debe mostrar error de validación

✅ **Rate Limiting:**
- Hacer 4 solicitudes en 1 hora
- La 4ta debe ser bloqueada con error 429

#### 2. Recibir Email

**Revisar:**

✅ Remitente: "Partyventura Admin"  
✅ Asunto: "🔒 Recuperación de Contraseña - Partyventura"  
✅ Diseño: Logo, gradiente naranja, botón CTA  
✅ Enlace: `http://localhost:5000/reset-password.html?token=...`  
✅ Advertencia de expiración: "1 hora"  

#### 3. Restablecer Contraseña

**Casos de prueba:**

✅ **Token válido:**
- Click en enlace del email (dentro de 1 hora)
- Ingresar nueva contraseña (mínimo 6 caracteres)
- Confirmar contraseña (debe coincidir)
- Submit → Debe mostrar "✅ ¡Contraseña Restablecida!"
- Esperar 3 segundos → Redirección a `/login.html`
- Intentar login con **nueva contraseña** → Debe funcionar

✅ **Contraseñas no coinciden:**
- Ingresar contraseña diferente en confirmación
- Debe mostrar error: "Las contraseñas no coinciden"

✅ **Contraseña muy corta:**
- Ingresar "12345" (5 caracteres)
- Debe mostrar error: "La contraseña debe tener al menos 6 caracteres"

✅ **Token expirado:**
- Esperar **más de 1 hora** después de solicitar recuperación
- Intentar usar el enlace
- Debe mostrar: "Token inválido o expirado"

✅ **Token usado:**
- Usar un enlace que ya fue utilizado exitosamente
- Debe mostrar: "Token inválido o expirado"

✅ **Sin token en URL:**
- Ir a `http://localhost:5000/reset-password.html` (sin `?token=...`)
- Debe mostrar: "Enlace inválido. Solicita un nuevo enlace de recuperación."

#### 4. Seguridad - Enumeración de Usuarios

**Prueba:**
```bash
# Email existente
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@partyventura.com"}'

# Email NO existente
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"noexiste@fake.com"}'
```

**Resultado esperado:**
Ambos deben retornar **exactamente la misma respuesta**:
```json
{
  "success": true,
  "message": "Si el email está registrado, recibirás instrucciones para restablecer tu contraseña"
}
```

#### 5. Rate Limiting

**Forgot Password (3/hora):**
```bash
# Hacer 4 solicitudes rápidas
for i in {1..4}; do
  curl -X POST http://localhost:5000/api/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com"}'
  echo "\nRequest $i"
done
```

**Resultado esperado:**
- Solicitudes 1-3: 200 OK
- Solicitud 4: 429 Too Many Requests

**Reset Password (5/15min):**
```bash
# Hacer 6 intentos rápidos con token inválido
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/reset-password \
    -H "Content-Type: application/json" \
    -d '{"token":"fake","password":"123456","confirmPassword":"123456"}'
  echo "\nRequest $i"
done
```

**Resultado esperado:**
- Solicitudes 1-5: 400 Bad Request (token inválido)
- Solicitud 6: 429 Too Many Requests

---

## 🐛 Troubleshooting

### Problema: No llegan los emails

**Diagnóstico:**
1. Revisar logs del servidor: `❌ Error al enviar email:`
2. Verificar `.env`: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`

**Soluciones:**

**Error: "Invalid login"**
- Usar **contraseña de aplicación** de Gmail, no tu contraseña normal
- Activar verificación en dos pasos en Google Account
- Generar nueva contraseña de aplicación

**Error: "Connection timeout"**
- Verificar firewall/antivirus bloqueando puerto 587
- Intentar con `EMAIL_PORT=465` y `secure: true`

**Email en spam:**
- Normal en servidores de desarrollo
- Revisar carpeta de spam/correo no deseado
- En producción, usar servicio como SendGrid, Mailgun, etc.

---

### Problema: Token siempre inválido

**Diagnóstico:**
```javascript
// En resetPassword controller, agregar log temporal
console.log('Token recibido:', token);
console.log('Token hasheado:', hashedToken);
console.log('Admin encontrado:', admin);
```

**Soluciones:**

**Causa 1: Token mal copiado**
- Verificar que el token en URL esté completo
- No debe tener espacios ni saltos de línea

**Causa 2: Token expirado**
- Verificar `resetPasswordExpire` en MongoDB:
```javascript
db.admins.findOne({email: "test@test.com"}, {resetPasswordExpire: 1})
```
- Debe ser mayor que `Date.now()`

**Causa 3: Token ya usado**
- Una vez usado, el token se limpia
- Solicitar nuevo enlace de recuperación

---

### Problema: Contraseña no cambia

**Diagnóstico:**
1. Verificar logs: `✅ Contraseña restablecida exitosamente para: username`
2. Revisar que el pre-save hook hashee la contraseña

**Soluciones:**

**Verificar en MongoDB:**
```javascript
// Password debe estar hasheado (bcrypt)
db.admins.findOne({username: "testuser"}, {password: 1})
// Debe empezar con "$2a$" o "$2b$"
```

**Si password está en texto plano:**
- El pre-save hook no se ejecutó
- Verificar que se llame a `await admin.save()` (no `updateOne`)

---

### Problema: Rate limit permanente

**Diagnóstico:**
- Rate limit usa IP del cliente
- En desarrollo local, todas las peticiones son de `::1` o `127.0.0.1`

**Soluciones:**

**Resetear contador manualmente:**
- Reiniciar el servidor (los rate limits están en memoria)

**O esperar la ventana:**
- Forgot password: 1 hora
- Reset password: 15 minutos

**En producción:**
- Rate limit por IP funciona correctamente
- Con Ngrok, verificar `trust proxy` en server.js

---

### Problema: Error de CORS

**Síntoma:**
```
Access to fetch at 'http://localhost:5000/api/auth/forgot-password' 
from origin 'file://' has been blocked by CORS
```

**Solución:**
- No abrir HTML directamente (`file://`)
- Siempre acceder vía `http://localhost:5000/forgot-password.html`

---

## 📚 Recursos Adicionales

### Archivos del Sistema

**Backend:**
- `/backend/models/Admin.js` - Modelo con campos de reset
- `/backend/controllers/authController.js` - Lógica de forgot/reset
- `/backend/routes/auth.js` - Rutas de recuperación
- `/backend/middleware/specificRateLimiters.js` - Rate limiters
- `/backend/templates/resetPasswordEmail.js` - Template de email

**Frontend:**
- `/frontend/public/forgot-password.html` - Solicitud de recuperación
- `/frontend/public/reset-password.html` - Formulario de reset
- `/frontend/public/login.html` - Link de recuperación

### Comandos Útiles

**Ver emails en logs (modo desarrollo):**
```javascript
// En authController.js (temporal para debug)
console.log('Email HTML:', htmlContent);
```

**Verificar admin en BD:**
```bash
mongosh partyventura
db.admins.findOne({email: "test@test.com"})
```

**Limpiar tokens expirados:**
```javascript
db.admins.updateMany(
  { resetPasswordExpire: { $lt: new Date() } },
  { $unset: { resetPasswordToken: "", resetPasswordExpire: "" } }
)
```

---

## ✅ Checklist de Implementación

- [x] Actualizar modelo Admin con campos de reset
- [x] Crear métodos generarResetToken() y limpiarResetToken()
- [x] Implementar controlador forgotPassword()
- [x] Implementar controlador resetPassword()
- [x] Crear rate limiters específicos
- [x] Agregar rutas POST /forgot-password y /reset-password
- [x] Crear template de email HTML responsive
- [x] Implementar UI forgot-password.html
- [x] Implementar UI reset-password.html
- [x] Agregar link en login.html
- [x] Configurar Gmail SMTP
- [x] Testing de flujo completo
- [x] Documentación completa

---

**Fecha de implementación:** 23 de octubre de 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Producción-ready
