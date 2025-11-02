# ✅ PLAN DE TESTING - Calendario Corregido

## 📋 Estado Actual

✅ **Bugs encontrados y corregidos** en commits:
- `9b7cbe7` - Fix: Corregir bugs críticos en cálculo de fechas
- `a8f0c64` - Docs: Análisis detallado de bugs

✅ **Logging detallado activado** para debugging:
- `20e2a39` - Feat: Agregar logging detallado para debugging

## 🎯 Checklist de Testing Antes de Producción

### **Fase 1: Verificación Rápida (5 min)**

- [ ] **Hard refresh en navegador**: `Ctrl + Shift + R`
- [ ] Verificar cache version en DevTools:
  ```
  Sources → admin.html → buscar "admin.js?v=72"
  ```
- [ ] Abrir Console en DevTools: `F12` → Console
- [ ] Ejecutar en Console:
  ```javascript
  console.log('Logging disponible:', typeof logCalendar, CALENDAR_DEBUG);
  ```
  - Debería mostrar: `"Logging disponible: function true"`

### **Fase 2: Navegación Semanal (5 min)**

1. Ve a **Panel Admin** → **Horarios Laborales** → **SEMANA**
2. Observa logs en Console (filtro "CALENDAR")
3. **Test #1: Navegar hacia atrás 5 veces**
   ```
   Click en ◀ (Semana Anterior) → 5 veces
   ```
   Observar en Console:
   - [ ] Cada log muestra: `before: "XXXX-XX-XX"` → `after: "XXXX-XX-XX"`
   - [ ] Cada salto es **exactamente -7 días** (no variable)
   - [ ] Nunca cambia mes erráticalmente
   
4. **Test #2: Navegar hacia adelante 5 veces**
   ```
   Click en ▶ (Semana Siguiente) → 5 veces
   ```
   Observar en Console:
   - [ ] Cada log muestra +7 días exactamente
   - [ ] Transición suave sin saltos

5. **Test #3: Transición de año**
   ```
   Usa botón Semana Anterior para llegar a inicio de enero
   Luego click Semana Anterior una vez más
   ```
   Observar:
   - [ ] Cambia a última semana de diciembre año anterior
   - [ ] No hay saltos erráticos
   - [ ] Mes en título actualiza correctamente

### **Fase 3: Navegación Mensual (5 min)**

1. Ve a **Panel Admin** → **Horarios Laborales** → **MES**
2. **Test #1: Navegar hacia atrás 3 meses**
   ```
   Click en ◀ (Mes Anterior) → 3 veces
   ```
   Observar:
   - [ ] Título mes cambia correctamente (ej: Nov → Oct → Sep → Aug)
   - [ ] Año NO cambia (si estás en 2025)
   - [ ] Calendario se recalcula correctamente

3. **Test #2: Navegar transición de año hacia atrás**
   ```
   Navegar hasta enero
   Luego click Mes Anterior una vez
   ```
   Observar:
   - [ ] Cambia a diciembre del año anterior (ej: 2024)
   - [ ] Año en título actualiza (2025 → 2024)
   - [ ] Calendario renderiza correctamente

4. **Test #3: Navegar transición de año hacia adelante**
   ```
   Navegar hasta diciembre 2024
   Luego click Mes Siguiente una vez
   ```
   Observar:
   - [ ] Cambia a enero 2025
   - [ ] Año en título actualiza (2024 → 2025)

### **Fase 4: Validaciones de Logs (3 min)**

En Console, buscar patrones:

✅ **Correcto**:
```
[CALENDAR] addWeeks { before: "...", after: "...", actualDaysAdded: -7, validation: "✅ OK" }
[CALENDAR] getMonday { input: "...", dayOfWeek: 1, dayName: "Lunes", ... }
[CALENDAR] addMonths { ..., validation: "✅ YEAR OK" }
```

❌ **Incorrecto** (reportar inmediatamente):
```
[CALENDAR] addWeeks { ..., validation: "❌ MISMATCH" }
[CALENDAR] getMonday { ..., dayOfWeek: 0 }  // Debería ser 1
[CALENDAR] addMonths { ..., validation: "❌ YEAR MISMATCH" }
```

### **Fase 5: Edge Cases (10 min)**

