# Checklist de Testing - Sistema de Horarios Laborales

## ✅ Completado

### Backend
- ✅ Modelo `WorkSchedule` creado con validaciones automáticas
- ✅ Controlador con 12 endpoints implementados
- ✅ Rutas protegidas con autenticación y validación
- ✅ API documentada en `API_DOCUMENTATION.md`

### Frontend - HTML
- ✅ Tab "Horarios Laborales" agregado al menú de admin
- ✅ Sección completa con filtros y 3 vistas
- ✅ Modal de formulario con todos los campos
- ✅ Navegación entre vistas (Lista/Semana/Mes)

### Frontend - JavaScript
- ✅ Módulo completo agregado a `admin.js` (800+ líneas)
- ✅ Funciones CRUD implementadas (create, edit, update, delete)
- ✅ Tres funciones de renderizado (lista, semana, mes)
- ✅ Event listeners configurados
- ✅ Funciones globales exportadas

---

## 🧪 Testing Manual Pendiente

### 1. Pruebas de Autenticación y Permisos

#### Como Superadmin:
- [ ] Iniciar sesión como superadmin
- [ ] Verificar que aparece el tab "Horarios Laborales" en el menú
- [ ] Click en el tab y verificar que carga la sección
- [ ] Verificar que aparece el botón "➕ Asignar Horario"

#### Como Admin Regular:
- [ ] Iniciar sesión como admin (NO superadmin)
- [ ] Verificar que **NO** aparece el tab "Horarios Laborales"
- [ ] Intentar acceder directamente a la API: `GET /api/work-schedules/all`
- [ ] Debe retornar error 403 (Forbidden)

#### Como Empleado:
- [ ] Iniciar sesión como empleado
- [ ] Verificar que NO tiene acceso al panel de admin
- [ ] (Pendiente: Portal de empleado para ver propios horarios)

---

### 2. Pruebas de Carga de Datos

#### Carga Inicial:
- [ ] Abrir DevTools (F12) → Pestaña Console
- [ ] Activar tab "Horarios Laborales"
- [ ] Verificar en consola: `🔧 Inicializando Work Schedules...`
- [ ] Verificar en consola: `✅ Work Schedules inicializado`
- [ ] Verificar que los selectores de filtro se pueblan:
  - [ ] Filtro "Empleado" tiene opciones (todos los empleados con rol 'empleado')
  - [ ] Filtro "Mes" tiene mes actual seleccionado
  - [ ] Filtro "Año" tiene año actual seleccionado
- [ ] Verificar estado inicial:
  - [ ] Vista "Lista" está activa (botón azul)
  - [ ] Si no hay horarios: muestra emoji 📭 y mensaje "No hay horarios asignados"

#### Verificación de API:
- [ ] Abrir DevTools → Pestaña Network
- [ ] Recargar sección de horarios
- [ ] Verificar peticiones:
  - [ ] `GET /api/admins` - código 200
  - [ ] `GET /api/work-schedules/all?mes=X&anio=Y` - código 200
- [ ] Verificar headers de autenticación (`Authorization: Bearer <token>`)

---

### 3. Pruebas de Creación de Horarios

#### Caso Exitoso:
- [ ] Click en "➕ Asignar Horario"
- [ ] Verificar que modal se abre con título "Asignar Horario Laboral"
- [ ] Llenar formulario:
  - Empleado: Seleccionar empleado existente
  - Fecha: Hoy o fecha futura
  - Turno: "mañana"
  - Hora Inicio: 10:00
  - Hora Fin: 14:00
  - Estado: "programado"
  - Color: #f97316 (naranja)
  - Notas: "Turno de prueba"
- [ ] Verificar contador de caracteres (debe mostrar "17/500")
- [ ] Click en "Guardar"
- [ ] Verificar notificación: "✅ Horario asignado exitosamente"
- [ ] Verificar que modal se cierra
- [ ] Verificar que el nuevo horario aparece en la lista

#### Validación de Horarios del Parque:
**Lunes a Jueves** (17:00 - 22:00):
- [ ] Crear horario para un Lunes a las 16:00-17:00
- [ ] Debe mostrar error: "El horario no coincide con las horas de apertura del parque"
- [ ] Crear horario para un Martes a las 22:00-23:00
- [ ] Debe mostrar error (horario fuera de rango)
- [ ] Crear horario válido: Miércoles 17:00-22:00
- [ ] Debe guardarse exitosamente

