const CACHE_NAME = 'neet-prep-v2';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => 
      Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  // Ignore chrome extensions
  if (!event.request.url.startsWith('http')) return;
  
  // Do NOT cache API endpoints or external services that handle their own offline modes/needs
  const url = new URL(event.request.url);
  if (
    url.hostname.includes('firestore.googleapis.com') || 
    url.hostname.includes('firebase') || 
    url.hostname.includes('generativelanguage.googleapis.com') ||
    url.pathname.startsWith('/api/') || 
    url.hostname.includes('googleapis.com')
  ) {
    return; // Let browser standard fetch handle these
  }

  // Stale-While-Revalidate caching strategy for everything else (UI assets, scripts, CSS, basic images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('Network request failed, serving from cache.', err);
        // Special case: if navigation fails and not in cache, fallback to root or offline
        if (event.request.mode === 'navigate' && !cachedResponse) {
          return caches.match('/');
        }
        return null; // The cachedResponse will be returned at the end if it exists.
      });

      // Provide cached immediately if available, but fetchPromise will still update cache
      return cachedResponse || fetchPromise;
    })
  );
});
