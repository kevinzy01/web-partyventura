# 🎉 Partyventura - Backend API

API RESTful completa y segura para la gestión de contacto, newsletter y blog de Partyventura.

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0%2B-green.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌟 Características Principales

- ✅ **Sistema de Contacto**: Recepción y gestión de mensajes de clientes
- ✅ **Newsletter**: Suscripción y gestión de suscriptores
- ✅ **Blog/Noticias**: CRUD completo con imágenes
- ✅ **Autenticación JWT**: Sistema seguro de login para administradores
- ✅ **Seguridad Avanzada**: Helmet, Rate Limiting, Sanitización
- ✅ **Validación de Datos**: Express-validator en todos los endpoints
- ✅ **Email Automático**: Notificaciones con Nodemailer
- ✅ **Subida de Archivos**: Manejo seguro de imágenes

## 🔒 Características de Seguridad

- 🛡️ **Helmet.js** - Headers HTTP seguros (CSP, XSS, Clickjacking)
- 🚦 **Rate Limiting** - Protección contra DDoS y fuerza bruta
- 🧹 **Sanitización** - Anti NoSQL Injection, XSS, HPP
- 🔐 **JWT** - Autenticación con tokens firmados
- 🔑 **Bcrypt** - Hashing seguro de contraseñas (10 rounds)
- 📝 **Logging** - Detección y alerta de actividad sospechosa
- ✅ **CORS** - Políticas de origen cruzado configuradas
- 🔒 **Bloqueo Automático** - 5 intentos fallidos = 15 min bloqueado

📖 Ver [SECURITY.md](./SECURITY.md) para documentación completa de seguridad.

## 📋 Requisitos Previos

- **Node.js** v16 o superior
- **MongoDB** v8.0 o superior
- **NPM** o Yarn
- **Gmail** (para envío de emails)

## 🚀 Instalación

### 1️⃣ Clonar e instalar dependencias

```powershell
cd backend
npm install
```

### 2️⃣ Configurar variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```env
# Servidor
PORT=5000
NODE_ENV=development

# Base de datos
MONGODB_URI=mongodb://localhost:27017/partyventura

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicación
ADMIN_EMAIL=admin@partyventura.com

# Seguridad JWT
JWT_SECRET=genera_un_secret_super_seguro_aqui
JWT_EXPIRE=24h

# Frontend
FRONTEND_URL=http://localhost:5500

# Límites
MAX_FILE_SIZE=5
```

**Generar JWT_SECRET seguro:**
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3️⃣ Configurar MongoDB

**Windows:**
```powershell
# Descargar MongoDB Community Edition
# https://www.mongodb.com/try/download/community

# Iniciar servicio
net start MongoDB

# O ejecutar manualmente
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath="C:\data\db"
```

### 4️⃣ Configurar Gmail

1. Ve a [Cuenta de Google → Seguridad](https://myaccount.google.com/security)
2. Activa **Verificación en 2 pasos**
3. Ve a **Contraseñas de aplicaciones**
4. Genera una contraseña para "Correo"
5. Usa esa contraseña en `EMAIL_PASS` del archivo `.env`

### 5️⃣ Crear primer administrador

```powershell
npm run init-admin
```

Sigue las instrucciones para crear tu usuario administrador.

## 🎯 Uso

### Modo desarrollo (con auto-reload)
```powershell
npm run dev
```

### Modo producción
```powershell
npm start
```

### Crear administrador
```powershell
npm run init-admin
```

El servidor estará disponible en: **http://localhost:5000**

## 📡 API Endpoints

### 🔐 Autenticación

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "tu_contraseña"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "...",
      "username": "admin",
      "email": "admin@partyventura.com",
      "nombre": "Administrador",
      "rol": "admin"
    }
  }
}
```

#### Obtener perfil
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Cambiar contraseña
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "passwordActual": "contraseña_actual",
  "passwordNuevo": "nueva_contraseña"
}
```

### 📧 Contacto

#### Enviar mensaje (Público)
```http
POST /api/contact
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "mensaje": "Me gustaría reservar..."
}
```

**Rate Limit:** 5 mensajes/hora por IP

#### Listar mensajes (Admin)
```http
GET /api/contact
Authorization: Bearer <token>
```

#### Ver mensaje (Admin)
```http
GET /api/contact/:id
Authorization: Bearer <token>
```

#### Actualizar mensaje (Admin)
```http
PUT /api/contact/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "leido": true,
  "respondido": true
}
```

#### Eliminar mensaje (Admin)
```http
DELETE /api/contact/:id
Authorization: Bearer <token>
```

### 📰 Newsletter

#### Suscribirse (Público)
```http
POST /api/newsletter
Content-Type: application/json