**Viernes a Domingo** (10:00 - 22:00):
- [ ] Crear horario para un Viernes a las 09:00-10:00
- [ ] Debe mostrar error
- [ ] Crear horario válido: Sábado 10:00-14:00
- [ ] Debe guardarse exitosamente
- [ ] Crear horario válido: Domingo 18:00-22:00
- [ ] Debe guardarse exitosamente

#### Detección de Solapamientos:
- [ ] Crear horario: Empleado A, Viernes, 10:00-14:00, guardar
- [ ] Intentar crear: Empleado A, mismo Viernes, 12:00-16:00
- [ ] Debe mostrar notificación warning: "⚠️ Solapamiento detectado: El empleado ya tiene un turno de 10:00 a 14:00"
- [ ] Verificar que el segundo horario NO se guardó

#### Turnos Diferentes:
- [ ] Turno "mañana": 10:00-14:00 (4 horas)
- [ ] Turno "tarde": 17:00-22:00 (5 horas)
- [ ] Turno "completo": 10:00-22:00 (12 horas con descanso)
- [ ] Verificar que `horasTotales` se calcula automáticamente

---

### 4. Pruebas de Edición de Horarios

#### Editar Horario Existente:
- [ ] Click en el botón ✏️ de un horario en la lista
- [ ] Verificar que modal se abre con título "Editar Horario Laboral"
- [ ] Verificar que todos los campos están pre-llenados
- [ ] Cambiar hora de fin de 14:00 a 15:00
- [ ] Click en "Guardar"
- [ ] Verificar notificación: "✅ Horario actualizado exitosamente"
- [ ] Verificar que las horas totales se actualizaron (5h en vez de 4h)

#### Editar con Solapamiento:
- [ ] Editar un horario existente
- [ ] Cambiar hora de inicio para que solape con otro horario del mismo empleado
- [ ] Debe mostrar warning de solapamiento
- [ ] Verificar que no se guardó el cambio

---

### 5. Pruebas de Eliminación de Horarios

#### Eliminar Individual:
- [ ] Click en botón 🗑️ de un horario
- [ ] Verificar que aparece confirmación SweetAlert2: "¿Eliminar horario?"
- [ ] Click en "Cancelar"
- [ ] Verificar que el horario NO se eliminó
- [ ] Click nuevamente en 🗑️
- [ ] Click en "Sí, eliminar"
- [ ] Verificar notificación: "🗑️ Horario eliminado exitosamente"
- [ ] Verificar que el horario desapareció de la lista

---

### 6. Pruebas de Filtros

#### Filtro por Empleado:
- [ ] Crear horarios para 2 empleados diferentes
- [ ] Seleccionar Empleado A en filtro
- [ ] Click en "Aplicar Filtros"
- [ ] Verificar que solo se muestran horarios del Empleado A
- [ ] Seleccionar Empleado B
- [ ] Aplicar filtros
- [ ] Verificar que solo se muestran horarios del Empleado B

#### Filtro por Mes/Año:
- [ ] Crear horarios en diferentes meses (ej: Enero, Febrero, Marzo)
- [ ] Filtrar por "Mes: Febrero, Año: 2025"
- [ ] Verificar que solo se muestran horarios de Febrero 2025

#### Filtro por Estado:
- [ ] Crear horarios con diferentes estados (programado, confirmado, completado)
- [ ] Filtrar por "Estado: Confirmado"
- [ ] Verificar que solo se muestran horarios confirmados

#### Limpiar Filtros:
- [ ] Aplicar varios filtros
- [ ] Click en "Limpiar Filtros"
- [ ] Verificar que todos los selectores vuelven a su estado inicial
- [ ] Verificar que se muestran todos los horarios

---

### 7. Pruebas de Vista Semanal

#### Navegación:
- [ ] Cambiar a vista "Semana" (botón debe ponerse azul)
- [ ] Verificar que se muestra título: "Semana del XX ene al YY ene 2025"
- [ ] Verificar que se muestra calendario de 7 días (Lun-Dom)
- [ ] Click en "←" (semana anterior)
- [ ] Verificar que el título cambia a la semana anterior
- [ ] Click en "→" (semana siguiente) dos veces
- [ ] Verificar navegación correcta

#### Renderizado de Horarios:
- [ ] Crear varios horarios en diferentes días de la misma semana
- [ ] Cambiar a vista semanal
- [ ] Verificar que cada día muestra sus horarios correctamente
- [ ] Verificar que días sin horarios muestran "Sin horarios" en gris
- [ ] Verificar que días con horarios tienen fondo azul claro
- [ ] Verificar que las tarjetas de horarios muestran:
  - Nombre del empleado
  - Rango horario (10:00 - 14:00)
  - Tipo de turno y horas totales (mañana (4h))
  - Notas (si existen)
  - Borde izquierdo con color asignado

