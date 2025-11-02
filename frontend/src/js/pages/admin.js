// ===================================
// ADMIN.JS - Panel de Administración
// Gestión completa para Partyventura
// CON SISTEMA DE AUTENTICACIÓN JWT
// ===================================

// Estado global
let currentContactId = null;
let currentFilter = 'all';

// Estado de selección múltiple
const bulkSelection = {
  news: new Set(),
  contacts: new Set(),
  empleados: new Set(),
  events: new Set(),
  gallery: new Set(),
  timeRecords: new Set()
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

// Verificar autenticación al cargar
window.addEventListener('DOMContentLoaded', () => {
  // El guard se ejecuta automáticamente desde auth.js
  if (Auth.isAuthenticated()) {
    initializeAdmin();
  }
});

// Inicializar el panel de administración
function initializeAdmin() {
  console.log('✅ Autenticación verificada, iniciando panel...');
  
  // Mostrar información del usuario
  displayUserInfo();
  
  // Inicializar componentes
  updateDateTime();
  setInterval(updateDateTime, 60000); // Actualizar cada minuto
  
  initTabs();
  loadStats();
  loadNews();
  loadContacts();
}

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
    const contactsResponse = await Auth.authFetch(`${API_URL}/contact`);
    const contactsData = await contactsResponse.json();
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
      const subscribersResponse = await Auth.authFetch(`${API_URL}/newsletter`);
      const subscribersData = await subscribersResponse.json();
      document.getElementById('totalSubscribers').textContent = subscribersData.success ? subscribersData.data.length : '0';
    } catch (error) {
      console.log('Newsletter API no disponible aún');
      document.getElementById('totalSubscribers').textContent = '0';
    }

    // Cargar eventos (REQUIERE AUTENTICACIÓN)
    try {
      const eventsResponse = await Auth.authFetch(`${API_URL}/events`);
      const eventsData = await eventsResponse.json();
      document.getElementById('totalEvents').textContent = eventsData.success ? eventsData.data.length : '0';
    } catch (error) {
      console.log('Events API:', error.message);
      document.getElementById('totalEvents').textContent = '0';
    }

    // Cargar imágenes de galería (REQUIERE AUTENTICACIÓN)
    try {
      const galleryResponse = await Auth.authFetch(`${API_URL}/gallery`);
      const galleryData = await galleryResponse.json();
      document.getElementById('totalGalleryImages').textContent = galleryData.success ? galleryData.data.length : '0';
    } catch (error) {
      console.log('Gallery API:', error.message);
      document.getElementById('totalGalleryImages').textContent = '0';
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
  
  function activateTab(activeTab, activeSection, onActivate) {
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
    const response = await Auth.authFetch(`${API_URL}/news/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/contact`);
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/contact/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/contact/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
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
  
  if (user && user.rol === 'superadmin') {
    // Superadmin ve todo
    tabAdmins?.classList.remove('hidden');
    tabEmpleados?.classList.remove('hidden');
    tabTimeRecords?.classList.remove('hidden');
    tabWorkSchedules?.classList.remove('hidden');
  } else if (user && user.rol === 'admin') {
    // Admin solo ve empleados
    tabAdmins?.classList.add('hidden');
    tabEmpleados?.classList.remove('hidden');
    tabTimeRecords?.classList.add('hidden');
    tabWorkSchedules?.classList.add('hidden');
  } else {
    // Empleados no ven nada de administración
    tabAdmins?.classList.add('hidden');
    tabEmpleados?.classList.add('hidden');
    tabTimeRecords?.classList.add('hidden');
    tabWorkSchedules?.classList.add('hidden');
  }
}

// Cargar lista de administradores
async function loadAdmins() {
  const container = document.getElementById('adminsContainer');
  
  try {
    const response = await Auth.authFetch(`${API_URL}/admins`);
    const data = await response.json();
    
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
      const response = await Auth.authFetch(`${API_URL}/admins`);
      const data = await response.json();
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
    const response = await Auth.authFetch(`${API_URL}/admins/${adminId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol: newRole })
    });
    
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/admins/${adminId}/unlock`, {
      method: 'PATCH'
    });
    
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/admins/${adminId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/admins/empleados`);
    const data = await response.json();
    
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
      const response = await Auth.authFetch(`${API_URL}/admins/empleados/${empleadoId}`);
      const data = await response.json();
      
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
  
  // Validar contraseña en creación
  if (!empleadoId && (!password || password.length < 6)) {
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
    
    const response = await Auth.authFetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(empleadoData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification(
        empleadoId ? 'Empleado actualizado correctamente' : 'Empleado creado correctamente',
        'success'
      );
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
    const response = await Auth.authFetch(`${API_URL}/admins/empleados/${empleadoId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/contact`);
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/contact`);
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/events`);
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/events/${id}`);
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/events/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
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
  
  loadGallery();
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
    
    const response = await Auth.authFetch(`${API_URL}/gallery?${params}`);
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/gallery/${id}`);
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/gallery/${id}/toggle-featured`, {
      method: 'PATCH'
    });
    
    const data = await response.json();
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
    const response = await Auth.authFetch(`${API_URL}/gallery/${id}/toggle-status`, {
      method: 'PATCH'
    });
    
    const data = await response.json();
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
    const response = await Auth.authFetch(`${API_URL}/gallery/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
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
    const response = await Auth.authFetch(`${API_URL}/admins/empleados`);
    const data = await response.json();
    
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
    
    const response = await Auth.authFetch(`${API_URL}/time-records/admin/todos?${params}`);
    const data = await response.json();
    
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
    const employeesResponse = await Auth.authFetch(`${API_URL}/admins/empleados`);
    const employeesData = await employeesResponse.json();
    
    if (employeesData.success) {
      const employees = employeesData.data;
      document.getElementById('totalEmployees').textContent = employees.length;
    }
    
    // Cargar resumen mensual (mes y año actuales)
    const now = new Date();
    const mes = now.getMonth() + 1; // getMonth() devuelve 0-11
    const anio = now.getFullYear();
    
    const resumenResponse = await Auth.authFetch(`${API_URL}/time-records/admin/resumen?mes=${mes}&anio=${anio}`);
    const resumenData = await resumenResponse.json();
    
    if (resumenData.success && resumenData.data) {
      // Calcular total de horas del mes
      const totalHours = resumenData.data.reduce((sum, emp) => sum + (emp.totalHoras || 0), 0);
      document.getElementById('monthHours').textContent = totalHours.toFixed(1);
    }
    
    // Cargar registros de hoy
    const today = new Date().toISOString().split('T')[0];
    const todayResponse = await Auth.authFetch(`${API_URL}/time-records/admin/todos?fechaInicio=${today}&fechaFin=${today}`);
    const todayData = await todayResponse.json();
    
    if (todayData.success && todayData.data) {
      const todayRecordsCount = todayData.data.pagination.totalRecords;
      document.getElementById('todayRecords').textContent = todayRecordsCount;
      
      // Contar empleados trabajando ahora (última entrada sin salida)
      const registros = todayData.data.registros || [];
      const workingNow = registros.filter(r => {
        if (r.tipo === 'entrada') {
          // Buscar si hay una salida posterior
          const hasSalida = registros.some(s => 
            s.tipo === 'salida' && 
            s.empleado._id === r.empleado._id && 
            new Date(s.fecha) > new Date(r.fecha)
          );
          return !hasSalida;
        }
        return false;
      });
      
      // Contar empleados únicos trabajando
      const uniqueWorking = new Set(workingNow.map(r => r.empleado._id)).size;
      document.getElementById('workingNow').textContent = uniqueWorking;
    }
    
  } catch (error) {
    console.error('Error loading summary:', error);
    // Inicializar con valores por defecto en caso de error
    document.getElementById('totalEmployees').textContent = '0';
    document.getElementById('monthHours').textContent = '0';
    document.getElementById('todayRecords').textContent = '0';
    document.getElementById('workingNow').textContent = '0';
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
    const response = await Auth.authFetch(`${API_URL}/time-records/admin/todos?limit=1000`);
    const data = await response.json();
    
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
    const response = await Auth.authFetch(`${API_URL}/time-records/admin/${recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, fecha, ubicacion })
    });
    
    const data = await response.json();
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
    const response = await Auth.authFetch(`${API_URL}/time-records/admin/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
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
let currentWeekDate = new Date();
let currentMonthDate = new Date();
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
    const response = await fetch(`${API_URL}/admins/empleados`, {
      headers: Auth.getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (data.success && data.data) {
      // Ya están filtrados por rol='empleado' desde el backend
      empleadosListForSchedules = data.data;
      
      if (empleadosListForSchedules.length === 0) {
        console.warn('⚠️ No hay empleados con rol="empleado" en la base de datos.');
      }
      
      // Poblar select de filtro
      const filterSelect = document.getElementById('filterEmployee');
      if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Todos los empleados</option>';
        empleadosListForSchedules.forEach(emp => {
          filterSelect.innerHTML += `<option value="${emp._id}">${emp.nombre}</option>`;
        });
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
      }
    }
  } catch (error) {
    console.error('Error al cargar empleados:', error);
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
    const empleadoId = document.getElementById('filterEmployee')?.value || '';
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
        <td colspan="8" class="px-6 py-12 text-center text-gray-500">
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
    
    return `
      <tr class="hover:bg-gray-50 transition-colors">
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
}

