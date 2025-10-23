# 📚 Documentación de APIs - Partyventura Backend

## 🎯 Fase 2: Gestión Dinámica

### 📅 API de Horarios y Tarifas

**Base URL:** `/api/schedules`

#### Endpoints Públicos (sin autenticación)

##### GET `/api/schedules/public`
Obtener horarios y tarifas activos para mostrar en la web pública.

**Query Parameters:**
- `type` (opcional): Filtrar por tipo (`horario` | `tarifa`)

**Respuesta exitosa:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "...",
      "type": "horario",
      "title": "Lunes a Viernes",
      "description": "Horario regular de apertura",
      "days": ["lunes", "martes", "miércoles", "jueves", "viernes"],
      "openTime": "10:00",
      "closeTime": "22:00",
      "icon": "🕐",
      "order": 1,
      "isActive": true
    }
  ]
}
```

#### Endpoints Protegidos (solo superadmin)

##### GET `/api/schedules`
Obtener todos los horarios y tarifas (incluye inactivos).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `type` (opcional): `horario` | `tarifa`
- `isActive` (opcional): `true` | `false`

##### GET `/api/schedules/:id`
Obtener un horario específico por ID.

##### POST `/api/schedules`
Crear nuevo horario o tarifa.

**Body (ejemplo horario):**
```json
{
  "type": "horario",
  "title": "Sábados",
  "description": "Horario de fin de semana",
  "days": ["sábado"],
  "openTime": "11:00",
  "closeTime": "02:00",
  "icon": "🎉",
  "order": 2,
  "isActive": true
}
```

**Body (ejemplo tarifa):**
```json
{
  "type": "tarifa",
  "title": "Sala Principal",
  "description": "Alquiler de sala principal",
  "price": 150,
  "currency": "EUR",
  "unit": "por hora",
  "icon": "💰",
  "order": 1,
  "isActive": true
}
```

##### PUT `/api/schedules/:id`
Actualizar horario o tarifa existente.

##### DELETE `/api/schedules/:id`
Eliminar horario o tarifa.

##### PATCH `/api/schedules/:id/toggle-status`
Activar/desactivar horario o tarifa.

---

### 📆 API de Eventos

**Base URL:** `/api/events`

#### Endpoints Públicos

##### GET `/api/events/public`
Obtener eventos públicos visibles en la web.

**Query Parameters:**
- `month` (opcional): Mes (1-12)
- `year` (opcional): Año (YYYY)
- `eventType` (opcional): `fiesta` | `cumpleaños` | `corporativo` | `boda` | `otro`
- `limit` (opcional): Número máximo de resultados

**Respuesta:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "...",
      "title": "Fiesta de Halloween",
      "description": "Gran fiesta temática de Halloween",
      "startDate": "2025-10-31T20:00:00Z",
      "endDate": "2025-11-01T03:00:00Z",
      "location": "Sala Principal",
      "eventType": "fiesta",
      "image": "/uploads/events/halloween.jpg",
      "color": "#FF6B35",
      "price": 15,
      "status": "programado",
      "tags": ["halloween", "terror", "disfraces"]
    }
  ]
}
```

##### GET `/api/events/calendar`
Obtener eventos formateados para componente de calendario.

**Query Parameters (requeridos):**
- `start`: Fecha de inicio (ISO 8601)
- `end`: Fecha de fin (ISO 8601)

**Respuesta (formato FullCalendar):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Fiesta de Halloween",
      "start": "2025-10-31T20:00:00Z",
      "end": "2025-11-01T03:00:00Z",
      "color": "#FF6B35",
      "extendedProps": {
        "eventType": "fiesta"
      }
    }
  ]
}
```

#### Endpoints Protegidos (admin y superadmin)

##### GET `/api/events`
Listar todos los eventos (incluye privados e inactivos).

**Query Parameters:**
- `status`: `programado` | `en-curso` | `completado` | `cancelado`
- `eventType`: Tipo de evento
- `startDate`: Filtrar desde fecha
- `endDate`: Filtrar hasta fecha
- `isPublic`: `true` | `false`

##### GET `/api/events/:id`
Obtener detalles completos de un evento.

##### POST `/api/events`
Crear nuevo evento.

**Body:**
```json
{
  "title": "Cumpleaños VIP",
  "description": "Celebración privada de cumpleaños",
  "startDate": "2025-11-15T19:00:00Z",
  "endDate": "2025-11-15T23:00:00Z",
  "location": "Sala VIP",
  "eventType": "cumpleaños",
  "color": "#FF6B35",
  "maxCapacity": 50,
  "price": 25,
  "status": "programado",
  "isPublic": true,
  "allowBooking": false,
  "tags": ["vip", "privado"],
  "contactInfo": {
    "email": "eventos@partyventura.com",
    "phone": "+34 666 777 888"
  },
  "notes": "Cliente requiere decoración especial"
}
```

##### PUT `/api/events/:id`
Actualizar evento existente.

##### DELETE `/api/events/:id`
Eliminar evento.

##### PATCH `/api/events/:id/status`
Cambiar estado del evento.

**Body:**
```json
{
  "status": "completado"
}
```

---

### 🖼️ API de Galería

**Base URL:** `/api/gallery`

#### Endpoints Públicos

##### GET `/api/gallery/public`
Obtener imágenes activas de la galería.

**Query Parameters:**
- `category` (opcional): `eventos` | `instalaciones` | `fiestas` | `equipo` | `otros`
- `isFeatured` (opcional): `true` | `false`
- `limit` (opcional): Número de resultados

**Respuesta:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "id": "...",
      "title": "Sala Principal Decorada",
      "description": "Vista de la sala principal con decoración navideña",
      "imageUrl": "/uploads/gallery/sala-principal-1730456789.jpg",
      "thumbnailUrl": "/uploads/gallery/thumbs/sala-principal-1730456789.jpg",
      "dimensions": {
        "width": 1920,
        "height": 1080
      },
      "category": "instalaciones",
      "tags": ["sala", "decoración", "navidad"],
      "altText": "Sala principal con luces y decoración navideña",
      "isFeatured": true
    }
  ]
}
```

