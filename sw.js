/* ===== Service Worker — Cache-first strategy ===== */
const CACHE = 'birthday-app-v7';
const BDAY_STORE = 'birthday-notify-data'; // separate cache, survives CACHE bumps

/* Use relative paths so SW works under any subdirectory (e.g. GitHub Pages) */
const BASE = self.registration.scope;
const ASSETS = [
  BASE,
  BASE + 'index.html',
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
      Promise.all(
        keys.filter(k => k !== CACHE && k !== BDAY_STORE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  /* Don't cache versioned manifest — always fetch fresh */
  if (e.request.url.includes('manifest.json')) return;
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

/* ===== Birthday notification via Periodic Background Sync ===== */

async function checkBirthdayAndNotify() {
  const cache = await caches.open(BDAY_STORE);
  const resp = await cache.match('guest-birthday');
  if (!resp) return;

  let data;
  try { data = await resp.json(); } catch { return; }

  const now = new Date();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();

  if (todayM === data.month && todayD === data.day) {
    /* Avoid spamming: check if we already notified today */
    const sentResp = await cache.match('notified-date');
    if (sentResp) {
      const sentDate = await sentResp.text();
      if (sentDate === `${todayM}-${todayD}`) return;
    }

    const name = data.name || '';
    await self.registration.showNotification('🎉 今天是特別的日子！', {
      body: `快打開 app，有驚喜等著你${name ? '，' + name : ''} 🎁`,
      icon: BASE + 'icons/icon-192.png',
      badge: BASE + 'icons/icon-192.png',
      tag: 'birthday-day',
      renotify: false,
      requireInteraction: true,
      data: { url: BASE },
    });

    /* Record that we've notified today */
    await cache.put('notified-date',
      new Response(`${todayM}-${todayD}`, { headers: { 'Content-Type': 'text/plain' } }));
  }
}

self.addEventListener('periodicsync', e => {
  if (e.tag === 'birthday-check') {
    e.waitUntil(checkBirthdayAndNotify());
  }
});

/* Open/focus the app when notification is tapped */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = (e.notification.data && e.notification.data.url) || BASE;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.startsWith(BASE) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});

/* Allow page to store birthday data for SW to read */
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'STORE_BIRTHDAY') {
    caches.open(BDAY_STORE).then(cache => {
      cache.put('guest-birthday', new Response(JSON.stringify(e.data.payload), {
        headers: { 'Content-Type': 'application/json' },
      }));
    });
  }
  if (e.data && e.data.type === 'CLEAR_BIRTHDAY') {
    caches.open(BDAY_STORE).then(cache => {
      cache.delete('guest-birthday');
      cache.delete('notified-date');
    });
  }
});
