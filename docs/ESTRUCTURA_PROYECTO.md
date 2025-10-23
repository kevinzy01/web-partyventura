# 📁 Estructura del Proyecto Partyventura - Documentación Completa

> **Actualizado:** 19 de octubre de 2025  
> **Versión:** 2.0.0 - Reorganización Profesional

## 📖 Índice

1. [Visión General](#visión-general)
2. [Estructura de Directorios](#estructura-de-directorios)
3. [Backend](#backend)
4. [Frontend](#frontend)
5. [Documentación](#documentación)
6. [Convenciones de Nombres](#convenciones-de-nombres)
7. [Flujo de Trabajo](#flujo-de-trabajo)

---

## 🎯 Visión General

Este proyecto ha sido reorganizado siguiendo las mejores prácticas de desarrollo web moderno, con una clara separación entre:

- **Backend**: API RESTful con Node.js/Express
- **Frontend**: Aplicación web con arquitectura modular
- **Documentación**: Centralizada en carpeta `docs/`
- **Scripts**: Herramientas de automatización

### Principios de Organización

✅ **Separación de responsabilidades** - Backend y Frontend independientes  
✅ **Modularidad** - Código organizado en módulos reutilizables  
✅ **Escalabilidad** - Fácil añadir nuevas funcionalidades  
✅ **Mantenibilidad** - Estructura clara y documentada  
✅ **Seguridad** - Archivos sensibles protegidos con .gitignore

---

## 📂 Estructura de Directorios

```
WEB PARTYVENTURA/
│
├── 📂 backend/                          # API y lógica del servidor
│   ├── 📂 config/                       # Configuraciones del sistema
│   │   ├── db.js                       # Conexión a MongoDB
│   │   └── email.js                    # Configuración de Nodemailer
│   │
│   ├── 📂 controllers/                  # Lógica de negocio
│   │   ├── authController.js           # Autenticación (login, logout, etc.)
│   │   ├── contactController.js        # Gestión de formulario de contacto
│   │   ├── newsController.js           # CRUD de noticias
│   │   └── newsletterController.js     # Gestión de suscripciones
│   │
│   ├── 📂 middleware/                   # Middlewares personalizados
│   │   ├── auth.js                     # Verificación JWT
│   │   ├── rateLimiter.js              # Control de tasa de peticiones
│   │   ├── sanitize.js                 # Sanitización de datos
│   │   └── security.js                 # Headers de seguridad (Helmet)
│   │
│   ├── 📂 models/                       # Modelos de MongoDB (Mongoose)
│   │   ├── Admin.js                    # Usuario administrador
│   │   ├── Contact.js                  # Mensajes de contacto
│   │   ├── News.js                     # Noticias publicadas
│   │   └── Newsletter.js               # Suscriptores del newsletter
│   │
│   ├── 📂 routes/                       # Definición de rutas de la API
│   │   ├── auth.js                     # /api/auth/* (login, logout, me)
│   │   ├── contact.js                  # /api/contact/* (crear, listar, etc.)
│   │   ├── news.js                     # /api/news/* (CRUD completo)
│   │   └── newsletter.js               # /api/newsletter/* (suscribir, listar)
│   │
│   ├── 📂 scripts/                      # Scripts de utilidad backend
│   │   └── initAdmin.js                # Crear primer administrador
│   │
│   ├── 📂 uploads/                      # Archivos subidos (imágenes, docs)
│   │   └── .gitkeep                    # Mantener carpeta en Git
│   │
│   ├── 📄 .env                          # Variables de entorno (NO EN GIT)
│   ├── 📄 .env.example                  # Plantilla de variables de entorno
│   ├── 📄 .gitignore                    # Archivos ignorados por Git
│   ├── 📄 package.json                  # Dependencias del backend
│   ├── 📄 package-lock.json             # Lockfile de dependencias
│   ├── 📄 server.js                     # Punto de entrada del servidor
│   ├── 📄 README.md                     # Documentación del backend
│   ├── 📄 SECURITY.md                   # Guía de seguridad detallada
│   └── 📄 SECURITY_SUMMARY.md           # Resumen de seguridad
│
├── 📂 frontend/                         # Aplicación web del cliente
│   │
│   ├── 📂 public/                       # Archivos públicos (servidos estáticamente)
│   │   │
│   │   ├── 📂 assets/                   # Recursos estáticos
│   │   │   ├── 📂 icons/               # Iconos del sitio
│   │   │   │   ├── ico/                # Favicons (.ico)
│   │   │   │   ├── jpg/                # Imágenes JPEG
│   │   │   │   ├── png/                # Imágenes PNG (logos)
│   │   │   │   └── svg/                # Iconos vectoriales
│   │   │   │
│   │   │   ├── 📂 images/              # Imágenes generales
│   │   │   └── 📂 styles/              # CSS compilado (si se usa build)
│   │   │
│   │   └── 📄 index.html                # Página principal pública
│   │
│   ├── 📂 src/                          # Código fuente del frontend
│   │   │
│   │   ├── 📂 js/                       # JavaScript
│   │   │   │
│   │   │   ├── 📂 modules/             # Módulos reutilizables
│   │   │   │   ├── auth.js            # Módulo de autenticación
│   │   │   │   │   • getToken()       # Obtener token de localStorage
│   │   │   │   │   • setToken()       # Guardar token
│   │   │   │   │   • authFetch()      # Fetch con autenticación
│   │   │   │   │   • logout()         # Cerrar sesión
│   │   │   │   │   • initGuard()      # Proteger rutas
│   │   │   │   │
│   │   │   │   ├── config.js          # Configuración global
│   │   │   │   │   • API_URL          # URL del backend
│   │   │   │   │
│   │   │   │   └── utils.js           # Utilidades generales
│   │   │   │       • formatDate()     # Formatear fechas
│   │   │   │       • showToast()      # Notificaciones
│   │   │   │       • validateEmail()  # Validación de email
│   │   │   │
│   │   │   ├── 📂 pages/               # Scripts específicos de cada página
│   │   │   │   ├── admin.js           # Lógica del panel de admin
│   │   │   │   │   • loadStats()      # Cargar estadísticas
│   │   │   │   │   • loadContacts()   # Listar contactos
│   │   │   │   │   • loadNews()       # Listar noticias
│   │   │   │   │   • handleLogout()   # Cerrar sesión
│   │   │   │   │
│   │   │   │   └── main.js            # Lógica de la página principal
│   │   │   │       • initCarousel()   # Inicializar carrusel
│   │   │   │       • handleContact()  # Enviar formulario
│   │   │   │       • loadNews()       # Cargar noticias
│   │   │   │
│   │   │   └── 📂 utils/               # Utilidades auxiliares (futuro)
│   │   │
│   │   ├── 📂 styles/                   # Hojas de estilo
│   │   │   ├── index.css              # Estilos compilados de Tailwind
│   │   │   ├── input.css              # Entrada de Tailwind (source)
│   │   │   └── styles.css             # Estilos personalizados
│   │   │
│   │   ├── 📄 admin.html                # Panel de administración
│   │   ├── 📄 login.html                # Página de login
│   │   ├── 📄 prueba1.html              # Página de pruebas
│   │   └── 📄 AUTH_INTEGRATION.md       # Documentación de autenticación
│   │
│   └── 📄 tailwind.config.js            # Configuración de TailwindCSS
│
├── 📂 docs/                             # Documentación centralizada
│   ├── 📄 AUDITORIA.md                  # Auditoría de seguridad
│   ├── 📄 ESTRUCTURA.md                 # Este archivo
│   ├── 📄 INICIO_RAPIDO.md              # Guía de inicio rápido
│   ├── 📄 PRUEBAS.md                    # Guía de pruebas
│   └── 📄 RESUMEN_FINAL.md              # Resumen completo del sistema
│
├── 📂 scripts/                          # Scripts de utilidad del proyecto
│   └── 📄 start.ps1                     # Script de inicio (PowerShell)
│
├── 📂 .vscode/                          # Configuración de VS Code (opcional)
│   └── settings.json                   # Ajustes del editor
│
├── 📂 node_modules/                     # Dependencias (NO EN GIT)
│
├── 📄 .gitignore                         # Archivos ignorados por Git
├── 📄 package.json                       # Dependencias del proyecto (Tailwind)
├── 📄 package-lock.json                  # Lockfile
└── 📄 README.md                          # Documentación principal del proyecto
```

---

## 🔧 Backend

### Arquitectura MVC

El backend sigue el patrón **MVC (Model-View-Controller)**:

- **Models** (`models/`): Esquemas de datos MongoDB
- **Views**: JSON responses (API RESTful)
- **Controllers** (`controllers/`): Lógica de negocio

### Capas de Seguridad

```
Petición HTTP
    ↓
security.js (Helmet headers)
    ↓
rateLimiter.js (Control de tasa)
    ↓
sanitize.js (Limpieza de datos)
    ↓
auth.js (Verificación JWT) [si es ruta protegida]
    ↓
Controller (Lógica de negocio)
    ↓
Model (Base de datos)
    ↓
Respuesta JSON
```

### Rutas de la API

| Ruta | Método | Protegido | Descripción |
|------|--------|-----------|-------------|
| `/api/auth/login` | POST | ❌ | Iniciar sesión |
| `/api/auth/logout` | POST | ✅ | Cerrar sesión |
| `/api/auth/me` | GET | ✅ | Obtener usuario actual |
| `/api/contact` | POST | ❌ | Enviar mensaje |
| `/api/contact` | GET | ✅ | Listar mensajes |
| `/api/contact/:id` | PUT | ✅ | Actualizar estado |
| `/api/contact/:id` | DELETE | ✅ | Eliminar mensaje |
| `/api/news` | GET | ❌ | Listar noticias |
| `/api/news` | POST | ✅ | Crear noticia |
| `/api/news/:id` | PUT | ✅ | Actualizar noticia |
| `/api/news/:id` | DELETE | ✅ | Eliminar noticia |
| `/api/newsletter` | POST | ❌ | Suscribirse |
| `/api/newsletter` | GET | ✅ | Listar suscriptores |
| `/api/newsletter/:id` | DELETE | ✅ | Eliminar suscriptor |

---

## 🎨 Frontend

### Arquitectura Modular

El frontend está organizado en módulos reutilizables:

#### **Módulos** (`src/js/modules/`)
- **auth.js**: Gestión de autenticación
- **config.js**: Configuración global
- **utils.js**: Utilidades generales

#### **Pages** (`src/js/pages/`)
- **admin.js**: Lógica del panel de administración
- **main.js**: Lógica de la página principal

### Flujo de Autenticación

```
1. Usuario abre login.html
2. Ingresa credenciales
3. JavaScript envía POST a /api/auth/login
4. Backend valida y devuelve JWT
5. Frontend guarda token en localStorage
6. Redirige a admin.html
7. admin.html ejecuta Auth.initGuard()
8. Si hay token válido, muestra panel
9. Todas las peticiones usan Auth.authFetch()
10. Al cerrar sesión, Auth.logout() limpia token
```

### Estilos

- **input.css**: Archivo fuente de Tailwind (directives @tailwind)
- **index.css**: Compilado de Tailwind con PostCSS
- **styles.css**: Estilos personalizados adicionales

### Recursos Estáticos

Los iconos están organizados por formato:

- **ico/**: Favicons para navegadores
- **png/**: Logos y recursos PNG
- **jpg/**: Imágenes fotográficas
- **svg/**: Iconos vectoriales escalables

---

## 📚 Documentación

Toda la documentación está centralizada en `docs/`:

| Archivo | Propósito |
|---------|-----------|
| `INICIO_RAPIDO.md` | Guía paso a paso para comenzar |
| `ESTRUCTURA.md` | Este archivo - estructura del proyecto |
| `RESUMEN_FINAL.md` | Resumen técnico completo |
| `AUDITORIA.md` | Auditoría de seguridad |
| `PRUEBAS.md` | Guía de testing |

Documentación específica:
- `backend/README.md` - Documentación del backend
- `backend/SECURITY.md` - Seguridad detallada
- `frontend/src/AUTH_INTEGRATION.md` - Integración de autenticación

---

## 📝 Convenciones de Nombres

### Archivos
- **Minúsculas con guiones**: `auth-controller.js` ❌
- **camelCase**: `authController.js` ✅
- **Mayúsculas para docs**: `README.md`, `SECURITY.md` ✅

### Código JavaScript
- **Variables**: `camelCase` → `const userName = 'Kevin'`
- **Funciones**: `camelCase` → `function getUserData() {}`
- **Clases**: `PascalCase` → `class UserAdmin {}`
- **Constantes**: `UPPER_SNAKE_CASE` → `const API_URL = '...'`

### Rutas de la API
- **Recursos en plural**: `/api/news`, `/api/contacts`
- **Kebab-case**: `/api/newsletter-subscribers` (si es necesario)

---

## 🔄 Flujo de Trabajo

### Desarrollo Frontend

1. Editar archivos en `frontend/src/`
2. Si usas Tailwind, compilar CSS:
   ```bash
   npm run watch:css
   ```
3. Abrir con Live Server: `frontend/public/index.html`
4. Para admin: abrir `frontend/src/admin.html`

### Desarrollo Backend

1. Asegurarse de que MongoDB está corriendo
2. Editar código en `backend/`
3. Servidor se reinicia automáticamente (nodemon):
   ```bash
   cd backend
   npm run dev
   ```

### Añadir Nueva Funcionalidad

#### Backend
1. Crear modelo en `models/` (si es necesario)
2. Crear controlador en `controllers/`
3. Crear rutas en `routes/`
4. Registrar rutas en `server.js`
5. Proteger con middleware `auth.js` si es necesario

#### Frontend
1. Si es página nueva: crear HTML en `src/`
2. Si es módulo: crear JS en `src/js/modules/`
3. Si es página específica: crear JS en `src/js/pages/`
4. Actualizar imports en el HTML correspondiente

---

## 🚀 Mejoras Futuras

### Estructura
- [ ] Añadir carpeta `frontend/src/components/` para componentes reutilizables
- [ ] Crear `backend/utils/` para funciones auxiliares
- [ ] Añadir `backend/validators/` para validaciones de datos
- [ ] Implementar `frontend/src/js/services/` para llamadas a la API

### Tecnología
- [ ] Migrar a TypeScript para type safety
- [ ] Implementar bundler (Webpack/Vite) para optimización
- [ ] Añadir testing (Jest/Mocha para backend, Cypress para frontend)
- [ ] Implementar CI/CD con GitHub Actions

### Funcionalidades
- [ ] Sistema de upload de imágenes
- [ ] Paginación en listados
- [ ] Búsqueda y filtros avanzados
- [ ] Dashboard con gráficos
- [ ] Multi-idioma (i18n)

---

## 📞 Soporte

Si tienes dudas sobre la estructura:

1. Revisa esta documentación
2. Consulta el README principal
3. Verifica los comentarios en el código
4. Revisa la documentación específica en `docs/`

---

**Última actualización:** 19 de octubre de 2025  
**Mantenido por:** Equipo Partyventura
