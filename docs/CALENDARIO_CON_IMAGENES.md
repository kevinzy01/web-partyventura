# 📅 Sistema de Calendario con Imágenes de Eventos

## 📋 Descripción

Se ha implementado un sistema completo de calendario dinámico que permite agregar imágenes a los eventos desde el panel de administración. Las imágenes aparecen en el calendario público sobre el número de la fecha.

## 🎯 Características Implementadas

### ✨ Frontend Público (index.html)

1. **Calendario Dinámico**:
   - ✅ Renderizado automático del calendario según el mes actual
   - ✅ Navegación entre meses con botones anterior/siguiente
   - ✅ Carga de eventos desde la API
   - ✅ **Imágenes de eventos mostradas sobre el número del día**
   - ✅ Indicadores visuales: día actual, eventos, fines de semana
   - ✅ Tooltips con información del evento al pasar el mouse

2. **Visualización de Imágenes**:
   ```html
   <!-- Las imágenes aparecen así en el calendario -->
   <img src="/uploads/events/imagen.jpg" 
        class="w-6 h-6 lg:w-8 lg:h-8 rounded-full" />
   ```

### 🎨 Panel de Administración

1. **Formulario de Eventos Mejorado**:
   - ✅ Campo para subir imagen del evento
   - ✅ Preview en tiempo real de la imagen seleccionada
   - ✅ Botón para eliminar imagen antes de guardar
   - ✅ Validación: solo imágenes, máximo 5MB
   - ✅ Formatos aceptados: JPG, PNG, GIF, WebP

2. **Funcionalidad de Subida**:
   ```javascript
   // Usa FormData para enviar imagen + datos del evento
   const formData = new FormData();
   formData.append('image', imageFile);
   formData.append('title', 'Evento...');
   // ... más campos
   ```

### 🔧 Backend

1. **Modelo de Eventos** (`backend/models/Event.js`):
   ```javascript
   image: {
     type: String,
     trim: true
   }
   ```
   - Ya existía el campo `image` en el modelo

2. **Rutas Actualizadas** (`backend/routes/events.js`):
   ```javascript
   // Configuración de Multer para subida de imágenes
   const upload = multer({
     storage: diskStorage,
     fileFilter: imageFilter,
     limits: { fileSize: 5MB }
   });
   
   router.post('/', upload.single('image'), createEvent);
   router.put('/:id', upload.single('image'), updateEvent);
   ```

3. **Controlador** (`backend/controllers/eventController.js`):
   ```javascript
   // Al crear/actualizar evento
   if (req.file) {
     eventData.image = `/uploads/events/${req.file.filename}`;
   }
   ```

4. **Carpeta de Almacenamiento**:
   - ✅ Creada: `backend/uploads/events/`
   - ✅ Servida estáticamente por Express
   - ✅ Nombres de archivo únicos: `event-timestamp-random.ext`

## 📁 Estructura de Archivos

```
WEB PARTYVENTURA/
├── backend/
│   ├── uploads/
│   │   └── events/              # Imágenes de eventos
│   │       └── event-*.jpg/png
│   ├── controllers/
│   │   └── eventController.js   # ✅ Modificado
│   ├── routes/
│   │   └── events.js            # ✅ Modificado
│   └── models/
│       └── Event.js             # ✅ Ya tenía el campo image
│
└── frontend/
    ├── public/
    │   └── index.html           # ✅ Calendario dinámico
    ├── src/
    │   ├── admin.html           # ✅ Formulario con campo de imagen
    │   └── js/
    │       └── pages/
    │           ├── main.js      # ✅ Función initCalendar()
    │           └── admin.js     # ✅ Subida de imágenes
```

## 🚀 Flujo de Trabajo

### Crear Evento con Imagen (Admin):

1. **Panel Admin** → Eventos → "+ Nuevo Evento"
2. Llenar formulario del evento
3. **Subir imagen** en el campo "Imagen del Evento"
4. Ver preview de la imagen
5. Guardar evento

### Visualización Pública:

1. Usuario accede a la página principal
2. Scroll hasta la sección "Calendario de Eventos"
3. El calendario se carga dinámicamente
4. **Las imágenes aparecen sobre el número del día**
5. Al pasar el mouse, se muestra el título del evento

