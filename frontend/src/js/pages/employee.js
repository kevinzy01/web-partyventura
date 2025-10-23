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
      cargarResumenMensual()
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
      const mensaje = data.data.horasTrabajadas 
        ? `Horas trabajadas: ${data.data.horasTrabajadas}h`
        : `Hora: ${new Date(data.data.fecha).toLocaleTimeString('es-ES')}`;
      
      showToast('¡Salida registrada!', mensaje, 'success');
      await cargarDatos();
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
