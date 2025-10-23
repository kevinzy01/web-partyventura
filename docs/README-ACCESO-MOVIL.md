# 📱 Guías de Acceso desde Móvil - Partyventura

## 🎯 ¿Qué necesitas hacer?

Quieres acceder al panel de administración desde tu móvil usando ngrok.

---

## ⚡ OPCIÓN RÁPIDA (Recomendado)

### **Windows PowerShell (Método Automático):**

1. **Click derecho** en `SETUP-NGROK.ps1`
2. Seleccionar **"Ejecutar con PowerShell"**
3. Seguir las instrucciones en pantalla
4. ¡Listo! 🎉

**O ejecutar en terminal:**
```powershell
.\SETUP-NGROK.ps1
```

---

### **Alternativa (Script .bat):**

1. **Doble click** en `SETUP-NGROK.bat`
2. Seguir las instrucciones
3. ¡Listo! 🎉

---

## 📚 GUÍAS DISPONIBLES

Hemos creado varias guías para ayudarte:

| Archivo | Descripción | Cuándo Usar |
|---------|-------------|-------------|
| 📄 `GUIA-RAPIDA-MOVIL.md` | Guía rápida y concisa | Si solo necesitas los pasos básicos |
| 📄 `TUTORIAL-COMPLETO-MOVIL.md` | Tutorial detallado paso a paso | Si es tu primera vez o quieres entender todo |
| 📄 `GUIA-NGROK-MOVIL.md` | Guía técnica completa | Si tienes problemas o quieres troubleshooting |

---

## 🔧 SCRIPTS AUTOMÁTICOS

### **Para Configurar Ngrok:**

| Script | Descripción |
|--------|-------------|
| `SETUP-NGROK.ps1` | Script PowerShell automático (Recomendado) |
| `SETUP-NGROK.bat` | Script CMD automático (Alternativa) |

**Qué hacen:**
1. ✅ Inician el backend automáticamente
2. ✅ Inician ngrok automáticamente
3. ✅ Te piden tu URL de ngrok
4. ✅ Configuran todo automáticamente
5. ✅ Te muestran las URLs para acceder

---

### **Para Volver a Localhost:**

| Script | Descripción |
|--------|-------------|
| `switch-to-development.ps1` | Volver a modo development (PowerShell) |
| `switch-to-development.bat` | Volver a modo development (CMD) |

**Úsalos cuando:**
- ❌ Termines de probar en móvil
- ❌ Quieras trabajar en localhost de nuevo

---

## 🚀 INICIO RÁPIDO (3 Pasos)

### **Si usas Windows PowerShell:**

1. **Ejecutar:**
   ```powershell
   .\SETUP-NGROK.ps1
   ```

2. **Copiar URL de ngrok** cuando te la pida

3. **Acceder desde móvil:**
   ```
   https://tu-url.ngrok-free.app/admin.html
   ```

---

### **Si prefieres Hacerlo Manual:**

Abre: `GUIA-RAPIDA-MOVIL.md` o `TUTORIAL-COMPLETO-MOVIL.md`

---

## 📖 ¿Qué Guía Leer?

### **🟢 Principiante** → `TUTORIAL-COMPLETO-MOVIL.md`
- Paso a paso con capturas
- Explicaciones detalladas
- Solución de problemas comunes

### **🟡 Intermedio** → `GUIA-RAPIDA-MOVIL.md`
- Pasos concisos
- Comandos directos
- Checklist rápido

### **🔴 Avanzado** → `GUIA-NGROK-MOVIL.md`
- Detalles técnicos
- Troubleshooting avanzado
- Debugging móvil

---

## ⚙️ ¿Qué Hace Cada Script?

### **SETUP-NGROK.ps1 / .bat**

```
1. Abre terminal → Inicia backend (npm start)
2. Abre terminal → Inicia ngrok (ngrok http 5000)
3. Te pide → URL de ngrok
4. Actualiza → config.js (MODE + URLs)
5. Te muestra → URLs para acceder desde móvil
```

### **switch-to-development.ps1 / .bat**

```
1. Abre → config.js
2. Cambia → MODE de 'production' a 'development'
3. Guarda → Archivo actualizado
4. Listo → Vuelves a localhost
```

---

## 🎯 Flujo de Trabajo Típico

### **Desarrollo Normal (en PC):**
```
1. cd backend
2. npm start
3. Abrir http://localhost:5000/admin.html
```

### **Probar en Móvil:**
```
1. Ejecutar SETUP-NGROK.ps1
2. Copiar URL de ngrok
3. Acceder desde móvil
4. Cuando termines: switch-to-development.ps1
```

---

## 🆘 Problemas Comunes

### ❌ "No puedo ejecutar scripts de PowerShell"

**Error:**
```
no se puede cargar porque la ejecución de scripts está deshabilitada
```

**Solución:**
```powershell
# Ejecutar PowerShell como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

O usar los scripts `.bat` en su lugar.

---

### ❌ "ngrok no se reconoce como comando"

**Solución:**
1. Descargar ngrok: https://ngrok.com/download
2. Instalar siguiendo las instrucciones
3. Reiniciar terminal

---

### ❌ "La página se ve sin estilos"

**Solución:**
1. Verificar que MODE = 'production' en config.js
2. Limpiar caché del navegador móvil
3. Probar en modo incógnito

---

## 📱 URLs de Acceso Móvil

Una vez configurado, estas son las URLs (reemplazar con tu URL de ngrok):

| Página | URL |
|--------|-----|
| 🏠 Home | `https://tu-url.ngrok-free.app/` |
| 📊 Admin | `https://tu-url.ngrok-free.app/admin.html` |
| 🔐 Login | `https://tu-url.ngrok-free.app/login.html` |

---

## 💡 Tips Importantes

### ✅ Hacer:
- Mantener terminales de backend y ngrok abiertas
- Ejecutar script cada vez que reinicies ngrok (URL cambia)
- Limpiar caché del móvil si algo no funciona

### ❌ No Hacer:
- Cerrar las terminales mientras trabajas
- Compartir tu URL de ngrok públicamente
- Olvidar volver a modo development cuando termines

---

## 📞 Checklist Final

Antes de acceder desde móvil:

- [ ] Backend corriendo
- [ ] Ngrok corriendo
- [ ] URL de ngrok copiada
- [ ] Script ejecutado O config.js editado manualmente
- [ ] MODE = 'production'
- [ ] URLs actualizadas en config.js

---

## 🎉 ¡Todo Listo!

Ahora solo necesitas:

1. **Ejecutar:** `SETUP-NGROK.ps1`
2. **Seguir** las instrucciones
3. **Acceder** desde tu móvil

¿Algún problema? Consulta `GUIA-NGROK-MOVIL.md` para troubleshooting.

---

**¡Disfruta accediendo a tu panel desde cualquier lugar! 🚀📱**
