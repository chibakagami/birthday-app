/* ===== Service Worker — Cache-first strategy ===== */
const CACHE = 'birthday-app-v5';

/* Use relative paths so SW works under any subdirectory (e.g. GitHub Pages) */
const BASE = self.registration.scope;
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'css/base.css',
  BASE + 'css/home.css',
  BASE + 'css/countdown.css',
  BASE + 'css/celebrate.css',
  BASE + 'js/storage.js',
  BASE + 'js/confetti.js',
  BASE + 'js/fireworks.js',
  BASE + 'js/cake.js',
  BASE + 'js/countdown.js',
  BASE + 'js/app.js',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => caches.match(BASE + 'index.html'))
  );
});
