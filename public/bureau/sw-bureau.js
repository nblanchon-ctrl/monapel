/* PWA Bureau : mise en cache limitée aux icônes et au manifeste. Jamais de données privées. */
const CACHE='monapel-bureau-static-v1';
const ASSETS=['/bureau/icon-192.png','/bureau/icon-512.png','/bureau/manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(ASSETS.map(url=>cache.add(url)))));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('monapel-bureau-static-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin||!ASSETS.includes(url.pathname))return;event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));});
