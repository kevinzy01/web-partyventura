// ===================================
// MAIN.JS - Partyventura Website
// Script principal con navegación horizontal móvil
// ===================================

// ===================================
// 1. CAROUSEL DE PRECIOS
// ===================================
function initCarousel() {
  const cardContainer = document.getElementById('cardContainer');
  if (!cardContainer) {
    console.warn('Card container not found');
    return;
  }
  
  const cards = cardContainer.querySelectorAll('article');
  if (cards.length === 0) {
    console.warn('No cards found in container');
    return;
  }
  
  const dotsContainer = document.getElementById('dots');
  if (!dotsContainer) {
    console.warn('Dots container not found');
    return;
  }
  
  // Generar dots: 3 dots fijos (start, middle, end)
  dotsContainer.innerHTML = '';
  const dotPositions = ['start', 'middle', 'end'];
  
  dotPositions.forEach((position, idx) => {
    const dot = document.createElement('span');
    dot.className = `dot w-3 h-3 lg:w-4 lg:h-4 ${idx === 0 ? 'bg-orange-500' : 'bg-gray-300'} rounded-full transition-all duration-300 cursor-pointer hover:scale-125`;
    dot.dataset.position = position;
    dotsContainer.appendChild(dot);
  });
  
  const dots = dotsContainer.querySelectorAll('.dot');
  let currentDotIndex = 0;
  let autoScrollInterval;
  let userInteracted = false;

  // Actualizar dots activos
  function updateDots(index) {
    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.remove('bg-gray-300');
        dot.classList.add('bg-orange-500');
      } else {
        dot.classList.remove('bg-orange-500');
        dot.classList.add('bg-gray-300');
      }
    });
    currentDotIndex = index;
  }

  // Scroll a una posición específica
  function scrollToPosition(position) {
    const scrollWidth = cardContainer.scrollWidth - cardContainer.offsetWidth;
    let scrollTarget = 0;
    
    if (position === 'start') {
      scrollTarget = 0;
    } else if (position === 'middle') {
      scrollTarget = scrollWidth / 2;
    } else if (position === 'end') {
      scrollTarget = scrollWidth;
    }
    
    cardContainer.scrollTo({
      left: scrollTarget,
      behavior: 'smooth'
    });
  }

  // Click en dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      userInteracted = true;
      stopAutoScroll();
      const position = dot.dataset.position;
      scrollToPosition(position);
      updateDots(index);
    });
  });

  // Auto scroll
  function autoScroll() {
    currentDotIndex = (currentDotIndex + 1) % dots.length;
    const position = dotPositions[currentDotIndex];
    scrollToPosition(position);
    updateDots(currentDotIndex);
  }

  function startAutoScroll() {
    if (!userInteracted) {
      autoScrollInterval = setInterval(autoScroll, 4000);
    }
  }

  function stopAutoScroll() {
    clearInterval(autoScrollInterval);
  }

  // Pausar al hover
  cardContainer.addEventListener('mouseenter', () => {
    userInteracted = true;
    stopAutoScroll();
  });

  // Detectar scroll manual y actualizar dots
  let scrollTimeout;
  cardContainer.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(() => {
      const scrollLeft = cardContainer.scrollLeft;
      const scrollWidth = cardContainer.scrollWidth - cardContainer.offsetWidth;
      
      let newDotIndex = 0;
      
      if (scrollLeft < scrollWidth * 0.33) {
        newDotIndex = 0; // start
      } else if (scrollLeft < scrollWidth * 0.66) {
        newDotIndex = 1; // middle
      } else {
        newDotIndex = 2; // end
      }
      
      if (newDotIndex !== currentDotIndex) {
        updateDots(newDotIndex);
      }
    }, 150);
  });

  // Touch en móvil
  cardContainer.addEventListener('touchstart', () => {
    userInteracted = true;
    stopAutoScroll();
  });

  // Iniciar auto scroll
  startAutoScroll();
  
  // Forzar overflow correcto: horizontal con scroll, vertical visible para hover
  function handleOverflowBehavior() {
    const isDesktop = window.innerWidth >= 1024;
    
    if (isDesktop) {
      // En desktop, mantener scroll horizontal pero permitir overflow vertical
      cardContainer.style.overflowX = 'auto';
      cardContainer.style.overflowY = 'visible';
      // No remover la clase overflow-x-auto
      
      // Asegurar que las tarjetas puedan superponerse
      cards.forEach(card => {
        card.style.overflow = 'visible';
      });
    } else {
      // En móvil, igual: scroll horizontal, overflow vertical visible
      cardContainer.style.overflowX = 'auto';
      cardContainer.style.overflowY = 'visible';
    }
  }
  
  // Aplicar al cargar
  handleOverflowBehavior();
  
  // Reaplicar al cambiar tamaño de ventana
  window.addEventListener('resize', handleOverflowBehavior);
}

