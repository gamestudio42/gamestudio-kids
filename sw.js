// Service worker: guarda o app no aparelho para ele abrir e funcionar sem internet.
// Com internet, busca sempre a versão nova primeiro; sem internet, usa a cópia guardada.
const VERSION = 'gsk-v4';
const FONTS = 'gsk-fonts';
const FILES = [
  './',
  'index.html',
  'css/style.css',
  'js/data.js',
  'js/pixel-editor.js',
  'js/level-editor.js',
  'js/game.js',
  'js/tour.js',
  'js/app.js',
  'js/pwa.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png',
  'icons/icon-apple.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('gsk-') && k !== VERSION && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))),
    );
  } else if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    // fontes: usa a guardada; se não tiver, baixa e guarda
    e.respondWith(caches.open(FONTS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }))));
  }
});
