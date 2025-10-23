# 🎬 TUTORIAL PASO A PASO CON CAPTURAS

## 🚀 MÉTODO MÁS FÁCIL: Usar el Script Automático

### ✨ **Solo 3 Pasos:**

1. **Buscar el archivo:**
   ```
   📁 WEB PARTYVENTURA
      └─ 📄 SETUP-NGROK.bat
   ```

2. **Doble clic** en `SETUP-NGROK.bat`

3. **Seguir las instrucciones** que aparecen en pantalla

---

## 📖 TUTORIAL MANUAL (Si prefieres hacerlo tú mismo)

### **PASO 1: Abrir Primera Terminal** ⌨️

1. Presionar `Windows + R`
2. Escribir: `cmd`
3. Presionar Enter
4. Copiar y pegar:
   ```
   cd "C:\Users\kevin\Documents\WEB PARTYVENTURA\backend"
   ```
5. Presionar Enter
6. Copiar y pegar:
   ```
   npm start
   ```
7. Presionar Enter

**✅ Resultado esperado:**
```
🚀 Servidor escuchando en puerto 5000
📊 Entorno: development
🗄️  Conectado a MongoDB Atlas
```

⚠️ **¡NO CERRAR ESTA VENTANA!** Dejar corriendo.

---

### **PASO 2: Abrir Segunda Terminal** ⌨️

1. Presionar `Windows + R` de nuevo
2. Escribir: `cmd`
3. Presionar Enter
4. Copiar y pegar:
   ```
   ngrok http 5000
   ```
5. Presionar Enter

**✅ Resultado esperado:**
```
ngrok

Session Status                online
Account                       tu-email@gmail.com
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://a1b2-1234-5678.ngrok-free.app -> http://localhost:5000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

📋 **COPIAR la URL de "Forwarding":**
```
https://a1b2-1234-5678.ngrok-free.app
       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
       ESTA ES TU URL - ¡CÓPIALA!
```

⚠️ **¡NO CERRAR ESTA VENTANA!** Dejar corriendo.

---

### **PASO 3: Abrir VS Code (o tu editor)** 💻

1. Abrir VS Code
2. Abrir carpeta: `WEB PARTYVENTURA`
3. Buscar archivo:
   ```
   📁 frontend
      └─ 📁 src
         └─ 📁 js
            └─ 📁 modules
               └─ 📄 config.js  ← ESTE ARCHIVO
   ```

---

### **PASO 4: Editar config.js** ✏️

**Cambio 1 - Línea 8:**

❌ **ANTES:**
```javascript
const MODE = 'development'; // Cambiar a 'production' cuando uses Ngrok
```

✅ **DESPUÉS:**
```javascript
const MODE = 'production'; // Cambiar a 'production' cuando uses Ngrok
```

---

**Cambio 2 - Líneas 18-19:**

❌ **ANTES:**
```javascript
production: {
  // ⚠️ ACTUALIZA ESTAS URLs CON TU URL DE NGROK
  // Ejemplo: 'https://a1b2-c3d4-e5f6.ngrok-free.app'
  api: 'TU_URL_DE_NGROK_AQUI/api',
  server: 'TU_URL_DE_NGROK_AQUI'
}
```

✅ **DESPUÉS:** (usando TU URL copiada)
```javascript
production: {
  // ⚠️ ACTUALIZA ESTAS URLs CON TU URL DE NGROK
  // Ejemplo: 'https://a1b2-c3d4-e5f6.ngrok-free.app'
  api: 'https://a1b2-1234-5678.ngrok-free.app/api',      // ← PEGAR AQUÍ + /api
  server: 'https://a1b2-1234-5678.ngrok-free.app'         // ← PEGAR AQUÍ (sin /api)
}
```

⚠️ **IMPORTANTE:**
- ✅ Incluir `https://` al inicio
- ✅ Primera línea (api) lleva `/api` al final
- ✅ Segunda línea (server) NO lleva nada al final
- ❌ NO poner `/` al final de server

---

**Cambio 3 - Guardar:**

1. Presionar `Ctrl + S` para guardar
2. ✅ Verificar que se guardó (punto desaparece del nombre del archivo)

---

### **PASO 5: Probar en PC (Opcional)** 🖥️

Antes de probar en móvil, puedes verificar que funcione en tu PC:

1. Abrir navegador (Chrome/Firefox)
2. Ir a: `https://a1b2-1234-5678.ngrok-free.app/admin.html`
   (reemplazar con TU URL)
3. Si ves el banner "Visit Site":
   - Hacer clic en "Visit Site"
   - Hacer clic en "Continue"
4. Deberías ver el panel de administración

✅ **Si funciona en PC, funcionará en móvil**

---

### **PASO 6: Acceder desde Móvil** 📱

