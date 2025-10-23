// ===================================
// AUTH.JS - Módulo de Autenticación
// Sistema de gestión de sesiones JWT
// ===================================

const Auth = {
  // Obtener token del localStorage
  getToken() {
    return localStorage.getItem('authToken');
  },

  // Guardar token
  setToken(token) {
    localStorage.setItem('authToken', token);
  },

  // Obtener usuario actual
  getUser() {
    const userStr = localStorage.getItem('adminUser');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Guardar usuario
  setUser(user) {
    localStorage.setItem('adminUser', JSON.stringify(user));
  },

  // Verificar si está autenticado
  isAuthenticated() {
    return !!this.getToken();
  },

  // Cerrar sesión
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/login.html';
  },

  // Verificar token en el servidor
  async verifyToken() {
    const token = this.getToken();
    if (!token) {
      this.logout();
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      if (data.success) {
        // Actualizar datos del usuario
        this.setUser(data.data);
        return true;
      }

      this.logout();
      return false;

    } catch (error) {
      console.error('Error al verificar token:', error);
      return false;
    }
  },

  // Obtener headers con autenticación
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  },

  // Fetch con autenticación automática
  async authFetch(url, options = {}) {
    const token = this.getToken();
    
    if (!token) {
      this.logout();
      throw new Error('No autenticado');
    }

    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
      }
    };

    const response = await fetch(url, { ...options, ...defaultOptions });

    // Si el token expiró o es inválido
    if (response.status === 401) {
      this.logout();
      throw new Error('Sesión expirada');
    }

    return response;
  },

  // Renovar token (si implementas refresh tokens)
  async refreshToken() {
    // TODO: Implementar renovación automática de tokens
    // Por ahora, simplemente verificar
    return await this.verifyToken();
  },

  // Inicializar guard de autenticación
  initGuard(requireAdmin = false) {
    // Verificar autenticación al cargar la página
    if (!this.isAuthenticated()) {
      window.location.href = '/login.html';
      return false;
    }

    // Verificar rol si se requiere admin
    if (requireAdmin) {
      const user = this.getUser();
      if (user && user.rol === 'empleado') {
        alert('Acceso denegado. Los empleados no tienen acceso al panel de administración.');
        window.location.href = 'employee.html';
        return false;
      }
    }

    // Verificar token en el servidor
    this.verifyToken();

    // Renovar cada 30 minutos
    setInterval(() => {
      this.verifyToken();
    }, 30 * 60 * 1000);

    return true;
  },

  // Manejar errores de autenticación
  handleAuthError(error) {
    if (error.message === 'Sesión expirada' || error.message === 'No autenticado') {
      this.showSessionExpired();
    }
  },

  // Mostrar mensaje de sesión expirada
  showSessionExpired() {
    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    this.logout();
  }
};

// Proteger la página al cargar
window.addEventListener('DOMContentLoaded', () => {
  // Proteger admin.html con verificación de rol
  if (window.location.pathname.includes('admin.html')) {
    Auth.initGuard(true); // true = requiere rol de admin o superadmin
  }
  // Proteger employee.html solo con autenticación
  else if (window.location.pathname.includes('employee.html')) {
    Auth.initGuard(false); // false = solo requiere estar autenticado
  }
});
