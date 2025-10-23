# 📂 ESTRUCTURA DEL PROYECTO - PARTYVENTURA

**Última actualización:** 19 de octubre de 2025

---

## 🌳 Árbol de Directorios

```
WEB PARTYVENTURA/
│
├── 📁 backend/                    # Servidor Node.js + Express
│   ├── 📁 config/
│   │   ├── database.js           # ✅ Conexión MongoDB (optimizado)
│   │   └── email.js              # Configuración Nodemailer
│   │
│   ├── 📁 controllers/
│   │   ├── contactController.js  # ✅ CRUD completo (actualizado)
│   │   ├── newsletterController.js
│   │   └── newsController.js
│   │
│   ├── 📁 models/
│   │   ├── Contact.js
│   │   ├── Newsletter.js
│   │   └── News.js
│   │
│   ├── 📁 routes/
│   │   ├── contact.js            # ✅ Rutas actualizadas
│   │   ├── newsletter.js
│   │   └── news.js
│   │
│   ├── 📁 middleware/
│   │   └── validate.js
│   │
│   ├── 📁 uploads/                # Imágenes subidas
│   │
│   ├── .env                       # Variables de entorno
│   ├── .env.example
│   ├── server.js                  # ✅ CORS actualizado
│   ├── package.json
│   └── README.md                  # ✅ Documentación actualizada
│
├── 📁 web/                        # Frontend
│   ├── index.html                 # ✅ Scripts reorganizados
│   ├── admin.html                 # ✅ Panel mejorado + Scripts
│   ├── index.css                  # Tailwind compilado
│   ├── input.css                  # ✅ Limpiado (sin duplicados)
│   ├── styles.css                 # ✅ Recreado sin duplicados
│   ├── main.js                    # ⚠️ Requiere revisión línea 321
│   ├── admin.js                   # Gestión completa
│   ├── config.js                  # ✅ NUEVO - Configuración
│   └── utils.js                   # ✅ NUEVO - Utilidades
│
├── 📁 iconos/
│   ├── ico/
│   ├── jpg/
│   ├── svg/
│   └── png/
│       └── logo-partyventura.png
│
├── 📁 .vscode/
│   └── settings.json
│
├── package.json                   # Dependencias Tailwind
├── tailwind.config.js
├── start.ps1                      # ✅ Script de inicio
├── README.md                      # Documentación principal
├── INICIO_RAPIDO.md
├── PRUEBAS.md
└── AUDITORIA.md                   # ✅ NUEVO - Reporte de auditoría

```

---

## 📊 INVENTARIO DE ARCHIVOS

### ✅ Archivos Optimizados (6)
1. `web/input.css` - Directivas limpias
2. `web/styles.css` - Sin duplicados, reorganizado
3. `backend/config/database.js` - Sin warnings
4. `backend/README.md` - Documentación completa
5. `web/index.html` - Scripts actualizados
6. `web/admin.html` - Scripts actualizados

### ✨ Archivos Nuevos (3)
1. `web/config.js` - Configuración centralizada
2. `web/utils.js` - Utilidades compartidas
3. `AUDITORIA.md` - Reporte completo de auditoría

### ⚠️ Archivos con Advertencias (1)
1. `web/main.js` - Línea 321 requiere revisión

---

## 📝 DEPENDENCIAS

### Backend (Node.js)
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.5.0",
  "nodemailer": "^6.9.4",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "express-validator": "^7.0.1",
  "multer": "^1.4.5-lts.1"
}
```

### Frontend
- **Tailwind CSS 3.x** (CDN + compilación local)
- **JavaScript ES6+** (Vanilla JS, sin frameworks)

---

## 🔗 INTERCONEXIONES

### Frontend ↔ Backend

```
┌─────────────┐         HTTP/CORS          ┌─────────────┐
│   index.html│◄────────────────────────────┤  server.js  │
│   admin.html│                             │   :5000     │
└──────┬──────┘                             └──────┬──────┘
       │                                           │
       ├── config.js (API_URL)                     │
       ├── utils.js (fetchAPI)                     │
       ├── main.js ───────────┐                    │
       └── admin.js           │                    │
                              │                    │
                              └────────► endpoints:│
                                        /api/contact
                                        /api/newsletter
                                        /api/news
