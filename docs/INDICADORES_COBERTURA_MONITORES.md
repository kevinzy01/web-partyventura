# Indicadores de Cobertura de Monitores

**Fecha**: 3 de noviembre de 2025  
**Feature**: Indicadores visuales de cobertura de monitores por día  
**Commit**: `PENDING`  
**Vistas Afectadas**: Semanal y Mensual (Horarios Laborales)

---

## Resumen Ejecutivo

Se implementó un **sistema de indicadores visuales** que colorea automáticamente las celdas de días en el calendario según la cantidad de **monitores únicos** asignados ese día, facilitando la identificación rápida de días con cobertura insuficiente.

**Objetivo**: Facilitar la gestión de horarios detectando visualmente días que necesitan refuerzo de personal.

---

## Reglas de Coloración

### 🟢 **Verde Claro** - Cobertura Completa
- **Condición**: 6 o más monitores únicos asignados
- **Color de fondo**: `bg-green-50`
- **Color de borde**: `border-green-300`
- **Badge**: `✅ N monitores` (verde)
- **Significado**: El día tiene cobertura suficiente

### 🔴 **Rojo Claro** - Refuerzo Necesario
- **Condición**: 1 a 5 monitores únicos asignados
- **Color de fondo**: `bg-red-50`
- **Color de borde**: `border-red-300`
- **Badge**: `⚠️ N monitores` (rojo)
- **Significado**: El día necesita más monitores

### ⚪ **Gris** - Sin Horarios
- **Condición**: No hay horarios asignados
- **Color de fondo**: `bg-gray-50` (semanal) / `bg-white` (mensual)
- **Color de borde**: `border-gray-200`
- **Badge**: Ninguno
- **Significado**: Día sin planificación

### 🔵 **Azul Claro** - Sin Monitores (pero con otros roles)
- **Condición**: Hay horarios pero 0 monitores (solo cocina/barra)
- **Color de fondo**: `bg-blue-50`
- **Color de borde**: `border-blue-200`
- **Badge**: Ninguno
- **Significado**: Día sin monitores asignados

---

## Lógica de Conteo

### **Monitores Únicos**

El sistema cuenta **monitores únicos** usando `Set()` de JavaScript, lo que significa:

```javascript
// Ejemplo 1: Monitor con horario partido
Juan Pérez (monitor) - 09:00-13:00
Juan Pérez (monitor) - 17:00-22:00
// Cuenta como: 1 monitor (mismo _id)

// Ejemplo 2: Diferentes monitores
Juan Pérez (monitor) - 09:00-17:00
María García (monitor) - 10:00-18:00
Pedro López (monitor) - 11:00-19:00
// Cuenta como: 3 monitores (diferentes _id)

// Ejemplo 3: Otros roles NO cuentan
Ana Ruiz (cocina) - 09:00-17:00
Luis Torres (barra) - 10:00-18:00
// Cuenta como: 0 monitores
```

### **Implementación**

**Vista Semanal** (`renderWorkSchedulesWeekView()` líneas ~4020-4065):
```javascript
// Contar monitores ÚNICOS asignados ese día
const monitoresUnicos = new Set();
horarios.forEach(h => {
  if (h.empleado?.rolEmpleado === 'monitor' && h.empleado?._id) {
    monitoresUnicos.add(h.empleado._id);
  }
});
const cantidadMonitores = monitoresUnicos.size;

// Determinar color de fondo según cantidad de monitores
let bgColor = 'bg-gray-50';
let borderColor = 'border-gray-200';
let badgeText = '';
let badgeColor = '';

if (hasSchedules) {
  if (cantidadMonitores >= 6) {
    bgColor = 'bg-green-50';
    borderColor = 'border-green-300';
    badgeText = `✅ ${cantidadMonitores} monitores`;
    badgeColor = 'bg-green-100 text-green-800';
  } else if (cantidadMonitores > 0) {
    bgColor = 'bg-red-50';
    borderColor = 'border-red-300';
    badgeText = `⚠️ ${cantidadMonitores} monitores`;
    badgeColor = 'bg-red-100 text-red-800';
  } else {
    bgColor = 'bg-blue-50';
    borderColor = 'border-blue-200';
  }
}
```