##### GET `/api/gallery/featured`
Obtener solo imágenes destacadas.

**Query Parameters:**
- `limit` (opcional, default: 6)

#### Endpoints Protegidos (admin y superadmin)

##### GET `/api/gallery`
Listar todas las imágenes (incluye inactivas).

**Query Parameters:**
- `category`: Filtrar por categoría
- `isActive`: `true` | `false`
- `isFeatured`: `true` | `false`
- `tags`: Lista separada por comas

##### GET `/api/gallery/:id`
Obtener detalles de una imagen específica.

##### POST `/api/gallery`
Subir nueva imagen (multipart/form-data).

**Headers:**
- `Content-Type: multipart/form-data`
- `Authorization: Bearer <token>`

**Form Data:**
- `image` (file, requerido): Archivo de imagen (JPG, PNG, GIF, WebP, max 10MB)
- `title` (string, requerido): Título de la imagen
- `description` (string, opcional): Descripción
- `category` (string, opcional): Categoría
- `tags` (JSON array, opcional): `["tag1", "tag2"]`
- `altText` (string, opcional): Texto alternativo
- `isFeatured` (boolean, opcional): Marcar como destacada
- `order` (number, opcional): Orden de visualización
- `width` (number, opcional): Ancho de la imagen
- `height` (number, opcional): Alto de la imagen

**Respuesta:**
```json
{
  "success": true,
  "message": "Imagen subida exitosamente",
  "data": {
    "id": "...",
    "title": "Nueva imagen",
    "imageUrl": "/uploads/gallery/imagen-1730456789.jpg",
    "filename": "imagen-1730456789.jpg",
    "fileSize": 2458624,
    "mimeType": "image/jpeg",
    ...
  }
}
```

##### PUT `/api/gallery/:id`
Actualizar información de imagen (sin cambiar archivo).

**Body:**
```json
{
  "title": "Título actualizado",
  "description": "Nueva descripción",
  "category": "eventos",
  "tags": ["tag1", "tag2"],
  "isFeatured": true,
  "order": 5
}
```

##### DELETE `/api/gallery/:id`
Eliminar imagen (también elimina archivo físico).

##### PATCH `/api/gallery/:id/toggle-status`
Activar/desactivar imagen.

##### PATCH `/api/gallery/:id/toggle-featured`
Marcar/desmarcar como destacada.

---

## 🔐 Autenticación

Todas las rutas protegidas requieren:

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Permisos por rol:**
- **Superadmin:** Acceso total (schedules, events, gallery, admins)
- **Admin:** Acceso a events y gallery (lectura y escritura)

---

## ⚠️ Códigos de Error Comunes

- `400` - Bad Request (validación fallida)
- `401` - Unauthorized (token inválido o expirado)
- `403` - Forbidden (sin permisos suficientes)
- `404` - Not Found (recurso no encontrado)
- `500` - Internal Server Error

**Formato de error:**
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": ["Detalle 1", "Detalle 2"] // Opcional
}
```

---

## 📝 Notas de Implementación

### Horarios y Tarifas
- Solo superadmin puede crear/editar/eliminar
- Usar campo `type` para diferenciar horarios de tarifas
- Campo `order` determina el orden de visualización
- Horarios usan `days`, `openTime`, `closeTime`
- Tarifas usan `price`, `currency`, `unit`

### Eventos
- Admin y superadmin pueden gestionar
- Campo `isPublic` controla visibilidad en web
- `status` cambia automáticamente según fechas
- Compatible con librerías de calendario (FullCalendar)
- Endpoint `/calendar` devuelve formato específico

### Galería
- Admin y superadmin pueden gestionar
- Imágenes se almacenan en `/uploads/gallery/`
- Límite de 10MB por imagen
- Formatos permitidos: JPG, PNG, GIF, WebP
- Campo `isFeatured` para imágenes de portada
- Eliminación borra archivo físico del servidor

---

## 🚀 Endpoints Existentes (Fase 1)

- `/api/auth/*` - Autenticación y gestión de sesión
- `/api/admins/*` - Gestión de administradores (solo superadmin)
- `/api/contact` - Formulario de contacto
- `/api/newsletter` - Suscripción a newsletter
- `/api/news/*` - Gestión de noticias

---

**Última actualización:** 19 de octubre de 2025
**Versión del API:** 2.0
