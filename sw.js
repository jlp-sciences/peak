/* Peak service worker — offline app shell. Bump VERSION on every release. */
const VERSION = 'peak-1.10.0';
const SHELL = ['./', 'index.html', 'css/app.css', 'js/data.js', 'js/guides.js', 'js/gear.js', 'js/library.js', 'js/app.js', 'js/screens.js', 'js/plans.js', 'js/planning.js', 'js/awards.js', 'js/climb.js', 'js/history.js', 'js/routines.js', 'js/motivation.js', 'js/sync.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  // {cache: 'reload'} so the new version never installs stale files from the HTTP cache
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'version' && e.ports && e.ports[0]) e.ports[0].postMessage(VERSION);
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // network first so updates arrive; cache as the offline fallback
  e.respondWith(fetch(e.request).then((res) => {
    const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
});