1. **Desbloquear tu móvil**
2. **Abrir navegador** (Chrome, Safari, Firefox, etc.)
3. **Escribir en la barra de direcciones:**
   ```
   https://a1b2-1234-5678.ngrok-free.app/admin.html
   ```
   (reemplazar con TU URL)

4. **Presionar Enter/Ir**

5. **Si ves el banner "Visit Site":**
   - ✅ Hacer clic en **"Visit Site"**
   - ✅ Hacer clic en **"Continue"** o **"Continuar"**

6. **¡Listo!** 🎉 Deberías ver el panel de administración

---

## 📸 Capturas de Pantalla (Qué Esperar)

### **Pantalla 1: Banner de Ngrok**
```
┌─────────────────────────────────────┐
│   ngrok                             │
│                                     │
│   You are about to visit:           │
│   https://a1b2.ngrok-free.app       │
│                                     │
│   This site is served by ngrok      │
│                                     │
│   [Visit Site]                      │  ← HACER CLIC AQUÍ
└─────────────────────────────────────┘
```

---

### **Pantalla 2: Advertencia de Ngrok**
```
┌─────────────────────────────────────┐
│   Warning                           │
│                                     │
│   This site may not be safe         │
│                                     │
│   [Go Back]  [Continue]             │  ← HACER CLIC EN Continue
└─────────────────────────────────────┘
```

---

### **Pantalla 3: Panel de Admin** ✅
```
┌─────────────────────────────────────┐
│  🎉 Panel de Administración         │
│  ────────────────────────────       │
│                                     │
│  👤 Kevin Zhou                      │
│      Super Administrador            │
│                                     │
│  📊 Total Noticias       0          │
│  ✉️  Mensajes Nuevos     0          │
│  👥 Total Contactos      1          │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ Checklist de Verificación

Antes de acceder desde móvil:

### **En PC:**
- [ ] Terminal 1: Backend corriendo (puerto 5000)
- [ ] Terminal 2: Ngrok corriendo
- [ ] URL de ngrok copiada
- [ ] config.js editado:
  - [ ] MODE = 'production'
  - [ ] api con https:// y /api
  - [ ] server con https:// sin /api
- [ ] Archivo guardado (Ctrl + S)

### **En Móvil:**
- [ ] Navegador abierto
- [ ] URL completa escrita
- [ ] Banner de ngrok superado
- [ ] Panel visible

---

## 🆘 Problemas Comunes

### ❌ "No se puede acceder al sitio"

**Solución:**
1. Verificar que backend esté corriendo
2. Verificar que ngrok esté corriendo
3. Verificar que la URL sea correcta (https://, no http://)

---

### ❌ "Página sin estilos / se ve rara"

**Solución:**
1. Cerrar pestañas del navegador móvil
2. Limpiar caché (Settings > Privacy > Clear Data)
3. Intentar en modo incógnito
4. Verificar que MODE = 'production' en config.js

---

### ❌ "API no responde / Errores en consola"

**Solución:**
1. Verificar URL en config.js:
   - ✅ api: 'https://xxx.ngrok-free.app/api'  (con /api)
   - ✅ server: 'https://xxx.ngrok-free.app'   (sin /api)
2. Verificar que ambas tengan https:// (no http://)
3. Ver logs en terminal del backend

---

### ❌ "Banner de ngrok no se quita"

**Solución:**
- ✅ Es normal, hacer clic en "Visit Site" → "Continue"
- ✅ Solo aparece la primera vez
- ✅ Puedes agregar a favoritos después

---

## 🔄 Volver a Localhost

Cuando termines de probar en móvil:

1. **Doble clic en:** `switch-to-development.bat`

   **O manualmente:**
   1. Abrir `config.js`
   2. Cambiar línea 8:
      ```javascript
      const MODE = 'development';
      ```
   3. Guardar (Ctrl + S)

---

## 💾 Guardar URL de Ngrok (Opcional)

Si quieres reutilizar la misma URL:

1. Crear archivo: `mi-url-ngrok.txt`
2. Pegar tu URL dentro
3. La próxima vez, solo copiar desde ahí

⚠️ **Nota:** La URL cambia cada vez que reinicias ngrok (versión gratis)

---

## 🎯 Resumen Ultra Rápido

```
1. cd backend && npm start           (Terminal 1)
2. ngrok http 5000                   (Terminal 2)
3. Copiar URL de ngrok
4. Editar config.js:
   - MODE = 'production'
   - Pegar URL en production.api y production.server
5. Guardar (Ctrl + S)
6. Abrir en móvil: https://tu-url.ngrok-free.app/admin.html
7. Click "Visit Site" → "Continue"
8. ¡Listo! 🎉
```

---

¿Algún paso no te quedó claro? ¡Dime en cuál estás y te ayudo! 🚀
