// Verificar autenticación
if (!Auth.isAuthenticated()) {
  window.location.href = 'login.html';
}

// Variables globales
let ultimoRegistro = null;
let intervaloClock = null;

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.getUser();
  
  // Verificar que sea empleado
  if (user.rol !== 'empleado') {
    showToast('Acceso denegado', 'Esta página es solo para empleados', 'error');
    setTimeout(() => {
      window.location.href = user.rol === 'superadmin' || user.rol === 'admin' ? 'admin.html' : 'login.html';
    }, 2000);
    return;
  }

  displayEmpleadoInfo();
  iniciarReloj();
  cargarDatos();

  // Event Listeners
  document.getElementById('btnEntrada').addEventListener('click', () => ficharEntrada());
  document.getElementById('btnSalida').addEventListener('click', () => ficharSalida());
  document.getElementById('btnLogout').addEventListener('click', handleLogout);
  document.getElementById('btnRecargarHistorial').addEventListener('click', () => cargarHistorial());
});

// ===================================
// FUNCIONES DE UI
// ===================================
function displayEmpleadoInfo() {
  const user = Auth.getUser();
  document.getElementById('empleadoNombre').textContent = user.nombre || user.username;
}

function iniciarReloj() {
  const updateClock = () => {
    const now = new Date();
    
    // Hora
    const horas = now.getHours().toString().padStart(2, '0');
    const minutos = now.getMinutes().toString().padStart(2, '0');
    const segundos = now.getSeconds().toString().padStart(2, '0');
    document.getElementById('currentTime').textContent = `${horas}:${minutos}:${segundos}`;
    
    // Fecha
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('es-ES', opciones);
  };
  
  updateClock();
  intervaloClock = setInterval(updateClock, 1000);
}

function actualizarEstado() {
  const estadoTexto = document.getElementById('estadoTexto');
  const estadoDetalle = document.getElementById('estadoDetalle');
  const btnEntrada = document.getElementById('btnEntrada');
  const btnSalida = document.getElementById('btnSalida');

  if (!ultimoRegistro) {
    // Sin registros
    estadoTexto.textContent = 'Fuera del trabajo';
    estadoTexto.className = 'text-2xl font-bold text-white/90';
    estadoDetalle.textContent = 'No hay registros hoy';
    btnEntrada.disabled = false;
    btnSalida.disabled = true;
  } else if (ultimoRegistro.tipo === 'entrada') {
    // Trabajando
    estadoTexto.textContent = 'Trabajando';
    estadoTexto.className = 'text-2xl font-bold text-green-300 pulse-animation';
    
    const entrada = new Date(ultimoRegistro.fecha);
    const horaEntrada = entrada.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    estadoDetalle.textContent = `Entrada: ${horaEntrada}`;
    
    btnEntrada.disabled = true;
    btnSalida.disabled = false;
  } else {
    // Salida registrada
    estadoTexto.textContent = 'Fuera del trabajo';
    estadoTexto.className = 'text-2xl font-bold text-white/90';
    
    if (ultimoRegistro.horasTrabajadas) {
      estadoDetalle.textContent = `Última jornada: ${ultimoRegistro.horasTrabajadas}h`;
    } else {
      estadoDetalle.textContent = 'Salida registrada';
    }
    
    btnEntrada.disabled = false;
    btnSalida.disabled = true;
  }
}

function actualizarResumen(registros) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const registrosHoy = registros.filter(r => {
    const fecha = new Date(r.fecha);
    fecha.setHours(0, 0, 0, 0);
    return fecha.getTime() === hoy.getTime();
  });

  let entradaHoy = null;
  let salidaHoy = null;
  let horasHoy = 0;

  registrosHoy.forEach(r => {
    if (r.tipo === 'entrada' && !entradaHoy) {
      entradaHoy = new Date(r.fecha);
    } else if (r.tipo === 'salida' && !salidaHoy) {
      salidaHoy = new Date(r.fecha);
      if (r.horasTrabajadas) {
        horasHoy = r.horasTrabajadas;
      }
    }
  });

  // Actualizar UI
  document.getElementById('horaEntradaHoy').textContent = entradaHoy 
    ? entradaHoy.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
    
  document.getElementById('horaSalidaHoy').textContent = salidaHoy 
    ? salidaHoy.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
    
  document.getElementById('horasHoy').textContent = horasHoy ? `${horasHoy}h` : '--';
}

