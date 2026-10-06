import {designReady} from './shared/design-runtime.mjs';
import {preloadAssets} from './shared/asset-loader.mjs';
void designReady.then(()=>setTimeout(()=>void preloadAssets(['assets/ortografia/wizard-mission-retina-v1.webp','assets/ortografia/game-meadow-v1.webp','assets/angielski/wizard-mission-retina-v2.webp','assets/czytanie/wizard-mission-retina-v1.webp']),0)).catch(()=>{});
const root=document.querySelector('#app'),overlay=document.querySelector('#mn-preloader');
if(root&&overlay){let done=false;const observer=new MutationObserver(()=>{if(done||!root.querySelector('button,.player-card,.home-adventures,.wizard-intro'))return;done=true;observer.disconnect();overlay.classList.add('mn-boot-complete');setTimeout(()=>overlay.remove(),260)});observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['data-view','data-mode']});}
