/* Agente da Discórdia: guarda a página para abrir mesmo sem internet */
const CACHE="discordia-v2";
const ARQUIVOS=["./","venda","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png","grafite.css","mascote.webp","mascote-cabeca.webp"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARQUIVOS)).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  /* páginas: tenta a versão nova primeiro; sem internet, usa a guardada */
  if(req.mode==="navigate"){ e.respondWith(fetch(req).then(r=>{ const c=r.clone(); caches.open(CACHE).then(x=>x.put(req,c)); return r; }).catch(()=>caches.match(req).then(r=>r||caches.match("./")))); return; }
  e.respondWith(caches.match(req).then(r=>r||fetch(req)));
});
