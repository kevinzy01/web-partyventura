# 🎠 Nuevo Sistema de Carousel con TranslateX

## 🎯 Objetivo
Crear un carousel que permita:
- ✅ Scroll/navegación horizontal funcional
- ✅ Hover effects completos (scale + translate-y) sin recortes
- ✅ Drag & drop fluido
- ✅ Responsive (desktop y mobile)
- ✅ Auto-scroll pausable

## 🏗️ Arquitectura del Sistema

### 1️⃣ **HTML: Viewport + Container**

```html
<!-- Viewport: contenedor visible con overflow:hidden -->
<div id="carouselViewport" style="height: 600px; overflow: hidden;">
  
  <!-- Container: posición absoluta, se mueve con translateX -->
  <div id="cardContainer" class="absolute flex" style="will-change: transform;">
    
    <!-- Tarjetas con margin-right para separación -->
    <article class="carousel-card" style="margin-right: 1.5rem;">
      <!-- Contenido de la tarjeta -->
    </article>
    
  </div>
</div>
```

**Cómo funciona:**
- `#carouselViewport`: Ventana visible, todo lo que salga se oculta (`overflow: hidden`)
- `#cardContainer`: Se mueve horizontalmente usando `translateX(-Xpx)`
- Tarjetas: Pueden crecer verticalmente sin restricciones (hover sin clipping)

---

### 2️⃣ **CSS: Sin Overflow en el Container**

```css
#carouselViewport {
  position: relative;
  overflow: hidden;  /* Solo el viewport oculta contenido fuera */
  cursor: grab;
}

#cardContainer {
  position: absolute;
  will-change: transform;  /* Optimización GPU */
  /* NO hay overflow aquí, las tarjetas crecen libremente */
}

.carousel-card {
  position: relative;
  z-index: 1;
}

.carousel-card:hover {
  z-index: 10;  /* Superposición al hacer hover */
}
```

**Por qué funciona:**
- NO usamos `overflow-x: auto` en el container
- El movimiento es controlado por JavaScript con `transform: translateX()`
- Las tarjetas NO tienen restricciones verticales
- El hover puede crecer sin ser recortado

---

### 3️⃣ **JavaScript: Control Total con TranslateX**

#### **Variables de Estado:**
```javascript
let currentIndex = 0;        // Posición actual (0 = primera tarjeta)
let isDragging = false;      // Si está arrastrando
let startX = 0;              // Posición inicial del mouse/touch
let currentTranslate = 0;    // Posición actual durante drag
let prevTranslate = 0;       // Posición anterior
```

#### **Función Principal: updatePosition()**
```javascript
function updatePosition(animate = true) {
  const cardWidth = getCardWidth();  // 288px + 24px = 312px
  const offset = -currentIndex * cardWidth;
  
  if (animate) {
    cardContainer.style.transition = 'transform 0.5s ease';
    cardContainer.style.transform = `translateX(${offset}px)`;
  } else {
    cardContainer.style.transition = 'none';
    cardContainer.style.transform = `translateX(${offset}px)`;
  }
  
  updateDots();
  updateButtons();
}
```

#### **Navegación con Flechas:**
```javascript
prevBtn.addEventListener('click', () => {
  goToCard(currentIndex - 1);  // Ir a tarjeta anterior
});

nextBtn.addEventListener('click', () => {
  goToCard(currentIndex + 1);  // Ir a tarjeta siguiente
});
```

#### **Drag & Drop:**
```javascript
// Al empezar a arrastrar
function dragStart(event) {
  isDragging = true;
  startX = getPositionX(event);
  prevTranslate = -currentIndex * getCardWidth();
}

// Mientras arrastra
function drag(event) {
  if (!isDragging) return;
  const currentPosition = getPositionX(event);
  const diff = currentPosition - startX;
  currentTranslate = prevTranslate + diff;  // Mover en tiempo real
}

// Al soltar
function dragEnd() {
  isDragging = false;
  const movedBy = currentTranslate - prevTranslate;
  
  // Si movió más de 1/3 de tarjeta, cambiar
  if (movedBy < -cardWidth / 3) currentIndex++;
  else if (movedBy > cardWidth / 3) currentIndex--;
  
  updatePosition(true);  // Animar a posición final
}
```

#### **Auto-scroll:**
```javascript
function autoScroll() {
  const maxIndex = getMaxIndex();
  if (currentIndex >= maxIndex) {
    currentIndex = 0;  // Volver al inicio
  } else {
    currentIndex++;
  }
  updatePosition(true);
}

// Se inicia automáticamente, se pausa al interactuar
startAutoScroll();  // Cada 4 segundos
```