// ===================================
// 2. NAVEGACIÓN MÓVIL HORIZONTAL
// ===================================
function initMobileMenu() {
  // Mobile menu is now always visible in header with horizontal scroll
  // No hamburger functionality needed
  console.log('Mobile menu: Horizontal scroll navigation active');
}

// ===================================
// 3. FORMULARIO DE CONTACTO
// ===================================
function initContactForm() {
  const form = document.querySelector('#contacto form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    try {
      // Deshabilitar botón y mostrar loading
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando...';
      
      const formData = {
        nombre: form.querySelector('input[type="text"]').value.trim(),
        email: form.querySelector('input[type="email"]').value.trim(),
        mensaje: form.querySelector('textarea').value.trim()
      };
      
      // Validación básica
      if (!formData.nombre || !formData.email || !formData.mensaje) {
        throw new Error('Por favor completa todos los campos');
      }
      
      // Enviar al backend
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar el mensaje');
      }
      
      // Mostrar mensaje de éxito
      showNotification('✅ ¡Mensaje enviado! Te responderemos pronto.', 'success');
      form.reset();
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      showNotification('❌ ' + error.message, 'error');
    } finally {
      // Rehabilitar botón
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
  
  console.log('Contact form initialized');
}

// ===================================
// 4. GALERÍA DE IMÁGENES
// ===================================
// ===================================
// 4. GALLERY SLIDESHOW
// ===================================
let currentSlide = 0;
let galleryImages = [];
let slideshowInterval = null;

