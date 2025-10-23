# 🚀 Configuración de Ngrok para Partyventura

## Paso 1: Obtener tu token de Ngrok

1. Ve a: https://dashboard.ngrok.com/signup
2. Regístrate gratis con tu email
3. Una vez dentro, ve a: https://dashboard.ngrok.com/get-started/your-authtoken
4. Copia tu token de autenticación (algo como: `2abc123def456ghi789jkl`)

## Paso 2: Configurar Ngrok

Abre PowerShell como **Administrador** y ejecuta:

```powershell
# Navega a donde descargaste ngrok.exe
cd C:\ruta\donde\esta\ngrok

# Configura tu token (reemplaza TU_TOKEN con el que copiaste)
.\ngrok config add-authtoken TU_TOKEN_AQUI
```

## Paso 3: Iniciar el Backend

En una terminal PowerShell:

```powershell
cd "c:\Users\kevin\Documents\WEB PARTYVENTURA\backend"
npm run dev
```

Deberías ver: `Server running on port 5000`

## Paso 4: Iniciar Ngrok

En **OTRA** terminal PowerShell:

```powershell
cd C:\ruta\donde\esta\ngrok
.\ngrok http 5000
```

Verás algo como:
```
Forwarding    https://a1b2-c3d4-e5f6.ngrok-free.app -> http://localhost:5000
```

## Paso 5: Actualizar la configuración del Frontend

Copia la URL de Ngrok (ej: `https://a1b2-c3d4-e5f6.ngrok-free.app`) y actualiza el archivo:
`frontend/public/config.js`

Cambia:
```javascript
const API_URL = 'https://TU-URL-AQUI.ngrok-free.app';
```

## Paso 6: Abrir el Frontend

Abre en tu navegador:
```
file:///c:/Users/kevin/Documents/WEB%20PARTYVENTURA/frontend/public/index.html
```

O usa Live Server en VS Code.

## 📤 Compartir con Otras Personas

1. Comparte la URL de tu frontend (si usas Live Server o un servidor web)
2. O comparte los archivos HTML directamente
3. Las personas necesitarán internet para que funcione (el backend está en Ngrok)

## ⚠️ Notas Importantes

- La URL de Ngrok cambia cada vez que lo reinicias
- Mantén ambas terminales abiertas mientras quieras compartir
- La cuenta gratuita tiene límites de uso (suficiente para pruebas)
- Si la URL cambia, actualiza `config.js` de nuevo
