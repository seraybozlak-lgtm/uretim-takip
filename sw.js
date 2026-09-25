const CACHE_VERSION = 'uretim-takip-2026-09-25-5';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async () => {
      try { return await fetch(req, { cache: 'no-store' }); }
      catch (err) { const cached = await caches.match(req); if (cached) return cached; throw err; }
    })());
    return;
  }
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok && new URL(req.url).origin === self.location.origin) {
        const cache = await caches.open(CACHE_VERSION);
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      throw err;
    }
  })());
});