function mostrarHistorial(registros) {
  const container = document.getElementById('historialContainer');
  
  if (registros.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
        </svg>
        <p class="font-medium">No hay registros recientes</p>
        <p class="text-sm">Ficha tu entrada para comenzar</p>
      </div>
    `;
    return;
  }

  const html = registros.slice(0, 10).map(registro => {
    const fecha = new Date(registro.fecha);
    const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const fechaStr = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    
    const esEntrada = registro.tipo === 'entrada';
    const colorClass = esEntrada ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600';
    const icono = esEntrada 
      ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd"></path>'
      : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" transform="rotate(180 10 10)"></path>';

    return `
      <div class="flex items-center gap-4 p-4 bg-gradient-to-r ${colorClass} bg-opacity-10 rounded-xl border border-gray-200 hover:shadow-md transition-all">
        <div class="w-12 h-12 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            ${icono}
          </svg>
        </div>
        <div class="flex-1">
          <p class="font-semibold text-gray-800">${esEntrada ? 'Entrada' : 'Salida'}</p>
          <p class="text-sm text-gray-600">${fechaStr} • ${hora}</p>
        </div>
        ${registro.horasTrabajadas ? `
          <div class="text-right">
            <p class="text-sm text-gray-600">Horas</p>
            <p class="text-lg font-bold text-gray-800">${registro.horasTrabajadas}h</p>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// ===================================
// FUNCIONES DE API
// ===================================
async function cargarDatos() {
  try {
    await Promise.all([
      cargarUltimoRegistro(),
      cargarHistorial(),
      cargarResumenMensual(),
      cargarHorasAsignadas()
    ]);
  } catch (error) {
    console.error('Error al cargar datos:', error);
  }
}

async function cargarUltimoRegistro() {
  try {
    const response = await Auth.authFetch(`${API_URL}/time-records/ultimo`);
    const data = await response.json();
    
    if (data.success) {
      ultimoRegistro = data.data;
      actualizarEstado();
    }
  } catch (error) {
    console.error('Error al cargar último registro:', error);
  }
}

async function cargarHistorial() {
  try {
    const response = await Auth.authFetch(`${API_URL}/time-records/mis-registros?limit=20`);
    const data = await response.json();
    
    if (data.success) {
      mostrarHistorial(data.data);
      actualizarResumen(data.data);
    }
  } catch (error) {
    console.error('Error al cargar historial:', error);
  }
}

async function cargarResumenMensual() {
  try {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();
    
    const response = await Auth.authFetch(`${API_URL}/time-records/mi-resumen?mes=${mes}&anio=${anio}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      document.getElementById('horasMes').textContent = `${data.data.totalHoras || 0}h`;
    }
  } catch (error) {
    console.error('Error al cargar resumen mensual:', error);
  }
}

/**
 * Cargar horas asignadas para hoy
 */
