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
  
  // Inicializar módulos adicionales con delay
  setTimeout(() => {
    initEmployeeSchedules();
    initIncidencias();
  }, 500);
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
      cargarResumenSemanal(),
      cargarHorasAsignadas(),
      cargarTrabajandoAhora()
    ]);
    
    // Log de sincronización para debugging
    console.log('📊 Resumen Actualizado:', {
      horasHoy: document.getElementById('horasHoy')?.textContent,
      horasSemana: document.getElementById('horasSemana')?.textContent,
      horasMes: document.getElementById('horasMes')?.textContent,
      trabajandoAhora: document.getElementById('workingNowEmployee')?.textContent,
      timestamp: new Date().toLocaleTimeString('es-ES')
    });
  } catch (error) {
    console.error('Error al cargar datos:', error);
  }
}

async function cargarUltimoRegistro() {
  try {
    const data = await Auth.authFetch(`${API_URL}/time-records/ultimo`);
    
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
    const data = await Auth.authFetch(`${API_URL}/time-records/mis-registros?limit=20`);
    
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
    
    const data = await Auth.authFetch(`${API_URL}/time-records/mi-resumen?mes=${mes}&anio=${anio}`);
    
    if (data.success && data.data) {
      document.getElementById('horasMes').textContent = `${data.data.totalHoras || 0}h`;
    }
  } catch (error) {
    console.error('Error al cargar resumen mensual:', error);
  }
}

/**
 * Cargar horas trabajadas de la semana actual
 */
