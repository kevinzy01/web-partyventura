# 🧪 GUÍA DE PRUEBAS - PARTYVENTURA

Esta guía te ayudará a probar todas las funcionalidades del sistema.

## 📋 Checklist de Pruebas

### ✅ 1. Backend (API)

#### Test de Salud
```powershell
curl http://localhost:5000/api/health
```
**Resultado esperado**: 
```json
{
  "success": true,
  "message": "API de Partyventura funcionando correctamente",
  "timestamp": "2025-10-19T..."
}
```

#### Test de Contacto
```powershell
curl -X POST http://localhost:5000/api/contact `
  -H "Content-Type: application/json" `
  -d '{
    "nombre": "Test Usuario",
    "email": "test@example.com",
    "mensaje": "Este es un mensaje de prueba desde la API"
  }'
```

**Resultado esperado**:
- ✅ Respuesta 201 con mensaje de éxito
- ✅ Email al administrador
- ✅ Email de confirmación al usuario

#### Test de Newsletter
```powershell
curl -X POST http://localhost:5000/api/newsletter `
  -H "Content-Type: application/json" `
  -d '{"email": "suscriptor@example.com"}'
```

**Resultado esperado**:
- ✅ Respuesta 201 con mensaje de éxito
- ✅ Email de bienvenida al suscriptor

### ✅ 2. Frontend (Usuario)

#### Test de Pop-up Newsletter
1. Abre `http://localhost:5500/web/index.html`
2. Espera 10 segundos
3. Debería aparecer el modal de newsletter
4. Prueba suscribirte con un email válido

**Resultado esperado**:
- ✅ Pop-up aparece después de 10 segundos
- ✅ Animación suave de entrada
- ✅ Formulario funcional
- ✅ Notificación de éxito
- ✅ Email de confirmación recibido

#### Test de Formulario de Contacto
1. Scroll hasta la sección "Contáctanos"
2. Rellena todos los campos:
   - Nombre: "Juan Pérez"
   - Email: "juan@example.com"
   - Mensaje: "Quiero información sobre cumpleaños"
3. Envía el formulario

**Resultado esperado**:
- ✅ Validación de campos
- ✅ Botón muestra "Enviando..."
- ✅ Notificación verde de éxito
- ✅ Formulario se limpia
- ✅ 2 emails enviados (admin + usuario)

#### Test de Galería
1. Scroll hasta la sección "Galería"
2. Haz clic en cualquier imagen

**Resultado esperado**:
- ✅ Imagen se abre en lightbox
- ✅ Fondo oscuro con blur
- ✅ Botón X para cerrar
- ✅ Clic fuera cierra el lightbox

#### Test de Carrusel de Precios
1. En la sección "Tarifas"
2. Observa el carrusel automático
3. Haz clic en los puntos de navegación
4. Desliza manualmente en móvil

**Resultado esperado**:
- ✅ Cambio automático cada 4 segundos
- ✅ Puntos activos se actualizan
- ✅ Al interactuar, se detiene el auto-scroll
- ✅ Responsive en móvil

### ✅ 3. Panel de Administración

#### Test de Crear Noticia
1. Abre `http://localhost:5500/web/admin.html`
2. Clic en "➕ Nueva Noticia"
3. Rellena el formulario:
   - Título: "¡Nueva actividad Ninja Warrior!"
   - Resumen: "Hemos añadido un nuevo circuito de obstáculos"
   - Contenido: "Descripción completa de la actividad..."
   - Categoría: "Eventos"
   - Imagen: Sube una imagen de prueba
   - ✓ Publicar inmediatamente
4. Clic en "💾 Guardar Noticia"

**Resultado esperado**:
- ✅ Noticia se crea correctamente
- ✅ Aparece en la lista de noticias
- ✅ Imagen se sube correctamente
- ✅ Notificación de éxito

#### Test de Editar Noticia
1. Busca la noticia creada
2. Clic en "✏️ Editar"
3. Modifica el título o contenido
4. Guarda los cambios

**Resultado esperado**:
- ✅ Modal se abre con datos precargados
- ✅ Cambios se guardan correctamente
- ✅ Lista se actualiza automáticamente

#### Test de Eliminar Noticia
1. Busca cualquier noticia
2. Clic en "🗑️ Eliminar"
3. Confirma la eliminación

**Resultado esperado**:
- ✅ Aparece confirmación
- ✅ Noticia se elimina
- ✅ Imagen asociada se elimina del servidor
- ✅ Lista se actualiza

