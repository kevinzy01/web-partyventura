# 📋 Sistema de Horarios Laborales - Guía de Implementación

## ✅ COMPLETADO - Backend (100%)

### 1. Modelo de Datos (`WorkSchedule.js`) ✓
- ✅ Esquema completo con validaciones
- ✅ Validación automática de horarios del parque
- ✅ Cálculo automático de horas totales
- ✅ Verificación de solapamientos
- ✅ Métodos estáticos para vistas semanales/mensuales
- ✅ Métodos para resúmenes y estadísticas

### 2. Controlador (`workScheduleController.js`) ✓
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Endpoints para empleados (solo lectura)
- ✅ Vista semanal con calendario
- ✅ Vista mensual con resumen
- ✅ Eliminación múltiple
- ✅ Filtros por empleado, fecha, mes, año, estado

### 3. Rutas y Validaciones (`workSchedules.js`) ✓
- ✅ Rutas protegidas con auth middleware
- ✅ Separación de permisos (superadmin vs empleado)
- ✅ Validaciones con express-validator
- ✅ Validaciones de formato de fecha/hora
- ✅ Validación de IDs MongoDB

### 4. Integración en Servidor ✓
- ✅ Rutas registradas en `server.js`
- ✅ Documentación completa en `API_DOCUMENTATION.md`

### 5. Documentación API ✓
- ✅ 12 endpoints documentados
- ✅ Ejemplos de request/response
- ✅ Códigos de error explicados
- ✅ Casos de uso descritos

---

## 🚧 PENDIENTE - Frontend

### 1. Interfaz en Panel Admin (admin.html)

**✅ Ya agregado:**
- Tab "Horarios Laborales" en navegación
- Estructura HTML completa de la sección
- Modal para asignar/editar horarios
- Filtros por empleado, mes, año, estado
- Tres vistas: Lista, Semanal, Mensual

**❌ Falta agregar en `/frontend/public/admin.js`:**

