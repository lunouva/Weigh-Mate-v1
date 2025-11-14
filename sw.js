
// WeightMate v3.1 SW — simple online-first with fallback cache
const CACHE = 'weightmate-v3.1-' + (self.registration ? self.registration.scope : 'scope');
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (e)=>{
  const req = e.request;
  e.respondWith(fetch(req).then(res=>{
    const copy = res.clone();
    caches.open(CACHE).then(c=>c.put(req, copy));
    return res;
  }).catch(()=>caches.match(req)));
});
