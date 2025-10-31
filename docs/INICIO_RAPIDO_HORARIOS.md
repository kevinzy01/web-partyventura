# 🚀 Inicio Rápido - Sistema de Horarios Laborales

## ⚡ Configuración en 5 Minutos

### 1️⃣ Verificar Requisitos Previos

```powershell
# Verificar MongoDB está corriendo
mongosh
# Si conecta exitosamente → ✅

# Verificar que tienes un superadmin creado
use partyventura
db.admins.findOne({ rol: 'superadmin' })
# Si retorna un documento → ✅
```

**Si NO tienes superadmin**:
```powershell
cd backend
npm run init-admin
# Seguir las instrucciones en consola
```

---

### 2️⃣ Iniciar el Sistema

```powershell
# Opción A: Script automatizado (recomendado)
.\scripts\start.ps1

# Opción B: Manual
cd backend
npm run dev
```

Esperar a ver:
```
✅ Servidor ejecutándose en puerto 5000
✅ MongoDB conectado exitosamente
```

---

### 3️⃣ Acceder al Panel de Horarios

1. Abrir navegador en: `http://localhost:5000/admin.html`
2. **Login como superadmin**:
   - Username: `admin` (o el que creaste)
   - Password: (la que configuraste)
3. En el menú superior, click en: **"Horarios Laborales"**

✅ Deberías ver la interfaz de horarios con:
- Panel de filtros arriba
- Botón "➕ Asignar Horario" (esquina superior derecha)
- Selector de vistas: Lista / Semana / Mes
- Mensaje: "No hay horarios asignados" (si es primera vez)

---

### 4️⃣ Crear Primer Empleado (si no existe)

**IMPORTANTE**: Necesitas al menos un usuario con rol `empleado` para asignar horarios.

#### Opción A: Desde Panel de Admin
1. En el menú, click en "Gestión de Empleados"
2. Click en "➕ Nuevo Empleado"
3. Llenar formulario:
   - Nombre: `Juan Pérez`
   - Username: `jperez`
   - Email: `juan@test.com`
   - Password: `test1234`
   - Rol: **`empleado`** ← ¡Importante!
4. Click en "Guardar"

