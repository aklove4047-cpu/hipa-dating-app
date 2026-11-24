const CACHE_NAME = 'hipa-dating-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/glass.css',
  '/css/app.css',
  '/js/app.js',
  '/js/api.js',
  '/js/call-manager.js',
  '/js/i18n.js',
  '/i18n/en.json',
  '/i18n/hi.json',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass API requests through network
  if (event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => caches.match('/index.html'));
    })
  );
});
