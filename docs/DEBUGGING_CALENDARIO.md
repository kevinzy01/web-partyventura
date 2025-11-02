# 🔍 Guía de Debugging del Calendario - Logging Completo

## ✅ Se agregó logging detallado

He añadido **logging completo** en consola para que podamos ver exactamente qué está pasando. Ahora podemos rastrear:

1. ✅ Cálculos de fechas (getMonday, addWeeks, addMonths)
2. ✅ Cambios de estado (navegación semana/mes)
3. ✅ Datos que llegan del backend
4. ✅ Cómo se mapean y renderizan los horarios

---

## 🎯 Instrucciones para Investigar

### **Paso 1: Hacer Hard Refresh**

En el navegador (Chrome, Firefox, o Edge):
- **Windows**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- O desde DevTools (F12): Click derecho en botón recargar → "Vaciar caché y recargar"

### **Paso 2: Abrir DevTools y Console**

1. Abre DevTools: `F12`
2. Vete a la pestaña **"Console"**
3. Verifica que veas logs con color **naranja** y texto `[CALENDAR]`

**Ejemplo de lo que verás:**

```
[CALENDAR] CalendarState CONSTRUCTOR
[CALENDAR] getMonday { input: '2025-11-02', dayOfWeek: 7, ... }
[CALENDAR] → monday result "2025-10-27"
```

Si no ves logs naranja, significa que el cache no se actualizó. Intenta:
- Ctrl + F5 nuevamente
- Abre en modo incógnito (Ctrl + Shift + N)

### **Paso 3: Navegar Semanas y Observar Logs**

1. Ve al panel admin
2. Navega a **"Horarios Laborales"**
3. Selecciona vista **"Semana"**
4. En DevTools Console, haz click en cualquier log para expandir

**Pasos del test:**

```javascript
// En la consola, ejecuta esto para verificar:
console.log('DEBUG ACTIVO:', typeof logCalendar, CALENDAR_DEBUG);

// Verás "DEBUG ACTIVO: function true"
```

Luego:

1. **Click en botón "Semana Anterior" (◀)**
2. Observa en Console los logs que aparecen
3. **Busca**: Si el `output` de `goToPreviousWeek` es **correcto**
   - Esperado: Lunes retrocede 7 días exactamente
   - Problema: ¿Retrocede más/menos de 7 días?

4. **Click en botón "Semana Siguiente" (▶)**
5. Observa los logs nuevamente
6. **Repite 5 veces** para ver si hay drift acumulativo

### **Paso 4: Registra los Logs Importantes**

Cuando veas los saltos, **copia y comparte estos logs**:

```
[CALENDAR] goToPreviousWeek { before: "2025-11-02", after: "..." }
[CALENDAR] Week Dates { monday: "2025-10-27", allDates: [...] }
[CALENDAR] Map Contents { size: X, keys: [...] }
```

---

## 📊 Qué Buscar en los Logs

### **Patrón Normal (Sin Saltos)**

```
[CALENDAR] goToPreviousWeek { before: "2025-11-02", after: "2025-10-26" }  ← -7 días ✅
[CALENDAR] goToPreviousWeek { before: "2025-10-26", after: "2025-10-19" }  ← -7 días ✅
[CALENDAR] goToPreviousWeek { before: "2025-10-19", after: "2025-10-12" }  ← -7 días ✅
```

### **Patrón Problemático (Con Saltos)**

```
[CALENDAR] goToPreviousWeek { before: "2025-11-02", after: "2025-10-26" }  ← -7 días ✅
[CALENDAR] goToPreviousWeek { before: "2025-10-26", after: "2025-10-19" }  ← -7 días ✅
[CALENDAR] goToPreviousWeek { before: "2025-10-19", after: "2025-09-28" }  ← -21 días ❌❌❌ SALTO
```

Si ves un salto, **el problema es en `addWeeks()`**.

---

## 🧬 Posibles Causas (Por Prioridad)

### **1. Bug en `addWeeks()` (80% de probabilidad)**

El cálculo está utilizando:
```javascript
result.setDate(date.getDate() + (weeks * 7));
```

**Problema potencial**: Si estamos en día 30 y restamos 7, el `setDate(23)` podría estar correcto, pero si el mes anterior tiene menos días (ej: febrero), Date autocorrige.

**Ejemplo**: 
- Hoy es 30 de marzo
- Restar 7 días → `setDate(23)` en marzo = 23 de marzo ✅
- Pero si el mes anterior es febrero (28 días)...
- ...puede haber comportamiento inesperado

### **2. Bug en `getMonday()` (15% de probabilidad)**

El cálculo de `diff`:
```javascript
const diff = day === 0 ? -6 : 1 - day;
```

**Verificar**: ¿El lunes se calcula correctamente para todas las fechas?

### **3. Problem en `toISODate()` (4% de probabilidad)**

Aunque es improbable, verifica que las fechas se formen correctamente.

### **4. Caché del navegador (1% de probabilidad)**

Ya está descartado si estás viendo los logs.

---

## 📋 Plan de Acción

**Una vez identifiques el patrón del salto:**

1. Copia todos los logs problemáticos
2. Identifica **exactamente cuál función tiene el bug** (addWeeks, getMonday, etc.)
3. Comparte conmigo:
   - Los logs
   - La secuencia exacta de clics que causan el problema
   - Si es semanal, mensual, o ambos

---

## 💡 Tips Adicionales

### **Ver logs más claros**

Ejecuta en Console:

```javascript
// Expandir automáticamente los logs
const oldLog = logCalendar;
logCalendar = function(label, data) {
  oldLog(label, data);
  console.table(data);
};
```

### **Limpiar Console**

```javascript
// Limpia los logs viejos
console.clear();
```

### **Desactivar logs si son demasiados**

En el archivo:
```javascript
const CALENDAR_DEBUG = false; // Cambiar a false
```

---

## 🎥 Requisitos del Test

- [ ] Hard refresh (Ctrl + Shift + R)
- [ ] DevTools abierto en Console (F12)
- [ ] Vista de Semana
- [ ] Click en "Semana Anterior" 5 veces
- [ ] Click en "Semana Siguiente" 5 veces
- [ ] Observar logs en Console
- [ ] Reportar qué ves

---

## 📞 Cuándo Reportar

Una vez hayas completado el test anterior:

**Reporta**:
1. Screenshot de los logs en Console
2. Descripción de lo que ves (saltos, incorrectos, etc.)
3. Secuencia de clics exacta

**Ejemplo de reporte ideal**:

```
"Hice 5 clicks en botón Semana Anterior.

Log esperado:
- 1er click: -7 días ✅
- 2do click: -7 días ✅
- 3er click: -7 días ✅
- 4to click: -7 días ✅
- 5to click: -7 días ✅

Log real:
- 1er click: -7 días ✅
- 2do click: -7 días ✅
- 3er click: -7 días ✅
- 4to click: -21 días ❌ (SALTO DE 14 DÍAS EXTRA)
- 5to click: -7 días ✅

El problema ocurre en el 4to click específicamente."
```

---

**¡Vamos a encontrar exactamente dónde está el bug!** 🔍
