# Partyventura - Instrucciones para Agentes de IA

## Descripción del Proyecto
Partyventura es una aplicación web full-stack para gestión de eventos y reservas de espacios para fiestas. La arquitectura sigue una **separación estricta backend/frontend** con una API REST en Node.js/Express y frontend en JavaScript vanilla servido como archivos estáticos.

## Arquitectura y Stack Tecnológico

### Backend (`/backend`)
- **Stack**: Node.js 16+, Express 4.18, MongoDB 8.0+, Mongoose
- **Autenticación**: Tokens JWT (expiración 24h) con hashing bcryptjs
- **Seguridad**: Enfoque multicapa - Helmet.js headers, express-rate-limit, express-mongo-sanitize, xss-clean, hpp
- **Subida de Archivos**: Multer con validación estricta (límite 5MB, solo imágenes: jpeg|jpg|png|gif|webp)
- **Email**: Nodemailer con SMTP de Gmail (requiere contraseñas de aplicación)
- **Cron Jobs**: node-cron para tareas automatizadas (limpieza de eventos >1 mes diaria a las 00:01)

### Frontend (`/frontend`)
- **Arquitectura**: JavaScript vanilla con estructura modular (sin frameworks)
- **Estilos**: TailwindCSS 3.4+ para utility-first styling
- **Estructura**: 
  - `/public` - HTML estático servido por Express
  - `/src/js/modules` - Módulos reutilizables (auth.js, config.js, utils.js)
  - `/src/js/pages` - Lógica específica de página (admin.js, main.js)
- **Despliegue**: Servido como archivos estáticos vía `express.static()` desde el servidor backend

## Patrones y Convenciones Críticas

### 1. Formato de Respuesta API
**TODOS los endpoints deben retornar esta estructura:**
```javascript
// Éxito
{ success: true, data: {...}, count: N }

// Error
{ success: false, message: "...", errors: [...] }
```

### 2. Flujo de Autenticación
- Backend: Cadena de middleware JWT en `/backend/middleware/auth.js`
  - `auth` - Requiere token válido, carga usuario completo de BD (excluye password)
  - `requireSuperAdmin` - Debe encadenarse DESPUÉS de `auth`, verifica `rol === 'superadmin'`
- Frontend: Módulo Auth en `/frontend/src/js/modules/auth.js`
  - Token almacenado en localStorage como `authToken`
  - Objeto usuario almacenado como `adminUser` (string JSON)
  - **Siempre usar `Auth.getAuthHeaders()` para peticiones autenticadas**

### 3. Sistema de Roles (3 Roles)
- `empleado` - Puede fichar entrada/salida vía API de registros horarios
- `admin` - Gestión completa de contenido (noticias, eventos, contactos, galería)
- `superadmin` - Todos los permisos admin + gestión de usuarios + gestión de horarios/tarifas

### 4. Orden de Middleware de Seguridad (CRÍTICO)
En `server.js`, los middleware DEBEN aplicarse en este orden:
1. Trust proxy (para compatibilidad con Ngrok)
2. Headers de seguridad (`securityHeaders`, `additionalHeaders`)
3. Logger de seguridad
4. Rate limiters (general, luego específicos por ruta)
5. Configuración CORS
6. Parseo de body
7. Sanitización de datos
8. Rutas

### 5. Configuración de Rate Limiting
Ubicado en `/backend/middleware/rateLimiter.js` y `specificRateLimiters.js`:
- API general: 100 req/15min por IP
- Login: 5 intentos/15min (cuenta se bloquea tras 5 intentos fallidos por 15min)
- Contacto: 5 mensajes/hora
- Newsletter: 3 suscripciones/hora
- Creación de contenido: 20 items/hora
- **Recuperación de contraseña**: 3 solicitudes/hora por email o IP (forgot), 5 intentos/15min (reset)

### 6. Patrón de Subida de Archivos
Usar middleware multer de `/backend/middleware/upload.js`:
```javascript
// En rutas
router.post('/path', auth, upload.single('imagen'), validation, validate, controller);

// Acceder al archivo en controlador
req.file.path // Ruta completa
req.file.filename // Nombre único generado
```
**Siempre validar con `imageFilter` - solo permite tipos MIME de imagen**