```javascript
// ==================== HORARIOS LABORALES ====================

// Variables globales
let currentView = 'list'; // list, week, month
let currentWeekDate = new Date();
let currentMonthDate = new Date();
let empleadosList = [];
let workSchedules = [];

// Inicialización
async function initWorkSchedules() {
  await loadEmpleados();
  populateYearFilter();
  setCurrentMonthYear();
  await loadWorkSchedules();
  setupWorkSchedulesEventListeners();
}

// Cargar lista de empleados para filtros y formulario
async function loadEmpleados() {
  try {
    const response = await fetch(`${API_URL}/admins`, {
      headers: Auth.getAuthHeaders()
    });
    
    const data = await response.json();
    if (data.success) {
      empleadosList = data.data.filter(u => u.rol === 'empleado');
      
      // Poblar select de filtro
      const filterSelect = document.getElementById('filterEmployee');
      filterSelect.innerHTML = '<option value="">Todos los empleados</option>';
      empleadosList.forEach(emp => {
        filterSelect.innerHTML += `<option value="${emp._id}">${emp.nombre}</option>`;
      });
      
      // Poblar select del formulario
      const formSelect = document.getElementById('wsEmpleado');
      formSelect.innerHTML = '<option value="">Seleccione un empleado</option>';
      empleadosList.forEach(emp => {
        formSelect.innerHTML += `<option value="${emp._id}">${emp.nombre}</option>`;
      });
    }
  } catch (error) {
    console.error('Error al cargar empleados:', error);
    showNotification('Error al cargar empleados', 'error');
  }
}

// Poblar años en filtro (desde 2024 hasta año actual + 1)
function populateYearFilter() {
  const currentYear = new Date().getFullYear();
  const yearSelect = document.getElementById('filterYear');
  yearSelect.innerHTML = '<option value="">Seleccione año</option>';
  
  for (let year = 2024; year <= currentYear + 1; year++) {
    yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
  }
}

// Establecer mes y año actuales en filtros
function setCurrentMonthYear() {
  const now = new Date();
  document.getElementById('filterMonth').value = now.getMonth() + 1;
  document.getElementById('filterYear').value = now.getFullYear();
}

// Cargar horarios con filtros
async function loadWorkSchedules() {
  try {
    const empleadoId = document.getElementById('filterEmployee').value;
    const mes = document.getElementById('filterMonth').value;
    const anio = document.getElementById('filterYear').value;
    const estado = document.getElementById('filterStatus').value;
    
    let url = `${API_URL}/work-schedules/all?`;
    if (empleadoId) url += `empleadoId=${empleadoId}&`;
    if (mes) url += `mes=${mes}&`;
    if (anio) url += `anio=${anio}&`;
    if (estado) url += `estado=${estado}&`;
    
    const response = await fetch(url, {
      headers: Auth.getAuthHeaders()
    });
    
    const data = await response.json();
    if (data.success) {
      workSchedules = data.data;
      renderCurrentView();
    } else {
      showNotification(data.message || 'Error al cargar horarios', 'error');
    }
  } catch (error) {
    console.error('Error al cargar horarios:', error);
    showNotification('Error al cargar horarios', 'error');
  }
}

// Renderizar vista actual
function renderCurrentView() {
  if (currentView === 'list') {
    renderListView();
  } else if (currentView === 'week') {
    renderWeekView();
  } else if (currentView === 'month') {
    renderMonthView();
  }
}

// Renderizar vista lista
function renderListView() {
  const tbody = document.getElementById('workSchedulesTableBody');
  
  if (workSchedules.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-12 text-center text-gray-500">
          <div class="text-6xl mb-4">📭</div>
          <p class="text-lg">No hay horarios asignados</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = workSchedules.map(ws => {
    const fecha = new Date(ws.fecha);
    const fechaStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    const estadoBadge = {
      'programado': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Programado</span>',
      'confirmado': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Confirmado</span>',
      'completado': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completado</span>',
      'cancelado': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cancelado</span>'
    };
    
    const turnoIcon = {
      'mañana': '🌅',
      'tarde': '🌆',
      'completo': '📅'
    };
    
    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4 text-sm text-gray-900 font-medium">${ws.empleado.nombre}</td>
        <td class="px-6 py-4 text-sm text-gray-600">${fechaStr}</td>
        <td class="px-6 py-4 text-sm text-gray-600 capitalize">${ws.diaSemana}</td>
        <td class="px-6 py-4 text-sm text-gray-900">${turnoIcon[ws.turno]} ${ws.turno}</td>
        <td class="px-6 py-4 text-sm text-gray-600">${ws.horaInicio} - ${ws.horaFin}</td>
        <td class="px-6 py-4 text-sm text-gray-900 font-semibold">${ws.horasTotales}h</td>
        <td class="px-6 py-4">${estadoBadge[ws.estado]}</td>
        <td class="px-6 py-4 text-center">
          <button onclick="editWorkSchedule('${ws.id}')" class="text-blue-600 hover:text-blue-800 mr-3" title="Editar">
            ✏️
          </button>
          <button onclick="deleteWorkSchedule('${ws.id}')" class="text-red-600 hover:text-red-800" title="Eliminar">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Crear nuevo horario
async function createWorkSchedule(formData) {
  try {
    const response = await fetch(`${API_URL}/work-schedules`, {
      method: 'POST',
      headers: {
        ...Auth.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Horario asignado exitosamente', 'success');
      closeWorkScheduleModal();
      await loadWorkSchedules();
    } else if (response.status === 409) {
      // Conflicto de solapamiento
      showNotification(`⚠️ Solapamiento detectado: El empleado ya tiene un turno de ${data.conflicto.horaInicio} a ${data.conflicto.horaFin}`, 'warning');
    } else {
      showNotification(data.message || 'Error al asignar horario', 'error');
    }
  } catch (error) {
    console.error('Error al crear horario:', error);
    showNotification('Error al asignar horario', 'error');
  }
}

// Editar horario existente
async function editWorkSchedule(id) {
  const ws = workSchedules.find(w => w.id === id);
  if (!ws) return;
  
  document.getElementById('workScheduleId').value = id;
  document.getElementById('wsEmpleado').value = ws.empleado.id;
  document.getElementById('wsFecha').value = ws.fecha.split('T')[0];
  document.getElementById('wsTurno').value = ws.turno;
  document.getElementById('wsHoraInicio').value = ws.horaInicio;
  document.getElementById('wsHoraFin').value = ws.horaFin;
  document.getElementById('wsEstado').value = ws.estado;
  document.getElementById('wsNotas').value = ws.notas || '';
  document.getElementById('wsColor').value = ws.color;
  document.getElementById('wsColorHex').value = ws.color;
  
  document.getElementById('modalWorkScheduleTitle').textContent = 'Editar Horario Laboral';
  document.getElementById('modalWorkSchedule').classList.remove('hidden');
  document.getElementById('modalWorkSchedule').classList.add('flex');
}

// Actualizar horario
async function updateWorkSchedule(id, formData) {
  try {
    const response = await fetch(`${API_URL}/work-schedules/${id}`, {
      method: 'PUT',
      headers: {
        ...Auth.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Horario actualizado exitosamente', 'success');
      closeWorkScheduleModal();
      await loadWorkSchedules();
    } else if (response.status === 409) {
      showNotification(`⚠️ Solapamiento detectado: El empleado ya tiene un turno en ese horario`, 'warning');
    } else {
      showNotification(data.message || 'Error al actualizar horario', 'error');
    }
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    showNotification('Error al actualizar horario', 'error');
  }
}

// Eliminar horario
async function deleteWorkSchedule(id) {
  const confirmed = await Swal.fire({
    title: '¿Eliminar horario?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280'
  });
  
  if (!confirmed.isConfirmed) return;
  
  try {
    const response = await fetch(`${API_URL}/work-schedules/${id}`, {
      method: 'DELETE',
      headers: Auth.getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Horario eliminado exitosamente', 'success');
      await loadWorkSchedules();
    } else {
      showNotification(data.message || 'Error al eliminar horario', 'error');
    }
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    showNotification('Error al eliminar horario', 'error');
  }
}

// Event Listeners
function setupWorkSchedulesEventListeners() {
  // Botón nuevo horario
  document.getElementById('btnNewWorkSchedule').addEventListener('click', () => {
    document.getElementById('formWorkSchedule').reset();
    document.getElementById('workScheduleId').value = '';
    document.getElementById('wsEstado').value = 'programado';
    document.getElementById('wsColor').value = '#f97316';
    document.getElementById('wsColorHex').value = '#f97316';
    document.getElementById('modalWorkScheduleTitle').textContent = 'Asignar Horario Laboral';
    document.getElementById('modalWorkSchedule').classList.remove('hidden');
    document.getElementById('modalWorkSchedule').classList.add('flex');
  });
  
  // Cerrar modal
  document.getElementById('btnCloseWorkScheduleModal').addEventListener('click', closeWorkScheduleModal);
  document.getElementById('btnCancelWorkSchedule').addEventListener('click', closeWorkScheduleModal);
  
  // Sincronizar color picker con input hex
  document.getElementById('wsColor').addEventListener('input', (e) => {
    document.getElementById('wsColorHex').value = e.target.value;
  });
  
  document.getElementById('wsColorHex').addEventListener('input', (e) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      document.getElementById('wsColor').value = e.target.value;
    }
  });
  
  // Contador de caracteres para notas
  document.getElementById('wsNotas').addEventListener('input', (e) => {
    document.getElementById('wsNotasCount').textContent = e.target.value.length;
  });
  
  // Submit formulario
  document.getElementById('formWorkSchedule').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      empleadoId: document.getElementById('wsEmpleado').value,
      fecha: document.getElementById('wsFecha').value,
      turno: document.getElementById('wsTurno').value,
      horaInicio: document.getElementById('wsHoraInicio').value,
      horaFin: document.getElementById('wsHoraFin').value,
      estado: document.getElementById('wsEstado').value,
      notas: document.getElementById('wsNotas').value,
      color: document.getElementById('wsColor').value
    };
    
    const id = document.getElementById('workScheduleId').value;
    
    if (id) {
      await updateWorkSchedule(id, formData);
    } else {
      await createWorkSchedule(formData);
    }
  });
  
  // Filtros
  document.getElementById('btnApplyFilters').addEventListener('click', loadWorkSchedules);
  document.getElementById('btnClearFilters').addEventListener('click', () => {
    document.getElementById('filterEmployee').value = '';
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterYear').value = '';
    document.getElementById('filterStatus').value = '';
    loadWorkSchedules();
  });
  
  // Cambio de vista
  document.getElementById('btnViewList').addEventListener('click', () => switchView('list'));
  document.getElementById('btnViewWeek').addEventListener('click', () => switchView('week'));
  document.getElementById('btnViewMonth').addEventListener('click', () => switchView('month'));
}

function switchView(view) {
  currentView = view;
  
  // Actualizar botones
  document.getElementById('btnViewList').classList.toggle('bg-blue-500', view === 'list');
  document.getElementById('btnViewList').classList.toggle('text-white', view === 'list');
  document.getElementById('btnViewList').classList.toggle('bg-gray-200', view !== 'list');
  document.getElementById('btnViewList').classList.toggle('text-gray-800', view !== 'list');
  
  document.getElementById('btnViewWeek').classList.toggle('bg-blue-500', view === 'week');
  document.getElementById('btnViewWeek').classList.toggle('text-white', view === 'week');
  document.getElementById('btnViewWeek').classList.toggle('bg-gray-200', view !== 'week');
  document.getElementById('btnViewWeek').classList.toggle('text-gray-800', view !== 'week');
  
  document.getElementById('btnViewMonth').classList.toggle('bg-blue-500', view === 'month');
  document.getElementById('btnViewMonth').classList.toggle('text-white', view === 'month');
  document.getElementById('btnViewMonth').classList.toggle('bg-gray-200', view !== 'month');
  document.getElementById('btnViewMonth').classList.toggle('text-gray-800', view !== 'month');
  
  // Mostrar/ocultar vistas
  document.getElementById('viewList').classList.toggle('hidden', view !== 'list');
  document.getElementById('viewWeek').classList.toggle('hidden', view !== 'week');
  document.getElementById('viewMonth').classList.toggle('hidden', view !== 'month');
  
  renderCurrentView();
}

function closeWorkScheduleModal() {
  document.getElementById('modalWorkSchedule').classList.add('hidden');
  document.getElementById('modalWorkSchedule').classList.remove('flex');
  document.getElementById('formWorkSchedule').reset();
}

// Agregar al switch de tabs existente
// Buscar la función que maneja los tabs y agregar:
case 'tabWorkSchedules':
  await initWorkSchedules();
  break;
```

