# 🎉 Partyventura - Plataforma Web Completa

[![Node.js](https://img.shields.io/badge/Node.js-22.20.0-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0+-brightgreen)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.18.2-blue)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8)](https://tailwindcss.com/)

> Plataforma web profesional para Partyventura con sistema de gestión completo, seguridad avanzada y panel de administración.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Documentación](#-documentación)
- [Seguridad](#-seguridad)
- [Tecnologías](#-tecnologías)

## ✨ Características

### Frontend
- 🎨 Diseño moderno y responsivo con TailwindCSS
- 📱 Completamente adaptable a dispositivos móviles
- 🔐 Sistema de autenticación integrado
- 📊 Panel de administración completo

### Backend
- 🔒 Sistema de autenticación JWT con tokens seguros
- 🛡️ Protección contra ataques comunes (XSS, NoSQL Injection, etc.)
- 📊 API RESTful documentada
- 🚦 Rate limiting multinivel
- 💾 Base de datos MongoDB con Mongoose

## 📁 Estructura del Proyecto

```
WEB PARTYVENTURA/
│
├── 📂 backend/                          # Servidor Node.js + Express
│   ├── config/                          # Configuraciones
│   ├── controllers/                     # Lógica de negocio
│   ├── middleware/                      # Middlewares de seguridad
│   ├── models/                          # Modelos MongoDB
│   ├── routes/                          # Rutas de la API
│   ├── scripts/                         # Scripts de utilidad
│   └── server.js                        # Punto de entrada
│
├── 📂 frontend/                         # Aplicación web
│   ├── public/                          # Archivos públicos
│   │   ├── assets/                     # Recursos estáticos
│   │   │   └── icons/                  # Iconos (svg, png, jpg)
│   │   └── index.html                  # Página principal
│   │
│   ├── src/                             # Código fuente
│   │   ├── js/                         # JavaScript
│   │   │   ├── modules/                # Módulos (auth, config, utils)
│   │   │   └── pages/                  # Scripts por página
│   │   ├── styles/                     # Hojas de estilo
│   │   ├── admin.html                  # Panel de administración
│   │   └── login.html                  # Página de login
│   │
│   └── tailwind.config.js              # Configuración Tailwind
│
├── 📂 docs/                             # Documentación
├── 📂 scripts/                          # Scripts del proyecto
└── README.md                            # Este archivo
```

## 🔧 Requisitos Previos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB** >= 8.0
- **Cuenta de Gmail** (para envío de emails)

## 🚀 Instalación

### 1. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 2. Instalar dependencias del frontend (TailwindCSS)

```bash
cd ..
npm install
```

## ⚙️ Configuración

### 1. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend/`:

```bash
cd backend
cp .env.example .env
```

Edita con tus credenciales:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/partyventura
JWT_SECRET=tu_clave_secreta
JWT_EXPIRE=24h
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
CLIENT_URL=http://localhost:5500
```

### 2. Crear el primer administrador

```bash
cd backend
npm run init-admin
```

## 🎯 Uso

### Iniciar el backend

```bash
cd backend
npm run dev
```

Servidor disponible en: `http://localhost:5000`

### Iniciar el frontend

Usa Live Server de VS Code o cualquier servidor HTTP:

```bash
cd frontend/public
http-server -p 5500
```

### Acceder a la aplicación

- **Sitio público:** `http://localhost:5500`
- **Panel admin:** Abrir `frontend/src/admin.html` con Live Server
- **Login:** Abrir `frontend/src/login.html`
- **API:** `http://localhost:5000/api`

## 📚 Documentación

- **[docs/INICIO_RAPIDO.md](docs/INICIO_RAPIDO.md)** - Guía de inicio rápido
- **[docs/RESUMEN_FINAL.md](docs/RESUMEN_FINAL.md)** - Resumen completo
- **[backend/SECURITY.md](backend/SECURITY.md)** - Seguridad detallada
- **[frontend/src/AUTH_INTEGRATION.md](frontend/src/AUTH_INTEGRATION.md)** - Autenticación

## 🔒 Seguridad

Implementaciones de seguridad:

- ✅ JWT con expiración de 24h
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Rate limiting multinivel
- ✅ Protección XSS y NoSQL Injection
- ✅ Helmet headers
- ✅ CORS configurado
- ✅ Sistema de bloqueo por intentos fallidos

Ver detalles en: [backend/SECURITY.md](backend/SECURITY.md)

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcryptjs
- Helmet + Rate Limiting
- Nodemailer

### Frontend
- HTML5 + JavaScript Vanilla
- TailwindCSS
- localStorage para sesiones

## 🔄 Actualizaciones Recientes

### v2.0.0 - Reorganización Profesional (19 Oct 2025)
- ✅ Reestructuración completa del proyecto
- ✅ Separación frontend/backend clarificada
- ✅ Organización modular del código
- ✅ Documentación consolidada

### v1.0.0 - Sistema Completo (18 Oct 2025)
- ✅ Sistema de autenticación JWT
- ✅ Seguridad multinivel
- ✅ Panel de administración
- ✅ API RESTful

---

**Desarrollado con ❤️ para Partyventura**
