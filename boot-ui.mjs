import {designReady} from './shared/design-runtime.mjs';
import {preloadAssets} from './shared/asset-loader.mjs';

// Five small CSS balls complete two orbits before the swelling rainbow.
// The first real screen and its visible images are prepared under the overlay.
const root=document.querySelector('#app');
const overlay=document.querySelector('#mn-preloader');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const started=performance.now();
const INITIAL_TWO_TURNS_MS=1500;
const EXIT_MS=reduced?190:1890;
const preloadLater=()=>{
 const paths=[
  'assets/ortografia/wizard-mission-retina-v1.webp',
  'assets/ortografia/game-meadow-v1.webp',
  'assets/angielski/wizard-mission-retina-v2.webp',
  'assets/czytanie/wizard-mission-retina-v1.webp',
 ];
 const work=()=>void designReady.then(()=>preloadAssets(paths)).catch(()=>{});
 if('requestIdleCallback'in window)requestIdleCallback(work,{timeout:1200});
 else setTimeout(work,700);
};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const imgReady=image=>{
 if(image.complete&&image.naturalWidth>0)return Promise.resolve();
 if(typeof image.decode==='function')return image.decode().catch(()=>{});
 return new Promise(resolve=>{
  image.addEventListener('load',resolve,{once:true});
  image.addEventListener('error',resolve,{once:true});
 });
};
const visibleImages=()=>[...root.querySelectorAll('img')].filter(image=>{
 const rect=image.getBoundingClientRect();
 return rect.width>0&&rect.height>0&&rect.top<innerHeight&&rect.bottom>0;
}).slice(0,10);
async function firstScreenReady(){
 const fontPromise=document.fonts?.ready||Promise.resolve();
 // A slow or offline image must not trap the child behind the loader.
 await Promise.race([
  Promise.allSettled([fontPromise,...visibleImages().map(imgReady)]),
  pause(1400),
 ]);
}
if(root&&overlay&&new URLSearchParams(location.search).has('studio'))overlay.remove();
if(root&&overlay?.isConnected){
 preloadLater(); // Warm the first game screens during the rainbow startup, without blocking it.
 let released=false;
 const release=async()=>{
  if(released)return;
  released=true;
  observer.disconnect();
  try{
   await Promise.all([
    firstScreenReady(),
    pause(reduced?0:Math.max(0,INITIAL_TWO_TURNS_MS-(performance.now()-started))),
   ]);
  }catch{}
  // Give Safari one paint of the complete first screen behind the iris.
  await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
  overlay.classList.add('mn-boot-exit');
  setTimeout(()=>{
   overlay.remove();
  },EXIT_MS);
 };
 const hasFirstScreen=()=>Boolean(root.querySelector(
  'button,.player-card,.home-adventures,.wizard-intro,.empty.card'
 ));
 const observer=new MutationObserver(()=>{
  if(hasFirstScreen())void release();
 setTimeout(()=>{if(!released)void release();},6000);
 });
 observer.observe(root,{childList:true,subtree:true});
 if(hasFirstScreen())void release();
 setTimeout(()=>{if(!released)void release();},6000);
}
