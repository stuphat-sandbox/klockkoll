// Service worker: gör att appen fungerar utan internet.
// Höj versionen när filer ändras så att telefonerna hämtar det nya.
const VERSION = 'klockkoll-v2';
const FILES = [
  './', 'index.html', 'style.css', 'manifest.json',
  'js/timeText.js', 'js/clock.js', 'js/storage.js', 'js/speech.js', 'js/levels.js', 'js/rewards.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Typsnitt: spara när de hämtats första gången.
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(caches.open(VERSION).then(c => c.match(e.request).then(hit =>
      hit || fetch(e.request).then(res => { c.put(e.request, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // Nätet först (så uppdateringar syns), cache om man är offline.
  e.respondWith(fetch(e.request)
    .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
