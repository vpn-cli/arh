// Pass-through service worker with NO caching
// Meets Chrome PWA installability & beforeinstallprompt criteria without caching stale builds

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Never intercept video files, media, or byte-range streaming requests
  if (
    url.includes('/videos/') ||
    url.endsWith('.mp4') ||
    url.endsWith('.webm') ||
    event.request.headers.has('range')
  ) {
    return; // Pass directly to native browser networking pipeline
  }
  // Pure pass-through: never cache, always fetch live from network
  event.respondWith(fetch(event.request));
});