#### Test de Visualización en Frontend
1. Después de crear noticias en admin
2. Vuelve a `index.html`
3. Scroll hasta "Noticias"

**Resultado esperado**:
- ✅ Noticias aparecen automáticamente
- ✅ Imágenes se muestran correctamente
- ✅ Categorías con colores apropiados
- ✅ Máximo 4 noticias visibles

## 🎯 Casos de Prueba Específicos

### Test de Validaciones

#### Email Inválido (Contacto)
```javascript
{
  "nombre": "Test",
  "email": "email-invalido",
  "mensaje": "Mensaje de prueba"
}
```
**Resultado esperado**: ❌ Error 400 - "Email inválido"

#### Campos Vacíos (Newsletter)
```javascript
{
  "email": ""
}
```
**Resultado esperado**: ❌ Error 400 - "Email obligatorio"

#### Mensaje Muy Corto (Contacto)
```javascript
{
  "nombre": "Test",
  "email": "test@test.com",
  "mensaje": "Hola"
}
```
**Resultado esperado**: ❌ Error 400 - "Mensaje debe tener al menos 10 caracteres"

#### Email Duplicado (Newsletter)
1. Suscribirse con "test@example.com"
2. Intentar suscribirse de nuevo con el mismo email

**Resultado esperado**: ❌ Error 400 - "Email ya suscrito"

### Test de Upload de Imágenes

#### Imagen Válida
- Formato: JPG, PNG, GIF, WEBP
- Tamaño: < 5MB

**Resultado esperado**: ✅ Imagen se sube correctamente

#### Imagen Muy Grande
- Tamaño: > 5MB

**Resultado esperado**: ❌ Error 400 - "Archivo muy grande"

#### Tipo de Archivo Inválido
- Formato: PDF, DOC, etc.

**Resultado esperado**: ❌ Error - "Solo imágenes permitidas"

## 📊 Verificación de Base de Datos

```powershell
# Conectar a MongoDB
mongosh

# Usar base de datos
use partyventura

# Ver colecciones
show collections

# Ver contactos
db.contacts.find().pretty()

# Ver suscriptores
db.newsletters.find().pretty()

# Ver noticias
db.news.find().pretty()

# Contar registros
db.contacts.countDocuments()
db.newsletters.countDocuments()
db.news.countDocuments()
```

## 🔍 Verificación de Emails

### Emails que Deberías Recibir

1. **Al enviar formulario de contacto**:
   - Email al admin con datos del contacto
   - Email de confirmación al usuario

2. **Al suscribirse a newsletter**:
   - Email de bienvenida al suscriptor

### Revisar Logs de Email
Revisa la consola del backend para ver:
```
✅ Servidor de email listo para enviar mensajes
📧 Email enviado a: admin@partyventura.com
📧 Email enviado a: usuario@example.com
```

## 🐛 Debug

### Si algo no funciona:

**Backend**:
```powershell
# Ver logs en tiempo real
cd backend
npm run dev
# Los errores aparecerán aquí
```

**Frontend**:
- Abre DevTools (F12)
- Ve a Console
- Busca errores en rojo

**MongoDB**:
```powershell
# Ver si está corriendo
mongosh
# Si no conecta, inicia MongoDB
mongod
```

## ✅ Checklist Final

Antes de dar por terminadas las pruebas, verifica:

- [ ] Backend inicia sin errores
- [ ] MongoDB conecta correctamente
- [ ] Emails se envían correctamente
- [ ] Pop-up de newsletter aparece y funciona
- [ ] Formulario de contacto envía datos
- [ ] Galería abre imágenes en lightbox
- [ ] Carrusel se mueve automáticamente
- [ ] Panel admin carga noticias
- [ ] Se pueden crear noticias
- [ ] Se pueden editar noticias
- [ ] Se pueden eliminar noticias
- [ ] Las imágenes se suben correctamente
- [ ] Noticias aparecen en index.html
- [ ] Responsive funciona en móvil
- [ ] No hay errores en consola

## 📝 Reportar Problemas

Si encuentras algún problema:

1. Anota el mensaje de error exacto
2. Verifica la consola del navegador
3. Revisa los logs del backend
4. Comprueba la configuración del `.env`
5. Verifica que MongoDB esté corriendo

---

**¡Todo listo para probar! 🚀**

Sigue esta guía paso a paso y verifica que todo funciona correctamente.