**Vista Mensual** (`renderWorkSchedulesMonthView()` líneas ~4215-4260):
```javascript
// Misma lógica que vista semanal
// Badge más compacto: `✅ N` en vez de `✅ N monitores`
```

---

## Visualización en el Calendario

### **Vista Semanal**

```
┌────────────────────────────────────────────────────────────────┐
│ Lunes          ✅ 6 monitores │ Martes       ⚠️ 3 monitores   │
│ 04/11                          │ 05/11                         │
│ ┌────────────────────────────┐ │ ┌────────────────────────┐   │
│ │ Juan Pérez (monitor)       │ │ │ María G. (monitor)     │   │
│ │ 09:00-17:00                │ │ │ 09:00-13:00            │   │
│ └────────────────────────────┘ │ └────────────────────────┘   │
│ ┌────────────────────────────┐ │ ┌────────────────────────┐   │
│ │ Ana López (monitor)        │ │ │ Pedro S. (monitor)     │   │
│ │ 10:00-18:00                │ │ │ 17:00-22:00            │   │
│ └────────────────────────────┘ │ └────────────────────────┘   │
│ ... (4 monitores más)          │ ┌────────────────────────┐   │
│                                │ │ Luis R. (monitor)      │   │
│ FONDO: Verde claro             │ │ 09:00-17:00            │   │
│                                │ └────────────────────────┘   │
│                                │ FONDO: Rojo claro            │
└────────────────────────────────────────────────────────────────┘
```

### **Vista Mensual**

```
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│  L   │  M   │  X   │  J   │  V   │  S   │  D   │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│  1   │  2   │  3   │  4✅6│  5⚠️3│  6   │  7   │
│      │      │      │ Verde│ Rojo │      │      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│  8   │  9✅7│ 10⚠️4│ 11   │ 12✅8│ 13   │ 14   │
│      │Verde │ Rojo │      │Verde │      │      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

---

## Componentes Implementados

### **1. Leyenda Explicativa** (admin.html líneas ~2115-2135)

```html
<!-- Leyenda de indicadores de monitores -->
<div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border-2 border-blue-200">
  <div class="flex items-center gap-2 mb-2">
    <span class="text-lg">ℹ️</span>
    <h3 class="text-sm font-bold text-gray-800">Indicadores de Cobertura de Monitores</h3>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
    <!-- Indicador Verde -->
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 bg-green-50 border-2 border-green-300 rounded flex items-center justify-center">
        <span class="text-xs font-bold text-green-800">✅</span>
      </div>
      <div>
        <span class="font-semibold text-green-800">6+ monitores asignados</span>
        <span class="text-gray-600 text-xs block">Cobertura completa</span>
      </div>
    </div>
    
    <!-- Indicador Rojo -->
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 bg-red-50 border-2 border-red-300 rounded flex items-center justify-center">
        <span class="text-xs font-bold text-red-800">⚠️</span>
      </div>
      <div>
        <span class="font-semibold text-red-800">Menos de 6 monitores</span>
        <span class="text-gray-600 text-xs block">Refuerzo necesario</span>
      </div>
    </div>
  </div>
  
  <!-- Nota aclaratoria -->
  <div class="mt-2 text-xs text-gray-600 italic">
    💡 Los monitores con horario partido cuentan como 1 solo monitor
  </div>
</div>
```

**Ubicación**: Entre los botones de vista y el contenedor de calendarios.

### **2. Badges en Celdas**

**Vista Semanal**:
```html
<div class="flex items-center justify-between mb-2">
  <div class="font-semibold text-sm text-gray-700">Lunes</div>
  <div class="text-[10px] px-2 py-0.5 rounded font-bold bg-green-100 text-green-800">
    ✅ 6 monitores
  </div>
</div>
```

**Vista Mensual** (más compacto):
```html
<div class="flex items-center justify-between mb-1">
  <div class="text-xs font-semibold text-gray-700">4</div>
  <div class="text-[9px] px-1 py-0.5 rounded font-bold bg-red-100 text-red-800" 
       title="Monitores asignados">
    ⚠️ 3
  </div>