async function cargarResumenSemanal() {
  try {
    // Calcular el lunes de la semana actual
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    const diasDesdeInicioDeSemana = diaSemana === 0 ? 6 : diaSemana - 1; // Si es domingo, retroceder 6 días
    
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diasDesdeInicioDeSemana);
    lunes.setHours(0, 0, 0, 0);
    
    // Calcular el domingo (fin de semana)
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 7);
    domingo.setHours(0, 0, 0, 0);
    
    const fechaInicio = lunes.toISOString();
    const fechaFin = domingo.toISOString();
    
    console.log('🔍 Cargando horas de la semana:', {
      lunes: lunes.toLocaleDateString('es-ES'),
      domingo: domingo.toLocaleDateString('es-ES'),
      fechaInicio,
      fechaFin
    });
    
    const data = await Auth.authFetch(
      `${API_URL}/time-records/mis-registros?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&limit=200`
    );
    
    if (data.success && data.data && data.data.length > 0) {
      // Calcular total de horas trabajadas en la semana
      let horasSemana = 0;
      
      data.data.forEach(registro => {
        if (registro.tipo === 'salida' && registro.horasTrabajadas) {
          horasSemana += registro.horasTrabajadas;
        }
      });
      
      console.log('✅ Total horas esta semana:', horasSemana);
      
      const elemento = document.getElementById('horasSemana');
      if (elemento) {
        elemento.textContent = `${horasSemana.toFixed(2)}h`;
      }
    } else {
      // Sin registros en la semana
      console.log('⚠️ Sin registros de trabajo esta semana');
      const elemento = document.getElementById('horasSemana');
      if (elemento) {
        elemento.textContent = '0h';
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar resumen semanal:', error);
    const elemento = document.getElementById('horasSemana');
    if (elemento) {
      elemento.textContent = '--h';
    }
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
    
    const data = await Auth.authFetch(
      `${API_URL}/work-schedules/my-schedules?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
    );
    
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

/**
 * Cargar estado de "Trabajando Ahora"
 * Verifica si el empleado tiene una entrada registrada sin salida correspondiente
 */
async function cargarTrabajandoAhora() {
  try {
    const data = await Auth.authFetch(`${API_URL}/time-records/mis-registros?limit=2`);
    
    if (data.success && data.data && data.data.length > 0) {
      // Ordenar por fecha descendente (más recientes primero)
      const registros = data.data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      
      // Verificar si el registro más reciente es una entrada (sin salida)
      const ultimoRegistro = registros[0];
      const estaTrabajanloAhora = ultimoRegistro.tipo === 'entrada' ? 1 : 0;
      
      console.log('✅ Estado trabajando ahora:', {
        ultimoTipo: ultimoRegistro.tipo,
        trabajandoAhora: estaTrabajanloAhora
      });
      
      const elemento = document.getElementById('workingNowEmployee');
      if (elemento) {
        elemento.textContent = estaTrabajanloAhora;
      }
    } else {
      // Si no hay registros, no está trabajando
      const elemento = document.getElementById('workingNowEmployee');
      if (elemento) {
        elemento.textContent = '0';
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar estado trabajando ahora:', error);
    // Mostrar 0 si hay error
    const elemento = document.getElementById('workingNowEmployee');
    if (elemento) {
      elemento.textContent = '0';
    }
  }
}

async function ficharEntrada() {
  try {
    const data = await Auth.authFetch(`${API_URL}/time-records/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tipo: 'entrada',
        ubicacion: 'Portal Web'
      })
    });
    
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
    const data = await Auth.authFetch(`${API_URL}/time-records/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tipo: 'salida',
        ubicacion: 'Portal Web'
      })
    });
    
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
    
    const data = await Auth.authFetch(url);
    
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

    const data = await Auth.authFetch(url);

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

  // Event Listeners de filtros rápidos
  const btnFilterWeek = document.getElementById('btnFilterWeekEmployee');
  if (btnFilterWeek) {
    btnFilterWeek.addEventListener('click', () => {
      calendarStateEmployee.goToToday();
      switchEmployeeScheduleView('week');
      renderEmployeeWeekView();
      console.log('📅 Filtro: Esta Semana activado');
    });
  }

  const btnFilterMonth = document.getElementById('btnFilterMonthEmployee');
  if (btnFilterMonth) {
    btnFilterMonth.addEventListener('click', () => {
      calendarStateEmployee.goToToday();
      switchEmployeeScheduleView('month');
      renderEmployeeMonthView();
      console.log('📆 Filtro: Este Mes activado');
    });
  }
  
  // Cargar vista inicial (semanal)
  renderCurrentEmployeeScheduleView();
  
  console.log('✅ Sistema de horarios inicializado');
}

// ===================================
// SISTEMA DE INCIDENCIAS
// ===================================

/**
 * Inicializar sistema de incidencias
 */
function initIncidencias() {
  console.log('🔧 Inicializando sistema de incidencias...');
  
  // Verificar que los elementos existan
  const formIncidencia = document.getElementById('formIncidencia');
  if (!formIncidencia) {
    console.warn('⚠️ No se encontró el formulario de incidencias');
    return;
  }
  
  // Event Listeners
  formIncidencia.addEventListener('submit', handleSubmitIncidencia);
  
  const btnCancelar = document.getElementById('btnCancelarIncidencia');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', limpiarFormularioIncidencia);
  }
  
  // Contador de caracteres del motivo
  const motivoTextarea = document.getElementById('incidenciaMotivo');
  if (motivoTextarea) {
    motivoTextarea.addEventListener('input', (e) => {
      const counter = document.getElementById('motivoCounter');
      if (counter) {
        counter.textContent = e.target.value.length;
      }
    });
  }
  
  // Mostrar/ocultar "obligatorio" en documento según tipo
  const tipoSelect = document.getElementById('incidenciaTipo');
  if (tipoSelect) {
    tipoSelect.addEventListener('change', (e) => {
      const documentoLabel = document.getElementById('documentoRequerido');
      const documentoInput = document.getElementById('incidenciaDocumento');
      
      if (e.target.value === 'baja_medica') {
        documentoLabel.textContent = '(Obligatorio)';
        documentoLabel.className = 'text-xs text-red-500 font-semibold';
        documentoInput.required = true;
      } else {
        documentoLabel.textContent = '(Opcional)';
        documentoLabel.className = 'text-xs text-gray-500';
        documentoInput.required = false;
      }
    });
  }
  
  // Establecer fecha máxima (hoy) y mínima (7 días atrás)
  const fechaInput = document.getElementById('incidenciaFecha');
  if (fechaInput) {
    const hoy = new Date();
    const hace7Dias = new Date();
    hace7Dias.setDate(hoy.getDate() - 7);
    
    fechaInput.max = hoy.toISOString().split('T')[0];
    fechaInput.min = hace7Dias.toISOString().split('T')[0];
    fechaInput.value = hoy.toISOString().split('T')[0]; // Hoy por defecto
  }
  
  // Filtros
  const filterTipo = document.getElementById('filterTipoIncidencia');
  const filterEstado = document.getElementById('filterEstadoIncidencia');
  const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltrosIncidencia');
  
  if (filterTipo) {
    filterTipo.addEventListener('change', () => {
      cargarIncidencias().catch(err => console.error('Error en filtro tipo:', err));
    });
  }
  if (filterEstado) {
    filterEstado.addEventListener('change', () => {
      cargarIncidencias().catch(err => console.error('Error en filtro estado:', err));
    });
  }
  if (btnLimpiarFiltros) {
    btnLimpiarFiltros.addEventListener('click', () => {
      if (filterTipo) filterTipo.value = '';
      if (filterEstado) filterEstado.value = '';
      cargarIncidencias().catch(err => console.error('Error al limpiar filtros:', err));
    });
  }
  
  // Cargar incidencias iniciales (asíncrono con manejo de errores)
  setTimeout(() => {
    cargarIncidencias().catch(err => {
      console.error('Error en carga inicial de incidencias:', err);
    });
  }, 100);
  
  console.log('✅ Sistema de incidencias inicializado');
}

/**
 * Manejar envío del formulario de incidencia
 */
async function handleSubmitIncidencia(e) {
  e.preventDefault();
  
  const fecha = document.getElementById('incidenciaFecha').value;
  const tipo = document.getElementById('incidenciaTipo').value;
  const motivo = document.getElementById('incidenciaMotivo').value.trim();
  const documentoInput = document.getElementById('incidenciaDocumento');
  
  // Validaciones
  if (!fecha || !tipo || !motivo) {
    showToast('Error', 'Por favor completa todos los campos requeridos', 'error');
    return;
  }
  
  if (motivo.length < 10) {
    showToast('Error', 'El motivo debe tener al menos 10 caracteres', 'error');
    return;
  }
  
  // Validar baja médica requiere documento
  if (tipo === 'baja_medica' && (!documentoInput.files || documentoInput.files.length === 0)) {
    showToast('Error', 'La baja médica requiere un documento adjunto', 'error');
    return;
  }
  
  try {
    // Crear FormData
    const formData = new FormData();
    formData.append('fecha', fecha);
    formData.append('tipo', tipo);
    formData.append('motivo', motivo);
    
    if (documentoInput.files && documentoInput.files.length > 0) {
      formData.append('documento', documentoInput.files[0]);
    }
    
    console.log('📤 Enviando incidencia:', { fecha, tipo, motivo, tieneDocumento: documentoInput.files?.length > 0 });
    
    // Enviar al backend
    const response = await Auth.authFetch(`${API_URL}/incidences`, {
      method: 'POST',
      body: formData
      // NO incluir Content-Type - FormData lo establece automáticamente
    });
    
    console.log('📦 Respuesta crear incidencia:', response);
    
    if (response && response.success) {
      showToast('Éxito', 'Incidencia registrada correctamente', 'success');
      limpiarFormularioIncidencia();
      cargarIncidencias().catch(err => console.error('Error al recargar incidencias:', err));
    } else {
      console.error('❌ Error en respuesta:', response);
      throw new Error(response?.message || 'Error al registrar incidencia');
    }
  } catch (error) {
    console.error('Error al crear incidencia:', error);
    showToast('Error', error.message || 'No se pudo registrar la incidencia', 'error');
  }
}

/**
 * Limpiar formulario de incidencia
 */
function limpiarFormularioIncidencia() {
  const form = document.getElementById('formIncidencia');
  if (form) {
    form.reset();
    
    // Resetear fecha a hoy
    const fechaInput = document.getElementById('incidenciaFecha');
    if (fechaInput) {
      fechaInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Resetear contador
    const counter = document.getElementById('motivoCounter');
    if (counter) {
      counter.textContent = '0';
    }
    
    // Resetear label de documento
    const documentoLabel = document.getElementById('documentoRequerido');
    if (documentoLabel) {
      documentoLabel.textContent = '(Opcional)';
      documentoLabel.className = 'text-xs text-gray-500';
    }
    
    const documentoInput = document.getElementById('incidenciaDocumento');
    if (documentoInput) {
      documentoInput.required = false;
    }
  }
}

/**
 * Cargar incidencias del empleado
 */
async function cargarIncidencias() {
  try {
    // Verificar que Auth esté disponible
    if (!Auth || typeof Auth.authFetch !== 'function') {
      console.error('Auth no está disponible');
      return;
    }
    
    // Verificar que API_URL esté definido
    if (typeof API_URL === 'undefined') {
      console.error('API_URL no está definido');
      return;
    }
    
    const filterTipo = document.getElementById('filterTipoIncidencia')?.value || '';
    const filterEstado = document.getElementById('filterEstadoIncidencia')?.value || '';
    
    // Construir query params
    const params = new URLSearchParams();
    if (filterTipo) params.append('tipo', filterTipo);
    if (filterEstado) params.append('estado', filterEstado);
    
    const url = `${API_URL}/incidences/mis-incidencias${params.toString() ? '?' + params.toString() : ''}`;
    
    console.log('🔍 Cargando incidencias desde:', url);
    
    const response = await Auth.authFetch(url);
    
    console.log('📦 Respuesta recibida:', response);
    
    if (response && response.success) {
      renderIncidencias(response.data || []);
    } else {
      console.error('❌ Respuesta no exitosa:', response);
      throw new Error(response?.message || 'Error al cargar incidencias');
    }
  } catch (error) {
    console.error('Error al cargar incidencias:', error);
    // No mostrar toast en carga inicial para no molestar
    if (error.message && !error.message.includes('no está disponible')) {
      showToast('Error', 'No se pudieron cargar las incidencias', 'error');
    }
  }
}

/**
 * Renderizar tabla de incidencias
 */
function renderIncidencias(incidencias) {
  const tbody = document.getElementById('incidenciasTableBody');
  const noIncidencias = document.getElementById('noIncidencias');
  
  if (!tbody) return;
  
  // Limpiar tabla
  tbody.innerHTML = '';
  
  if (!incidencias || incidencias.length === 0) {
    if (noIncidencias) {
      noIncidencias.classList.remove('hidden');
    }
    return;
  }
  
  if (noIncidencias) {
    noIncidencias.classList.add('hidden');
  }
  
  // Renderizar cada incidencia
  incidencias.forEach(inc => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    // Formatear fecha
    const fecha = new Date(inc.fecha);
    const fechaStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    // Tipo con emoji y color
    const tipoInfo = getTipoInfo(inc.tipo);
    
    // Estado con badge
    const estadoInfo = getEstadoInfo(inc.estado);
    
    // Documento
    const hasDocumento = inc.documentoAdjunto ? '✅' : '❌';
    
    row.innerHTML = `
      <td class="px-4 py-3 text-sm text-gray-800">${fechaStr}</td>
      <td class="px-4 py-3 text-sm">
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tipoInfo.bg} ${tipoInfo.text}">
          ${tipoInfo.emoji} ${tipoInfo.nombre}
        </span>
      </td>
      <td class="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
        <div class="max-w-xs truncate" title="${inc.motivo}">
          ${inc.motivo}
        </div>
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.bg} ${estadoInfo.text}">
          ${estadoInfo.emoji} ${estadoInfo.nombre}
        </span>
      </td>
      <td class="px-4 py-3 text-sm text-center hidden sm:table-cell">
        ${inc.documentoAdjunto ? 
          `<button 
            onclick="verDocumentoIncidencia('${inc._id}')"
            class="text-blue-600 hover:text-blue-800 font-medium text-xs px-2 py-1 rounded hover:bg-blue-50"
            title="Ver documento">
            📄 Ver
          </button>` : 
          `<span class="text-gray-400">Sin doc.</span>`
        }
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

