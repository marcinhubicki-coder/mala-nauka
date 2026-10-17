import {DEFAULT_EFFECTS,normalizeEffectsConfig} from './effect-model.mjs';

const TAU=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function polygon(sides,star=false){
 const n=star?sides*2:sides,points=[];
 for(let i=0;i<n;i++){
  const angle=-Math.PI/2+TAU*i/n;
  const radius=star&&i%2?25:49;
  points.push((50+Math.cos(angle)*radius).toFixed(3)+'% '+(50+Math.sin(angle)*radius).toFixed(3)+'%');
 }
 return 'polygon('+points.join(',')+')';
}

export function createWebkitBubble(host,options={}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let config=normalizeEffectsConfig(globalThis.__MALA_NAUKA_DESIGN__?.effects||DEFAULT_EFFECTS);
 let settings=config.bubble,paused=false,destroyed=false,token=0,idle,reactAnimation,currentURL='',activeIndex=0;
 let tuning={},chaos={},effects={},heavy={},transition={};
 const cache=new Map();
 const shell=document.createElement('div');
 shell.className='soap-webkit-shell';
 shell.style.cssText='position:relative;display:block;height:100%;width:auto;max-width:100%;aspect-ratio:1;margin:0 auto;isolation:isolate;overflow:hidden;box-sizing:border-box;transform:translate3d(0,0,0);will-change:transform;border:2px solid rgba(255,255,255,.76);border-radius:49% 51% 48% 52% / 51% 47% 53% 49%;background:conic-gradient(from 40deg,#c5eeff,#f5cdfa,#dcbaff,#bfefff,#ffcae2,#c5eeff);box-shadow:0 7px 18px rgba(87,67,140,.17),inset 0 0 0 2px rgba(255,255,255,.36);pointer-events:none';
 const inner=document.createElement('div');
 inner.style.cssText='position:absolute;inset:7px;overflow:hidden;border-radius:inherit;background:linear-gradient(130deg,#e7d5ff,#bfeeff 55%,#ffe4f1);';
 const images=[document.createElement('div'),document.createElement('div')];
 for(const image of images){
  image.className='soap-webkit-picture';
  image.style.cssText='position:absolute;inset:0;border-radius:inherit;background-position:center;background-size:cover;background-repeat:no-repeat;opacity:0;pointer-events:none;transform:translateZ(0);';
  inner.append(image);
 }
 const film=document.createElement('div');
 film.style.cssText='position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:radial-gradient(circle at 28% 18%,rgba(255,255,255,.43),transparent 53%),radial-gradient(circle at 78% 86%,rgba(225,189,255,.22),transparent 46%),linear-gradient(135deg,rgba(255,255,255,.09),transparent 50%,rgba(207,223,255,.25));';
 inner.append(film);shell.append(inner);
 const glint=document.createElement('div');
 glint.style.cssText='position:absolute;top:10%;left:18%;width:21%;height:6%;border-radius:50%;transform:rotate(-29deg);background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.92),rgba(255,255,255,0));opacity:.8;pointer-events:none;';
 shell.append(glint);
 const rim=document.createElement('div');
 rim.style.cssText='position:absolute;inset:1px;border:2px solid rgba(255,255,255,.78);border-radius:inherit;pointer-events:none;';
 shell.append(rim);
 host.replaceChildren(shell);
 function image(url){
  if(!url)return Promise.resolve(null);
  if(cache.has(url))return cache.get(url);
  const pending=new Promise((resolve,reject)=>{const img=new Image();img.decoding='async';img.onload=()=>resolve(img);img.onerror=()=>reject(Error('scene-load-failed'));img.src=url;if(img.complete&&img.naturalWidth)resolve(img)}).catch(error=>{cache.delete(url);throw error});
  cache.set(url,pending);return pending;
 }
 function animateIdle(){
  idle?.cancel();idle=null;
  if(paused||destroyed||document.hidden||reduced.matches||options.motion===false)return;
  const strength=clamp((settings.amplitude||3.25)/3.25*.018,.006,.034);
  const y=clamp(strength*.82,.006,.023),move=clamp(strength*140,1,5);
  idle=shell.animate([
   {transform:'translate3d(0,0,0) scale(1,'+(1-y).toFixed(4)+') rotate(-.45deg)'},
   {transform:'translate3d('+move.toFixed(2)+'px,-2px,0) scale('+(1+strength).toFixed(4)+','+(1+y).toFixed(4)+') rotate(.42deg)'},
   {transform:'translate3d(-'+(move*.75).toFixed(2)+'px,1px,0) scale('+(1-strength*.7).toFixed(4)+','+(1+y*.45).toFixed(4)+') rotate(-.2deg)'},
   {transform:'translate3d(0,0,0) scale(1,'+(1-y).toFixed(4)+') rotate(-.45deg)'}
  ],{duration:clamp(5300/(settings.speed||3.7)*3.7,2200,6500),iterations:Infinity,easing:'ease-in-out'});
 }
 function setBubbleConfig(value){
  config=normalizeEffectsConfig(value);
  settings={...DEFAULT_EFFECTS.bubble,...config.bubble};
  const shape=settings.shape;
  const clip=shape==='star5'?polygon(5,true):shape==='star9'?polygon(9,true):shape==='triangle'?polygon(3):shape==='pentagon'?polygon(5):shape==='decagon'?polygon(10):shape==='diamond'?polygon(4):'none';
  shell.style.clipPath=clip;
  shell.style.borderRadius=clip==='none'?(settings.shape==='circle'?'50%':'49% 51% 48% 52% / 51% 47% 53% 49%'):'0';
  shell.style.background=settings.skin==='ocean'?'conic-gradient(#baf3ff,#8fc4ff,#d9efff,#85d9ff,#baf3ff)':settings.skin==='sunset'?'conic-gradient(#ffe6b8,#ffb0d6,#f3d4fd,#ffe6b8)':'conic-gradient(from 40deg,#c5eeff,#f5cdfa,#dcbaff,#bfefff,#ffcae2,#c5eeff)';
  tuning={...tuning,speed:settings.speed};
  chaos={...chaos,amplitude:settings.amplitude,orbit:settings.orbit};
  if(!paused)animateIdle();
 }
 async function transitionToScene(url,scene,first=false){
  const id=++token;if(url===currentURL)return true;
  if(!url){images.forEach(x=>x.style.opacity='0');currentURL='';return true}
  try{
   await image(url);if(destroyed||token!==id)return false;
   const nextIndex=1-activeIndex;
   const next=images[nextIndex],previous=images[activeIndex];
   next.style.backgroundImage='url('+JSON.stringify(url)+')';
   if(first){next.style.opacity='1';previous.style.opacity='0';activeIndex=nextIndex;currentURL=url;return true}
   next.style.opacity='0';
   const fade=next.animate([{opacity:0},{opacity:1}],{duration:290,fill:'forwards',easing:'ease-out'});
   try{await fade.finished}catch{}
   if(destroyed||token!==id)return false;
   fade.cancel();next.style.opacity='1';previous.style.opacity='0';
   activeIndex=nextIndex;currentURL=url;return true;
  }catch{return false}
 }
 const onDesign=e=>setBubbleConfig(e.detail?.effects||DEFAULT_EFFECTS);
 const onVisibility=()=>{if(document.hidden){idle?.pause();reactAnimation?.pause()}else if(!paused)animateIdle()};
 const onReduction=()=>animateIdle();
 document.addEventListener('mala-nauka:design',onDesign);
 document.addEventListener('visibilitychange',onVisibility);
 reduced.addEventListener('change',onReduction);
 setBubbleConfig(config);
 return {
  preloadScene:url=>image(url).then(()=>true,()=>false),
  transitionToScene,
  setBubbleConfig,
  setTuning:v=>(tuning={...tuning,...v},animateIdle(),{...tuning}),
  getTuning:()=>({...tuning}),
  setChaos:v=>(chaos={...chaos,...v},{...chaos}),
  getChaos:()=>({...chaos}),
  setEffects:v=>(effects={...effects,...v},{...effects}),
  getEffects:()=>({...effects}),
  setHeavy:v=>(heavy={...heavy,...v},{...heavy}),
  getHeavy:()=>({...heavy}),
  setTransition:v=>(transition={...transition,...v},{...transition}),
  getTransition:()=>({...transition}),
  react(event='correct'){
   if(paused||destroyed||reduced.matches)return;
   idle?.pause();reactAnimation?.cancel();
   const wrong=event==='wrong',amp=wrong?4:7;
   reactAnimation=shell.animate(wrong?[
    {transform:'translate3d(0,0,0) scale(1)'},
    {transform:'translate3d(-'+amp+'px,0,0) scale(.96,1.04)',offset:.22},
    {transform:'translate3d('+amp+'px,0,0) scale(1.02,.98)',offset:.53},
    {transform:'translate3d(0,0,0) scale(1)'}
   ]:[
    {transform:'translate3d(0,0,0) scale(1)'},
    {transform:'translate3d(0,-9px,0) scale(1.045,.97)',offset:.3},
    {transform:'translate3d(0,1px,0) scale(.985,1.025)',offset:.75},
    {transform:'translate3d(0,0,0) scale(1)'}
   ],{duration:wrong?530:760,easing:'ease-out'});
   reactAnimation.finished.then(()=>{if(!paused&&!destroyed)animateIdle()},()=>{});
  },
  clearReactions:()=>{reactAnimation?.cancel();if(!paused)animateIdle()},
  setPaused:value=>{paused=Boolean(value);if(paused){idle?.pause();reactAnimation?.pause()}else animateIdle()},
  destroy:()=>{destroyed=true;token++;idle?.cancel();reactAnimation?.cancel();document.removeEventListener('mala-nauka:design',onDesign);document.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener('change',onReduction);host.replaceChildren()}
 };
}

