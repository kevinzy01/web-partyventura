# 🚀 GUÍA DE INICIO RÁPIDO - PARTYVENTURA

## ⚡ Inicio en 3 Pasos

### 1️⃣ Instalar MongoDB
```powershell
# Descarga MongoDB Community Edition
https://www.mongodb.com/try/download/community

# Después de instalarlo, MongoDB se iniciará automáticamente
```

### 2️⃣ Configurar Email
Edita el archivo `backend/.env`:
```env
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion_de_gmail
ADMIN_EMAIL=email_donde_recibiras_mensajes@gmail.com
```

**Cómo obtener contraseña de aplicación de Gmail:**
1. Ve a https://myaccount.google.com/security
2. Activa "Verificación en dos pasos"
3. Ve a "Contraseñas de aplicaciones"
4. Genera una nueva para "Mail"
5. Copia esa contraseña de 16 caracteres a `EMAIL_PASS`

### 3️⃣ Iniciar Todo
```powershell
# Opción A: Script automático (recomendado)
.\start.ps1

# Opción B: Manual
cd backend
npm install
npm run dev
```

## 🌐 Acceder al Sitio

Una vez iniciado el backend, abre en tu navegador:

- **Sitio Principal**: `http://localhost:5500/web/index.html`
- **Panel Admin**: `http://localhost:5500/web/admin.html`
- **API**: `http://localhost:5000/api/health`

💡 **Tip**: Usa Live Server en VS Code para servir el frontend

## ✅ Verificar que Todo Funciona

### Backend
```powershell
# Debería responder con un JSON
curl http://localhost:5000/api/health
```

### MongoDB
```powershell
# Debería conectarse sin errores
mongosh
```

### Frontend
1. Abre `web/index.html` en el navegador
2. Espera 10 segundos → Debería aparecer el pop-up de newsletter
3. Prueba el formulario de contacto
4. Revisa tu email para la confirmación

### Panel de Administración
1. Abre `web/admin.html`
2. Crea una noticia de prueba
3. Sube una imagen
4. Guarda y verifica que aparece en `index.html`

## 🐛 Problemas Comunes

### "MongoDB no está corriendo"
```powershell
# Inicia MongoDB manualmente
mongod
```

### "No se envían emails"
- Revisa el archivo `.env`
- Verifica la contraseña de aplicación de Gmail
- Comprueba que tienes verificación en dos pasos activa

### "Error CORS en el navegador"
- Verifica que el backend esté en puerto 5000
- Comprueba que `FRONTEND_URL` en `.env` sea correcto

### "Imágenes no se suben"
- Verifica que existe la carpeta `backend/uploads/`
- Comprueba permisos de escritura

## 📝 Comandos Útiles

```powershell
# Backend
cd backend
npm install          # Instalar dependencias
npm start            # Iniciar (producción)
npm run dev          # Iniciar con auto-reload

# Compilar Tailwind CSS
npx tailwindcss -i ./web/input.css -o ./web/index.css --watch

# MongoDB
mongod               # Iniciar MongoDB
mongosh              # Abrir shell de MongoDB
```

## 🎯 Próximos Pasos

1. ✅ Configura tu email en `.env`
2. ✅ Crea algunas noticias de prueba
3. ✅ Personaliza colores y textos
4. 🔜 Fase 2: Sistema de reservas
5. 🔜 Fase 3: Dashboard y analytics

## 💡 Consejos

- Usa el panel de admin para gestionar contenido sin tocar código
- El pop-up de newsletter solo aparece una vez por sesión
- Las imágenes se limitan a 5MB
- Los emails se envían automáticamente al usar el formulario

## 📞 ¿Necesitas Ayuda?

Revisa:
- `README.md` - Documentación completa
- `backend/README.md` - Detalles de la API
- Consola del navegador - Errores de JavaScript
- Consola del backend - Errores del servidor

---

**¡Listo para empezar! 🚀**

Una vez configurado todo, el sitio estará completamente funcional con:
- ✅ Formulario de contacto con emails automáticos
- ✅ Newsletter con pop-up
- ✅ Sistema de noticias con panel admin
- ✅ Calendario de eventos
- ✅ Diseño responsive
