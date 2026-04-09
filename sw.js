const CACHE_NAME = 'millisecond-v1';
const PRECACHE_URLS = [
  '/millisecond-challenge/',
  '/millisecond-challenge/index.html',
  '/millisecond-challenge/manifest.json',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Noto+Sans+TC:wght@400;700;900&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin analytics/ad requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.hostname.includes('google') || url.hostname.includes('firebase') || url.hostname.includes('adsbygoogle')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Return cache, but also update in background
        event.waitUntil(
          fetch(event.request).then(response => {
            if (response.ok) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
            }
          }).catch(() => {})
        );
        return cached;
      }
      return fetch(event.request).then(response => {
        if (response.ok && (url.origin === location.origin || url.hostname.includes('fonts'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