## 🎨 Diseño Visual

### Día con Evento e Imagen:
```
┌─────────────────┐
│   🎃 (imagen)   │  ← Imagen del evento (8x8 en desktop, 6x6 en mobile)
│       12        │  ← Número del día
│       •         │  ← Indicador de evento
└─────────────────┘
```

### Día sin Imagen (solo con Evento):
```
┌─────────────────┐
│       12        │  ← Número del día
│       •         │  ← Indicador de evento
└─────────────────┘
```

## 🔐 Seguridad

1. **Validación de Archivo**:
   - Solo acepta tipos MIME de imagen
   - Tamaño máximo: 5MB
   - Extensiones permitidas: .jpg, .jpeg, .png, .gif, .webp

2. **Nombres de Archivo Únicos**:
   ```javascript
   event-1698765432000-123456789.jpg
   ```

3. **Autenticación**:
   - Solo admins/superadmins pueden subir imágenes
   - Middleware `requireAdmin` protege las rutas

## 📊 API Endpoints

### Públicos (sin autenticación):
```
GET /api/events/public?month=10&year=2025
```
Retorna eventos con sus imágenes:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Fiesta de Halloween",
      "image": "/uploads/events/event-123456.jpg",
      "startDate": "2025-10-31T20:00:00.000Z",
      ...
    }
  ]
}
```

### Protegidos (admin):
```
POST /api/events
Content-Type: multipart/form-data

{
  "image": <file>,
  "title": "Evento...",
  "description": "...",
  ...
}
```

## 🐛 Manejo de Errores

1. **Imagen no se carga**:
   ```javascript
   eventImage.onerror = function() {
     this.style.display = 'none'; // Ocultar si falla
   };
   ```

2. **Archivo muy grande**:
   - Multer rechaza archivos > 5MB
   - Mensaje de error al usuario

3. **Formato inválido**:
   - Multer valida el MIME type
   - Solo acepta imágenes

## 💡 Mejoras Futuras (Opcionales)

1. **Compresión de imágenes**:
   - Usar Sharp para redimensionar automáticamente
   - Optimizar peso de las imágenes

2. **Múltiples imágenes**:
   - Galería de imágenes por evento
   - Carousel en el calendario

3. **Edición de imagen**:
   - Crop/recorte antes de subir
   - Filtros y efectos

4. **CDN**:
   - Subir a servicio externo (Cloudinary, AWS S3)
   - Mejor rendimiento

## 🧪 Testing

### Probar Funcionalidad:

1. **Backend**:
   ```bash
   npm run dev
   ```

2. **Crear evento con imagen**:
   - Login como admin
   - Ir a Eventos → "+ Nuevo Evento"
   - Subir imagen
   - Guardar

3. **Ver en calendario**:
   - Abrir página principal
   - Navegar al calendario
   - Verificar que la imagen aparece sobre el día

4. **Verificar almacenamiento**:
   ```
   backend/uploads/events/event-*.jpg
   ```

## 📝 Notas Importantes

1. **Tamaño de Imagen Recomendado**:
   - Mínimo: 100x100 px
   - Óptimo: 300x300 px
   - Se renderiza como 32x32 px en desktop, 24x24 px en mobile

2. **Formato de Imagen**:
   - Preferir imágenes cuadradas
   - Se aplica `border-radius: full` (circular)
   - Usar `object-cover` para mantener proporciones

3. **Performance**:
   - Las imágenes se cargan lazy por defecto en navegadores modernos
   - Considerar implementar lazy loading explícito para muchas imágenes

4. **Accesibilidad**:
   - Cada imagen tiene atributo `alt` con el título del evento
   - Los tooltips proporcionan contexto adicional

## 🎉 Resultado Final

Ahora los administradores pueden:
- ✅ Subir imágenes al crear eventos
- ✅ Ver preview antes de guardar
- ✅ Editar eventos y actualizar la imagen

Los usuarios públicos pueden:
- ✅ Ver un calendario dinámico
- ✅ Identificar eventos visualmente por sus imágenes
- ✅ Navegar entre meses
- ✅ Ver tooltips con información del evento

---

**Fecha de implementación**: 20 de octubre de 2025  
**Versión**: 1.0  
**Estado**: ✅ Completado y funcional