---

### 8. Pruebas de Vista Mensual

#### Navegación:
- [ ] Cambiar a vista "Mes" (botón debe ponerse azul)
- [ ] Verificar que se muestra título: "Enero 2025" (o mes actual)
- [ ] Click en "←" (mes anterior)
- [ ] Verificar que cambia a "Diciembre 2024"
- [ ] Click en "→" (mes siguiente) dos veces
- [ ] Verificar navegación correcta

#### Resumen Estadístico:
- [ ] Crear varios horarios en el mes actual
- [ ] Verificar que las 4 tarjetas de resumen muestran:
  - **Horas Totales**: Suma correcta de todas las horas (ej: 40h)
  - **Días de Trabajo**: Cantidad de días únicos con horarios (ej: 10)
  - **Turnos Asignados**: Cantidad total de horarios (ej: 12)
  - **Confirmados**: Cantidad de horarios con estado "confirmado" (ej: 5)

#### Tabla de Horarios:
- [ ] Verificar que la tabla muestra todos los horarios del mes
- [ ] Verificar columnas:
  - Fecha (formato: "lun, 23 ene")
  - Empleado (nombre completo)
  - Turno (tipo + horas, ej: "mañana (4h)")
  - Horario (10:00 - 14:00)
  - Estado (badge con color)
- [ ] Verificar orden cronológico (fechas más recientes primero o viceversa)

---

### 9. Pruebas de UI/UX

#### Modal:
- [ ] Verificar que modal se puede cerrar con:
  - Botón X (esquina superior derecha)
  - Botón "Cancelar"
  - Click fuera del modal (en el overlay)
- [ ] Verificar que al cerrar se resetea el formulario