### 7. Cambio de Entorno en Frontend
`/frontend/src/js/modules/config.js` contiene el switch de MODE:
```javascript
const MODE = 'development'; // o 'production'
```
- `development` - Apunta a `localhost:5000`
- `production` - Apunta a URL de Ngrok (debe actualizarse manualmente)
**Este es el ÚNICO lugar para cambiar endpoints de API**

### 8. Patrón de Validación
Toda validación de entrada usa express-validator:
```javascript
// Definir reglas de validación
const validation = [
  body('field').trim().isLength({ min: 3 }).escape()
];

// Aplicar en ruta
router.post('/path', validation, validate, controller);
```
El middleware `validate` (en `/backend/middleware/validate.js`) formatea errores automáticamente

### 9. Sistema de Gestión de Eventos
- Auto-limpieza: Eventos mayores a 1 mes se eliminan diariamente (ver `/backend/cron-jobs.js`)
- Eventos públicos: `isPublic: true` + `status !== 'cancelado'`
- Formato calendario: Usa estructura de respuesta compatible con FullCalendar
- Codificación de color: Colores hex (#RRGGBB) para visualización en calendario

### 10. Nomenclatura de Modelos de Base de Datos
Todos los modelos usan singular, PascalCase: `Admin.js`, `Event.js`, `News.js`, `Newsletter.js`, `Contact.js`, `GalleryImage.js`, `Schedule.js`, `TimeRecord.js`

### 11. Sistema de Recuperación de Contraseña
**Implementado**: Sistema completo y seguro de recuperación de contraseña para admins.

**Arquitectura**:
- **Modelo Admin** (`/backend/models/Admin.js`):
  - `resetPasswordToken` - Token hasheado con SHA-256 (select: false)
  - `resetPasswordExpire` - Timestamp de expiración (1 hora)
  - Método `generarResetToken()` - Genera token aleatorio de 32 bytes, lo hashea y retorna token sin hashear
  - Método `limpiarResetToken()` - Limpia campos de token tras uso exitoso

- **Controladores** (`/backend/controllers/authController.js`):
  - `forgotPassword()` - Recibe email, genera token, envía email con enlace de recuperación
  - `resetPassword()` - Valida token, verifica expiración, actualiza contraseña, limpia token

- **Rutas** (`/backend/routes/auth.js`):
  - `POST /api/auth/forgot-password` - Solicitud de recuperación (rate limit: 3 req/hora)
  - `POST /api/auth/reset-password` - Restablecimiento con token (rate limit: 5 req/15min)

- **Email Template** (`/backend/templates/resetPasswordEmail.js`):
  - HTML responsive con gradiente corporativo naranja
  - Logo circular, botón CTA, enlace alternativo
  - Advertencias de seguridad y expiración (1 hora)
  - Compatible móvil y desktop

- **Frontend**:
  - `/frontend/public/forgot-password.html` - Formulario de solicitud de recuperación
  - `/frontend/public/reset-password.html` - Formulario de reset con toggle de visibilidad y medidor de fortaleza
  - Link en `login.html` - "¿Olvidaste tu contraseña?"

**Seguridad**:
- Token aleatorio de 32 bytes generado con `crypto.randomBytes()`
- Hashing SHA-256 antes de almacenar en base de datos
- Expiración de 1 hora estrictamente validada
- Token de un solo uso (se limpia tras uso exitoso)
- Rate limiting estricto para prevenir ataques de fuerza bruta
- Respuestas genéricas para prevenir enumeración de usuarios
- Validación multicapa: frontend → middleware → backend

**Configuración Requerida**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=contraseña-de-aplicacion-gmail
```
**IMPORTANTE**: Usar contraseña de aplicación de Gmail, no contraseña normal.

**Flujo Completo**:
1. Usuario ingresa email en forgot-password.html
2. Backend genera token, lo hashea y almacena con expiración
3. Email enviado con enlace: `http://domain/reset-password.html?token=XXXXX`
4. Usuario hace clic en enlace, ingresa nueva contraseña
5. Backend valida token hasheado y expiración
6. Si válido, actualiza contraseña y limpia token
7. Redirección automática a login

**Documentación**: Ver `/docs/RECUPERACION_PASSWORD.md` para guía completa y `/docs/TESTING_RECUPERACION_PASSWORD.md` para testing.

### 12. Sistema de Bulk Selection y Eliminación
**Implementado**: Sistema de selección masiva con checkbox "Seleccionar Todo" en 6 secciones del panel admin.

**Secciones Afectadas**:
1. Noticias (`#noticias-content`)
2. Mensajes de Contacto (`#contacto-content`)
3. Gestión de Empleados (`#gestion-empleados-content`)
4. Eventos (`#eventos-content`)
5. Galería (`#galeria-content`)
6. Control Horario (`#control-horario-content`) - Incluye exportación CSV de seleccionados

**Arquitectura**:
- **Estado basado en Set**: Uso de `Set()` para almacenar IDs seleccionados (rendimiento O(1))
- **Modo silencioso**: Operaciones masivas usan parámetro `silent=true` para evitar recargas individuales
- **Rate limiting friendly**: Una sola recarga al final de operación masiva

**Patrón de Implementación** (en `/frontend/public/admin.js`):
```javascript
// Estado para cada sección
const selectedNewsIds = new Set();
const selectedContactIds = new Set();
const selectedEmpleadosIds = new Set();
const selectedEventIds = new Set();
const selectedGalleryIds = new Set();
const selectedTimeRecordIds = new Set();

// Handler de checkbox individual
function handleNewsCheckbox(newsId, isChecked) {
  if (isChecked) {
    selectedNewsIds.add(newsId);
  } else {
    selectedNewsIds.delete(newsId);
  }
  updateSelectAllNewsCheckbox();
  updateDeleteSelectedNewsButton();
}

// Handler de "Seleccionar Todo"
function handleSelectAllNews(isChecked) {
  const checkboxes = document.querySelectorAll('.news-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = isChecked;
    const newsId = checkbox.dataset.newsId;
    if (isChecked) {
      selectedNewsIds.add(newsId);
    } else {
      selectedNewsIds.delete(newsId);
    }
  });
  updateDeleteSelectedNewsButton();
}

// Eliminación masiva con modo silencioso
async function deleteSelectedNews() {
  const idsArray = Array.from(selectedNewsIds);
  const deletePromises = idsArray.map(id => deleteNews(id, true)); // silent=true
  await Promise.all(deletePromises);
  selectedNewsIds.clear();
  await loadNews(); // Una sola recarga al final
}
```

**Características Especiales - Control Horario**:
- **Exportación CSV selectiva**: Botón "Exportar Seleccionados (CSV)"
- **Filtrado de datos**: Solo exporta registros marcados
- **Formato CSV**:
  ```csv
  Empleado,Fecha,Tipo,Hora,Notas
  Juan Pérez,2025-10-23,Entrada,08:00,
  Juan Pérez,2025-10-23,Salida,17:00,
  ```
- **Descarga automática**: Genera Blob y simula clic en enlace temporal

**UX/UI**:
- Checkbox "Seleccionar Todo" en header de cada tabla
- Botón "Eliminar Seleccionados" visible solo si hay selección
- Confirmación con SweetAlert2 mostrando cantidad de items
- Contador visual de items seleccionados
- Limpieza automática de estado tras operación
- Feedback con notificaciones de éxito/error

**Prevención de Problemas**:
- Validación de selección vacía antes de eliminar
- Confirmación explícita del usuario
- Manejo de errores individuales en batch
- Recarga única al finalizar para evitar rate limiting
- Limpieza de estado en cada cambio de sección

**Notas de Implementación**:
- NUNCA editar archivos en `/frontend/src/` - siempre trabajar en `/frontend/public/`
- Usar modo silencioso para operaciones batch: `deleteItem(id, true)`
- Recargar datos una sola vez al final: `await Promise.all(promises); await loadData();`
- Mantener sincronización entre checkbox visual y estado Set

## Flujos de Trabajo de Desarrollo

### Iniciar la Aplicación
**Scripts PowerShell en `/scripts`:**
```powershell
# Inicio automatizado completo (recomendado)
.\scripts\start.ps1

# Inicio rápido (si ya está configurado)
.\scripts\inicio-rapido.ps1

# Reinicio completo (limpia logs, reconstruye)
.\scripts\reinicio-completo.ps1
```

### Checklist de Configuración del Entorno
1. MongoDB debe estar ejecutándose (auto-detectado en `/scripts/start.ps1`)
2. Crear `.env` desde `.env.example` en `/backend`
3. Generar JWT_SECRET seguro: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
4. Configurar contraseña de aplicación de Gmail para `EMAIL_PASS`
5. Ejecutar `npm run init-admin` para crear primer superadmin

### Pruebas de API
Endpoint de health check: `http://localhost:5000/api/health`

### Configuración de Ngrok (Pruebas Móviles/Externas)
1. Ejecutar backend: `cd backend && npm run dev`
2. Iniciar Ngrok: `ngrok http 5000`
3. Actualizar `/frontend/src/js/modules/config.js` con URL de Ngrok
4. Cambiar MODE a `'production'`
**Ver `/docs/NGROK_SETUP.md` para guía completa**

## Problemas Comunes y Soluciones

### 1. Problemas de CORS con Ngrok
La configuración CORS en `server.js` es **intencionalmente permisiva** para desarrollo y acepta cualquier origen `ngrok`. No la restrinjas sin actualizar la whitelist.

### 2. Headers CSP Rompen Panel de Admin
Si agregas nuevos recursos externos (CDNs, APIs), actualiza CSP en `/backend/middleware/security.js`:
```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.example.com"],
    // ... agregar a la directiva apropiada
  }
}
```

### 3. Actualización de Contraseñas en Gestión de Admins
Al editar admins vía `/api/admins/:id`, la contraseña es **opcional**. Si se omite, se preserva la contraseña existente. Esto se maneja en `adminController.js`.

### 4. Rutas de Imágenes en Respuestas
Las imágenes almacenadas en `/backend/uploads/` se sirven en `/uploads/image.jpg`. El frontend debe construir la URL completa:
```javascript
const imageUrl = `${SERVER_URL}${event.image}`; // SERVER_URL de config.js
```

### 5. Configuración de Trust Proxy
`app.set('trust proxy', 1)` es CRÍTICO para Ngrok. Sin él, el rate limiting ve todas las peticiones como provenientes de localhost.

### 6. Registros Horarios No Cargan Tras Eliminar Empleado
**Problema**: Tras eliminar un empleado, los registros horarios en el panel admin fallan al cargar.

**Causa**: Cuando se elimina un empleado, los registros de tiempo (`TimeRecord`) mantienen una referencia al empleado eliminado. Al hacer `.populate('empleado')`, Mongoose devuelve `null`, y el frontend intenta acceder a `record.empleado.nombre` causando un error.

**Solución Implementada**:
- **Backend** (`timeRecordController.js`): Formatear registros para detectar referencias huérfanas y usar el campo `empleadoNombre` almacenado en el registro como fallback
- **Frontend** (`admin.js`): Verificar si `record.empleado` existe antes de acceder a sus propiedades, usar `empleadoNombre` como fallback, y mostrar indicador visual "(usuario eliminado)"

**Prevención**: El modelo `TimeRecord` almacena `empleadoNombre` como copia desnormalizada específicamente para manejar este escenario.

### 7. Errores de Email "Invalid Login"
**Problema**: El backend no puede enviar emails, error "Invalid login".

**Soluciones**:
- Verifica que `EMAIL_USER` sea una cuenta de Gmail válida
- Asegúrate de usar una **contraseña de aplicación** de Gmail, no tu contraseña normal
- Activa verificación en dos pasos en tu cuenta de Google
- Genera una contraseña de aplicación en https://myaccount.google.com/apppasswords
- Verifica que `EMAIL_HOST` sea `smtp.gmail.com` y `EMAIL_PORT` sea `587`

### 8. MongoDB Connection Failed
**Problema**: El backend no puede conectarse a MongoDB.

**Soluciones**:
- Verifica que MongoDB esté ejecutándose: `mongosh` (debe conectar sin errores)
- En Windows, inicia el servicio: `net start MongoDB` (como administrador)
- Verifica `MONGODB_URI` en `.env` (default: `mongodb://localhost:27017/partyventura`)
- Comprueba que el puerto 27017 no esté bloqueado por firewall

### 9. Frontend No Muestra Datos del Backend
**Problema**: El frontend carga pero no muestra datos de la API.

**Diagnóstico y Soluciones**:
- Abre DevTools → Console y busca errores CORS
- Verifica que el backend esté ejecutándose: visita `http://localhost:5000/api/health`
- Confirma que `MODE` en `/frontend/src/js/modules/config.js` coincida con tu entorno
- Si usas Ngrok, verifica que la URL en config.js esté actualizada y que MODE sea `'production'`
- Revisa Network tab en DevTools para ver qué endpoints están fallando

### 10. Token JWT Expirado Constantemente
**Problema**: Los usuarios son deslogueados cada pocos minutos.

**Causa**: Token JWT expira muy rápido o hay desincronización de reloj.

**Soluciones**:
- Verifica `JWT_EXPIRE` en `.env` (default: `24h`)
- Sincroniza el reloj del sistema si estás en VM o contenedor
- Verifica que el servidor no se esté reiniciando (lo que regenera el secret si no está en .env)
- Asegúrate de que `JWT_SECRET` en `.env` no esté cambiando entre reinicios

### 11. Nuevas Rutas Agregadas No Funcionan (404)
**Problema**: Después de agregar nuevas rutas al backend, obtienes error 404 al intentar acceder.

**Causa**: Node.js/Express no recarga automáticamente archivos de rutas nuevos, incluso con nodemon.

**Solución**:
1. **Detener el servidor** completamente (Ctrl+C)
2. **Reiniciar el servidor**: `cd backend && npm run dev`
3. Verificar en logs de consola que no haya errores de importación
4. Probar endpoint con `/api/health` primero
5. Si persiste, verificar que la ruta esté registrada en `server.js` con `app.use()`

**Prevención**: Siempre reiniciar servidor tras agregar nuevos archivos de ruta o controladores.

### 12. Bulk Selection No Funciona Tras Agregar Items
**Problema**: Checkbox "Seleccionar Todo" no marca items recién agregados.

**Causa**: Los event listeners no se reasignan a elementos DOM nuevos tras recarga de datos.

**Solución**:
- Llamar a la función de setup de event listeners después de `loadData()`
- Ejemplo en `admin.js`:
  ```javascript
  async function loadNews() {
    // ... cargar datos ...
    setupNewsEventListeners(); // Reasignar listeners
  }
  ```

**Prevención**: Siempre llamar a setup de event listeners tras cualquier actualización del DOM.

### 13. Email de Recuperación de Contraseña No Llega
**Problema**: Usuario solicita recuperación pero no recibe email.

**Diagnóstico**:
1. Verifica logs del backend - busca "✅ Email de recuperación enviado" o errores
2. Verifica configuración SMTP en `.env`:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASS=contraseña-de-aplicacion  # NO tu contraseña normal
   ```
3. Verifica que uses contraseña de aplicación de Gmail:
   - Ir a https://myaccount.google.com/apppasswords
   - Generar nueva contraseña para "Correo"
   - Copiar en `EMAIL_PASS` sin espacios

**Soluciones Comunes**:
- Error "Invalid login": Estás usando contraseña normal en vez de contraseña de aplicación
- Error "Connection timeout": Firewall bloqueando puerto 587, verificar `EMAIL_PORT=587`
- Error "Self signed certificate": Agregar `tls: { rejectUnauthorized: false }` a config Nodemailer (solo desarrollo)

**Testing**: Ver `/docs/TESTING_RECUPERACION_PASSWORD.md` para guía completa.

### 14. CSV Export Descarga Archivo Vacío
**Problema**: Al exportar registros horarios seleccionados, el CSV está vacío o tiene solo headers.

**Causa**: El Set de IDs seleccionados está vacío o los datos no se filtran correctamente.

**Solución**:
1. Verificar que `selectedTimeRecordIds.size > 0` antes de exportar
2. Verificar que el filtrado use el Set correctamente:
   ```javascript
   const selectedRecords = allRecords.filter(r => selectedTimeRecordIds.has(r._id));
   ```
3. Verificar que los IDs en el Set coincidan con los IDs de los registros (string vs ObjectId)

**Prevención**: Mostrar contador de seleccionados en UI antes de permitir exportación.

### 15. Caché del Navegador No Muestra Cambios en HTML
**Problema**: Cambios en archivos HTML no se reflejan en el navegador, incluso en Ngrok.

**Causa**: Express sirve archivos estáticos con caché del navegador por defecto.

**Solución Implementada**:
- Middleware en `server.js` que desactiva caché para archivos HTML:
```javascript
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
  }
  next();
});
```

**Soluciones Rápidas**:
- **Hard Reload**: Ctrl + Shift + R (Windows) o Cmd + Shift + R (Mac)
- **DevTools**: F12 → Click derecho en recargar → "Vaciar caché y recargar de manera forzada"
- **Modo Incógnito**: Abre ventana de incógnito para ver cambios sin caché

**Prevención**: Siempre reiniciar servidor tras cambios estructurales en archivos estáticos.

### 16. Botones Desalineados en Tarjetas (Cards)
**Problema**: Botones en tarjetas con diferentes cantidades de contenido no están a la misma altura.

**Causa**: Tailwind CSS no puede forzar altura uniforme cuando el contenido varía significativamente entre tarjetas.

**Solución**: Usar CSS custom con flexbox y altura mínima:
```css
/* En <style> dentro de <head> */
#cardContainer > article {
  min-height: 620px; /* Altura mínima uniforme */
  display: flex !important;
  flex-direction: column !important;
  position: relative;
}