```

### Base de Datos

```
┌────────────┐         Mongoose          ┌──────────────┐
│ MongoDB    │◄─────────────────────────►│  Models/     │
│ :27017     │                           │  - Contact   │
│ partyventura                           │  - Newsletter│
└────────────┘                           │  - News      │
                                         └──────────────┘
```

---

## 🚀 FLUJO DE INICIO

### Desarrollo
```powershell
# 1. Iniciar MongoDB y Backend
.\start.ps1

# 2. Abrir Frontend con Live Server
# Clic derecho en index.html → "Open with Live Server"
# URL: http://127.0.0.1:5500/web/index.html
```

### Producción
```powershell
# Backend
cd backend
npm start

# Frontend
# Servir archivos estáticos con Nginx/Apache
# o desde Express (agregar middleware estático)
```

---

## 📋 CHECKLIST DE DESPLIEGUE

### Backend
- [ ] Configurar variables de entorno (.env)
- [ ] Actualizar MONGODB_URI para producción
- [ ] Configurar EMAIL_USER y EMAIL_PASS
- [ ] Actualizar CORS origins
- [ ] Configurar puerto (PORT)
- [ ] Habilitar HTTPS
- [ ] Configurar rate limiting
- [ ] Agregar autenticación para rutas admin

### Frontend
- [ ] Actualizar API_URL en config.js
- [ ] Minificar JavaScript (build script)
- [ ] Optimizar imágenes (WebP, lazy loading)
- [ ] Compilar Tailwind para producción
- [ ] Configurar CDN para assets
- [ ] Habilitar Service Worker (PWA)
- [ ] Configurar meta tags SEO
- [ ] Verificar analytics

---

## 🔧 CONFIGURACIÓN RECOMENDADA

### Nginx (Servidor Web)
```nginx
server {
    listen 80;
    server_name partyventura.com;
    
    # Frontend
    location / {
        root /var/www/partyventura/web;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 (Process Manager)
```json
{
  "apps": [{
    "name": "partyventura-api",
    "script": "./backend/server.js",
    "instances": 2,
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production",
      "PORT": 5000
    }
  }]
}
```

---

## 📈 MÉTRICAS DEL PROYECTO

| Métrica | Valor |
|---------|-------|
| **Frontend** |  |
| Archivos HTML | 2 |
| Archivos JS | 4 (config, utils, main, admin) |
| Archivos CSS | 3 (index, input, styles) |
| Líneas de código JS | ~1,200 |
| **Backend** |  |
| Controladores | 3 |
| Modelos | 3 |
| Rutas | 3 |
| Endpoints API | 13 |
| Líneas de código | ~900 |
| **Database** |  |
| Colecciones | 3 |
| **Documentación** |  |
| Archivos MD | 5 |
| Páginas documentadas | ~15 |

---

## 🎯 OBJETIVOS CUMPLIDOS

✅ Backend Phase 1 completo  
✅ Frontend integrado con APIs  
✅ Panel de administración funcional  
✅ Sistema de contacto con emails  
✅ Newsletter con pop-up  
✅ Blog/Noticias con CRUD  
✅ Código optimizado y limpio  
✅ Documentación completa  
✅ Scripts de inicio automatizados  

---

## 🔮 PRÓXIMOS PASOS

### Phase 2 (Planificado)
- [ ] Sistema de reservas online
- [ ] Integración con pasarela de pago
- [ ] Calendario de disponibilidad
- [ ] Dashboard con analytics
- [ ] Sistema de autenticación
- [ ] Roles y permisos

### Optimizaciones Pendientes
- [ ] Lazy loading de imágenes
- [ ] Minificación de JS
- [ ] Migración de fetch a fetchAPI
- [ ] Tests unitarios
- [ ] CI/CD pipeline

---

*Para más detalles sobre cambios recientes, ver [AUDITORIA.md](AUDITORIA.md)*