#### Color Picker:
- [ ] Abrir modal de nuevo horario
- [ ] Cambiar color con el selector visual
- [ ] Verificar que el input hex se actualiza automáticamente
- [ ] Escribir manualmente un color hex válido (ej: #3b82f6)
- [ ] Verificar que el selector visual se actualiza
- [ ] Escribir un color inválido (ej: "azul")
- [ ] Verificar que el selector NO cambia

#### Contador de Caracteres:
- [ ] Escribir en el campo "Notas"
- [ ] Verificar que el contador actualiza en tiempo real
- [ ] Escribir más de 500 caracteres
- [ ] Verificar que el backend rechaza (límite 500)

#### Badges de Estado:
- [ ] Verificar colores correctos:
  - Programado: Amarillo 📅
  - Confirmado: Azul ✅
  - Completado: Verde 🎯
  - Cancelado: Rojo ❌

---

### 10. Pruebas de Errores y Edge Cases

#### Sin Empleados:
- [ ] Eliminar todos los empleados de la base de datos
- [ ] Recargar sección de horarios
- [ ] Verificar que los selectores muestran solo la opción default
- [ ] Intentar crear un horario
- [ ] Debe fallar con error de validación

#### Sin Conexión a Internet:
- [ ] Activar modo offline en DevTools
- [ ] Intentar cargar horarios
- [ ] Verificar notificación de error
- [ ] Intentar crear horario
- [ ] Verificar manejo de error

#### Respuestas 500 del Backend:
- [ ] Detener el servidor backend
- [ ] Intentar cargar horarios
- [ ] Verificar que muestra error en consola
- [ ] Verificar notificación de error al usuario

#### Datos Corruptos:
- [ ] Modificar manualmente un registro en MongoDB con datos inválidos
- [ ] Intentar cargar ese registro
- [ ] Verificar que la app no se rompe completamente
- [ ] Verificar que muestra error apropiado

---

### 11. Pruebas de Responsive (Opcional para Admin)

#### En Tablet (768px - 1024px):
- [ ] Reducir tamaño de ventana
- [ ] Verificar que la tabla de lista se ajusta
- [ ] Verificar que la vista semanal se adapta (grid de 7 columnas puede hacer scroll)
- [ ] Verificar que el modal se adapta al tamaño

#### En Móvil (<768px):
- [ ] Abrir en dispositivo móvil real o DevTools
- [ ] Verificar que todos los botones son clickeables
- [ ] Verificar que el modal ocupa el espacio adecuado
- [ ] *Nota: Panel de admin no está optimizado para móvil, pero debe ser funcional*

---

### 12. Pruebas de Rendimiento

#### Con Pocos Datos (1-10 horarios):
- [ ] Verificar que carga instantáneamente
- [ ] Verificar que las 3 vistas renderizan rápido

#### Con Datos Moderados (50-100 horarios):
- [ ] Crear 50+ horarios con script de seed
- [ ] Verificar tiempo de carga inicial
- [ ] Cambiar entre vistas (lista/semana/mes)
- [ ] Verificar que no hay lag perceptible

#### Con Muchos Datos (500+ horarios):
- [ ] Crear 500+ horarios (varios meses)
- [ ] Verificar si es necesario implementar paginación
- [ ] Verificar uso de memoria en DevTools → Performance
- [ ] Considerar optimizaciones si el rendimiento es pobre

---

## 🔧 Script de Datos de Prueba

```javascript
// Ejecutar en MongoDB Shell o Node.js para crear datos de prueba

// 1. Crear empleado de prueba (si no existe)
use partyventura;

db.admins.insertOne({
  nombre: "Juan Pérez",
  username: "jperez",
  email: "juan@test.com",
  password: "$2a$10$HASHEDPASSWORDHERE", // Hashear con bcrypt
  rol: "empleado",
  estaActivo: true,
  createdAt: new Date()
});

// 2. Crear varios horarios de prueba
const empleadoId = db.admins.findOne({ username: "jperez" })._id;

db.workschedules.insertMany([
  // Semana 1
  {
    empleado: empleadoId,
    fecha: new Date('2025-01-20'),
    diaSemana: 'lunes',
    turno: 'tarde',
    horaInicio: '17:00',
    horaFin: '22:00',
    horasTotales: 5,
    estado: 'confirmado',
    notas: 'Turno regular',
    color: '#f97316',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    empleado: empleadoId,
    fecha: new Date('2025-01-24'),
    diaSemana: 'viernes',
    turno: 'mañana',
    horaInicio: '10:00',
    horaFin: '14:00',
    horasTotales: 4,
    estado: 'programado',
    notas: '',
    color: '#3b82f6',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    empleado: empleadoId,
    fecha: new Date('2025-01-25'),
    diaSemana: 'sábado',
    turno: 'completo',
    horaInicio: '10:00',
    horaFin: '22:00',
    horasTotales: 12,
    estado: 'programado',
    notas: 'Turno de fin de semana',
    color: '#10b981',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);
```

---

## 📊 Checklist de Resultados

Después de completar todas las pruebas, llenar:

- [ ] Todas las funcionalidades básicas funcionan
- [ ] Validaciones del backend funcionan correctamente
- [ ] Detección de solapamientos funciona
- [ ] Las 3 vistas renderizan correctamente
- [ ] Filtros funcionan como se espera
- [ ] Permisos por rol están correctos
- [ ] Modal y formulario funcionan sin errores
- [ ] Notificaciones se muestran apropiadamente
- [ ] No hay errores en consola del navegador
- [ ] No hay warnings de TypeScript/ESLint
- [ ] Rendimiento es aceptable con datos reales

---

## ⏭️ Próximos Pasos

Una vez completado el testing del panel de admin:

1. **Portal de Empleado** (`empleado.html` + `empleado.js`)
   - Login con credenciales de empleado
   - Ver horarios asignados (solo propios)
   - Filtrar por mes/semana
   - Ver resumen mensual de horas
   - **Solo lectura** (sin crear/editar/eliminar)

2. **Mejoras Opcionales**:
   - Exportar horarios a PDF
   - Notificaciones push cuando se asigna nuevo horario
   - Vista de calendario interactivo (FullCalendar.js)
   - Drag & drop para reasignar horarios
   - Sistema de solicitud de cambios de turno

3. **Documentación**:
   - Actualizar `SISTEMA_HORARIOS_LABORALES.md` con resultados de testing
   - Agregar capturas de pantalla de las 3 vistas
   - Documentar casos de uso reales

---

## 🐛 Registro de Bugs Encontrados

| # | Descripción | Severidad | Estado | Solución |
|---|-------------|-----------|--------|----------|
| 1 | Ejemplo: Modal no cierra con ESC | Baja | Pendiente | Agregar event listener |
| 2 | ... | ... | ... | ... |

---

**Última Actualización**: Enero 2025  
**Testeado por**: _[Nombre]_  
**Versión**: 1.0.0
