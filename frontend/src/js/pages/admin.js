// ===================================
// ADMIN.JS - Panel de Administración
// Gestión completa para Partyventura
// CON SISTEMA DE AUTENTICACIÓN JWT
// ===================================

// Estado global
let currentContactId = null;
let currentFilter = 'all';
let timeRecordsSummaryInterval = null; // Auto-actualización de tarjetas

// Estado de selección múltiple
const bulkSelection = {
  news: new Set(),
  contacts: new Set(),
  empleados: new Set(),
  events: new Set(),
  gallery: new Set(),
  timeRecords: new Set(),
  workSchedules: new Set()
};

// ===================================
// FUNCIONES DE SELECCIÓN MÚLTIPLE
// ===================================

// Toggle individual checkbox
function toggleItemSelection(section, itemId, checked) {
  if (checked) {
    bulkSelection[section].add(itemId);
  } else {
    bulkSelection[section].delete(itemId);
  }
  updateBulkActionBar(section);
  updateSelectAllCheckbox(section);
}

// Seleccionar/deseleccionar todos
function toggleSelectAll(section, checked) {
  const checkboxes = document.querySelectorAll(`[data-section="${section}"] .item-checkbox`);
  checkboxes.forEach(checkbox => {
    checkbox.checked = checked;
    const itemId = checkbox.dataset.itemId;
    if (checked) {
      bulkSelection[section].add(itemId);
    } else {
      bulkSelection[section].delete(itemId);
    }
  });
  updateBulkActionBar(section);
}

// Actualizar estado del checkbox "seleccionar todo"
function updateSelectAllCheckbox(section) {
  const selectAllCheckbox = document.getElementById(`selectAll${section.charAt(0).toUpperCase() + section.slice(1)}`);
  if (!selectAllCheckbox) return;
  
  const checkboxes = document.querySelectorAll(`[data-section="${section}"] .item-checkbox`);
  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  
  selectAllCheckbox.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
  selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

// Actualizar barra de acciones
function updateBulkActionBar(section) {
  const selectedCount = bulkSelection[section].size;
  const bulkBar = document.getElementById(`bulkActionBar${section.charAt(0).toUpperCase() + section.slice(1)}`);
  
  if (!bulkBar) return;
  
  if (selectedCount > 0) {
    bulkBar.classList.remove('hidden');
    const countElement = bulkBar.querySelector('.selected-count');
    if (countElement) {
      countElement.textContent = selectedCount;
    }
  } else {
    bulkBar.classList.add('hidden');
  }
}

// Limpiar selección
function clearSelection(section) {
  bulkSelection[section].clear();
  const checkboxes = document.querySelectorAll(`[data-section="${section}"] .item-checkbox`);
  checkboxes.forEach(cb => cb.checked = false);
  updateBulkActionBar(section);
  updateSelectAllCheckbox(section);
}

// Sincronizar checkboxes del DOM con estado global al cambiar de sección
function syncSelectionState(section) {
  const checkboxes = document.querySelectorAll(`[data-section="${section}"] .item-checkbox`);
  checkboxes.forEach(cb => {
    const itemId = cb.dataset.itemId;
    // Si está en el estado, marca el checkbox
    if (bulkSelection[section].has(itemId)) {
      cb.checked = true;
    } else {
      cb.checked = false;
    }
  });
  updateBulkActionBar(section);
  updateSelectAllCheckbox(section);
}

// Eliminar elementos seleccionados
async function bulkDelete(section, deleteFunction, reloadFunction) {
  const selectedIds = Array.from(bulkSelection[section]);
  
  if (selectedIds.length === 0) {
    showNotification('No hay elementos seleccionados', 'warning');
    return;
  }
  
  const confirmMessage = `¿Estás seguro de eliminar ${selectedIds.length} elemento(s)?\n\nEsta acción no se puede deshacer.`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    let successCount = 0;
    let errorCount = 0;
    
    // Eliminar en paralelo (máximo 5 a la vez)
    const batchSize = 5;
    for (let i = 0; i < selectedIds.length; i += batchSize) {
      const batch = selectedIds.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(id => deleteFunction(id, true)) // true = silent mode
      );
      
      results.forEach(result => {
        if (result.status === 'fulfilled') successCount++;
        else errorCount++;
      });
    }
    
    // Limpiar selección
    clearSelection(section);
    
    // Recargar datos
    await reloadFunction();
    
    // Mostrar resultado
    if (errorCount === 0) {
      showNotification(`${successCount} elemento(s) eliminado(s) correctamente`, 'success');
    } else {
      showNotification(`${successCount} eliminado(s), ${errorCount} error(es)`, 'warning');
    }
    
  } catch (error) {
    console.error('Error en eliminación masiva:', error);
    showNotification('Error al eliminar elementos', 'error');
  }
}

// ===================================
// FIN FUNCIONES DE SELECCIÓN MÚLTIPLE
// ===================================

// ===================================
// 0. INICIALIZACIÓN Y AUTENTICACIÓN
// ===================================

// ⚠️ DEPRECADO - Listener duplicado eliminado
// La inicialización se maneja en línea 5124 con el nuevo sistema
// que incluye verificación de DateUtils y carga ordenada de componentes

// Mostrar información del usuario en el header
function displayUserInfo() {
  const user = Auth.getUser();
  if (!user) return;
  
  // Actualizar nombre y rol
  const adminNameEl = document.getElementById('adminName');
  const adminRoleEl = document.getElementById('adminRoleDisplay');
  const adminInitialEl = document.getElementById('adminInitial');
  
  if (adminNameEl) adminNameEl.textContent = user.nombre || user.username;
  if (adminRoleEl) {
    const roleText = user.rol === 'superadmin' ? 'Super Administrador' : 'Administrador';
    adminRoleEl.textContent = roleText;
  }
  if (adminInitialEl) {
    const initial = (user.nombre || user.username).charAt(0).toUpperCase();
    adminInitialEl.textContent = initial;
  }
}

// Manejar cierre de sesión
function handleLogout() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    // Enviar petición de logout al servidor (opcional)
    Auth.authFetch(`${API_URL}/auth/logout`, {
      method: 'POST'
    })
    .catch(error => console.log('Logout local:', error))
    .finally(() => {
      Auth.logout();
    });
  }
}

// ===================================
// 1. FUNCIONES DE UTILIDAD DEL HEADER
// ===================================
function updateDateTime() {
  const now = new Date();
  const options = { 
    day: '2-digit', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  };
  const formatted = now.toLocaleDateString('es-ES', options).replace('.', '');
  document.getElementById('currentDateTime').textContent = formatted;
}

function updateNotificationBadge(count) {
  const badge = document.getElementById('notificationBadge');
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.classList.remove('hidden');
    badge.classList.add('animate-pulse');
  } else {
    badge.classList.add('hidden');
    badge.classList.remove('animate-pulse');
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  };
  return date.toLocaleDateString('es-ES', options).replace('.', '');
}

// ===================================
// 2. CARGAR ESTADÍSTICAS
// ===================================
async function loadStats() {
  try {
    // Cargar noticias (pública, no requiere auth)
    const newsResponse = await fetch(`${API_URL}/news?limit=1000`);
    const newsData = await newsResponse.json();
    document.getElementById('totalNews').textContent = newsData.success ? newsData.data.length : 0;
    
    // Cargar contactos (REQUIERE AUTENTICACIÓN)
    const contactsData = await Auth.authFetch(`${API_URL}/contact`);
    const totalContacts = contactsData.success ? contactsData.data.length : 0;
    const newMessages = contactsData.success ? contactsData.data.filter(c => !c.leido).length : 0;
    
    document.getElementById('totalContacts').textContent = totalContacts;
    document.getElementById('newMessages').textContent = newMessages;
    
    // Mostrar badge si hay mensajes nuevos
    if (newMessages > 0) {
      document.getElementById('badgeNewContacts').classList.remove('hidden');
      document.getElementById('badgeNewContacts').textContent = newMessages;
    }
    
    // Actualizar badge de notificaciones en header
    updateNotificationBadge(newMessages);
    
    // Cargar suscriptores (REQUIERE AUTENTICACIÓN)
    try {
      const subscribersData = await Auth.authFetch(`${API_URL}/newsletter`);
      document.getElementById('totalSubscribers').textContent = subscribersData.success ? subscribersData.data.length : '0';
    } catch (error) {
      console.log('Newsletter API no disponible aún');
      document.getElementById('totalSubscribers').textContent = '0';
    }

    // Cargar eventos (REQUIERE AUTENTICACIÓN)
    try {
      const eventsData = await Auth.authFetch(`${API_URL}/events`);
      document.getElementById('totalEvents').textContent = eventsData.success ? eventsData.data.length : '0';
    } catch (error) {
      console.log('Events API:', error.message);
      document.getElementById('totalEvents').textContent = '0';
    }

    // Cargar imágenes de galería (REQUIERE AUTENTICACIÓN)
    try {
      const galleryData = await Auth.authFetch(`${API_URL}/gallery`);
      document.getElementById('totalGalleryImages').textContent = galleryData.success ? galleryData.data.length : '0';
    } catch (error) {
      console.log('Gallery API:', error.message);
      document.getElementById('totalGalleryImages').textContent = '0';
    }

    // Cargar incidencias (SOLO SUPERADMIN)
    const user = Auth.getUser();
    if (user && user.rol === 'superadmin') {
      try {
        const incidencesData = await Auth.authFetch(`${API_URL}/incidences/admin/todas?limit=1000`);
        if (incidencesData.success) {
          const total = incidencesData.data.length;
          const pendientes = incidencesData.data.filter(i => i.estado === 'pendiente').length;
          
          document.getElementById('totalIncidencias').textContent = total;
          document.getElementById('pendingIncidenciasText').textContent = `${pendientes} pendiente${pendientes !== 1 ? 's' : ''}`;
        }
      } catch (error) {
        console.log('Incidences API:', error.message);
        document.getElementById('totalIncidencias').textContent = '0';
        document.getElementById('pendingIncidenciasText').textContent = '0 pendientes';
      }
    }

  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
    
    if (error.message === 'Sesión expirada') {
      Auth.handleAuthError(error);
    } else {
      showNotification('Error al cargar estadísticas', 'error');
    }
  }
}

// ===================================
// 2. GESTIÓN DE TABS
// ===================================
function initTabs() {
  const tabNews = document.getElementById('tabNews');
  const tabContacts = document.getElementById('tabContacts');
  const tabAdmins = document.getElementById('tabAdmins');
  const tabEmpleados = document.getElementById('tabEmpleados');
  const tabEvents = document.getElementById('tabEvents');
  const tabGallery = document.getElementById('tabGallery');
  const tabTimeRecords = document.getElementById('tabTimeRecords');
  const tabWorkSchedules = document.getElementById('tabWorkSchedules');
  
  const newsSection = document.getElementById('newsSection');
  const contactsSection = document.getElementById('contactsSection');
  const adminsSection = document.getElementById('adminsSection');
  const empleadosSection = document.getElementById('empleadosSection');
  const eventsSection = document.getElementById('eventsSection');
  const gallerySection = document.getElementById('gallerySection');
  const timeRecordsSection = document.getElementById('timeRecordsSection');
  const workSchedulesSection = document.getElementById('workSchedulesSection');
  
  const allTabs = [tabNews, tabContacts, tabAdmins, tabEmpleados, tabEvents, tabGallery, tabTimeRecords, tabWorkSchedules].filter(Boolean);
  const allSections = [newsSection, contactsSection, adminsSection, empleadosSection, eventsSection, gallerySection, timeRecordsSection, workSchedulesSection].filter(Boolean);
  
  // Mapeo de secciones a sus nombres en bulkSelection
  const sectionMap = {
    'newsSection': 'news',
    'contactsSection': 'contacts',
    'adminsSection': 'admins',
    'empleadosSection': 'empleados',
    'eventsSection': 'events',
    'gallerySection': 'gallery',
    'timeRecordsSection': 'timeRecords',
    'workSchedulesSection': 'workSchedules'
  };
  
  function activateTab(activeTab, activeSection, onActivate) {
    // Limpiar intervalo de auto-actualización de Control Horario
    if (timeRecordsSummaryInterval) {
      clearInterval(timeRecordsSummaryInterval);
      timeRecordsSummaryInterval = null;
    }
    
    // Desactivar todos los tabs
    allTabs.forEach(tab => {
      tab?.classList.remove('active', 'bg-gradient-to-r', 'from-orange-500', 'to-orange-600', 'text-white');
      tab?.classList.add('text-gray-600', 'hover:bg-gray-50');
    });
    
    // Ocultar todas las secciones
    allSections.forEach(section => section?.classList.add('hidden'));
    
    // Activar tab seleccionado
    activeTab?.classList.add('active', 'bg-gradient-to-r', 'from-orange-500', 'to-orange-600', 'text-white');
    activeTab?.classList.remove('text-gray-600', 'hover:bg-gray-50');
    
    // Mostrar sección seleccionada
    activeSection?.classList.remove('hidden');
    
    // Sincronizar checkboxes de la sección actual con el estado global
    const sectionId = activeSection?.id;
    const sectionKey = sectionMap[sectionId];
    if (sectionKey) {
      syncSelectionState(sectionKey);
    }
    
    // Ejecutar callback si existe
    if (onActivate) onActivate();
  }
  
  tabNews?.addEventListener('click', () => {
    activateTab(tabNews, newsSection, () => loadNews());
  });
  
  tabContacts?.addEventListener('click', () => {
    activateTab(tabContacts, contactsSection, () => loadContacts());
  });
  
  tabAdmins?.addEventListener('click', () => {
    activateTab(tabAdmins, adminsSection, () => loadAdmins());
  });
  
  tabEmpleados?.addEventListener('click', () => {
    activateTab(tabEmpleados, empleadosSection, () => loadEmpleados());
  });
  
  tabEvents?.addEventListener('click', () => {
    activateTab(tabEvents, eventsSection, () => loadEvents());
  });
  
  tabGallery?.addEventListener('click', () => {
    activateTab(tabGallery, gallerySection, () => loadGallery());
  });
  
  tabTimeRecords?.addEventListener('click', () => {
    activateTab(tabTimeRecords, timeRecordsSection, () => {
      loadTimeRecords();
      loadTimeRecordsSummary();
      
      // Iniciar auto-actualización cada 30 segundos
      if (timeRecordsSummaryInterval) {
        clearInterval(timeRecordsSummaryInterval);
      }
      timeRecordsSummaryInterval = setInterval(() => {
        loadTimeRecordsSummary();
      }, 30000); // 30 segundos
    });
  });
  
  tabWorkSchedules?.addEventListener('click', () => {
    activateTab(tabWorkSchedules, workSchedulesSection, () => initWorkSchedules());
  });
}

// ===================================
// 3. CARGAR NOTICIAS
// ===================================
async function loadNews() {
  const container = document.getElementById('newsContainer');
  
  // Limpiar selección al recargar
  clearSelection('news');
  
  try {
    const response = await fetch(`${API_URL}/news?limit=100`);
    const data = await response.json();
    
    if (!data.success || data.data.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <div class="text-6xl mb-4">📭</div>
          <p class="text-lg mb-2">No hay noticias publicadas</p>
          <p class="text-sm">Crea tu primera noticia haciendo clic en "Nueva Noticia"</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = data.data.map(news => createNewsCard(news)).join('');
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editNews(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteNews(btn.dataset.id, btn.dataset.title));
    });
    
  } catch (error) {
    console.error('Error al cargar noticias:', error);
    container.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <div class="text-6xl mb-4">❌</div>
        <p class="text-lg mb-2">Error al cargar las noticias</p>
        <p class="text-sm">${error.message}</p>
      </div>
    `;
  }
}

// ===================================
// 2. CREAR TARJETA DE NOTICIA
// ===================================
function createNewsCard(news) {
  const fecha = new Date(news.fechaPublicacion).toLocaleDateString('es-ES');
  const categoriaColors = {
    eventos: 'bg-blue-100 text-blue-800',
    promociones: 'bg-green-100 text-green-800',
    noticias: 'bg-purple-100 text-purple-800',
    general: 'bg-gray-100 text-gray-800'
  };
  
  return `
    <div class="news-card border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-lg transition-all" data-section="news">
      <div class="flex flex-col sm:flex-row gap-3 md:gap-4">
        <!-- Checkbox de selección -->
        <div class="flex items-start pt-2">
          <input 
            type="checkbox" 
            class="item-checkbox w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
            data-item-id="${news._id}"
            onchange="toggleItemSelection('news', '${news._id}', this.checked)"
          />
        </div>
        
        ${news.imagen ? `
          <img src="${API_URL.replace('/api', '')}${news.imagen}" alt="${news.titulo}" class="w-full sm:w-24 md:w-32 h-48 sm:h-24 md:h-32 object-cover rounded-lg flex-shrink-0">
        ` : `
          <div class="w-full sm:w-24 md:w-32 h-48 sm:h-24 md:h-32 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="text-4xl">📰</span>
          </div>
        `}
        
        <div class="flex-1 min-w-0">
          <div class="mb-2">
            <h3 class="text-base md:text-lg font-bold text-gray-900 mb-2 break-words">${news.titulo}</h3>
            <div class="flex flex-wrap items-center gap-2 text-xs md:text-sm">
              <span class="px-2 py-1 rounded-full text-xs font-semibold ${categoriaColors[news.categoria]}">${news.categoria}</span>
              <span class="text-gray-500">📅 ${fecha}</span>
              <span class="text-gray-500">👁️ ${news.vistas}</span>
              <span class="${news.publicado ? 'text-green-600' : 'text-gray-400'} font-medium">
                ${news.publicado ? '✓ Publicado' : '○ Borrador'}
              </span>
            </div>
          </div>
          
          <p class="text-gray-600 text-xs md:text-sm mb-3 line-clamp-2">${news.resumen}</p>
          
          <div class="flex flex-col sm:flex-row gap-2">
            <button 
              class="btn-edit bg-blue-500 hover:bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors"
              data-id="${news._id}"
            >
              ✏️ Editar
            </button>
            <button 
              class="btn-delete bg-red-500 hover:bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors"
              data-id="${news._id}"
              data-title="${news.titulo}"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ===================================
// 3. MODAL - ABRIR/CERRAR
// ===================================
const modal = document.getElementById('newsModal');
const modalTitle = document.getElementById('modalTitle');
const form = document.getElementById('newsForm');
let editingNewsId = null;

function openModal(title = 'Nueva Noticia') {
  modalTitle.textContent = title;
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
  form.reset();
  editingNewsId = null;
  document.getElementById('newsId').value = '';
  document.getElementById('imagePreview').classList.add('hidden');
}

document.getElementById('btnNewNews').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('btnCancelModal').addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// ===================================
// 4. VISTA PREVIA DE IMAGEN
// ===================================
document.getElementById('imagen').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('previewImg').src = e.target.result;
      document.getElementById('imagePreview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
});

// Contador de caracteres para resumen
document.getElementById('resumen').addEventListener('input', (e) => {
  document.getElementById('resumenCount').textContent = e.target.value.length;
});

// ===================================
// 5. CREAR/ACTUALIZAR NOTICIA
// ===================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  
  try {
    submitButton.disabled = true;
    submitButton.textContent = editingNewsId ? 'Actualizando...' : 'Guardando...';
    
    const formData = new FormData();
    formData.append('titulo', document.getElementById('titulo').value.trim());
    formData.append('resumen', document.getElementById('resumen').value.trim());
    formData.append('contenido', document.getElementById('contenido').value.trim());
    formData.append('categoria', document.getElementById('categoria').value);
    formData.append('publicado', document.getElementById('publicado').checked);
    
    const imagenInput = document.getElementById('imagen');
    if (imagenInput.files[0]) {
      formData.append('imagen', imagenInput.files[0]);
    }
    
    const url = editingNewsId 
      ? `${API_URL}/news/${editingNewsId}` 
      : `${API_URL}/news`;
    
    const method = editingNewsId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al guardar la noticia');
    }
    
    showNotification(
      editingNewsId ? '✅ Noticia actualizada correctamente' : '✅ Noticia creada correctamente',
      'success'
    );
    
    closeModal();
    loadNews();
    
  } catch (error) {
    console.error('Error:', error);
    showNotification('❌ ' + error.message, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
});