</div>
```

### **3. Atributo data-monitores**

Cada celda de día ahora incluye:
```html
<div class="day-cell ..." data-monitores="6" ...>
```

**Utilidad**: Permite acceso rápido al conteo desde JavaScript (ej. estadísticas, filtros futuros).

---

## Casos de Uso

### **Caso 1: Planificación Semanal**
```
Admin abre vista semanal → 
  Ve Lunes en VERDE (7 monitores) ✅
  Ve Martes en ROJO (4 monitores) ⚠️
  Identifica que necesita asignar 2 monitores más el Martes
  Asigna horarios adicionales
  Vista se recarga → Martes ahora en VERDE ✅
```

### **Caso 2: Revisión Mensual**
```
Admin abre vista mensual →
  Detecta patrón: Todos los fines de semana en ROJO ⚠️
  Decide implementar política de refuerzo para sábados y domingos
  Programa monitores extra de forma recurrente
```

### **Caso 3: Monitor con Horario Partido**
```
Juan tiene:
  - Horario 1: 09:00-13:00 (monitor)
  - Horario 2: 17:00-22:00 (monitor)

Sistema detecta:
  - Mismo empleado (_id)
  - Mismo rol (monitor)
  
Cuenta como: 1 monitor único ✅

Lógica:
  Set() garantiza unicidad por _id
  No importa cuántos horarios tenga el mismo empleado
```

### **Caso 4: Día con Solo Cocina/Barra**
```
Día tiene:
  - 3 cocineros
  - 2 baristas
  - 0 monitores

Resultado:
  - cantidadMonitores = 0
  - bgColor = 'bg-blue-50' (azul, no rojo)
  - Sin badge
  
Interpretación:
  Día tiene personal, pero sin monitores específicamente
```

---

## Ventajas de Gestión

### ✅ **Identificación Rápida**
- Vista rápida de días problemáticos sin revisar detalles
- Colores intuitivos (verde = OK, rojo = problema)
- Patrón visual fácil de recordar

### ✅ **Planificación Proactiva**
- Detectar patrones (ej. siempre pocos monitores los domingos)
- Asignar recursos con antelación
- Evitar días con cobertura insuficiente

### ✅ **Toma de Decisiones Informada**
- Badges muestran cantidad exacta de monitores
- Leyenda siempre visible para referencia
- Tooltips en vista mensual con información adicional

### ✅ **Eficiencia Operativa**
- Menos tiempo revisando horarios uno por uno
- Enfoque en días que requieren atención
- Reducción de errores de planificación

---

## Detalles Técnicos

### **Conteo con Set()**

JavaScript `Set()` garantiza unicidad automática:

```javascript
const monitoresUnicos = new Set();

// Iteración 1: Juan Pérez (monitor) 09:00-13:00
monitoresUnicos.add('67234abc...'); // ID de Juan
// Set: { '67234abc...' } - size: 1

// Iteración 2: Juan Pérez (monitor) 17:00-22:00
monitoresUnicos.add('67234abc...'); // Mismo ID
// Set: { '67234abc...' } - size: 1 (no duplica)

// Iteración 3: María García (monitor) 10:00-18:00
monitoresUnicos.add('67235def...'); // ID de María
// Set: { '67234abc...', '67235def...' } - size: 2

// Resultado final
const cantidadMonitores = monitoresUnicos.size; // 2
```

### **Validaciones**

El código valida múltiples condiciones:

```javascript
if (h.empleado?.rolEmpleado === 'monitor' && h.empleado?._id) {
  monitoresUnicos.add(h.empleado._id);
}
```

**Condiciones**:
1. `h.empleado` existe (no es null/undefined)
2. `h.empleado.rolEmpleado` es exactamente `'monitor'`
3. `h.empleado._id` existe (tiene ID válido)

**Casos excluidos**:
- ❌ Horarios sin empleado asignado
- ❌ Empleados con rol `'cocina'` o `'barra'`
- ❌ Empleados sin ID (datos corruptos)

### **Performance**

- **Complejidad**: O(n) donde n = número de horarios del día
- **Espacio**: O(m) donde m = número de monitores únicos
- **Operaciones Set**: O(1) para `add()` y `size`

**Ejemplo**:
```
Día con 20 horarios (10 monitores únicos):
  - 20 iteraciones forEach
  - 10 operaciones Set.add()
  - 1 operación Set.size
  
Total: ~31 operaciones por día
Vista semanal: ~217 operaciones (7 días)
Vista mensual: ~930 operaciones (30 días)

