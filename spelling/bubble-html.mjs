import {DEFAULT_EFFECTS,normalizeEffectsConfig} from './effect-model.mjs';

function ensureStyles(){
 if(document.querySelector('link[data-mn-soap-style]'))return;
 const link=document.createElement('link');
 link.rel='stylesheet';link.dataset.mnSoapStyle='1';
 link.href=new URL('./bubble-html.css',import.meta.url).href;
 document.head.append(link);
}
const clipStars=points=>{
 const p=[];
 for(let i=0;i<points*2;i++){
  const a=-Math.PI/2+i*Math.PI/points,r=i%2?.54:1;
  p.push((50+49*r*Math.cos(a)).toFixed(2)+'% '+(50+49*r*Math.sin(a)).toFixed(2)+'%');
 }
 return 'polygon('+p.join(',')+')';
};
function regularPolygon(points){
 const p=[];
 for(let i=0;i<points;i++){
  const a=-Math.PI/2+i*2*Math.PI/points;
  p.push((50+49*Math.cos(a)).toFixed(2)+'% '+(50+49*Math.sin(a)).toFixed(2)+'%');
 }
 return 'polygon('+p.join(',')+')';
}
function silhouette(shape){
 if(shape==='star5')return clipStars(5);
 if(shape==='star9')return clipStars(9);
 const polygon={triangle:3,square:4,pentagon:5,hexagon:6,heptagon:7,octagon:8};
 if(polygon[shape])return regularPolygon(polygon[shape]);
 return 'none';
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
 function setBubbleConfig(next){
  config=normalizeEffectsConfig(next||DEFAULT_EFFECTS);
  const b=config.bubble;
  root.style.setProperty('--mn-soap-duration',Math.max(4.5,12.5-(b.speed||4.7)*.67).toFixed(2)+'s');
  root.style.setProperty('--mn-soap-sparkle',String(Math.min(1.8,b.sparkle??.55)));
  root.style.setProperty('--mn-soap-texture',String(Math.min(1.2,b.texture??.28)));
  root.dataset.skin=b.skin||'rainbow';
  root.dataset.rim=b.rim||'classic';
  const shape=silhouette(b.shape);
  shell.style.clipPath=shape;
  shell.style.borderRadius=shape==='none'?'34% 33% 35% 32% / 33% 35% 32% 34%':'0';
  picture.style.borderRadius=shape==='none'?'inherit':'0';
  const quiet=paused||reduced.matches;
  root.classList.toggle('mn-soap-paused',quiet);
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
  reactions=[a];a.finished.catch(()=>{}).finally(()=>{if(reactions[0]===a)clearReactions()});
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
   destroyed=true;request++;clearReactions();reduced.removeEventListener('change',preference);
   cache.clear();root.remove();
  }
 };
}