// ===================================
// 6. EDITAR NOTICIA
// ===================================
async function editNews(id) {
  try {
    const response = await fetch(`${API_URL}/news/${id}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('No se pudo cargar la noticia');
    }
    
    const news = data.data;
    
    // Llenar el formulario
    document.getElementById('newsId').value = news._id;
    document.getElementById('titulo').value = news.titulo;
    document.getElementById('resumen').value = news.resumen;
    document.getElementById('contenido').value = news.contenido;
    document.getElementById('categoria').value = news.categoria;
    document.getElementById('publicado').checked = news.publicado;
    
    // Mostrar imagen actual si existe
    if (news.imagen) {
      document.getElementById('previewImg').src = `${API_URL.replace('/api', '')}${news.imagen}`;
      document.getElementById('imagePreview').classList.remove('hidden');
    }
    
    editingNewsId = news._id;
    openModal('Editar Noticia');
    
  } catch (error) {
    console.error('Error al cargar noticia:', error);
    showNotification('❌ Error al cargar la noticia', 'error');
  }
}

// ===================================
// 7. ELIMINAR NOTICIA (REQUIERE AUTH)
// ===================================
async function deleteNews(id, silentOrTitle = false) {
  // Si silentOrTitle es boolean true, es modo silencioso (para bulk delete)
  const isSilent = silentOrTitle === true;
  const title = typeof silentOrTitle === 'string' ? silentOrTitle : '';
  
  if (!isSilent && !confirm(`¿Estás seguro de eliminar la noticia "${title}"?\n\nEsta acción no se puede deshacer.`)) {
    return;
  }
  
  try {
    const data = await Auth.authFetch(`${API_URL}/news/${id}`, {
      method: 'DELETE'
    });
    
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al eliminar la noticia');
    }
    
    if (!isSilent) {
      showNotification('✅ Noticia eliminada correctamente', 'success');
      loadNews();
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Error al eliminar:', error);
    
    if (!isSilent) {
      if (error.message === 'Sesión expirada') {
        Auth.handleAuthError(error);
      } else {
        showNotification('❌ ' + error.message, 'error');
      }
    }
    
    throw error;
  }
}

// ===================================
// 8. CARGAR CONTACTOS (REQUIERE AUTH)
// ===================================
async function loadContacts(filter = 'all') {
  const container = document.getElementById('contactsContainer');
  currentFilter = filter;
  
  // Limpiar selección al recargar
  clearSelection('contacts');
  
  try {
    const data = await Auth.authFetch(`${API_URL}/contact`);
    
    if (!data.success || data.data.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <div class="text-6xl mb-4">📭</div>
          <p class="text-lg mb-2">No hay mensajes de contacto</p>
          <p class="text-sm">Los mensajes aparecerán aquí cuando los usuarios envíen el formulario</p>
        </div>
      `;
      return;
    }
    
    // Filtrar contactos según el filtro activo
    let contacts = data.data;
    if (filter === 'unread') {
      contacts = contacts.filter(c => !c.leido);
    } else if (filter === 'read') {
      contacts = contacts.filter(c => c.leido);
    }
    
    // Ordenar por fecha (más recientes primero)
    contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (contacts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <div class="text-6xl mb-4">🔍</div>
          <p class="text-lg">No hay mensajes con este filtro</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = contacts.map(contact => createContactCard(contact)).join('');
    
    // Event listeners ya están en el HTML (onclick en las tarjetas)
    
  } catch (error) {
    console.error('Error al cargar contactos:', error);
    container.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <div class="text-6xl mb-4">❌</div>
        <p class="text-lg mb-2">Error al cargar los mensajes</p>
        <p class="text-sm">${error.message}</p>
      </div>
    `;
  }
}

// ===================================
// 10. CREAR TARJETA DE CONTACTO
// ===================================
function createContactCard(contact) {
  const fecha = new Date(contact.createdAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const statusBadge = contact.respondido 
    ? '<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Respondido</span>'
    : contact.leido 
    ? '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Leído</span>'
    : '<span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">Nuevo</span>';
  
  const borderClass = !contact.leido ? 'border-l-4 border-orange-500' : 'border-l-4 border-transparent';
  
  return `
    <div class="contact-card bg-white rounded-lg shadow hover:shadow-lg transition-all p-4 md:p-6 ${borderClass}" data-section="contacts">
      <div class="flex gap-3 mb-3">
        <!-- Checkbox de selección -->
        <div class="flex items-start pt-1">
          <input 
            type="checkbox" 
            class="item-checkbox w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
            data-item-id="${contact._id}"
            onchange="toggleItemSelection('contacts', '${contact._id}', this.checked)"
            onclick="event.stopPropagation()"
          />
        </div>
        
        <!-- Contenido clickeable -->
        <div class="flex-1 cursor-pointer" onclick="viewContact('${contact._id}')">
          <div class="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
            <div class="flex-1 w-full sm:w-auto">
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h3 class="text-base md:text-lg font-bold text-gray-900 break-words">${contact.nombre}</h3>
                ${statusBadge}
              </div>
              <p class="text-xs md:text-sm text-blue-600 break-all">${contact.email}</p>
            </div>
            <div class="text-xs md:text-sm text-gray-500 flex-shrink-0">
              <p>📅 ${fecha}</p>
            </div>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-3 mt-3">
            <p class="text-gray-700 text-xs md:text-sm line-clamp-2">${contact.mensaje}</p>
          </div>
          
          <div class="flex items-center justify-end mt-3 gap-3 text-xs text-gray-500 flex-wrap">
            ${!contact.leido ? '<span class="flex items-center"><span class="w-2 h-2 bg-orange-500 rounded-full mr-1 animate-pulse"></span> Sin leer</span>' : ''}
            ${contact.leido ? '<span class="flex items-center gap-1">✓ Leído</span>' : ''}
            ${contact.respondido ? '<span class="flex items-center gap-1">↩️ Respondido</span>' : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ===================================
// 11. VER DETALLE DE CONTACTO
// ===================================
async function viewContact(id) {
  try {
    const response = await fetch(`${API_URL}/contact/${id}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('No se pudo cargar el mensaje');
    }
    
    const contact = data.data;
    currentContactId = id;
    
    // Llenar modal
    document.getElementById('contactName').textContent = contact.nombre;
    document.getElementById('contactEmail').textContent = contact.email;
    
    const fecha = new Date(contact.createdAt).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    document.getElementById('contactDate').textContent = fecha;
    
    // Estado
    const statusHtml = contact.respondido 
      ? '<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">✓ Respondido</span>'
      : contact.leido 
      ? '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">✓ Leído</span>'
      : '<span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">● Nuevo</span>';
    document.getElementById('contactStatus').innerHTML = statusHtml;
    
    document.getElementById('contactMessage').textContent = contact.mensaje;
    
    // Configurar botón de email
    const mailtoLink = `mailto:${contact.email}?subject=Re: Consulta Partyventura&body=Hola ${contact.nombre},%0D%0A%0D%0A`;
    document.getElementById('btnReplyEmail').href = mailtoLink;
    
    // Actualizar botones según estado
    const btnMarkAsRead = document.getElementById('btnMarkAsRead');
    const btnMarkAsResponded = document.getElementById('btnMarkAsResponded');
    
    if (contact.leido) {
      btnMarkAsRead.disabled = true;
      btnMarkAsRead.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      btnMarkAsRead.disabled = false;
      btnMarkAsRead.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    
    if (contact.respondido) {
      btnMarkAsResponded.disabled = true;
      btnMarkAsResponded.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      btnMarkAsResponded.disabled = false;
      btnMarkAsResponded.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    
    // Mostrar modal
    document.getElementById('contactModal').classList.remove('hidden');
    
    // Marcar como leído automáticamente si no lo está
    if (!contact.leido) {
      await updateContactStatus(id, { leido: true });
    }
    
  } catch (error) {
    console.error('Error:', error);
    showNotification('❌ ' + error.message, 'error');
  }
}

// ===================================
// 12. ACTUALIZAR ESTADO DE CONTACTO (REQUIERE AUTH)
// ===================================
async function updateContactStatus(id, updates) {
  try {
    const data = await Auth.authFetch(`${API_URL}/contact/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    if (!data.success) {
      throw new Error(data.message || 'Error al actualizar');
    }
    
    // Recargar contactos y estadísticas
    await loadContacts(currentFilter);
    await loadStats();
    
    return true;
  } catch (error) {
    console.error('Error:', error);
    
    if (error.message === 'Sesión expirada') {
      Auth.handleAuthError(error);
    }
    throw error;
  }
}

// ===================================
// 13. ELIMINAR CONTACTO (REQUIERE AUTH)
// ===================================
async function deleteContact(id, silent = false) {
  if (!silent && !confirm('¿Estás seguro de eliminar este mensaje? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    const data = await Auth.authFetch(`${API_URL}/contact/${id}`, {
      method: 'DELETE'
    });
    
    
    if (!data.success) {
      throw new Error(data.message || 'Error al eliminar');
    }
    
    if (!silent) {
      showNotification('✓ Mensaje eliminado correctamente', 'success');
      document.getElementById('contactModal').classList.add('hidden');
      await loadContacts(currentFilter);
      await loadStats();
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Error:', error);
    
    if (!silent) {
      if (error.message === 'Sesión expirada') {
        Auth.handleAuthError(error);
      } else {
        showNotification('❌ ' + error.message, 'error');
      }
    }
    
    throw error;
  }
}

// ===================================
// 14. FILTROS DE CONTACTOS
// ===================================
function initContactFilters() {
  const btnFilterAll = document.getElementById('btnFilterAll');
  const btnFilterUnread = document.getElementById('btnFilterUnread');
  const btnFilterRead = document.getElementById('btnFilterRead');
  
  const setActiveFilter = (activeBtn) => {
    [btnFilterAll, btnFilterUnread, btnFilterRead].forEach(btn => {
      btn.classList.remove('bg-orange-100', 'text-orange-600');
      btn.classList.add('text-gray-600', 'hover:bg-gray-100');
    });
    activeBtn.classList.add('bg-orange-100', 'text-orange-600');
    activeBtn.classList.remove('text-gray-600', 'hover:bg-gray-100');
  };
  
  btnFilterAll.addEventListener('click', () => {
    setActiveFilter(btnFilterAll);
    loadContacts('all');
  });
  
  btnFilterUnread.addEventListener('click', () => {
    setActiveFilter(btnFilterUnread);
    loadContacts('unread');
  });
  
  btnFilterRead.addEventListener('click', () => {
    setActiveFilter(btnFilterRead);
    loadContacts('read');
  });
}

// ===================================
// 15. MODAL DE CONTACTO
// ===================================
function initContactModal() {
  const modal = document.getElementById('contactModal');
  const closeBtn = document.getElementById('closeContactModal');
  const btnMarkAsRead = document.getElementById('btnMarkAsRead');
  const btnMarkAsResponded = document.getElementById('btnMarkAsResponded');
  const btnDelete = document.getElementById('btnDeleteContact');
  
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
  
  btnMarkAsRead.addEventListener('click', async () => {
    try {
      await updateContactStatus(currentContactId, { leido: true });
      showNotification('✓ Marcado como leído', 'success');
      modal.classList.add('hidden');
    } catch (error) {
      showNotification('❌ ' + error.message, 'error');
    }
  });
  
  btnMarkAsResponded.addEventListener('click', async () => {
    try {
      await updateContactStatus(currentContactId, { leido: true, respondido: true });
      showNotification('✓ Marcado como respondido', 'success');
      modal.classList.add('hidden');
    } catch (error) {
      showNotification('❌ ' + error.message, 'error');
    }
  });
  
  btnDelete.addEventListener('click', () => {
    deleteContact(currentContactId);
  });
}

// ===================================
// 8. GESTIÓN DE ADMINISTRADORES (SOLO SUPERADMIN)
// ===================================

// Mostrar tabs de administradores, empleados, horarios y control horario basado en rol
function checkAdminTabVisibility() {
  const user = Auth.getUser();
  const tabAdmins = document.getElementById('tabAdmins');
  const tabEmpleados = document.getElementById('tabEmpleados');
  const tabTimeRecords = document.getElementById('tabTimeRecords');
  const tabWorkSchedules = document.getElementById('tabWorkSchedules');
  const incidencesCard = document.getElementById('incidencesStatsCard');
  const horariosCard = document.getElementById('statsHorarios');
  const trabajandoAhoraCard = document.getElementById('statsTrabajandoAhora');
  
  if (user && user.rol === 'superadmin') {
    // Superadmin ve todo (incluyendo tarjeta de incidencias)
    tabAdmins?.classList.remove('hidden');
    tabEmpleados?.classList.remove('hidden');
    tabTimeRecords?.classList.remove('hidden');
    tabWorkSchedules?.classList.remove('hidden');
    incidencesCard?.classList.remove('hidden');
    horariosCard?.classList.remove('hidden');
    trabajandoAhoraCard?.classList.remove('hidden');
  } else if (user && user.rol === 'admin') {
    // Admin solo ve empleados (NO incidencias - requiere superadmin)
    tabAdmins?.classList.add('hidden');
    tabEmpleados?.classList.remove('hidden');
    tabTimeRecords?.classList.add('hidden');
    tabWorkSchedules?.classList.add('hidden');
    incidencesCard?.classList.add('hidden');
    horariosCard?.classList.add('hidden');
    trabajandoAhoraCard?.classList.add('hidden');
  } else {
    // Empleados no ven nada de administración
    tabAdmins?.classList.add('hidden');
    tabEmpleados?.classList.add('hidden');
    tabTimeRecords?.classList.add('hidden');
    tabWorkSchedules?.classList.add('hidden');
    incidencesCard?.classList.add('hidden');
    horariosCard?.classList.add('hidden');
    trabajandoAhoraCard?.classList.add('hidden');
  }
}

// Cargar lista de administradores
async function loadAdmins() {
  const container = document.getElementById('adminsContainer');
  
  try {
    const data = await Auth.authFetch(`${API_URL}/admins`);
    
    if (!data.success || data.data.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <div class="text-6xl mb-4">👥</div>
          <p class="text-lg mb-2">No hay administradores registrados</p>
        </div>
      `;
      return;
    }
    
    const currentUser = Auth.getUser();
    
    container.innerHTML = data.data.map(admin => {
      const isSelf = admin._id === currentUser.id || admin.username === currentUser.username;
      const isBlocked = admin.intentosFallidos >= 5;
      const statusClass = isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
      const statusText = isBlocked ? 'Bloqueado' : 'Activo';
      
      return `
        <div class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-100">
          <!-- Header con Avatar y Nombre -->
          <div class="flex items-start gap-4 mb-4">
            <div class="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
              ${(admin.nombre || admin.username).charAt(0).toUpperCase()}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-lg font-bold text-gray-900 truncate">
                  ${admin.nombre || admin.username}
                  ${isSelf ? '<span class="text-xs font-normal text-gray-500">(tú)</span>' : ''}
                </h3>
              </div>
              <p class="text-sm text-gray-600 truncate">@${admin.username}</p>
              <p class="text-sm text-gray-500 truncate">${admin.email}</p>
            </div>
          </div>
          
          <!-- Badges de Estado y Rol -->
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusClass}">
              ${statusText}
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${admin.rol === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
              ${admin.rol === 'superadmin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
          
          <!-- Información adicional -->
          <div class="text-xs text-gray-500 space-y-1 mb-4">
            <div>Creado: ${formatDate(admin.createdAt)}</div>
            <div>Último acceso: ${admin.ultimoAcceso ? formatDate(admin.ultimoAcceso) : 'Nunca'}</div>
            ${isBlocked ? `<div class="text-red-600 font-semibold">Intentos fallidos: ${admin.intentosFallidos}/5</div>` : ''}
          </div>
          
          <!-- Acciones -->
          <div class="flex flex-wrap gap-2">
            ${!isSelf ? `
              <button 
                onclick="showEditAdminModal('${admin._id}')"
                class="flex-1 min-w-[120px] bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                ✏️ Editar
              </button>
              <button 
                onclick="toggleAdminRole('${admin._id}', '${admin.rol}')"
                class="flex-1 min-w-[120px] bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                🔄 Cambiar Rol
              </button>
              ${isBlocked ? `
                <button 
                  onclick="unlockAdmin('${admin._id}')"
                  class="flex-1 min-w-[120px] bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  🔓 Desbloquear
                </button>
              ` : ''}
              <button 
                onclick="deleteAdmin('${admin._id}', '${admin.username}')"
                class="flex-1 min-w-[120px] bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                🗑️ Eliminar
              </button>
            ` : `
              <div class="flex-1 text-center text-gray-500 text-sm py-2">
                No puedes modificar tu propia cuenta
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error al cargar administradores:', error);
    
    if (error.message === 'Sesión expirada') {
      Auth.handleAuthError(error);
    } else {
      showNotification('Error al cargar administradores', 'error');
      container.innerHTML = `
        <div class="text-center py-12 text-red-500">
          <div class="text-6xl mb-4">⚠️</div>
          <p class="text-lg">Error al cargar administradores</p>
        </div>
      `;
    }
  }
}

// Mostrar modal para crear/editar administrador
async function showEditAdminModal(adminId = null) {
  const modal = document.getElementById('adminModal');
  const form = document.getElementById('adminForm');
  const title = document.getElementById('adminModalTitle');
  const passwordInput = document.getElementById('adminPassword');
  const passwordRequired = document.getElementById('passwordRequired');
  const passwordHint = document.getElementById('passwordHint');
  const emailInput = document.getElementById('adminEmail');
  
  // Resetear formulario
  form.reset();
  document.getElementById('adminId').value = '';
  
  // FORZAR que email NO sea requerido
  if (emailInput) {
    emailInput.removeAttribute('required');
    emailInput.required = false;
  }
  
  if (adminId) {
    // Modo edición
    title.textContent = 'Editar Administrador';
    passwordInput.removeAttribute('required');
    passwordRequired.classList.add('hidden');
    passwordHint.textContent = 'Déjalo en blanco para mantener la actual. ';
    
    try {
      // Cargar datos del admin (desde la lista ya cargada)
      const data = await Auth.authFetch(`${API_URL}/admins`);
      const admin = data.data.find(a => a._id === adminId);
      
      if (admin) {
        document.getElementById('adminId').value = admin._id;
        document.getElementById('adminUsername').value = admin.username;
        document.getElementById('adminEmail').value = admin.email;
        document.getElementById('adminRoleSelect').value = admin.rol;
      }
    } catch (error) {
      console.error('Error al cargar admin:', error);
      showNotification('Error al cargar datos del administrador', 'error');
      return;
    }
  } else {
    // Modo creación
    title.textContent = 'Nuevo Administrador';
    passwordInput.setAttribute('required', 'required');
    passwordRequired.classList.remove('hidden');
    passwordHint.textContent = 'Requerida. ';
    
    // Establecer valor por defecto para el rol
    const rolSelect = document.getElementById('adminRoleSelect');
    if (rolSelect) {
      rolSelect.value = 'admin'; // Valor por defecto
    }
  }
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}
// Cerrar modal de administrador
function closeAdminModal() {
  const modal = document.getElementById('adminModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.getElementById('adminForm').reset();
}

// Guardar administrador (crear o actualizar)
async function handleAdminSubmit(event) {
  event.preventDefault();
  
  const adminId = document.getElementById('adminId').value;
  const username = document.getElementById('adminUsername').value.trim();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const rol = document.getElementById('adminRoleSelect')?.value;
  
  // Validaciones
  if (!username || !rol) {
    showNotification('Por favor completa todos los campos obligatorios', 'error');
    return;
  }
  
  // Validar formato de email solo si se proporciona
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showNotification('Por favor ingresa un email válido', 'error');
    return;
  }
  
  if (!adminId && !password) {
    showNotification('La contraseña es obligatoria para nuevos administradores', 'error');
    return;
  }
  
  if (password && password.length < 6) {
    showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }
  
  // Preparar datos para enviar al backend
  const adminData = { 
    nombreUsuario: username,  // Backend espera "nombreUsuario"
    rol 
  };
  
  // Solo agregar email si tiene valor
  if (email) {
    adminData.email = email;
  }
  
  if (password) {
    adminData.password = password;
  }
  
  try {
    let response;
    
    if (adminId) {
      // Actualizar existente
      response = await Auth.authFetch(`${API_URL}/admins/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData)
      });
    } else {
      // Crear nuevo
      response = await Auth.authFetch(`${API_URL}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData)
      });
    }
    
    const data = await response.json();
    
    if (data.success) {
      showNotification(adminId ? 'Administrador actualizado' : 'Administrador creado', 'success');
      closeAdminModal();
      loadAdmins();
    } else {
      showNotification(data.message || 'Error al guardar administrador', 'error');
    }
    
  } catch (error) {
    console.error('Error al guardar administrador:', error);
    
    if (error.message === 'Sesión expirada') {
      Auth.handleAuthError(error);
    } else {
      showNotification('Error al guardar administrador', 'error');
    }
  }
}

// Cambiar rol de administrador
async function toggleAdminRole(adminId, currentRole) {
  const newRole = currentRole === 'admin' ? 'superadmin' : 'admin';
  const roleText = newRole === 'superadmin' ? 'Super Administrador' : 'Administrador';
  
  if (!confirm(`¿Cambiar rol a "${roleText}"?`)) {
    return;
  }
  
  try {
    const data = await Auth.authFetch(`${API_URL}/admins/${adminId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol: newRole })
    });
    
    if (data.success) {
      showNotification(`Rol cambiado a ${roleText}`, 'success');
      loadAdmins();
    } else {
      showNotification(data.message || 'Error al cambiar rol', 'error');
    }
    
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    
    if (error.message === 'Sesión expirada') {
      Auth.handleAuthError(error);
    } else {
      showNotification('Error al cambiar rol', 'error');
    }
  }
}

// Desbloquear administrador
async function unlockAdmin(adminId) {
  if (!confirm('¿Desbloquear este administrador?')) {
    return;
  }
  
  try {
    const data = await Auth.authFetch(`${API_URL}/admins/${adminId}/unlock`, {
      method: 'PATCH'
    });
    
    
    if (data.success) {
      showNotification('Administrador desbloqueado', 'success');
      loadAdmins();
    } else {
      showNotification(data.message || 'Error al desbloquear', 'error');
    }
    
  } catch (error) {
    console.error('Error al desbloquear admin:', error);
    
    if (error.message === 'Sesión expirada') {
      Auth.handleAuthError(error);
    } else {
      showNotification('Error al desbloquear administrador', 'error');
    }
  }
}

// Eliminar administrador
async function deleteAdmin(adminId, username) {
  if (!confirm(`¿Eliminar al administrador "${username}"?\n\nEsta acción no se puede deshacer.`)) {
    return;
  }
  
  try {
    const data = await Auth.authFetch(`${API_URL}/admins/${adminId}`, {
      method: 'DELETE'
    });
    
    
    if (data.success) {
      showNotification('Administrador eliminado', 'success');
      loadAdmins();
    } else {
      showNotification(data.message || 'Error al eliminar', 'error');
    }
    
  } catch (error) {
    console.error('Error al eliminar admin:', error);
    
    if (error.message === 'Sesión expirada') {
      Auth.handleAuthError(error);
    } else {
      showNotification('Error al eliminar administrador', 'error');
    }
  }
}

// Inicializar funcionalidad de administradores
function initAdminManagement() {
  // Verificar visibilidad del tab
  checkAdminTabVisibility();
  
  // Event listeners
  const tabAdmins = document.getElementById('tabAdmins');
  const btnNewAdmin = document.getElementById('btnNewAdmin');
  const btnCloseAdminModal = document.getElementById('btnCloseAdminModal');
  const btnCancelAdmin = document.getElementById('btnCancelAdmin');
  const adminForm = document.getElementById('adminForm');
  
  // Cambiar a tab de administradores
  if (tabAdmins) {
    tabAdmins.addEventListener('click', () => {
      // Desactivar otros tabs
      document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('active', 'bg-gradient-to-r', 'from-orange-500', 'to-orange-600', 'text-white');
        tab.classList.add('text-gray-600', 'hover:bg-gray-50');
      });
      
      // Activar este tab
      tabAdmins.classList.add('active', 'bg-gradient-to-r', 'from-orange-500', 'to-orange-600', 'text-white');
      tabAdmins.classList.remove('text-gray-600', 'hover:bg-gray-50');
      
      // Ocultar otras secciones
      document.getElementById('newsSection').classList.add('hidden');
      document.getElementById('contactsSection').classList.add('hidden');
      
      // Mostrar sección de admins
      document.getElementById('adminsSection').classList.remove('hidden');
      
      // Cargar admins
      loadAdmins();
    });
  }
  
  // Botón nuevo admin
  if (btnNewAdmin) {
    btnNewAdmin.addEventListener('click', () => showEditAdminModal());
  }
  
  // Cerrar modal
  if (btnCloseAdminModal) {
    btnCloseAdminModal.addEventListener('click', closeAdminModal);
  }
  if (btnCancelAdmin) {
    btnCancelAdmin.addEventListener('click', closeAdminModal);
  }
  
  // Submit formulario
  if (adminForm) {
    // FORZAR desactivación de validación HTML5
    adminForm.setAttribute('novalidate', 'novalidate');
    
    // Remover required del campo email (por si acaso)
    const emailField = document.getElementById('adminEmail');
    if (emailField) {
      emailField.removeAttribute('required');
      emailField.required = false;
    }
    
    adminForm.addEventListener('submit', handleAdminSubmit);
  }
  
  // Toggle visibilidad contraseña de admin
  const toggleAdminPassword = document.getElementById('toggleAdminPassword');
  const adminPasswordInput = document.getElementById('adminPassword');
  
  if (toggleAdminPassword && adminPasswordInput) {
    toggleAdminPassword.addEventListener('click', () => {
      const isPassword = adminPasswordInput.type === 'password';
      adminPasswordInput.type = isPassword ? 'text' : 'password';
      // Cambiar emoji
      toggleAdminPassword.textContent = isPassword ? '🙈' : '👁️';
    });
  }
  
  // Cerrar modal al hacer clic fuera
  const adminModal = document.getElementById('adminModal');
  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) {
        closeAdminModal();
      }
    });
  }
}

