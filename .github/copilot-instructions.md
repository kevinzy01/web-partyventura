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

### 3. Sistema de Roles (3 Roles Principales)
- `empleado` - Puede fichar entrada/salida vía API de registros horarios
- `admin` - Gestión completa de contenido (noticias, eventos, contactos, galería)
- `superadmin` - Todos los permisos admin + gestión de usuarios + gestión de horarios/tarifas

### 3.1 Sistema de Dos Roles para Empleados (CRÍTICO)

El sistema implementa una **arquitectura de DOS ROLES INDEPENDIENTES**:

#### **ROL (Tipo de Usuario - Control de Acceso)**
Define qué portal accede el usuario:
- `empleado` - Acceso al portal de empleados (fichar entrada/salida, ver horarios)
- `admin` - Acceso al panel de administración (gestión de contenido)
- `superadmin` - Acceso panel admin + gestión de usuarios y configuración

#### **ROL EMPLEADO (Puesto de Trabajo)**
Define el área de trabajo (solo aplica cuando `rol === 'empleado'`):
- `monitor` - Supervisa actividades, atiende consultas (color: azul)
- `cocina` - Prepara alimentos y bebidas (color: naranja)
- `barra` - Atiende barra y bebidas (color: morado)

#### **Reglas Críticas**
1. **TODOS los empleados DEBEN tener `rol='empleado'`** (para acceder al portal)
2. **TODOS los empleados DEBEN tener `rolEmpleado` definido** (monitor/cocina/barra)
3. **El campo `rol='empleado'` NO es editable** - Se asigna automáticamente en creación
4. **Solo `rolEmpleado` es editable** - Se puede cambiar el puesto de un empleado

#### **Implementación en Backend**
**Modelo** (`/backend/models/Admin.js`):
```javascript
rol: {
  type: String,
  enum: ['admin', 'superadmin', 'empleado'],
  default: 'empleado'
},
rolEmpleado: {
  type: String,
  enum: ['monitor', 'cocina', 'barra'],
  required: function() { return this.rol === 'empleado'; }
}
```

**Controladores** (`/backend/controllers/adminController.js`):
- `createEmpleado()` - SIEMPRE setea `rol: 'empleado'` (no acepta otro valor)
- `updateEmpleado()` - NO permite cambiar `rol`, solo `rolEmpleado`
- `getEmpleados()` - Filtra por `rol: 'empleado'` (acceso, NO puesto)

**Endpoints** (`/backend/routes/admins.js`):
- `POST /api/admins/empleados` - Crear empleado
- `GET /api/admins/empleados` - Listar empleados
- `GET /api/admins/empleados/:id` - Obtener empleado específico
- `PUT /api/admins/empleados/:id` - Editar empleado
- `DELETE /api/admins/empleados/:id` - Eliminar empleado

#### **Implementación en Frontend**
**Formulario** (`/frontend/public/admin.html`):
- **NO mostrar selector de `rol`** (siempre empleado)
- **Mostrar selector de `rolEmpleado`** (monitor/cocina/barra)
- **Texto de ayuda explicar** que rol se asigna automáticamente

**JavaScript** (`/frontend/src/js/pages/admin.js`):
- `handleEmpleadoSubmit()` - Hardcodea `rol: 'empleado'` (línea ~1780)
- `loadEmpleados()` - Carga desde `/api/admins/empleados`
- `loadEmpleadosForSchedules()` - Llama a `/api/admins/empleados`
- **Nunca filtrar por `rolEmpleado`** - Solo filtrar por `rol === 'empleado'`

#### **Visualización**
Se muestran badges de color sin emojis:
- Monitor (azul)
- Cocina (naranja)
- Barra (morado)

#### **Validación**
✅ Condicional Mongoose: `rolEmpleado` requerido si `rol === 'empleado'`  
✅ Backend: Valida enum ['monitor', 'cocina', 'barra']  
✅ Frontend: Select requerido, solo permite valores válidos  
✅ Protección: `updateEmpleado()` no permite cambiar `rol`

### 3.2 Puestos de Trabajo de Empleados
Cada empleado tiene un rol específico que define su área de trabajo:
- `monitor` - Supervisa actividades, atiende consultas (color: azul)
- `cocina` - Prepara alimentos y bebidas (color: naranja)
- `barra` - Atiende barra y bebidas (color: morado)

**Implementación**:
- Campo `rolEmpleado` en modelo Admin (requerido solo para `rol === 'empleado'`)
- Selector en formulario de creación/edición de empleados (sin emojis)
- Visualización en tarjetas de empleados, control horario y horarios laborales (badges de color)
- Validación backend: Solo `['monitor', 'cocina', 'barra']` son válidos
- Colores automáticos según rol: azul, naranja, morado

**Ubicaciones donde se muestra**:
1. **Gestión de Empleados** - Badge colorido con nombre del puesto
2. **Control Horario** - Badge con puesto en columna de empleado
3. **Horarios Laborales** (3 vistas) - Badge con puesto en información del empleado
4. **Dropdowns de Horarios** - Solo nombre del empleado, sin badges

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

### 12. Sistema de Credenciales Automáticas para Empleados
**Implementado**: Sistema completo de onboarding automático con generación de credenciales y email de bienvenida (noviembre 2025).

**Arquitectura**:
- **Backend** (`/backend/controllers/adminController.js` línea 437-583):
  - Contraseña opcional en creación de empleados
  - Auto-generación con `crypto.randomBytes(6).toString('hex')` (12 caracteres hexadecimales)
  - Reset token generado con `empleado.generarResetToken()` (24h expiry)
  - Email enviado con credenciales + link de cambio de contraseña
  - Flags de respuesta: `emailSent`, `tempPasswordGenerated`

- **Email Template** (`/backend/templates/welcomeEmployeeEmail.js` 180 líneas):
  - HTML responsive con inline CSS, gradiente corporativo naranja
  - **Escape de HTML** para prevenir XSS (`escapeHtml()` función)
  - Muestra: nombre, usuario, contraseña temporal, botón CTA
  - Link de reset: `${FRONTEND_URL}/reset-password.html?token=XXXXX`
  - Compatible móvil y desktop

- **Frontend** (`/frontend/public/admin.html` línea 1295-1320):
  - Campo de contraseña **opcional** (placeholder informativo)
  - Hint azul: "💡 Si dejas este campo vacío, se generará una contraseña aleatoria..."
  - Validación actualizada en `admin.js` línea 1746-1820

**Seguridad** (Auditoría Completa - ver `/docs/AUDITORIA_CREDENCIALES_AUTO.md`):
- ✅ **XSS Prevention**: Función `escapeHtml()` sanitiza nombre, username, tempPassword
- ✅ **Token Seguro**: `crypto.randomBytes()` para password y `generarResetToken()` para reset
- ✅ **Un Solo Uso**: Token se limpia tras cambio exitoso (`limpiarResetToken()`)
- ✅ **Expiración**: Reset token válido por 24 horas
- ✅ **Validación Multicapa**: Frontend → Backend → Base de Datos
- ✅ **URL Correcta**: `FRONTEND_URL || NGROK_URL || 'http://localhost:5000'` (puerto 5000)

**Flujo Completo**:
1. Admin crea empleado SIN contraseña (campo vacío)
2. Backend verifica que tenga email válido
3. Genera contraseña temporal (12 chars hex)
4. Crea reset token (24h expiry, hasheado SHA-256)
5. Envía email con template HTML (credenciales + link)
6. Empleado recibe email, anota credenciales
7. Hace clic en "Cambiar mi Contraseña"
8. Ingresa nueva contraseña segura
9. Token se limpia automáticamente
10. Accede al portal con su nueva contraseña