async function cargarHorasAsignadas() {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);
    
    // Formato ISO para fechaInicio y fechaFin
    const fechaInicio = hoy.toISOString();
    const fechaFin = mañana.toISOString();
    
    console.log('🔍 Cargando horas asignadas para hoy:', {
      fechaInicio,
      fechaFin
    });
    
    const response = await Auth.authFetch(
      `${API_URL}/work-schedules/my-schedules?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
    );
    
    const data = await response.json();
    
    console.log('📊 Respuesta de horas asignadas:', data);
    
    if (data.success && data.data) {
      // Sumar horas de todos los horarios asignados hoy
      const horasAsignadas = data.data.reduce((total, horario) => {
        return total + (horario.horasTotales || 0);
      }, 0);
      
      console.log('✅ Total horas asignadas hoy:', horasAsignadas);
      
      const elemento = document.getElementById('horasAsignadasHoy');
      if (elemento) {
        elemento.textContent = horasAsignadas > 0 
          ? `${horasAsignadas}h` 
          : '--';
      }
    } else {
      // Si no hay horarios asignados, mostrar --
      console.log('⚠️ No hay horarios asignados para hoy');
      const elemento = document.getElementById('horasAsignadasHoy');
      if (elemento) {
        elemento.textContent = '--';
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar horas asignadas:', error);
    // Mostrar -- si hay error
    const elemento = document.getElementById('horasAsignadasHoy');
    if (elemento) {
      elemento.textContent = '--';
    }
  }
}

async function ficharEntrada() {
  try {
    const response = await Auth.authFetch(`${API_URL}/time-records/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tipo: 'entrada',
        ubicacion: 'Portal Web'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      showToast('¡Entrada registrada!', `Hora: ${new Date(data.data.fecha).toLocaleTimeString('es-ES')}`, 'success');
      await cargarDatos();
    } else {
      showToast('Error', data.message, 'error');
    }
  } catch (error) {
    console.error('Error al fichar entrada:', error);
    showToast('Error', 'No se pudo registrar la entrada', 'error');
  }
}