// ===================================
// 8B. GESTIÓN DE EMPLEADOS
// ===================================

// Cargar lista de empleados
async function loadEmpleados() {
  const container = document.getElementById('empleadosContainer');
  
  if (!container) {
    console.error('Contenedor de empleados no encontrado');
    return;
  }
  
  container.innerHTML = '<p class="text-center text-gray-500">⏳ Cargando empleados...</p>';
  
  // Limpiar selección al recargar
  clearSelection('empleados');
  
  try {
    const data = await Auth.authFetch(`${API_URL}/admins/empleados`);
    
    if (data.success && Array.isArray(data.data)) {
      displayEmpleados(data.data);
    } else {
      container.innerHTML = '<p class="text-center text-red-500">❌ Error al cargar empleados</p>';
    }
    
  } catch (error) {
    console.error('Error al cargar empleados:', error);
    
    if (error.message === 'Sesión expirada') {
      Auth.handleAuthError(error);
    } else {
      container.innerHTML = '<p class="text-center text-red-500">❌ Error de conexión</p>';
    }
  }
}

// Mostrar empleados en la UI
function displayEmpleados(empleados) {
  const container = document.getElementById('empleadosContainer');
  
  if (!empleados || empleados.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <p class="text-6xl mb-4">👔</p>
        <p class="text-gray-500 text-lg">No hay empleados registrados</p>
        <p class="text-gray-400 text-sm mt-2">Haz clic en "Nuevo Empleado" para agregar uno</p>
      </div>
    `;
    return;
  }
  
  const empleadosHTML = empleados.map(empleado => {
    // Texto según puesto de trabajo del empleado
    const roleInfo = {
      monitor: { text: 'Monitor', color: 'blue' },
      cocina: { text: 'Cocina', color: 'orange' },
      barra: { text: 'Barra', color: 'purple' }
    };
    
    const role = roleInfo[empleado.rolEmpleado] || { text: 'Empleado', color: 'blue' };
    
    return `
    <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-${role.color}-500" data-section="empleados">
      <div class="flex items-start gap-4 mb-4">
        <!-- Checkbox de selección -->
        <div class="pt-1">
          <input 
            type="checkbox" 
            class="item-checkbox w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
            data-item-id="${empleado._id}"
            onchange="toggleItemSelection('empleados', '${empleado._id}', this.checked)"
          />
        </div>
        
        <div class="flex-1">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-xl font-bold text-gray-800 mb-1">${empleado.nombre || empleado.username}</h3>
              <p class="text-sm text-gray-600">
                <span class="inline-block bg-${role.color}-100 text-${role.color}-800 px-3 py-1 rounded-full text-xs font-semibold">
                  ${role.text}
                </span>
              </p>
            </div>
            <div class="flex gap-2">
              <button 
                onclick="showEmpleadoModal('${empleado._id}')"
                class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                title="Editar"
              >
                ✏️
              </button>
              <button 
                onclick="deleteEmpleado('${empleado._id}', '${empleado.username}')"
                class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                title="Eliminar"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <div class="space-y-2 text-sm text-gray-600">
            <p><strong>Usuario:</strong> ${empleado.username}</p>
            <p><strong>Email:</strong> ${empleado.email || '<em>No proporcionado</em>'}</p>
            <p class="text-xs text-gray-400">
              <strong>Creado:</strong> ${new Date(empleado.createdAt).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
  }).join('');
  
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${empleadosHTML}
    </div>
  `;
}

// Mostrar modal de empleado (crear o editar)
async function showEmpleadoModal(empleadoId = null) {
  const modal = document.getElementById('empleadoModal');
  const form = document.getElementById('empleadoForm');
  const title = document.getElementById('empleadoModalTitle');
  const passwordField = document.getElementById('empleadoPassword');
  const passwordLabel = document.getElementById('empleadoPasswordLabel');
  const passwordHint = document.getElementById('empleadoPasswordHint');
  
  // Resetear formulario
  form.reset();
  document.getElementById('empleadoId').value = '';
  
  // Configurar para crear o editar
  if (empleadoId) {
    // Modo edición
    title.textContent = 'Editar Empleado';
    passwordField.removeAttribute('required');
    passwordLabel.textContent = '';
    passwordHint.textContent = 'Dejar en blanco para mantener la contraseña actual';
    
    // Cargar datos del empleado
    try {
      const data = await Auth.authFetch(`${API_URL}/admins/empleados/${empleadoId}`);
      
      if (data.success && data.data) {
        const empleado = data.data;
        document.getElementById('empleadoId').value = empleado._id;
        document.getElementById('empleadoUsername').value = empleado.username;
        document.getElementById('empleadoNombre').value = empleado.nombre || '';
        document.getElementById('empleadoEmail').value = empleado.email || '';
        document.getElementById('empleadoRolEmpleado').value = empleado.rolEmpleado || '';
      }
    } catch (error) {
      console.error('Error al cargar empleado:', error);
      showNotification('Error al cargar datos del empleado', 'error');
    }
    
  } else {
    // Modo creación
    title.textContent = 'Nuevo Empleado';
    passwordField.setAttribute('required', 'required');
    passwordLabel.textContent = '*';
    passwordHint.textContent = 'Mínimo 6 caracteres';
  }
  
  // Mostrar modal
  modal.classList.remove('hidden');
}

// Cerrar modal de empleado
function closeEmpleadoModal() {
  const modal = document.getElementById('empleadoModal');
  const form = document.getElementById('empleadoForm');
  
  modal.classList.add('hidden');
  form.reset();
}

// Manejar envío del formulario de empleado
async function handleEmpleadoSubmit(event) {
  event.preventDefault();
  
  // Obtener valores
  const empleadoId = document.getElementById('empleadoId').value;
  const username = document.getElementById('empleadoUsername').value.trim();
  const nombre = document.getElementById('empleadoNombre').value.trim();
  const email = document.getElementById('empleadoEmail').value.trim();
  const password = document.getElementById('empleadoPassword').value;
  const rolEmpleado = document.getElementById('empleadoRolEmpleado').value;
  
  // Validación básica
  if (!username || !nombre || !rolEmpleado) {
    showNotification('Por favor completa los campos obligatorios', 'error');
    return;
  }
  
  // Validar contraseña solo si se proporciona
  if (password && password.length < 6) {
    showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }
  
  // Validar email si se proporciona
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification('Por favor ingresa un email válido', 'error');
      return;
    }
  }
  
  // Advertencia si no hay email y no hay password (no se podrá enviar credenciales)
  if (!empleadoId && !password && !email) {
    const confirmacion = confirm(
      '⚠️ No se ha proporcionado ni contraseña ni email.\n\n' +
      'Se generará una contraseña automática pero NO se enviará por email.\n' +
      'Deberás comunicar las credenciales al empleado manualmente.\n\n' +
      '¿Deseas continuar?'
    );
    if (!confirmacion) return;
  }
  
  // Preparar datos
  const empleadoData = {
    nombreUsuario: username,
    nombre: nombre,
    rol: 'empleado',  // Siempre empleado
    rolEmpleado: rolEmpleado
  };
  
  // Agregar email solo si se proporciona
  if (email) {
    empleadoData.email = email;
  }
  
  // Agregar password solo si se proporciona
  if (password) {
    empleadoData.password = password;
  }
  
  try {
    const url = empleadoId 
      ? `${API_URL}/admins/empleados/${empleadoId}`
      : `${API_URL}/admins/empleados`;
    
    const method = empleadoId ? 'PUT' : 'POST';
    
    const data = await Auth.authFetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(empleadoData)
    });
    
    if (data.success) {
      // Mostrar mensaje especial si se envió email
      let message = empleadoId ? 'Empleado actualizado correctamente' : 'Empleado creado correctamente';
      
      if (!empleadoId && data.emailSent) {
        message += '\n\n📧 Se ha enviado un email al empleado con sus credenciales y un link para cambiar su contraseña.';
      } else if (!empleadoId && data.tempPasswordGenerated && !data.emailSent) {
        message += `\n\n🔑 Contraseña temporal generada:\n${data.message.split(': ')[1]?.split('.')[0] || 'Ver consola'}\n\n⚠️ Comunica estas credenciales al empleado.`;
      }
      
      showNotification(message, 'success');
      closeEmpleadoModal();
      loadEmpleados();
    } else {
      showNotification(data.message || 'Error al guardar empleado', 'error');
    }
    
  } catch (error) {
    console.error('Error al guardar empleado:', error);
    
    if (error.message === 'Sesión expirada') {
      Auth.handleAuthError(error);
    } else {
      showNotification('Error al guardar empleado', 'error');
    }
  }
}

// Eliminar empleado
async function deleteEmpleado(empleadoId, username, silent = false) {
  if (!silent && !confirm(`¿Eliminar al empleado "${username}"?\n\nEsta acción no se puede deshacer.`)) {
    return;
  }
  
  try {
    const data = await Auth.authFetch(`${API_URL}/admins/empleados/${empleadoId}`, {
      method: 'DELETE'
    });
    
    
    if (data.success) {
      if (!silent) {
        showNotification('Empleado eliminado correctamente', 'success');
        loadEmpleados();
      }
      return { success: true };
    } else {
      if (!silent) {
        showNotification(data.message || 'Error al eliminar', 'error');
      }
      return { success: false };
    }
    
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    
    if (error.message === 'Sesión expirada') {
      Auth.handleAuthError(error);
    } else if (!silent) {
      showNotification('Error al eliminar empleado', 'error');
    }
    return { success: false };
  }
}

// Inicializar funcionalidad de empleados
function initEmpleadoManagement() {
  const btnNewEmpleado = document.getElementById('btnNewEmpleado');
  const btnCloseEmpleadoModal = document.getElementById('btnCloseEmpleado');
  const btnCancelEmpleado = document.getElementById('btnCancelEmpleado');
  const empleadoForm = document.getElementById('empleadoForm');
  
  // Botón nuevo empleado
  if (btnNewEmpleado) {
    btnNewEmpleado.addEventListener('click', () => showEmpleadoModal());
  }
  
  // Cerrar modal
  if (btnCloseEmpleadoModal) {
    btnCloseEmpleadoModal.addEventListener('click', closeEmpleadoModal);
  }
  if (btnCancelEmpleado) {
    btnCancelEmpleado.addEventListener('click', closeEmpleadoModal);
  }
  
  // Submit formulario
  if (empleadoForm) {
    empleadoForm.setAttribute('novalidate', 'novalidate');
    
    // Remover required del campo email
    const emailField = document.getElementById('empleadoEmail');
    if (emailField) {
      emailField.removeAttribute('required');
      emailField.required = false;
    }
    
    empleadoForm.addEventListener('submit', handleEmpleadoSubmit);
  }
  
  // Toggle visibilidad contraseña de empleado
  const toggleEmpleadoPassword = document.getElementById('toggleEmpleadoPassword');
  const empleadoPasswordInput = document.getElementById('empleadoPassword');
  
  if (toggleEmpleadoPassword && empleadoPasswordInput) {
    toggleEmpleadoPassword.addEventListener('click', () => {
      const isPassword = empleadoPasswordInput.type === 'password';
      empleadoPasswordInput.type = isPassword ? 'text' : 'password';
      // Cambiar emoji
      toggleEmpleadoPassword.textContent = isPassword ? '🙈' : '👁️';
    });
  }
  
  // Cerrar modal al hacer clic fuera
  const empleadoModal = document.getElementById('empleadoModal');
  if (empleadoModal) {
    empleadoModal.addEventListener('click', (e) => {
      if (e.target === empleadoModal) {
        closeEmpleadoModal();
      }
    });
  }
}

// ===================================
// 9. GESTIÓN DE NOTIFICACIONES DROPDOWN
// ===================================

// Toggle del dropdown de notificaciones
function toggleNotificationsDropdown() {
  const dropdown = document.getElementById('notificationsDropdown');
  const isHidden = dropdown.classList.contains('hidden');
  
  if (isHidden) {
    dropdown.classList.remove('hidden');
    loadNotifications();
  } else {
    dropdown.classList.add('hidden');
  }
}

// Cerrar dropdown al hacer clic fuera
function setupNotificationsDropdown() {
  const btnNotifications = document.getElementById('btnNotifications');
  const dropdown = document.getElementById('notificationsDropdown');
  
  // Toggle al hacer clic en el botón
  btnNotifications.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNotificationsDropdown();
  });
  
  // Cerrar al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !btnNotifications.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
  
  // Evitar que se cierre al hacer clic dentro del dropdown
  dropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Marcar todas como leídas
  document.getElementById('btnMarkAllRead').addEventListener('click', markAllNotificationsRead);
  
  // Ver todas las notificaciones (ir a tab de mensajes)
  document.getElementById('btnViewAllNotifications').addEventListener('click', () => {
    dropdown.classList.add('hidden');
    document.getElementById('tabContacts').click();
  });
}

// Cargar notificaciones
async function loadNotifications() {
  const container = document.getElementById('notificationsList');
  
  try {
    const data = await Auth.authFetch(`${API_URL}/contact`);
    
    if (!data.success || data.data.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
          <p class="text-sm">No hay notificaciones</p>
        </div>
      `;
      return;
    }
    
    // Filtrar solo mensajes no leídos y ordenar por fecha (más recientes primero)
    const unreadMessages = data.data
      .filter(msg => !msg.leido)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5); // Mostrar solo los últimos 5
    
    if (unreadMessages.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-3 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-sm font-semibold text-gray-600">¡Todo al día!</p>
          <p class="text-xs text-gray-500 mt-1">No tienes mensajes sin leer</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = unreadMessages.map(msg => {
      const timeAgo = getTimeAgo(msg.createdAt);
      const preview = msg.mensaje.length > 60 ? msg.mensaje.substring(0, 60) + '...' : msg.mensaje;
      
      return `
        <div class="border-b border-gray-100 hover:bg-orange-50 transition-colors cursor-pointer" onclick="openNotificationDetail('${msg._id}')">
          <div class="p-4">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <h4 class="font-semibold text-gray-900 text-sm truncate">${msg.nombre}</h4>
                  <span class="text-xs text-gray-500 shrink-0">${timeAgo}</span>
                </div>
                <p class="text-xs text-orange-600 mb-1">${msg.email}</p>
                <p class="text-sm text-gray-600 line-clamp-2">${preview}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
    container.innerHTML = `
      <div class="p-8 text-center text-red-400">
        <svg class="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-sm">Error al cargar notificaciones</p>
      </div>
    `;
  }
}

// Abrir detalle de notificación
function openNotificationDetail(contactId) {
  // Cerrar dropdown
  document.getElementById('notificationsDropdown').classList.add('hidden');
  
  // Cambiar a tab de mensajes
  document.getElementById('tabContacts').click();
  
  // Esperar un poco para que se carguen los contactos
  setTimeout(() => {
    showContactDetail(contactId);
  }, 300);
}

// Marcar todas como leídas
async function markAllNotificationsRead() {
  try {
    const data = await Auth.authFetch(`${API_URL}/contact`);
    
    if (data.success && data.data.length > 0) {
      const unreadMessages = data.data.filter(msg => !msg.leido);
      
      // Marcar cada mensaje como leído
      for (const msg of unreadMessages) {
        await Auth.authFetch(`${API_URL}/contact/${msg._id}/read`, {
          method: 'PATCH'
        });
      }
      
      showNotification('✓ Todas las notificaciones marcadas como leídas', 'success');
      updateNotificationBadge(0);
      loadNotifications();
      
      // Recargar stats si está visible
      if (!document.getElementById('contactsSection').classList.contains('hidden')) {
        loadContacts();
      }
    }
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    showNotification('Error al marcar notificaciones', 'error');
  }
}

// Función auxiliar para calcular tiempo transcurrido
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ===================================
// GESTIÓN DE EVENTOS
// ===================================

let currentEventId = null;

function initEventsManagement() {
  document.getElementById('btnNewEvent')?.addEventListener('click', openEventModal);
  document.getElementById('btnCloseEventModal')?.addEventListener('click', closeEventModal);
  document.getElementById('btnCancelEvent')?.addEventListener('click', closeEventModal);
  document.getElementById('formEvent')?.addEventListener('submit', handleEventSubmit);
  
  // Preview de imagen del evento
  const eventImageInput = document.getElementById('eventImage');
  const eventImagePreviewContainer = document.getElementById('eventImagePreviewContainer');
  const eventImagePreviewImg = document.getElementById('eventImagePreviewImg');
  const btnRemoveEventImage = document.getElementById('btnRemoveEventImage');
  
  eventImageInput?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        showEventImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });
  
  btnRemoveEventImage?.addEventListener('click', function() {
    eventImageInput.value = '';
    hideEventImagePreview();
  });
  
  // Validación de fechas: endDate debe ser mayor que startDate
  const startDateInput = document.getElementById('eventStartDate');
  const endDateInput = document.getElementById('eventEndDate');
  
  startDateInput?.addEventListener('change', function() {
    if (endDateInput.value && new Date(endDateInput.value) <= new Date(this.value)) {
      endDateInput.value = '';
      showNotification('La fecha de fin debe ser posterior a la fecha de inicio', 'warning');
    }
  });
  
  endDateInput?.addEventListener('change', function() {
    if (startDateInput.value && new Date(this.value) <= new Date(startDateInput.value)) {
      this.value = '';
      showNotification('La fecha de fin debe ser posterior a la fecha de inicio', 'warning');
    }
  });
  
  loadEvents();
}

async function loadEvents() {
  const container = document.getElementById('eventsListContainer');
  if (!container) return;
  
  container.innerHTML = '<div class="text-center py-8"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div></div>';
  
  // Limpiar selección al recargar
  clearSelection('events');
  
  try {
    const data = await Auth.authFetch(`${API_URL}/events`);
    
    if (!data.success) throw new Error(data.message);
    
    if (data.data.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-400">
          <div class="text-6xl mb-3">📭</div>
          <p>No hay eventos creados</p>
        </div>
      `;
      return;
    }
    
    const eventos = data.data.map(event => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const statusColors = {
        'programado': 'blue',
        'en-curso': 'green',
        'completado': 'gray',
        'cancelado': 'red'
      };
      const color = statusColors[event.status] || 'gray';
      
      // Determinar la URL de la imagen
      const imageUrl = event.image ? `${SERVER_URL}${event.image}` : null;
      
      return `
        <div class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow" style="border-left: 4px solid ${event.color}" data-section="events">
          <div class="flex items-start">
            <!-- Checkbox de selección -->
            <div class="p-4 flex items-start">
              <input 
                type="checkbox" 
                class="item-checkbox w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer mt-1"
                data-item-id="${event._id}"
                onchange="toggleItemSelection('events', '${event._id}', this.checked)"
              />
            </div>
            
            ${imageUrl ? `
              <div class="w-24 h-24 flex-shrink-0">
                <img src="${imageUrl}" alt="${event.title}" class="w-full h-full object-cover rounded-l-lg" onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl\\'>🎉</div>'">
              </div>
            ` : `
              <div class="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-3xl">
                🎉
              </div>
            `}
            
            <div class="flex-1 p-4 flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="font-bold text-lg text-gray-800">${event.title}</h3>
                  <span class="px-2 py-1 bg-${color}-100 text-${color}-700 text-xs rounded-full font-semibold">${event.status}</span>
                  ${event.isPublic ? '<span class="text-green-600 text-xs">🌐 Público</span>' : '<span class="text-gray-500 text-xs">🔒 Privado</span>'}
                </div>
                <p class="text-sm text-gray-600 mb-2">${event.description.substring(0, 150)}${event.description.length > 150 ? '...' : ''}</p>
                <div class="text-sm text-gray-600 space-y-1">
                  <p><strong>📅 Inicio:</strong> ${startDate.toLocaleString('es-ES')}</p>
                  <p><strong>🏁 Fin:</strong> ${endDate.toLocaleString('es-ES')}</p>
                  ${event.location ? `<p><strong>📍 Lugar:</strong> ${event.location}</p>` : ''}
                  ${event.price ? `<p><strong>💰 Precio:</strong> ${event.price}€</p>` : ''}
                  ${event.maxCapacity ? `<p><strong>👥 Capacidad:</strong> ${event.maxCapacity} personas</p>` : ''}
                </div>
              </div>
              
              <div class="flex flex-col gap-2 ml-4">
                <button onclick="editEvent('${event._id}')" class="text-blue-600 hover:text-blue-700 font-semibold text-sm whitespace-nowrap">
                  ✏️ Editar
                </button>
                <button onclick="deleteEvent('${event._id}')" class="text-red-600 hover:text-red-700 font-semibold text-sm whitespace-nowrap">
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = eventos;
    
  } catch (error) {
    console.error('Error al cargar eventos:', error);
    showNotification('Error al cargar eventos', 'error');
    container.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <div class="text-6xl mb-3">⚠️</div>
        <p>Error al cargar eventos</p>
      </div>
    `;
  }
}

function openEventModal(editId = null) {
  // Si editId es un objeto de evento (click), ignorarlo
  if (editId && typeof editId === 'object') {
    editId = null;
  }
  
  currentEventId = editId;
  const modal = document.getElementById('modalEvent');
  const form = document.getElementById('formEvent');
  const title = document.getElementById('modalEventTitle');
  
  form.reset();
  hideEventImagePreview(); // Ocultar preview al abrir
  
  if (editId) {
    title.textContent = '✏️ Editar Evento';
    loadEventData(editId);
  } else {
    title.textContent = '➕ Nuevo Evento';
  }
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden'; // Prevenir scroll del body
}

function closeEventModal() {
  const modal = document.getElementById('modalEvent');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = ''; // Restaurar scroll del body
  currentEventId = null;
  hideImagePreview('eventImagePreviewContainer', 'eventImagePreviewImg'); // Limpiar preview al cerrar
}

// Funciones genéricas para manejar previews de imágenes (reutilizables para eventos y galería)
function showImagePreview(containerId, imgId, imageUrl) {
  const container = document.getElementById(containerId);
  const img = document.getElementById(imgId);
  
  if (container && img) {
    img.src = imageUrl;
    container.classList.remove('hidden');
  }
}

function hideImagePreview(containerId, imgId) {
  const container = document.getElementById(containerId);
  const img = document.getElementById(imgId);
  
  if (container && img) {
    img.src = '';
    container.classList.add('hidden');
  }
}

// Funciones de compatibilidad para eventos (mantienen los nombres antiguos)
function showEventImagePreview(imageUrl) {
  showImagePreview('eventImagePreviewContainer', 'eventImagePreviewImg', imageUrl);
}

function hideEventImagePreview() {
  hideImagePreview('eventImagePreviewContainer', 'eventImagePreviewImg');
}

async function loadEventData(id) {
  try {
    const data = await Auth.authFetch(`${API_URL}/events/${id}`);
    
    if (!data.success) throw new Error(data.message);
    
    const event = data.data;
    document.getElementById('eventId').value = event._id;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDescription').value = event.description;
    document.getElementById('eventStartDate').value = new Date(event.startDate).toISOString().slice(0, 16);
    document.getElementById('eventEndDate').value = new Date(event.endDate).toISOString().slice(0, 16);
    document.getElementById('eventLocation').value = event.location || '';
    document.getElementById('eventType').value = event.eventType;
    document.getElementById('eventColor').value = event.color;
    document.getElementById('eventCapacity').value = event.maxCapacity || '';
    document.getElementById('eventPrice').value = event.price || '';
    document.getElementById('eventStatus').value = event.status;
    document.getElementById('eventIsPublic').checked = event.isPublic;
    document.getElementById('eventAllowBooking').checked = event.allowBooking;
    document.getElementById('eventTags').value = event.tags?.join(', ') || '';
    document.getElementById('eventNotes').value = event.notes || '';
    
    // Mostrar preview de la imagen si existe
    if (event.image) {
      showEventImagePreview(`${SERVER_URL}${event.image}`);
    }
    
  } catch (error) {
    console.error('Error al cargar evento:', error);
    showNotification('Error al cargar los datos', 'error');
    closeEventModal();
  }
}

async function handleEventSubmit(e) {
  e.preventDefault();
  
  // Validar fechas antes de enviar
  const startDate = new Date(document.getElementById('eventStartDate').value);
  const endDate = new Date(document.getElementById('eventEndDate').value);
  
  if (endDate <= startDate) {
    showNotification('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
    return;
  }
  
  const imageFile = document.getElementById('eventImage').files[0];
  
  try {
    const url = currentEventId 
      ? `${API_URL}/events/${currentEventId}`
      : `${API_URL}/events`;
    
    const method = currentEventId ? 'PUT' : 'POST';
    const token = Auth.getToken();
    
    if (!token) {
      showNotification('No estás autenticado. Por favor, inicia sesión nuevamente.', 'error');
      return;
    }
    
    // Si hay imagen, usar FormData
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('title', document.getElementById('eventTitle').value.trim());
      formData.append('description', document.getElementById('eventDescription').value.trim());
      formData.append('startDate', document.getElementById('eventStartDate').value);
      formData.append('endDate', document.getElementById('eventEndDate').value);
      formData.append('location', document.getElementById('eventLocation').value.trim());
      formData.append('eventType', document.getElementById('eventType').value);
      formData.append('color', document.getElementById('eventColor').value);
      
      const capacity = parseInt(document.getElementById('eventCapacity').value);
      if (capacity) formData.append('maxCapacity', capacity);
      
      const price = parseFloat(document.getElementById('eventPrice').value);
      if (price) formData.append('price', price);
      
      formData.append('status', document.getElementById('eventStatus').value);
      formData.append('isPublic', document.getElementById('eventIsPublic').checked);
      formData.append('allowBooking', document.getElementById('eventAllowBooking').checked);
      
      const tags = document.getElementById('eventTags').value.split(',').map(t => t.trim()).filter(t => t);
      if (tags.length > 0) formData.append('tags', JSON.stringify(tags));
      
      const notes = document.getElementById('eventNotes').value.trim();
      if (notes) formData.append('notes', notes);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error del servidor' }));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) throw new Error(data.message);
      
      showNotification(data.message || 'Evento guardado correctamente', 'success');
      closeEventModal();
      loadEvents();
      
    } else {
      // Sin imagen, usar JSON tradicional
      const eventData = {
        title: document.getElementById('eventTitle').value.trim(),
        description: document.getElementById('eventDescription').value.trim(),
        startDate: document.getElementById('eventStartDate').value,
        endDate: document.getElementById('eventEndDate').value,
        location: document.getElementById('eventLocation').value.trim(),
        eventType: document.getElementById('eventType').value,
        color: document.getElementById('eventColor').value,
        maxCapacity: parseInt(document.getElementById('eventCapacity').value) || undefined,
        price: parseFloat(document.getElementById('eventPrice').value) || undefined,
        status: document.getElementById('eventStatus').value,
        isPublic: document.getElementById('eventIsPublic').checked,
        allowBooking: document.getElementById('eventAllowBooking').checked,
        tags: document.getElementById('eventTags').value.split(',').map(t => t.trim()).filter(t => t),
        notes: document.getElementById('eventNotes').value.trim()
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error del servidor' }));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) throw new Error(data.message);
      
      showNotification(data.message || 'Evento guardado correctamente', 'success');
      closeEventModal();
      loadEvents();
    }
    
  } catch (error) {
    console.error('Error al guardar:', error);
    showNotification(error.message || 'Error al guardar evento', 'error');
  }
}

async function editEvent(id) {
  openEventModal(id);
}

async function deleteEvent(id, silent = false) {
  if (!silent && !confirm('¿Estás seguro de eliminar este evento?')) {
    return { success: false };
  }
  
  try {
    const data = await Auth.authFetch(`${API_URL}/events/${id}`, {
      method: 'DELETE'
    });
    
    if (!data.success) throw new Error(data.message);
    
    if (!silent) {
      showNotification(data.message, 'success');
      loadEvents();
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Error:', error);
    if (!silent) {
      showNotification(error.message || 'Error al eliminar evento', 'error');
    }
    return { success: false };
  }
}

// ===================================
// GESTIÓN DE GALERÍA
// ===================================

let currentImageId = null;
let currentImageFile = null;

function initGalleryManagement() {
  document.getElementById('btnUploadImage')?.addEventListener('click', () => openGalleryModal());
  document.getElementById('btnCloseGalleryModal')?.addEventListener('click', closeGalleryModal);
  document.getElementById('btnCancelGallery')?.addEventListener('click', closeGalleryModal);
  document.getElementById('formGallery')?.addEventListener('submit', handleGallerySubmit);
  
  // Preview de imagen (usando funciones genéricas reutilizables)
  const imageFileInput = document.getElementById('imageFile');
  const btnRemoveImage = document.getElementById('btnRemoveImage');
  
  imageFileInput?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showNotification('Solo se permiten archivos de imagen', 'error');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        showNotification('El archivo es demasiado grande (máx. 10MB)', 'error');
        return;
      }
      
      currentImageFile = file;
      const reader = new FileReader();
      reader.onload = function(e) {
        showImagePreview('imagePreview', 'previewImg', e.target.result);
        
        // Auto-llenar título si está vacío
        if (!document.getElementById('imageTitle').value) {
          document.getElementById('imageTitle').value = file.name.replace(/\.[^/.]+$/, '');
        }
      };
      reader.readAsDataURL(file);
    }
  });
  
  btnRemoveImage?.addEventListener('click', function() {
    imageFileInput.value = '';
    currentImageFile = null;
    hideImagePreview('imagePreview', 'previewImg');
  });
  
  // Filtros
  document.getElementById('filterCategory')?.addEventListener('change', loadGallery);
  document.getElementById('filterFeatured')?.addEventListener('change', loadGallery);
  document.getElementById('filterActive')?.addEventListener('change', loadGallery);
  
  // NO cargar aquí - será cargada por activateTab cuando el usuario haga click
  // La carga temprana causaba toggle/flashing en la UI
}


