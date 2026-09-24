const C='turath-v4';
const STATIC=['./','./index.html','./data.js','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(STATIC)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  const put=r=>{if(r&&r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r};
  // icons: cache-first; everything else: network-first with cache fallback (data.js updates propagate)
  if(/icon-\d+\.png$/.test(u.pathname)){
    e.respondWith(caches.match(e.request).then(m=>m||fetch(e.request).then(put)));
  }else{
    e.respondWith(fetch(e.request).then(put).catch(()=>caches.match(e.request)));
  }
});