async function ficharSalida() {
  try {
    const response = await Auth.authFetch(`${API_URL}/time-records/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tipo: 'salida',
        ubicacion: 'Portal Web'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      let mensaje = '';
      let titulo = '¡Salida registrada!';
      
      // ⚠️ DETECTAR ENTRADA OLVIDADA (cruzó medianoche)
      if (data.entradaOlvidadaGestionada) {
        const entrada = data.entradaOlvidadaGestionada;
        titulo = '⚠️ ¡Entrada Olvidada Detectada!';
        mensaje = `
Se detectó una entrada sin cerrar desde ${entrada.entradaFecha}.

🔧 ACCIÓN AUTOMÁTICA:
- Se registró automáticamente una salida a las 23:59 de ese día
- Horas trabajadas: ${entrada.horasTrabajadas.toFixed(2)}h
- Se creó el horario correspondiente

Tu entrada de HOY también ha sido registrada exitosamente.
        `.trim();
        
        showToast(titulo, mensaje, 'warning');
      } else {
        // Mostrar horas trabajadas
        if (data.data.horasTrabajadas) {
          mensaje = `Horas trabajadas: ${data.data.horasTrabajadas}h`;
        } else {
          mensaje = `Hora: ${new Date(data.data.fecha).toLocaleTimeString('es-ES')}`;
        }
        
        // ✨ VERIFICAR GESTIÓN DE HORARIO (retrocompatible)
        const gestion = data.horarioGestionado || data.horarioVerificado;
        
        if (gestion) {
          // CASO 1: Horario creado automáticamente
          if (gestion.creado) {
            titulo = '📝 ¡Horario Creado!';
            mensaje = `${gestion.mensaje}\n✅ Se ha creado automáticamente tu horario en el sistema`;
          } 
          // CASO 2: Horario completado automáticamente
          else if (gestion.completado) {
            titulo = '🎯 ¡Turno Completado!';
            mensaje = `${gestion.mensaje}\n✅ Tu horario ha sido marcado como completado automáticamente`;
          } 
          // CASO 3: No se completó por diferencia de horas
          else if (gestion.razon === 'diferencia_horas') {
            const diferenciaMins = (gestion.diferencia * 60).toFixed(0);
            mensaje += `\n⚠️ ${gestion.mensaje}`;
          }
          // CASO 4: Ya estaba procesado
          else if (gestion.razon === 'ya_procesado') {
            mensaje += `\nℹ️ ${gestion.mensaje}`;
          }
        }
        
        showToast(titulo, mensaje, 'success');
      }
      
      await cargarDatos();
      
      // Recargar horarios si existe la función (para actualizar el calendario)
      if (typeof renderCurrentEmployeeScheduleView === 'function') {
        await renderCurrentEmployeeScheduleView();
      }
    } else {
      showToast('Error', data.message, 'error');
    }
  } catch (error) {
    console.error('Error al fichar salida:', error);
    showToast('Error', 'No se pudo registrar la salida', 'error');
  }
}

// ===================================
// UTILIDADES
// ===================================
function showToast(title, message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');

  toastTitle.textContent = title;
  toastMessage.textContent = message;

  // Configurar icono y color según tipo
  let iconHTML = '';
  let bgColor = '';
  
  switch(type) {
    case 'success':
      bgColor = 'bg-green-500';
      iconHTML = '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>';
      break;
    case 'error':
      bgColor = 'bg-red-500';
      iconHTML = '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>';
      break;
    default:
      bgColor = 'bg-blue-500';
      iconHTML = '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>';
  }

  toastIcon.className = `w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor}`;
  toastIcon.innerHTML = iconHTML;

  // Mostrar toast
  toast.style.transform = 'translateX(0)';
  
  // Ocultar después de 4 segundos
  setTimeout(() => {
    toast.style.transform = 'translateX(200%)';
  }, 4000);
}

function handleLogout() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    clearInterval(intervaloClock);
    Auth.logout();
  }
}

// ===================================
// SISTEMA DE HORARIOS ASIGNADOS
// ===================================

// Variables globales para horarios
let currentEmployeeScheduleView = 'week'; // week, month
let employeeSchedules = [];

// ===================================
// CALENDAR UTILS - POWERED BY DateUtils
// ===================================
const CalendarUtilsEmployee = {
  getMonday(date) {
    return DateUtils.startOfWeek(date);
  },

  getWeekDates(startDate) {
    const endDate = DateUtils.addDays(startDate, 6);
    return DateUtils.eachDayOfInterval({ start: startDate, end: endDate });
  },

  addWeeks(date, weeks) {
    return DateUtils.addWeeks(date, weeks);
  },

  toISODate(date) {
    return DateUtils.format(date, 'yyyy-MM-dd');
  },

  isSameDay(date1, date2) {
    return DateUtils.isSameDay(date1, date2);
  },

  getDayName(date) {
    return DateUtils.format(date, 'dddd');
  }
};

// ===================================
// CALENDAR STATE - EMPLOYEE
// ===================================
class CalendarStateEmployee {
  constructor() {
    const today = new Date();
    this._currentWeekMonday = CalendarUtilsEmployee.getMonday(today);
    this._currentMonth = today.getMonth(); // 0-11
    this._currentYear = today.getFullYear(); // YYYY
  }

  getCurrentWeekMonday() {
    return new Date(this._currentWeekMonday);
  }

  getCurrentMonth() {
    return this._currentMonth;
  }

  getCurrentYear() {
    return this._currentYear;
  }

  goToPreviousWeek() {
    this._currentWeekMonday = CalendarUtilsEmployee.addWeeks(this._currentWeekMonday, -1);
  }

  goToNextWeek() {
    this._currentWeekMonday = CalendarUtilsEmployee.addWeeks(this._currentWeekMonday, 1);
  }

  goToPreviousMonth() {
    this._currentMonth--;
    if (this._currentMonth < 0) {
      this._currentMonth = 11;
      this._currentYear--;
    }
  }

  goToNextMonth() {
    this._currentMonth++;
    if (this._currentMonth > 11) {
      this._currentMonth = 0;
      this._currentYear++;
    }
  }

  goToToday() {
    const today = new Date();
    this._currentWeekMonday = CalendarUtilsEmployee.getMonday(today);
    this._currentMonth = today.getMonth();
    this._currentYear = today.getFullYear();
  }
}

const calendarStateEmployee = new CalendarStateEmployee();

// ===================================
// FUNCIÓN DE COLORES POR ROL
// ===================================
function getRolColorEmployee(rolEmpleado) {
  const roleColors = {
    'monitor': { bg: 'bg-blue-100', border: 'border-blue-400', hex: '#dbeafe' },
    'cocina': { bg: 'bg-orange-100', border: 'border-orange-400', hex: '#fed7aa' },
    'barra': { bg: 'bg-purple-100', border: 'border-purple-400', hex: '#e9d5ff' }
  };
  return roleColors[rolEmpleado] || { bg: 'bg-gray-100', border: 'border-gray-400', hex: '#f3f4f6' };
}

// ===================================
// VISTA SEMANAL - EMPLOYEE
// ===================================
async function renderEmployeeWeekView() {
  try {
    const monday = calendarStateEmployee.getCurrentWeekMonday();
    const weekDates = CalendarUtilsEmployee.getWeekDates(monday);
    const sunday = weekDates[6];
    
    const mondayISO = CalendarUtilsEmployee.toISODate(monday);
    
    // 1. OBTENER DATOS DEL BACKEND (solo del empleado actual)
    const user = Auth.getUser();
    const url = `${API_URL}/work-schedules/weekly?fecha=${mondayISO}&empleadoId=${user.id}`;
    
    const response = await Auth.authFetch(url);
    const data = await response.json();
    
    if (!data.success) {
      showToast('Error', 'No se pudieron cargar los horarios', 'error');
      return;
    }

    // 2. ACTUALIZAR TÍTULO
    const weekTitle = document.getElementById('weekTitleEmployee');
    if (weekTitle) {
      const startStr = monday.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      const endStr = sunday.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      weekTitle.textContent = `${startStr} al ${endStr}`;
    }

    // 3. TRANSFORMAR DATOS
    const horariosMap = new Map();
    if (data.data.dias) {
      data.data.dias.forEach(dia => {
        horariosMap.set(dia.fecha.split('T')[0], dia.horarios || []);
      });
    }

    // 4. RENDERIZAR CALENDARIO
    const calendar = document.getElementById('weekCalendarEmployee');
    if (!calendar) return;

    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    calendar.innerHTML = weekDates.map((date, index) => {
      const dateISO = CalendarUtilsEmployee.toISODate(date);
      const dayName = dayNames[index];
      const horarios = horariosMap.get(dateISO) || [];
      const hasSchedules = horarios.length > 0;
      const isToday = CalendarUtilsEmployee.isSameDay(date, new Date());

      return `
        <div class="border rounded-lg p-3 ${hasSchedules ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'} ${isToday ? 'ring-2 ring-orange-500' : ''}">
          <div class="font-semibold text-sm mb-2 ${isToday ? 'text-orange-600' : 'text-gray-700'}">${dayName}</div>
          <div class="text-xs text-gray-500 mb-3">${date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</div>
          
          ${hasSchedules ? 
            horarios.map(h => `
              <div class="bg-white rounded p-2 mb-2 border-l-4" style="border-color: ${h.color || '#f97316'}">
                <div class="text-xs font-semibold text-gray-600">${h.turno}</div>
                <div class="text-sm font-bold text-gray-800">${h.horaInicio} - ${h.horaFin}</div>
                <div class="text-xs text-gray-500">${h.horasTotales}h</div>
                ${h.notas ? `<div class="text-xs text-gray-500 mt-1 italic">${h.notas}</div>` : ''}
              </div>
            `).join('') :
            '<div class="text-xs text-gray-400 italic">Sin horarios</div>'
          }
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error al renderizar vista semanal:', error);
    showToast('Error', 'No se pudo cargar la vista semanal', 'error');
  }
}

// ===================================
// VISTA MENSUAL - EMPLOYEE
// ===================================
async function renderEmployeeMonthView() {
  try {
    const mes = calendarStateEmployee.getCurrentMonth() + 1; // 0-11 → 1-12
    const anio = calendarStateEmployee.getCurrentYear();

    // 1. OBTENER DATOS DEL BACKEND (solo del empleado actual)
    const user = Auth.getUser();
    const url = `${API_URL}/work-schedules/monthly?mes=${mes}&anio=${anio}&empleadoId=${user.id}`;

    const response = await Auth.authFetch(url);
    const data = await response.json();

    if (!data.success) {
      showToast('Error', 'No se pudieron cargar los horarios', 'error');
      return;
    }

    // 2. ACTUALIZAR TÍTULO
    const monthTitle = document.getElementById('monthTitleEmployee');
    if (monthTitle) {
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      monthTitle.textContent = `${monthNames[mes - 1]} ${anio}`;
    }

    // 3. CALCULAR ESTRUCTURA DEL CALENDARIO
    const firstDayOfMonth = DateUtils.startOfMonth(new Date(anio, mes - 1, 1));
    const lastDayOfMonth = new Date(anio, mes, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    const firstDayWeekday = firstDayOfMonth.getDay();
    const startOffset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

    // 4. TRANSFORMAR DATOS
    const horariosMap = new Map();
    if (data.data.horarios) {
      data.data.horarios.forEach(h => {
        const dateKey = DateUtils.format(new Date(h.fecha), 'yyyy-MM-dd');
        if (!horariosMap.has(dateKey)) {
          horariosMap.set(dateKey, []);
        }
        horariosMap.get(dateKey).push(h);
      });
    }

    // 5. RENDERIZAR CALENDARIO
    const calendar = document.getElementById('monthCalendarEmployee');
    if (!calendar) return;

    let html = '<div class="grid grid-cols-7 gap-2">';
    
    // Headers de días de la semana
    const dayHeaders = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    dayHeaders.forEach(day => {
      html += `<div class="text-center text-xs font-semibold text-gray-600 p-2">${day}</div>`;
    });

    // Celdas vacías antes del primer día
    for (let i = 0; i < startOffset; i++) {
      html += '<div class="border border-gray-200 rounded bg-gray-100 min-h-[80px]"></div>';
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(anio, mes - 1, day);
      const dateISO = DateUtils.format(date, 'yyyy-MM-dd');
      const horarios = horariosMap.get(dateISO) || [];
      const hasSchedules = horarios.length > 0;
      const isToday = DateUtils.isSameDay(date, new Date());

      html += `
        <div class="border rounded p-2 min-h-[80px] ${hasSchedules ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-200'}
                    ${isToday ? 'ring-2 ring-orange-500' : ''}">
          <div class="text-xs font-semibold mb-1 ${isToday ? 'text-orange-600' : 'text-gray-700'}">${day}</div>
          
          ${hasSchedules ? 
            horarios.slice(0, 2).map(h => `
              <div class="text-xs rounded px-1 py-0.5 mb-1 border-l-2 bg-white text-gray-800" 
                   style="border-color: ${h.color || '#f97316'}">
                <div class="font-semibold">${h.turno}</div>
                <div class="text-[10px]">${h.horaInicio}-${h.horaFin}</div>
              </div>
            `).join('') + (horarios.length > 2 ? `<div class="text-xs text-gray-500">+${horarios.length - 2}</div>` : '') :
            ''
          }
        </div>
      `;
    }

    html += '</div>';
    calendar.innerHTML = html;

    // 6. MOSTRAR ESTADÍSTICAS
    const statsDiv = document.getElementById('monthStatsEmployee');
    if (statsDiv && data.data.resumen) {
      const r = data.data.resumen;
      statsDiv.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-200">
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">${r.turnosProgramados || 0}</div>
            <div class="text-xs text-gray-600">Turnos Asignados</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">${r.totalHoras ? r.totalHoras.toFixed(1) : '0.0'}h</div>
            <div class="text-xs text-gray-600">Horas Totales</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">${r.diasTrabajo || 0}</div>
            <div class="text-xs text-gray-600">Días Trabajados</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">${r.totalHoras && r.diasTrabajo ? (r.totalHoras / r.diasTrabajo).toFixed(1) : '0.0'}h</div>
            <div class="text-xs text-gray-600">Promedio/Día</div>
          </div>
        </div>
      `;
    }

  } catch (error) {
    console.error('Error al renderizar vista mensual:', error);
    showToast('Error', 'No se pudo cargar la vista mensual', 'error');
  }
}

// ===================================
// CAMBIO DE VISTA
// ===================================
function switchEmployeeScheduleView(view) {
  currentEmployeeScheduleView = view;
  
  const btnWeek = document.getElementById('btnViewWeekEmployee');
  const btnMonth = document.getElementById('btnViewMonthEmployee');
  
  // Resetear botones
  [btnWeek, btnMonth].forEach(btn => {
    if (btn) {
      btn.classList.remove('bg-orange-500', 'text-white');
      btn.classList.add('bg-gray-200', 'text-gray-800');
    }
  });
  
  // Activar botón seleccionado
  const activeBtn = view === 'week' ? btnWeek : btnMonth;
  if (activeBtn) {
    activeBtn.classList.remove('bg-gray-200', 'text-gray-800');
    activeBtn.classList.add('bg-orange-500', 'text-white');
  }
  
  // Mostrar/ocultar vistas
  const viewWeek = document.getElementById('viewWeekEmployee');
  const viewMonth = document.getElementById('viewMonthEmployee');
  
  if (viewWeek) viewWeek.classList.toggle('hidden', view !== 'week');
  if (viewMonth) viewMonth.classList.toggle('hidden', view !== 'month');
  
  // Renderizar vista actual
  renderCurrentEmployeeScheduleView();
}

function renderCurrentEmployeeScheduleView() {
  if (currentEmployeeScheduleView === 'week') {
    renderEmployeeWeekView();
  } else {
    renderEmployeeMonthView();
  }
}

// ===================================
// INICIALIZACIÓN DE HORARIOS
// ===================================
function initEmployeeSchedules() {
  console.log('🔧 Inicializando sistema de horarios...');
  
  // Event Listeners de vistas
  const btnWeek = document.getElementById('btnViewWeekEmployee');
  if (btnWeek) {
    btnWeek.addEventListener('click', () => switchEmployeeScheduleView('week'));
  }
  
  const btnMonth = document.getElementById('btnViewMonthEmployee');
  if (btnMonth) {
    btnMonth.addEventListener('click', () => switchEmployeeScheduleView('month'));
  }
  
  // Event Listeners de navegación semanal
  const btnPrevWeek = document.getElementById('btnPrevWeekEmployee');
  if (btnPrevWeek) {
    btnPrevWeek.addEventListener('click', () => {
      calendarStateEmployee.goToPreviousWeek();
      renderEmployeeWeekView();
    });
  }
  
  const btnNextWeek = document.getElementById('btnNextWeekEmployee');
  if (btnNextWeek) {
    btnNextWeek.addEventListener('click', () => {
      calendarStateEmployee.goToNextWeek();
      renderEmployeeWeekView();
    });
  }
  
  // Event Listeners de navegación mensual
  const btnPrevMonth = document.getElementById('btnPrevMonthEmployee');
  if (btnPrevMonth) {
    btnPrevMonth.addEventListener('click', () => {
      calendarStateEmployee.goToPreviousMonth();
      renderEmployeeMonthView();
    });
  }
  
  const btnNextMonth = document.getElementById('btnNextMonthEmployee');
  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => {
      calendarStateEmployee.goToNextMonth();
      renderEmployeeMonthView();
    });
  }
  
  // Cargar vista inicial (semanal)
  renderCurrentEmployeeScheduleView();
  
  console.log('✅ Sistema de horarios inicializado');
}

// Agregar inicialización de horarios al DOMContentLoaded existente
// NOTA: Esto se debe llamar después de que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Esperar un poco para que todo se inicialice
  setTimeout(() => {
    initEmployeeSchedules();
  }, 500);
});