async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  
  grid.innerHTML = '<div class="col-span-full text-center py-8"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div></div>';
  
  // Limpiar selección al recargar
  clearSelection('gallery');
  
  try {
    const category = document.getElementById('filterCategory')?.value || '';
    const featured = document.getElementById('filterFeatured')?.checked;
    const active = document.getElementById('filterActive')?.checked;
    
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (featured) params.append('isFeatured', 'true');
    if (active !== undefined) params.append('isActive', active);
    
    const data = await Auth.authFetch(`${API_URL}/gallery?${params}`);
    
    if (!data.success) throw new Error(data.message);
    
    if (data.data.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12 text-gray-400">
          <div class="text-6xl mb-3">📭</div>
          <p>No hay imágenes en la galería</p>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = data.data.map(image => `
      <div class="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow" data-section="gallery">
        <!-- Checkbox de selección -->
        <div class="absolute top-2 left-2 z-10">
          <input 
            type="checkbox" 
            class="item-checkbox w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white shadow-lg"
            data-item-id="${image._id}"
            onchange="toggleItemSelection('gallery', '${image._id}', this.checked)"
          />
        </div>
        
        <div class="aspect-square overflow-hidden bg-gray-100">
          <img src="${image.imageUrl}" alt="${image.altText || image.title}" 
               class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
        </div>
        <div class="p-3">
          <h4 class="font-semibold text-sm text-gray-800 truncate">${image.title}</h4>
          <p class="text-xs text-gray-500 mt-1">${image.category}</p>
          <div class="flex gap-1 mt-2">
            ${image.isFeatured ? '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">⭐ Destacada</span>' : ''}
            ${!image.isActive ? '<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Inactiva</span>' : ''}
          </div>
        </div>
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
          <button onclick="editImage('${image._id}')" class="bg-white hover:bg-blue-50 text-blue-600 p-2 rounded-full shadow-lg">
            ✏️
          </button>
          <button onclick="toggleImageFeatured('${image._id}')" class="bg-white hover:bg-yellow-50 text-yellow-600 p-2 rounded-full shadow-lg">
            ${image.isFeatured ? '⭐' : '☆'}
          </button>
          <button onclick="toggleImageStatus('${image._id}')" class="bg-white hover:bg-gray-50 text-gray-600 p-2 rounded-full shadow-lg">
            ${image.isActive ? '⏸️' : '▶️'}
          </button>
          <button onclick="deleteImage('${image._id}')" class="bg-white hover:bg-red-50 text-red-600 p-2 rounded-full shadow-lg">
            🗑️
          </button>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error al cargar galería:', error);
    showNotification('Error al cargar la galería', 'error');
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-red-500">
        <div class="text-6xl mb-3">⚠️</div>
        <p>Error al cargar la galería</p>
      </div>
    `;
  }
}

function openGalleryModal(editId = null) {
  currentImageId = editId;
  const modal = document.getElementById('modalGallery');
  const form = document.getElementById('formGallery');
  const title = document.getElementById('modalGalleryTitle');
  const imageInputWrapper = document.getElementById('imageInputWrapper');
  const submitText = document.getElementById('btnGallerySubmitText');
  
  form.reset();
  currentImageFile = null;
  hideImagePreview('imagePreview', 'previewImg');
  
  if (editId) {
    title.textContent = '✏️ Editar Imagen';
    imageInputWrapper?.classList.add('hidden'); // Solo ocultar el input, no el preview
    submitText.textContent = '💾 Actualizar';
    loadImageData(editId);
  } else {
    title.textContent = '📸 Subir Imagen';
    imageInputWrapper?.classList.remove('hidden');
    submitText.textContent = '📤 Subir Imagen';
  }
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeGalleryModal() {
  const modal = document.getElementById('modalGallery');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  currentImageId = null;
  currentImageFile = null;
  hideImagePreview('imagePreview', 'previewImg');
}

async function loadImageData(id) {
  try {
    const data = await Auth.authFetch(`${API_URL}/gallery/${id}`);
    
    if (!data.success) throw new Error(data.message);
    
    const image = data.data;
    document.getElementById('imageId').value = image._id;
    document.getElementById('imageTitle').value = image.title;
    document.getElementById('imageDescription').value = image.description || '';
    document.getElementById('imageCategory').value = image.category;
    document.getElementById('imageOrder').value = image.order || 0;
    document.getElementById('imageTags').value = image.tags?.join(', ') || '';
    document.getElementById('imageAltText').value = image.altText || '';
    document.getElementById('imageIsActive').checked = image.isActive;
    document.getElementById('imageIsFeatured').checked = image.isFeatured;
    document.getElementById('imageDisplayLocation').value = image.displayLocation || 'galeria';
    
    // Mostrar preview de la imagen existente en modo edición
    if (image.imageUrl) {
      showImagePreview('imagePreview', 'previewImg', `${API_URL.replace('/api', '')}${image.imageUrl}`);
    }
    
  } catch (error) {
    console.error('Error al cargar imagen:', error);
    showNotification('Error al cargar los datos', 'error');
    closeGalleryModal();
  }
}

async function handleGallerySubmit(e) {
  e.preventDefault();
  
  const formData = new FormData();
  
  if (currentImageFile) {
    formData.append('image', currentImageFile);
  } else if (!currentImageId) {
    showNotification('Debes seleccionar una imagen', 'error');
    return;
  }
  
  formData.append('title', document.getElementById('imageTitle').value.trim());
  formData.append('description', document.getElementById('imageDescription').value.trim());
  formData.append('category', document.getElementById('imageCategory').value);
  formData.append('order', document.getElementById('imageOrder').value);
  formData.append('altText', document.getElementById('imageAltText').value.trim());
  formData.append('isActive', document.getElementById('imageIsActive').checked);
  formData.append('isFeatured', document.getElementById('imageIsFeatured').checked);
  formData.append('displayLocation', document.getElementById('imageDisplayLocation').value);
  
  const tags = document.getElementById('imageTags').value.split(',').map(t => t.trim()).filter(t => t);
  formData.append('tags', JSON.stringify(tags));
  
  try {
    let response;
    
    if (currentImageId) {
      // Solo actualizar metadata
      const updateData = Object.fromEntries(formData);
      response = await Auth.authFetch(`${API_URL}/gallery/${currentImageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
    } else {
      // Subir nueva imagen
      response = await Auth.authFetch(`${API_URL}/gallery`, {
        method: 'POST',
        body: formData
      });
    }
    
    const data = await response.json();
    
    if (!data.success) throw new Error(data.message);
    
    showNotification(data.message, 'success');
    closeGalleryModal();
    loadGallery();
    
  } catch (error) {
    console.error('Error al guardar:', error);
    showNotification(error.message || 'Error al guardar imagen', 'error');
  }
}

async function editImage(id) {
  openGalleryModal(id);
}

async function toggleImageFeatured(id) {
  try {
    const data = await Auth.authFetch(`${API_URL}/gallery/${id}/toggle-featured`, {
      method: 'PATCH'
    });
    
    if (!data.success) throw new Error(data.message);
    
    showNotification(data.message, 'success');
    loadGallery();
    
  } catch (error) {
    console.error('Error:', error);
    showNotification(error.message || 'Error al cambiar destacado', 'error');
  }
}

async function toggleImageStatus(id) {
  try {
    const data = await Auth.authFetch(`${API_URL}/gallery/${id}/toggle-status`, {
      method: 'PATCH'
    });
    
    if (!data.success) throw new Error(data.message);
    
    showNotification(data.message, 'success');
    loadGallery();
    
  } catch (error) {
    console.error('Error:', error);
    showNotification(error.message || 'Error al cambiar estado', 'error');
  }
}

async function deleteImage(id, silent = false) {
  if (!silent && !confirm('¿Estás seguro de eliminar esta imagen? Se eliminará permanentemente del servidor.')) {
    return { success: false };
  }
  
  try {
    const data = await Auth.authFetch(`${API_URL}/gallery/${id}`, {
      method: 'DELETE'
    });
    
    if (!data.success) throw new Error(data.message);
    
    if (!silent) {
      showNotification(data.message, 'success');
      loadGallery();
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Error:', error);
    if (!silent) {
      showNotification(error.message || 'Error al eliminar imagen', 'error');
    }
    return { success: false };
  }
}

// ===================================
// GESTIÓN DE CONTROL HORARIO
// ===================================

let currentTimeRecordsPage = 1;
const timeRecordsPerPage = 20;
let timeRecordsFilters = {};

function initTimeRecordsManagement() {
  // Botón de filtros
  document.getElementById('btnApplyFilters')?.addEventListener('click', () => {
    currentTimeRecordsPage = 1;
    applyTimeRecordsFilters();
  });
  
  // Botón de exportar
  document.getElementById('btnExportTimeRecords')?.addEventListener('click', exportTimeRecords);
  
  // Paginación
  document.getElementById('btnPrevPage')?.addEventListener('click', () => {
    if (currentTimeRecordsPage > 1) {
      currentTimeRecordsPage--;
      loadTimeRecords();
    }
  });
  
  document.getElementById('btnNextPage')?.addEventListener('click', () => {
    currentTimeRecordsPage++;
    loadTimeRecords();
  });
  
  // Modal de edición
  document.getElementById('btnCloseEditModal')?.addEventListener('click', closeEditModal);
  document.getElementById('btnCancelEdit')?.addEventListener('click', closeEditModal);
  document.getElementById('formEditTimeRecord')?.addEventListener('submit', handleEditTimeRecord);
  
  // Cargar empleados para el filtro
  loadEmployeesForFilter();
  
  // Preestablecer fechas al día actual
  setDefaultDates();
}

function setDefaultDates() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayString = `${year}-${month}-${day}`;
  
  const filterStartDate = document.getElementById('filterStartDate');
  const filterEndDate = document.getElementById('filterEndDate');
  
  if (filterStartDate) filterStartDate.value = todayString;
  if (filterEndDate) filterEndDate.value = todayString;
}

async function loadEmployeesForFilter() {
  try {
    const data = await Auth.authFetch(`${API_URL}/admins/empleados`);
    
    if (data.success) {
      const employees = data.data;
      const select = document.getElementById('filterEmployee');
      
      if (select) {
        select.innerHTML = '<option value="">Todos los empleados</option>';
        employees.forEach(emp => {
          select.innerHTML += `<option value="${emp._id}">${emp.nombre || emp.username}</option>`;
        });
      }
    }
  } catch (error) {
    console.error('Error loading employees:', error);
  }
}

function applyTimeRecordsFilters() {
  const empleadoId = document.getElementById('filterEmployee')?.value;
  const fechaInicio = document.getElementById('filterStartDate')?.value;
  const fechaFin = document.getElementById('filterEndDate')?.value;
  const tipo = document.getElementById('filterType')?.value;
  
  // Solo incluir filtros con valores válidos
  timeRecordsFilters = {};
  if (empleadoId) timeRecordsFilters.empleadoId = empleadoId;
  if (fechaInicio) timeRecordsFilters.fechaInicio = fechaInicio;
  if (fechaFin) timeRecordsFilters.fechaFin = fechaFin;
  if (tipo) timeRecordsFilters.tipo = tipo;
  
  loadTimeRecords();
  loadTimeRecordsSummary();
}

async function loadTimeRecords() {
  const tbody = document.getElementById('timeRecordsTableBody');
  
  // Limpiar selección al recargar
  clearSelection('timeRecords');
  
  try {
    // Construir query params
    const params = new URLSearchParams({
      page: currentTimeRecordsPage,
      limit: timeRecordsPerPage,
      ...timeRecordsFilters
    });
    
    const data = await Auth.authFetch(`${API_URL}/time-records/admin/todos?${params}`);
    
    if (!data.success || data.data.registros.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-12 text-center text-gray-500">
            <div class="text-6xl mb-4">📭</div>
            <p class="text-lg">No hay registros que mostrar</p>
          </td>
        </tr>
      `;
      updatePagination(0, 0, 0);
      return;
    }
    
    // Renderizar registros
    tbody.innerHTML = data.data.registros.map(record => {
      const fecha = new Date(record.fecha);
      const fechaStr = fecha.toLocaleDateString('es-ES');
      const horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const tipoIcon = record.tipo === 'entrada' ? '✅' : '🚪';
      const tipoColor = record.tipo === 'entrada' ? 'text-green-600' : 'text-red-600';
      const horas = record.horasTrabajadas ? `${record.horasTrabajadas.toFixed(2)}h` : '-';
      
      // Manejar empleados eliminados
      const empleadoNombre = record.empleado 
        ? (record.empleado.nombre || record.empleado.username)
        : (record.empleadoNombre || 'Empleado eliminado');
      const empleadoEmail = record.empleado 
        ? record.empleado.email 
        : '(usuario eliminado)';
      const empleadoEliminado = !record.empleado;
      
      // Rol del empleado
      const roleInfo = {
        monitor: { text: 'Monitor', color: 'blue' },
        cocina: { text: 'Cocina', color: 'orange' },
        barra: { text: 'Barra', color: 'purple' }
      };
      const empleadoRol = record.empleado?.rolEmpleado;
      const role = roleInfo[empleadoRol] || null;
      
      return `
        <tr class="hover:bg-gray-50 transition-colors ${empleadoEliminado ? 'bg-gray-50' : ''}" data-section="timeRecords">
          <td class="px-6 py-4 text-center">
            <input 
              type="checkbox" 
              class="item-checkbox w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              data-item-id="${record._id}"
              onchange="toggleItemSelection('timeRecords', '${record._id}', this.checked)"
            />
          </td>
          <td class="px-6 py-4">
            <div class="font-semibold text-gray-800 ${empleadoEliminado ? 'text-gray-500' : ''}">
              ${empleadoNombre}
              ${empleadoEliminado ? '<span class="ml-2 text-xs text-red-600">⚠️ Eliminado</span>' : ''}
            </div>
            ${role ? `<span class="inline-block bg-${role.color}-100 text-${role.color}-800 px-2 py-0.5 rounded-full text-xs font-semibold mt-1">${role.text}</span>` : ''}
            <div class="text-xs text-gray-500 mt-1">${empleadoEmail}</div>
          </td>
          <td class="px-6 py-4">
            <span class="${tipoColor} font-semibold text-sm">
              ${tipoIcon} ${record.tipo.toUpperCase()}
            </span>
          </td>
          <td class="px-6 py-4">
            <div class="text-sm font-semibold text-gray-800">${fechaStr}</div>
            <div class="text-xs text-gray-500">${horaStr}</div>
          </td>
          <td class="px-6 py-4 text-sm text-gray-600">
            ${record.ubicacion || '-'}
          </td>
          <td class="px-6 py-4">
            <span class="text-sm font-semibold text-purple-600">${horas}</span>
          </td>
          <td class="px-6 py-4 text-center">
            <div class="flex items-center justify-center gap-2">
              <button onclick="editTimeRecord('${record._id}')" 
                class="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors">
                ✏️ Editar
              </button>
              <button onclick="deleteTimeRecord('${record._id}')" 
                class="text-red-600 hover:text-red-800 font-semibold text-sm transition-colors">
                🗑️ Eliminar
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    // Actualizar paginación
    const { currentPage, totalPages, totalRecords } = data.data.pagination;
    const from = (currentPage - 1) * timeRecordsPerPage + 1;
    const to = Math.min(currentPage * timeRecordsPerPage, totalRecords);
    updatePagination(from, to, totalRecords);
    
    // Actualizar botones de paginación
    document.getElementById('btnPrevPage').disabled = currentPage <= 1;
    document.getElementById('btnNextPage').disabled = currentPage >= totalPages;
    
  } catch (error) {
    console.error('Error:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-red-600">
          ❌ Error al cargar registros: ${error.message}
        </td>
      </tr>
    `;
  }
}

async function loadTimeRecordsSummary() {
  try {
    // Cargar total de empleados
    const employeesData = await Auth.authFetch(`${API_URL}/admins/empleados`);
    
    if (employeesData.success) {
      const employees = employeesData.data;
      document.getElementById('totalEmployees').textContent = employees.length;
    }
    
    // Cargar resumen mensual (mes y año actuales)
    const now = new Date();
    const mes = now.getMonth() + 1; // getMonth() devuelve 0-11
    const anio = now.getFullYear();
    
    const resumenData = await Auth.authFetch(`${API_URL}/time-records/admin/resumen?mes=${mes}&anio=${anio}`);
    
    if (resumenData.success && resumenData.data) {
      // Calcular total de horas del mes
      const totalHours = resumenData.data.reduce((sum, emp) => sum + (emp.totalHoras || 0), 0);
      document.getElementById('monthHours').textContent = totalHours.toFixed(1);
    }
    
    // Cargar registros de hoy
    const today = new Date().toISOString().split('T')[0];
    const todayData = await Auth.authFetch(`${API_URL}/time-records/admin/todos?fechaInicio=${today}&fechaFin=${today}`);
    
    if (todayData.success && todayData.data) {
      const todayRecordsCount = todayData.data.pagination.totalRecords;
      document.getElementById('todayRecords').textContent = todayRecordsCount;
      
      // Contar empleados trabajando ahora (última entrada sin salida correspondiente)
      const registros = todayData.data.registros || [];
      
      // Agrupar registros por empleado
      const empleadosMap = new Map();
      registros.forEach(r => {
        const empleadoId = r.empleado?._id || r.empleado?.id;
        if (!empleadoId) return;
        
        if (!empleadosMap.has(empleadoId)) {
          empleadosMap.set(empleadoId, []);
        }
        empleadosMap.get(empleadoId).push(r);
      });
      
      // Contar empleados actualmente trabajando
      let workingCount = 0;
      empleadosMap.forEach((registrosEmpleado, empleadoId) => {
        // Ordenar por fecha (más reciente primero)
        registrosEmpleado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        // El último registro define el estado actual
        const ultimoRegistro = registrosEmpleado[0];
        
        // Si el último registro es entrada, está trabajando
        if (ultimoRegistro.tipo === 'entrada') {
          workingCount++;
        }
      });
      
      document.getElementById('workingNow').textContent = workingCount;
      
      // Actualizar también la tarjeta de stats profesionales
      const statsWorkingNowElement = document.getElementById('statsWorkingNow');
      if (statsWorkingNowElement) {
        statsWorkingNowElement.textContent = workingCount;
      }
    }
    
  } catch (error) {
    console.error('Error loading summary:', error);
    // Inicializar con valores por defecto en caso de error
    document.getElementById('totalEmployees').textContent = '0';
    document.getElementById('monthHours').textContent = '0';
    document.getElementById('todayRecords').textContent = '0';
    document.getElementById('workingNow').textContent = '0';
    
    // Resetear también la tarjeta de stats profesionales
    const statsWorkingNowElement = document.getElementById('statsWorkingNow');
    if (statsWorkingNowElement) {
      statsWorkingNowElement.textContent = '0';
    }
  }
}

function updatePagination(from, to, total) {
  document.getElementById('recordsFrom').textContent = from;
  document.getElementById('recordsTo').textContent = to;
  document.getElementById('recordsTotal').textContent = total;
}

async function editTimeRecord(id) {
  try {
    // Obtener el registro actual
    const data = await Auth.authFetch(`${API_URL}/time-records/admin/todos?limit=1000`);
    
    if (!data.success) throw new Error('Error al cargar registro');
    
    const record = data.data.registros.find(r => r._id === id);
    if (!record) throw new Error('Registro no encontrado');
    
    // Rellenar el formulario
    document.getElementById('editRecordId').value = record._id;
    document.getElementById('editEmployeeName').value = record.empleado.nombre || record.empleado.username;
    document.getElementById('editType').value = record.tipo;
    
    const fecha = new Date(record.fecha);
    document.getElementById('editDate').value = fecha.toISOString().split('T')[0];
    document.getElementById('editTime').value = fecha.toTimeString().slice(0, 5);
    document.getElementById('editLocation').value = record.ubicacion || '';
    
    // Mostrar modal
    document.getElementById('modalEditTimeRecord').classList.remove('hidden');
    
  } catch (error) {
    console.error('Error:', error);
    showNotification(error.message || 'Error al cargar registro', 'error');
  }
}

function closeEditModal() {
  document.getElementById('modalEditTimeRecord').classList.add('hidden');
  document.getElementById('formEditTimeRecord').reset();
}

async function handleEditTimeRecord(e) {
  e.preventDefault();
  
  const recordId = document.getElementById('editRecordId').value;
  const tipo = document.getElementById('editType').value;
  const date = document.getElementById('editDate').value;
  const time = document.getElementById('editTime').value;
  const ubicacion = document.getElementById('editLocation').value;
  
  // Combinar fecha y hora
  const fecha = new Date(`${date}T${time}`);
  
  try {
    const data = await Auth.authFetch(`${API_URL}/time-records/admin/${recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, fecha, ubicacion })
    });
    
    if (!data.success) throw new Error(data.message);
    
    showNotification('Registro actualizado correctamente', 'success');
    closeEditModal();
    loadTimeRecords();
    loadTimeRecordsSummary();
    
  } catch (error) {
    console.error('Error:', error);
    showNotification(error.message || 'Error al actualizar registro', 'error');
  }
}

async function deleteTimeRecord(id, silent = false) {
  if (!silent && !confirm('¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.')) {
    return { success: false };
  }
  
  try {
    const data = await Auth.authFetch(`${API_URL}/time-records/admin/${id}`, {
      method: 'DELETE'
    });
    
    if (!data.success) throw new Error(data.message);
    
    if (!silent) {
      showNotification('Registro eliminado correctamente', 'success');
      loadTimeRecords();
      loadTimeRecordsSummary();
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Error:', error);
    if (!silent) {
      showNotification(error.message || 'Error al eliminar registro', 'error');
    }
    return { success: false };
  }
}

function exportTimeRecords(selectedOnly = false) {
  let recordsToExport = [];
  
  if (selectedOnly) {
    // Exportar solo los seleccionados
    const selectedIds = Array.from(bulkSelection.timeRecords);
    
    if (selectedIds.length === 0) {
      showNotification('No hay registros seleccionados para exportar', 'warning');
      return;
    }
    
    // Obtener los datos de los registros seleccionados
    const tbody = document.getElementById('timeRecordsTableBody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
      const checkbox = row.querySelector('.item-checkbox');
      if (checkbox && checkbox.checked) {
        const cells = row.cells;
        if (cells.length > 1) {
          recordsToExport.push({
            empleado: cells[1].querySelector('.font-semibold')?.textContent || '',
            email: cells[1].querySelector('.text-xs')?.textContent || '',
            tipo: cells[2].textContent.trim(),
            fecha: cells[3].querySelector('.font-semibold')?.textContent || '',
            hora: cells[3].querySelector('.text-xs')?.textContent || '',
            ubicacion: cells[4].textContent.trim(),
            horas: cells[5].textContent.trim()
          });
        }
      }
    });
  } else {
    // Exportar todos los registros visibles
    const tbody = document.getElementById('timeRecordsTableBody');
    const rows = tbody.querySelectorAll('tr');
    
    if (rows.length === 0 || rows[0].cells.length === 1) {
      showNotification('No hay registros para exportar', 'warning');
      return;
    }
    
    rows.forEach(row => {
      const cells = row.cells;
      if (cells.length > 1) {
        recordsToExport.push({
          empleado: cells[1].querySelector('.font-semibold')?.textContent || '',
          email: cells[1].querySelector('.text-xs')?.textContent || '',
          tipo: cells[2].textContent.trim(),
          fecha: cells[3].querySelector('.font-semibold')?.textContent || '',
          hora: cells[3].querySelector('.text-xs')?.textContent || '',
          ubicacion: cells[4].textContent.trim(),
          horas: cells[5].textContent.trim()
        });
      }
    });
  }
  
  if (recordsToExport.length === 0) {
    showNotification('No hay registros para exportar', 'warning');
    return;
  }
  
  // Crear CSV
  let csv = 'Empleado,Email,Tipo,Fecha,Hora,Ubicación,Horas Trabajadas\n';
  
  recordsToExport.forEach(record => {
    csv += `"${record.empleado}","${record.email}","${record.tipo}","${record.fecha}","${record.hora}","${record.ubicacion}","${record.horas}"\n`;
  });
  
  // Descargar archivo
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const fecha = new Date().toISOString().split('T')[0];
  const suffix = selectedOnly ? `_seleccionados_${recordsToExport.length}` : '';
  
  link.setAttribute('href', url);
  link.setAttribute('download', `registros_tiempo${suffix}_${fecha}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  const message = selectedOnly 
    ? `${recordsToExport.length} registro(s) seleccionado(s) exportado(s) correctamente`
    : 'CSV exportado correctamente';
  
  showNotification(message, 'success');
}

// ===================================
// 14. GESTIÓN DE HORARIOS LABORALES (WORK SCHEDULES)
// ===================================

// Variables globales para work schedules
let currentWorkSchedulesView = 'list'; // list, week, month
// DEPRECATED: Reemplazadas por calendarState (línea ~3500)
// let currentWeekDate = new Date();
// let currentMonthDate = new Date();
let empleadosListForSchedules = [];
let workSchedules = [];

// Inicialización completa de Work Schedules
async function initWorkSchedules() {
  console.log('🔧 Inicializando Work Schedules...');
  await loadEmpleadosForSchedules();
  populateYearFilterSchedules();
  setCurrentMonthYearSchedules();
  await loadWorkSchedules();
  setupWorkSchedulesEventListeners();
  console.log('✅ Work Schedules inicializado');
}

// Cargar lista de empleados para filtros y formulario
// NOTA: Filtra por rol='empleado' (usuarios con acceso al portal de empleados)
//       Muestra badges según rolEmpleado (monitor=🏃, cocina=👨‍🍳, barra=🍹)
async function loadEmpleadosForSchedules() {
  try {
    // ENDPOINT CORRECTO: /api/admins/empleados (filtra solo empleados en backend)
    const url = `${API_URL}/admins/empleados`;
    console.log('🔵 [EMPLEADOS] Fetching:', url);
    
    const response = await fetch(url, {
      headers: Auth.getAuthHeaders()
    });
    
    console.log('🔵 [EMPLEADOS] Response status:', response.status);
    
    const data = await response.json();
    
    console.log('🔵 [EMPLEADOS] Response data:', data);
    
    if (data.success && data.data) {
      // Ya están filtrados por rol='empleado' desde el backend
      empleadosListForSchedules = data.data;
      
      console.log('🟢 [EMPLEADOS] Cargados:', empleadosListForSchedules.length, 'empleados');
      
      if (empleadosListForSchedules.length === 0) {
        console.warn('⚠️ No hay empleados con rol="empleado" en la base de datos.');
      }
      
      // Poblar select de filtro (Horarios Laborales)
      const filterSelect = document.getElementById('filterEmployeeSchedules');
      if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Todos los empleados</option>';
        empleadosListForSchedules.forEach(emp => {
          filterSelect.innerHTML += `<option value="${emp._id}">${emp.nombre}</option>`;
        });
        console.log('🟢 [EMPLEADOS] Select de filtro poblado con', empleadosListForSchedules.length, 'empleados');
      } else {
        console.warn('⚠️ [EMPLEADOS] No se encontró elemento #filterEmployeeSchedules');
      }
      
      // Poblar select del formulario
      const formSelect = document.getElementById('wsEmpleado');
      if (formSelect) {
        if (empleadosListForSchedules.length === 0) {
          formSelect.innerHTML = '<option value="" disabled>⚠️ Sin empleados - Crear en "Gestión de Empleados"</option>';
          showNotification('⚠️ No hay empleados. Créalos en la sección "Gestión de Empleados" primero.', 'warning');
        } else {
          formSelect.innerHTML = '<option value="">Seleccione un empleado</option>';
          empleadosListForSchedules.forEach(emp => {
            formSelect.innerHTML += `<option value="${emp._id}">${emp.nombre}</option>`;
          });
        }
        console.log('🟢 [EMPLEADOS] Select del formulario poblado');
      } else {
        console.warn('⚠️ [EMPLEADOS] No se encontró elemento #wsEmpleado');
      }
    } else {
      console.error('❌ [EMPLEADOS] Response no exitoso:', data.message);
      showNotification('Error al cargar empleados: ' + (data.message || 'Sin detalles'), 'error');
    }
  } catch (error) {
    console.error('❌ [EMPLEADOS] Error al cargar empleados:', error);
    showNotification('Error al cargar empleados', 'error');
  }
}

// Poblar años en filtro (desde 2024 hasta año actual + 1)
function populateYearFilterSchedules() {
  const currentYear = new Date().getFullYear();
  const yearSelect = document.getElementById('filterYear');
  if (!yearSelect) return;
  
  yearSelect.innerHTML = '<option value="">Seleccione año</option>';
  
  for (let year = 2024; year <= currentYear + 1; year++) {
    yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
  }
}

// Establecer mes y año actuales en filtros
function setCurrentMonthYearSchedules() {
  const now = new Date();
  const monthSelect = document.getElementById('filterMonth');
  const yearSelect = document.getElementById('filterYear');
  
  if (monthSelect) monthSelect.value = now.getMonth() + 1;
  if (yearSelect) yearSelect.value = now.getFullYear();
}

// Cargar horarios con filtros
async function loadWorkSchedules() {
  try {
    const empleadoId = document.getElementById('filterEmployeeSchedules')?.value || '';
    const mes = document.getElementById('filterMonth')?.value || '';
    const anio = document.getElementById('filterYear')?.value || '';
    const estado = document.getElementById('filterStatus')?.value || '';
    
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
      
      // Limpiar selección al recargar datos
      clearSelection('workSchedules');
      
      renderCurrentWorkSchedulesView();
    } else {
      showNotification(data.message || 'Error al cargar horarios', 'error');
    }
  } catch (error) {
    console.error('Error al cargar horarios:', error);
    showNotification('Error al cargar horarios', 'error');
  }
}

// Renderizar vista actual
function renderCurrentWorkSchedulesView() {
  if (currentWorkSchedulesView === 'list') {
    renderWorkSchedulesListView();
  } else if (currentWorkSchedulesView === 'week') {
    renderWorkSchedulesWeekView();
  } else if (currentWorkSchedulesView === 'month') {
    renderWorkSchedulesMonthView();
  }
}

// Renderizar vista lista
function renderWorkSchedulesListView() {
  const tbody = document.getElementById('workSchedulesTableBody');
  if (!tbody) return;
  
  if (workSchedules.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="px-6 py-12 text-center text-gray-500">
          <div class="text-6xl mb-4">📭</div>
          <p class="text-lg">No hay horarios asignados</p>
          <p class="text-sm mt-2">Use los filtros o asigne nuevos horarios</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = workSchedules.map(ws => {
    const fecha = new Date(ws.fecha);
    const fechaStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    const estadoBadge = {
      'programado': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">📅 Programado</span>',
      'confirmado': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">✅ Confirmado</span>',
      'completado': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">🎯 Completado</span>',
      'cancelado': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">❌ Cancelado</span>'
    };
    
    const turnoIcon = {
      'mañana': '🌅',
      'tarde': '🌆',
      'completo': '📅'
    };
    
    // Rol del empleado
    const roleInfo = {
      monitor: { text: 'Monitor', color: 'blue' },
      cocina: { text: 'Cocina', color: 'orange' },
      barra: { text: 'Barra', color: 'purple' }
    };
    const empleadoRol = ws.empleado?.rolEmpleado;
    const role = roleInfo[empleadoRol] || null;
    
    const isChecked = bulkSelection.workSchedules.has(ws.id) ? 'checked' : '';
    
    // Detectar si es horario auto-creado (horas extra)
    const esHoraExtra = ws.color === '#10b981';
    
    return `
      <tr class="hover:bg-gray-50 transition-colors ${esHoraExtra ? 'bg-blue-50' : ''}">
        <td class="px-6 py-4">
          <input 
            type="checkbox" 
            class="item-checkbox w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
            data-item-id="${ws.id}"
            ${isChecked}
            onchange="toggleItemSelection('workSchedules', '${ws.id}', this.checked)"
          />
        </td>
        <td class="px-6 py-4">
          <div class="text-sm font-medium text-gray-900">${ws.empleado?.nombre || 'N/A'}</div>
          ${role ? `<span class="inline-block bg-${role.color}-100 text-${role.color}-800 px-2 py-0.5 rounded-full text-xs font-semibold mt-1">${role.text}</span>` : ''}
          <div class="text-xs text-gray-500 mt-1">${ws.empleado?.username || ''}</div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">${fechaStr}</td>
        <td class="px-6 py-4">
          <span class="text-sm text-gray-600 capitalize">${ws.diaSemana}</span>
        </td>
        <td class="px-6 py-4">
          ${esHoraExtra ? `<span class="inline-block px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded mb-1">🕒 HORAS EXTRA</span><br>` : ''}
          <span class="text-sm text-gray-900">${turnoIcon[ws.turno] || ''} ${ws.turno}</span>
        </td>
        <td class="px-6 py-4">
          <div class="text-sm text-gray-900 font-medium">${ws.horaInicio} - ${ws.horaFin}</div>
        </td>
        <td class="px-6 py-4">
          <span class="text-sm text-gray-900 font-semibold">${ws.horasTotales}h</span>
        </td>
        <td class="px-6 py-4">${estadoBadge[ws.estado]}</td>
        <td class="px-6 py-4 text-center">
          <div class="flex items-center justify-center gap-2">
            <button onclick="editWorkSchedule('${ws.id}')" class="text-blue-600 hover:text-blue-800 transition-colors" title="Editar">
              ✏️
            </button>
            <button onclick="deleteWorkSchedule('${ws.id}')" class="text-red-600 hover:text-red-800 transition-colors" title="Eliminar">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  // Actualizar estados de selección
  updateSelectAllCheckbox('workSchedules');
  updateBulkActionBar('workSchedules');
}

// Renderizar vista semanal
// ===================================
// UTILIDADES DE CALENDARIO (INMUTABLES)
// ===================================

/**
 * Clase utilitaria para manejo de fechas de calendario
 * Todas las operaciones son inmutables y retornan nuevas instancias
 */
// ===================================
// UTILIDADES DE ROL (colores por puesto)
// ===================================
function getRolColor(rolEmpleado) {
  const roleColors = {
    'monitor': {
      bg: 'bg-blue-100',
      border: 'border-blue-400',
      text: 'text-blue-900',
      hex: '#dbeafe',        // blue-100 background
      hexText: '#1e3a8a'     // blue-900 text
    },
    'cocina': {
      bg: 'bg-orange-100',
      border: 'border-orange-400',
      text: 'text-orange-900',
      hex: '#fed7aa',        // orange-100 background
      hexText: '#92400e'     // orange-900 text
    },
    'barra': {
      bg: 'bg-purple-100',
      border: 'border-purple-400',
      text: 'text-purple-900',
      hex: '#e9d5ff',        // purple-100 background
      hexText: '#581c87'     // purple-900 text
    }
  };
  
  return roleColors[rolEmpleado?.toLowerCase()] || {
    bg: 'bg-gray-100',
    border: 'border-gray-400',
    text: 'text-gray-900',
    hex: '#f3f4f6',          // gray-100 background
    hexText: '#111827'       // gray-900 text
  };
}

// ===================================
// LOGGER DE CALENDARIO (para debugging)
// ===================================
const CALENDAR_DEBUG = true; // Cambiar a false para desactivar logs

function logCalendar(label, data) {
  if (!CALENDAR_DEBUG) return;
  console.log(`%c[CALENDAR] ${label}`, 'color: #FF6B35; font-weight: bold;', data);
}

function logCalendarError(label, error) {
  if (!CALENDAR_DEBUG) return;
  console.error(`%c[CALENDAR ERROR] ${label}`, 'color: #E63946; font-weight: bold;', error);
}

// ===================================
// CALENDAR UTILS - POWERED BY DateUtils (local module)
// ===================================
// Usando módulo local DateUtils - sin dependencias CDN
// Ubicación: /frontend/src/js/modules/date-utils.js

const CalendarUtils = {
  /**
   * Obtiene el lunes de la semana para una fecha dada
   * @param {Date} date - Fecha de referencia
   * @returns {Date} Lunes de la semana (nueva instancia)
   */
  getMonday(date) {
    try {
      const inputIso = this.toISODate(date);
      
      // DateUtils: startOfWeek da lunes automáticamente
      const monday = DateUtils.startOfWeek(date);
      
      const resultIso = this.toISODate(monday);
      
      logCalendar('getMonday (DateUtils)', {
        input: inputIso,
        inputDayOfWeek: date.getDay(),
        inputDayName: this.getDayName(date),
        output: resultIso,
        outputDayOfWeek: monday.getDay(),
        validation: monday.getDay() === 1 ? '✅ IS MONDAY' : '❌ NOT MONDAY',
        library: 'DateUtils (local)'
      });
      
      return monday;
    } catch (e) {
      logCalendarError('getMonday', e);
      throw e;
    }
  },

  /**
   * Genera array de 7 fechas consecutivas desde una fecha de inicio
   * @param {Date} startDate - Fecha de inicio
   * @returns {Date[]} Array de 7 fechas
   */
  getWeekDates(startDate) {
    try {
      // DateUtils: eachDayOfInterval genera array
      const endDate = DateUtils.addDays(startDate, 6);
      const result = DateUtils.eachDayOfInterval({ start: startDate, end: endDate });
      
      const dateStrings = result.map(d => this.toISODate(d));
      
      logCalendar('getWeekDates (DateUtils)', {
        startDate: this.toISODate(startDate),
        endDate: this.toISODate(endDate),
        count: result.length,
        dates: dateStrings,
        validation: result.length === 7 ? '✅ 7 DAYS' : '❌ WRONG COUNT'
      });
      
      return result;
    } catch (e) {
      logCalendarError('getWeekDates', e);
      throw e;
    }
  },

  /**
   * Suma/resta semanas a una fecha
   * @param {Date} date - Fecha base
   * @param {number} weeks - Número de semanas (+ adelante, - atrás)
   * @returns {Date} Nueva fecha
   */
  addWeeks(date, weeks) {
    try {
      const inputIso = this.toISODate(date);
      
      // DateUtils: addWeeks inmutable
      const result = DateUtils.addWeeks(date, weeks);
      
      const outputIso = this.toISODate(result);
      const actualDiff = Math.round((result - date) / (1000 * 60 * 60 * 24));
      const expectedDiff = weeks * 7;
      
      logCalendar('addWeeks (DateUtils)', {
        input: inputIso,
        weeks: weeks,
        expectedDays: expectedDiff,
        actualDays: actualDiff,
        output: outputIso,
        validation: actualDiff === expectedDiff ? '✅ EXACT' : '❌ MISMATCH',
        library: 'DateUtils.addWeeks()'
      });
      
      return result;
    } catch (e) {
      logCalendarError('addWeeks', e);
      throw e;
    }
  },

  /**
   * NOTA: addMonths() ELIMINADO
   * La navegación mensual ahora usa aritmética simple (patrón index.html)
   * Ver CalendarState.goToPreviousMonth() y goToNextMonth()
   */

  /**
   * Formatea fecha a ISO string sin timezone (YYYY-MM-DD)
   * @param {Date} date - Fecha a formatear
   * @returns {string} Fecha en formato YYYY-MM-DD
   */
  toISODate(date) {
    // DateUtils: format con patrón yyyy-MM-dd
    return DateUtils.format(date, 'yyyy-MM-dd');
  },

  /**
   * Compara si dos fechas son el mismo día
   * @param {Date} date1 - Primera fecha
   * @param {Date} date2 - Segunda fecha
   * @returns {boolean} True si son el mismo día
   */
  isSameDay(date1, date2) {
    // DateUtils: isSameDay
    return DateUtils.isSameDay(date1, date2);
  },

  /**
   * Obtiene el nombre del día de la semana
   * @param {Date} date - Fecha
   * @returns {string} Nombre del día (lunes, martes, etc.)
   */
  getDayName(date) {
    // DateUtils: format con patrón 'dddd'
    return DateUtils.format(date, 'dddd');
  }
};

// ===================================
// GESTOR DE ESTADO DEL CALENDARIO
// ===================================

/**
 * Estado del calendario - SIMPLIFICADO
 * Patrón del calendario de index.html (funciona correctamente)
 * Variables simples (no objetos Date complejos)
 */
class CalendarState {
  constructor() {
    const today = new Date();
    
    // Para vista semanal: guardar el lunes actual
    this._currentWeekMonday = CalendarUtils.getMonday(today);
    
    // Para vista mensual: guardar mes y año como NÚMEROS (0-11 y YYYY)
    this._currentMonth = today.getMonth(); // 0-11
    this._currentYear = today.getFullYear(); // 2025
    
    logCalendar('CalendarState CONSTRUCTOR', {
      weekMonday: CalendarUtils.toISODate(this._currentWeekMonday),
      month: this._currentMonth,
      year: this._currentYear
    });
  }

  // Getters
  getCurrentWeekMonday() {
    return new Date(this._currentWeekMonday);
  }

  getCurrentMonth() {
    return this._currentMonth;
  }

  getCurrentYear() {
    return this._currentYear;
  }

  // Navegación semanal (mantener sistema actual - funciona)
  goToPreviousWeek() {
    this._currentWeekMonday = CalendarUtils.addWeeks(this._currentWeekMonday, -1);
    logCalendar('goToPreviousWeek', CalendarUtils.toISODate(this._currentWeekMonday));
  }

  goToNextWeek() {
    this._currentWeekMonday = CalendarUtils.addWeeks(this._currentWeekMonday, 1);
    logCalendar('goToNextWeek', CalendarUtils.toISODate(this._currentWeekMonday));
  }

  // Navegación mensual - PATRÓN SIMPLIFICADO del index.html
  goToPreviousMonth() {
    this._currentMonth--;
    if (this._currentMonth < 0) {
      this._currentMonth = 11;
      this._currentYear--;
    }
    logCalendar('goToPreviousMonth', {
      month: this._currentMonth,
      year: this._currentYear
    });
  }

  goToNextMonth() {
    this._currentMonth++;
    if (this._currentMonth > 11) {
      this._currentMonth = 0;
      this._currentYear++;
    }
    logCalendar('goToNextMonth', {
      month: this._currentMonth,
      year: this._currentYear
    });
  }

  // Reset
  setWeek(date) {
    this._currentWeekMonday = CalendarUtils.getMonday(date);
    logCalendar('setWeek', CalendarUtils.toISODate(this._currentWeekMonday));
  }

  setMonth(year, month) {
    this._currentYear = year;
    this._currentMonth = month - 1; // Convertir de 1-12 a 0-11
    logCalendar('setMonth', { month: this._currentMonth, year: this._currentYear });
  }

  goToToday() {
    const today = new Date();
    this._currentWeekMonday = CalendarUtils.getMonday(today);
    this._currentMonth = today.getMonth();
    this._currentYear = today.getFullYear();
    
    logCalendar('goToToday', {
      weekMonday: CalendarUtils.toISODate(this._currentWeekMonday),
      month: this._currentMonth,
      year: this._currentYear
    });
  }
}

// Instancia global del estado del calendario
// IMPORTANTE: Se inicializa en DOMContentLoaded para asegurar que DateUtils esté cargado
let calendarState = null;

// ===================================
// RENDERIZADO DE BADGES DE MONITORES
// ===================================

/**
 * NUEVO APPROACH: Renderizar badges DESPUÉS de insertar HTML en el DOM
 * Esto evita problemas con emojis en template literals
 */
function renderMonitorBadges() {
  // Buscar todos los contenedores de badges en el calendario
  const badgeContainers = document.querySelectorAll('.monitor-badge-container');
  
  badgeContainers.forEach((container, idx) => {
    const monitorCount = parseInt(container.getAttribute('data-monitor-count') || '0');
    const dayCell = container.closest('.day-cell');
    const hasSchedules = dayCell?.getAttribute('data-has-schedules') === 'true';
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Solo mostrar badge si hay horarios Y monitores
    if (!hasSchedules || monitorCount === 0) {
      return;
    }
    
    // Crear elementos del badge con DOM API
    const badgeDiv = document.createElement('div');
    badgeDiv.style.cssText = `
      font-size: 0.6875rem;
      padding: 0.25rem 0.625rem;
      border-radius: 0.375rem;
      font-weight: bold;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    `;
    
    // Determinar color según cantidad de monitores
    if (monitorCount >= 6) {
      badgeDiv.style.backgroundColor = '#dcfce7'; // green-100
      badgeDiv.style.color = '#166534'; // green-800
    } else {
      badgeDiv.style.backgroundColor = '#fee2e2'; // red-100
      badgeDiv.style.color = '#991b1b'; // red-800
    }
    
    // Crear emoji span
    const emojiSpan = document.createElement('span');
    emojiSpan.style.fontSize = '1.2em';
    emojiSpan.textContent = monitorCount >= 6 ? '✅' : '⚠️';
    
    // Crear texto span
    const textSpan = document.createElement('span');
    textSpan.textContent = `${monitorCount} monitor${monitorCount !== 1 ? 'es' : ''}`;
    
    // Ensamblar badge
    badgeDiv.appendChild(emojiSpan);
    badgeDiv.appendChild(textSpan);
    container.appendChild(badgeDiv);
  });
}

// ===================================
// VISTA SEMANAL - REESCRITA
// ===================================

/**
 * Renderiza la vista semanal del calendario
 * Arquitectura: Fetch data → Transform → Render
 */
async function renderWorkSchedulesWeekView() {
  try {
    logCalendar('=== renderWorkSchedulesWeekView START ===', {});
    
    const monday = calendarState.getCurrentWeekMonday();
    const weekDates = CalendarUtils.getWeekDates(monday);
    const sunday = weekDates[6];
    
    const mondayISO = CalendarUtils.toISODate(monday);
    const sundayISO = CalendarUtils.toISODate(sunday);
    
    logCalendar('Week Dates', {
      monday: mondayISO,
      sunday: sundayISO,
      allDates: weekDates.map(d => CalendarUtils.toISODate(d))
    });

    // 1. OBTENER DATOS DEL BACKEND
    const empleadoId = document.getElementById('filterEmployeeSchedules')?.value || '';
    let url = `${API_URL}/work-schedules/weekly?fecha=${mondayISO}`;
    if (empleadoId) url += `&empleadoId=${empleadoId}`;

    logCalendar('Fetching from', url);
    
    const response = await fetch(url, { headers: Auth.getAuthHeaders() });
    const data = await response.json();
    
    logCalendar('Backend Response', {
      success: data.success,
      diasCount: data.data?.dias?.length || 0,
      dias: data.data?.dias?.map(d => ({ fecha: d.fecha, horarios: d.horarios?.length || 0 })) || []
    });

    if (!data.success) {
      showNotification('Error al cargar vista semanal', 'error');
      return;
    }

    // 2. ACTUALIZAR TÍTULO
    const weekTitle = document.getElementById('weekTitle');
    if (weekTitle) {
      const startStr = monday.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      const endStr = sunday.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      weekTitle.textContent = `Semana del ${startStr} al ${endStr}`;
    }

    // 3. TRANSFORMAR DATOS
    // Crear mapa de fechas → horarios para lookup O(1)
    const horariosMap = new Map();
    if (data.data.dias) {
      data.data.dias.forEach(dia => {
        horariosMap.set(dia.fecha.split('T')[0], dia.horarios || []);
      });
    }

    // 4. RENDERIZAR CALENDARIO
    const calendar = document.getElementById('weekCalendar');
    if (!calendar) return;

    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    logCalendar('Map Contents', {
      size: horariosMap.size,
      keys: Array.from(horariosMap.keys()),
      values: Array.from(horariosMap.entries()).map(([k, v]) => `${k}: ${v.length} horarios`)
    });

    calendar.innerHTML = weekDates.map((date, index) => {
      const dateISO = CalendarUtils.toISODate(date);
      const dayName = dayNames[index];
      const horarios = horariosMap.get(dateISO) || [];
      const hasSchedules = horarios.length > 0;
      
      // Contar monitores ÚNICOS asignados ese día
      const monitoresUnicos = new Set();
      horarios.forEach(h => {
        // Case-insensitive comparison para 'monitor'
        // IMPORTANTE: Backend retorna empleado.id (no _id)
        const empleadoId = h.empleado?.id || h.empleado?._id;
        if (h.empleado?.rolEmpleado?.toLowerCase() === 'monitor' && empleadoId) {
          monitoresUnicos.add(empleadoId);
        }
      });
      const cantidadMonitores = monitoresUnicos.size;
      
      // Determinar color de fondo según cantidad de monitores
      let bgColorStyle = '#f3f4f6'; // gray-50 default
      let borderColorStyle = '#d1d5db'; // gray-200 default
      
      if (hasSchedules) {
        if (cantidadMonitores >= 6) {
          bgColorStyle = '#dcfce7'; // green-50
          borderColorStyle = '#86efac'; // green-300
        } else if (cantidadMonitores > 0) {
          bgColorStyle = '#fee2e2'; // red-50
          borderColorStyle = '#fca5a5'; // red-300
        } else {
          bgColorStyle = '#eff6ff'; // blue-50
          borderColorStyle = '#bfdbfe'; // blue-200
        }
      }

      return `
        <div class="day-cell border-2 rounded-lg p-3 transition-all cursor-default"
             style="background-color: ${bgColorStyle}; border-color: ${borderColorStyle}; min-height: 120px; position: relative;"
             data-date="${dateISO}"
             data-monitores="${cantidadMonitores}"
             data-has-schedules="${hasSchedules}"
             ondrop="handleScheduleDrop(event, '${dateISO}')"
             ondragover="handleScheduleDragOver(event)"
             ondragleave="handleScheduleDragLeave(event)"
             ondragenter="handleScheduleDragEnter(event)">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <div style="font-weight: 600; font-size: 0.875rem; color: #374151;">${dayName}</div>
            <div class="monitor-badge-container" data-monitor-count="${cantidadMonitores}"></div>
          </div>
          <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.75rem;">${date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</div>
          
          <div class="schedule-cards-container" style="min-height: 40px;">
            ${hasSchedules ? 
              horarios.map(h => {
                // Detectar si es horario auto-creado (horas extra)
                const esHoraExtra = h.color === '#10b981';
                const bgColorStyle = esHoraExtra ? '#dbeafe' : '#ffffff'; // blue-100 o white
                const rolColor = getRolColor(h.empleado?.rolEmpleado);
                const rolBgStyle = rolColor ? rolColor.hex : '#f3f4f6';
                const rolTextStyle = rolColor ? rolColor.hexText : '#1f2937';
                
                return `
                <div class="schedule-card rounded cursor-move transition-all active:opacity-50" 
                     style="background-color: ${bgColorStyle}; border-left: 4px solid ${h.color || '#f97316'}; padding: 0.5rem; margin-bottom: 0.5rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: move;" 
                     draggable="true"
                     data-schedule-id="${h.id}"
                     data-schedule-date="${dateISO}"
                     data-employee-name="${h.empleado?.nombre || 'N/A'}"
                     ondragstart="handleScheduleDragStart(event, '${h.id}', '${dateISO}')"
                     ondragend="handleScheduleDragEnd(event)"
                     onclick="event.stopPropagation(); editWorkSchedule('${h.id}')"
                     onmouseover="this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'"
                     onmouseout="this.style.boxShadow='0 1px 2px rgba(0,0,0,0.05)'">
                  <div style="display: flex; align-items: center; gap: 0.25rem; margin-bottom: 0.25rem;">
                    <span class="drag-handle" style="color: #9ca3af; font-size: 0.75rem; cursor: grab;">⋮⋮</span>
                    ${esHoraExtra ? `<div style="display: inline-block; padding: 0.125rem 0.5rem; background-color: #3b82f6; color: white; font-size: 0.625rem; font-weight: bold; border-radius: 0.375rem;">🕒 HORAS EXTRA</div>` : ''}
                  </div>
                  ${h.empleado?.nombre ? `<div style="font-size: 0.75rem; font-weight: 600; color: #1f2937;">${h.empleado.nombre}</div>` : ''}
                  <div style="font-size: 0.75rem; color: #4b5563;">${h.horaInicio} - ${h.horaFin}</div>
                  <div style="font-size: 0.75rem; color: #6b7280;">${h.turno} (${h.horasTotales}h)</div>
                  ${h.empleado?.rolEmpleado ? `<div style="font-size: 0.75rem; margin-top: 0.25rem; padding: 0.125rem 0.5rem; border-radius: 0.375rem; display: inline-block; background-color: ${rolBgStyle}; color: ${rolTextStyle};"><strong>${h.empleado.rolEmpleado.charAt(0).toUpperCase() + h.empleado.rolEmpleado.slice(1)}</strong></div>` : ''}
                  ${h.notas ? `<div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; font-style: italic;">${h.notas}</div>` : ''}
                </div>
              `;
              }).join('') :
              '<div style="font-size: 0.75rem; color: #9ca3af; font-style: italic;">Arrastra aquí un horario</div>'
            }
          </div>
        </div>
      `;
    }).join('');
    
    // NUEVO APPROACH: Renderizar badges DESPUÉS de insertar HTML en el DOM
    // Esto asegura que los emojis se rendericen correctamente
    renderMonitorBadges();
    
    logCalendar('=== Vista semanal renderizada con drag & drop habilitado ===', {});

    logCalendar('=== renderWorkSchedulesWeekView END ===', { rendered: true });

  } catch (error) {
    logCalendarError('renderWorkSchedulesWeekView', error);
    console.error('Error al renderizar vista semanal:', error);
    showNotification('Error al cargar vista semanal', 'error');
  }
}

// ===================================
// VISTA MENSUAL - REESCRITA
// ===================================

/**
 * Renderiza la vista mensual del calendario
 */
/**
 * Renderiza la vista mensual del calendario
 */
async function renderWorkSchedulesMonthView() {
  try {
    logCalendar('=== renderWorkSchedulesMonthView START ===', {});
    
    // SIMPLIFICADO: Usar números directamente (patrón index.html)
    const mes = calendarState.getCurrentMonth() + 1; // 0-11 → 1-12 para API
    const anio = calendarState.getCurrentYear();

    logCalendar('Month Parameters', {
      mes: mes,
      anio: anio
    });

    // 1. OBTENER DATOS DEL BACKEND
    const empleadoId = document.getElementById('filterEmployeeSchedules')?.value || '';
    let url = `${API_URL}/work-schedules/monthly?mes=${mes}&anio=${anio}`;
    if (empleadoId) url += `&empleadoId=${empleadoId}`;

    logCalendar('Fetching from', url);

    const response = await fetch(url, { headers: Auth.getAuthHeaders() });
    const data = await response.json();

    logCalendar('Backend Response', {
      success: data.success,
      horariosCount: data.data?.horarios?.length || 0
    });

    if (!data.success) {
      showNotification('Error al cargar vista mensual', 'error');
      return;
    }

    // 2. ACTUALIZAR TÍTULO
    const monthTitle = document.getElementById('monthTitle');
    if (monthTitle) {
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      monthTitle.textContent = `${monthNames[mes - 1]} ${anio}`;
    }

    // 3. CALCULAR ESTRUCTURA DEL CALENDARIO
    // Usar DateUtils para consistencia
    const firstDayOfMonth = DateUtils.startOfMonth(new Date(anio, mes - 1, 1));
    const lastDayOfMonth = new Date(anio, mes, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Día de la semana del primer día (0=Domingo, 1=Lunes, ..., 6=Sábado)
    const firstDayWeekday = firstDayOfMonth.getDay();
    // Ajustar para que Lunes=0 (restar 1, si es Domingo=0, convertir a 6)
    const startOffset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

    // 4. TRANSFORMAR DATOS
    // Crear mapa de fechas → horarios usando DateUtils
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
    const calendar = document.getElementById('monthCalendar');
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
      
      // Contar monitores ÚNICOS asignados ese día
      const monitoresUnicos = new Set();
      horarios.forEach(h => {
        // Case-insensitive comparison para 'monitor'
        // IMPORTANTE: Backend retorna empleado.id (no _id)
        const empleadoId = h.empleado?.id || h.empleado?._id;
        if (h.empleado?.rolEmpleado?.toLowerCase() === 'monitor' && empleadoId) {
          monitoresUnicos.add(empleadoId);
        }
      });
      const cantidadMonitores = monitoresUnicos.size;
      
      // Determinar color de fondo según cantidad de monitores
      let bgColorStyle = '#f3f4f6'; // gray-50 default
      let borderColorStyle = '#d1d5db'; // gray-200 default
      
      if (hasSchedules) {
        if (cantidadMonitores >= 6) {
          bgColorStyle = '#dcfce7'; // green-50
          borderColorStyle = '#86efac'; // green-300
        } else if (cantidadMonitores > 0) {
          bgColorStyle = '#fee2e2'; // red-50
          borderColorStyle = '#fca5a5'; // red-300
        } else {
          bgColorStyle = '#eff6ff'; // blue-50
          borderColorStyle = '#93c5fd'; // blue-300
        }
      }

      html += `
        <div class="day-cell border-2 rounded p-2 transition-all cursor-default"
             style="background-color: ${bgColorStyle}; border-color: ${borderColorStyle}; min-height: 110px; ${isToday ? 'box-shadow: 0 0 0 2px rgb(249, 115, 22);' : ''}"
             data-date="${dateISO}"
             data-monitores="${cantidadMonitores}"
             data-has-schedules="${hasSchedules}"
             ondrop="handleScheduleDrop(event, '${dateISO}')"
             ondragover="handleScheduleDragOver(event)"
             ondragleave="handleScheduleDragLeave(event)"
             ondragenter="handleScheduleDragEnter(event)">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
            <div style="font-size: 0.75rem; font-weight: 600; ${isToday ? 'color: #ea580c;' : 'color: #374151;'}">${day}</div>
            <div class="monitor-badge-container" data-monitor-count="${cantidadMonitores}"></div>
          </div>
          
          <div class="schedule-cards-container">
            ${hasSchedules ? 
              horarios.slice(0, 3).map(h => {
                const esHoraExtra = h.color === '#10b981';
                const rolColor = getRolColor(h.empleado?.rolEmpleado);
                const bgColorMonthStyle = esHoraExtra ? '#dbeafe' : rolColor.hex;
                const textColorMonthStyle = esHoraExtra ? '#1e3a8a' : rolColor.hexText;
                
                return `
                  <div style="font-size: 0.75rem; border-radius: 0.375rem; padding: 0.25rem 0.25rem; margin-bottom: 0.25rem; border-left: 2px solid ${h.color || '#f97316'}; background-color: ${bgColorMonthStyle}; color: ${textColorMonthStyle}; cursor: move; transition: all 0.2s;" 
                       draggable="true"
                       data-schedule-id="${h.id}"
                       data-schedule-date="${dateISO}"
                       data-employee-name="${h.empleado?.nombre || 'N/A'}"
                       ondragstart="handleScheduleDragStart(event, '${h.id}', '${dateISO}')"
                       ondragend="handleScheduleDragEnd(event)"
                       onmouseover="this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'"
                       onmouseout="this.style.boxShadow='none'"
                       title="${esHoraExtra ? '🕒 HORAS EXTRA - ' : ''}${h.empleado?.nombre || ''}: ${h.horaInicio}-${h.horaFin}"
                       onclick="event.stopPropagation(); editWorkSchedule('${h.id}')">
                    ${esHoraExtra ? `<div style="font-size: 0.625rem; font-weight: bold; color: #2563eb;">🕒 EXTRA</div>` : ''}
                    <div style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${h.empleado?.nombre ? h.empleado.nombre.split(' ')[0] : 'N/A'}</div>
                    <div>${h.horaInicio}-${h.horaFin}</div>
                    ${h.empleado?.rolEmpleado ? `<div style="font-size: 0.75rem; font-weight: 600;">${h.empleado.rolEmpleado.charAt(0).toUpperCase() + h.empleado.rolEmpleado.slice(1)}</div>` : ''}
                  </div>
                `;
              }).join('') + (horarios.length > 3 ? `<div style="font-size: 0.75rem; color: #6b7280;">+${horarios.length - 3} más</div>` : '') :
              '<div style="font-size: 0.75rem; color: #9ca3af; font-style: italic; opacity: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity=\'1\'" onmouseout="this.style.opacity=\'0\'">Arrastra aquí</div>'
            }
          </div>
        </div>
      `;
    }

    html += '</div>';
    calendar.innerHTML = html;
    
    // Debug: Verificar que los badges estén en el DOM
    const badges = calendar.querySelectorAll('[style*="background-color"]');
    console.log(`✅ Total badges renderizados: ${badges.length}`);
    badges.forEach((badge, i) => {
      if (badge.textContent) {
        console.log(`Badge ${i}: "${badge.textContent}" - Style: ${badge.getAttribute('style')}`);
      }
    });

    // 6. MOSTRAR ESTADÍSTICAS
    const statsDiv = document.getElementById('monthStats');
    if (statsDiv && data.data.resumen) {
      const r = data.data.resumen;
      statsDiv.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">${r.totalHorarios || 0}</div>
            <div class="text-xs text-gray-600">Total Horarios</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">${r.totalHoras ? r.totalHoras.toFixed(1) : '0.0'}h</div>
            <div class="text-xs text-gray-600">Horas Totales</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">${r.empleadosActivos || 0}</div>
            <div class="text-xs text-gray-600">Empleados</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">${r.diasConHorarios || 0}</div>
            <div class="text-xs text-gray-600">Días con Horarios</div>
          </div>
        </div>
      `;
    }
    
    // NUEVO APPROACH: Renderizar badges DESPUÉS de insertar HTML en el DOM
    renderMonitorBadges();

  } catch (error) {
    console.error('Error al renderizar vista mensual:', error);
    showNotification('Error al cargar vista mensual', 'error');
  }
}

// ===================================
// SISTEMA DRAG & DROP PARA HORARIOS
// ===================================

let draggedSchedule = null; // Almacena el horario siendo arrastrado

/**
 * Maneja el inicio del arrastre de un horario
 */
window.handleScheduleDragStart = function(event, scheduleId, currentDate) {
  draggedSchedule = {
    id: scheduleId,
    originalDate: currentDate,
    element: event.target
  };
  
  // Aplicar estilo visual
  event.target.classList.add('opacity-50', 'scale-95');
  
  // Configurar datos de transferencia
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', scheduleId);
  
  console.log('🎯 Drag started:', draggedSchedule);
};

/**
 * Maneja el fin del arrastre
 */
window.handleScheduleDragEnd = function(event) {
  event.target.classList.remove('opacity-50', 'scale-95');
  
  // Limpiar estilos de todas las celdas
  document.querySelectorAll('.day-cell').forEach(cell => {
    cell.classList.remove('dragover-active');
  });
  
  draggedSchedule = null;
  console.log('🏁 Drag ended');
};

/**
 * Maneja cuando el elemento entra en una zona válida
 */
window.handleScheduleDragEnter = function(event) {
  event.preventDefault();
  const cell = event.currentTarget;
  if (cell.classList.contains('day-cell')) {
    cell.classList.add('bg-green-100', 'border-green-400', 'ring-2', 'ring-green-300');
  }
};

/**
 * Maneja cuando el elemento está sobre una zona válida
 */
window.handleScheduleDragOver = function(event) {
  event.preventDefault(); // Necesario para permitir drop
  event.dataTransfer.dropEffect = 'move';
  
  // Agregar feedback visual al contenedor (no solo al event.currentTarget)
  const cell = event.currentTarget;
  if (cell.classList.contains('day-cell')) {
    cell.classList.add('dragover-active');
  }
};

/**
 * Maneja cuando el elemento entra en una zona válida
 */
window.handleScheduleDragEnter = function(event) {
  const cell = event.currentTarget;
  if (cell.classList.contains('day-cell')) {
    cell.classList.add('dragover-active');
  }
};

/**
 * Maneja cuando el elemento sale de una zona válida
 */
window.handleScheduleDragLeave = function(event) {
  const cell = event.currentTarget;
  // Solo remover si realmente estamos saliendo (no entrando en un hijo)
  if (cell.classList.contains('day-cell') && event.target === cell) {
    cell.classList.remove('dragover-active');
  }
};

/**
 * Maneja el drop del horario en una nueva fecha
 */
window.handleScheduleDrop = async function(event, newDate) {
  event.preventDefault();
  
  const cell = event.currentTarget;
  cell.classList.remove('dragover-active');
  
  if (!draggedSchedule) {
    console.error('❌ No hay horario siendo arrastrado');
    return;
  }
  
  const { id, originalDate } = draggedSchedule;
  
  // Verificar si la fecha es diferente
  if (originalDate === newDate) {
    console.log('ℹ️ Misma fecha, no se requiere actualización');
    draggedSchedule = null;
    return;
  }
  
  console.log('📅 Cambiando horario:', {
    scheduleId: id,
    from: originalDate,
    to: newDate
  });
  
  // Mostrar confirmación con confirm() nativo
  const employeeName = draggedSchedule.element.dataset.employeeName || 'Empleado';
  const originalDateFormatted = new Date(originalDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const newDateFormatted = new Date(newDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const confirmMessage = `¿Cambiar horario de ${employeeName}?\n\nDe: ${originalDateFormatted}\nA: ${newDateFormatted}`;
  
  if (!confirm(confirmMessage)) {
    draggedSchedule = null;
    return;
  }
  
  try {
    // Hacer petición al backend
    const response = await fetch(`${API_URL}/work-schedules/${id}`, {
      method: 'PUT',
      headers: {
        ...Auth.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fecha: newDate })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error al actualizar horario');
    }
    
    // Mostrar notificación de éxito
    showNotification('✅ Horario movido exitosamente', 'success');
    
    // Recargar vista actual
    if (currentWorkSchedulesView === 'week') {
      await renderWorkSchedulesWeekView();
    } else if (currentWorkSchedulesView === 'month') {
      await renderWorkSchedulesMonthView();
    }
    
    console.log('✅ Horario actualizado exitosamente');
    
  } catch (error) {
    console.error('❌ Error al mover horario:', error);
    showNotification(`❌ Error: ${error.message}`, 'error');
    
    // Recargar para restaurar estado original
    if (currentWorkSchedulesView === 'week') {
      await renderWorkSchedulesWeekView();
    } else if (currentWorkSchedulesView === 'month') {
      await renderWorkSchedulesMonthView();
    }
  } finally {
    draggedSchedule = null;
  }
};

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
      showNotification('✅ Horario asignado exitosamente', 'success');
      closeWorkScheduleModal();
      
      // Actualizar vista actual
      if (currentWorkSchedulesView === 'week') {
        await renderWorkSchedulesWeekView();
      } else if (currentWorkSchedulesView === 'month') {
        await renderWorkSchedulesMonthView();
      } else {
        await loadWorkSchedules();
      }
    } else if (response.status === 409) {
      // Conflicto de solapamiento
      const conflicto = data.conflicto;
      showNotification(
        `⚠️ Solapamiento detectado: El empleado ya tiene un turno de ${conflicto.horaInicio} a ${conflicto.horaFin}`,
        'warning'
      );
    } else {
      const errorMsg = data.errors ? data.errors.join(', ') : data.message;
      showNotification(errorMsg || 'Error al asignar horario', 'error');
    }
  } catch (error) {
    console.error('Error al crear horario:', error);
    showNotification('Error al asignar horario', 'error');
  }
}

// Editar horario existente
async function editWorkSchedule(id) {
  try {
    // Obtener datos actualizados del backend en lugar de usar cache
    const response = await fetch(`${API_URL}/work-schedules/${id}`, {
      headers: Auth.getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (!data.success) {
      showNotification('Horario no encontrado', 'error');
      return;
    }
    
    const ws = data.data;
    
    // Llenar formulario con datos actualizados del backend
    document.getElementById('workScheduleId').value = id;
    document.getElementById('wsEmpleado').value = ws.empleado?.id || '';
    document.getElementById('wsFecha').value = ws.fecha.split('T')[0];
    document.getElementById('wsTurno').value = ws.turno;
    document.getElementById('wsHoraInicio').value = ws.horaInicio;
    document.getElementById('wsHoraFin').value = ws.horaFin;
    document.getElementById('wsEstado').value = ws.estado;
    document.getElementById('wsNotas').value = ws.notas || '';
    document.getElementById('wsColor').value = ws.color;
    document.getElementById('wsColorHex').value = ws.color;
    
    // Actualizar contador de caracteres
    const notasLength = (ws.notas || '').length;
    const notasCount = document.getElementById('wsNotasCount');
    if (notasCount) notasCount.textContent = notasLength;
    
    // Cambiar título del modal
    document.getElementById('modalWorkScheduleTitle').textContent = 'Editar Horario Laboral';
    
    // Mostrar modal
    const modal = document.getElementById('modalWorkSchedule');
    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Error al cargar horario:', error);
    showNotification('Error al cargar datos del horario', 'error');
  }
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
      showNotification('✅ Horario actualizado exitosamente', 'success');
      closeWorkScheduleModal();
      
      // Actualizar vista actual
      if (currentWorkSchedulesView === 'week') {
        await renderWorkSchedulesWeekView();
      } else if (currentWorkSchedulesView === 'month') {
        await renderWorkSchedulesMonthView();
      } else {
        await loadWorkSchedules();
      }
    } else if (response.status === 409) {
      showNotification('⚠️ Solapamiento detectado: El empleado ya tiene un turno en ese horario', 'warning');
    } else {
      const errorMsg = data.errors ? data.errors.join(', ') : data.message;
      showNotification(errorMsg || 'Error al actualizar horario', 'error');
    }
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    showNotification('Error al actualizar horario', 'error');
  }
}

// Eliminar horario
async function deleteWorkSchedule(id, silent = false) {
  // En modo silencioso (bulk delete), no pedir confirmación
  if (!silent) {
    if (!confirm('¿Estás seguro de que deseas eliminar este horario?\n\nEsta acción no se puede deshacer.')) {
      return;
    }
  }
  
  try {
    const response = await fetch(`${API_URL}/work-schedules/${id}`, {
      method: 'DELETE',
      headers: Auth.getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (data.success) {
      // En modo silencioso, no mostrar notificación ni recargar
      if (!silent) {
        showNotification('✅ Horario eliminado exitosamente', 'success');
        
        // Actualizar vista actual
        if (currentWorkSchedulesView === 'week') {
          await renderWorkSchedulesWeekView();
        } else if (currentWorkSchedulesView === 'month') {
          await renderWorkSchedulesMonthView();
        } else {
          await loadWorkSchedules();
        }
      }
      return { success: true };
    } else {
      if (!silent) {
        showNotification(data.message || '❌ Error al eliminar horario', 'error');
      }
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    if (!silent) {
      showNotification('❌ Error al eliminar horario', 'error');
    }
    return { success: false, message: error.message };
  }
}

// Cambiar vista
function switchWorkSchedulesView(view) {
  currentWorkSchedulesView = view;
  
  // Actualizar botones
  const btnList = document.getElementById('btnViewList');
  const btnWeek = document.getElementById('btnViewWeek');
  const btnMonth = document.getElementById('btnViewMonth');
  
  // Resetear todos
  [btnList, btnWeek, btnMonth].forEach(btn => {
    if (btn) {
      btn.classList.remove('bg-blue-500', 'text-white');
      btn.classList.add('bg-gray-200', 'text-gray-800');
    }
  });
  
  // Activar el seleccionado
  const activeBtn = view === 'list' ? btnList : (view === 'week' ? btnWeek : btnMonth);
  if (activeBtn) {
    activeBtn.classList.remove('bg-gray-200', 'text-gray-800');
    activeBtn.classList.add('bg-blue-500', 'text-white');
  }
  
  // Mostrar/ocultar vistas
  const viewList = document.getElementById('viewList');
  const viewWeek = document.getElementById('viewWeek');
  const viewMonth = document.getElementById('viewMonth');
  
  if (viewList) viewList.classList.toggle('hidden', view !== 'list');
  if (viewWeek) viewWeek.classList.toggle('hidden', view !== 'week');
  if (viewMonth) viewMonth.classList.toggle('hidden', view !== 'month');
  
  // Renderizar vista actual
  renderCurrentWorkSchedulesView();
}

// Cerrar modal
function closeWorkScheduleModal() {
  const modal = document.getElementById('modalWorkSchedule');
  if (modal) {
    modal.classList.add('hidden');
  }
  
  const form = document.getElementById('formWorkSchedule');
  if (form) form.reset();
  
  document.getElementById('workScheduleId').value = '';
  document.getElementById('wsEstado').value = 'programado';
  document.getElementById('wsColor').value = '#f97316';
  document.getElementById('wsColorHex').value = '#f97316';
  
  const notasCount = document.getElementById('wsNotasCount');
  if (notasCount) notasCount.textContent = '0';
}

// Flag para evitar múltiples configuraciones de event listeners
let workSchedulesListenersConfigured = false;

// Event Listeners para Work Schedules
function setupWorkSchedulesEventListeners() {
  // PROTECCIÓN: Evitar duplicación de event listeners
  if (workSchedulesListenersConfigured) {
    console.log('⚠️ Event listeners ya configurados, saltando...');
    return;
  }
  
  console.log('🎯 Configurando event listeners de Work Schedules...');
  
  // Botón nuevo horario
  const btnNew = document.getElementById('btnNewWorkSchedule');
  if (btnNew) {
    btnNew.addEventListener('click', async () => {
      const form = document.getElementById('formWorkSchedule');
      if (form) form.reset();
      
      document.getElementById('workScheduleId').value = '';
      document.getElementById('wsEstado').value = 'programado';
      document.getElementById('wsColor').value = '#f97316';
      document.getElementById('wsColorHex').value = '#f97316';
      
      const notasCount = document.getElementById('wsNotasCount');
      if (notasCount) notasCount.textContent = '0';
      
      document.getElementById('modalWorkScheduleTitle').textContent = 'Asignar Horario Laboral';
      
      // Cargar empleados antes de abrir modal
      await loadEmpleadosForSchedules();
      
      const modal = document.getElementById('modalWorkSchedule');
      modal.classList.remove('hidden');
    });
  }
  
  // Cerrar modal
  const btnClose = document.getElementById('btnCloseWorkScheduleModal');
  if (btnClose) {
    btnClose.addEventListener('click', closeWorkScheduleModal);
  }
  
  const btnCancel = document.getElementById('btnCancelWorkSchedule');
  if (btnCancel) {
    btnCancel.addEventListener('click', closeWorkScheduleModal);
  }
  
  // Sincronizar color picker con input hex
  const colorPicker = document.getElementById('wsColor');
  const colorHex = document.getElementById('wsColorHex');
  
  if (colorPicker && colorHex) {
    colorPicker.addEventListener('input', (e) => {
      colorHex.value = e.target.value;
    });
    
    colorHex.addEventListener('input', (e) => {
      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
        colorPicker.value = e.target.value;
      }
    });
  }
  
  // Contador de caracteres para notas
  const notasTextarea = document.getElementById('wsNotas');
  const notasCount = document.getElementById('wsNotasCount');
  
  if (notasTextarea && notasCount) {
    notasTextarea.addEventListener('input', (e) => {
      notasCount.textContent = e.target.value.length;
    });
  }
  
  // Submit formulario
  const form = document.getElementById('formWorkSchedule');
  if (form) {
    form.addEventListener('submit', async (e) => {
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
  }
  
  // Filtros
  const btnApplyFiltersSchedules = document.getElementById('btnApplyFiltersSchedules');
  if (btnApplyFiltersSchedules) {
    btnApplyFiltersSchedules.addEventListener('click', loadWorkSchedules);
  }
  
  const btnClearFiltersSchedules = document.getElementById('btnClearFiltersSchedules');
  if (btnClearFiltersSchedules) {
    btnClearFiltersSchedules.addEventListener('click', () => {
      document.getElementById('filterEmployeeSchedules').value = '';
      document.getElementById('filterMonth').value = '';
      document.getElementById('filterYear').value = '';
      document.getElementById('filterStatus').value = '';
      loadWorkSchedules();
    });
  }
  
  // Cambio de vista
  const btnViewList = document.getElementById('btnViewList');
  if (btnViewList) {
    btnViewList.addEventListener('click', () => switchWorkSchedulesView('list'));
  }
  
  const btnViewWeek = document.getElementById('btnViewWeek');
  if (btnViewWeek) {
    btnViewWeek.addEventListener('click', () => switchWorkSchedulesView('week'));
  }
  
  const btnViewMonth = document.getElementById('btnViewMonth');
  if (btnViewMonth) {
    btnViewMonth.addEventListener('click', () => switchWorkSchedulesView('month'));
  }
  
  // ===================================
  // NAVEGACIÓN SEMANAL - REESCRITA
  // ===================================
  const btnPrevWeek = document.getElementById('btnPrevWeek');
  if (btnPrevWeek) {
    btnPrevWeek.addEventListener('click', () => {
      calendarState.goToPreviousWeek();
      renderWorkSchedulesWeekView();
    });
  }
  
  const btnNextWeek = document.getElementById('btnNextWeek');
  if (btnNextWeek) {
    btnNextWeek.addEventListener('click', () => {
      calendarState.goToNextWeek();
      renderWorkSchedulesWeekView();
    });
  }
  
  // ===================================
  // NAVEGACIÓN MENSUAL - REESCRITA
  // ===================================
  const btnPrevMonth = document.getElementById('btnPrevMonth');
  if (btnPrevMonth) {
    btnPrevMonth.addEventListener('click', () => {
      calendarState.goToPreviousMonth();
      renderWorkSchedulesMonthView();
    });
  }
  
  const btnNextMonth = document.getElementById('btnNextMonth');
  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => {
      calendarState.goToNextMonth();
      renderWorkSchedulesMonthView();
    });
  }

  // ===================================
  // FILTROS RÁPIDOS - ESTA SEMANA / ESTE MES
  // ===================================
  const btnFilterWeek = document.getElementById('btnFilterWeek');
  if (btnFilterWeek) {
    btnFilterWeek.addEventListener('click', () => {
      // Resetear a esta semana
      calendarState.goToToday(); // Ir a hoy
      switchWorkSchedulesView('week');
      renderWorkSchedulesWeekView();
      console.log('📅 Filtro: Esta Semana activado');
    });
  }

  const btnFilterMonth = document.getElementById('btnFilterMonth');
  if (btnFilterMonth) {
    btnFilterMonth.addEventListener('click', () => {
      // Resetear a este mes
      calendarState.goToToday(); // Ir a hoy
      switchWorkSchedulesView('month');
      renderWorkSchedulesMonthView();
      console.log('📆 Filtro: Este Mes activado');
    });
  }
  
  // Marcar como configurado
  workSchedulesListenersConfigured = true;
  console.log('✅ Event listeners configurados exitosamente');
}

// ===================================
// FIN GESTIÓN DE HORARIOS LABORALES
// ===================================


// Hacer funciones accesibles globalmente para onclick
window.editTimeRecord = editTimeRecord;
window.deleteTimeRecord = deleteTimeRecord;
window.exportTimeRecords = exportTimeRecords;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.showEditAdminModal = showEditAdminModal;
window.toggleAdminRole = toggleAdminRole;
window.unlockAdmin = unlockAdmin;
window.deleteAdmin = deleteAdmin;
window.showEmpleadoModal = showEmpleadoModal;
window.deleteEmpleado = deleteEmpleado;
window.openNotificationDetail = openNotificationDetail;
window.openGalleryModal = openGalleryModal;
window.editImage = editImage;
window.toggleImageFeatured = toggleImageFeatured;
window.editWorkSchedule = editWorkSchedule;
window.deleteWorkSchedule = deleteWorkSchedule;
window.toggleImageStatus = toggleImageStatus;
window.deleteImage = deleteImage;
window.viewContact = viewContact;

// Funciones de selección múltiple globales
window.toggleItemSelection = toggleItemSelection;
window.toggleSelectAll = toggleSelectAll;
window.clearSelection = clearSelection;
window.bulkDelete = bulkDelete;

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin panel loaded');
  
  // ===================================
  // INICIALIZACIÓN CON DELAY PARA DATEUTILS
  // ===================================
  const initializePanel = () => {
    if (typeof DateUtils === 'undefined') {
      console.warn('%c[CALENDAR] ⚠️ Esperando a DateUtils...', 'color: #F77F00;');
      // Esperar 200ms y reintentar una vez
      setTimeout(() => {
        if (typeof DateUtils === 'undefined') {
          console.error('%c[CALENDAR] ❌ DateUtils no disponible - calendario deshabilitado', 'color: #E63946;');
          // Continuar sin calendario
          initializePanelWithoutCalendar();
        } else {
          // DateUtils cargó, inicializar normalmente
          initializeCalendar();
          initializePanelCore();
        }
      }, 200);
      return;
    }
    
    // DateUtils disponible desde el inicio
    initializeCalendar();
    initializePanelCore();
  };
  
  const initializeCalendar = () => {
    console.log('%c[CALENDAR] ✅ DateUtils module loaded successfully', 'color: #06D6A0; font-weight: bold;');
    console.log('%c[CALENDAR] Local module - no external dependencies', 'color: #118AB2;');
    
    // Inicializar CalendarState
    calendarState = new CalendarState();
    console.log('%c[CALENDAR] ✅ CalendarState initialized', 'color: #06D6A0; font-weight: bold;');
  };
  
  const initializePanelCore = () => {
    // Mostrar información del usuario en el header
    displayUserInfo();
    
    // Cargar datos iniciales
    loadNews();
    loadStats();
    
    // Inicializar componentes
    initTabs();
    initContactFilters();
    initContactModal();
    initAdminManagement();
    initEmpleadoManagement();
    setupNotificationsDropdown();
    
    // Inicializar nuevas funcionalidades
    initEventsManagement();
    initGalleryManagement();
    initTimeRecordsManagement();
    initIncidencesManagement();
    
    // Actualizar reloj del header cada minuto
    updateDateTime();
    setInterval(updateDateTime, 60000);
  };
  
  const initializePanelWithoutCalendar = () => {
    console.warn('%c[ADMIN] ⚠️ Inicializando panel sin sistema de calendario', 'color: #F77F00; font-weight: bold;');
    initializePanelCore();
  };
  
  // Iniciar
  initializePanel();
});

// ===================================
// GESTIÓN DE INCIDENCIAS
// ===================================

/**
 * Abre el popup de incidencias
 */
function openIncidencesPopup() {
  const popup = document.getElementById('incidencesPopup');
  popup.classList.remove('hidden');
  popup.classList.add('flex');
  loadIncidencias(); // Cargar datos al abrir
}

/**
 * Cierra el popup de incidencias
 */
function closeIncidencesPopup() {
  const popup = document.getElementById('incidencesPopup');
  popup.classList.add('hidden');
  popup.classList.remove('flex');
}

/**
 * Formatea el tipo de incidencia para mostrar
 */
function getIncidenceTipoLabel(tipo) {
  const labels = {
    'baja_medica': 'Baja Médica',
    'falta': 'Falta',
    'retraso': 'Retraso',
    'ausencia_justificada': 'Ausencia Justificada'
  };
  return labels[tipo] || tipo;
}

/**
 * Retorna clases de badge según el tipo de incidencia
 */
function getIncidenceTipoBadge(tipo) {
  const badges = {
    'baja_medica': 'bg-red-100 text-red-800 border-red-300',
    'falta': 'bg-orange-100 text-orange-800 border-orange-300',
    'retraso': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'ausencia_justificada': 'bg-blue-100 text-blue-800 border-blue-300'
  };
  return badges[tipo] || 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Retorna clases de badge según el estado de incidencia
 */
function getIncidenceEstadoBadge(estado) {
  const badges = {
    'pendiente': 'bg-amber-100 text-amber-800 border-amber-300',
    'aprobada': 'bg-green-100 text-green-800 border-green-300',
    'rechazada': 'bg-red-100 text-red-800 border-red-300'
  };
  return badges[estado] || 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Formatea el estado de incidencia para mostrar
 */
function getIncidenceEstadoLabel(estado) {
  const labels = {
    'pendiente': 'Pendiente',
    'aprobada': 'Aprobada',
    'rechazada': 'Rechazada'
  };
  return labels[estado] || estado;
}

/**
 * Carga todas las incidencias con filtros
 */
async function loadIncidencias() {
  try {
    // Construir query params con filtros
    const params = new URLSearchParams();
    
    const filterEmployee = document.getElementById('filterIncidenceEmployee').value;
    const filterType = document.getElementById('filterIncidenceType').value;
    const filterStatus = document.getElementById('filterIncidenceStatus').value;
    
    if (filterEmployee) params.append('empleadoId', filterEmployee);
    if (filterType) params.append('tipo', filterType);
    if (filterStatus) params.append('estado', filterStatus);
    
    params.append('limit', '100'); // Cargar hasta 100 incidencias
    
    const url = `${API_URL}/incidences/admin/todas${params.toString() ? '?' + params.toString() : ''}`;
    const data = await Auth.authFetch(url);
    
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Error al cargar incidencias');
    }
    
    renderIncidencias(data.data);
    updateIncidencesBadge(data.data);
    
  } catch (error) {
    console.error('Error al cargar incidencias:', error);
    showNotification('Error al cargar incidencias: ' + error.message, 'error');
    
    const tbody = document.getElementById('incidencesTableBody');
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-4 py-12 text-center text-gray-500">
          <div class="text-6xl mb-4">❌</div>
          <p class="text-lg mb-2">Error al cargar incidencias</p>
          <p class="text-sm">${error.message}</p>
        </td>
      </tr>
    `;
  }
}

/**
 * Renderiza la tabla de incidencias
 */
function renderIncidencias(incidencias) {
  const tbody = document.getElementById('incidencesTableBody');
  
  if (!incidencias || incidencias.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-4 py-12 text-center text-gray-500">
          <div class="text-6xl mb-4">📭</div>
          <p class="text-lg mb-2">No hay incidencias</p>
          <p class="text-sm">Las incidencias reportadas por los empleados aparecerán aquí</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = incidencias.map(incidencia => {
    const empleadoNombre = incidencia.empleado?.nombre || 'Usuario eliminado';
    const empleadoRol = incidencia.empleado?.rolEmpleado || '';
    const tipoLabel = getIncidenceTipoLabel(incidencia.tipo);
    const tipoBadge = getIncidenceTipoBadge(incidencia.tipo);
    const estadoLabel = getIncidenceEstadoLabel(incidencia.estado);
    const estadoBadge = getIncidenceEstadoBadge(incidencia.estado);
    const fecha = new Date(incidencia.fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Badge del rol del empleado
    let rolBadge = '';
    if (empleadoRol) {
      const rolColors = {
        'monitor': 'bg-blue-100 text-blue-800',
        'cocina': 'bg-orange-100 text-orange-800',
        'barra': 'bg-purple-100 text-purple-800'
      };
      const rolColor = rolColors[empleadoRol] || 'bg-gray-100 text-gray-800';
      const rolTexts = {
        'monitor': 'Monitor',
        'cocina': 'Cocina',
        'barra': 'Barra'
      };
      const rolText = rolTexts[empleadoRol] || empleadoRol;
      rolBadge = `<span class="inline-block ${rolColor} text-xs px-2 py-0.5 rounded-full font-semibold ml-2">${rolText}</span>`;
    }
    
    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-4 py-3">
          <div class="font-medium text-gray-900">${empleadoNombre}</div>
          ${rolBadge}
        </td>
        <td class="px-4 py-3">
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full border ${tipoBadge}">
            ${tipoLabel}
          </span>
        </td>
        <td class="px-4 py-3 text-gray-700">${fecha}</td>
        <td class="px-4 py-3">
          <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full border ${estadoBadge}">
            ${estadoLabel}
          </span>
        </td>
        <td class="px-4 py-3">
          <button 
            onclick="openIncidenceDetail('${incidencia.id || incidencia._id}')"
            class="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            👁️ Ver Detalle
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Actualiza el badge de incidencias pendientes y las estadísticas de la tarjeta
 */
function updateIncidencesBadge(incidencias) {
  const pendientes = incidencias.filter(i => i.estado === 'pendiente').length;
  const total = incidencias.length;
  
  // Actualizar tarjeta del dashboard
  const cardTotal = document.getElementById('totalIncidencias');
  const cardPending = document.getElementById('pendingIncidenciasText');
  
  if (cardTotal) cardTotal.textContent = total;
  if (cardPending) cardPending.textContent = `${pendientes} pendiente${pendientes !== 1 ? 's' : ''}`;
}

/**
 * Abre el modal de detalle de incidencia
 */
async function openIncidenceDetail(incidenciaId) {
  try {
    const data = await Auth.authFetch(`${API_URL}/incidences/admin/${incidenciaId}`);
    
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Error al cargar incidencia');
    }
    
    const incidencia = data.data;
    
    // Llenar información básica
    document.getElementById('incidenceId').value = incidencia.id || incidencia._id;
    document.getElementById('detailEmpleadoNombre').textContent = incidencia.empleado?.nombre || 'Usuario eliminado';
    
    // Rol del empleado
    const empleadoRol = incidencia.empleado?.rolEmpleado;
    if (empleadoRol) {
      const rolTexts = {
        'monitor': 'Monitor',
        'cocina': 'Cocina',
        'barra': 'Barra'
      };
      const rolColors = {
        'monitor': 'bg-blue-100 text-blue-800',
        'cocina': 'bg-orange-100 text-orange-800',
        'barra': 'bg-purple-100 text-purple-800'
      };
      const rolText = rolTexts[empleadoRol] || empleadoRol;
      const rolColor = rolColors[empleadoRol] || 'bg-gray-100 text-gray-800';
      document.getElementById('detailEmpleadoRol').innerHTML = `
        <span class="inline-block ${rolColor} px-3 py-1 rounded-full text-sm font-semibold">${rolText}</span>
      `;
    } else {
      document.getElementById('detailEmpleadoRol').textContent = '-';
    }
    
    // Tipo
    const tipoLabel = getIncidenceTipoLabel(incidencia.tipo);
    const tipoBadge = getIncidenceTipoBadge(incidencia.tipo);
    document.getElementById('detailTipo').innerHTML = `
      <span class="inline-block px-3 py-1 text-sm font-semibold rounded-full border ${tipoBadge}">
        ${tipoLabel}
      </span>
    `;
    
    // Fecha
    const fecha = new Date(incidencia.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    document.getElementById('detailFecha').textContent = fecha;
    
    // Estado
    const estadoLabel = getIncidenceEstadoLabel(incidencia.estado);
    const estadoBadge = getIncidenceEstadoBadge(incidencia.estado);
    document.getElementById('detailEstado').innerHTML = `
      <span class="inline-block px-3 py-1 text-sm font-semibold rounded-full border ${estadoBadge}">
        ${estadoLabel}
      </span>
    `;
    
    // Descripción (campo correcto del backend: 'motivo')
    document.getElementById('detailDescripcion').textContent = incidencia.motivo || '-';
    
    // Documento adjunto (campo correcto del backend: 'documentoAdjunto')
    const docSection = document.getElementById('detailDocumentoSection');
    const docButton = document.getElementById('detailDocumentoLink');
    if (incidencia.documentoAdjunto) {
      docButton.onclick = () => verDocumentoIncidencia(incidencia.id || incidencia._id);
      docSection.classList.remove('hidden');
    } else {
      docSection.classList.add('hidden');
    }
    
    // Respuesta admin (campo correcto del backend: 'comentarioAdmin')
    const respuestaSection = document.getElementById('detailRespuestaSection');
    if (incidencia.comentarioAdmin) {
      document.getElementById('detailRespuestaAdmin').textContent = incidencia.comentarioAdmin;
      if (incidencia.updatedAt) {
        const fechaResp = new Date(incidencia.updatedAt).toLocaleString('es-ES');
        document.getElementById('detailFechaRespuesta').textContent = `Respondido el ${fechaResp}`;
      }
      respuestaSection.classList.remove('hidden');
    } else {
      respuestaSection.classList.add('hidden');
    }
    
    // Preseleccionar estado actual en el formulario
    document.getElementById('incidenceNewStatus').value = incidencia.estado;
    document.getElementById('incidenceAdminResponse').value = incidencia.comentarioAdmin || '';
    
    // Cambiar de vista: ocultar lista, mostrar detalle
    document.getElementById('incidencesListView').classList.add('hidden');
    document.getElementById('incidencesDetailView').classList.remove('hidden');
    
  } catch (error) {
    console.error('Error al cargar detalle de incidencia:', error);
    showNotification('Error al cargar detalle: ' + error.message, 'error');
  }
}

/**
 * Volver a la vista de lista de incidencias
 */
function backToIncidencesList() {
  document.getElementById('incidencesDetailView').classList.add('hidden');
  document.getElementById('incidencesListView').classList.remove('hidden');
}

/**
 * Actualiza el estado de una incidencia
 */
async function updateIncidenceStatus(e) {
  e.preventDefault();
  
  console.log('🔄 updateIncidenceStatus llamado');
  
  const incidenciaId = document.getElementById('incidenceId').value;
  const nuevoEstado = document.getElementById('incidenceNewStatus').value;
  const comentarioAdmin = document.getElementById('incidenceAdminResponse').value.trim();
  
  console.log('📋 Datos del formulario:', { incidenciaId, nuevoEstado, comentarioAdmin });
  
  // Validar que haya estado seleccionado
  if (!nuevoEstado) {
    showNotification('Debes seleccionar un estado', 'error');
    return;
  }
  
  // Validar que la respuesta sea obligatoria solo para estados finales (aprobada/rechazada)
  if ((nuevoEstado === 'aprobada' || nuevoEstado === 'rechazada') && !comentarioAdmin) {
    showNotification('El comentario es obligatorio para aprobar o rechazar', 'error');
    return;
  }
  
  try {
    console.log('📤 Enviando petición PATCH...');
    const data = await Auth.authFetch(`${API_URL}/incidences/admin/${incidenciaId}/revisar`, {
      method: 'PATCH',
      body: JSON.stringify({
        estado: nuevoEstado,
        comentarioAdmin: comentarioAdmin || undefined
      })
    });
    
    console.log('📥 Respuesta recibida:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Error al actualizar incidencia');
    }
    
    showNotification('Incidencia actualizada correctamente', 'success');
    backToIncidencesList(); // Volver a la lista
    loadIncidencias(); // Recargar lista
    
  } catch (error) {
    console.error('❌ Error completo:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    showNotification('Error al actualizar: ' + error.message, 'error');
  }
}

/**
 * Carga la lista de empleados para el filtro
 */
async function loadEmpleadosForIncidenceFilter() {
  try {
    const data = await Auth.authFetch(`${API_URL}/admins/empleados`);
    
    if (data.success && data.data) {
      const select = document.getElementById('filterIncidenceEmployee');
      const currentValue = select.value;
      
      // Mantener la opción "Todos"
      select.innerHTML = '<option value="">Todos los empleados</option>';
      
      // Agregar empleados
      data.data.forEach(empleado => {
        const option = document.createElement('option');
        option.value = empleado._id;
        option.textContent = empleado.nombre;
        select.appendChild(option);
      });
      
      // Restaurar selección si existía
      if (currentValue) {
        select.value = currentValue;
      }
    }
  } catch (error) {
    console.error('Error al cargar empleados para filtro:', error);
  }
}

/**
 * Inicializa la gestión de incidencias
 */
function initIncidencesManagement() {
  // Event listeners de filtros
  document.getElementById('filterIncidenceEmployee')?.addEventListener('change', loadIncidencias);
  document.getElementById('filterIncidenceType')?.addEventListener('change', loadIncidencias);
  document.getElementById('filterIncidenceStatus')?.addEventListener('change', loadIncidencias);
  
  // Botón limpiar filtros
  document.getElementById('btnClearIncidenceFilters')?.addEventListener('click', () => {
    document.getElementById('filterIncidenceEmployee').value = '';
    document.getElementById('filterIncidenceType').value = '';
    document.getElementById('filterIncidenceStatus').value = '';
    loadIncidencias();
  });
  
  // Botón volver a la lista
  document.getElementById('btnBackToIncidencesList')?.addEventListener('click', backToIncidencesList);
  
  // Botón eliminar incidencia
  document.getElementById('btnDeleteIncidence')?.addEventListener('click', async () => {
    const incidenciaId = document.getElementById('incidenceId').value;
    if (!incidenciaId) return;
    
    const result = await Swal.fire({
      title: '¿Eliminar incidencia?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
      try {
        const data = await Auth.authFetch(`${API_URL}/incidences/admin/${incidenciaId}`, {
          method: 'DELETE'
        });
        
        if (data.success) {
          showNotification('Incidencia eliminada correctamente', 'success');
          backToIncidencesList();
          loadIncidencias();
        } else {
          throw new Error(data.message || 'Error al eliminar');
        }
      } catch (error) {
        console.error('Error al eliminar incidencia:', error);
        showNotification('Error al eliminar: ' + error.message, 'error');
      }
    }
  });
  
  // Formulario de gestión
  document.getElementById('formIncidenceManagement')?.addEventListener('submit', updateIncidenceStatus);
  
  // Mostrar/ocultar "requerido" en respuesta según estado seleccionado
  document.getElementById('incidenceNewStatus')?.addEventListener('change', (e) => {
    const label = document.getElementById('respuestaRequeridaLabel');
    if (e.target.value === 'aprobada' || e.target.value === 'rechazada') {
      label.classList.remove('hidden');
    } else {
      label.classList.add('hidden');
    }
  });
  
  // Cargar empleados para filtro
  loadEmpleadosForIncidenceFilter();
  
  console.log('✅ Gestión de incidencias inicializada');
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
      showNotification('No hay sesión activa', 'error');
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
    showNotification(error.message || 'No se pudo cargar el documento', 'error');
  }
}

// ===================================
// FIN DEL ARCHIVO
// ===================================

console.log('✅ Admin.js completamente cargado');
