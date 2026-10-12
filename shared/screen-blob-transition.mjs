import {LogoTransition,logoTiming,DEFAULT_LOGO_TRANSITION} from './logo-transition.mjs';
export const EXIT_BLOB_CONFIG={...DEFAULT_LOGO_TRANSITION,turns:1,turnDuration:600,splashDuration:900,whiteDuration:1000,revealDuration:800,soundInParent:false};
// Starts at the Colors phase. The old scene stays visible beneath the blobs;
// the new scene is revealed by the same white-blob mask as the loader.
export function playScreenBlob({incoming,outgoing,liveOutgoing,host=document.body,onFinish=()=>{},background='transparent',config=EXIT_BLOB_CONFIG,speed=1}){
 if(speed===0){onFinish();return {finished:Promise.resolve(),cancel(){}};}
 const liveStyle=liveOutgoing?.getAttribute('style'),liveInert=liveOutgoing?.inert;if(liveOutgoing){liveOutgoing.style.zIndex='1999';liveOutgoing.inert=true;}
 const old=document.createElement('div');old.className='mn-screen-outgoing';old.dataset.mnDecoration='true';old.inert=true;old.style.cssText=`position:absolute;inset:0;z-index:1999;overflow:hidden;pointer-events:none;background:${background}`;
 if(outgoing)old.append(outgoing);host.append(old);if(host===document.body)old.style.position='fixed';
 const overlay=document.createElement('div');overlay.className='mn-screen-blob';overlay.dataset.mnDecoration='true';overlay.style.cssText='position:absolute;inset:0;z-index:2000;overflow:hidden;pointer-events:none';host.append(overlay);if(host===document.body)overlay.style.position='fixed';
 let player,resolve;const finished=new Promise(r=>resolve=r);let done=false;
 const finish=()=>{if(done)return;done=true;player?.destroy();old.remove();if(liveOutgoing){if(liveStyle===null)liveOutgoing.removeAttribute('style');else liveOutgoing.setAttribute('style',liveStyle);liveOutgoing.inert=liveInert;}onFinish();resolve();};
 player=new LogoTransition({overlay,app:incoming,config:{...EXIT_BLOB_CONFIG,...config,soundInParent:false},onFrame:frame=>{overlay.style.backgroundColor=frame.covered?(config.colors||EXIT_BLOB_CONFIG.colors)[0]:'transparent';},onFinish:finish});
 player.svg.style.cssText='display:block;width:100%;height:100%';player.seek(logoTiming(player.config).orbit);player.play(speed);
 return {finished,cancel:finish};
}

let documentNavigation;
// Mathematics has its own document. Preview the destination before navigating,
// so the same white-blob reveal also works across that document boundary.
export function navigateWithBlob(url,{app,config,speed=1,navigate=target=>location.assign(target)}={}){
 if(documentNavigation)return documentNavigation;
 if(speed===0||matchMedia('(prefers-reduced-motion: reduce)').matches){navigate(url);return Promise.resolve();}
 documentNavigation=(async()=>{
  const inert=app.inert;app.inert=true;
  const host=document.createElement('div');host.dataset.mnDecoration='true';host.style.cssText='position:fixed;inset:0;z-index:2001;pointer-events:none';
  const frame=document.createElement('iframe');frame.title='Ekran następny';frame.tabIndex=-1;frame.style.cssText='display:block;width:100%;height:100%;border:0;opacity:0';host.append(frame);document.body.append(host);frame.src=url;
  try{
   await new Promise((resolve,reject)=>{const deadline=performance.now()+8000;const ready=()=>{try{const d=frame.contentDocument;if(d?.querySelector('#app button,#app .home-canvas')&&!d.querySelector('.loading,#mn-preloader')){Promise.resolve(d.fonts?.ready).then(resolve);return;}}catch{}if(performance.now()>deadline){reject(Error('Ekran następny nie jest gotowy.'));return;}requestAnimationFrame(ready);};ready();});
   const transition=playScreenBlob({incoming:frame,outgoing:app.cloneNode(true),background:getComputedStyle(document.body).background,config,speed});await transition.finished;
   frame.style.opacity='1';navigate(url);
  }catch{navigate(url);}
  finally{app.inert=inert;host.remove();documentNavigation=null;}
 })();return documentNavigation;
}
