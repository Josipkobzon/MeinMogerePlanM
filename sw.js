/* Service Worker — Mein Plan MoGeRe Gold Mobil
   Cache-first: nach der Installation funktioniert die App komplett offline.
   Bei einer neuen Version: CACHE_VERSION erhöhen. */
const CACHE_VERSION = "meinplan-mobil-v5";
const ASSETS = [
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) {
        // Im Hintergrund aktualisieren (stale-while-revalidate)
        event.waitUntil(
          fetch(event.request).then((resp) => {
            if (resp && resp.ok) {
              return caches.open(CACHE_VERSION).then((c) => c.put(event.request, resp.clone()));
            }
          }).catch(() => {})
        );
        return cached;
      }
      return fetch(event.request).then((resp) => {
        if (resp && resp.ok && new URL(event.request.url).origin === location.origin) {
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(event.request, copy));
        }
        return resp;
      });
    })
  );
});
