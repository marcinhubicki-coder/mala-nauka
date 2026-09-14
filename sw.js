const CACHE='mala-nauka-v3';
const CORE=[
  './','./index.html','./app.css','./app.js','./module-router.js','./game.mjs','./modes.mjs','./progress.mjs',
  './spelling-art.css','./spelling-mobile.css','./spelling-art.js','./debug-tools.js',
  './manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/lion.svg',
  './assets/scenes/bunny.svg','./assets/scenes/mountains.svg','./assets/scenes/rose.svg',
  './spelling/art.mjs','./spelling/hints.mjs','./spelling/preview.mjs','./spelling/scenes.mjs','./spelling/word-reveal.mjs',
  './data/english.mjs','./data/flags.mjs','./data/reading.mjs',
  './data/words-01.json','./data/words-02.json','./data/words-03.json','./data/words-04.json',
  './data/words-05.json','./data/words-06.json','./data/words-07.json','./data/words-08.json',
  './ortografia/','./ortografia/index.html',
  './matematyka/','./matematyka/index.html','./matematyka/app.css','./matematyka/app.js',
  './angielski/','./angielski/index.html','./flagi/','./flagi/index.html','./czytanie/','./czytanie/index.html'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(request,copy));
      return response;
    }).catch(async()=>await caches.match(request)||await caches.match('./index.html')));
    return;
  }

  event.respondWith(caches.match(request).then(cached=>{
    const update=fetch(request).then(response=>{
      if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));
      return response;
    }).catch(()=>cached);
    return cached||update;
  }));
});
