// Pass-through service worker with NO caching
// Meets Chrome PWA installability & beforeinstallprompt criteria without caching stale builds
const SW_VERSION = 'v2-no-cache-passthrough';

self.addEventListener('install', (event) => {
  // Immediately activate new service worker for existing visitors
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Purge any old caches that might linger from earlier visits, then claim all clients immediately
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // NEVER intercept video files, media, or byte-range streaming requests
  // Always let the browser native network stack handle range requests and media buffering
  if (
    url.pathname.startsWith('/videos/') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.webm') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.ogg') ||
    url.pathname.endsWith('.wav') ||
    event.request.headers.has('range')
  ) {
    return; // Pass directly to native browser networking pipeline
  }

  // Pure pass-through for other assets: never cache, always fetch live from network
  event.respondWith(fetch(event.request));
});
