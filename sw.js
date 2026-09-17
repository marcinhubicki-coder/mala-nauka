const CACHE='mala-nauka-v46';
const CORE=[
  './','./index.html','./app.css','./viewport-lock.css','./app.js','./module-router.js','./spelling-assets-setting.js','./game.mjs','./modes.mjs','./progress.mjs',
  './spelling-art.css','./spelling-mobile.css','./spelling-art.js','./debug-tools.js',
  './manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/lion.svg',
  './assets/scenes/bunny.svg','./assets/scenes/mountains.svg','./assets/scenes/rose.svg',
  './spelling/art.mjs','./spelling/hints.mjs','./spelling/preview.mjs','./spelling/scenes.mjs','./spelling/word-reveal.mjs',
  './data/english.mjs','./data/flags.mjs','./data/reading.mjs',
  './data/words-01.json','./data/words-02.json','./data/words-03.json','./data/words-04.json',
  './data/words-05.json','./data/words-06.json','./data/words-07.json','./data/words-08.json',
  './ortografia/','./ortografia/index.html',
  './matematyka/','./matematyka/index.html','./matematyka/app.css','./matematyka/board.css','./matematyka/board-v3.css','./matematyka/board-v4.css','./matematyka/pointer-polish.js','./matematyka/difference-feedback.css','./matematyka/difference-feedback.js','./matematyka/difference-order-v2.js','./matematyka/round-timer.css','./matematyka/round-timer.js','./matematyka/correct-transition.css','./matematyka/math-modes.css','./matematyka/division-polish.css','./matematyka/division-polish.js','./matematyka/explainer-polish.css','./matematyka/explainer-polish.js','./matematyka/layout-v26.css','./matematyka/layout-v26.js','./matematyka/stability-v30.css','./matematyka/stability-v30.js','./matematyka/stability-v31.css','./matematyka/stability-v31.js','./matematyka/stability-v33.css','./matematyka/stability-v33.js','./matematyka/pwa-polish-v37.css','./matematyka/pwa-polish-v42.css','./matematyka/score-badge-v38.js','./matematyka/interaction-v45.css','./matematyka/interaction-v45.js','./matematyka/wrong-sequence-v46.css','./matematyka/wrong-sequence-v46.js','./matematyka/app.js',
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
