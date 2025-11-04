// ========================================
// NEWSLETTER MANAGER - Página Dedicada
// ========================================

let subscribers = [];

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Iniciando Newsletter Manager...');
  
  // Verificar autenticación
  if (!Auth.isAuthenticated()) {
    console.warn('⚠️ Usuario no autenticado, redirigiendo...');
    window.location.href = '/login.html';
    return;
  }

  // Cargar información del usuario
  const user = Auth.getUser();
  if (user) {
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.getElementById('headerUserRole');
    
    if (headerUserName) headerUserName.textContent = user.nombre || 'Admin';
    if (headerUserRole) headerUserRole.textContent = getRoleLabel(user.rol);
  }

  // Cargar suscriptores
  await loadSubscribers();

  // Event listener para el formulario
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', handleNewsletterSubmit);
  }

  console.log('✅ Newsletter Manager inicializado correctamente');
});

// ========================================
// CARGAR SUSCRIPTORES
// ========================================
async function loadSubscribers() {
  console.log('📥 Cargando suscriptores...');
  
  try {
    const data = await Auth.authFetch(`${API_URL}/newsletter`);
    
    if (data.success) {
      subscribers = data.data || [];
      console.log(`✅ ${subscribers.length} suscriptores cargados`);
      
      // Actualizar stats
      updateStats();
      
      // Renderizar tabla
      renderSubscribersTable();
    } else {
      console.error('❌ Error al cargar suscriptores:', data.message);
      showNotification('Error al cargar suscriptores', 'error');
    }
  } catch (error) {
    console.error('❌ Error en loadSubscribers:', error);
    showNotification('Error al cargar suscriptores', 'error');
  }
}

// ========================================
// ACTUALIZAR ESTADÍSTICAS
// ========================================
function updateStats() {
  const activeCount = subscribers.filter(s => s.activo).length;
  const totalCount = subscribers.length;

  const activeEl = document.getElementById('activeSubscribersCount');
  const totalEl = document.getElementById('totalSubscribersCount');
  const recipientEl = document.getElementById('recipientCount');

  if (activeEl) activeEl.textContent = activeCount;
  if (totalEl) totalEl.textContent = totalCount;
  if (recipientEl) recipientEl.textContent = activeCount;

  console.log(`📊 Stats: ${activeCount} activos de ${totalCount} totales`);
}

// ========================================
// RENDERIZAR TABLA DE SUSCRIPTORES
// ========================================
function renderSubscribersTable() {
  const tbody = document.getElementById('subscribersTableBody');
  if (!tbody) return;

  if (subscribers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-8 text-center text-gray-500">
          No hay suscriptores todavía
        </td>
      </tr>
    `;
    return;
  }

  // Ordenar por fecha descendente (más recientes primero)
  const sortedSubscribers = [...subscribers].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  tbody.innerHTML = sortedSubscribers.map(sub => {
    const fecha = new Date(sub.createdAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const estadoBadge = sub.activo 
      ? '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800"><span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Activo</span>'
      : '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800"><span class="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>Inactivo</span>';

    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4 text-sm text-gray-900">${sub.email}</td>
        <td class="px-6 py-4 text-sm">${estadoBadge}</td>
        <td class="px-6 py-4 text-sm text-gray-500">${fecha}</td>
        <td class="px-6 py-4 text-sm">
          <div class="flex items-center justify-center gap-2">
            <button 
              onclick="toggleSubscriberStatus('${sub._id}', ${sub.activo})"
              class="p-2 ${sub.activo ? 'bg-amber-100 hover:bg-amber-200 text-amber-700' : 'bg-green-100 hover:bg-green-200 text-green-700'} rounded-lg transition-colors"
              title="${sub.activo ? 'Desactivar' : 'Activar'}"
            >
              ${sub.activo 
                ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>'
                : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
              }
            </button>
            <button 
              onclick="deleteSubscriber('${sub._id}', '${sub.email}')"
              class="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              title="Eliminar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  console.log(`✅ Tabla renderizada con ${subscribers.length} suscriptores`);
}

// ========================================
// CAMBIAR ESTADO DE SUSCRIPTOR
// ========================================
async function toggleSubscriberStatus(subscriberId, currentStatus) {
  const action = currentStatus ? 'desactivar' : 'activar';
  
  const result = await Swal.fire({
    title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} suscriptor?`,
    text: currentStatus 
      ? 'El suscriptor no recibirá más newsletters hasta que se reactive.'
      : 'El suscriptor volverá a recibir newsletters.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: currentStatus ? '#f59e0b' : '#10b981',
    cancelButtonColor: '#6b7280',
    confirmButtonText: `Sí, ${action}`,
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  });

  if (!result.isConfirmed) return;

  try {
    const data = await Auth.authFetch(`${API_URL}/newsletter/${subscriberId}/toggle`, {
      method: 'PATCH'
    });

    if (data.success) {
      showNotification(`Suscriptor ${currentStatus ? 'desactivado' : 'activado'} correctamente`, 'success');
      await loadSubscribers();
    } else {
      showNotification(data.message || 'Error al cambiar estado', 'error');
    }
  } catch (error) {
    console.error('❌ Error en toggleSubscriberStatus:', error);
    showNotification('Error al cambiar estado del suscriptor', 'error');
  }
}