// Renderizar vista semanal
async function renderWorkSchedulesWeekView() {
  try {
    // Calcular inicio y fin de semana
    const diaSemana = currentWeekDate.getDay();
    const inicioSemana = new Date(currentWeekDate);
    inicioSemana.setDate(currentWeekDate.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
    inicioSemana.setHours(0, 0, 0, 0);
    
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);
    
    // Obtener datos de la semana
    const empleadoId = document.getElementById('filterEmployee')?.value || '';
    let url = `${API_URL}/work-schedules/weekly?fecha=${inicioSemana.toISOString()}`;
    if (empleadoId) url += `&empleadoId=${empleadoId}`;
    
    const response = await fetch(url, { headers: Auth.getAuthHeaders() });
    const data = await response.json();
    
    if (!data.success) {
      showNotification('Error al cargar vista semanal', 'error');
      return;
    }
    
    // Actualizar título
    const weekTitle = document.getElementById('weekTitle');
    if (weekTitle) {
      const inicioStr = inicioSemana.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      const finStr = finSemana.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      weekTitle.textContent = `Semana del ${inicioStr} al ${finStr}`;
    }
    
    // Renderizar calendario
    const calendar = document.getElementById('weekCalendar');
    if (!calendar) return;
    
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    calendar.innerHTML = data.data.dias.map((dia, index) => {
      const horariosDia = dia.horarios || [];
      
      return `
        <div class="border rounded-lg p-3 ${horariosDia.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}">
          <div class="font-semibold text-sm mb-2 text-gray-700">${diasSemana[index]}</div>
          <div class="text-xs text-gray-500 mb-3">${new Date(dia.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</div>
          
          ${horariosDia.length === 0 ? 
            '<div class="text-xs text-gray-400 italic">Sin horarios</div>' :
            horariosDia.map(h => `
              <div class="bg-white rounded p-2 mb-2 border-l-4" style="border-color: ${h.color || '#f97316'}">
                ${h.empleado?.nombre ? `<div class="text-xs font-semibold text-gray-800">${h.empleado.nombre}</div>` : ''}
                <div class="text-xs text-gray-600">${h.horaInicio} - ${h.horaFin}</div>
                <div class="text-xs text-gray-500">${h.turno} (${h.horasTotales}h)</div>
                ${h.notas ? `<div class="text-xs text-gray-500 mt-1 italic">${h.notas}</div>` : ''}
              </div>
            `).join('')
          }
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error al renderizar vista semanal:', error);
    showNotification('Error al cargar vista semanal', 'error');
  }
}

// Renderizar vista mensual
async function renderWorkSchedulesMonthView() {
  try {
    const mes = currentMonthDate.getMonth() + 1;
    const anio = currentMonthDate.getFullYear();
    const empleadoId = document.getElementById('filterEmployee')?.value || '';
    
    let url = `${API_URL}/work-schedules/monthly?mes=${mes}&anio=${anio}`;
    if (empleadoId) url += `&empleadoId=${empleadoId}`;
    
    const response = await fetch(url, { headers: Auth.getAuthHeaders() });
    const data = await response.json();
    
    if (!data.success) {
      showNotification('Error al cargar vista mensual', 'error');
      return;
    }
    
    // Actualizar título
    const monthTitle = document.getElementById('monthTitle');
    if (monthTitle) {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      monthTitle.textContent = `${meses[mes - 1]} ${anio}`;
    }
    
    // Renderizar resumen
    const summaryContainer = document.getElementById('monthSummary');
    if (summaryContainer && data.data.resumen) {
      const r = data.data.resumen;
      summaryContainer.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="text-2xl font-bold text-blue-600">${r.totalHoras || 0}h</div>
          <div class="text-sm text-gray-600">Horas Totales</div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="text-2xl font-bold text-green-600">${r.diasTrabajo || 0}</div>
          <div class="text-sm text-gray-600">Días de Trabajo</div>
        </div>
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div class="text-2xl font-bold text-orange-600">${r.turnosProgramados || 0}</div>
          <div class="text-sm text-gray-600">Turnos Asignados</div>
        </div>
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div class="text-2xl font-bold text-purple-600">${r.estadisticas?.confirmados || 0}</div>
          <div class="text-sm text-gray-600">Confirmados</div>
        </div>
      `;
    }
    
    // Renderizar calendario (tabla simple)
    const calendarContainer = document.getElementById('monthCalendar');
    if (calendarContainer) {
      const horarios = data.data.horarios || [];
      
      if (horarios.length === 0) {
        calendarContainer.innerHTML = `
          <div class="text-center py-12 text-gray-500">
            <div class="text-6xl mb-4">📅</div>
            <p class="text-lg">No hay horarios asignados este mes</p>
          </div>
        `;
      } else {
        calendarContainer.innerHTML = `
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Empleado</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Turno</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Horario</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${horarios.map(h => {
                const fecha = new Date(h.fecha);
                const fechaStr = fecha.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
                const estadoBadge = {
                  'programado': '<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Programado</span>',
                  'confirmado': '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Confirmado</span>',
                  'completado': '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completado</span>'
                };
                
                return `
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-900 capitalize">${fechaStr}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${h.empleado?.nombre || 'N/A'}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${h.turno} (${h.horasTotales}h)</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${h.horaInicio} - ${h.horaFin}</td>
                    <td class="px-4 py-3">${estadoBadge[h.estado]}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      }
    }
    
  } catch (error) {
    console.error('Error al renderizar vista mensual:', error);
    showNotification('Error al cargar vista mensual', 'error');
  }
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
      showNotification('✅ Horario asignado exitosamente', 'success');
      closeWorkScheduleModal();
      await loadWorkSchedules();
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
  const ws = workSchedules.find(w => w.id === id);
  if (!ws) {
    showNotification('Horario no encontrado', 'error');
    return;
  }
  
  // Llenar formulario
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
      await loadWorkSchedules();
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
async function deleteWorkSchedule(id) {
  // Usar confirm() nativo en lugar de Swal (que no está cargado)
  if (!confirm('¿Estás seguro de que deseas eliminar este horario?\n\nEsta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/work-schedules/${id}`, {
      method: 'DELETE',
      headers: Auth.getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('✅ Horario eliminado exitosamente', 'success');
      await loadWorkSchedules();
    } else {
      showNotification(data.message || '❌ Error al eliminar horario', 'error');
    }
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    showNotification('❌ Error al eliminar horario', 'error');
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

// Event Listeners para Work Schedules
function setupWorkSchedulesEventListeners() {
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
  const btnApplyFilters = document.getElementById('btnApplyFilters');
  if (btnApplyFilters) {
    btnApplyFilters.addEventListener('click', loadWorkSchedules);
  }
  
  const btnClearFilters = document.getElementById('btnClearFilters');
  if (btnClearFilters) {
    btnClearFilters.addEventListener('click', () => {
      document.getElementById('filterEmployee').value = '';
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
  
  // Navegación semanal
  const btnPrevWeek = document.getElementById('btnPrevWeek');
  if (btnPrevWeek) {
    btnPrevWeek.addEventListener('click', () => {
      // Primero, encontrar el lunes de la semana actual
      const diaSemana = currentWeekDate.getDay();
      const diasAlMon = diaSemana === 0 ? 6 : diaSemana - 1;
      currentWeekDate.setDate(currentWeekDate.getDate() - diasAlMon);
      
      // Luego restar 7 días para ir a la semana anterior
      currentWeekDate.setDate(currentWeekDate.getDate() - 7);
      renderWorkSchedulesWeekView();
    });
  }
  
  const btnNextWeek = document.getElementById('btnNextWeek');
  if (btnNextWeek) {
    btnNextWeek.addEventListener('click', () => {
      // Primero, encontrar el lunes de la semana actual
      const diaSemana = currentWeekDate.getDay();
      const diasAlMon = diaSemana === 0 ? 6 : diaSemana - 1;
      currentWeekDate.setDate(currentWeekDate.getDate() - diasAlMon);
      
      // Luego sumar 14 días para ir al lunes de la próxima semana
      currentWeekDate.setDate(currentWeekDate.getDate() + 14);
      renderWorkSchedulesWeekView();
    });
  }
  
  // Navegación mensual
  const btnPrevMonth = document.getElementById('btnPrevMonth');
  if (btnPrevMonth) {
    btnPrevMonth.addEventListener('click', () => {
      // Establecer al primer día del mes actual y luego restar 1 mes
      currentMonthDate.setDate(1);
      currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
      renderWorkSchedulesMonthView();
    });
  }
  
  const btnNextMonth = document.getElementById('btnNextMonth');
  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => {
      // Establecer al primer día del mes actual y luego sumar 1 mes
      currentMonthDate.setDate(1);
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
      renderWorkSchedulesMonthView();
    });
  }
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
  
  // Actualizar reloj del header cada minuto
  updateDateTime();
  setInterval(updateDateTime, 60000);
});
