// WhiteCall Service Worker
// Version: 1.0.0
//
// INTENTIONALLY MINIMAL - This service worker exists primarily to:
// 1. Enable PWA installation (Add to Home Screen)
// 2. Make the app launch in standalone mode
// 3. Prepare for future push notifications
//
// It does NOT aggressively cache data to avoid stale data issues.
// For an early-stage product, fresh data > offline capability.

const CACHE_NAME = 'whitecall-shell-v1';

// Only cache the absolute minimum needed for app shell
// DO NOT add API routes or dynamic data here
const SHELL_FILES = [
  '/',
  '/index.html'
];

// Install: cache only the app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(SHELL_FILES);
      })
      .then(() => {
        // Skip waiting to activate immediately
        // This ensures updates take effect faster
        return self.skipWaiting();
      })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch: Network-first strategy for everything
// Only fall back to cache if network fails (rare)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (mutations should never be cached)
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Supabase API calls entirely - never cache these
  if (url.hostname.includes('supabase')) {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Network-first strategy: try network, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache non-ok responses
        if (!response.ok) {
          return response;
        }

        // Clone response before caching (response can only be consumed once)
        const responseToCache = response.clone();

        // Only cache same-origin resources (not external CDNs, etc.)
        if (url.origin === self.location.origin) {
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // If it's a navigation request, return the cached index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }

            // Nothing in cache, return a simple offline response
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Push notification handler (stub for future use)
// iOS 16.4+ requires the app to be installed to receive push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  // TODO: Implement push notification display
  // const data = event.data?.json() ?? {};
  // self.registration.showNotification(data.title, { ... });
});

// Notification click handler (stub for future use)
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  // Open the app when notification is clicked
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clients) => {
        // Focus existing window if open
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        return self.clients.openWindow('/');
      })
  );
});
