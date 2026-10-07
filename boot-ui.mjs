import {designReady,currentDesign} from './shared/design-runtime.mjs';
import {preloadAssets} from './shared/asset-loader.mjs';
import {LogoTransition,logoConfig} from './shared/logo-transition.mjs';
const app=document.querySelector('#app'),studio=new URLSearchParams(location.search).has('studio');
let player;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function stop(){player?.destroy();player=null;}
function start(config={},time=0,autoplay=true){stop();const overlay=document.createElement('div');overlay.id='mn-preloader';overlay.className='mn-boot-screen';overlay.setAttribute('role','status');overlay.setAttribute('aria-label','Ładowanie Małej Nauki');document.body.append(overlay);player=new LogoTransition({overlay,app,config,onFrame:frame=>{if(studio&&parent!==window)parent.postMessage({channel:'mala-nauka-logo',type:'frame',...frame,shapes:undefined,whiteD:undefined},location.origin);},onFinish:()=>{if(!studio)stop();else parent.postMessage({channel:'mala-nauka-logo',type:'finished'},location.origin);}});player.seek(time);if(autoplay)player.play();}
async function firstScreenReady(){
 await Promise.race([document.fonts?.ready||Promise.resolve(),pause(1400)]);
 const images=[...app.querySelectorAll('img')].filter(i=>{const r=i.getBoundingClientRect();return r.width&&r.height&&r.top<innerHeight;}).slice(0,10);
 await Promise.race([Promise.allSettled(images.map(i=>i.decode?.().catch(()=>{}))),pause(1400)]);
}
if(studio){document.getElementById('mn-preloader')?.remove();window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.channel!=='mala-nauka-logo')return;const {type,config,time}=event.data;if(type==='start')start(config,time||0,true);if(type==='seek'){if(!player)start(config,time||0,false);else{player.pause();player.seek(time||0);}}if(type==='pause')player?.pause();if(type==='resume')player?.play();if(type==='stop')stop();});}
else if(app){
 const placeholder=document.getElementById('mn-preloader');
 await designReady.catch(()=>{});
 const config=logoConfig(currentDesign()?.logoTransition);
 if(!config.enabled||matchMedia('(prefers-reduced-motion: reduce)').matches){placeholder?.remove();}
 else{
  await Promise.race([new Promise(resolve=>{if(app.children.length)return resolve();const observer=new MutationObserver(()=>{if(app.children.length){observer.disconnect();resolve();}});observer.observe(app,{childList:true});setTimeout(()=>{observer.disconnect();resolve();},3000);}),pause(3100)]);
  await firstScreenReady();placeholder?.remove();start(config);
 }
 const warm=()=>void preloadAssets(['assets/ortografia/wizard-mission-retina-v1.webp','assets/ortografia/game-meadow-v1.webp']).catch(()=>{});
 if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:1500});else setTimeout(warm,700);
}
