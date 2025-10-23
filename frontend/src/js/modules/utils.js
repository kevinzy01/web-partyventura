// ===================================
// UTILS.JS - Utilidades Compartidas
// Partyventura
// ===================================

/**
 * Muestra una notificación toast en pantalla
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'error', 'info'
 */
function showNotification(message, type = 'info') {
  const existingNotification = document.querySelector('.notification-toast');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification-toast fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl max-w-md transform transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  } text-white font-semibold`;
  
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => notification.remove(), 300);
  }, TIMEOUTS.notification || 5000);
}

/**
 * Formatea una fecha a formato español
 * @param {string|Date} date - Fecha a formatear
 * @param {boolean} includeTime - Incluir hora
 * @returns {string} Fecha formateada
 */
function formatDate(date, includeTime = true) {
  const d = new Date(date);
  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return d.toLocaleDateString('es-ES', options);
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
function isValidEmail(email) {
  const pattern = VALIDATION?.email?.pattern || /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * Trunca texto con ellipsis
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string}
 */
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Manejo robusto de fetch con validación
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones de fetch
 * @returns {Promise<object>}
 */
async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error en la respuesta del servidor');
    }
    
    return data;
  } catch (error) {
    console.error('Error en fetchAPI:', error);
    throw error;
  }
}

/**
 * Sanitiza HTML para prevenir XSS
 * @param {string} text - Texto a sanitizar
 * @returns {string}
 */
function sanitizeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showNotification,
    formatDate,
    isValidEmail,
    truncateText,
    fetchAPI,
    sanitizeHTML
  };
}
