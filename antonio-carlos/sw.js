/* Catálogo do Antônio Carlos: guarda a página e as fotos já vistas para abrir mais rápido */
const CACHE="ac-v1";
const ARQUIVOS=["./","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARQUIVOS)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  /* página: sempre a versão nova; sem internet, a guardada */
  if(req.mode==="navigate"){e.respondWith(fetch(req).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put("./",c));return r;}).catch(()=>caches.match("./")));return;}
  /* fotos: guarda depois de baixar uma vez */
  if(url.pathname.includes("/img/")){e.respondWith(caches.match(req).then(r=>r||fetch(req).then(n=>{if(n.ok){const c=n.clone();caches.open(CACHE).then(x=>x.put(req,c));}return n;})));return;}
  e.respondWith(fetch(req).catch(()=>caches.match(req)));
});