**Casos de Uso**:
```javascript
// Caso 1: Auto-credenciales (RECOMENDADO)
{
  nombre: "Juan Pérez",
  nombreUsuario: "juan.perez",
  email: "juan@example.com",  // ✅ REQUERIDO
  password: "",                // ← VACÍO = auto-generado
  rolEmpleado: "monitor"
}
→ ✅ Password generado
→ ✅ Email enviado
→ ✅ Frontend muestra: "📧 Email enviado con credenciales..."

// Caso 2: Contraseña manual (tradicional)
{
  password: "miPassword123"  // ← PROPORCIONADO
}
→ ❌ NO genera password automática
→ ❌ NO envía email
→ ✅ Usa contraseña del admin

// Caso 3: Sin email NI contraseña (NO RECOMENDADO)
{
  email: "",
  password: ""
}
→ ⚠️ Warning frontend: "El empleado NO podrá acceder..."
→ ⚠️ Requiere confirmación explícita del admin
→ ⚠️ Empleado creado pero sin credenciales
```

**Mensajes de Respuesta**:
```javascript
// Éxito con email
{
  success: true,
  message: "Empleado creado exitosamente. Email enviado con credenciales.",
  emailSent: true,
  tempPasswordGenerated: true,
  data: { ...empleadoData }
}

// Éxito sin email (SMTP caído)
{
  success: true,
  message: "Empleado creado. Email NO enviado - comunica contraseña manualmente.",
  emailSent: false,
  tempPasswordGenerated: true,
  data: { ...empleadoData, tempPassword: "abc123def456" }
}

// Éxito con contraseña manual
{
  success: true,
  message: "Empleado creado con contraseña proporcionada.",
  emailSent: false,
  tempPasswordGenerated: false
}
```

**Edge Cases Manejados**:
- ✅ **SMTP caído**: Contraseña retornada en respuesta, admin debe comunicar manualmente
- ✅ **Token expirado**: Error 400 tras 24h, empleado debe usar "Olvidé contraseña"
- ✅ **Token re-usado**: Limpiado tras primer uso, segundo intento falla
- ✅ **Caracteres especiales**: Validación regex bloquea SQL/XSS, permite acentos
- ✅ **Email duplicado**: Índice único en MongoDB lanza error E11000
- ✅ **Sin email ni password**: Warning con confirmación explícita

**Validación de Inputs**:
```javascript
// adminController.js línea 464-483
nombre: /^[a-záéíóúñü\s]+$/i  // Letras y espacios (permite acentos)
username: /^[a-z0-9_.-]+$/    // Alfanumérico + _ . -
email: isEmail() + normalizeEmail()  // RFC 5322
password: opcional, min 6 si se proporciona
```

**Configuración Requerida**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=contraseña-de-aplicacion-gmail  # NO contraseña normal
FRONTEND_URL=http://localhost:5000          # Desarrollo
NGROK_URL=https://xxxx.ngrok.io             # Producción con Ngrok
```

**Testing**:
```bash
# Test de email local
npm run dev  # Backend en puerto 5000
# Crear empleado sin contraseña con email válido
# Verificar email recibido en inbox
# Hacer clic en link, cambiar contraseña
# Login con nuevas credenciales
```

**Documentación Completa**: 
- `/docs/AUDITORIA_CREDENCIALES_AUTO.md` - Auditoría de seguridad exhaustiva (45+ edge cases)
- Commit inicial: `30656af`
- Commit fix XSS: `PENDING`

**Recomendaciones de Producción**:
- [ ] Implementar rate limiting específico para creación de empleados (10/hora)
- [ ] Agregar logging de auditoría de credenciales enviadas
- [ ] Monitoreo de emails fallidos con alertas
- [ ] Dashboard de empleados pendientes de activación

### 13. Sistema de Bulk Selection y Eliminación
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

### 17. Empleado Olvida Fichar Salida y Pasa Medianoche (Edge Case - RESUELTO ✅)

**Problema**: Empleado ficha entrada a las 23:00, olvida fichar salida, llega medianoche, día siguiente intenta fichar entrada y queda BLOQUEADO.

```
Lunes 23:00 → Ficha entrada
           → OLVIDA fichar salida (se duerme)
Martes 00:00 → Pasa medianoche
Martes 09:00 → Intenta fichar entrada
           → ❌ ERROR: "Ya tienes entrada registrada"
```

**Causa Raíz**: El sistema valida que no haya 2 entradas consecutivas, pero no detecta que la primera es de otro día.

**Solución Implementada**: Función `detectarYGestionarEntradaOlvidada()` que:
1. **Detecta**: Si hay entrada de día anterior sin cerrar
2. **Auto-cierra**: Crea registro de salida automático a las 23:59 del mismo día
3. **Crea horario**: Genera WorkSchedule completado (verde/automático)
4. **Audita**: Registra todo con notas detalladas
5. **Desbloquea**: Permite empleado fichar entrada nueva sin problemas

**Tecnología**:
- **Backend**: Función `detectarYGestionarEntradaOlvidada()` en `timeRecordController.js` (~60 líneas)
- **Frontend**: Detección de `data.entradaOlvidadaGestionada` en `ficharSalida()` 
- **UI**: Toast ⚠️ explicativo con detalles de acción automática

**Resultados en BD**:
```javascript
// Entrada original (Lunes 23:00)
TimeRecord {
  _id: "67234...",
  tipo: "entrada",
  fecha: "2025-11-03T23:00:00.000Z",
  ...
}

// Salida automática (CREADA, Lunes 23:59)
TimeRecord {
  _id: "67235...",
  tipo: "salida",
  fecha: "2025-11-03T23:59:59.999Z",
  horasTrabajadas: 0.98,
  notas: "⚠️ SALIDA AUTOMÁTICA - Entrada olvidada detectada...",
  ...
}

// Horario (CREADO, completado)
WorkSchedule {
  _id: "67236...",
  fecha: "2025-11-03",
  turno: "tarde",
  estado: "completado",
  color: "#10b981",  // Verde (automático)
  notas: "🤖 Creado automáticamente..."
}
```

**Impacto en UX**:
- ✅ Empleado desbloqueado automáticamente
- ✅ Toast explicativo: "Se detectó entrada de Lunes. Se auto-cerró a 23:59"
- ✅ Horarios visibles en panel admin (color verde = automático)
- ✅ Auditoría completa de qué pasó

**Documentación Completa**: Ver `/docs/EDGE_CASE_MEDIANOCHE.md` (482 líneas) y `/docs/RESUMEN_EDGE_CASE.md`

**Testing**:
1. Crear entrada a las 23:00 (SIN fichar salida)
2. Esperar a que pase medianoche o forzar fecha en BD
3. Día siguiente, fichar entrada
4. Verificar: Ambos registros creados, horario visible, Toast mostrado

## Sistema de Slideshow de Instalaciones


**Implementado**: Slideshow full-width con auto-play y navegación manual en sección "Instalaciones".

**Ubicación**: `/frontend/public/index.html` - Entre secciones "¿Qué Ofrecemos?" y "Horarios"

**Características**:
1. **8 slides** con imágenes de las instalaciones del parque
2. **Auto-play** cada 5 segundos con pausa al interactuar
3. **Navegación manual** con botones prev/next estilizados
4. **Indicadores de puntos** (dots) con estado activo
5. **Soporte táctil** (swipe) para dispositivos móviles
6. **Texto superpuesto** con gradiente oscuro para legibilidad
7. **Altura responsive**: 550px móvil, 800px desktop (controlado por CSS custom)
8. **Lazy loading progresivo** para optimización
9. **Animación slideIn** suave (0.8s ease-in-out)
10. **Pausa automática** al perder foco o cambiar de pestaña

**Estructura de Archivos**:
- **Imágenes**: `/frontend/public/assets/images/IMG_*.jpg` (8 archivos)
- **Originales**: `/frontend/public/assets/images/originales/` (backup sin comprimir)
- **CSS**: Dentro de `<style>` en `<head>` del index.html (líneas ~314-463)
- **HTML**: Sección `#instalaciones` (líneas ~937-1045)
- **JavaScript**: IIFE antes de `</body>` (líneas ~1420-1595)

