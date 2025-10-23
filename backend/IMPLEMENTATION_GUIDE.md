# 🛠️ GUÍA DE IMPLEMENTACIÓN - MEJORAS DE SEGURIDAD
## Partyventura Backend - Fase 2

**Fecha:** 19 de octubre de 2025  
**Prioridad:** ALTA  
**Tiempo estimado:** 2-3 horas

---

## 📦 ARCHIVOS CREADOS

Se han creado 3 nuevos archivos de middleware listos para usar:

1. **`middleware/validateObjectId.js`** - Validación de IDs de MongoDB
2. **`middleware/validateParams.js`** - Validación de query parameters
3. **`middleware/specificRateLimiters.js`** - Rate limiters específicos

---

## 🔧 PASO 1: Aplicar Validación de ObjectId

### 1.1 Actualizar `routes/schedules.js`

```javascript
const { validateObjectId } = require('../middleware/validateObjectId');

// Aplicar a rutas con :id
router.get('/:id', validateObjectId(), scheduleController.getScheduleById);
router.put('/:id', validateObjectId(), scheduleController.updateSchedule);
router.delete('/:id', validateObjectId(), scheduleController.deleteSchedule);
router.patch('/:id/toggle-status', validateObjectId(), scheduleController.toggleScheduleStatus);
```

### 1.2 Actualizar `routes/events.js`

```javascript
const { validateObjectId } = require('../middleware/validateObjectId');

// Aplicar a rutas con :id
router.get('/:id', validateObjectId(), eventController.getEventById);
router.put('/:id', validateObjectId(), eventController.updateEvent);
router.delete('/:id', validateObjectId(), eventController.deleteEvent);
router.patch('/:id/status', validateObjectId(), eventController.updateEventStatus);
```

### 1.3 Actualizar `routes/gallery.js`

```javascript
const { validateObjectId } = require('../middleware/validateObjectId');

// Aplicar a rutas con :id
router.get('/:id', validateObjectId(), galleryController.getImageById);
router.put('/:id', validateObjectId(), galleryController.updateImage);
router.delete('/:id', validateObjectId(), galleryController.deleteImage);
router.patch('/:id/toggle-status', validateObjectId(), galleryController.toggleImageStatus);
router.patch('/:id/toggle-featured', validateObjectId(), galleryController.toggleFeatured);
```

---

## 🔧 PASO 2: Aplicar Validación de Query Parameters

### 2.1 Actualizar `routes/schedules.js`

```javascript
const { validateLimit, validatePage, validateEnum } = require('../middleware/validateParams');

// Rutas públicas con validación
router.get('/public', 
  validateLimit(20, 50),
  validateEnum('type', ['horario', 'tarifa'], false),
  scheduleController.getPublicSchedules
);

// Rutas protegidas con validación
router.get('/',
  validateLimit(50, 100),
  validatePage,
  validateEnum('type', ['horario', 'tarifa'], false),
  scheduleController.getSchedules
);
```

### 2.2 Actualizar `routes/events.js`

```javascript
const { 
  validateLimit, 
  validatePage, 
  validateEnum, 
  validateDateParams,
  validateDateRange 
} = require('../middleware/validateParams');

// Rutas públicas con validación
router.get('/public',
  validateLimit(20, 50),
  validateEnum('eventType', ['fiesta', 'cumpleaños', 'corporativo', 'boda', 'otro'], false),
  validateDateParams('startDate', 'endDate'),
  eventController.getPublicEvents
);

router.get('/calendar',
  validateDateParams('start', 'end'),
  validateDateRange('start', 'end'),
  eventController.getCalendarEvents
);

// Rutas protegidas con validación
router.get('/',
  validateLimit(50, 100),
  validatePage,
  validateEnum('status', ['programado', 'en-curso', 'completado', 'cancelado'], false),
  validateEnum('eventType', ['fiesta', 'cumpleaños', 'corporativo', 'boda', 'otro'], false),
  validateDateParams('startDate', 'endDate'),
  eventController.getEvents
);
```

### 2.3 Actualizar `routes/gallery.js`

```javascript
const { validateLimit, validatePage, validateEnum } = require('../middleware/validateParams');

// Rutas públicas con validación
router.get('/public',
  validateLimit(20, 50),
  validateEnum('category', ['eventos', 'instalaciones', 'fiestas', 'equipo', 'otros'], false),
  galleryController.getPublicImages
);

router.get('/featured',
  validateLimit(6, 12),
  galleryController.getFeaturedImages
);

// Rutas protegidas con validación
router.get('/',
  validateLimit(50, 100),
  validatePage,
  validateEnum('category', ['eventos', 'instalaciones', 'fiestas', 'equipo', 'otros'], false),
  galleryController.getImages
);
```

---

## 🔧 PASO 3: Aplicar Rate Limiters Específicos

### 3.1 Actualizar `routes/schedules.js`

```javascript
const { 
  publicReadLimiter, 
  createLimiter, 
  updateLimiter, 
  deleteLimiter 
} = require('../middleware/specificRateLimiters');

// Rutas públicas
router.get('/public', publicReadLimiter, scheduleController.getPublicSchedules);

// Rutas protegidas
router.post('/', createLimiter, scheduleController.createSchedule);
router.put('/:id', updateLimiter, scheduleController.updateSchedule);
router.delete('/:id', deleteLimiter, scheduleController.deleteSchedule);
```

### 3.2 Actualizar `routes/events.js`

```javascript
const { 
  publicReadLimiter, 
  createLimiter, 
  updateLimiter, 
  deleteLimiter 
} = require('../middleware/specificRateLimiters');

// Rutas públicas
router.get('/public', publicReadLimiter, eventController.getPublicEvents);
router.get('/calendar', publicReadLimiter, eventController.getCalendarEvents);

// Rutas protegidas
router.post('/', createLimiter, eventController.createEvent);
router.put('/:id', updateLimiter, eventController.updateEvent);
router.delete('/:id', deleteLimiter, eventController.deleteEvent);
```

