/* Service Worker für Etikett.
   Aufgabe: die App-Hülle (HTML, Icon, Manifest) offline verfügbar halten.
   Produktdaten und Fotos werden bewusst NICHT gecacht — die sollen immer
   frisch von Open Food Facts kommen.

   Nach jeder Änderung an index.html die Versionsnummer hochzählen,
   sonst behalten Besucher die alte Fassung. */

const VERSION = "etikett-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Alles Fremde (API, Produktbilder, Schriften, Scanner-Bibliothek)
  // geht direkt ins Netz, ohne Cache.
  if (url.origin !== location.origin) return;

  // Eigene Dateien: erst Netz, bei Ausfall aus dem Cache.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