**Optimizaciones de Carga**:
1. **Preload** de primera imagen en `<head>` (carga instantánea)
2. **Prefetch** de siguientes 2 imágenes (anticipación)
3. **Lazy loading progresivo** de imágenes cercanas al slide actual
4. **Compresión de imágenes** al 85% de calidad (reducción del 76%)
5. **Placeholder con gradiente** mientras carga
6. **Fade-in smooth** (opacity transition 0.5s)

**Rendimiento**:
- Tamaño original total: 26.61 MB
- Tamaño comprimido total: 6.36 MB
- Reducción: 76.1% (ahorro de 20.25 MB)
- Máximo ancho: 1920px (optimizado para HD)

**Contenido de Slides**:
1. IMG_7089.jpg - "Área de Trampolines" - "Más de 50 trampolines interconectados"
2. IMG_7097.jpg - "Zona de Juegos" - "Espacios seguros para todas las edades"
3. IMG_7101.jpg - "Área Infantil" - "Diseñada para los más pequeños"
4. IMG_7102.jpg - "Zona de Actividades" - "Variedad de juegos y desafíos"
5. IMG_7103.jpg - "Pista de Obstáculos" - "Pon a prueba tu agilidad"
6. IMG_7108.jpg - "Zona de Saltos Libre" - "Salta sin límites"
7. IMG_7109.jpg - "Área de Descanso" - "Zonas cómodas para recuperar energías"
8. IMG_7110.jpg - "Nuestras Instalaciones" - "Un parque completo"

**CSS Classes Creadas**:
- `.instalaciones-slideshow` - Contenedor principal
- `.instalaciones-slide` - Slide individual
- `.instalaciones-slide.active` - Slide activo con animación
- `.instalaciones-slide img.loaded` - Imagen cargada con opacity 1
- `.instalaciones-slide.image-loaded::before` - Oculta placeholder
- `.instalaciones-overlay` - Gradiente para texto legible
- `.instalaciones-prev/next` - Botones de navegación
- `.instalaciones-dots` - Contenedor de indicadores
- `.instalaciones-dot` - Indicador individual
- `.instalaciones-dot.active` - Indicador activo
- `#instalaciones` - Altura controlada por CSS (no Tailwind)

**JavaScript Functions**:
- `showSlide(index)` - Muestra slide específico y precarga cercanos
- `nextSlide()` - Navega al siguiente
- `prevSlide()` - Navega al anterior
- `startAutoPlay()` - Inicia intervalo de 5 segundos
- `stopAutoPlay()` - Detiene intervalo
- `loadImage(img, slideElement)` - Carga progresiva con fade-in
- `preloadNearbyImages(index)` - Precarga 4 imágenes cercanas
- `handleSwipe()` - Detecta gestos táctiles

**Event Listeners**:
- Click en botones prev/next (reinicia auto-play)
- Click en dots (salta a slide específico)
- Hover en slideshow (pausa auto-play)
- Mouse leave (reanuda auto-play)
- Touch start/end (swipe gestures)
- Visibility change (pausa al cambiar pestaña)

**Navegación**:
- Header desktop: Link "Instalaciones" entre "Servicios" y "Horarios" (línea ~461)
- Header mobile: Link "INSTALACIONES" en navegación scrollable (línea ~490)

**Script de Compresión**:
- Ubicación: `/scripts/compress-images.ps1`
- Uso: `.\scripts\compress-images.ps1`
- Función: Comprime imágenes a 1920px máx, calidad 85%, guarda originales en backup
- Tecnología: System.Drawing de .NET con HighQualityBicubic interpolation

**Importante - Altura Responsive**:
- **NO usar** clases Tailwind `h-[Npx]` o `lg:h-[Npx]` (no funcionan con CDN)
- **SIEMPRE usar** CSS custom con media queries:
  ```css
  #instalaciones {
    height: 550px;
  }
  
  @media (min-width: 1024px) {
    #instalaciones {
      height: 800px;
    }
  }
  ```

**Problema Común - Modo Development en Ngrok**:
Si el slideshow o la página en general muestra errores CORS al acceder vía Ngrok:
1. Verificar `/frontend/src/js/modules/config.js`
2. Cambiar `const MODE = 'development'` a `'production'`
3. Esto hace que la app use la URL de Ngrok en vez de localhost
4. Recargar página con Ctrl + Shift + R

## Sincronización Bidireccional Iconos ↔ Slideshow

**Implementado**: Sistema de vinculación interactiva entre iconos de servicios y slideshow de instalaciones.

**Funcionalidad:**

