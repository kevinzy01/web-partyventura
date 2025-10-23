# Partyventura Backend API

Backend desarrollado con Node.js + Express + MongoDB para el sitio web de Partyventura.

## 📋 Características

### Fase 1 - Funcionalidades Básicas
- ✅ **API de Contacto**: Formulario con validación, envío de emails y almacenamiento en BD
- ✅ **API de Newsletter**: Sistema de suscripción con pop-up estético
- ✅ **Sistema de Blog**: CRUD completo para noticias con panel de administración

## 🚀 Instalación

### 1. Instalar dependencias
```powershell
cd backend
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env` basándote en `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/partyventura
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion
ADMIN_EMAIL=admin@partyventura.com
JWT_SECRET=tu_clave_secreta
FRONTEND_URL=http://localhost:5500
NODE_ENV=development
```

### 3. Configurar MongoDB
Asegúrate de tener MongoDB instalado y corriendo:

```powershell
# Instalar MongoDB Community Edition
# https://www.mongodb.com/try/download/community

# Iniciar MongoDB
mongod
```

### 4. Configurar Gmail para envío de emails
1. Ve a tu cuenta de Google → Seguridad
2. Activa la verificación en dos pasos
3. Genera una "Contraseña de aplicación"
4. Usa esa contraseña en `EMAIL_PASS`

## 🎯 Uso

### Modo desarrollo (con auto-reload)
```powershell
npm run dev
```

### Modo producción
```powershell
npm start
```

El servidor estará disponible en: `http://localhost:5000`

## 📡 Endpoints API

### 🔹 Contacto

**Enviar mensaje**
```http
POST /api/contact
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "mensaje": "Me gustaría reservar..."
}
```

**Obtener todos los mensajes (Admin)**
```http
GET /api/contact
```

**Obtener un mensaje específico (Admin)**
```http
GET /api/contact/:id
```

**Actualizar estado de mensaje (Admin)**
```http
PUT /api/contact/:id
Content-Type: application/json

{
  "leido": true,
  "respondido": true
}
```

**Eliminar mensaje (Admin)**
```http
DELETE /api/contact/:id
```

**Marcar como leído (Admin) - DEPRECATED**
```http
PATCH /api/contact/:id/read
```
*Nota: Usar PUT /api/contact/:id en su lugar*

### 🔹 Newsletter

**Suscribirse**
```http
POST /api/newsletter
Content-Type: application/json

{
  "email": "usuario@example.com"
}
```

**Obtener suscriptores (Admin)**
```http
GET /api/newsletter
```

**Darse de baja**
```http
DELETE /api/newsletter/:email
```

### 🔹 Noticias/Blog

**Obtener todas las noticias**
```http
GET /api/news?categoria=eventos&limit=10&page=1
```

**Obtener noticia por ID o slug**
```http
GET /api/news/:idOrSlug
```

**Crear noticia (Admin)**
```http
POST /api/news
Content-Type: multipart/form-data

titulo: "Nueva actividad en Partyventura"
contenido: "Contenido completo..."
resumen: "Resumen breve..."
categoria: "eventos"
publicado: true
imagen: [archivo]
```

**Actualizar noticia (Admin)**
```http
PUT /api/news/:id
Content-Type: multipart/form-data
```

**Eliminar noticia (Admin)**
```http
DELETE /api/news/:id
```

### 🔹 Health Check

```http
GET /api/health
```

## 📁 Estructura del Proyecto

```
backend/
├── config/
│   ├── database.js      # Configuración MongoDB
│   └── email.js         # Configuración Nodemailer
├── controllers/
│   ├── contactController.js
│   ├── newsletterController.js
│   └── newsController.js
├── middleware/
│   ├── upload.js        # Multer para archivos
│   └── validate.js      # Validaciones
├── models/
│   ├── Contact.js       # Schema contactos
│   ├── Newsletter.js    # Schema newsletter
│   └── News.js          # Schema noticias
├── routes/
│   ├── contact.js
│   ├── newsletter.js
│   └── news.js
├── uploads/             # Imágenes subidas
├── .env                 # Variables de entorno
├── .env.example         # Ejemplo de variables
├── .gitignore
├── package.json
├── README.md
└── server.js            # Servidor principal
```

## 🔐 Seguridad

- Validación de datos con `express-validator`
- Protección CORS configurada
- Límite de tamaño de archivos (5MB)
- Validación de tipos de archivo
- Sanitización de inputs

## 🛠️ Tecnologías

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **Nodemailer** - Envío de emails
- **Multer** - Subida de archivos
- **Express Validator** - Validación de datos
- **dotenv** - Variables de entorno
- **CORS** - Políticas de origen cruzado

## 📝 Próximas Fases

### Fase 2 (Pendiente)
- Sistema de reservas online
- Integración con pasarela de pago
- Calendario de disponibilidad

### Fase 3 (Pendiente)
- Panel de administración completo
- Dashboard con estadísticas
- Gestión de usuarios

## 🐛 Testing

Para probar los endpoints, puedes usar:
- **Postman**: Importa la colección (próximamente)
- **Thunder Client** (VS Code extension)
- **curl** desde terminal

Ejemplo con curl:
```powershell
curl -X POST http://localhost:5000/api/contact `
  -H "Content-Type: application/json" `
  -d '{"nombre":"Test","email":"test@test.com","mensaje":"Mensaje de prueba"}'
```

## 📞 Soporte

Para reportar bugs o sugerencias, contacta con el equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Octubre 2025
