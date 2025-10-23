# 🔒 GUÍA DE SEGURIDAD - PARTYVENTURA BACKEND

## 📋 Índice
1. [Medidas de Seguridad Implementadas](#medidas-implementadas)
2. [Configuración Inicial](#configuración-inicial)
3. [Sistema de Autenticación](#autenticación)
4. [Protección de Rutas](#protección-de-rutas)
5. [Rate Limiting](#rate-limiting)
6. [Mejores Prácticas](#mejores-prácticas)

---

## 🛡️ Medidas de Seguridad Implementadas

### 1. **Headers de Seguridad (Helmet.js)**
- ✅ Content Security Policy (CSP)
- ✅ Protección contra Clickjacking
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ Prevención de MIME Type Sniffing
- ✅ XSS Filter del navegador activado
- ✅ Header X-Powered-By oculto

### 2. **Sanitización de Datos**
- ✅ Protección contra NoSQL Injection
- ✅ Prevención de HTTP Parameter Pollution (HPP)
- ✅ Sanitización de strings (eliminación de HTML/JS malicioso)
- ✅ Validación con express-validator

### 3. **Rate Limiting**
- ✅ Límite general: 100 peticiones/15min por IP
- ✅ Login: 5 intentos/15min
- ✅ Contacto: 5 mensajes/hora
- ✅ Newsletter: 3 suscripciones/hora
- ✅ Creación de contenido: 20 items/hora

### 4. **Autenticación JWT**
- ✅ Tokens firmados con secret
- ✅ Expiración configurable (24h por defecto)
- ✅ Middleware de autenticación
- ✅ Protección de rutas admin

### 5. **Gestión de Contraseñas**
- ✅ Hashing con bcryptjs (10 rounds)
- ✅ Bloqueo temporal tras 5 intentos fallidos
- ✅ Contraseñas nunca retornadas en queries

### 6. **CORS Configurado**
- ✅ Orígenes permitidos específicos
- ✅ Credenciales habilitadas
- ✅ Métodos HTTP controlados

### 7. **Logging de Seguridad**
- ✅ Detección de patrones sospechosos
- ✅ Registro de intentos de Path Traversal
- ✅ Alertas de XSS y SQL/NoSQL Injection

---

## ⚙️ Configuración Inicial

### 1. Instalar Dependencias
```bash
cd backend
npm install
```

### 2. Configurar Variables de Entorno
Edita el archivo `.env` con tus valores:

```env
JWT_SECRET=cambia_este_valor_por_uno_super_seguro
EMAIL_PASS=tu_contraseña_de_aplicación_gmail
```

**Generar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Crear Primer Administrador
```bash
npm run init-admin
```

Sigue las instrucciones en pantalla para crear el usuario admin.

---

## 🔐 Sistema de Autenticación

### Login
**POST** `/api/auth/login`

```json
{
  "username": "admin",
  "password": "tu_contraseña"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "...",
      "username": "admin",
      "email": "admin@partyventura.com",
      "nombre": "Administrador",
      "rol": "admin"
    }
  }
}
```

### Obtener Información del Usuario
**GET** `/api/auth/me`

Headers:
```
Authorization: Bearer <token>
```

### Cambiar Contraseña
**POST** `/api/auth/change-password`

Headers:
```
Authorization: Bearer <token>
```

Body:
```json
{
  "passwordActual": "contraseña_actual",
  "passwordNuevo": "nueva_contraseña"
}
```

### Logout
**POST** `/api/auth/logout`

Headers:
```
Authorization: Bearer <token>
```

---

## 🔒 Protección de Rutas

### Rutas Públicas (Sin autenticación)
- `POST /api/contact` - Enviar mensaje de contacto
- `POST /api/newsletter` - Suscribirse al newsletter
- `GET /api/news` - Obtener todas las noticias
- `GET /api/news/:id` - Obtener noticia específica

### Rutas Privadas (Requieren JWT)
- `GET /api/contact` - Listar mensajes
- `GET /api/contact/:id` - Ver mensaje
- `PUT /api/contact/:id` - Actualizar mensaje
- `DELETE /api/contact/:id` - Eliminar mensaje
- `GET /api/newsletter` - Listar suscriptores
- `POST /api/news` - Crear noticia
- `PUT /api/news/:id` - Actualizar noticia
- `DELETE /api/news/:id` - Eliminar noticia

### Uso del Token
Todas las rutas privadas requieren el header:
```
Authorization: Bearer <tu_token_jwt>
```

---

## 🚦 Rate Limiting

### Límites por Endpoint

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| General (todas las rutas) | 100 peticiones | 15 minutos |
| `/api/auth/login` | 5 intentos | 15 minutos |
| `/api/contact` | 5 mensajes | 1 hora |
| `/api/newsletter` | 3 suscripciones | 1 hora |
| Creación de contenido | 20 items | 1 hora |

### Respuesta cuando se excede el límite:
```json
{
  "success": false,
  "message": "Demasiadas peticiones desde esta IP. Por favor, inténtalo más tarde."
}
```

---

## 📚 Mejores Prácticas

### 1. Variables de Entorno
- ❌ NUNCA subir `.env` a Git
- ✅ Usar `.env.example` como plantilla
- ✅ Generar JWT_SECRET único y largo
- ✅ Cambiar credenciales en producción

### 2. Contraseñas
- ✅ Mínimo 6 caracteres (recomendado 12+)
- ✅ Combinar mayúsculas, minúsculas, números y símbolos
- ✅ No reutilizar contraseñas
- ✅ Cambiar periódicamente

### 3. Tokens JWT
- ✅ Almacenar en localStorage/sessionStorage
- ✅ Incluir en header Authorization
- ✅ Manejar expiración (renovar o re-login)
- ✅ Limpiar al hacer logout

### 4. HTTPS en Producción
- ✅ Usar certificado SSL/TLS
- ✅ Forzar HTTPS (redirect HTTP → HTTPS)
- ✅ Activar HSTS
- ✅ Configurar CSP correctamente

### 5. Monitoreo
- ✅ Revisar logs de seguridad regularmente
- ✅ Detectar patrones de ataque
- ✅ Configurar alertas para actividad sospechosa
- ✅ Mantener dependencias actualizadas

### 6. Base de Datos
- ✅ Hacer backups regulares
- ✅ Usar conexión autenticada
- ✅ Limitar acceso por IP (firewall)
- ✅ Encriptar datos sensibles

---

## 🚨 Respuesta a Incidentes

### Si detectas actividad sospechosa:

1. **Revisar logs** - Verificar `/backend` para alertas de seguridad
2. **Bloquear IP** - Agregar a lista negra si es necesario
3. **Cambiar credenciales** - JWT_SECRET, contraseñas admin
4. **Actualizar dependencias** - `npm audit fix`
5. **Notificar al equipo** - Comunicar el incidente

### Comandos útiles:
```bash
# Ver alertas de seguridad en tiempo real
npm run dev | grep "ALERTA DE SEGURIDAD"

# Auditar dependencias
npm audit

# Actualizar paquetes con vulnerabilidades
npm audit fix
```

---

## 📞 Soporte

Para reportar vulnerabilidades de seguridad, contacta a:
- Email: kevinzy01@gmail.com
- Asunto: [SEGURIDAD] Descripción breve

**No publiques vulnerabilidades en issues públicos.**

---

## 📝 Changelog de Seguridad

### v1.0.0 (2025-01-19)
- ✅ Implementación inicial de todas las medidas de seguridad
- ✅ Sistema de autenticación JWT completo
- ✅ Rate limiting en todos los endpoints críticos
- ✅ Sanitización de datos y validación
- ✅ Headers de seguridad con Helmet
- ✅ Logging de actividad sospechosa

---

**Última actualización:** 19 de octubre de 2025
**Versión:** 1.0.0
