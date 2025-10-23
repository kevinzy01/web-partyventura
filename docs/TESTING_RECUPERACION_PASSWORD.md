# 🧪 Guía Rápida de Testing - Recuperación de Contraseña

## ⚡ Testing Rápido (5 minutos)

### Paso 1: Configuración Inicial

**1.1 Verificar variables de entorno (.env):**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-password-de-aplicacion-de-16-caracteres
```

**1.2 Verificar que tienes un admin con email:**
```bash
mongosh partyventura
db.admins.findOne({rol: "superadmin"})
# Debe tener un email válido
```

Si no tiene email, actualizar:
```javascript
db.admins.updateOne(
  {username: "tuUsuario"},
  {$set: {email: "tu-email@gmail.com"}}
)
```

**1.3 Iniciar servidor:**
```bash
cd backend
npm run dev
```

Verificar en consola:
```
✅ Servidor de email listo para enviar mensajes
```

---

### Paso 2: Probar Solicitud de Recuperación

**2.1 Ir a página de login:**
```
http://localhost:5000/login.html
```

**2.2 Click en "¿Olvidaste tu contraseña?"**

**2.3 Ingresar tu email** (el que configuraste en el admin)

**2.4 Click en "Enviar Enlace de Recuperación"**

**Resultado esperado:**
- ✅ Mensaje: "Si el email está registrado, recibirás instrucciones..."
- ✅ En consola del servidor: `✅ Email de recuperación enviado a: tu@email.com`
- ✅ En tu bandeja de entrada: Email de Partyventura (revisar spam si no aparece)

---

### Paso 3: Verificar Email

**3.1 Abrir email recibido**

**Debe contener:**
- ✅ Logo circular 🎉
- ✅ Título: "Partyventura"
- ✅ Asunto: "🔒 Recuperación de Contraseña - Partyventura"
- ✅ Botón naranja: "🔒 Restablecer Contraseña"
- ✅ Advertencia: "Este enlace expira en 1 hora"

**3.2 Click en el botón o copiar el enlace alternativo**

---

### Paso 4: Restablecer Contraseña

**4.1 Se abre página de reset**

**4.2 Ingresar nueva contraseña:**
- Mínimo 6 caracteres
- Observar barra de fortaleza (débil/media/fuerte)

**4.3 Confirmar contraseña:**
- Debe ser exactamente igual

**4.4 Click en "Restablecer Contraseña"**

**Resultado esperado:**
- ✅ Pantalla de éxito con ícono ✅
- ✅ Mensaje: "¡Contraseña Restablecida!"
- ✅ Redirección automática al login en 3 segundos

---

### Paso 5: Verificar Nueva Contraseña

**5.1 En página de login, ingresar:**
- Usuario: tu username
- Contraseña: **la nueva contraseña**

**5.2 Click en "Iniciar Sesión"**

**Resultado esperado:**
- ✅ Login exitoso
- ✅ Redirección al panel de admin

---

## 🎯 Tests Adicionales (Seguridad)

### Test 1: Email No Existente
```
1. Ir a /forgot-password.html
2. Ingresar: noexiste@fake.com
3. Submit
```
**Resultado:** Mismo mensaje (no revela que el email no existe)

### Test 2: Token Expirado
```
1. Solicitar recuperación
2. NO abrir el email
3. Esperar más de 1 hora
4. Abrir email y click en enlace
```
**Resultado:** "Token inválido o expirado"

### Test 3: Token Reutilizado
```
1. Usar un enlace para resetear contraseña
2. Intentar usar el MISMO enlace nuevamente
```
**Resultado:** "Token inválido o expirado"

### Test 4: Rate Limiting - Forgot Password
```
1. Ir a /forgot-password.html
2. Solicitar recuperación 3 veces seguidas (con el mismo email)
3. Intentar una 4ta vez
```
**Resultado:** Error 429 "Demasiadas solicitudes... Intenta de nuevo en 1 hora"

### Test 5: Contraseñas No Coinciden
```
1. Abrir enlace de reset
2. Password: 123456
3. Confirm: 654321
4. Submit
```
**Resultado:** Notificación "Las contraseñas no coinciden"

---

## 🐛 Problemas Comunes

### ❌ No llega el email

**Soluciones:**
1. Revisar carpeta de **spam**
2. Verificar `.env`:
   ```
   EMAIL_USER=correcto@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop  ← 16 caracteres, contraseña de aplicación
   ```
3. Verificar consola del servidor:
   - ✅ "Email de recuperación enviado" = OK
   - ❌ "Error al enviar email" = Problema de config
4. Probar con Gmail personal (más confiable que corporativo)

### ❌ Token inválido siempre

**Soluciones:**
1. Verificar que el enlace esté completo (copiar/pegar sin espacios)
2. Verificar que no haya expirado (1 hora)
3. Revisar MongoDB:
   ```javascript
   db.admins.findOne(
     {email: "tu@email.com"},
     {resetPasswordExpire: 1}
   )
   ```
   Debe mostrar fecha futura

### ❌ Error de CORS

**Problema:** 
```
Access to fetch blocked by CORS policy
```

**Solución:**
- NO abrir archivos HTML directamente (file://)
- Siempre usar: `http://localhost:5000/forgot-password.html`

---

## ✅ Checklist de Verificación

Antes de hacer commit, verificar:

- [ ] Email configurado en `.env`
- [ ] Admin tiene email válido en BD
- [ ] Servidor inicia sin errores
- [ ] Email de recuperación llega (revisar spam)
- [ ] Diseño del email se ve bien (logo, botón, colores)
- [ ] Enlace de email funciona
- [ ] Página de reset muestra formulario
- [ ] Contraseña se puede cambiar
- [ ] Login funciona con nueva contraseña
- [ ] Mensajes de error son claros
- [ ] Rate limiting funciona (3 intentos/hora)

---

## 📊 Logs Útiles para Debug

**Ver en consola del servidor:**

```
✅ Servidor de email listo para enviar mensajes    ← Email config OK
✅ Email de recuperación enviado a: user@email.com ← Email enviado
✅ Contraseña restablecida exitosamente para: user  ← Reset exitoso

❌ Error al enviar email:                          ← Problema con SMTP
❌ Error en forgotPassword:                        ← Error en controlador
```

**Ver en MongoDB:**

```javascript
// Ver si el token fue guardado
db.admins.findOne(
  {email: "test@test.com"},
  {resetPasswordToken: 1, resetPasswordExpire: 1}
)

// Resultado esperado:
{
  resetPasswordToken: "abc123def456...",  // Token hasheado
  resetPasswordExpire: ISODate("2025-10-23T15:30:00.000Z")  // Fecha futura
}
```

---

## 🚀 Commit y Push

Una vez que todo funcione:

```bash
git add .
git commit -m "feat: Sistema de recuperación de contraseña"
git push origin main
```

---

**Tiempo estimado de testing:** 5-10 minutos  
**Prerequisitos:** Gmail configurado con contraseña de aplicación  
**Nivel de dificultad:** ⭐⭐☆☆☆