### **1. Click en Icono → Navega al Slide**
- Al hacer click en un icono de "¿Qué Ofrecemos?", se navega automáticamente al slide correspondiente
- Scroll suave a la sección de instalaciones con `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- Delay coordinado de 600ms para permitir que el scroll termine antes de cambiar el slide
- Se reinicia el auto-play timer tras la interacción

### **2. Slide Activo → Ilumina Icono**
- Cuando un slide está activo en el slideshow, su icono correspondiente se ilumina automáticamente
- Efecto visual:
  - Glow naranja suave: `box-shadow: 0 0 25px rgba(249, 115, 22, 0.6), 0 0 40px rgba(249, 115, 22, 0.3)`
  - Scale aumentado a 1.15x
  - **Ya no cambia el color de fondo** (el fondo permanece transparente al estar activo)
- Se actualiza en cada cambio de slide (manual, auto-play, swipe, dots)

### **3. Mapeo de Servicios a Slides**
```javascript
// Atributo data-slide en cada icono
🏀 Trampolines profesionales → data-slide="0" → Slide 0 (Área de Trampolines)
🥷 Zona Ninja Warrior      → data-slide="4" → Slide 4 (Pista de Obstáculos)
🌊 Piscina de foam         → data-slide="1" → Slide 1 (Zona de Juegos)
👶 Área infantil segura    → data-slide="2" → Slide 2 (Área Infantil)
👨‍🏫 Monitores cualificados  → data-slide="null" → Sin vinculación (servicio)
🎂 Salas de cumpleaños     → data-slide="null" → Sin vinculación (servicio)
```

### **4. CSS Implementado**
```css
/* Clase base para iconos */
.servicio-icon {
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Estado activo cuando slide correspondiente está visible */
.servicio-icon.active {
  box-shadow: 0 0 25px rgba(249, 115, 22, 0.6), 0 0 40px rgba(249, 115, 22, 0.3) !important;
  transform: scale(1.15) !important;
  /* background eliminado para que no cambie el color de fondo al estar activo */
}

/* Hover sutil */
.servicio-icon:hover {
  transform: scale(1.1);
  cursor: pointer;
}
```

### **5. JavaScript Implementado**

**Función principal:**
```javascript
function updateActiveIcons() {
  // Limpiar todos los iconos
  servicioIcons.forEach(icon => icon.classList.remove('active'));
  
  // Activar el icono correspondiente al slide actual
  servicioIcons.forEach(icon => {
    const linkedSlide = icon.getAttribute('data-slide');
    if (linkedSlide !== 'null' && parseInt(linkedSlide) === currentSlide) {
      icon.classList.add('active');
    }
  });
}
```

**Event listeners:**
```javascript
// Click en icono navega al slide
servicioIcons.forEach(icon => {
  icon.addEventListener('click', () => {
    const linkedSlide = icon.getAttribute('data-slide');
    if (linkedSlide !== 'null') {
      const slideIndex = parseInt(linkedSlide);
      
      // Scroll suave
      instalacionesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Cambiar slide con delay
      setTimeout(() => {
        showSlide(slideIndex);
        stopAutoPlay();
        startAutoPlay();
      }, 600);
    }
  });
});
```

**Integración con showSlide:**
```javascript
function showSlide(index) {
  // ... código existente ...
  
  // Actualizar iconos activos
  updateActiveIcons();
  
  // Precargar imágenes cercanas
  preloadNearbyImages(currentSlide);
}
```

### **6. Diseño de Iconos**

**Tamaños:**
- Móvil: `w-16 h-16` (64px)
- Desktop: `w-20 h-20` (80px)
- Emoji: `text-3xl lg:text-4xl`

**Layout:**
- Flexbox con `flex-wrap` para responsividad
- `justify-center` para centrado horizontal
- `items-start` para alineación superior
- Ancho fijo: `width: 100px` por item (consistencia)
- `flex-shrink-0` en iconos para evitar compresión

**Estructura HTML:**
```html
<div class="... flex flex-wrap justify-center items-start ...">
  <div class="... flex flex-col items-center" style="width: 100px;">
    <div class="servicio-icon ... flex-shrink-0" data-slide="0">
      <span>🏀</span>
    </div>
    <p>Trampolines profesionales</p>
  </div>
</div>
```

### **7. Buenas Prácticas Aplicadas**
- ✅ IIFE para scope isolation en slideshow
- ✅ Event delegation donde aplica
- ✅ Transiciones CSS suaves con cubic-bezier
- ✅ Código autodocumentado con nombres descriptivos
- ✅ Sin dependencias externas
- ✅ Performance: `updateActiveIcons()` solo actualiza cuando necesario
- ✅ Accesibilidad: Cursor pointer y estados hover claros

**Notas de Implementación**:
- Los iconos sin vinculación (`data-slide="null"`) no son clickeables para slideshow
- El delay de 600ms en el click está calibrado para el scroll suave
- La función `updateActiveIcons()` se llama en la inicialización para activar el primer icono
- El sistema es totalmente independiente del auto-play del slideshow

## Sistema de Cartas Apiladas Móvil Sincronizado

**Implementado**: Stack de cartas interactivo en móvil que se sincroniza con el slideshow de instalaciones (octubre 2025).

**Características Principales:**

### **1. Layout Dual Responsive**
- **Móvil (<1024px)**: Stack de cartas apiladas con efecto 3D
- **Desktop (≥1024px)**: Grid tradicional de 9 iconos

### **2. Arquitectura del Stack**

**HTML**:
```html
<!-- Stack móvil (7 cartas) -->
<div id="servicios-stack" class="lg:hidden">
  <div class="servicio-card active" data-card-index="0">...</div>
  <div class="servicio-card" data-card-index="1">...</div>
  <!-- ... 7 cartas total -->
</div>

<!-- Grid desktop (9 iconos) -->
<div id="servicios-desktop" class="hidden lg:flex">...</div>
```

**CSS** (`/frontend/public/index.html` líneas ~500-555):
```css
@media (max-width: 1023px) {
  #servicios-stack {
    position: relative;
    height: 160px;
    width: 100%;
    max-width: 320px; /* Permite ver cartas laterales */
    margin: 0 auto;
    perspective: 1000px;
    overflow: visible;
  }
  
  .servicio-card {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 160px;
    cursor: pointer;
    pointer-events: auto; /* Todas las cartas clickeables */
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .servicio-card.active {
    opacity: 1;
    z-index: 10;
    transform: translateX(-50%) translateY(0) scale(1) rotateY(0deg);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
  
  /* Cartas laterales visibles con efecto 3D */
  .servicio-card.prev {
    opacity: 0.5;
    z-index: 9;
    transform: translateX(-140%) translateY(0) scale(0.85) rotateY(8deg);
  }
  
  .servicio-card.next {
    opacity: 0.5;
    z-index: 8;
    transform: translateX(40%) translateY(0) scale(0.85) rotateY(-8deg);
  }
  
  /* Hover solo en carta activa */
  .servicio-card.active:hover {
    transform: translateX(-50%) translateY(-5px) scale(1.02);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  }
}
```

**JavaScript** (`/frontend/public/index.html` líneas ~1645-1670):
```javascript
function updateCardStack() {
  if (window.innerWidth >= 1024 || !cards || cards.length === 0) return;
  
  cards.forEach((card) => {
    if (!card || !card.classList) return;
    
    const cardIndex = parseInt(card.getAttribute('data-card-index'));
    if (isNaN(cardIndex)) return;
    
    card.classList.remove('active', 'prev', 'next');
    
    if (cardIndex === currentSlide) {
      card.classList.add('active');
    } else if (cardIndex === (currentSlide - 1 + cards.length) % cards.length) {
      card.classList.add('prev');
    } else if (cardIndex === (currentSlide + 1) % cards.length) {
      card.classList.add('next');
    }
  });
}
```

### **3. Sincronización con Slideshow**

**Bidireccional**:
- Cambio de slide → Actualiza carta activa
- Click en carta → Cambia al slide correspondiente
- Swipe en stack → Navega slideshow

**Event Listeners** (líneas ~1840-1860):
```javascript
// Click en carta cambia slide
cards.forEach(card => {
  if (!card) return;
  
  card.addEventListener('click', () => {
    const cardIndex = parseInt(card.getAttribute('data-card-index'));
    if (isNaN(cardIndex)) return;
    
    showSlide(cardIndex);
    stopAutoPlay();
    startAutoPlay();
  });
});

// Swipe en stack controla slideshow
cardStack.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
  stopAutoPlay();
}, { passive: true });

cardStack.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe(); // Comparte lógica con slideshow
}, { passive: true });
```

### **4. Mapeo de Cartas a Slides**
```javascript
// 7 cartas = 7 slides activos del slideshow
0: ExploraKids (🧗)
1: Slam Zone (🏀)
2: SpiderWall (🧗‍♂️)
3: Tap Arena (⚡)
4: Freestyle Area (🤸)
5: Slide Rush (🎢)
6: Zona Ninja Warrior (🥷)

// NO incluidos: Monitores (👨‍🏫) y Cumpleaños (🎂) - sin slide vinculado
```

### **5. Controles Disponibles en Móvil**

**Stack de Cartas**:
- ✅ **Swipe izquierda/derecha**: Navega slides (threshold 50px)
- ✅ **Click en cualquier carta**: Salta a ese slide directamente
- ✅ **Hover en activa**: Efecto de levitación (translateY -5px, scale 1.02)

**Slideshow**:
- ✅ **Swipe en imágenes**: Navega independientemente
- ✅ **Botones prev/next**: Navegación manual
- ✅ **Dots indicadores**: Salto directo
- ✅ **Auto-play**: 5 segundos por slide

### **6. Validaciones de Seguridad**

**Implementadas para prevenir errores `classList undefined`**:
```javascript
// En updateCardStack()
if (!card || !card.classList) return;
if (isNaN(cardIndex)) return;

// En updateActiveIcons()
if (!servicioIcons || servicioIcons.length === 0) return;
servicioIcons.forEach(icon => {
  if (!icon || !icon.classList) return;
});

