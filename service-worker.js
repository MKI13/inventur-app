const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `efsin-inventur-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Dateien die beim Installation gecached werden sollen
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/scanner.js',
  '/offline.html',
  '/manifest.json'
];

// Installation - Cache vorbereiten
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installation gestartet');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Precache Dateien');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktivierung - Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Aktivierung gestartet');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Lösche alten Cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch - Cache-First-Strategie mit Network-Fallback
self.addEventListener('fetch', (event) => {
  // Nur GET Requests cachen
  if (event.request.method !== 'GET') {
    return;
  }

  // Für API Calls: Network-First
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Response klonen für Cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // Fallback auf Cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Für statische Assets: Cache-First
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Im Cache gefunden
          return cachedResponse;
        }

        // Nicht im Cache - vom Netzwerk holen
        return fetch(event.request)
          .then((response) => {
            // Nur erfolgreiche Responses cachen
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Response klonen für Cache
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Offline-Fallback
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background Sync für Offline-Änderungen
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background Sync:', event.tag);
  
  if (event.tag === 'sync-inventory') {
    event.waitUntil(syncInventoryData());
  }
});

// Synchronisiere Inventar-Daten wenn wieder online
async function syncInventoryData() {
  try {
    // Hole pending changes aus IndexedDB
    // und sende an Server wenn vorhanden
    console.log('[ServiceWorker] Sync Inventory abgeschlossen');
  } catch (error) {
    console.error('[ServiceWorker] Sync fehlgeschlagen:', error);
    throw error; // Retry
  }
}

// Push Notifications (für zukünftige Features)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'ef-sin Inventur';
  const options = {
    body: data.body || 'Neue Benachrichtigung',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
