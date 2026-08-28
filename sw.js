// Üretim Takip — Service Worker
// Amaç: internet kesildiğinde uygulamanın (arayüzün) en azından açılabilmesini sağlamak.
// ÖNEMLİ: Firebase veritabanı istekleri asla önbelleğe alınmaz — çevrimdışıyken
// veri okuma/yazma denemesi normal şekilde başarısız olur ve uygulama bunu
// kullanıcıya açıkça bildirir. Sessizce eski/yanlış veri gösterilmez.

const CACHE_NAME = 'uretim-takip-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Sadece GET isteklerine dokun; Firebase'e yazma (PUT/DELETE) asla önbelleğe girmez.
  if (req.method !== 'GET') return;

  const url = req.url;
  // Veritabanı / kimlik doğrulama trafiği her zaman doğrudan ağa gider, hiç önbelleklenmez.
  if (url.includes('firebaseio.com') || url.includes('googleapis.com') || url.includes('google.com')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./'))
      )
  );
});