// En showSlide()
if (!slides || slides.length === 0) return;
slides.forEach(slide => {
  if (slide && slide.classList) {
    slide.classList.remove('active');
  }
});
```

### **7. Espaciado de Sección**

**Reducido en móvil** (línea ~1005):
```html
<section id="servicios" class="py-6 lg:py-20 bg-gray-50">
```
- Móvil: `py-6` (24px) - Compacto para stack
- Desktop: `lg:py-20` (80px) - Amplio para grid

### **8. Notas de Implementación**

**Importante**:
- `pointer-events: auto` en TODAS las cartas (no solo activa) para permitir click
- `overflow: visible` en contenedor para mostrar cartas laterales
- `max-width: 320px` calibrado para ver 3 cartas simultáneamente
- Transiciones de 0.6s sync con cambios de slide
- `z-index`: activa (10), prev (9), next (8), resto (1)

**Prevención de Bugs**:
- Llamar `updateCardStack()` en cada `showSlide()`
- Validar `card.classList` existe antes de modificar
- Usar `isNaN()` para verificar `cardIndex`
- Comprobar `window.innerWidth` para evitar ejecución en desktop

**Performance**:
- Transiciones CSS puras (no JavaScript animation)
- Event listeners con `{ passive: true }` donde aplica
- Validaciones tempranas con `return` para salir rápido

## Sistema de Navegación Sticky Header

**Implementado**: Scroll suave con compensación automática para header sticky (octubre 2025).

**Problema Resuelto**: Al hacer click en enlaces del header, las secciones quedaban ocultas detrás del header sticky.

### **1. Scroll Margin Top**

**CSS** (líneas ~24-40):
```css
html {
  scroll-behavior: smooth;
}

section {
  scroll-margin-top: 100px; /* Móvil: 80px header + 20px espacio */
}

@media (min-width: 1024px) {
  section {
    scroll-margin-top: 120px; /* Desktop: 96px header + 24px espacio */
  }
}
```

**Funcionamiento**:
- `scroll-margin-top` crea margen virtual por encima de cada `<section>`
- Al navegar a `#seccion`, el navegador calcula posición final incluyendo este margen
- Resultado: Título de sección visible debajo del header con espacio de respiro

**Medidas**:
- Header móvil: `h-20` (80px) → scroll-margin: 100px (20px extra)
- Header desktop: `h-24` (96px) → scroll-margin: 120px (24px extra)

### **2. Fix de Foco en Enlaces Móviles**

**Problema**: En táctiles, los enlaces del header quedaban resaltados tras click hasta tocar otro elemento.

**CSS** (líneas ~38-51):
```css
.lg\:hidden nav a {
  -webkit-tap-highlight-color: transparent; /* iOS Safari */
  -webkit-touch-callout: none; /* Prevenir menú contextual */
  -webkit-user-select: none; /* Prevenir selección */
  user-select: none;
}

.lg\:hidden nav a:focus {
  outline: none;
}
```

**JavaScript** (líneas ~1631-1655):
```javascript
const mobileNavLinks = document.querySelectorAll('.lg\\:hidden nav a[href^="#"]');

mobileNavLinks.forEach(link => {
  // Remover foco en click
  link.addEventListener('click', function() {
    setTimeout(() => {
      this.blur(); // Quita el foco del enlace
    }, 100);
  });
  
  // Remover foco en touchend (dispositivos táctiles)
  link.addEventListener('touchend', function() {
    setTimeout(() => {
      this.blur();
    }, 100);
  });
});
```

**Delay de 100ms**: Permite que el navegador procese el evento de navegación antes de remover el foco.

### **3. Beneficios**

- ✅ **Automático**: Funciona con todos los `href="#seccion"` sin configuración extra
- ✅ **CSS puro**: `scroll-margin-top` no requiere JavaScript
- ✅ **Responsive**: Se adapta al tamaño del header automáticamente
- ✅ **Smooth scroll**: Transiciones suaves incluidas
- ✅ **Sin resaltado**: Enlaces móviles no quedan "pegados" tras click
- ✅ **UX mejorado**: Títulos siempre visibles con espacio superior

## Sistema de Carousel de Tarifas (3 Dots)

**Implementado**: Carousel horizontal con navegación por posiciones fijas (octubre 2025).

**Arquitectura Simple**:
- **3 Dots Fijos**: Inicio (0%), Medio (50%), Fin (100%)
- **7 Tarjetas**: Scroll horizontal con snap opcional
- **Auto-scroll**: Cada 4 segundos entre posiciones
- **Detección Manual**: Actualiza dots según porcentaje de scroll

**Ubicación**: `/frontend/src/js/pages/main.js` - Función `initCarousel()` (líneas ~1-135)

**Lógica de Dots**:
```javascript
// Generación de 3 dots fijos
const dotPositions = ['start', 'middle', 'end'];

// Actualización basada en porcentaje de scroll
if (scrollLeft < scrollWidth * 0.33) {
  newDotIndex = 0; // start
} else if (scrollLeft < scrollWidth * 0.66) {
  newDotIndex = 1; // middle
} else {
  newDotIndex = 2; // end
}
```

**Navegación por Click**:
```javascript
function scrollToPosition(position) {
  const scrollWidth = cardContainer.scrollWidth - cardContainer.offsetWidth;
  let scrollTarget = 0;
  
  if (position === 'start') {
    scrollTarget = 0;
  } else if (position === 'middle') {
    scrollTarget = scrollWidth / 2;
  } else if (position === 'end') {
    scrollTarget = scrollWidth;
  }
  
  cardContainer.scrollTo({ left: scrollTarget, behavior: 'smooth' });
}
```

**Event Listeners**:
- **Click en dots**: Navega a posición específica
- **Scroll manual**: Actualiza dot activo con debounce de 150ms
- **Hover en contenedor**: Pausa auto-scroll permanentemente
- **Touch en móvil**: Pausa auto-scroll al detectar gesto

**Auto-scroll**:
- Intervalo de 4 segundos
- Se pausa al hover o touch del usuario
- Usa flag `userInteracted` para prevenir reinicio

**Características**:
- ✅ **Simplicidad**: Solo 3 estados posibles (inicio/medio/fin)
- ✅ **Robustez**: Sin cálculos complejos de proximidad
- ✅ **UX**: Dots siempre se actualizan correctamente
- ✅ **Performance**: Debounce para evitar updates excesivos
- ✅ **Responsive**: Funciona en mobile y desktop

**Importante**:
- NO usar más de 3 dots - la lógica está diseñada para posiciones fijas
- Si se necesitan más dots, hay que reimplementar con lógica de proximidad
- El auto-scroll se detiene permanentemente tras interacción del usuario

## Información de Horarios del Local

**Horarios Actuales** (actualizados octubre 2025):
- **Lunes a Jueves**: 17:00 - 22:00
- **Viernes a Domingo**: 10:00 - 22:00
- **Vísperas de Festivo y Festivos**: 10:00 - 22:00

**Implementación**: 
- ✅ **Horarios 100% estáticos** en HTML (no se cargan desde BD)
- ❌ Función `loadSchedules()` **eliminada completamente** de `main.js`
- ✅ **Tarifas 100% estáticas** en HTML (no se cargan desde BD)
- ❌ Función `loadTarifas()` **eliminada completamente** de `main.js`

**Ubicaciones en el código**:
1. **Horarios** - Sección "Horarios" (tabla): `/frontend/public/index.html` líneas ~1091-1103
2. **Horarios** - Sección "¿Dónde Estamos?" (footer): `/frontend/public/index.html` línea ~1350
3. **Tarifas** - Sección "Tarifas" (cards con carousel): `/frontend/public/index.html` líneas ~759-926

**Importante**: 
- Al actualizar horarios, verificar ambas ubicaciones para mantener consistencia
- NO intentar cargar horarios/tarifas desde la API - son estáticos por diseño
- Las tarifas tienen diseño complejo (múltiples precios, características, imágenes) mejor mantenido en HTML
- Si se necesita funcionalidad dinámica en el futuro, reimplementar funciones de carga

## Sistema de Calendario de Horarios Laborales

**Implementado**: Sistema completo de gestión de horarios con tres vistas (Lista, Semanal, Mensual) usando DateUtils local (noviembre 2025).

### **Arquitectura del Sistema**

