# 🔐 Guía de Acceso al Panel de Administración

**Proyecto:** Partyventura  
**Actualizado:** 19 de octubre de 2025

---

## 🎯 Opciones de Acceso Implementadas

### ✅ **1. Acceso Discreto en el Footer (IMPLEMENTADO)**

He añadido un punto discreto (•) en el copyright del footer que solo tú conoces:

**Ubicación:** Footer de la página principal  
**Apariencia:** Punto gris casi invisible  
**Funcionalidad:** Al pasar el cursor se vuelve más visible  
**Destino:** Lleva directamente a la página de login

**Características de seguridad:**
- ✅ Discreto - No llama la atención
- ✅ Tooltip al pasar el cursor: "Acceso administrador"
- ✅ Solo visible para quienes sepan que existe
- ✅ No indexable por motores de búsqueda (si se configura robots.txt)

---

## 🚀 Otras Formas de Acceso Recomendadas

### **2. Acceso Directo por URL**

La forma más simple y segura:

```
# Login
http://localhost:5500/src/login.html

# O directamente al admin (te redirigirá al login si no estás autenticado)
http://localhost:5500/src/admin.html
```

**Ventajas:**
- ✅ Sin enlaces públicos
- ✅ Solo tú conoces la URL
- ✅ Máxima seguridad
- ✅ Puedes guardarla como marcador

### **3. Marcador del Navegador (MUY RECOMENDADO)**

1. Abre: `http://localhost:5500/src/login.html`
2. Presiona `Ctrl + D` (Windows) o `Cmd + D` (Mac)
3. Nómbralo: "🔐 Partyventura Admin"
4. Guárdalo en tu barra de marcadores

**Ventajas:**
- ✅ Acceso con un solo clic
- ✅ Organizado y profesional
- ✅ Sin modificar el sitio público

### **4. Atajo de Teclado Secreto (OPCIONAL)**

Puedes añadir un código secreto con JavaScript que abra el login:

**Ejemplo:** Presionar `Ctrl + Shift + A` 3 veces rápido

```javascript
// Añadir al final de main.js
let adminKeyCount = 0;
let adminKeyTimer = null;

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    adminKeyCount++;
    
    clearTimeout(adminKeyTimer);
    adminKeyTimer = setTimeout(() => {
      adminKeyCount = 0;
    }, 2000);
    
    if (adminKeyCount === 3) {
      window.location.href = '../src/login.html';
      adminKeyCount = 0;
    }
  }
});
```

### **5. URL Personalizada Memorable (PRODUCCIÓN)**

En producción, puedes configurar una URL amigable:

```
https://tudominio.com/admin
https://tudominio.com/dashboard
https://tudominio.com/cp (control panel)
```

Redirige a la página de login mediante configuración del servidor.

---

## 🛡️ Mejores Prácticas de Seguridad

### ❌ **NO Hacer:**

- ❌ Enlace visible en el menú principal
- ❌ Enlace en el header o footer muy visible
- ❌ Texto como "Panel de Administración" visible
- ❌ URL predecibles como `/admin` sin protección
- ❌ Compartir la URL públicamente

### ✅ **SÍ Hacer:**

- ✅ Usar acceso discreto o URLs directas
- ✅ Guardar como marcador personal
- ✅ Mantener la URL privada
- ✅ Usar HTTPS en producción
- ✅ Implementar rate limiting (ya implementado)
- ✅ Usar contraseñas fuertes (ya implementado)
- ✅ Revisar logs de acceso regularmente

---

## 🔑 Credenciales Actuales

**Usuario:** kevin  
**Contraseña:** Kiwi287620012011  
**Email:** kevinzy01@gmail.com

**⚠️ IMPORTANTE:** 
- Cambia la contraseña periódicamente
- No compartas las credenciales
- Usa un gestor de contraseñas

---

## 📱 Acceso desde Diferentes Dispositivos

### **Desktop (Desarrollo)**
```
http://localhost:5500/src/login.html
```

### **Mobile en la misma red (Desarrollo)**
```
http://TU-IP-LOCAL:5500/src/login.html
# Ejemplo: http://192.168.1.100:5500/src/login.html
```

### **Producción**
```
https://tudominio.com/admin
# O la URL que configures
```

---

## 🚨 Qué Hacer si Olvidas la Contraseña

1. **Opción 1: Restablecer desde MongoDB**
   ```bash
   cd backend
   node scripts/initAdmin.js
   # Crear nuevo administrador o actualizar existente
   ```

2. **Opción 2: Cambiar directamente en la base de datos**
   ```javascript
   // En MongoDB Compass o CLI
   use partyventura
   db.admins.updateOne(
     { nombreUsuario: "kevin" },
     { $set: { 
       password: await bcrypt.hash("NuevaContraseña", 10)
     }}
   )
   ```

3. **Opción 3: Crear nuevo admin**
   ```bash
   cd backend
   npm run init-admin
   # Seguir las instrucciones
   ```

---

## 📊 Monitoreo de Accesos

Para ver quién ha intentado acceder al admin:

1. Revisa los logs del backend
2. MongoDB guarda intentos fallidos en el modelo Admin
3. Campo `intentosFallidos` y `bloqueadoHasta`

```javascript
// En MongoDB
db.admins.find({ intentosFallidos: { $gt: 0 } })
```

---

## 🎨 Personalización del Acceso Discreto

Si quieres cambiar el símbolo discreto en el footer:

**Símbolos alternativos:**
- `•` - Punto (actual)
- `⚙` - Engranaje
- `⋯` - Tres puntos
- `▪` - Cuadrado pequeño
- `◆` - Diamante

**Modificar en:** `frontend/public/index.html` línea ~748

---

## 🔄 Actualización de URLs en Producción

Cuando subas a producción, actualiza:

1. **frontend/src/js/modules/config.js**
   ```javascript
   const API_URL = 'https://api.tudominio.com/api';
   ```

2. **Configura redirección en el servidor**
   ```nginx
   # Nginx ejemplo
   location /admin {
     return 301 /src/login.html;
   }
   ```

3. **Actualiza el enlace discreto**
   ```html
   <a href="/src/login.html">•</a>
   ```

---

## 💡 Recomendación Final

Para **desarrollo:**
- ✅ Usa el **marcador del navegador** (más rápido)
- ✅ Mantén la URL como marcador

Para **producción:**
- ✅ Usa **URL personalizada** + HTTPS
- ✅ Considera **2FA** en el futuro
- ✅ Monitorea los **logs de acceso**

---

## 📞 Soporte

Si tienes problemas de acceso:

1. Verifica que el backend esté corriendo
2. Verifica las credenciales
3. Revisa si estás bloqueado (5 intentos fallidos)
4. Espera 30 minutos si estás bloqueado
5. O resetea con `npm run init-admin`

---

**¡Acceso seguro y profesional implementado!** 🔐
