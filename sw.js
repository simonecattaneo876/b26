/* BASILICATA 2026 — service worker
   Serve a due cose: far partire l'app anche senza rete e farla installare
   sul telefono con la sua icona. Alzare CACHE a ogni nuova versione. */
var CACHE = "basilicata-2026-v17";   /* alzare a ogni nuova versione dell'app */
var FILES = ["./", "./index.html", "./manifest.webmanifest",
             "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./logo.png", "./qr.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);

  /* Fuori dal sito non si tocca nulla: sincronizzazione col foglio Google e
     previsioni meteo devono sempre passare dalla rete, mai da una copia vecchia. */
  if (url.origin !== self.location.origin) return;

  /* Rete per prima, copia locale come riserva: così un aggiornamento arriva
     appena c'è campo, ma senza campo l'app si apre lo stesso. */
  e.respondWith(
    fetch(e.request).then(function (r) {
      var copia = r.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
      return r;
    }).catch(function () {
      return caches.match(e.request).then(function (m) { return m || caches.match("./index.html"); });
    })
  );
});
