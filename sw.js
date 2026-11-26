// TermApp – service worker: avvio rapido e funzionamento offline dell'interfaccia.
// I dati del termostato arrivano sempre dallo script (mai dalla cache).
const CACHE = 'termapp-2.7';
const FILE = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                               // le chiamate allo script (POST) passano dirette
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                     // font e altri siti: rete normale
  // pagina: prima la rete (così gli aggiornamenti arrivano subito), poi la cache se offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      const copia = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copia)); return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // icone e manifest: cache, poi rete
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