### 2. Portal del Empleado (empleado.html)

**❌ Archivo completo por crear:**

Crear `/frontend/public/empleado.html` con:
- Sistema de login similar a admin
- Vista calendario personal (solo lectura)
- Filtros por semana/mes
- Resumen de horas del mes
- Exportación a PDF/ICS (opcional)

**Código base:**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal del Empleado - Partyventura</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body class="bg-gray-100">
  <!-- Header -->
  <header class="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
      <h1 class="text-white text-2xl font-bold">🎉 Partyventura - Portal del Empleado</h1>
      <button id="btnLogout" class="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
        Cerrar Sesión
      </button>
    </div>
  </header>

  <!-- Contenido Principal -->
  <main class="container mx-auto px-4 py-8">
    <!-- Información del empleado -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-2xl font-bold mb-4">Bienvenido, <span id="employeeName"></span></h2>
      <div id="monthSummary" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Resumen mensual -->
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow-md p-4 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="filterMonth" class="block text-sm font-semibold mb-2">Mes</label>
          <select id="filterMonth" class="w-full px-4 py-2 border rounded-lg">
            <option value="1">Enero</option>
            <!-- ... otros meses ... -->
          </select>
        </div>
        <div>
          <label for="filterYear" class="block text-sm font-semibold mb-2">Año</label>
          <select id="filterYear" class="w-full px-4 py-2 border rounded-lg">
            <!-- Generado dinámicamente -->
          </select>
        </div>
        <div class="flex items-end">
          <button id="btnFilter" class="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600">
            Filtrar
          </button>
        </div>
      </div>
    </div>

    <!-- Calendario de horarios -->
    <div class="bg-white rounded-xl shadow-lg p-6">
      <h3 class="text-xl font-bold mb-4">Mis Horarios</h3>
      <div id="scheduleCalendar">
        <!-- Calendario generado dinámicamente -->
      </div>
    </div>
  </main>

  <!-- Scripts -->
  <script src="/src/js/modules/config.js"></script>
  <script src="/src/js/modules/auth.js"></script>
  <script src="/src/js/pages/empleado.js"></script>