### 3.3 Actualizar `routes/gallery.js`

```javascript
const { 
  publicReadLimiter, 
  uploadLimiter, 
  updateLimiter, 
  deleteLimiter 
} = require('../middleware/specificRateLimiters');

// Rutas públicas
router.get('/public', publicReadLimiter, galleryController.getPublicImages);
router.get('/featured', publicReadLimiter, galleryController.getFeaturedImages);

// Rutas protegidas
router.post('/', 
  uploadLimiter,  // ⚠️ IMPORTANTE: Limitar uploads
  galleryUpload.single('image'),
  handleMulterError,
  galleryController.uploadImage
);
router.put('/:id', updateLimiter, galleryController.updateImage);
router.delete('/:id', deleteLimiter, galleryController.deleteImage);
```

---

## 📝 EJEMPLO COMPLETO: schedules.js

```javascript
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect, requireSuperAdmin } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validateObjectId');
const { validateLimit, validatePage, validateEnum } = require('../middleware/validateParams');
const { 
  publicReadLimiter, 
  createLimiter, 
  updateLimiter, 
  deleteLimiter 
} = require('../middleware/specificRateLimiters');

// Rutas públicas (sin autenticación)
router.get('/public',
  publicReadLimiter,
  validateLimit(20, 50),
  validateEnum('type', ['horario', 'tarifa'], false),
  scheduleController.getPublicSchedules
);

// Rutas protegidas (solo superadmin)
router.use(protect);
router.use(requireSuperAdmin);

router.get('/',
  validateLimit(50, 100),
  validatePage,
  validateEnum('type', ['horario', 'tarifa'], false),
  scheduleController.getSchedules
);

router.get('/:id',
  validateObjectId(),
  scheduleController.getScheduleById
);

router.post('/',
  createLimiter,
  scheduleController.createSchedule
);

router.put('/:id',
  validateObjectId(),
  updateLimiter,
  scheduleController.updateSchedule
);

router.delete('/:id',
  validateObjectId(),
  deleteLimiter,
  scheduleController.deleteSchedule
);

router.patch('/:id/toggle-status',
  validateObjectId(),
  updateLimiter,
  scheduleController.toggleScheduleStatus
);

module.exports = router;
```

---

## 🧪 PASO 4: Pruebas

### 4.1 Probar Validación de ObjectId

```bash
# Debería devolver 400 Bad Request
curl http://localhost:5000/api/schedules/invalid-id

# Respuesta esperada:
{
  "success": false,
  "message": "ID inválido: id",
  "errorCode": "INVALID_OBJECT_ID"
}
```

### 4.2 Probar Validación de Limit

```bash
# Debería limitar a 100 (máximo)
curl http://localhost:5000/api/schedules?limit=1000

# Debería devolver solo 100 resultados
```

### 4.3 Probar Rate Limiting

```bash
# Hacer 101 requests rápidas a una ruta pública
for i in {1..101}; do
  curl http://localhost:5000/api/schedules/public
done

# La 101ª debería devolver 429 Too Many Requests
{
  "success": false,
  "message": "Demasiadas solicitudes desde esta IP...",
  "errorCode": "RATE_LIMIT_EXCEEDED"
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Schedules
- [ ] Validación de ObjectId aplicada
- [ ] Validación de query params aplicada
- [ ] Rate limiters aplicados
- [ ] Pruebas realizadas

### Events
- [ ] Validación de ObjectId aplicada
- [ ] Validación de query params aplicada (incluyendo fechas)
- [ ] Rate limiters aplicados
- [ ] Pruebas realizadas

### Gallery
- [ ] Validación de ObjectId aplicada
- [ ] Validación de query params aplicada
- [ ] Rate limiters aplicados (especialmente uploadLimiter)
- [ ] Pruebas realizadas

### General
- [ ] Todos los tests pasando
- [ ] Sin errores en consola
- [ ] Documentación actualizada
- [ ] Commit con mensaje descriptivo

---

## 📊 RESULTADOS ESPERADOS

### Antes de las Mejoras:
- ❌ ID inválido → Error 500
- ❌ Limit de 10000 → Sobrecarga de BD
- ❌ Sin límite de uploads → Abuso posible

### Después de las Mejoras:
- ✅ ID inválido → Error 400 con mensaje claro
- ✅ Limit máximo de 100 → BD protegida
- ✅ Máximo 50 uploads/hora → Previene abuso

---

## 🚀 DESPLIEGUE

### Desarrollo
```bash
# 1. Reiniciar servidor
npm run dev

# 2. Verificar que no hay errores
# 3. Probar endpoints manualmente
```

### Producción
```bash
# 1. Hacer merge a rama main
git checkout main
git merge feature/security-improvements

# 2. Desplegar
# 3. Monitorear logs por 24h
```

---

## 📈 MÉTRICAS DE ÉXITO

Después de implementar estas mejoras, deberías ver:

1. **Reducción de errores 500** causados por IDs inválidos
2. **Mejora en tiempo de respuesta** (menos queries excesivas)
3. **Reducción de abuso** gracias a rate limiting
4. **Logs más limpios** con errores 400 en lugar de 500

---

## 🆘 SOPORTE

Si encuentras algún problema durante la implementación:

1. Revisa los logs del servidor
2. Verifica que todos los requires están correctos
3. Asegúrate de que el orden de middlewares es correcto
4. Consulta el archivo SECURITY_AUDIT_PHASE2.md

---

**Última actualización:** 19 de octubre de 2025  
**Versión del documento:** 1.0
