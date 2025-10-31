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

## � API de Horarios Laborales (Work Schedules)

**Base URL:** `/api/work-schedules`

**Descripción:** Sistema de gestión de horarios laborales para empleados del parque.

### 🔐 Permisos por Rol

- **Empleado:** Solo puede ver sus propios horarios
- **Admin:** No tiene permisos especiales (mismo que empleado)
- **Superadmin:** Gestión completa (CRUD) de todos los horarios

---

### Endpoints Protegidos - SUPERADMIN

#### POST `/api/work-schedules`
Crear nuevo horario laboral para un empleado.

**Headers:** `Authorization: Bearer <token>` (Superadmin)

**Body:**
```json
{
  "empleadoId": "507f1f77bcf86cd799439011",
  "fecha": "2025-11-15",
  "turno": "mañana",
  "horaInicio": "10:00",
  "horaFin": "14:00",
  "notas": "Turno de apertura",
  "color": "#f97316"
}
```

**Validaciones:**
- `empleadoId`: Debe existir en BD y tener rol 'empleado'
- `fecha`: No puede ser fecha pasada
- `turno`: `mañana` | `tarde` | `completo`
- `horaInicio/horaFin`: Formato HH:MM (00:00 - 23:59)
- **Horarios del parque:**
  - Lunes a Jueves: 17:00 - 22:00
  - Viernes a Domingo: 10:00 - 22:00
- **Solapamientos:** Rechaza si empleado ya tiene turno en mismo horario

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Horario laboral creado exitosamente",
  "data": {
    "id": "...",
    "empleado": {
      "id": "...",
      "nombre": "Juan Pérez"
    },
    "fecha": "2025-11-15T00:00:00.000Z",
    "fechaFormateada": "viernes, 15 de noviembre de 2025",
    "diaSemana": "viernes",
    "turno": "mañana",
    "horaInicio": "10:00",
    "horaFin": "14:00",
    "horasTotales": 4,
    "estado": "programado",
    "notas": "Turno de apertura",
    "color": "#f97316",
    "creadoPor": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Error de solapamiento (409):**
```json
{
  "success": false,
  "message": "El horario se solapa con un turno existente",
  "conflicto": {
    "id": "...",
    "horaInicio": "12:00",
    "horaFin": "18:00",
    "turno": "tarde"
  }
}
```

---

#### GET `/api/work-schedules/all`
Obtener todos los horarios laborales con filtros opcionales.

**Headers:** `Authorization: Bearer <token>` (Superadmin)

**Query Parameters:**
- `empleadoId` (opcional): Filtrar por empleado específico
- `fechaInicio` (opcional): Fecha de inicio (formato ISO8601)
- `fechaFin` (opcional): Fecha de fin (formato ISO8601)
- `mes` (opcional): Número de mes (1-12)
- `anio` (opcional): Año (2024+)
- `estado` (opcional): `programado` | `confirmado` | `cancelado` | `completado`

**Ejemplo:** `GET /api/work-schedules/all?mes=11&anio=2025&estado=programado`

**Respuesta:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "id": "...",
      "empleado": {
        "id": "...",
        "nombre": "Juan Pérez"
      },
      "fecha": "2025-11-15T00:00:00.000Z",
      "fechaFormateada": "viernes, 15 de noviembre de 2025",
      "diaSemana": "viernes",
      "turno": "mañana",
      "horaInicio": "10:00",
      "horaFin": "14:00",
      "horasTotales": 4,
      "estado": "programado",
      "notas": "",
      "color": "#f97316"
    }
  ]
}
```

---

#### PUT `/api/work-schedules/:id`
Actualizar horario laboral existente.

**Headers:** `Authorization: Bearer <token>` (Superadmin)

**Body (todos los campos son opcionales):**
```json
{
  "fecha": "2025-11-16",
  "horaInicio": "11:00",
  "horaFin": "15:00",
  "estado": "confirmado",
  "notas": "Cambio de horario por solicitud"
}
```

**Validaciones:**
- Si cambian horas o fecha, verifica nuevamente solapamientos
- Si cambia empleado, verifica que nuevo empleado existe y tiene rol 'empleado'

---

#### DELETE `/api/work-schedules/:id`
Eliminar horario laboral.

**Headers:** `Authorization: Bearer <token>` (Superadmin)

**Respuesta:**
```json
{
  "success": true,
  "message": "Horario eliminado exitosamente"
}
```

---

#### POST `/api/work-schedules/delete-multiple`
Eliminar múltiples horarios en lote.

**Headers:** `Authorization: Bearer <token>` (Superadmin)

**Body:**
```json
{
  "ids": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "3 horario(s) eliminado(s) exitosamente",
  "deletedCount": 3
}
```

---

### Endpoints Protegidos - EMPLEADO/ADMIN/SUPERADMIN

#### GET `/api/work-schedules/my-schedules`
Obtener horarios propios del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `fechaInicio` (opcional): Fecha de inicio
- `fechaFin` (opcional): Fecha de fin
- `mes` (opcional): Número de mes (1-12)
- `anio` (opcional): Año (2024+)

**Respuesta (vista simplificada para empleados):**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": "...",
      "fecha": "2025-11-15T00:00:00.000Z",
      "fechaFormateada": "viernes, 15 de noviembre de 2025",
      "diaSemana": "viernes",
      "turno": "mañana",
      "horaInicio": "10:00",
      "horaFin": "14:00",
      "horasTotales": 4,
      "estado": "programado",
      "notas": "Turno de apertura",
      "color": "#f97316"
    }
  ]
}
```

