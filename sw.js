const CACHE='mala-nauka-spelling-v20-scene-assets';
const CORE=[
  './','./index.html','./app.css','./app.js','./app.js?v=13-scene-assets','./module-router.js','./spelling-assets-setting.js',
  './game.mjs','./game.mjs?v=2','./game.mjs?v=6-scene','./modes.mjs','./modes.mjs?v=2','./progress.mjs',
  './spelling-art.css','./spelling-art.css?v=9-glyphs','./debug-tools.js','./debug-tools.js?v=7',
  './manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/lion.svg',
  './assets/ortografia/lake-background.webp','./assets/fonts/dynapuff-polish-700.woff',
  './assets/scenes/bunny.webp','./assets/scenes/mountains.webp','./assets/scenes/rose.webp','./assets/scenes/clouds-review.webp','./assets/scenes/castle-review.webp',
  './assets/scenes/turtle.avif','./assets/scenes/sparrow.avif','./assets/scenes/swallow.avif','./assets/scenes/comb.avif',
  './assets/scenes/corka.avif','./assets/scenes/wozek.avif','./assets/scenes/pioro.avif','./assets/scenes/osemka.avif','./assets/scenes/krol.avif',
  './assets/scenes/skora.avif','./assets/scenes/zolty.avif','./assets/scenes/stol.avif','./assets/scenes/samochod.avif',
  './assets/scenes/lekarz.avif','./assets/scenes/zaba.avif','./assets/scenes/grzyb.avif','./assets/scenes/schody.avif','./assets/scenes/jez.avif','./assets/scenes/ksiazka.avif',
  './spelling/art.mjs','./spelling/art.mjs?v=13-scene-assets','./spelling/bubble.mjs','./spelling/bubble.mjs?v=9-scene-loader',
  './spelling/hints.mjs','./spelling/preview.mjs','./spelling/scenes.mjs','./spelling/scenes.mjs?v=13-scene-assets','./spelling/word-reveal.mjs','./spelling/word-reveal.mjs?v=8-mechanics',
  './data/english.mjs','./data/flags.mjs','./data/reading.mjs',
  './data/words-01.json','./data/words-02.json','./data/words-03.json','./data/words-04.json',
  './data/words-05.json','./data/words-06.json','./data/words-07.json','./data/words-08.json',
  './ortografia/','./ortografia/index.html','./ortografia/wizard-v2.mjs','./ortografia/wizard-v2.mjs?v=3','./ortografia/wizard-v2.css','./ortografia/wizard-v2.css?v=2',
  './matematyka/','./matematyka/index.html','./matematyka/app.css','./matematyka/board.css','./matematyka/board-v3.css','./matematyka/board-v4.css','./matematyka/pointer-polish.js','./matematyka/difference-feedback.css','./matematyka/difference-feedback.js','./matematyka/difference-order-v2.js','./matematyka/round-timer.css','./matematyka/round-timer.js','./matematyka/correct-transition.css','./matematyka/correct-transition.js','./matematyka/app.js',
  './angielski/','./angielski/index.html','./flagi/','./flagi/index.html','./czytanie/','./czytanie/index.html'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('mala-nauka-')&&key!==CACHE).map(key=>caches.delete(key)))),
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
  const isSceneAsset = url.pathname.includes('/assets/scenes/');
  const isCode = /\.(?:m?js|css)$/.test(url.pathname);

  if (isSceneAsset || isCode) {
    event.respondWith(fetch(request).then(response=>{
      if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));
      return response;
    }).catch(async()=>await caches.match(request) || await caches.match(request,{ignoreSearch:true})));
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
