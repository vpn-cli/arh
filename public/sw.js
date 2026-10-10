// Pass-through service worker with NO caching
// Meets Chrome PWA installability & beforeinstallprompt criteria without caching stale builds

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pure pass-through: never cache, always fetch live from network
  event.respondWith(fetch(event.request));
});
