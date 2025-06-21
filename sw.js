// Service Worker para Headers de Seguridad
// Versión del cache para forzar actualizaciones
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `obsidian-digital-${CACHE_VERSION}`;

// Headers de seguridad
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

// Lista de archivos a cachear
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Instalación completada');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error durante la instalación:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activación completada');
      return self.clients.claim();
    })
  );
});

// Interceptar requests y agregar headers de seguridad
self.addEventListener('fetch', (event) => {
  // Solo procesar requests del mismo origen
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en cache, devolverlo con headers de seguridad
        if (response) {
          return addSecurityHeaders(response);
        }

        // Si no está en cache, hacer fetch y agregar headers
        return fetch(event.request)
          .then((response) => {
            // Verificar si es una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta para el cache
            const responseToCache = response.clone();
            
            // Agregar al cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            // Devolver respuesta con headers de seguridad
            return addSecurityHeaders(response);
          })
          .catch((error) => {
            console.error('Service Worker: Error en fetch:', error);
            
            // Devolver página offline si está disponible
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
            
            throw error;
          });
      })
  );
});

// Función para agregar headers de seguridad
function addSecurityHeaders(response) {
  const newHeaders = new Headers(response.headers);
  
  // Agregar headers de seguridad
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  // Crear nueva respuesta con headers de seguridad
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

// Manejo de errores globales
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error global:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Promise rechazado:', event.reason);
});

// Manejo de mensajes desde el cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_VERSION
    });
  }
});

console.log('Service Worker: Archivo cargado correctamente');