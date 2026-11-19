const CACHE = "nwgeo-muestreo-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./assets/nivel04_manifest.json",
  "./assets/NIVEL04_FULL.png",
  "./assets/NIVEL04_A1.png",
  "./assets/NIVEL04_A2.png",
  "./assets/NIVEL04_A3.png",
  "./assets/NIVEL04_B1.png",
  "./assets/NIVEL04_B2.png",
  "./assets/NIVEL04_B3.png",
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (ev) => {
  ev.respondWith(
    caches.match(ev.request).then((cached) => cached || fetch(ev.request).catch(() => cached))
  );
});