#### Opción B: Desde MongoDB Shell
```javascript
use partyventura;

db.admins.insertOne({
  nombre: "Juan Pérez",
  username: "jperez",
  email: "juan@test.com",
  password: "$2a$10$XYZ...", // Hashear con bcrypt manualmente
  rol: "empleado",
  estaActivo: true,
  intentosFallidos: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

---

### 5️⃣ Crear Primer Horario

1. En "Horarios Laborales", click en **"➕ Asignar Horario"**

2. Llenar formulario modal:

   | Campo | Valor de Ejemplo |
   |-------|------------------|
   | **Empleado*** | Juan Pérez |
   | **Fecha*** | 2025-01-24 (un viernes) |
   | **Turno*** | mañana |
   | **Hora Inicio*** | 10:00 |
   | **Hora Fin*** | 14:00 |
   | **Estado*** | programado |
   | **Color** | #f97316 (naranja - default) |
   | **Notas** | "Mi primer turno de prueba" |

3. Click en **"Guardar"**

4. ✅ Deberías ver notificación: **"✅ Horario asignado exitosamente"**

5. El horario debe aparecer en la tabla:

   ```
   ┌────────────┬──────────┬─────────┬────────┬──────────┬───────┬────────────┬─────────┐
   │ Empleado   │ Fecha    │ Día     │ Turno  │ Horario  │ Horas │ Estado     │ Acciones│
   ├────────────┼──────────┼─────────┼────────┼──────────┼───────┼────────────┼─────────┤
   │ Juan Pérez │ 24/01/25 │ viernes │🌅mañana│ 10:00-   │  4h   │📅Programado│ ✏️ 🗑️  │
   │            │          │         │        │ 14:00    │       │            │         │
   └────────────┴──────────┴─────────┴────────┴──────────┴───────┴────────────┴─────────┘
   ```

---

### 6️⃣ Probar las 3 Vistas

#### Vista Lista (actual)
- ✅ Ya la estás viendo - tabla con todos los horarios

#### Vista Semana
1. Click en botón **"📅 Semana"**
2. Deberías ver calendario de 7 días (Lun-Dom)
3. El viernes debe mostrar tu horario en una tarjeta
4. Probar navegación: click en **←** y **→** para cambiar semana

#### Vista Mes
1. Click en botón **"📆 Mes"**
2. Deberías ver:
   - **4 tarjetas de resumen** arriba:
     - 🔵 Horas Totales: 4h
     - 🟢 Días de Trabajo: 1
     - 🟠 Turnos Asignados: 1
     - 🟣 Confirmados: 0
   - **Tabla** debajo con los horarios del mes
3. Probar navegación: click en **←** y **→** para cambiar mes

---

## 🧪 Verificación Rápida (5 Tests)

### ✅ Test 1: Validación de Horarios del Parque

**Intenta crear** horario inválido:
- Empleado: Juan Pérez
- Fecha: **Lunes** 27/01/2025
- Turno: mañana
- Hora Inicio: **16:00** ← Fuera de horario (Lun-Jue es 17:00-22:00)
- Hora Fin: 20:00

**Resultado esperado**: ❌ Error del backend (HTTP 400) - "El horario no coincide con las horas de apertura del parque"

**Intenta crear** horario válido:
- Fecha: **Lunes** 27/01/2025
- Hora Inicio: **17:00** ← Dentro de horario
- Hora Fin: **22:00**

**Resultado esperado**: ✅ "Horario asignado exitosamente"

---

### ✅ Test 2: Detección de Solapamientos

**Crear** primer horario:
- Empleado: Juan Pérez
- Fecha: Sábado 01/02/2025
- Hora: 10:00 - 14:00
- Guardar ✅

**Intentar crear** solapamiento:
- **Mismo empleado**: Juan Pérez
- **Misma fecha**: Sábado 01/02/2025
- Hora: **12:00 - 16:00** ← Se solapa con el anterior

**Resultado esperado**: ⚠️ "Solapamiento detectado: El empleado ya tiene un turno de 10:00 a 14:00"

---

### ✅ Test 3: Editar Horario

1. Click en ✏️ del horario del viernes
2. Cambiar **Hora Fin** de 14:00 → **15:00**
3. Guardar
4. **Resultado esperado**: 
   - ✅ "Horario actualizado exitosamente"
   - Horas Totales cambian de **4h** → **5h**

---

### ✅ Test 4: Filtros

**Crear** varios horarios:
- Empleado A → Febrero 2025
- Empleado A → Marzo 2025
- Empleado B → Febrero 2025

**Probar filtro**:
1. Seleccionar: Mes = Febrero, Año = 2025
2. Click en "Aplicar Filtros"
3. **Resultado esperado**: Solo se muestran horarios de Febrero (2 horarios)

**Limpiar**:
1. Click en "Limpiar Filtros"
2. **Resultado esperado**: Se muestran todos los horarios nuevamente (3)

---

### ✅ Test 5: Eliminar Horario

1. Click en 🗑️ de un horario
2. Aparece confirmación: "¿Eliminar horario?"
3. Click en **"Cancelar"** → Horario permanece
4. Click nuevamente en 🗑️
5. Click en **"Sí, eliminar"**
6. **Resultado esperado**: 
   - ✅ "🗑️ Horario eliminado exitosamente"
   - Horario desaparece de la lista

---

## 🎯 ¿Todo Funcionó?

Si completaste los 5 tests exitosamente:

### ✅ Sistema 100% Funcional

**Siguiente paso**: Ver checklist completo de testing en:
```
/docs/TESTING_HORARIOS_LABORALES.md
```

**Documentación completa**:
```
/docs/RESUMEN_HORARIOS_LABORALES.md
/docs/SISTEMA_HORARIOS_LABORALES.md
```

---

## 🆘 Problemas Comunes

### ❌ "No hay empleados en el selector"

**Causa**: No existen usuarios con rol `empleado`

**Solución**: Seguir paso 4️⃣ arriba para crear empleado

---

### ❌ "Error al cargar horarios"

**Causa**: Backend no está ejecutándose o MongoDB caído

**Solución**:
```powershell
# Verificar backend
netstat -ano | findstr :5000
# Si no hay output → Backend no está corriendo

