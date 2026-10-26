// Lazy, bounded cache for versioned, self-hosted mural resources only.
const CACHE='kaihua-mural-tiles-v1',LIMIT=256;
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith('kaihua-mural-tiles-')&&name!==CACHE)await caches.delete(name);
 await self.clients.claim();
})()));
let trimming=Promise.resolve();
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 const parts=url.pathname.split('/'),at=parts.lastIndexOf('murals');
 if(event.request.method!=='GET'||url.origin!==self.location.origin||parts[at-1]!=='assets'||!['left','back','right'].includes(parts[at+1])||!/^[a-f0-9]{12}$/.test(parts[at+2]||''))return;
 if(!url.pathname.includes('/zoom_files/')&&!url.pathname.endsWith('/zoom.dzi')&&!url.pathname.endsWith('/full-preview.webp'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(event.request);if(cached)return cached;
  const response=await fetch(event.request);
  if(response.ok){
   const copy=response.clone();
   event.waitUntil(trimming=trimming.catch(()=>{}).then(async()=>{
    await cache.put(event.request,copy);const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-LIMIT)))await cache.delete(key);
   }));
  }
  return response;
 })());
});