**Módulo DateUtils Local** (`/frontend/src/js/modules/date-utils.js`):
- **166 líneas**, cero dependencias externas
- Todas las operaciones normalizan fechas a medianoche (00:00:00)
- Funciones principales:
  * `startOfWeek(date)` - Retorna lunes de la semana
  * `addDays(date, amount)` - Suma/resta días
  * `addWeeks(date, amount)` - Suma/resta semanas
  * `addMonths(date, amount)` - Suma/resta meses
  * `startOfMonth(date)` - Primer día del mes
  * `format(date, pattern)` - Formatea fecha (soporta 'yyyy-MM-dd', 'dddd', etc.)
  * `isSameDay(date1, date2)` - Compara días
  * `eachDayOfInterval({start, end})` - Array de fechas en intervalo

**CalendarState Class** (`/frontend/src/js/pages/admin.js` ~línea 3792):
```javascript
class CalendarState {
  constructor() {
    const today = new Date();
    this._currentWeekMonday = CalendarUtils.getMonday(today);
    this._currentMonth = today.getMonth(); // 0-11
    this._currentYear = today.getFullYear(); // YYYY
  }
  
  // Vista Semanal: usa DateUtils.addWeeks()
  goToNextWeek() / goToPreviousWeek()
  
  // Vista Mensual: aritmética simple (patrón index.html)
  goToNextMonth() / goToPreviousMonth()
}
```

**CalendarUtils Wrapper** (`/frontend/src/js/pages/admin.js` ~línea 3650):
- Capa de abstracción sobre DateUtils
- Funciones de logging para debugging
- Método crítico: `toISODate(date)` retorna 'YYYY-MM-DD' (NO ISO con timezone)

### **Tres Vistas de Calendario**

**1. Vista Lista** (`renderWorkSchedulesListView()`):
- Endpoint: `GET /api/work-schedules/all`
- Tabla tradicional con filtros de empleado, mes, año, estado
- Muestra rol de empleado con badges de color (monitor/cocina/barra)
- Datos: workSchedules array global

**2. Vista Semanal** (`renderWorkSchedulesWeekView()` ~línea 3888):
- Endpoint: `GET /api/work-schedules/weekly?fecha=YYYY-MM-DD`
- Grid de 7 días (Lunes-Domingo)
- **CRÍTICO**: Usar `CalendarUtils.toISODate(monday)` en URL, NO `toISOString()`
  * ✅ Correcto: `fecha=2025-11-04`
  * ❌ Incorrecto: `fecha=2025-11-04T00:00:00.000Z`
- Navegación: Botones prev/next, actualiza `calendarState`
- Datos: Fetch dinámico por semana

**3. Vista Mensual** (`renderWorkSchedulesMonthView()` ~línea 4008):
- Endpoint: `GET /api/work-schedules/monthly?mes=N&anio=YYYY`
- Grid calendario estilo mes (7 columnas x N filas)
- Usa números simples: `mes` (1-12), `anio` (YYYY)
- Navegación: Aritmética pura (no DateUtils.addMonths)
- Estadísticas: Total horarios, horas, empleados activos, días con horarios
- Datos: Fetch dinámico por mes

### **Sistema de Filtros**

**IDs de Elementos HTML** (CRÍTICO - evitar duplicados):
- **Horarios Laborales**: `filterEmployeeSchedules` (línea 1927 admin.html)
- **Control Horario**: `filterEmployee` (línea 1728 admin.html)
- **Problema anterior**: Ambos usaban `filterEmployee` → `getElementById()` devolvía el primero
- **Solución**: Renombrar a `filterEmployeeSchedules` para Horarios Laborales

**Referencias en JavaScript** (todas actualizadas a `filterEmployeeSchedules`):
- `loadEmpleadosForSchedules()` - Línea 3416
- `loadWorkSchedules()` - Línea 3479
- `renderWorkSchedulesWeekView()` - Línea 3924
- `renderWorkSchedulesMonthView()` - Línea 4039
- `btnClearFilters` listener - Línea 4490

### **Actualización Automática de Vistas**

**Sistema de Detección de Vista Actual** (`currentWorkSchedulesView`):
```javascript
// En createWorkSchedule(), updateWorkSchedule(), deleteWorkSchedule()
if (currentWorkSchedulesView === 'week') {
  await renderWorkSchedulesWeekView();
} else if (currentWorkSchedulesView === 'month') {
  await renderWorkSchedulesMonthView();
} else {
  await loadWorkSchedules(); // lista
}
```

**Función de Render Actual** (`renderCurrentWorkSchedulesView()`):
- Determina qué vista mostrar según `currentWorkSchedulesView`
- Llamada en: `switchWorkSchedulesView()`, `loadWorkSchedules()`

### **Navegación de Calendario**

**Semanal** (usa DateUtils):
```javascript
// Botones prev/next
btnPrevWeek.addEventListener('click', () => {
  calendarState.goToPreviousWeek(); // Usa DateUtils.addWeeks(-1)
  renderWorkSchedulesWeekView();
});
```

**Mensual** (aritmética simple):
```javascript
// Patrón simplificado del calendario de index.html
goToNextMonth() {
  this._currentMonth++;
  if (this._currentMonth > 11) {
    this._currentMonth = 0;
    this._currentYear++;
  }
}
```

### **Formato de Fechas - CRÍTICO**

**Problema Común**: Vista semanal no muestra horarios tras crear
**Causa**: Usar `date.toISOString()` envía formato con timezone
**Solución**: SIEMPRE usar `CalendarUtils.toISODate(date)` o `DateUtils.format(date, 'yyyy-MM-dd')`

```javascript
// ❌ INCORRECTO
const monday = new Date();
const url = `${API_URL}/work-schedules/weekly?fecha=${monday.toISOString()}`;
// Resultado: fecha=2025-11-04T00:00:00.000Z (backend no encuentra)

// ✅ CORRECTO
const monday = calendarState.getCurrentWeekMonday();
const mondayISO = CalendarUtils.toISODate(monday);
const url = `${API_URL}/work-schedules/weekly?fecha=${mondayISO}`;
// Resultado: fecha=2025-11-04 (backend encuentra correctamente)
```

### **Event Listeners - Prevención de Duplicación**

**Guard Flag Pattern**:
```javascript
let workSchedulesListenersConfigured = false;

function setupWorkSchedulesEventListeners() {
  if (workSchedulesListenersConfigured) {
    console.log('⚠️ Event listeners ya configurados, saltando...');
    return;
  }
  
  // ... configurar listeners ...
  
  workSchedulesListenersConfigured = true;
}
```

### **Logging de Calendario (Debugging)**

**Logger con Flag de Activación**:
```javascript
const CALENDAR_DEBUG = true; // Cambiar a false para desactivar

function logCalendar(label, data) {
  if (!CALENDAR_DEBUG) return;
  console.log(`%c[CALENDAR] ${label}`, 'color: #FF6B35; font-weight: bold;', data);
}
```

**Logs Críticos**:
- Construcción de URL de API
- Fechas calculadas (monday, sunday)
- Respuestas del backend
- Mapeo de datos (horariosMap)

### **Rol de Empleado con Colores**

**Función getRolColor()** (~línea 3600):
```javascript
function getRolColor(rolEmpleado) {
  const roleColors = {
    'monitor': { bg: 'bg-blue-100', hex: '#dbeafe' },
    'cocina': { bg: 'bg-orange-100', hex: '#fed7aa' },
    'barra': { bg: 'bg-purple-100', hex: '#e9d5ff' }
  };
  return roleColors[rolEmpleado] || { bg: 'bg-gray-100', hex: '#f3f4f6' };
}
```

**Uso en Vistas**:
- Vista Lista: Badge con rol (sin emoji)
- Vista Semanal: Border color según rol
- Vista Mensual: Background color según rol

### **Problemas Conocidos y Soluciones**