#### **Responsive:**
```javascript
function getVisibleCards() {
  const viewportWidth = viewport.offsetWidth;
  const cardWidth = getCardWidth();
  return Math.floor(viewportWidth / cardWidth);
}

function getMaxIndex() {
  const visibleCards = getVisibleCards();
  return Math.max(0, cards.length - visibleCards);
}
```

---

## 📊 Comparación: Antes vs Ahora

| Aspecto | Sistema Anterior | Sistema Nuevo |
|---------|------------------|---------------|
| **Scroll** | CSS `overflow-x: auto` | JavaScript `translateX` |
| **Hover vertical** | ❌ Recortado | ✅ Libre |
| **Control** | Navegador | JavaScript completo |
| **Drag** | Nativo HTML | Custom con `requestAnimationFrame` |
| **Performance** | Buena | Excelente (GPU accelerated) |
| **Responsive** | Limitado | Totalmente customizable |

---

## 🎨 Ejemplo Visual

```
┌─────────────────────────────────────────────┐
│ #carouselViewport (overflow: hidden)        │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ #cardContainer (position: absolute)  │   │
│  │ translateX(-312px)  ← se mueve       │   │
│  │                                       │   │
│  │  [Card0] [Card1] [Card2] [Card3]     │   │
│  │     ↑              ↑                  │   │
│  │  visible       visible                │   │
│  │                                       │   │
│  │  Hover crece libremente ✨            │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

Al hacer hover sobre Card1:
```
┌─────────────────────────────────────────────┐
│ #carouselViewport                            │
│           ┌───────────┐                      │
│           │   Card1   │ ← Crece hacia arriba │
│           │  HOVER    │   sin clipping       │
│  ┌────────┴───────────┴──────────────────┐  │
│  │ [Card0]              [Card2] [Card3]  │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 🚀 Ventajas del Nuevo Sistema

### 1. **Hover Completo**
- ✅ `scale(1.10)` funciona perfectamente
- ✅ `-translate-y-3` no se corta
- ✅ Badges superiores visibles
- ✅ Sombras completas

### 2. **Control Total**
- ✅ Personalizar velocidad de transición
- ✅ Easing functions custom
- ✅ Eventos personalizados
- ✅ Lógica de navegación flexible

### 3. **Performance**
- ✅ `will-change: transform` → GPU acceleration
- ✅ `requestAnimationFrame` → 60fps fluidos
- ✅ Transiciones CSS optimizadas
- ✅ Sin reflows innecesarios

### 4. **UX Mejorada**
- ✅ Drag fluido y natural
- ✅ Auto-scroll suave
- ✅ Dots animados
- ✅ Flechas con estados

---

## 🔧 Funciones Principales

| Función | Propósito |
|---------|-----------|
| `getCardWidth()` | Calcular ancho de tarjeta + gap |
| `getVisibleCards()` | Cuántas tarjetas caben en pantalla |
| `getMaxIndex()` | Índice máximo permitido |
| `updatePosition()` | Mover el container con translateX |
| `updateDots()` | Actualizar indicadores visuales |
| `updateButtons()` | Habilitar/deshabilitar flechas |
| `goToCard(index)` | Navegar a tarjeta específica |
| `dragStart/drag/dragEnd()` | Manejo de arrastre |
| `autoScroll()` | Rotación automática |

---

## 📱 Responsive Behavior

### Desktop (≥1024px):
- Múltiples tarjetas visibles
- Drag con mouse
- Auto-scroll activo
- Flechas de navegación

### Mobile (<1024px):
- 1-2 tarjetas visibles
- Touch drag
- Sin auto-scroll (UX móvil)
- Sin flechas (uso táctil)

---

## ✅ Checklist de Funcionalidades

- [x] Navegación con flechas ← →
- [x] Drag & drop (mouse + touch)
- [x] Auto-scroll cada 4 segundos
- [x] Pausa al interactuar
- [x] Dots indicadores animados
- [x] Hover sin clipping vertical
- [x] Responsive (desktop/mobile)
- [x] Badges visibles
- [x] Z-index correcto al hover
- [x] Transiciones suaves
- [x] Performance optimizada

---

## 🎉 Resultado Final

**El carousel ahora tiene:**
- ✨ Movimiento horizontal fluido (translateX)
- ✨ Hover completo sin recortes (scale + translate-y)
- ✨ Drag natural y responsivo
- ✨ Auto-scroll elegante
- ✨ 100% customizable con JavaScript

**Sin limitaciones de CSS `overflow`** 🚀

---

**Creado**: 21 de octubre de 2025  
**Sistema**: TranslateX + JavaScript Control  
**Estado**: ✅ Funcional y optimizado
