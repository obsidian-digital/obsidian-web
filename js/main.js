// Main JavaScript para Obsidian Digital
// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Obsidian Digital - Sitio web cargado');
    
    // Inicializar todas las funcionalidades
    initSmoothScrolling();
    initFormHandling();
    initAnimationsOnScroll();
    initMobileMenu();
    initLazyLoading();
    initContactForm();
    initPerformanceOptimizations();
});

// ========== SMOOTH SCROLLING ==========
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Actualizar URL sin salto
                history.pushState(null, null, this.getAttribute('href'));
            }
        });
    });
}

// ========== MANEJO DE FORMULARIOS ==========
function initFormHandling() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        // Validación en tiempo real
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
        
        // Manejo de envío
        form.addEventListener('submit', handleFormSubmit);
    });
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    const fieldType = field.type;
    const fieldName = field.name;
    
    let isValid = true;
    let errorMessage = '';
    
    // Validaciones según tipo de campo
    switch(fieldType) {
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Por favor ingresa un email válido';
            }
            break;
            
        case 'tel':
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Por favor ingresa un teléfono válido';
            }
            break;
            
        default:
            if (field.hasAttribute('required') && !value) {
                isValid = false;
                errorMessage = 'Este campo es obligatorio';
            }
    }
    
    // Mostrar/ocultar error
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError({ target: field });
    }
    
    return isValid;
}

