/* PWA publique APEL Oudon : aucun cache des API, sessions, pages privées. */
const CACHE = 'apel-oudon-public-v1';
const PUBLIC_ASSETS = ['/oudon/icon-192.png','/oudon/icon-512.png','/oudon/manifest.webmanifest','/oudon/logo-ecole.jpg','/oudon/vue-aerienne-oudon.jpg'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(async cache => { await Promise.allSettled(PUBLIC_ASSETS.map(path => cache.add(path))); })); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil((async()=>{ for(const key of await caches.keys()) if(key.startsWith('apel-oudon-public-') && key!==CACHE) await caches.delete(key); await self.clients.claim(); })()); });
self.addEventListener('fetch', event => {
 const req=event.request; if(req.method!=='GET') return;
 const url=new URL(req.url); if(url.origin!==self.location.origin) return;
 // Les pages HTML, requêtes Supabase, scripts et routes privées passent toujours par le réseau.
 if(req.mode==='navigate' || !PUBLIC_ASSETS.includes(url.pathname)) return;
 event.respondWith(caches.match(req).then(hit=>hit||fetch(req)));
});
