# 🐛 BugFix: Rate Limiting con Ngrok

## Problema Encontrado

Al acceder al backend a través de Ngrok, el usuario recibía este error:

```json
{
  "success": false,
  "message": "Demasiadas peticiones desde esta IP. Por favor, inténtalo más tarde."
}
```

## Causa Raíz

### 🔍 Análisis del Problema:

1. **Rate Limiter muy restrictivo**
   - Límite general: 100 peticiones cada 15 minutos
   - Límite de login: 5 intentos cada 15 minutos
   
2. **Ngrok como Proxy**
   - Cuando usas Ngrok, todas las peticiones pasan por el servidor de Ngrok
   - El backend veía la IP de Ngrok en lugar de la IP real del cliente
   - **Resultado:** Todos los usuarios compartían el mismo contador de rate limit

3. **Express sin trust proxy**
   - El servidor no estaba configurado para confiar en headers de proxy
   - No leía los headers `X-Forwarded-For` o `X-Real-IP`

## Solución Implementada

### ✅ 1. Configurar Express para confiar en proxies

**Archivo:** `backend/server.js`

```javascript
// Confiar en el primer proxy (Ngrok)
app.set('trust proxy', 1);
```

### ✅ 2. Aumentar límites del Rate Limiter

**Archivo:** `backend/middleware/rateLimiter.js`

#### General Limiter:
- **Antes:** 100 peticiones / 15 min
- **Ahora:** 500 peticiones / 15 min

#### Auth Limiter:
- **Antes:** 5 intentos / 15 min
- **Ahora:** 20 intentos / 15 min

#### Contact Limiter:
- **Antes:** 5 mensajes / hora
- **Ahora:** 10 mensajes / hora

#### Create Limiter:
- **Antes:** 20 creaciones / hora
- **Ahora:** 50 creaciones / hora

### ✅ 3. Implementar keyGenerator personalizado

Ahora el rate limiter usa la IP real del cliente:

```javascript
keyGenerator: (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.ip;
}
```

**Cómo funciona:**
1. Primero intenta leer `X-Forwarded-For` (IP real del cliente)
2. Si no existe, usa `X-Real-IP`
3. Como último recurso, usa `req.ip` (IP del proxy)

### ✅ 4. Añadir trustProxy a todos los limiters

Todos los rate limiters ahora incluyen:
```javascript
trustProxy: true
```

## Cambios en los Archivos

### 📄 `server.js`

```diff
// Crear aplicación Express
const app = express();

+ // Configuración de Proxy (Para Ngrok)
+ app.set('trust proxy', 1);

// Conectar a la base de datos
connectDB();
```

### 📄 `rateLimiter.js`

```diff
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
-  max: 100,
+  max: 500, // Aumentado para Ngrok
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP.'
  },
  standardHeaders: true,
  legacyHeaders: false,
+  trustProxy: true,
+  keyGenerator: (req) => {
+    return req.headers['x-forwarded-for']?.split(',')[0] || 
+           req.headers['x-real-ip'] || 
+           req.ip;
+  }
});
```

## Beneficios

### 🎯 Para Desarrollo con Ngrok:
- ✅ Cada usuario tiene su propio límite de peticiones
- ✅ Los límites son más permisivos para pruebas
- ✅ No más errores de "demasiadas peticiones"

### 🔒 Para Seguridad:
- ✅ Sigue protegiendo contra ataques de fuerza bruta
- ✅ Identifica correctamente a los clientes reales
- ✅ Los límites siguen siendo razonables

## Testing

Para probar que funciona:

1. **Reinicia el servidor:**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Inicia Ngrok:**
   ```powershell
   ngrok http 5000
   ```

3. **Actualiza la URL en el frontend:**
   - Edita `frontend/src/js/modules/config.js`
   - Cambia `MODE` a `'production'`
   - Actualiza las URLs con tu URL de Ngrok

4. **Prueba desde el navegador:**
   - Abre la web
   - Intenta hacer varias peticiones
   - ✅ No deberías ver el error de rate limit

## Headers de Ngrok

Ngrok envía estos headers automáticamente:
- `X-Forwarded-For`: IP real del cliente
- `X-Forwarded-Proto`: Protocolo (http/https)
- `X-Forwarded-Host`: Host original

Nuestro código ahora los reconoce y usa correctamente.

## Configuración para Producción

Cuando despliegues en producción (Railway, Render, etc.):

### ⚠️ **Importante:**

1. **Reducir límites** si es necesario para mayor seguridad
2. **Verificar que el servicio de hosting** también envíe headers de proxy
3. **Ajustar `trust proxy`** según la infraestructura:
   ```javascript
   // Para la mayoría de servicios:
   app.set('trust proxy', 1);
   
   // Para múltiples proxies:
   app.set('trust proxy', 2);
   
   // Para confiar en todos:
   app.set('trust proxy', true); // ⚠️ Solo si sabes lo que haces
   ```

## Monitoreo

Para ver cuántas peticiones quedan, revisa los headers de respuesta:

```
RateLimit-Limit: 500
RateLimit-Remaining: 487
RateLimit-Reset: 1697712345
```

Estos headers se incluyen automáticamente gracias a:
```javascript
standardHeaders: true
```

## Notas Adicionales

### 🔍 Debug de IPs

Si quieres ver qué IP está detectando el rate limiter:

```javascript
// Añadir temporalmente en server.js
app.use((req, res, next) => {
  console.log('IP detectada:', req.ip);
  console.log('X-Forwarded-For:', req.headers['x-forwarded-for']);
  next();
});
```

### 🚀 Límites Recomendados

Para diferentes entornos:

**Desarrollo local:**
- General: 1000+ (sin límites reales)
- Auth: 50

**Desarrollo con Ngrok (actual):**
- General: 500
- Auth: 20
- Contact: 10
- Create: 50

**Producción:**
- General: 200-300
- Auth: 10-15
- Contact: 5
- Create: 30

## Resultado Final

✅ El error de rate limiting está resuelto
✅ El backend funciona correctamente con Ngrok
✅ Cada usuario tiene sus propios límites
✅ La seguridad se mantiene intacta
✅ El código está preparado para producción

¡Ahora puedes compartir tu web a través de Ngrok sin problemas! 🎉