async function initGallery() {
  try {
    // Cargar solo imágenes de galería (no del hero) - usando ruta pública
    const response = await fetch(`${API_URL}/gallery/public?displayLocation=galeria&limit=20`);
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      galleryImages = data.data;
      renderGallery();
      startSlideshow();
      setupGalleryControls();
    } else {
      // Si no hay imágenes, mostrar mensaje
      document.getElementById('gallerySlides').innerHTML = `
        <div class="absolute inset-0 flex items-center justify-center text-white">
          <p class="text-lg">No hay imágenes disponibles</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading gallery:', error);
    document.getElementById('gallerySlides').innerHTML = `
      <div class="absolute inset-0 flex items-center justify-center text-white">
        <p class="text-lg">Error al cargar la galería</p>
      </div>
    `;
  }
}

function renderGallery() {
  const slidesContainer = document.getElementById('gallerySlides');
  const indicatorsContainer = document.getElementById('slideIndicators');
  
  // Renderizar slides
  slidesContainer.innerHTML = galleryImages.map((image, index) => `
    <div class="gallery-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
      <img 
        src="${API_URL.replace('/api', '')}${image.imageUrl}" 
        alt="${image.title || 'Imagen de galería'}"
        class="w-full h-full object-cover"
      >
      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
        <h3 class="text-white text-xl font-bold">${image.title || ''}</h3>
        ${image.description ? `<p class="text-white/90 text-sm mt-1">${image.description}</p>` : ''}
      </div>
    </div>
  `).join('');
  
  // Renderizar indicadores
  indicatorsContainer.innerHTML = galleryImages.map((_, index) => `
    <button 
      class="slide-indicator w-2 h-2 rounded-full transition-all ${index === 0 ? 'bg-white w-8' : 'bg-white/50'}" 
      data-slide="${index}"
    ></button>
  `).join('');
  
  // Actualizar contador
  document.getElementById('totalSlides').textContent = galleryImages.length;
  document.getElementById('currentSlideNum').textContent = '1';
}

function setupGalleryControls() {
  // Botón anterior
  document.getElementById('prevSlide')?.addEventListener('click', () => {
    stopSlideshow();
    goToPrevSlide();
  });
  
  // Botón siguiente
  document.getElementById('nextSlide')?.addEventListener('click', () => {
    stopSlideshow();
    goToNextSlide();
  });
  
  // Indicadores
  document.querySelectorAll('.slide-indicator').forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      stopSlideshow();
      goToSlide(index);
    });
  });
  
  // Pausar en hover
  const slidesContainer = document.getElementById('gallerySlides');
  slidesContainer?.addEventListener('mouseenter', stopSlideshow);
  slidesContainer?.addEventListener('mouseleave', startSlideshow);
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.gallery-slide');
  const indicators = document.querySelectorAll('.slide-indicator');
  
  // Ocultar slide actual
  slides[currentSlide]?.classList.remove('active');
  indicators[currentSlide]?.classList.remove('bg-white', 'w-8');
  indicators[currentSlide]?.classList.add('bg-white/50');
  
  // Mostrar nuevo slide
  currentSlide = index;
  slides[currentSlide]?.classList.add('active');
  indicators[currentSlide]?.classList.remove('bg-white/50');
  indicators[currentSlide]?.classList.add('bg-white', 'w-8');
  
  // Actualizar contador
  document.getElementById('currentSlideNum').textContent = currentSlide + 1;
}

function goToNextSlide() {
  const nextIndex = (currentSlide + 1) % galleryImages.length;
  goToSlide(nextIndex);
}

function goToPrevSlide() {
  const prevIndex = (currentSlide - 1 + galleryImages.length) % galleryImages.length;
  goToSlide(prevIndex);
}

function startSlideshow() {
  stopSlideshow(); // Limpiar intervalo anterior
  slideshowInterval = setInterval(() => {
    goToNextSlide();
  }, 5000); // Cambiar cada 5 segundos
}

function stopSlideshow() {
  if (slideshowInterval) {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
  }
}

// ===================================
// 5. ANIMACIONES DE SCROLL
// ===================================
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
      }
    });
  }, observerOptions);
  
  // Observar secciones
  document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
  });

  console.log('Scroll animations initialized');
}

// ===================================
// 6. NEWSLETTER POP-UP
// ===================================
function initNewsletter() {
  const modal = document.getElementById('newsletterModal');
  const content = document.getElementById('newsletterContent');
  const closeBtn = document.getElementById('closeNewsletter');
  const form = document.getElementById('newsletterForm');
  const emailInput = document.getElementById('newsletterEmail');
  
  if (!modal || !form) return;

  // Verificar si el usuario ya cerró el pop-up en esta sesión
  if (sessionStorage.getItem('newsletterClosed')) {
    return;
  }

  // Mostrar pop-up después de 10 segundos
  setTimeout(() => {
    modal.classList.remove('hidden');
    setTimeout(() => {
      content.classList.remove('scale-95', 'opacity-0');
      content.classList.add('scale-100', 'opacity-100');
    }, 100);
  }, 10000); // 10 segundos

  // Cerrar modal
  const closeModal = () => {
    content.classList.add('scale-95', 'opacity-0');
    content.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
    sessionStorage.setItem('newsletterClosed', 'true');
  };

  closeBtn.addEventListener('click', closeModal);
  
  // Cerrar al hacer clic fuera del modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Enviar suscripción
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    try {
      submitButton.disabled = true;
      submitButton.textContent = 'Suscribiendo...';
      
      const email = emailInput.value.trim();
      
      if (!email) {
        throw new Error('Por favor ingresa un email válido');
      }

      const response = await fetch(`${API_URL}/newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al suscribirse');
      }

      // Mostrar mensaje de éxito
      showNotification('🎉 ¡Suscripción exitosa! Revisa tu email.', 'success');
      form.reset();
      
      // Cerrar modal después de 2 segundos
      setTimeout(closeModal, 2000);

    } catch (error) {
      console.error('Error al suscribirse:', error);
      showNotification('❌ ' + error.message, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });

  console.log('Newsletter pop-up initialized');
}

