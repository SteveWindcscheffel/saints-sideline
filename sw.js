// Saints Sideline offline support: keeps the app and fonts on the phone so it opens with no gym wifi.
const CACHE = 'saints-sideline-v6';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-64.png'];

self.addEventListener('install', (e) => {
  // cache: 'reload' skips the browser's own cache, so a new version is really fetched fresh.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // The app page itself: get the newest copy when there's a connection, use the saved one when there isn't.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  // Icons and fonts: serve the saved copy straight away and refresh it in the background.
  const cacheable = url.origin === location.origin || url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (!cacheable) return;
  e.respondWith(caches.open(CACHE).then((cache) => cache.match(req, { ignoreSearch: url.origin === location.origin }).then((hit) => {
    const fresh = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || fresh;
  })));
});