---

#### GET `/api/work-schedules/weekly`
Obtener vista semanal de horarios.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters (obligatorios):**
- `fecha`: Cualquier fecha de la semana (formato ISO8601)
- `empleadoId` (opcional, solo superadmin): Ver horarios de otro empleado

**Ejemplo:** `GET /api/work-schedules/weekly?fecha=2025-11-15`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "inicioSemana": "2025-11-11",
    "finSemana": "2025-11-17",
    "dias": [
      {
        "fecha": "2025-11-11",
        "diaSemana": "lunes",
        "horarios": []
      },
      {
        "fecha": "2025-11-15",
        "diaSemana": "viernes",
        "horarios": [
          {
            "id": "...",
            "turno": "mañana",
            "horaInicio": "10:00",
            "horaFin": "14:00",
            "horasTotales": 4,
            "estado": "programado"
          }
        ]
      }
    ]
  }
}
```

---

#### GET `/api/work-schedules/monthly`
Obtener vista mensual de horarios con resumen.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters (obligatorios):**
- `mes`: Número de mes (1-12)
- `anio`: Año (2024+)
- `empleadoId` (opcional, solo superadmin): Ver horarios de otro empleado

**Ejemplo:** `GET /api/work-schedules/monthly?mes=11&anio=2025`

**Respuesta:**
```json
{
  "success": true,
  "count": 12,
  "data": {
    "mes": 11,
    "anio": 2025,
    "horarios": [
      {
        "id": "...",
        "fecha": "2025-11-15T00:00:00.000Z",
        "turno": "mañana",
        "horaInicio": "10:00",
        "horaFin": "14:00",
        "horasTotales": 4,
        "estado": "programado"
      }
    ],
    "resumen": {
      "mes": 11,
      "anio": 2025,
      "totalHoras": 48.5,
      "diasTrabajo": 12,
      "turnosProgramados": 15,
      "estadisticas": {
        "programados": 10,
        "confirmados": 5,
        "completados": 0
      }
    }
  }
}
```

---

#### GET `/api/work-schedules/resume/:empleadoId?`
Obtener resumen de horas del mes.

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `empleadoId` (opcional): Solo superadmin puede especificar. Empleados solo ven el suyo.

**Query Parameters (obligatorios):**
- `mes`: Número de mes (1-12)
- `anio`: Año (2024+)

**Ejemplo:** `GET /api/work-schedules/resume?mes=11&anio=2025`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "mes": 11,
    "anio": 2025,
    "totalHoras": 48.5,
    "diasTrabajo": 12,
    "turnosProgramados": 15,
    "estadisticas": {
      "programados": 10,
      "confirmados": 5,
      "completados": 0
    }
  }
}
```

---

#### GET `/api/work-schedules/:id`
Obtener horario específico por ID.

**Headers:** `Authorization: Bearer <token>`

**Permisos:**
- Empleado: Solo puede ver sus propios horarios (403 si intenta ver de otro)
- Superadmin: Puede ver cualquier horario

---

### 📝 Notas de Implementación

#### Validaciones Automáticas en Modelo

1. **Rango de Horarios del Parque:**
   - Lunes a Jueves: 17:00 - 22:00
   - Viernes a Domingo: 10:00 - 22:00
   - Rechaza automáticamente horarios fuera de estos rangos

2. **Cálculo Automático:**
   - `horasTotales` se calcula automáticamente en `pre-save` hook

3. **Detección de Solapamientos:**
   - Método estático `verificarSolapamiento()` valida antes de guardar
   - Compara minutos totales para detectar conflictos

4. **Estados del Horario:**
   - `programado`: Recién creado
   - `confirmado`: Empleado confirmó asistencia
   - `cancelado`: Turno cancelado (no se muestra a empleados)
   - `completado`: Turno finalizado

#### Rate Limiting

Los endpoints de work-schedules usan el rate limiting general:
- 100 requests / 15 minutos por IP (heredado de `generalLimiter`)

#### Casos de Uso

1. **Admin asigna horarios semanales:**
   ```
   POST /api/work-schedules (x15 llamadas para semana completa)
   ```

2. **Empleado ve su semana:**
   ```
   GET /api/work-schedules/weekly?fecha=2025-11-15
   ```

3. **Admin ve resumen mensual de empleado:**
   ```
   GET /api/work-schedules/resume/507f...?mes=11&anio=2025
   ```

---

## �🚀 Endpoints Existentes (Fase 1)

- `/api/auth/*` - Autenticación y gestión de sesión
- `/api/admins/*` - Gestión de administradores (solo superadmin)
- `/api/contact` - Formulario de contacto
- `/api/newsletter` - Suscripción a newsletter
- `/api/news/*` - Gestión de noticias

---

**Última actualización:** 30 de octubre de 2025
**Versión del API:** 2.1

