import {LogoTransition,logoTiming,DEFAULT_LOGO_TRANSITION} from './logo-transition.mjs';
export const EXIT_BLOB_CONFIG={...DEFAULT_LOGO_TRANSITION,turns:1,turnDuration:600,splashDuration:900,whiteDuration:1000,revealDuration:800,soundInParent:true};
// Starts at the Colors phase. The old scene stays visible beneath the blobs;
// the new scene is revealed by the same white-blob mask as the loader.
export function playScreenBlob({incoming,outgoing,liveOutgoing,host=document.body,onFinish=()=>{},background='transparent'}){
 const liveStyle=liveOutgoing?.getAttribute('style'),liveInert=liveOutgoing?.inert;if(liveOutgoing){liveOutgoing.style.zIndex='1999';liveOutgoing.inert=true;}
 const old=document.createElement('div');old.className='mn-screen-outgoing';old.dataset.mnDecoration='true';old.inert=true;old.style.cssText=`position:absolute;inset:0;z-index:1999;overflow:hidden;pointer-events:none;background:${background}`;
 if(outgoing)old.append(outgoing);host.append(old);if(host===document.body)old.style.position='fixed';
 const overlay=document.createElement('div');overlay.className='mn-screen-blob';overlay.dataset.mnDecoration='true';overlay.style.cssText='position:absolute;inset:0;z-index:2000;overflow:hidden;pointer-events:none';host.append(overlay);if(host===document.body)overlay.style.position='fixed';
 let player,resolve;const finished=new Promise(r=>resolve=r);let done=false;
 const finish=()=>{if(done)return;done=true;player?.destroy();old.remove();if(liveOutgoing){if(liveStyle===null)liveOutgoing.removeAttribute('style');else liveOutgoing.setAttribute('style',liveStyle);liveOutgoing.inert=liveInert;}onFinish();resolve();};
 player=new LogoTransition({overlay,app:incoming,config:EXIT_BLOB_CONFIG,audio:{logo(){},pauseLogo(){}},onFrame:frame=>{overlay.style.backgroundColor=frame.covered?EXIT_BLOB_CONFIG.colors[0]:'transparent';},onFinish:finish});
 player.svg.style.cssText='display:block;width:100%;height:100%';player.seek(logoTiming(EXIT_BLOB_CONFIG).orbit);player.play();
 return {finished,cancel:finish};
}