1. **Año bisiesto**:
   - [ ] Navega a febrero 2024 (tiene 29 días)
   - [ ] Navega a febrero 2025 (tiene 28 días)
   - Verifica que día 29 se maneja correctamente

2. **Mes con menos días**:
   - [ ] Navega a enero (31 días)
   - [ ] Navega a febrero (28/29 días)
   - [ ] Navega a marzo (31 días)
   - Verifica que cambios de 30→31 se manejan correctamente

3. **Filtrado por empleado**:
   - [ ] Selecciona un empleado del dropdown
   - [ ] Navega semanas/meses
   - Verifica que filtrado persiste y renderiza correctamente

4. **Sin horarios asignados**:
   - [ ] Navega a una fecha sin horarios
   - [ ] Verifica que se muestra "Sin horarios"
   - [ ] Navega de nuevo
   - Verifica que no hay errores en Console

### **Fase 6: Performance (2 min)**

- [ ] Navega 20 veces rápidamente (sin esperar)
- [ ] Verifica que no hay lag
- [ ] Console no muestra errores JavaScript
- [ ] Memoria se mantiene estable

## 🎯 Criterios de Aceptación

### ✅ Test PASA Si:

1. **Sin saltos erráticos**
   - Cada navegación es consistente y predecible
   - No hay cambios inesperados de mes/año
   
2. **Dates correctas**
   - Lunes siempre es lunes (dayOfWeek = 1)
   - Transiciones de año funcionan
   - Edge cases no causan problemas

3. **Logging válido**
   - Validaciones muestran "✅ OK"
   - No hay "❌ MISMATCH" o errores

4. **Performance**
   - Sin lag
   - Sin memory leaks
   - Console limpia (sin errores)

### ❌ Test FALLA Si:

1. Saltos erráticos (sin razón aparente)
2. Etiquetas de día incorrectas
3. Cambios de año inesperados
4. Logs con ❌ (validaciones fallidas)
5. Errores JavaScript en Console
6. Lag o performance lenta

## 📱 Testing en Ngrok (Móvil)

Repeat Fase 1-4 en:
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Tablet (si disponible)

Verificar:
- [ ] Mismo comportamiento que desktop
- [ ] Touch gestures funcionan (si implementados)
- [ ] Responsive design OK

## 📊 Reporte de Resultados

Cuando completes testing, reporta:

### ✅ Si TODO funciona:
```
TESTING COMPLETADO ✅

✅ Fase 1: Verificación rápida - OK
✅ Fase 2: Navegación semanal - OK
✅ Fase 3: Navegación mensual - OK
✅ Fase 4: Validaciones de logs - OK
✅ Fase 5: Edge cases - OK
✅ Fase 6: Performance - OK

RESULTADO: Listo para producción 🚀
```

### ❌ Si ALGO falla:
```
TESTING INCOMPLETO ❌

Fase que falló: [Describir cuál]
Resultado esperado: [Qué debería pasar]
Resultado real: [Qué pasó]
Logs de error: [Copiar logs de Console]

Por favor, investigar...
```

## 🔗 Documentación de Referencia

- **Bugs encontrados**: `/docs/BUGS_ENCONTRADOS_CALENDARIO.md`
- **Debugging detallado**: `/docs/DEBUGGING_CALENDARIO.md`
- **Refactor original**: `/docs/CALENDARIO_REFACTOR_2025.md`

## ⏱️ Tiempo Estimado

- Fase 1: 5 min
- Fase 2: 5 min
- Fase 3: 5 min
- Fase 4: 3 min
- Fase 5: 10 min
- Fase 6: 2 min
- **Total: ~30 min**

---

## 🚀 Siguientes Pasos Después del Testing

Si todo funciona:
1. [ ] Commit final con message "test: Validar calendario fix en desarrollo"
2. [ ] Push a repositorio
3. [ ] Desplegar a staging/producción
4. [ ] Comunicar fix a usuarios

Si algo falla:
1. [ ] Revisar logs detallados en Console
2. [ ] Identificar función problemática
3. [ ] Reportar con logs y pasos reproducibles
4. [ ] Aplicar fix adicional si es necesario

---

**¡Adelante con el testing! 🎉**
