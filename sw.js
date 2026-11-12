// Saints Sideline offline support: keeps the app and fonts on the phone so it opens with no gym wifi.
const CACHE = 'saints-sideline-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-64.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Serve from the phone first, then refresh the copy in the background when there is a connection.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const cacheable = url.origin === location.origin || url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (!cacheable) return;
  e.respondWith(caches.open(CACHE).then((cache) => cache.match(req, { ignoreSearch: url.origin === location.origin }).then((hit) => {
    const fresh = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || fresh;
  })));
});
