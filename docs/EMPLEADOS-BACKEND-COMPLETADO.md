# ✅ Backend Completado - Empleados

## 🎉 Cambios Aplicados en Backend

### 1. **Filtrado de Administradores**
```javascript
// GET /api/admins
// Ahora SOLO devuelve admins y superadmins
Admin.find({ rol: { $in: ['admin', 'superadmin'] } })
```

### 2. **Nuevos Endpoints para Empleados**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admins/empleados` | Listar todos los empleados |
| POST | `/api/admins/empleados` | Crear nuevo empleado |
| PUT | `/api/admins/empleados/:id` | Actualizar empleado |
| DELETE | `/api/admins/empleados/:id` | Eliminar empleado |

### 3. **Permisos**
- **Admins y Superadmins**: Pueden gestionar empleados
- **Empleados**: NO pueden acceder a gestión de empleados

---

## 🔄 DEBES REINICIAR EL BACKEND

```bash
cd backend
npm start
```

---

## 📋 Próximos Pasos - Frontend

### 1. **Agregar Tab "Empleados"**

En `admin.html`, agregar nuevo botón de tab después de "Administradores":

```html
<button data-tab="empleados" class="tab-button">
  <span class="material-icons">badge</span>
  Empleados
</button>
```

### 2. **Crear Sección de Empleados**

```html
<div id="empleados" class="tab-content hidden">
  <div class="flex justify-between items-center mb-6">
    <h2>Gestión de Empleados</h2>
    <button id="btnNuevoEmpleado" class="btn-primary">
      + Nuevo Empleado
    </button>
  </div>
  <div id="empleadosGrid"></div>
</div>
```

### 3. **Modal para Empleados**

Similar al modal de admins, pero con campos:
- Usuario
- Nombre completo
- Email (opcional)
- Contraseña
- Sin campo "Rol" (siempre será empleado)

### 4. **JavaScript para Empleados**

En `admin.js`, agregar funciones:

```javascript
// Cargar empleados
async function loadEmpleados() {
  const response = await Auth.authFetch(`${API_URL}/admins/empleados`);
  const data = await response.json();
  displayEmpleados(data.data);
}

// Crear empleado
async function createEmpleado(empleadoData) {
  const response = await Auth.authFetch(`${API_URL}/admins/empleados`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(empleadoData)
  });
}

// Similar para update y delete
```

---

## 🎨 Diferencias Visuales

### Administradores Tab:
- Muestra: Admins y Superadmins
- Badge: "Admin" o "Super Admin"
- Color: Naranja/Rojo

### Empleados Tab:
- Muestra: Solo empleados
- Badge: "Empleado"
- Color: Azul/Verde

---

## 🧪 Prueba Backend

**Con Postman o similar:**

```bash
# Listar empleados
GET https://tu-url.ngrok/api/admins/empleados
Headers: Authorization: Bearer YOUR_TOKEN

# Crear empleado
POST https://tu-url.ngrok/api/admins/empleados
Body: {
  "nombreUsuario": "juan",
  "nombre": "Juan Pérez",
  "password": "123456",
  "email": "juan@partyventura.com"
}
```

---

## ✅ Checklist

Backend:
- [x] Filtrar getAdmins para solo admins/superadmins
- [x] Crear getEmpleados
- [x] Crear createEmpleado
- [x] Crear updateEmpleado
- [x] Crear deleteEmpleado
- [x] Agregar rutas en routes/admins.js
- [ ] Reiniciar backend

Frontend (pendiente):
- [ ] Agregar tab "Empleados"
- [ ] Crear sección de empleados
- [ ] Crear modal para empleados
- [ ] Agregar funciones JavaScript
- [ ] Probar flujo completo

---

**¿Quieres que continúe con el frontend ahora?**
