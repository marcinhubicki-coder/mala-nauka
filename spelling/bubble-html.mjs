import {DEFAULT_EFFECTS,normalizeEffectsConfig} from './effect-model.mjs';

function ensureStyles(){
 if(document.querySelector('link[data-mn-soap-style]'))return;
 const link=document.createElement('link');
 link.rel='stylesheet';link.dataset.mnSoapStyle='1';
 link.href=new URL('./bubble-html.css',import.meta.url).href;
 document.head.append(link);
}
function scenePosition(alignment){
 return (alignment||'').includes('xMin')?'left center':(alignment||'').includes('xMax')?'right center':
  (alignment||'').includes('YMin')?'center top':(alignment||'').includes('YMax')?'center bottom':'center';
}

// On mobile WebKit, composited transforms are stable while dynamic SVG/clip-path
// repainting may starve the frame scheduler. This renderer does no per-frame DOM writes.
export function createHTMLBubble(host){
 ensureStyles();
 let config=normalizeEffectsConfig(globalThis.__MALA_NAUKA_DESIGN__?.effects||DEFAULT_EFFECTS);
 let destroyed=false,paused=false,request=0,currentUrl='',tuning={},chaos={},heavy={},transition={},reactions=[];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 host.innerHTML='<div class="mn-soap-host" aria-hidden="true"><div class="mn-soap-shell"><div class="mn-soap-picture"></div><div class="mn-soap-film"></div><i class="mn-soap-glint mn-soap-glint-a"></i><i class="mn-soap-glint mn-soap-glint-b"></i><i class="mn-soap-spark mn-soap-spark-a"></i><i class="mn-soap-spark mn-soap-spark-b"></i><i class="mn-soap-spark mn-soap-spark-c"></i></div></div>';
 const root=host.querySelector('.mn-soap-host'),shell=host.querySelector('.mn-soap-shell'),picture=host.querySelector('.mn-soap-picture');
 const cache=new Map();
 const CACHE_LIMIT=6;
 const load=url=>{
  if(!url)return Promise.resolve(null);
  if(cache.has(url)){
   const recent=cache.get(url);cache.delete(url);cache.set(url,recent);return recent;
  }
  const promise=new Promise((resolve,reject)=>{
   const img=new Image();img.decoding='async';img.alt='';
   img.onload=()=>img.decode().then(()=>resolve(img),reject);
   img.onerror=()=>reject(Error('scene-load-failed'));
   img.src=url;
   if(img.complete&&img.naturalWidth)img.decode().then(()=>resolve(img),reject);
  }).catch(error=>{cache.delete(url);throw error});
  cache.set(url,promise);
  while(cache.size>CACHE_LIMIT)cache.delete(cache.keys().next().value);
  return promise;
 };
 let shapeAnimation;
 function setBubbleConfig(next){
  config=normalizeEffectsConfig(next||DEFAULT_EFFECTS);if(!config.bubble.transforms)config={...config,reactions:Object.fromEntries(Object.entries(config.reactions).map(([id,r])=>[id,{...r,shape:'bubble',morph:0}]))};
  const b=config.bubble;
  root.style.setProperty('--mn-soap-duration',Math.max(4.5,12.5-(b.speed||4.7)*.67).toFixed(2)+'s');
  root.style.setProperty('--mn-soap-sparkle',String(Math.min(1.8,b.sparkle??.55)));
  root.style.setProperty('--mn-soap-texture',String(Math.min(1.2,b.texture??.28)));
  root.dataset.skin=b.skin||'rainbow';
  root.dataset.rim=b.rim||'classic';
   root.dataset.liquid=b.liquid||'none';
  shapeAnimation?.cancel();shapeAnimation=null;
  // Shape deformation and photo share a single composited parent. No polygon
  // cycling, animated masks, displacement filters or per-frame contour writes.
  shell.style.clipPath='none';
  shell.style.borderRadius='34% 33% 35% 32% / 33% 35% 32% 34%';
  picture.style.borderRadius='inherit';
  const strength=b.transforms?b.morph:0;
  root.dataset.photoDeformation=String(b.transforms);
  root.style.setProperty('--mn-soap-amplitude',String(b.amplitude/3.25));
  root.style.setProperty('--mn-soap-orbit',String(b.orbit/1.35));
  if(strength>0&&!reduced.matches){
   const squash=.095*strength,tilt=5*strength;
   shapeAnimation=root.animate([
    {transform:'scale(1,1) skew(0deg,0deg)'},
    {transform:`scale(${1+squash},${1-squash*.72}) skew(${tilt}deg,${-tilt*.3}deg)`,offset:.28},
    {transform:`scale(${1-squash*.65},${1+squash*.8}) skew(${-tilt*.7}deg,${tilt*.4}deg)`,offset:.63},
    {transform:'scale(1,1) skew(0deg,0deg)'}
   ],{duration:Math.max(2400,10000/b.speed*3),iterations:Infinity,easing:'ease-in-out'});
  }
  const quiet=paused||reduced.matches;
  root.classList.toggle('mn-soap-paused',quiet);pause(paused);
  return config;
 }
 function clearReactions(){
  for(const a of reactions){try{a.cancel()}catch{}}
  reactions=[];root.classList.remove('mn-soap-wrong','mn-soap-correct');
 }
 function react(event='correct'){
  if(destroyed||paused||reduced.matches)return;
  clearReactions();
  root.classList.add(event==='wrong'?'mn-soap-wrong':'mn-soap-correct');
  const keyframes=event==='wrong'?
   [{transform:'translate3d(0,0,0) rotate(0deg)'},{transform:'translate3d(-5px,1px,0) rotate(-2deg)'},{transform:'translate3d(5px,-1px,0) rotate(2deg)'},{transform:'translate3d(0,0,0) rotate(0deg)'}]:
   [{transform:'translate3d(0,0,0) scale(1)'},{transform:'translate3d(0,-5px,0) scale(1.045)'},{transform:'translate3d(0,0,0) scale(1)'}];
  const a=shell.animate(keyframes,{duration:event==='wrong'?550:710,easing:'cubic-bezier(.2,.6,.25,1)'});
  reactions=[a];
  // The impulse stretches the photograph, membrane and highlights together.
  const row=config.reactions[event];
  if(config.bubble.transforms){const force=Math.min(.16,.055+config.bubble.morph*.07+(row?.morph||0)*.035);reactions.push(root.animate([
   {transform:'scale(1,1)'},{transform:`scale(${1+force},${1-force*.7}) rotate(${event==='wrong'?-2:2}deg)`},
   {transform:`scale(${1-force*.45},${1+force*.4})`},{transform:'scale(1,1)'}
  ],{duration:row?.duration||900,easing:'ease-in-out'}));}
  Promise.all(reactions.map(a=>a.finished.catch(()=>{}))).then(()=>{if(reactions[0]===a)clearReactions()});
 }
 async function transitionToScene(url,scene,first=false){
  if(destroyed)return false;
  if(url===currentUrl&&picture.querySelector('img'))return true;
  const token=++request;
  if(!url){currentUrl='';picture.replaceChildren();return true}
  let image;
  try{image=await load(url)}catch(error){
   if(!destroyed&&token===request){host.dataset.imageState='error';console.warn('[spelling-canvas-fallback] Failed to load',url,error)}
   return false;
  }
  if(destroyed||token!==request)return false;
  const element=image.cloneNode(false);
  element.alt='';
  element.style.objectPosition=scenePosition(scene?.alignment);
  element.className='mn-soap-photo';
  picture.append(element);
  const old=[...picture.children].filter(node=>node!==element);
  const duration=first?360:Math.max(250,Math.min(1500,config.bubble.transitionDuration||1000));
  if(reduced.matches){old.forEach(node=>node.remove());element.style.opacity='1'}
  else{
   element.animate([{opacity:0,transform:'scale(1.035)'},{opacity:1,transform:'scale(1)'}],{duration,easing:'ease-out'}).finished.catch(()=>{}).finally(()=>old.forEach(node=>node.remove()));
  }
  currentUrl=url;host.dataset.imageState='ready';
  return true;
 }
 function pause(value){
  paused=Boolean(value);
  const shouldPause=paused||reduced.matches;
  root.classList.toggle('mn-soap-paused',shouldPause);
  // Explicit WAAPI state is needed on mobile WebKit: CSS play-state may not
  // freeze computed transforms immediately when its parent becomes invisible.
  for(const animation of root.getAnimations({subtree:true})){
   if(animation.playState==='finished'||animation.playState==='idle')continue;
   if(shouldPause)animation.pause();else animation.play();
  }
 }
 const preference=()=>root.classList.toggle('mn-soap-paused',paused||reduced.matches);
 reduced.addEventListener('change',preference);
 setBubbleConfig(config);
 return {
  preloadScene:url=>load(url).then(()=>true).catch(()=>false),
  transitionToScene,
  react,clearReactions,
  setPaused:pause,
  setBubbleConfig,
  setTuning(value){tuning={...tuning,...value};return tuning;},
  getTuning(){return {...tuning};},
  setChaos(value){chaos={...chaos,...value};return chaos;},
  getChaos(){return {...chaos};},
  setHeavy(value){heavy={...heavy,...value};return heavy;},
  getHeavy(){return {...heavy};},
  setTransition(value){transition={...transition,...value};return transition;},
  getTransition(){return {...transition};},
  setEffects(){return {};},
  getEffects(){return {};},
  destroy(){
   destroyed=true;request++;shapeAnimation?.cancel();clearReactions();reduced.removeEventListener('change',preference);
   cache.clear();root.remove();
  }
 };
}

