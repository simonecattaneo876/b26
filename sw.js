/* BASILICATA 2026 (ForeverDie) — service worker
   Fa due cose: l'app parte anche senza rete, e le versioni nuove arrivano
   senza che nessuno debba reinstallare niente.

   ATTENZIONE: alzare CACHE a ogni pacchetto nuovo, altrimenti i telefoni
   restano sulla copia in memoria. Il messaggio "attiva" deve avere lo stesso
   nome anche dentro index.html: se i due nomi divergono, il pulsante
   "Aggiorna" smette silenziosamente di funzionare. */
var CACHE = "basilicata-2026-v27";
var FILES = ["./", "./index.html", "./manifest.webmanifest",
             "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png",
             "./apple-touch-icon.png", "./logo.png", "./qr.png"];

self.addEventListener("install", function (e) {
  /* Niente skipWaiting qui: la versione nuova resta in attesa e la pagina
     avvisa l'utente. Subentrare di nascosto lascerebbe l'app a metà fra due
     versioni finché non viene ricaricata. */
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(FILES); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Il via lo dà la pagina quando l'utente tocca "Aggiorna". */
self.addEventListener("message", function (e) {
  if (e.data && e.data.tipo === "attiva") self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);

  /* Fuori dal sito non si tocca nulla: sincronizzazione col foglio Google e
     previsioni meteo devono sempre passare dalla rete, mai da una copia vecchia. */
  if (url.origin !== self.location.origin) return;

  /* Rete per prima, copia locale come riserva: un aggiornamento arriva appena
     c'è campo, ma senza campo l'app si apre lo stesso. */
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
