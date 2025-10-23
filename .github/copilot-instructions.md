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

## Archivos Clave para Contexto

- **Arquitectura**: `/docs/ESTRUCTURA_PROYECTO.md` - Explicación completa de estructura de archivos
- **Seguridad**: `/backend/SECURITY.md` - Guía detallada de implementación de seguridad
- **Documentación API**: `/backend/API_DOCUMENTATION.md` - Referencia completa de endpoints
- **Inicio Rápido**: `/docs/INICIO_RAPIDO.md` - Guía de configuración en 3 pasos
- **Roles de Admin**: `/docs/GESTION_ADMINS.md` - Sistema de roles y permisos

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
