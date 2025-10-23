# 🎉 Partyventura - Sitio Web Completo

Sitio web profesional para Partyventura, el parque de trampolines más grande de la ciudad. Incluye frontend responsive y backend completo con API REST.

## 📋 Características Implementadas

### ✅ Frontend
- Diseño responsive (móvil-first)
- Navegación horizontal con scroll en móvil
- Carrusel automático de precios
- Galería de imágenes con lightbox
- Formulario de contacto con validación
- Pop-up de suscripción a newsletter
- Calendario de eventos
- Animaciones y transiciones suaves
- Integración completa con backend

### ✅ Backend (Fase 1)
- **API de Contacto**: Formulario con validación, envío de emails automáticos
- **API de Newsletter**: Sistema de suscripción con confirmación por email
- **Sistema de Blog**: CRUD completo para noticias con upload de imágenes
- **Panel de Administración**: Interfaz web para gestionar contenido
- Base de datos MongoDB
- Validación de datos
- Manejo de errores
- CORS configurado

## 🚀 Instalación Rápida

### 1. Clonar/Descargar el Proyecto
```powershell
cd "c:\Users\kevin\Documents\WEB PARTYVENTURA"
```

### 2. Instalar MongoDB
Descarga e instala MongoDB Community Edition:
https://www.mongodb.com/try/download/community

Inicia MongoDB:
```powershell
mongod
```

### 3. Configurar Backend
```powershell
cd backend
npm install
```

Configura las variables de entorno en `.env`:
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

### 4. Configurar Email (Gmail)
1. Ve a tu cuenta de Google → Seguridad
2. Activa la verificación en dos pasos
3. Genera una "Contraseña de aplicación" para Mail
4. Usa esa contraseña en `EMAIL_PASS` del `.env`

### 5. Iniciar el Backend
```powershell
cd backend
npm run dev
```

El servidor estará en: http://localhost:5000

### 6. Abrir el Frontend
Abre `web/index.html` con Live Server en VS Code o cualquier servidor local.

Recomendado: Live Server en puerto 5500

## 📁 Estructura del Proyecto

```
WEB PARTYVENTURA/
├── backend/                    # Backend Node.js + Express
│   ├── config/                # Configuraciones (BD, email)
│   ├── controllers/           # Lógica de negocio
│   ├── middleware/            # Validaciones, upload
│   ├── models/                # Schemas de MongoDB
│   ├── routes/                # Rutas de la API
│   ├── uploads/               # Imágenes subidas
│   ├── .env                   # Variables de entorno
│   ├── .env.example           # Ejemplo de configuración
│   ├── package.json
│   ├── README.md
│   └── server.js              # Servidor principal
│
├── web/                       # Frontend
│   ├── admin.html             # Panel de administración
│   ├── admin.js               # Lógica del panel admin
│   ├── index.html             # Página principal
│   ├── main.js                # Lógica principal
│   ├── index.css              # Tailwind compilado
│   ├── input.css              # Tailwind source
│   └── styles.css             # Estilos personalizados
│
├── iconos/                    # Recursos gráficos
│   ├── jpg/
│   ├── png/
│   └── svg/
│
├── package.json               # Dependencias raíz
├── tailwind.config.js         # Config de Tailwind
└── README.md                  # Este archivo
```

## 🎯 Uso del Sistema

### Frontend (Usuario)
1. Abre `http://localhost:5500/web/index.html`
2. Navega por las secciones
3. El pop-up de newsletter aparecerá después de 10 segundos
4. Usa el formulario de contacto para enviar mensajes
5. Las noticias se cargan automáticamente desde la API

### Panel de Administración
1. Abre `http://localhost:5500/web/admin.html`
2. Gestiona noticias:
   - ➕ Crear nueva noticia
   - ✏️ Editar noticia existente
   - 🗑️ Eliminar noticia
   - 📸 Subir/cambiar imágenes

## 📡 Endpoints de la API

### Contacto
- `POST /api/contact` - Enviar mensaje
- `GET /api/contact` - Obtener mensajes (Admin)
- `PATCH /api/contact/:id/read` - Marcar como leído

### Newsletter
- `POST /api/newsletter` - Suscribirse
- `GET /api/newsletter` - Listar suscriptores (Admin)
- `DELETE /api/newsletter/:email` - Darse de baja

### Noticias
- `GET /api/news` - Obtener noticias
- `GET /api/news/:idOrSlug` - Obtener noticia específica
- `POST /api/news` - Crear noticia (Admin)
- `PUT /api/news/:id` - Actualizar noticia (Admin)
- `DELETE /api/news/:id` - Eliminar noticia (Admin)

### Health Check
- `GET /api/health` - Estado de la API

## 🔧 Scripts Disponibles

### Backend
```powershell
cd backend
npm start      # Modo producción
npm run dev    # Modo desarrollo (con nodemon)
```

### Frontend (Tailwind)
```powershell
npx tailwindcss -i ./web/input.css -o ./web/index.css --watch
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- HTML5 + CSS3
- JavaScript ES6+
- Tailwind CSS 3.x
- Fetch API

### Backend
- Node.js 18+
- Express 4.x
- MongoDB + Mongoose
- Nodemailer (emails)
- Multer (upload de archivos)
- Express Validator
- CORS

## 🐛 Solución de Problemas

### Backend no inicia
- Verifica que MongoDB esté corriendo: `mongod`
- Revisa el archivo `.env`
- Comprueba que el puerto 5000 esté libre

### Emails no se envían
- Verifica las credenciales de Gmail en `.env`
- Asegúrate de usar una "Contraseña de aplicación"
- Revisa que la verificación en dos pasos esté activa

### Imágenes no se suben
- Verifica que la carpeta `backend/uploads/` exista
- Comprueba permisos de escritura
- Límite de tamaño: 5MB por imagen

### Frontend no se conecta al backend
- Verifica que el backend esté corriendo en el puerto 5000
- Revisa la consola del navegador para errores CORS
- Comprueba la variable `API_URL` en `main.js` y `admin.js`

## 📝 Próximas Fases

### Fase 2 (Planificada)
- Sistema de reservas online
- Integración con pasarela de pago (Stripe/PayPal)
- Calendario de disponibilidad en tiempo real
- Sistema de códigos de descuento

### Fase 3 (Planificada)
- Dashboard completo con estadísticas
- Gestión de usuarios y roles
- Reportes y analytics
- Sistema de notificaciones push

## 🔐 Seguridad

- Validación de datos en backend y frontend
- Sanitización de inputs
- Protección contra inyección SQL (MongoDB)
- CORS configurado
- Límites de tamaño de archivos
- Variables de entorno para datos sensibles

## 📞 Contacto y Soporte

Para reportar bugs o solicitar nuevas funcionalidades, contacta con el equipo de desarrollo.

## 📄 Licencia

Copyright © 2025 Partyventura. Todos los derechos reservados.

---

**Versión**: 1.0.0 (Fase 1)  
**Última actualización**: Octubre 2025  
**Estado**: ✅ Producción
