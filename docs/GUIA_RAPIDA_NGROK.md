# 🚀 GUÍA RÁPIDA - Ngrok para Partyventura

## ✅ CHECKLIST DE CONFIGURACIÓN

### 📥 Paso 1: Instalar Ngrok
- [ ] Descargar desde: https://ngrok.com/download
- [ ] Extraer `ngrok.exe` 
- [ ] Añadir al PATH (opcional)

### 🔑 Paso 2: Obtener Token
- [ ] Ir a: https://dashboard.ngrok.com/signup
- [ ] Crear cuenta gratuita
- [ ] Copiar token desde: https://dashboard.ngrok.com/get-started/your-authtoken

### ⚙️ Paso 3: Configurar Token (Solo 1 vez)
```powershell
ngrok config add-authtoken TU_TOKEN_AQUI
```

### 🖥️ Paso 4: Iniciar Backend
**Terminal 1:**
```powershell
cd "c:\Users\kevin\Documents\WEB PARTYVENTURA\backend"
npm run dev
```
✅ Debe decir: `Server running on port 5000`

### 🌐 Paso 5: Iniciar Ngrok
**Terminal 2:**
```powershell
ngrok http 5000
```
✅ Verás algo como:
```
Forwarding    https://a1b2-c3d4-e5f6.ngrok-free.app -> http://localhost:5000
```

### 📝 Paso 6: Copiar URL de Ngrok
Copia la URL completa, por ejemplo:
```
https://a1b2-c3d4-e5f6.ngrok-free.app
```

### 🔧 Paso 7: Actualizar Frontend
Edita el archivo:
```
frontend/src/js/modules/config.js
```

Cambia estas líneas:

**ANTES:**
```javascript
const MODE = 'development'; // Cambiar a 'production'

const CONFIG_URLS = {
  // ...
  production: {
    api: 'TU_URL_DE_NGROK_AQUI/api',
    server: 'TU_URL_DE_NGROK_AQUI'
  }
};
```

**DESPUÉS:**
```javascript
const MODE = 'production'; // ✅ Cambiado

const CONFIG_URLS = {
  // ...
  production: {
    api: 'https://a1b2-c3d4-e5f6.ngrok-free.app/api', // ✅ Tu URL
    server: 'https://a1b2-c3d4-e5f6.ngrok-free.app'  // ✅ Tu URL
  }
};
```

### 🌍 Paso 8: Abrir Frontend
Abre en tu navegador:
```
file:///c:/Users/kevin/Documents/WEB%20PARTYVENTURA/frontend/public/index.html
```

O usa **Live Server** en VS Code (recomendado)

### 📤 Paso 9: Compartir
Comparte el frontend con otras personas:
- Si usas Live Server: Comparte tu IP local + puerto
- Si compartes archivos: Envía toda la carpeta `frontend/public`
- El backend ya está en Ngrok (accesible desde internet)

---

## 🔄 CADA VEZ QUE REINICIAS NGROK

⚠️ **IMPORTANTE:** La URL de Ngrok cambia cada vez que lo reinicias

**Debes:**
1. ✅ Copiar la nueva URL de Ngrok
2. ✅ Actualizar `config.js` con la nueva URL
3. ✅ Recargar el navegador

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ "Ngrok not found"
**Solución:** Añade ngrok al PATH o usa la ruta completa:
```powershell
C:\ruta\donde\esta\ngrok\ngrok.exe http 5000
```

### ❌ "Port 5000 already in use"
**Solución:** Mata el proceso en el puerto 5000:
```powershell
netstat -ano | findstr :5000
taskkill /PID <numero_PID> /F
```

### ❌ "API URL no configurada"
**Solución:** Revisa la consola del navegador (F12), verás una advertencia.
Actualiza `config.js` con la URL correcta de Ngrok.

### ❌ "CORS Error"
**Solución:** Verifica que el backend permita requests desde cualquier origen.
Revisa `backend/src/server.js` - debe tener configurado CORS.

---

## 📊 VERIFICAR QUE TODO FUNCIONA

1. ✅ Backend corriendo: http://localhost:5000
2. ✅ Ngrok corriendo: Terminal muestra la URL
3. ✅ Config.js actualizado: MODE = 'production'
4. ✅ Frontend cargado: F12 → Console → Ver logs de configuración
5. ✅ API funcionando: Prueba el formulario de contacto

---

## 💡 CONSEJOS

- 🔐 **Cuenta Premium Ngrok:** URL fija que no cambia ($8/mes)
- 🚀 **Live Server:** Mejor que abrir el HTML directamente
- 📱 **Ngrok App:** Monitorea requests en https://dashboard.ngrok.com
- ⏰ **Límites Gratis:** 40 conexiones/min, sesiones de 2 horas máx
- 🔄 **Auto-reload:** Usa Live Server para recargar automáticamente

---

## 📞 COMPARTIR CON OTROS

### Opción 1: Enviar Archivos + URL de Ngrok
```
1. Comprime la carpeta: frontend/public
2. Envía el ZIP
3. Comparte la URL de Ngrok
4. La persona abre index.html en su navegador
```

### Opción 2: Hospedar Frontend en Vercel (Gratis)
```powershell
cd frontend/public
vercel
```
Te da una URL pública para el frontend.

### Opción 3: Todo en Producción
- Frontend: Vercel / Netlify
- Backend: Railway / Render
- Base de datos: MongoDB Atlas

---

¿Necesitas ayuda? Revisa NGROK_SETUP.md
