/* iPagato — service worker
 * Sito statico e dati nel localStorage: basta mettere in cache le pagine e gli
 * asset per usarlo anche senza rete (al bar non sempre prende).
 * - asset statici: cache-first
 * - pagine: network-first con copia in cache
 */
const VERSION = "v2";
const STATIC = `static-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const SHELL = ["/", "/storico/", "/saldi/", "/impostazioni/", "/setup/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" }))))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC, PAGES].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (request.mode === "navigate" || url.pathname.endsWith(".txt")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(request, { ignoreSearch: true })) || (await caches.match("/"))),
    );
  }
});