# Iniciar backend
cd backend
npm run dev

# Verificar MongoDB
mongosh
# Si no conecta → Iniciar servicio MongoDB
net start MongoDB
```

---

### ❌ "Error 403 Forbidden"

**Causa**: Usuario no es superadmin

**Solución**:
```javascript
// Verificar rol en MongoDB
use partyventura;
db.admins.findOne({ username: "TU_USERNAME" });
// Si rol !== 'superadmin' → cambiar:
db.admins.updateOne(
  { username: "TU_USERNAME" },
  { $set: { rol: 'superadmin' } }
);
```

---

### ❌ Modal no se abre

**Causa**: Error de JavaScript

**Solución**:
1. Abrir DevTools (F12) → Pestaña **Console**
2. Buscar errores en rojo
3. Verificar que `/src/js/pages/admin.js` se cargó correctamente
4. Si hay error tipo "undefined is not a function" → revisar `/docs/TESTING_HORARIOS_LABORALES.md` sección 10

---

### ❌ "Las vistas no cambian"

**Causa**: Event listeners no se registraron

**Solución**:
```javascript
// En DevTools Console, verificar:
typeof switchWorkSchedulesView
// Debe retornar: "function"

// Si retorna "undefined":
// 1. Recargar página con Ctrl + Shift + R
// 2. Verificar que el tab "Horarios Laborales" se activó al menos una vez
// 3. Verificar consola: debe aparecer "✅ Work Schedules inicializado"
```

---

## 📞 Soporte

Si ninguna solución funciona:

1. **Revisar logs del backend** en la terminal donde ejecutaste `npm run dev`
2. **Revisar DevTools Console** en el navegador (F12)
3. **Captura de pantalla** del error y buscar en:
   - `/docs/TESTING_HORARIOS_LABORALES.md` (sección 10: Edge Cases)
   - `/docs/RESUMEN_HORARIOS_LABORALES.md` (sección Mantenimiento)

---

## 🎓 Aprendizaje Rápido

### Flujo de Datos

```
┌──────────────┐
│  FRONTEND    │
│  (admin.js)  │
└──────┬───────┘
       │ fetch() con JWT token
       ↓
┌──────────────────────────────┐
│  BACKEND API                 │
│  /api/work-schedules/*       │
└──────┬───────────────────────┘
       │ auth middleware
       │ requireSuperAdmin
       ↓
┌──────────────────────────────┐
│  CONTROLLER                  │
│  workScheduleController.js   │
└──────┬───────────────────────┘
       │ Mongoose queries
       ↓
┌──────────────────────────────┐
│  MODEL                       │
│  WorkSchedule.js             │
│  (validaciones pre-save)     │
└──────┬───────────────────────┘
       │ save()
       ↓
┌──────────────────────────────┐
│  DATABASE                    │
│  MongoDB - workschedules     │
└──────────────────────────────┘
```

### Endpoints Más Usados

| Acción | Método | Endpoint | Body |
|--------|--------|----------|------|
| Listar horarios | GET | `/api/work-schedules/all?mes=1&anio=2025` | - |
| Crear horario | POST | `/api/work-schedules` | JSON con campos |
| Actualizar horario | PUT | `/api/work-schedules/:id` | JSON con campos |
| Eliminar horario | DELETE | `/api/work-schedules/:id` | - |
| Vista semanal | GET | `/api/work-schedules/weekly?fecha=2025-01-20` | - |
| Vista mensual | GET | `/api/work-schedules/monthly?mes=1&anio=2025` | - |

---

**¡Listo para producción!** 🚀

Última actualización: Enero 2025