function showFieldError(field, message) {
    // Remover error previo
    clearFieldError({ target: field });
    
    // Crear elemento de error
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        color: #e74c3c;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: block;
    `;
    
    // Agregar estilo de error al campo
    field.style.borderColor = '#e74c3c';
    field.classList.add('error');
    
    // Insertar mensaje de error
    field.parentNode.insertBefore(errorElement, field.nextSibling);
}

function clearFieldError(event) {
    const field = event.target;
    const errorElement = field.parentNode.querySelector('.field-error');
    
    if (errorElement) {
        errorElement.remove();
    }
    
    // Remover estilo de error
    field.style.borderColor = '';
    field.classList.remove('error');
}

function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    
    // Validar todos los campos
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let allValid = true;
    
    inputs.forEach(input => {
        if (!validateField({ target: input })) {
            allValid = false;
        }
    });
    
    if (!allValid) {
        showNotification('Por favor corrige los errores en el formulario', 'error');
        return;
    }
    
    // Verificar protección anti-spam si está disponible
    if (window.securityManager && !window.securityManager.rateLimiter.isAllowed('form_submission')) {
        showNotification('Demasiadas solicitudes. Espera un momento.', 'warning');
        return;
    }
    
    // Simular envío (aquí conectarías con tu backend/servicio)
    submitForm(form);
}

function submitForm(form) {
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Mostrar estado de carga
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    
    // Simular envío (reemplaza con tu lógica real)
    setTimeout(() => {
        // Aquí harías el fetch real a tu endpoint
        showNotification('¡Mensaje enviado correctamente! Te contactaremos pronto.', 'success');
        form.reset();
        
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }, 2000);
}

// ========== ANIMACIONES ON SCROLL ==========
function initAnimationsOnScroll() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observar elementos con clase animate
    document.querySelectorAll('.animate-on-scroll, .service-card, .portfolio-item, .feature-box').forEach(el => {
        observer.observe(el);
    });
}

// ========== MENÚ MÓVIL ==========
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle, .hamburger, [data-menu-toggle]');
    const mobileMenu = document.querySelector('.mobile-menu, .nav-menu, [data-mobile-menu]');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Cerrar menú al hacer click en enlaces
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
        
        // Cerrar menú al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }
}

// ========== LAZY LOADING DE IMÁGENES ==========
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback para navegadores sin IntersectionObserver
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            img.classList.add('loaded');
        });
    }
}

// ========== FORMULARIO DE CONTACTO ESPECÍFICO ==========
function initContactForm() {
    const contactForm = document.querySelector('#contact-form, .contact-form, form[data-contact]');
    
    if (contactForm) {
        // Agregar campos honeypot si no existen (protección anti-spam)
        if (!contactForm.querySelector('input[name="website_url"]')) {
            const honeypot = document.createElement('input');
            honeypot.type = 'text';
            honeypot.name = 'website_url';
            honeypot.style.cssText = 'position:absolute;left:-9999px;opacity:0;pointer-events:none;';
            honeypot.tabIndex = -1;
            contactForm.appendChild(honeypot);
        }
        
        // Validación específica del formulario de contacto
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = this.querySelector('[name="name"]')?.value;
            const email = this.querySelector('[name="email"]')?.value;
            const message = this.querySelector('[name="message"]')?.value;
            
            if (!name || !email || !message) {
                showNotification('Por favor completa todos los campos', 'error');
                return;
            }
            
            // Aquí integrarías con EmailJS, Formspree, o tu backend
            handleContactSubmission({
                name: name,
                email: email,
                message: message
            });
        });
    }
}

function handleContactSubmission(data) {
    // Ejemplo de integración con EmailJS (opcional)
    /*
    emailjs.send('tu_service_id', 'tu_template_id', data)
        .then(() => {
            showNotification('¡Mensaje enviado! Te contactaremos pronto.', 'success');
        })
        .catch(() => {
            showNotification('Error al enviar. Intenta nuevamente.', 'error');
        });
    */
    
    // Por ahora, simulamos el envío exitoso
    showNotification('¡Mensaje enviado correctamente! Te contactaremos pronto.', 'success');
}

// ========== OPTIMIZACIONES DE RENDIMIENTO ==========
function initPerformanceOptimizations() {
    // Preload de recursos críticos
    preloadCriticalResources();
    
    // Defer de scripts no críticos
    deferNonCriticalScripts();
    
    // Optimización de imágenes
    optimizeImages();
}

function preloadCriticalResources() {
    // Precargar fuentes críticas
    const criticalFonts = [
        '/css/fonts/main.woff2',
        // Agrega tus fuentes críticas aquí
    ];
    
    criticalFonts.forEach(font => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        link.href = font;
        document.head.appendChild(link);
    });
}

function deferNonCriticalScripts() {
    // Scripts que se pueden cargar después
    const nonCriticalScripts = [
        // 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID',
        // Agrega tus scripts no críticos aquí
    ];
    
    nonCriticalScripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        document.body.appendChild(script);
    });
}

function optimizeImages() {
    // Agregar loading="lazy" a imágenes que no lo tengan
    document.querySelectorAll('img:not([loading])').forEach(img => {
        if (!isInViewport(img)) {
            img.loading = 'lazy';
        }
    });
}

// ========== UTILIDADES ==========
function showNotification(message, type = 'info') {
    // Si existe el SecurityManager, usar su sistema de notificaciones
    if (window.securityManager) {
        window.securityManager.showMessage(message, type);
        return;
    }
    
    // Fallback: sistema básico de notificaciones
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// ========== EVENTOS GLOBALES ==========
// Optimizar scroll con throttle
window.addEventListener('scroll', throttle(() => {
    // Aquí puedes agregar efectos de scroll personalizados
    updateScrollProgress();
}, 16)); // ~60fps

function updateScrollProgress() {
    const scrollProgress = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    document.documentElement.style.setProperty('--scroll-progress', `${scrollProgress}%`);
}

// Event listener para cambios de tamaño de ventana
window.addEventListener('resize', debounce(() => {
    // Reajustar elementos si es necesario
    console.log('Ventana redimensionada');
}, 250));

// Log cuando el sitio está completamente cargado
window.addEventListener('load', () => {
    console.log('✅ Sitio web completamente cargado');
    
    // Métricas de performance básicas
    if ('performance' in window) {
        const perfData = performance.timing;
        const loadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`⚡ Tiempo de carga: ${loadTime}ms`);
    }
});

// Export funciones para uso global
window.ObsidianDigital = {
    showNotification,
    validateField,
    debounce,
    throttle
};

console.log('📋 main.js cargado correctamente');