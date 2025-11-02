// ===================================
// DATE-UTILS.JS
// Utilidades de manejo de fechas - Implementación ligera
// Basado en principios de date-fns pero sin dependencias externas
// ===================================

const DateUtils = {
  /**
   * Obtiene el primer día de la semana (lunes) para una fecha dada
   * @param {Date} date - Fecha de referencia
   * @returns {Date} Lunes de esa semana
   */
  startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    const diff = day === 0 ? -6 : 1 - day; // Si domingo, retrocede 6 días; si no, calcula diff
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  /**
   * Suma días a una fecha
   * @param {Date} date - Fecha base
   * @param {number} amount - Número de días a sumar
   * @returns {Date} Nueva fecha
   */
  addDays(date, amount) {
    const d = new Date(date);
    d.setDate(d.getDate() + amount);
    return d;
  },

  /**
   * Suma semanas a una fecha
   * @param {Date} date - Fecha base
   * @param {number} amount - Número de semanas a sumar
   * @returns {Date} Nueva fecha
   */
  addWeeks(date, amount) {
    return this.addDays(date, amount * 7);
  },

  /**
   * Suma meses a una fecha
   * @param {Date} date - Fecha base
   * @param {number} amount - Número de meses a sumar
   * @returns {Date} Nueva fecha
   */
  addMonths(date, amount) {
    const d = new Date(date);
    const desiredMonth = d.getMonth() + amount;
    const desiredYear = d.getFullYear() + Math.floor(desiredMonth / 12);
    const month = ((desiredMonth % 12) + 12) % 12; // Normaliza mes
    
    d.setFullYear(desiredYear);
    d.setMonth(month);
    
    return d;
  },

  /**
   * Obtiene el primer día del mes
   * @param {Date} date - Fecha de referencia
   * @returns {Date} Primer día del mes
   */
  startOfMonth(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  /**
   * Formatea fecha a string YYYY-MM-DD
   * @param {Date} date - Fecha a formatear
   * @param {string} formatStr - Patrón de formato
   * @returns {string} Fecha formateada
   */
  format(date, formatStr) {
    const d = new Date(date);
    
    if (formatStr === 'yyyy-MM-dd' || formatStr === 'YYYY-MM-DD') {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    if (formatStr === 'dddd' || formatStr === 'EEEE') {
      const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      return days[d.getDay()];
    }
    
    // Fallback
    return d.toISOString().split('T')[0];
  },

  /**
   * Compara si dos fechas son el mismo día
   * @param {Date} date1 - Primera fecha
   * @param {Date} date2 - Segunda fecha
   * @returns {boolean} True si son el mismo día
   */
  isSameDay(date1, date2) {
    return this.format(date1, 'yyyy-MM-dd') === this.format(date2, 'yyyy-MM-dd');
  },

  /**
   * Genera array de fechas en un intervalo
   * @param {Object} interval - { start: Date, end: Date }
   * @returns {Date[]} Array de fechas
   */
  eachDayOfInterval({ start, end }) {
    const dates = [];
    let current = new Date(start);
    const endTime = end.getTime();
    
    while (current.getTime() <= endTime) {
      dates.push(new Date(current));
      current = this.addDays(current, 1);
    }
    
    return dates;
  }
};

// Exponer globalmente
window.DateUtils = DateUtils;