</body>
</html>
```

Crear `/frontend/src/js/pages/empleado.js` con la lógica de carga de horarios del empleado.

---

## 📝 Próximos Pasos

### Paso 1: Agregar JavaScript al Panel Admin
1. Abrir `/frontend/public/admin.js`
2. Copiar el código JavaScript proporcionado arriba
3. Integrarlo en la sección correspondiente
4. Agregar la llamada `initWorkSchedules()` en el switch de tabs

### Paso 2: Crear Portal del Empleado
1. Crear `empleado.html` con el template proporcionado
2. Crear `/frontend/src/js/pages/empleado.js`
3. Implementar funciones de carga y visualización

### Paso 3: Testing
1. Probar creación de horarios
2. Validar detección de solapamientos
3. Probar filtros
4. Verificar vistas semanal/mensual
5. Probar permisos por rol

### Paso 4: Mejoras Opcionales
- Drag and drop en vista semanal
- Notificaciones push a empleados
- Exportación de horarios a PDF/ICS
- Plantillas de horarios recurrentes
- Sistema de cambios de turno entre empleados

---

## 🔧 Configuración Necesaria

### Base de Datos
No requiere configuración adicional. El modelo se crea automáticamente al iniciar el servidor.

### Variables de Entorno
No requiere variables nuevas. Usa las configuraciones existentes.

### Permisos
- Solo usuarios con rol `superadmin` pueden gestionar horarios
- Empleados solo pueden ver sus propios horarios
- Admin tiene los mismos permisos que empleado en este módulo

---

## 📚 Documentación de Referencia

- **API Endpoints**: `/backend/API_DOCUMENTATION.md` (líneas 418-733)
- **Modelo**: `/backend/models/WorkSchedule.js`
- **Controlador**: `/backend/controllers/workScheduleController.js`
- **Rutas**: `/backend/routes/workSchedules.js`

---

## ✅ Checklist de Testing

### Backend
- [x] Modelo crea documentos correctamente
- [x] Validaciones de horario del parque funcionan
- [x] Detección de solapamientos operativa
- [x] Cálculo de horas automático
- [x] Endpoints CRUD responden correctamente
- [x] Permisos por rol implementados
- [x] Vistas semanales/mensuales generan datos correctos

### Frontend (Pendiente)
- [ ] Formulario de asignación funciona
- [ ] Validación frontend de horarios
- [ ] Vista lista muestra datos correctamente
- [ ] Vista semanal se genera correctamente
- [ ] Vista mensual con resumen funciona
- [ ] Filtros aplican correctamente
- [ ] Detección de solapamientos muestra alerta
- [ ] Modal se abre/cierra correctamente
- [ ] Sincronización de color picker
- [ ] Edición de horarios carga datos
- [ ] Eliminación solicita confirmación
- [ ] Portal empleado muestra horarios propios
- [ ] Empleado no puede editar horarios

---

## 🐛 Problemas Conocidos y Soluciones

### Problema: Error "Cannot read property 'classList' of null"
**Solución**: Verificar que todos los IDs en el HTML coincidan con los del JavaScript.

### Problema: Solapamientos no detectados
**Solución**: Verificar que las horas estén en formato HH:MM y que las fechas sean del mismo día.

### Problema: Vista semanal no muestra datos
**Solución**: Verificar que el endpoint `/work-schedules/weekly` devuelva datos en el formato esperado.

---

**Fecha de creación**: 30 de octubre de 2025  
**Versión**: 1.0  
**Estado**: Backend completo ✅ | Frontend pendiente ⏳