// ===================================
// 7. CARGAR NOTICIAS DESDE LA API
// ===================================
async function loadNews() {
  const container = document.getElementById('newsContainer');
  if (!container) return;

  try {
    const response = await fetch(`${API_URL}/news?limit=4&publicado=true`);
    const data = await response.json();

    if (!data.success || data.data.length === 0) {
      container.innerHTML = `
        <div class="col-span-2 text-center py-12 text-gray-500">
          <p class="text-lg">📭 No hay noticias disponibles en este momento</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data.data.map(news => {
      const fecha = new Date(news.fechaPublicacion).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      return `
        <article class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
          ${news.imagen ? `
            <img src="${API_URL.replace('/api', '')}${news.imagen}" alt="${news.titulo}" class="w-full h-48 lg:h-64 object-cover">
          ` : `
            <div class="w-full h-48 lg:h-64 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <span class="text-6xl">📰</span>
            </div>
          `}
          <div class="p-4 lg:p-6">
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-xs font-semibold px-2 py-1 rounded-full ${
                news.categoria === 'eventos' ? 'bg-blue-100 text-blue-800' :
                news.categoria === 'promociones' ? 'bg-green-100 text-green-800' :
                news.categoria === 'noticias' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }">${news.categoria}</span>
              <span class="text-xs text-gray-500">📅 ${fecha}</span>
            </div>
            <h3 class="text-xl lg:text-2xl font-semibold mb-2 text-gray-900">${news.titulo}</h3>
            <p class="text-gray-600 text-sm lg:text-base mb-4">${news.resumen}</p>
            <a href="#" class="text-orange-500 font-medium hover:underline inline-flex items-center">
              Leer más 
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
        </article>
      `;
    }).join('');

  } catch (error) {
    console.error('Error al cargar noticias:', error);
    container.innerHTML = `
      <div class="col-span-2 text-center py-12 text-gray-500">
        <p class="text-lg">⚠️ No se pudieron cargar las noticias</p>
        <p class="text-sm mt-2">Por favor, inténtalo más tarde</p>
      </div>
    `;
  }
}

// ===================================
// 7. ARRASTRE DE TARJETAS DE PRECIOS
// ===================================
function initPricingDrag() {
  const container = document.getElementById('cardContainer');
  const prevBtn = document.getElementById('prevCard');
  const nextBtn = document.getElementById('nextCard');
  
  if (!container) return;
  
  let isDown = false;
  let startX;
  let scrollLeft;
  
  // Eventos de mouse para arrastre
  container.addEventListener('mousedown', (e) => {
    // Solo si no es un botón
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    
    isDown = true;
    container.style.cursor = 'grabbing';
    container.style.userSelect = 'none';
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });
  
  container.addEventListener('mouseleave', () => {
    if (!isDown) return;
    isDown = false;
    container.style.cursor = 'grab';
    container.style.userSelect = '';
  });
  
  container.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    container.style.cursor = 'grab';
    container.style.userSelect = '';
  });
  
  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 2; // Multiplicador para velocidad de arrastre
    container.scrollLeft = scrollLeft - walk;
  });
  
  // Navegación con flechas
  if (prevBtn && nextBtn) {
    const cardWidth = 288 + 24; // w-72 (288px) + gap (24px)
    
    prevBtn.addEventListener('click', () => {
      container.scrollBy({
        left: -cardWidth,
        behavior: 'smooth'
      });
    });
    
    nextBtn.addEventListener('click', () => {
      container.scrollBy({
        left: cardWidth,
        behavior: 'smooth'
      });
    });
    
    // Ocultar/mostrar flechas según posición del scroll
    function updateArrows() {
      // Mostrar flechas en todos los tamaños de pantalla
      prevBtn.style.display = '';
      nextBtn.style.display = '';
      
      const maxScroll = container.scrollWidth - container.clientWidth;
      
      if (container.scrollLeft <= 0) {
        prevBtn.style.opacity = '0.3';
        prevBtn.style.pointerEvents = 'none';
      } else {
        prevBtn.style.opacity = '1';
        prevBtn.style.pointerEvents = 'auto';
      }
      
      if (container.scrollLeft >= maxScroll - 5) {
        nextBtn.style.opacity = '0.3';
        nextBtn.style.pointerEvents = 'none';
      } else {
        nextBtn.style.opacity = '1';
        nextBtn.style.pointerEvents = 'auto';
      }
    }
    
    container.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows); // Actualizar al cambiar tamaño
    updateArrows(); // Actualizar estado inicial
  }
  
  // Actualizar dots según posición del scroll
  const dots = document.querySelectorAll('#dots .dot');
  let currentActiveDot = 0;
  
  function updateDots() {
    const maxScroll = container.scrollWidth - container.clientWidth;
    const currentScroll = container.scrollLeft;
    
    // Si no hay scroll posible, mantener el primer dot activo
    if (maxScroll <= 0) {
      dots.forEach((dot, i) => {
        dot.style.backgroundColor = i === 0 ? '#f97316' : '#d1d5db';
        dot.style.transform = i === 0 ? 'scale(1.15)' : 'scale(1)';
        dot.style.boxShadow = i === 0 ? '0 0 12px rgba(249, 115, 22, 0.6)' : 'none';
      });
      return;
    }
    
    const scrollPercentage = (currentScroll / maxScroll) * 100;
    
    // Determinar qué dot debe estar activo
    let activeDot = 0;
    if (scrollPercentage >= 80) {
      activeDot = 2; // Final
    } else if (scrollPercentage >= 33) {
      activeDot = 1; // Medio
    }
    
    // Solo actualizar si cambió el dot activo
    if (activeDot !== currentActiveDot) {
      // Animación de apagado del dot anterior
      if (dots[currentActiveDot]) {
        dots[currentActiveDot].style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        dots[currentActiveDot].style.backgroundColor = '#d1d5db';
        dots[currentActiveDot].style.transform = 'scale(0.85)';
        dots[currentActiveDot].style.boxShadow = 'none';
        dots[currentActiveDot].style.opacity = '0.5';
        
        // Volver al tamaño normal después de encogerse
        setTimeout(() => {
          if (dots[currentActiveDot]) {
            dots[currentActiveDot].style.transform = 'scale(1)';
            dots[currentActiveDot].style.opacity = '1';
          }
        }, 200);
      }
      
      // Animación de encendido del nuevo dot
      if (dots[activeDot]) {
        dots[activeDot].style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        // Pequeño delay para crear efecto de transferencia
        setTimeout(() => {
          if (dots[activeDot]) {
            dots[activeDot].style.backgroundColor = '#f97316';
            dots[activeDot].style.transform = 'scale(1.15)';
            dots[activeDot].style.boxShadow = '0 0 12px rgba(249, 115, 22, 0.6)';
          }
        }, 150);
      }
      
      currentActiveDot = activeDot;
    }
  }
  
  // Configurar transiciones iniciales
  dots.forEach(dot => {
    dot.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
  });
  
  if (dots.length > 0) {
    container.addEventListener('scroll', updateDots);
    updateDots(); // Actualizar estado inicial
  }
}

// ===================================
// 8. NAVEGACIÓN ACTIVA
// ===================================
function initActiveNavigation() {
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  const sections = Array.from(document.querySelectorAll('section[id]'));
  
  if (sections.length === 0) return;
  
  let ticking = false;
  let lastActiveSection = sections[0].id; // Guardar la última sección activa
  
  // Función para limpiar todas las clases activas
  function clearAllActive() {
    navLinks.forEach(link => {
      const isMobile = link.classList.contains('flex-shrink-0');
      
      if (isMobile) {
        // Mobile: remover naranja y fondo
        link.classList.remove('text-orange-500', 'bg-orange-50');
        link.classList.add('text-gray-600');
      } else {
        // Desktop: remover naranja
        link.classList.remove('text-orange-500');
        link.classList.add('text-gray-700');
      }
    });
  }
  
  // Función para activar un enlace específico por ID
  function activateNavLink(sectionId) {
    clearAllActive();
    
    console.log('Activating section:', sectionId); // DEBUG
    
    navLinks.forEach(link => {
      if (link.getAttribute('href') === `#${sectionId}`) {
        const isMobile = link.classList.contains('flex-shrink-0');
        
        if (isMobile) {
          // Mobile: añadir naranja y fondo
          link.classList.remove('text-gray-600');
          link.classList.add('text-orange-500', 'bg-orange-50');
          
          console.log('Mobile link activated:', link.textContent.trim(), 'Classes:', link.className); // DEBUG
          
          // Centrar el enlace en la navegación móvil
          requestAnimationFrame(() => {
            const nav = link.closest('nav');
            if (nav && window.innerWidth < 1024) {
              const linkLeft = link.offsetLeft;
              const linkWidth = link.offsetWidth;
              const navWidth = nav.offsetWidth;
              const scrollTo = linkLeft - (navWidth / 2) + (linkWidth / 2);
              
              nav.scrollTo({
                left: scrollTo,
                behavior: 'smooth'
              });
            }
          });
        } else {
          // Desktop: añadir naranja
          link.classList.remove('text-gray-700');
          link.classList.add('text-orange-500');
        }
      }
    });
  }
  
  // Función principal que detecta qué sección está visible
  function updateActiveSection() {
    const scrollPosition = window.scrollY + window.innerHeight / 3;
    
    // Buscar la sección activa actual
    let currentSection = null;
    
    for (const section of sections) {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentSection = section.id;
        break;
      }
    }
    
    // Si encontramos una sección válida, actualizarla
    // Si no (ej: estamos en una sección sin id como calendario), mantener la última activa
    if (currentSection) {
      lastActiveSection = currentSection;
      activateNavLink(currentSection);
    }
    // Si no hay sección válida, mantener la última activa (no hacer nada)
    
    ticking = false;
  }
  
  // Event listener para scroll con requestAnimationFrame
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateActiveSection);
      ticking = true;
    }
  }
  
  // Listener para clicks en los enlaces
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').substring(1);
      
      // Activar visualmente de inmediato
      activateNavLink(targetId);
      
      // Después del scroll suave, actualizar basado en posición real
      setTimeout(() => {
        updateActiveSection();
      }, 800);
    });
  });
  
  // Añadir listener de scroll
  window.addEventListener('scroll', onScroll, { passive: true });
  
  // Activar sección inicial
  updateActiveSection();
}