Tiempo estimado: < 1ms
```

---

## Compatibilidad

### **Navegadores**
- ✅ Chrome 38+ (Set nativo)
- ✅ Firefox 13+ (Set nativo)
- ✅ Safari 8+ (Set nativo)
- ✅ Edge 12+ (Set nativo)
- ❌ IE 10 o inferior (requiere polyfill)

### **Vistas**
- ✅ Vista Semanal (grid 7 columnas)
- ✅ Vista Mensual (grid dinámico)
- ❌ Vista Lista (no aplica, no hay representación visual por día)

---

## Testing Manual Realizado

### ✅ Test 1: Día con 6+ monitores
```
Datos:
  - 6 monitores diferentes
  - 8 horarios totales (2 con horario partido)

Resultado:
  ✅ Fondo verde claro
  ✅ Badge "✅ 6 monitores"
  ✅ Borde verde
```

### ✅ Test 2: Día con menos de 6 monitores
```
Datos:
  - 3 monitores únicos
  - 5 horarios totales

Resultado:
  ✅ Fondo rojo claro
  ✅ Badge "⚠️ 3 monitores"
  ✅ Borde rojo
```

### ✅ Test 3: Monitor con horario partido
```
Datos:
  - Juan Pérez: 09:00-13:00 (monitor)
  - Juan Pérez: 17:00-22:00 (monitor)
  - 4 monitores más

Resultado:
  ✅ Cuenta 5 monitores (no 6)
  ✅ Fondo rojo (no verde)
  ✅ Badge "⚠️ 5 monitores"
```

### ✅ Test 4: Día sin monitores (solo cocina/barra)
```
Datos:
  - 3 cocineros
  - 2 baristas
  - 0 monitores

Resultado:
  ✅ Fondo azul claro
  ✅ Sin badge
  ✅ Borde azul
```

### ✅ Test 5: Día sin horarios
```
Datos:
  - 0 horarios

Resultado:
  ✅ Fondo gris (semanal) o blanco (mensual)
  ✅ Sin badge
  ✅ Borde gris
```

### ✅ Test 6: Drag & drop preservado
```
Acción:
  - Arrastrar horario de día ROJO a día VERDE

Resultado:
  ✅ Drag funciona correctamente
  ✅ Colores se actualizan tras drop
  ✅ Contadores se recalculan correctamente
```

---

## Mejoras Futuras (Opcionales)

### 1. **Umbrales Configurables**
```javascript
// Permitir al admin configurar el mínimo de monitores
const MINIMO_MONITORES = 6; // Configurable desde settings

if (cantidadMonitores >= MINIMO_MONITORES) {
  // Verde
}
```

### 2. **Estadísticas Globales**
```javascript
// Panel resumen al final del calendario
Total días con cobertura completa: 18/30 (60%)
Total días con refuerzo necesario: 10/30 (33%)
Total días sin monitores: 2/30 (7%)
```

### 3. **Notificaciones Automáticas**
```javascript
// Alertar al admin si hay muchos días en rojo
if (diasConCoberturaInsuficiente > 5) {
  showNotification('⚠️ Más de 5 días necesitan refuerzo de monitores', 'warning');
}
```

### 4. **Exportar Informe**
```javascript
// Generar PDF con días problemáticos
btnExportarInformeMonitores.click() →
  PDF con lista de días en rojo
  Sugerencias de asignación
```

### 5. **Colores Personalizables**
```javascript
// Permitir al admin elegir colores
Verde → Azul
Rojo → Naranja
etc.
```

---

## Conclusión

El sistema de indicadores de cobertura de monitores proporciona una **mejora sustancial en la gestión de horarios**, permitiendo:

- ✅ Identificación visual inmediata de días problemáticos
- ✅ Planificación proactiva basada en patrones
- ✅ Reducción de tiempo en revisión de horarios
- ✅ Mejor toma de decisiones con información clara

**Estado**: ✅ **LISTO PARA PRODUCCIÓN**

**Recomendación**: Desplegar y monitorear feedback de usuarios para posibles ajustes de umbrales.

---

**Documentación completa**: Este archivo  
**Próxima revisión**: Tras 2 semanas de uso en producción  
**Mantenedor**: GitHub Copilot AI Assistant
