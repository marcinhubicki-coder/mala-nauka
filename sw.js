const CACHE='mala-nauka-v25-spelling-mockup-v05';
const CORE=[
  './','./index.html','./app.css','./app.js','./module-router.js','./spelling-assets-setting.js','./game.mjs','./modes.mjs','./progress.mjs',
  './spelling-art.css','./spelling-mobile.css','./spelling-review-v041.css','./spelling-mockup-v05.css','./spelling-art.js','./debug-tools.js',
  './spelling-art.css?v=10','./spelling-mobile.css?v=10','./spelling-review-v041.css?v=2','./spelling-mockup-v05.css?v=1','./spelling-art.js?v=10','./debug-tools.js?v=7','./spelling/art.mjs?v=9',
  './manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/lion.svg',
  './assets/scenes/spelling-bg.webp','./assets/scenes/bunny.webp','./assets/scenes/mountains.webp','./assets/scenes/rose.webp','./assets/scenes/clouds-review.webp','./assets/scenes/castle-review.webp',
  './assets/ortografia/spelling-bg-v05.webp','./assets/ortografia/title-jak-jest-poprawnie.png','./assets/ortografia/bubble-frame-v05.webp','./assets/ortografia/answer-button-v05.webp',
  './spelling/art.mjs','./spelling/hints.mjs','./spelling/preview.mjs','./spelling/scenes.mjs','./spelling/word-reveal.mjs',
  './data/english.mjs','./data/flags.mjs','./data/reading.mjs',
  './data/words-01.json','./data/words-02.json','./data/words-03.json','./data/words-04.json',
  './data/words-05.json','./data/words-06.json','./data/words-07.json','./data/words-08.json',
  './ortografia/','./ortografia/index.html',
  './matematyka/','./matematyka/index.html','./matematyka/app.css','./matematyka/board.css','./matematyka/board-v3.css','./matematyka/board-v4.css','./matematyka/pointer-polish.js','./matematyka/difference-feedback.css','./matematyka/difference-feedback.js','./matematyka/difference-order-v2.js','./matematyka/round-timer.css','./matematyka/round-timer.js','./matematyka/correct-transition.css','./matematyka/correct-transition.js','./matematyka/app.js',
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
    }).catch(async()=>await caches.match(request)||await caches.match(request,{ignoreSearch:true})||await caches.match('./index.html')));
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
