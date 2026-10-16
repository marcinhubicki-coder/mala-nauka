// Serialize a real function rather than hand-escaping regular expressions in a
// nested template. This source is syntax checked in the build tests.
export function buildServiceWorker({hash,core,bootstrap,networkFirst=false,contentOrigin=''}){
 return `const CORE=${JSON.stringify(core)};\nconst ASSETS=${JSON.stringify(bootstrap)};\n(${serviceWorkerRuntime.toString()})({...${JSON.stringify({cacheName:'mala-nauka-ds-'+hash,networkFirst,contentOrigin})},core:CORE,bootstrap:ASSETS});\n`;
}
function serviceWorkerRuntime({cacheName,core,bootstrap,networkFirst,contentOrigin}){
 const MEDIA='mala-nauka-scenes-v1',FLAGS='mala-nauka-flags-v1';
 self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(cacheName);
  for(let start=0;start<core.length;start+=12)await Promise.all(core.slice(start,start+12).map(async url=>{const response=await fetch(url);if(!response.ok)throw Error(url);await cache.put(url,response);}));
  // This explicit starter list is the only image download at installation.
  for(let start=0;start<bootstrap.length;start+=6)await Promise.allSettled(bootstrap.slice(start,start+6).map(async url=>{const response=await fetch(url);if(response.ok)await cache.put(url,response);}));
  self.skipWaiting();
 })()));
 self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith('mala-nauka-')&&![cacheName,MEDIA,FLAGS].includes(name))await caches.delete(name);
  await self.clients.claim();
 })()));
 async function image(request,name,limit){
  const cache=await caches.open(name),cached=await cache.match(request);if(cached){await cache.delete(request);await cache.put(request,cached.clone());return cached;}
  const starter=await(await caches.open(cacheName)).match(request,{ignoreSearch:true});if(starter)return starter;
  const response=await fetch(request);if(response.ok&&response.type!=='opaque')try{await cache.put(request,response.clone());const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-limit)))await cache.delete(key);}catch{/* Quota cannot block a lesson. */}
  return response;
 }
 self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||!(url.origin===location.origin||contentOrigin&&url.href.startsWith(contentOrigin)))return;
  if(/\/assets\/.+\.(?:png|jpe?g|webp|avif|svg)$/i.test(url.pathname)){
   // Cache only the requested image. No category, atlas family or bank prefetch.
   event.respondWith(image(request,url.pathname.startsWith('/assets/flags/')?FLAGS:MEDIA,url.pathname.startsWith('/assets/flags/')?260:160));return;
  }
  if(networkFirst&&/\.(?:m?js|css|json|webmanifest)$/.test(url.pathname)||/\/design-system\/|\/shared\/.*\.mjs$|\/data\/words-0[1-8]\.json$/.test(url.pathname)){
   event.respondWith(fetch(request).then(async response=>{if(!response.ok)throw Error(url.href);await(await caches.open(cacheName)).put(request,response.clone());return response;}).catch(()=>caches.match(request,{ignoreSearch:true})));return;
  }
  if(request.mode==='navigate'){
   event.respondWith(fetch(request).catch(async()=>await caches.match(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname)||await caches.match('/index.html')));return;
  }
  event.respondWith(caches.match(request,{ignoreSearch:true}).then(cached=>cached||fetch(request).then(async response=>{if(response.ok)await(await caches.open(cacheName)).put(request,response.clone());return response;})));
 });
}
