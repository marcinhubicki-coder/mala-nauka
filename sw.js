const CACHE='mala-nauka-v68';
const FLAG_CDN_HOST='cdn.jsdelivr.net';
const FLAG_CDN_PATH='/gh/lipis/flag-icons@7.5.0/flags/4x3/';
const CORE=[
  './','./index.html','./app.css','./viewport-lock.css','./app.js','./module-router.js','./spelling-assets-setting.js','./game.mjs','./modes.mjs','./progress.mjs',
  './spelling-art.css','./spelling-mobile.css','./spelling-art.js','./debug-tools.js',
  './manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/lion.svg',
  './assets/scenes/bunny.svg','./assets/scenes/mountains.svg','./assets/scenes/rose.svg',
  './assets/flags/pl.svg','./assets/flags/de.svg','./assets/flags/fr.svg','./assets/flags/it.svg','./assets/flags/ua.svg','./assets/flags/se.svg','./assets/flags/ch.svg','./assets/flags/gb.svg','./assets/flags/nl.svg','./assets/flags/be.svg','./assets/flags/ie.svg','./assets/flags/at.svg','./assets/flags/no.svg','./assets/flags/dk.svg','./assets/flags/fi.svg','./assets/flags/cz.svg','./assets/flags/ee.svg',
  './assets/flags/jp.svg','./assets/flags/cn.svg','./assets/flags/bd.svg','./assets/flags/id.svg','./assets/flags/za.svg','./assets/flags/eg.svg','./assets/flags/ma.svg','./assets/flags/ng.svg','./assets/flags/us.svg','./assets/flags/ca.svg','./assets/flags/mx.svg','./assets/flags/cu.svg','./assets/flags/br.svg','./assets/flags/ar.svg','./assets/flags/cl.svg','./assets/flags/pe.svg','./assets/flags/au.svg','./assets/flags/nz.svg','./assets/flags/fj.svg','./assets/flags/pg.svg',
  './assets/maps/europe.svg','./assets/maps/asia.svg','./assets/maps/africa.svg','./assets/maps/north-america.svg','./assets/maps/south-america.svg','./assets/maps/oceania.svg','./assets/maps/NATURAL-EARTH-SOURCE.txt','./assets/maps/VECTORATLAS-SOURCE.txt','./assets/flags/FLAG-ICONS-SOURCE.txt',
  './spelling/art.mjs','./spelling/hints.mjs','./spelling/preview.mjs','./spelling/scenes.mjs','./spelling/word-reveal.mjs',
  './data/english.mjs','./data/flags.mjs','./data/flags/europe.mjs','./data/flags/asia.mjs','./data/flags/africa.mjs','./data/flags/north-america.mjs','./data/flags/south-america.mjs','./data/flags/oceania.mjs','./data/reading.mjs',
  './data/words-01.json','./data/words-02.json','./data/words-03.json','./data/words-04.json',
  './data/words-05.json','./data/words-06.json','./data/words-07.json','./data/words-08.json',
  './ortografia/','./ortografia/index.html',
  './matematyka/','./matematyka/index.html','./matematyka/app.css','./matematyka/board.css','./matematyka/board-v3.css','./matematyka/board-v4.css','./matematyka/pointer-polish.js','./matematyka/difference-feedback.css','./matematyka/difference-feedback.js','./matematyka/difference-order-v2.js','./matematyka/round-timer.css','./matematyka/round-timer.js','./matematyka/correct-transition.css','./matematyka/math-modes.css','./matematyka/division-polish.css','./matematyka/division-polish.js','./matematyka/explainer-polish.css','./matematyka/explainer-polish.js','./matematyka/layout-v26.css','./matematyka/layout-v26.js','./matematyka/stability-v30.css','./matematyka/stability-v30.js','./matematyka/stability-v31.css','./matematyka/stability-v31.js','./matematyka/stability-v33.css','./matematyka/stability-v33.js','./matematyka/app.js',
  './angielski/','./angielski/index.html','./flagi/','./flagi/index.html','./flagi/language-toggle.mjs','./flagi/adaptive-difficulty.mjs','./flagi/game-variants.mjs','./flagi/europe-map.js','./flagi/map-microstates.js','./flagi/feedback-transition.js','./flagi/map-layout.css','./flagi/wizard-v2.css','./flagi/wizard-v2-tuning.css','./flagi/game-variants.css','./flagi/theme.css','./czytanie/','./czytanie/index.html'
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

  if(url.hostname===FLAG_CDN_HOST&&url.pathname.startsWith(FLAG_CDN_PATH)){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const cached=await cache.match(request);
      if(cached)return cached;
      const response=await fetch(request);
      await cache.put(request,response.clone());
      return response;
    }));
    return;
  }

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