// ===================================
// CALENDARIO DE EVENTOS
// ===================================
function initCalendar() {
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let eventsData = [];

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // ========================================
  // DÍAS FESTIVOS - CONFIGURACIÓN
  // ========================================
  // Para añadir o modificar días festivos:
  // 1. Añade la fecha en formato 'YYYY-MM-DD'
  // 2. Los días festivos se mostrarán en ROJO en el calendario
  // 3. Tooltip indicará "Festivo - Horario especial"
  // ========================================
  const holidays = [
    // 2025
    '2025-01-01', // Año Nuevo
    '2025-01-06', // Reyes
    '2025-04-18', // Viernes Santo
    '2025-05-01', // Día del Trabajador
    '2025-08-15', // Asunción
    '2025-10-12', // Día de la Hispanidad
    '2025-11-01', // Todos los Santos
    '2025-12-06', // Día de la Constitución
    '2025-12-08', // Inmaculada Concepción
    '2025-12-25', // Navidad
    
    // 2026 - Añade aquí los festivos del próximo año
    // '2026-01-01', // Año Nuevo
    // '2026-01-06', // Reyes
    // ... etc
  ];

  // Función para verificar si una fecha es festivo
  function isHoliday(year, month, day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.includes(dateStr);
  }

  // Cargar eventos del mes
  async function loadEvents(month, year) {
    try {
      const response = await fetch(`${API_URL}/events/public?month=${month + 1}&year=${year}`);
      const data = await response.json();
      
      if (data.success) {
        eventsData = data.data;
        renderCalendar();
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      renderCalendar();
    }
  }

  // Renderizar calendario
  function renderCalendar() {
    const monthElement = document.getElementById('currentMonth');
    const daysElement = document.getElementById('calendarDays');
    
    if (!monthElement || !daysElement) return;

    // Actualizar título del mes
    monthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Obtener primer día del mes y total de días
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Ajustar para que lunes sea 0
    const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    // Limpiar contenedor
    daysElement.innerHTML = '';

    // Agregar días vacíos antes del primer día
    for (let i = 0; i < adjustedStartDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'aspect-square';
      daysElement.appendChild(emptyDay);
    }

    // Agregar días del mes
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a inicio del día
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentYear, currentMonth, day);
      dayDate.setHours(0, 0, 0, 0); // Normalizar a inicio del día
      const dayOfWeek = dayDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = isCurrentMonth && day === today.getDate();
      const isPastDay = dayDate < today; // Día pasado

      // Buscar eventos para este día - SOLO si es hoy o futuro
      let dayEvents = [];
      if (!isPastDay) {
        dayEvents = eventsData.filter(event => {
          const eventDate = new Date(event.startDate);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate.getDate() === day &&
                 eventDate.getMonth() === currentMonth &&
                 eventDate.getFullYear() === currentYear &&
                 eventDate >= today; // Solo eventos de hoy en adelante
        });
      }

      const hasEvent = dayEvents.length > 0;
      const eventWithImage = dayEvents.find(e => e.image);
      const isFestive = isHoliday(currentYear, currentMonth, day);

      // Crear elemento del día
      const dayElement = document.createElement('div');
      dayElement.className = `aspect-square flex flex-col items-center justify-center text-sm lg:text-base cursor-pointer rounded-lg transition-all relative ${
        isToday ? 'bg-orange-500 text-white font-bold ring-2 ring-orange-600' :
        isFestive ? 'bg-red-400 text-white font-bold hover:bg-red-500 ring-2 ring-red-500' :
        hasEvent ? 'bg-orange-100 text-orange-600 font-semibold hover:bg-orange-200' :
        isPastDay ? 'text-gray-400 opacity-50 cursor-default' : // Días pasados más tenues
        isWeekend ? 'text-orange-600 font-semibold hover:bg-orange-50' :
        'text-gray-700 hover:bg-gray-100'
      }`;

      // Si hay evento con imagen, mostrarla arriba del número
      if (eventWithImage && eventWithImage.image) {
        const eventImage = document.createElement('img');
        eventImage.src = `${SERVER_URL}${eventWithImage.image}`;
        eventImage.alt = eventWithImage.title;
        eventImage.className = 'w-6 h-6 lg:w-8 lg:h-8 rounded-full object-cover mb-1';
        eventImage.onerror = function() {
          this.style.display = 'none';
        };
        dayElement.appendChild(eventImage);
      }

      // Número del día
      const dayNumber = document.createElement('span');
      dayNumber.textContent = day;
      dayNumber.className = 'font-bold';
      dayElement.appendChild(dayNumber);

      // Horario según el tipo de día
      const dayOfWeekNum = dayDate.getDay();
      // 0=domingo, 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado
      const isWeekendDay = dayOfWeekNum === 0 || dayOfWeekNum === 6; // domingo o sábado
      const isFridayOrAfter = dayOfWeekNum >= 5; // viernes (5) o sábado (6) o domingo (0)
      const schedule = document.createElement('span');
      schedule.className = 'text-xs mt-1 opacity-75 font-medium';
      
      if (isFestive) {
        schedule.textContent = '10:00-22:00';
      } else if (isFridayOrAfter && dayOfWeekNum !== 0) {
        // Viernes y sábado: 10:00-22:00
        schedule.textContent = '10:00-22:00';
      } else if (dayOfWeekNum === 0) {
        // Domingo: 10:00-22:00
        schedule.textContent = '10:00-22:00';
      } else {
        // Lunes a jueves: 17:00-22:00
        schedule.textContent = '17:00-22:00';
      }
      dayElement.appendChild(schedule);

      // Indicador de evento (punto)
      if (hasEvent && !isToday) {
        const indicator = document.createElement('span');
        indicator.className = 'absolute bottom-1 w-1 h-1 bg-orange-500 rounded-full';
        dayElement.appendChild(indicator);
      }

      // Tooltip con información del evento
      if (hasEvent || isFestive) {
        const tooltipParts = [];
        if (isFestive) tooltipParts.push('🎉 Festivo - Horario especial');
        if (hasEvent) tooltipParts.push(...dayEvents.map(e => e.title));
        dayElement.title = tooltipParts.join('\n');
      }

      daysElement.appendChild(dayElement);
    }
  }

  // Botones de navegación
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      loadEvents(currentMonth, currentYear);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      loadEvents(currentMonth, currentYear);
    });
  }

  // Cargar eventos iniciales
  loadEvents(currentMonth, currentYear);
}

// ===================================
// INICIALIZACIÓN PRINCIPAL
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('Partyventura website loaded');
  
  // Inicializar todos los módulos
  initCarousel();
  initMobileMenu();
  initContactForm();
  initGallery();
  initScrollAnimations();
  initNewsletter();
  loadNews();
  initPricingDrag();
  initActiveNavigation();
  initCalendar();
  
  console.log('All modules initialized successfully');
});
