import {designReady,currentDesign} from './shared/design-runtime.mjs';
import {preloadAssets} from './shared/asset-loader.mjs';
import {screenReady} from './shared/screen-readiness.mjs';
import {LogoTransition,logoConfig} from './shared/logo-transition.mjs';
const app=document.querySelector('#app'),studio=new URLSearchParams(location.search).has('studio');
let player;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function stop(){player?.destroy();player=null;}
function start(config={},time=0,autoplay=true){stop();const overlay=document.createElement('div');overlay.id='mn-preloader';overlay.className='mn-boot-screen';overlay.setAttribute('role','status');overlay.setAttribute('aria-label','Ładowanie Małej Nauki');document.body.append(overlay);player=new LogoTransition({overlay,app,config,onFrame:frame=>{if(studio&&parent!==window)parent.postMessage({channel:'mala-nauka-logo',type:'frame',...frame,shapes:undefined,whiteD:undefined},location.origin);},onFinish:()=>{if(!studio)stop();else parent.postMessage({channel:'mala-nauka-logo',type:'finished'},location.origin);}});player.seek(time);if(autoplay)player.play();}
let pending=0,waiting=false,waitRaf;
async function firstScreenReady(){await Promise.race([screenReady(app),pause(8000)]);}
async function prepare(full=false){
 const run=++pending;clearTimeout(prepare.timer);cancelAnimationFrame(waitRaf);stop();waiting=true;
 const config=logoConfig(currentDesign()?.logoTransition);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const neutral=()=>{if(run!==pending||!waiting||reduced||!config.enabled)return;document.getElementById('mn-preloader')?.remove();start({...config,neutral:true,turns:1,turnDuration:1000,whiteDuration:650,revealDuration:400},0,false);let epoch=performance.now(),painted=0;const tick=now=>{if(!waiting||run!==pending)return;if(now-painted>33){player?.seek((now-epoch)%1000);painted=now;}waitRaf=requestAnimationFrame(tick);};waitRaf=requestAnimationFrame(tick);};
 if(!full)prepare.timer=setTimeout(neutral,250);
 await firstScreenReady();if(run!==pending)return;waiting=false;clearTimeout(prepare.timer);cancelAnimationFrame(waitRaf);
 if(full||!player)document.getElementById('mn-preloader')?.remove();
 if(full&&config.enabled&&!reduced){start(config);try{sessionStorage.setItem('mn-logo-seen','1');}catch{}}
 else if(player){player.seek(player.config.turnDuration);player.play();}
}

if(studio){document.getElementById('mn-preloader')?.remove();window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.channel!=='mala-nauka-logo')return;const {type,config,time}=event.data;if(type==='start')start(config,time||0,true);if(type==='seek'){if(!player)start(config,time||0,false);else{player.pause();player.seek(time||0);}}if(type==='pause')player?.pause();if(type==='resume')player?.play();if(type==='stop')stop();});}
else if(app){
 const initialTimer=setTimeout(()=>{start({neutral:true,turns:1,turnDuration:1000},0,false);const epoch=performance.now();let painted=0;const tick=now=>{if(now-painted>33){player?.seek((now-epoch)%1000);painted=now;}waitRaf=requestAnimationFrame(tick);};waitRaf=requestAnimationFrame(tick);},250);
 await designReady.catch(()=>{});
 await new Promise(resolve=>{const ready=()=>app.dataset.view||app.querySelector('.category-grid');if(ready())return resolve();const observer=new MutationObserver(()=>{if(ready()){observer.disconnect();resolve();}});observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['data-view']});setTimeout(()=>{observer.disconnect();resolve();},8000);});
 clearTimeout(initialTimer);cancelAnimationFrame(waitRaf);
 let seen=false;try{seen=sessionStorage.getItem('mn-logo-seen')==='1';}catch{}
 const full=!seen&&['players','player-create','player-pin'].includes(app.dataset.view);
 await prepare(full);
 let screen=app.dataset.view+':'+app.dataset.mode;
 new MutationObserver(()=>{const next=app.dataset.view+':'+app.dataset.mode;if(next===screen)return;screen=next;void prepare(false);}).observe(app,{attributes:true,attributeFilter:['data-view','data-mode']});
 const warm=()=>void preloadAssets(['assets/ortografia/wizard-mission-retina-v1.webp','assets/ortografia/game-meadow-v1.webp']).catch(()=>{});
 if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:1500});else setTimeout(warm,700);
}