**1. Vista Semanal No Actualiza Tras Crear Horario**
- **Causa**: `loadWorkSchedules()` usa endpoint `/all`, no `/weekly`
- **Solución**: Detección de vista actual en `createWorkSchedule()` (línea 4175)

**2. Filtro de Empleados Vacío**
- **Causa**: ID duplicado `filterEmployee` en dos secciones
- **Solución**: Renombrar a `filterEmployeeSchedules` (commit daa48fe)

**3. Navegación Mensual con Saltos Raros**
- **Causa**: Event listeners duplicados
- **Solución**: Guard flag `workSchedulesListenersConfigured`

**4. Backend No Encuentra Horarios con Fecha Correcta**
- **Causa**: Formato ISO con timezone (`toISOString()`)
- **Solución**: Usar `toISODate()` que retorna solo 'YYYY-MM-DD'

### **Cache de Archivos**

**Versión Actual**: `v=87` (admin.html línea 2596)
**Incrementar tras**: Cambios en admin.js, date-utils.js

**Hard Refresh Obligatorio**:
- Ctrl + Shift + R (Windows)
- Cmd + Shift + R (Mac)
- Necesario tras cambios en lógica de calendario

### **Estructura de Datos del Backend**

**Respuesta Semanal**:
```javascript
{
  success: true,
  data: {
    dias: [
      {
        fecha: "2025-11-03",
        horarios: [
          {
            empleado: { nombre, rolEmpleado },
            horaInicio: "17:00",
            horaFin: "22:00",
            turno: "tarde",
            horasTotales: 5,
            color: "#f97316"
          }
        ]
      }
    ]
  }
}
```

**Respuesta Mensual**:
```javascript
{
  success: true,
  data: {
    horarios: [...],
    resumen: {
      totalHorarios: 20,
      totalHoras: 100.5,
      empleadosActivos: 3,
      diasConHorarios: 15
    }
  }
}
```

## Portal de Empleados - Sistema de Horarios Asignados

**Implementado**: Sistema de visualización de horarios personales para empleados (noviembre 2025).

### **Descripción General**

El portal de empleados (`/frontend/public/employee.html`) incluye una sección "Mis Horarios Asignados" que permite a cada empleado ver únicamente sus propios horarios asignados.

### **Características Principales**

**1. Dos Vistas de Calendario**:
- **Vista Semanal** (por defecto):
  * Grid de 7 días (Lunes-Domingo)
  * Navegación prev/next con botones
  * Muestra turno, horario (HH:MM - HH:MM), horas totales, notas
  * Resalta el día actual con ring naranja
  * Horarios con colores personalizados por turno
  
- **Vista Mensual**:
  * Calendario completo del mes (grid 7 columnas x N filas)
  * Navegación prev/next mes
  * Máximo 2 turnos visibles por día + contador si hay más
  * **Panel de Estadísticas**:
    - Turnos Asignados (total del mes)
    - Horas Totales (suma de horasTotales)
    - Días Trabajados (días únicos con horarios)
    - Promedio/Día (horas totales / días trabajados)

### **Arquitectura del Sistema**

**Frontend** (`/frontend/src/js/pages/employee.js`):
```javascript
// Clases y utilidades
CalendarUtilsEmployee      // Wrapper sobre DateUtils local
CalendarStateEmployee      // Gestión de estado (semana/mes actual)
getRolColorEmployee()      // Sistema de colores por rol (preparado)

// Vistas
renderEmployeeWeekView()   // Renderiza vista semanal
renderEmployeeMonthView()  // Renderiza vista mensual + estadísticas
switchEmployeeScheduleView(view)  // Cambia entre vistas
renderCurrentEmployeeScheduleView() // Renderiza vista actual

// Inicialización
initEmployeeSchedules()    // Configura event listeners y carga inicial
```

**Backend** (endpoints existentes):
```javascript
GET /work-schedules/weekly?fecha=YYYY-MM-DD&empleadoId=ID
GET /work-schedules/monthly?mes=N&anio=YYYY&empleadoId=ID
```

### **Seguridad - CRÍTICO**

**Filtrado Automático por Empleado**:
```javascript
// Backend: workScheduleController.js
if (req.user.rol === 'empleado') {
  filter.empleado = req.user._id;  // SIEMPRE usa el ID del token
} else if (empleadoId) {
  filter.empleado = empleadoId;     // Solo si es admin
}
```

**Reglas de Seguridad**:
- ✅ Empleados **SOLO** ven sus propios horarios (filtrado en backend)
- ✅ El `empleadoId` enviado desde el frontend se **ignora** si `rol='empleado'`
- ✅ El backend siempre usa `req.user._id` del token JWT
- ❌ NO es posible que un empleado vea horarios de otros

### **Estructura de Datos - Resumen Mensual**

**Backend retorna** (`WorkSchedule.getResumenMensual()`):
```javascript
{
  mes: 11,
  anio: 2025,
  totalHoras: 11.0,           // Suma de horasTotales
  diasTrabajo: 3,             // Días únicos trabajados
  turnosProgramados: 2,       // Total de turnos asignados
  estadisticas: {
    programados: 1,
    confirmados: 1,
    completados: 0
  }
}
```

**Frontend debe usar**:
- `r.turnosProgramados` → Total de turnos (NO `totalHorarios`)
- `r.diasTrabajo` → Días trabajados (NO `diasConHorarios`)
- `r.totalHoras` → Horas totales del mes
- Promedio: `totalHoras / diasTrabajo`

**⚠️ IMPORTANTE**: NO usar `totalHorarios` ni `diasConHorarios` - esas propiedades **no existen** en el backend.

### **Ubicación en la Página**

```
Portal del Empleado (employee.html)
├── Header (nombre empleado + logout)
├── Reloj y Estado Actual
├── Botones de Fichar (Entrada/Salida)
├── Resumen de Hoy
├── ✨ MIS HORARIOS ASIGNADOS ✨
│   ├── Botones de Vista (Semanal/Mensual)
│   ├── Vista Semanal (grid 7 días)
│   │   ├── Navegación prev/next
│   │   └── Horarios del día
│   └── Vista Mensual (calendario completo)
│       ├── Navegación prev/next
│       ├── Grid calendario
│       └── Panel de estadísticas
└── Historial Reciente (registros de entrada/salida)
```

### **Event Listeners**

```javascript
// Cambio de vista
btnViewWeekEmployee.click → switchEmployeeScheduleView('week')
btnViewMonthEmployee.click → switchEmployeeScheduleView('month')

// Navegación semanal
btnPrevWeekEmployee.click → calendarStateEmployee.goToPreviousWeek()
btnNextWeekEmployee.click → calendarStateEmployee.goToNextWeek()

// Navegación mensual
btnPrevMonthEmployee.click → calendarStateEmployee.goToPreviousMonth()
btnNextMonthEmployee.click → calendarStateEmployee.goToNextMonth()
```

### **Inicialización**

```javascript
// En DOMContentLoaded de employee.js
document.addEventListener('DOMContentLoaded', () => {
  // ... código existente ...
  
  // Inicializar horarios con delay
  setTimeout(() => {
    initEmployeeSchedules();  // Configura listeners y carga vista semanal
  }, 500);
});
```

**Delay de 500ms**: Asegura que el DOM esté completamente cargado y el módulo DateUtils esté disponible.

### **Estilos y UI**