{
  "email": "usuario@example.com"
}
```

**Rate Limit:** 3 suscripciones/hora por IP

#### Listar suscriptores (Admin)
```http
GET /api/newsletter
Authorization: Bearer <token>
```

#### Desuscribirse
```http
DELETE /api/newsletter/:email
```

### 📝 Noticias/Blog

#### Obtener todas (Público)
```http
GET /api/news
```

**Query params opcionales:**
- `categoria` - Filtrar por categoría (eventos, promociones, noticias, general)
- `publicado` - true/false
- `limit` - Número de resultados
- `skip` - Paginación

#### Obtener noticia (Público)
```http
GET /api/news/:idOrSlug
```

#### Crear noticia (Admin)
```http
POST /api/news
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "titulo": "Título de la noticia",
  "contenido": "Contenido completo...",
  "resumen": "Breve descripción",
  "categoria": "eventos",
  "imagen": <archivo>
}
```

**Rate Limit:** 20 creaciones/hora

#### Actualizar noticia (Admin)
```http
PUT /api/news/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "titulo": "Nuevo título",
  "publicado": true,
  "imagen": <archivo> (opcional)
}
```

#### Eliminar noticia (Admin)
```http
DELETE /api/news/:id
Authorization: Bearer <token>
```

## 🛡️ Rate Limits

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| General (todas las rutas) | 100 peticiones | 15 min |
| `/api/auth/login` | 5 intentos | 15 min |
| `/api/contact` | 5 mensajes | 1 hora |
| `/api/newsletter` | 3 suscripciones | 1 hora |
| Creación de contenido | 20 items | 1 hora |

## 📁 Estructura del Proyecto

```
backend/
├── config/
│   ├── database.js          # Conexión a MongoDB
│   └── email.js             # Configuración de Nodemailer
├── controllers/
│   ├── authController.js    # Lógica de autenticación
│   ├── contactController.js # Lógica de contacto
│   ├── newsController.js    # Lógica de noticias
│   └── newsletterController.js
├── middleware/
│   ├── auth.js              # Middleware JWT
│   ├── rateLimiter.js       # Rate limiting
│   ├── sanitize.js          # Sanitización de datos
│   ├── security.js          # Headers de seguridad
│   ├── upload.js            # Subida de archivos
│   └── validate.js          # Validación de errores
├── models/
│   ├── Admin.js             # Modelo de administrador
│   ├── Contact.js           # Modelo de mensajes
│   ├── News.js              # Modelo de noticias
│   └── Newsletter.js        # Modelo de suscriptores
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   ├── contact.js           # Rutas de contacto
│   ├── news.js              # Rutas de noticias
│   └── newsletter.js        # Rutas de newsletter
├── scripts/
│   └── initAdmin.js         # Script para crear admin
├── uploads/                 # Archivos subidos
├── .env                     # Variables de entorno (NO SUBIR A GIT)
├── .env.example             # Plantilla de .env
├── .gitignore               # Archivos ignorados
├── package.json             # Dependencias
├── README.md                # Este archivo
├── SECURITY.md              # Documentación de seguridad
└── server.js                # Punto de entrada
```

## 🔧 Dependencias Principales

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5",
  "express-mongo-sanitize": "^2.2.0",
  "express-validator": "^7.0.1",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "nodemailer": "^6.9.7",
  "multer": "^1.4.5-lts.1"
}
```

## 🧪 Testing

```powershell
# Probar conexión a la base de datos
npm run dev

# Verificar endpoint de salud
curl http://localhost:5000/api/health
```

## 📊 Monitoreo y Logs

El sistema registra automáticamente:
- ✅ Conexiones a la base de datos
- ⚠️ Actividad sospechosa (Path Traversal, XSS, SQL/NoSQL Injection)
- 🚨 Intentos fallidos de login
- 📧 Envío de emails

Los logs se muestran en la consola del servidor.

## 🚀 Despliegue en Producción

### Checklist antes de desplegar:

- [ ] Cambiar `NODE_ENV=production` en `.env`
- [ ] Generar nuevo `JWT_SECRET` único y seguro
- [ ] Configurar MongoDB Atlas o servidor MongoDB dedicado
- [ ] Configurar SSL/TLS (HTTPS)
- [ ] Actualizar `FRONTEND_URL` con dominio real
- [ ] Configurar firewall y restricciones de IP
- [ ] Habilitar logs persistentes
- [ ] Configurar backups automáticos de MongoDB
- [ ] Revisar y ajustar rate limits si es necesario

### Variables de entorno para producción:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/partyventura
FRONTEND_URL=https://www.partyventura.com
JWT_SECRET=<generar_nuevo_secret_super_largo>
```

## 🐛 Troubleshooting

### Error: "Cannot connect to MongoDB"
```powershell
# Verificar que MongoDB está corriendo
mongosh

# Si no está instalado, descarga desde:
# https://www.mongodb.com/try/download/community
```

### Error: "Email not sending"
- Verifica que `EMAIL_PASS` sea la contraseña de aplicación de Gmail
- Asegúrate de tener activada la verificación en 2 pasos
- Revisa que `EMAIL_USER` y `EMAIL_FROM` sean el mismo email

### Error: "JWT must be provided"
- Asegúrate de incluir el header: `Authorization: Bearer <token>`
- Verifica que el token no haya expirado (24h por defecto)
- Comprueba que `JWT_SECRET` sea el mismo que se usó para generar el token

### Error: "Rate limit exceeded"
- Espera el tiempo indicado antes de reintentar
- En desarrollo, puedes ajustar los límites en `middleware/rateLimiter.js`

## 📞 Soporte

Para reportar bugs o solicitar funcionalidades:
- **Email**: kevinzy01@gmail.com
- **Asunto**: [BACKEND] Descripción breve

Para reportar vulnerabilidades de seguridad:
- Ver [SECURITY.md](./SECURITY.md)

## 📝 Changelog

### v1.0.0 (2025-01-19)
- ✅ Sistema completo de autenticación JWT
- ✅ CRUD de contacto, newsletter y noticias
- ✅ Seguridad avanzada (Helmet, Rate Limiting, Sanitización)
- ✅ Subida de imágenes con Multer
- ✅ Email automático con Nodemailer
- ✅ Validación de datos con express-validator
- ✅ Documentación completa

## 📄 Licencia

MIT License - © 2025 Partyventura

---

**Desarrollado con ❤️ por el equipo de Partyventura**