/* Contenido crece para llenar espacio */
#cardContainer > article > div.flex-grow {
  flex: 1 1 auto !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
}

/* Botón empujado al final */
#cardContainer > article > div.mt-auto {
  margin-top: auto !important;
  padding-top: 1rem !important;
  flex-shrink: 0 !important;
}

/* Badges absolutos no afectan layout */
#cardContainer > article > div[style*="absolute"] {
  position: absolute !important;
}
```

**Estructura HTML requerida**:
```html
<article class="... flex flex-col ...">
  <div class="flex-grow">
    <!-- Contenido variable -->
  </div>
  <div class="mt-auto pt-4">
    <!-- Botón siempre alineado -->
  </div>
</article>
```

**Notas**:
- Usar `!important` para sobrescribir Tailwind cuando sea necesario
- `min-height` debe ser suficiente para la tarjeta con más contenido
- Badges con `position: absolute` deben estar en tarjetas con `position: relative`

## Información de Horarios del Local

**Horarios Actuales** (actualizados octubre 2025):
- **Lunes a Jueves**: 17:00 - 22:00
- **Viernes a Domingo**: 10:00 - 22:00
- **Vísperas de Festivo y Festivos**: 10:00 - 22:00

**Ubicaciones en el código**:
1. Sección "Horarios" (tabla): `/frontend/public/index.html` líneas 761-774
2. Sección "¿Dónde Estamos?" (footer): `/frontend/public/index.html` línea 935

**Importante**: Al actualizar horarios, verificar ambas ubicaciones para mantener consistencia.

## Archivos Clave para Contexto

- **Arquitectura**: `/docs/ESTRUCTURA_PROYECTO.md` - Explicación completa de estructura de archivos
- **Seguridad**: `/backend/SECURITY.md` - Guía detallada de implementación de seguridad
- **Documentación API**: `/backend/API_DOCUMENTATION.md` - Referencia completa de endpoints
- **Inicio Rápido**: `/docs/INICIO_RAPIDO.md` - Guía de configuración en 3 pasos
- **Roles de Admin**: `/docs/GESTION_ADMINS.md` - Sistema de roles y permisos
- **Recuperación de Contraseña**: `/docs/RECUPERACION_PASSWORD.md` - Sistema completo de password recovery
- **Testing de Recuperación**: `/docs/TESTING_RECUPERACION_PASSWORD.md` - Guía rápida de testing del sistema de recuperación

## Enfoque de Pruebas

No existe suite de pruebas formal. Flujo de pruebas manual:
1. Usar `/api/health` para conectividad del backend
2. Verificar conexión a MongoDB en logs de consola del backend
3. Probar flujo de auth: login → verificar token → endpoint protegido
4. Validar rate limiting: exceder límites y verificar respuestas 429
5. Probar subida de archivos: asegurar nombres únicos y rutas de almacenamiento correctas

## Tareas Comunes

### Agregar Nueva Ruta Protegida
1. Crear controlador en `/backend/controllers/`
2. Agregar reglas de validación (express-validator)
3. Crear archivo de ruta en `/backend/routes/`
4. Aplicar middleware: `router.post('/path', auth, validation, validate, controller)`
5. Registrar ruta en `server.js`: `app.use('/api/resource', require('./routes/resource'))`

### Agregar Nueva Funcionalidad de Admin
1. Verificar si requiere rol `superadmin` - usar middleware `requireSuperAdmin`
2. Actualizar frontend para ocultar elementos UI basado en `Auth.getUser().rol`
3. Probar con cuentas `admin` y `superadmin`

### Actualizar Configuración de Frontend
**Nunca hardcodear URLs de API** - siempre usar `API_URL` y `SERVER_URL` de `/frontend/src/js/modules/config.js`
