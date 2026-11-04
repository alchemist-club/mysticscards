// Cache only this app's shell; leave other pages on the origin untouched.
const CACHE = 'mystics-cards-shell-v110';
const SHELL = ['./index.html', './styles.css?v=79', './app.js?v=74', './favicon.ico', './favicon.svg', './apple-touch-icon.png', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('mystics-cards-shell-') && key !== CACHE)
    .map(key => caches.delete(key)))));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const assets = ['styles.css', 'app.js', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png'].map(path => new URL(path, self.registration.scope).href);
  if (assets.includes(new URL(event.request.url).origin + new URL(event.request.url).pathname)) {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request.url, response.clone())).catch(() => {});
      return response;
    }).catch(() => caches.match(event.request.url)));
    return;
  }
  if (event.request.mode !== 'navigate') return;
  const url = new URL(event.request.url);
  const app = new URL('./index.html', self.registration.scope);
  const root = new URL('./', self.registration.scope);
  if (url.origin !== app.origin || (url.pathname !== app.pathname && url.pathname !== root.pathname)) return;
  event.respondWith(fetch(event.request).then(async response => {
    if (response.ok) {
      try {
        const cache = await caches.open(CACHE);
        await cache.put(app.href, response.clone());
      } catch (_) { /* A storage failure must not block the online page. */ }
    }
    return response;
  }).catch(() => caches.match(app.href)));
});