**Colores Corporativos**:
- Primary: Naranja (#f97316, `orange-500`)
- Activo: Día actual con `ring-2 ring-orange-500`
- Horarios: `bg-orange-50 border-orange-200`

**Responsive**:
- **Móvil** (<768px): Grid semanal en columna (`grid-cols-1`)
- **Tablet** (768px-1024px): Grid semanal 2 columnas (`sm:grid-cols-2`)
- **Desktop** (>1024px): Grid semanal 7 columnas (`md:grid-cols-7`)

**Iconos**:
- Header sección: 📅 SVG calendario
- Botón semanal: 📅 emoji
- Botón mensual: 📆 emoji

### **Archivos Modificados**

1. **`employee.html`**:
   - Nueva sección "Mis Horarios Asignados" (~60 líneas HTML)
   - Import de `date-utils.js` en `<head>`
   - Cache: `v=3`

2. **`employee.js`**:
   - ~400 líneas nuevas (sistema completo de calendario)
   - Utilidades: CalendarUtilsEmployee, CalendarStateEmployee
   - Vistas: renderEmployeeWeekView, renderEmployeeMonthView
   - Event listeners y navegación

### **Dependencias**

- **DateUtils** (`/frontend/src/js/modules/date-utils.js`): Módulo local para manejo de fechas
- **Auth** (`/frontend/src/js/modules/auth.js`): Para obtener usuario actual y authFetch
- **Config** (`/frontend/src/js/modules/config.js`): Para API_URL

### **Testing**

**Flujo de Prueba**:
1. Login como empleado (rol='empleado')
2. Verificar que se carga la vista semanal por defecto
3. Cambiar a vista mensual y verificar estadísticas
4. Navegar semanas/meses con botones prev/next
5. Verificar que solo se muestran horarios del empleado actual
6. Intentar con otro empleado y confirmar separación de datos

**Casos de Uso**:
- Empleado sin horarios asignados → Muestra "Sin horarios"
- Empleado con 1 horario → Estadísticas correctas
- Empleado con múltiples horarios en un día → Muestra todos
- Día actual → Resaltado con borde naranja

### **Problemas Conocidos y Soluciones**

**1. Estadísticas Muestran Ceros**
- **Causa**: Frontend usa `totalHorarios` en vez de `turnosProgramados`
- **Solución**: Usar nombres correctos del backend (commit 022faf7)

**2. DateUtils No Cargado**
- **Causa**: Script ejecuta antes de que DateUtils esté disponible
- **Solución**: setTimeout de 500ms en initEmployeeSchedules()

**3. Vista No Se Actualiza**
- **Causa**: Event listeners no configurados correctamente
- **Solución**: Verificar que initEmployeeSchedules() se llame

### **Mejoras Futuras Potenciales**

- [ ] Agregar vista de lista (similar al panel admin)
- [ ] Exportar horarios del mes a PDF
- [ ] Notificaciones de próximos turnos
- [ ] Solicitar cambios de horario
- [ ] Ver historial de horarios pasados (más de 1 mes)

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

## Cartas de Resumen del Empleado - Nuevas Funcionalidades (Noviembre 2025)

### **Tarjeta: Horas de Esta Semana** 📅 (NUEVA)

**Ubicación**: Portal del Empleado → Resumen de Hoy (6 tarjetas)

**Características**:
- Color: Cyan (`bg-cyan-100`, `text-cyan-800`)
- Posición: Entre "Horas Asignadas Hoy" (rosa) y "Este Mes" (naranja)
- Cálculo: Suma de horas trabajadas desde lunes a domingo de la semana actual
- Actualización: Al fichar entrada/salida (parte de `cargarDatos()`)
- Elemento HTML: `<p id="horasSemana">--h</p>`

**Implementación en Frontend**:

```javascript
// Función: cargarResumenSemanal() (~70 líneas)
async function cargarResumenSemanal() {
  // 1. Calcula lunes (inicio semana) y domingo (fin semana)
  // 2. Llama a /time-records/mis-registros?fechaInicio=X&fechaFin=Y&limit=200
  // 3. Suma horasTrabajadas de registros tipo 'salida'
  // 4. Actualiza elemento horasSemana con resultado formateado (.toFixed(2))
  // 5. Maneja error: muestra "--h" si falla
}
```

**Validaciones de Seguridad**:
- ✅ Límite aumentado a 200 registros (previene pérdida en semanas activas)
- ✅ Valida que `data.data.length > 0` antes de procesar
- ✅ Log explicativo si no hay registros: "⚠️ Sin registros de trabajo esta semana"
- ✅ Timestamp incluido en debug logging para sincronización

**Commit**: `1da2d11` - Agregada funcionalidad con validaciones de seguridad

---

### **Botones de Filtro Rápido en Panel Admin - Horarios Laborales** (NUEVA)

**Ubicación**: Panel Admin → Horarios Laborales → Entre filtros y selector de vista

**Dos Botones Nuevos**:

1. **Botón "Esta Semana"** 📅
   - ID: `btnFilterWeek`
   - Estilos: `bg-cyan-100 border-2 border-cyan-300 text-cyan-800`
   - Función: `calendarState.goToToday()` + cambiar a vista semanal
   - Resultado: Muestra la semana actual (Lunes-Domingo)
   - Log: `📅 Filtro: Esta Semana activado`

2. **Botón "Este Mes"** 📆
   - ID: `btnFilterMonth`
   - Estilos: `bg-orange-100 border-2 border-orange-300 text-orange-800`
   - Función: `calendarState.goToToday()` + cambiar a vista mensual
   - Resultado: Muestra el mes actual con estadísticas
   - Log: `📆 Filtro: Este Mes activado`

**Flujo UX**:
```
Admin hace click en "Esta Semana"
  ↓
Se resetea el estado del calendario a hoy
  ↓
Se cambia automáticamente a vista semanal
  ↓
Se renderiza la semana actual con sus horarios
  ↓
Admin puede navegar libremente con prev/next
```

**Implementación en HTML** (`/frontend/public/admin.html`):
```html
<!-- Filtros rápidos -->
<div class="flex gap-2 mb-4">
  <button id="btnFilterWeek" class="flex-1 bg-cyan-100 hover:bg-cyan-200 text-cyan-800 px-4 py-2 rounded-lg font-semibold transition-colors border-2 border-cyan-300">
    📅 Esta Semana
  </button>
  <button id="btnFilterMonth" class="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-2 rounded-lg font-semibold transition-colors border-2 border-orange-300">
    📆 Este Mes
  </button>
</div>
```

**Implementación en JavaScript** (`/frontend/src/js/pages/admin.js`):
```javascript
// En setupWorkSchedulesEventListeners() ~línea 4570
const btnFilterWeek = document.getElementById('btnFilterWeek');
if (btnFilterWeek) {
  btnFilterWeek.addEventListener('click', () => {
    calendarState.goToToday();
    switchWorkSchedulesView('week');
    renderWorkSchedulesWeekView();
    console.log('📅 Filtro: Esta Semana activado');
  });
}

const btnFilterMonth = document.getElementById('btnFilterMonth');
if (btnFilterMonth) {
  btnFilterMonth.addEventListener('click', () => {
    calendarState.goToToday();
    switchWorkSchedulesView('month');
    renderWorkSchedulesMonthView();
    console.log('📆 Filtro: Este Mes activado');
  });
}
```

**Beneficios**:
- ✅ Acceso rápido a vistas más frecuentes
- ✅ Una sola acción vs múltiples clicks
- ✅ Mejor UX para admin ocupado
- ✅ Colores coherentes con sistema de diseño
- ✅ Debug logging para troubleshooting

**Commit**: `1e44dad` - Agregados botones de filtro rápido

---

## Cache Versions (Noviembre 2025)

**Actualizaciones recientes**:
- `employee.html`: v=8 → v=9 (agregada tarjeta "Esta Semana")
- `employee.js`: v=8 → v=9 (agregada función `cargarResumenSemanal()`)
- `admin.html`: v=88 → v=89 (agregados botones de filtro rápido)
- `admin.js`: v=88 → v=89 (agregados event listeners)

**Importante**: Siempre incrementar versión tras cambios en:
- Modificaciones de HTML (nueva estructura)
- Cambios de lógica JavaScript
- Actualizaciones de estilos CSS significativas
- Correcciones críticas de bugs
