// Sistema de protección contra DoS y Rate Limiting
class SecurityManager {
  constructor() {
    this.rateLimiter = new RateLimiter();
    this.suspiciousActivity = new SuspiciousActivityDetector();
    this.init();
  }

  init() {
    this.setupFormProtection();
    this.setupBotDetection();
    this.setupActivityMonitoring();
    console.log('SecurityManager: Sistema de seguridad inicializado');
  }

  setupFormProtection() {
    // Proteger todos los formularios
    document.addEventListener('submit', (event) => {
      if (!this.rateLimiter.isAllowed('form_submission')) {
        event.preventDefault();
        this.showRateLimitMessage();
        return false;
      }

      if (this.suspiciousActivity.isBot()) {
        event.preventDefault();
        this.showBotDetectionMessage();
        return false;
      }
    });
  }

  setupBotDetection() {
    // Detectar comportamiento de bots
    this.suspiciousActivity.startMonitoring();
  }

  setupActivityMonitoring() {
    // Monitorear actividad sospechosa
    let clickCount = 0;
    let lastClickTime = 0;

    document.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastClickTime < 100) { // Clicks muy rápidos
        clickCount++;
        if (clickCount > 10) {
          this.suspiciousActivity.flagAsBot();
        }
      } else {
        clickCount = 0;
      }
      lastClickTime = now;
    });
  }

  showRateLimitMessage() {
    this.showMessage('Demasiadas solicitudes. Por favor, espera un momento antes de intentar nuevamente.', 'warning');
  }

  showBotDetectionMessage() {
    this.showMessage('Actividad sospechosa detectada. Si eres humano, contacta al soporte.', 'error');
  }

  showMessage(text, type = 'info') {
    // Crear notification toast
    const notification = document.createElement('div');
    notification.className = `security-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${type === 'error' ? '⚠️' : type === 'warning' ? '⏳' : 'ℹ️'}</span>
        <span class="notification-text">${text}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Estilos inline para la notificación
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#fee' : type === 'warning' ? '#ffeaa7' : '#e3f2fd'};
      border: 1px solid ${type === 'error' ? '#fcc' : type === 'warning' ? '#f39c12' : '#2196f3'};
      border-radius: 8px;
      padding: 15px;
      max-width: 350px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Auto-remove después de 5 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }
}

// Rate Limiter Class
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.limits = {
      'form_submission': { max: 5, window: 60000 }, // 5 envíos por minuto
      'page_request': { max: 50, window: 60000 },   // 50 requests por minuto
      'api_call': { max: 10, window: 60000 }        // 10 API calls por minuto
    };
  }

  isAllowed(action) {
    const limit = this.limits[action];
    if (!limit) return true;

    const clientId = this.getClientId();
    const key = `${clientId}_${action}`;
    const now = Date.now();
    
    // Obtener requests previos
    const requests = this.requests.get(key) || [];
    
    // Filtrar requests dentro de la ventana de tiempo
    const validRequests = requests.filter(time => now - time < limit.window);
    
    // Verificar si excede el límite
    if (validRequests.length >= limit.max) {
      console.warn(`Rate limit exceeded for ${action}: ${validRequests.length}/${limit.max}`);
      return false;
    }
    
    // Agregar request actual
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  getClientId() {
    let clientId = localStorage.getItem('security_client_id');
    if (!clientId) {
      clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('security_client_id', clientId);
    }
    return clientId;
  }

  reset(action) {
    const clientId = this.getClientId();
    const key = `${clientId}_${action}`;
    this.requests.delete(key);
  }
}

// Detector de actividad sospechosa
class SuspiciousActivityDetector {
  constructor() {
    this.botFlags = 0;
    this.startTime = Date.now();
    this.interactions = [];
    this.isHuman = null;
  }

  startMonitoring() {
    // Detectar mouse movement humano
    let mouseMovements = 0;
    document.addEventListener('mousemove', () => {
      mouseMovements++;
      if (mouseMovements > 10) {
        this.isHuman = true;
      }
    });

    // Detectar keyboard input humano
    document.addEventListener('keydown', (e) => {
      if (!e.isTrusted) {
        this.flagAsBot();
      } else {
        this.isHuman = true;
      }
    });

    // Detectar timing humano en forms
    document.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        e.target.dataset.focusTime = Date.now();
      }
    });

    document.addEventListener('focusout', (e) => {
      if (e.target.dataset.focusTime) {
        const focusTime = parseInt(e.target.dataset.focusTime);
        const duration = Date.now() - focusTime;
        
        // Si llenó el campo muy rápido (menos de 100ms), es sospechoso
        if (duration < 100 && e.target.value.length > 5) {
          this.flagAsBot();
        }
      }
    });

    // Honeypot field detection
    this.setupHoneypot();
  }

  setupHoneypot() {
    // Crear campo honeypot invisible
    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'website_url';
    honeypot.style.cssText = 'position:absolute;left:-9999px;opacity:0;pointer-events:none;';
    honeypot.tabIndex = -1;
    honeypot.setAttribute('autocomplete', 'off');
    
    // Agregar a todos los formularios
    document.querySelectorAll('form').forEach(form => {
      form.appendChild(honeypot.cloneNode());
    });

    // Verificar honeypot en submit
    document.addEventListener('submit', (e) => {
      const honeypotField = e.target.querySelector('input[name="website_url"]');
      if (honeypotField && honeypotField.value) {
        e.preventDefault();
        this.flagAsBot();
        console.warn('Bot detectado: honeypot filled');
      }
    });
  }

  flagAsBot() {
    this.botFlags++;
    this.isHuman = false;
    console.warn('Actividad sospechosa detectada, flags:', this.botFlags);
  }

  isBot() {
    return this.botFlags > 2 || this.isHuman === false;
  }
}

// CSS para las notificaciones
const notificationStyles = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .security-notification .notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .security-notification .notification-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    margin-left: auto;
  }
`;

// Inyectar estilos
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Inicializar sistema de seguridad cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.securityManager = new SecurityManager();
});

// Export para uso en otros archivos
window.SecurityManager = SecurityManager;