// ========================================
// ELIMINAR SUSCRIPTOR
// ========================================
async function deleteSubscriber(subscriberId, email) {
  const result = await Swal.fire({
    title: '¿Eliminar suscriptor?',
    html: `
      <p class="text-gray-700 mb-2">¿Estás seguro de eliminar a:</p>
      <p class="text-red-600 font-semibold">${email}</p>
      <p class="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  });

  if (!result.isConfirmed) return;

  try {
    const data = await Auth.authFetch(`${API_URL}/newsletter/${subscriberId}`, {
      method: 'DELETE'
    });

    if (data.success) {
      showNotification('Suscriptor eliminado correctamente', 'success');
      await loadSubscribers();
    } else {
      showNotification(data.message || 'Error al eliminar suscriptor', 'error');
    }
  } catch (error) {
    console.error('❌ Error en deleteSubscriber:', error);
    showNotification('Error al eliminar suscriptor', 'error');
  }
}

// ========================================
// ENVIAR NEWSLETTER
// ========================================
async function handleNewsletterSubmit(e) {
  e.preventDefault();
  console.log('📧 Procesando envío de newsletter...');

  const asunto = document.getElementById('emailAsunto').value.trim();
  const mensaje = document.getElementById('emailMensaje').value.trim();

  // Validaciones
  if (!asunto || asunto.length < 3) {
    showNotification('El asunto debe tener al menos 3 caracteres', 'warning');
    return;
  }

  if (!mensaje || mensaje.length < 10) {
    showNotification('El mensaje debe tener al menos 10 caracteres', 'warning');
    return;
  }

  // Contar destinatarios activos
  const activeSubscribers = subscribers.filter(s => s.activo);
  if (activeSubscribers.length === 0) {
    showNotification('No hay suscriptores activos para enviar el newsletter', 'warning');
    return;
  }

  // Confirmación
  const result = await Swal.fire({
    title: '¿Enviar Newsletter?',
    html: `
      <p class="text-gray-700 mb-2">Se enviará a <strong>${activeSubscribers.length}</strong> suscriptores activos.</p>
      <p class="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#8b5cf6',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, enviar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  });

  if (!result.isConfirmed) {
    console.log('❌ Envío cancelado por el usuario');
    return;
  }

  // Mostrar loading
  Swal.fire({
    title: 'Enviando Newsletter...',
    html: 'Por favor espera mientras se envían los correos.',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const data = await Auth.authFetch(`${API_URL}/newsletter/send-bulk`, {
      method: 'POST',
      body: JSON.stringify({ asunto, mensaje })
    });

    Swal.close();

    if (data.success) {
      console.log('✅ Newsletter enviado exitosamente');
      
      // Usar datos reales del backend
      const recipientsCount = data.data?.recipients || activeSubscribers.length;
      
      await Swal.fire({
        title: '¡Newsletter Enviado!',
        html: `
          <p class="text-gray-700 mb-2">El newsletter se envió correctamente a <strong>${recipientsCount}</strong> suscriptor${recipientsCount !== 1 ? 'es' : ''}.</p>
          <p class="text-sm text-gray-500 mt-2">Los correos se están entregando en segundo plano.</p>
        `,
        icon: 'success',
        confirmButtonColor: '#8b5cf6',
        confirmButtonText: 'Entendido'
      });

      // Limpiar formulario
      document.getElementById('newsletterForm').reset();
      
    } else {
      console.error('❌ Error al enviar newsletter:', data.message);
      showNotification(data.message || 'Error al enviar newsletter', 'error');
    }
  } catch (error) {
    Swal.close();
    console.error('❌ Error en handleNewsletterSubmit:', error);
    showNotification('Error al enviar newsletter', 'error');
  }
}

// ========================================
// UTILIDADES
// ========================================
function getRoleLabel(rol) {
  const roles = {
    'superadmin': 'Superadministrador',
    'admin': 'Administrador',
    'empleado': 'Empleado'
  };
  return roles[rol] || rol;
}

function showNotification(message, type = 'info') {
  const config = {
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    icon: type,
    title: message
  };

  Swal.fire(config);
}

// ========================================
// EXPORTS (para uso global)
// ========================================
window.loadSubscribers = loadSubscribers;
window.toggleSubscriberStatus = toggleSubscriberStatus;
window.deleteSubscriber = deleteSubscriber;