/**
 * Obtener información de tipo de incidencia
 */
function getTipoInfo(tipo) {
  const tipos = {
    'falta': { emoji: '🚫', nombre: 'Falta', bg: 'bg-red-100', text: 'text-red-800' },
    'retraso': { emoji: '⏰', nombre: 'Retraso', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'ausencia_justificada': { emoji: '📝', nombre: 'Ausencia Justificada', bg: 'bg-blue-100', text: 'text-blue-800' },
    'baja_medica': { emoji: '🏥', nombre: 'Baja Médica', bg: 'bg-purple-100', text: 'text-purple-800' }
  };
  return tipos[tipo] || { emoji: '❓', nombre: tipo, bg: 'bg-gray-100', text: 'text-gray-800' };
}

/**
 * Obtener información de estado de incidencia
 */
function getEstadoInfo(estado) {
  const estados = {
    'pendiente': { emoji: '⏳', nombre: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'aprobada': { emoji: '✅', nombre: 'Aprobada', bg: 'bg-green-100', text: 'text-green-800' },
    'rechazada': { emoji: '❌', nombre: 'Rechazada', bg: 'bg-red-100', text: 'text-red-800' }
  };
  return estados[estado] || { emoji: '❓', nombre: estado, bg: 'bg-gray-100', text: 'text-gray-800' };
}

/**
 * Ver documento de una incidencia
 * Abre el documento en una nueva pestaña
 */
async function verDocumentoIncidencia(incidenciaId) {
  try {
    console.log('📄 Solicitando documento de incidencia:', incidenciaId);
    
    // Construir URL del documento
    const url = `${API_URL}/incidences/${incidenciaId}/documento`;
    
    // Obtener token de autenticación
    const token = Auth.getToken();
    if (!token) {
      showToast('Error', 'No hay sesión activa', 'error');
      return;
    }
    
    // Crear ventana de carga
    const loadingWindow = window.open('', '_blank');
    if (loadingWindow) {
      loadingWindow.document.write(`
        <html>
          <head>
            <title>Cargando documento...</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                color: white;
              }
              .loader {
                text-align: center;
              }
              .spinner {
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid white;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="loader">
              <div class="spinner"></div>
              <p>Cargando documento...</p>
            </div>
          </body>
        </html>
      `);
    }
    
    // Hacer petición con fetch manual para manejar la descarga
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (loadingWindow) loadingWindow.close();
      
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(errorData.message || `Error ${response.status}`);
    }
    
    // Obtener el blob del archivo
    const blob = await response.blob();
    const contentType = response.headers.get('Content-Type');
    
    console.log('✅ Documento recibido:', contentType);
    
    // Crear URL del blob
    const blobUrl = URL.createObjectURL(blob);
    
    // Redirigir la ventana al documento
    if (loadingWindow && !loadingWindow.closed) {
      loadingWindow.location.href = blobUrl;
    } else {
      // Si la ventana fue bloqueada, abrir en nueva pestaña
      window.open(blobUrl, '_blank');
    }
    
    // Limpiar la URL del blob después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000); // 1 minuto
    
  } catch (error) {
    console.error('❌ Error al ver documento:', error);
    showToast('Error', error.message || 'No se pudo cargar el documento', 'error');
  }
}

// Hacer la función global para que pueda ser llamada desde onclick
window.verDocumentoIncidencia = verDocumentoIncidencia;
