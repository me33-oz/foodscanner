/* Service Worker für Etikett.
   Aufgabe: die App-Hülle (HTML, Schriften, Icons, Manifest) offline verfügbar
   halten. Produktdaten und Fotos werden bewusst NICHT gecacht — die sollen
   immer frisch von Open Food Facts kommen.

   Nach jeder Änderung an index.html die Versionsnummer hochzählen,
   sonst behalten Besucher die alte Fassung. */

const VERSION = "etikett-v5";

/* Ohne diese drei Dateien startet die App nicht. Fehlt hier etwas, soll die
   Installation scheitern und der alte Stand bestehen bleiben. */
const KERN = ["./", "./index.html", "./manifest.json"];

/* Alles Weitere ist Beiwerk: Schriften und Icons. Die werden einzeln geladen,
   damit eine einzelne fehlende Datei nicht den ganzen Offline-Vorrat
   verhindert — beim Hochladen über die GitHub-Oberfläche geht so etwas
   schnell einmal unter. */
const BEIWERK = [
  "./icon.svg",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable.png",
  "./fraunces.woff2",
  "./public-sans.woff2"
];

/* Dateien, die sich nie ändern, ohne dass die Versionsnummer steigt.
   Für die lohnt der Weg über den Cache zuerst — das spart bei jedem Start
   ein paar Anfragen und lässt die Schrift sofort stehen. */
const STATISCH = /\.(woff2|png|svg)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then(async (cache) => {
      await cache.addAll(KERN);
      await Promise.all(BEIWERK.map((url) => cache.add(url).catch(() => {})));
      await self.skipWaiting();
    })
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

  // Alles Fremde (API, Produktbilder, Scanner-Bibliothek) geht direkt
  // ins Netz, ohne Cache.
  if (url.origin !== location.origin) return;

  // Schriften und Icons: erst Cache, sonst Netz.
  if (STATISCH.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      }))
    );
    return;
  }

  // Eigene Seiten: erst Netz, bei Ausfall aus dem Cache.
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
