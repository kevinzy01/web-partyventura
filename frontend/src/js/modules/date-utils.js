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
    const before = d.getTime();
    d.setDate(d.getDate() + amount);
    const after = d.getTime();
    const actualDiff = Math.round((after - before) / (1000 * 60 * 60 * 24));
    
    if (window.CALENDAR_DEBUG && Math.abs(actualDiff - amount) > 1) {
      console.warn('[DateUtils.addDays] Unexpected difference:', {
        expected: amount,
        actual: actualDiff,
        input: new Date(date).toISOString(),
        output: d.toISOString()
      });
    }
    
    // Normalizar a medianoche para consistencia
    d.setHours(0, 0, 0, 0);
    
    return d;
  },

  /**
   * Suma semanas a una fecha
   * @param {Date} date - Fecha base
   * @param {number} amount - Número de semanas a sumar
   * @returns {Date} Nueva fecha
   */
  addWeeks(date, amount) {
    // addDays ya normaliza a medianoche
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
    
    // Obtener mes y año actuales
    const currentMonth = d.getMonth();
    const currentYear = d.getFullYear();
    const currentDay = d.getDate();
    
    // Calcular nuevo mes y año
    const totalMonths = currentMonth + amount;
    const newYear = currentYear + Math.floor(totalMonths / 12);
    const newMonth = ((totalMonths % 12) + 12) % 12;
    
    // Crear nueva fecha con el nuevo mes/año
    // Importante: setMonth() puede causar overflow si el día no existe en el mes destino
    // Ejemplo: 31 enero + 1 mes = 3 marzo (porque febrero no tiene día 31)
    const result = new Date(newYear, newMonth, 1); // Empezar con día 1
    
    // Luego ajustar al día original si existe en el mes destino
    // Si el mes destino tiene menos días, usar el último día del mes
    const daysInNewMonth = new Date(newYear, newMonth + 1, 0).getDate();
    const dayToSet = Math.min(currentDay, daysInNewMonth);
    
    result.setDate(dayToSet);
    
    // Normalizar a medianoche para consistencia
    result.setHours(0, 0, 0, 0);
    
    return result;
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
