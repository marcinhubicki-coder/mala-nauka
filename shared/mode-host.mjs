import {playScreenBlob} from './screen-blob-transition.mjs';
import {transitionMotion} from './screen-motion.mjs';
const CHANNEL='mala-nauka-mode-host';
const FOLDERS={spelling:'ortografia',math:'matematyka',english:'angielski',flags:'flagi',reading:'czytanie'};
export function requestHostRoute(target){
 if(parent===window||new URLSearchParams(location.search).get('audio-host')!=='1')return false;
 parent.postMessage({channel:CHANNEL,target},location.origin);return true;
}
// Keep one audio owner alive while reusing each mode's actual document renderer.
export function createModeHost({app,audio,getDesign,navigate}){
 let frame,transition;
 window.__MALA_NAUKA_AUDIO_HOST__=audio;
 const open=mode=>{
  transition?.cancel();frame?.remove();window.__MALA_NAUKA_AUDIO_HOST_ACTIVE__=true;
  audio.setScene({view:mode+'-settings',mode,playing:false,paused:false});
  app.dataset.mode=mode;app.dataset.view='wizard';app.replaceChildren();
  frame=document.createElement('iframe');frame.dataset.modeHost=mode;frame.dataset.mnDecoration='true';
  frame.title='Mała Nauka · '+mode;frame.allow='autoplay';
  frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:4;background:#e6f6ff';
  const url=new URL('../'+FOLDERS[mode]+'/',import.meta.url);url.searchParams.set('audio-host','1');frame.src=url.href;app.append(frame);
 };
 const close=target=>{
  const old=frame;if(!old){navigate(target);return;}
  const from=old.contentDocument?.documentElement.dataset.dsView||old.dataset.modeHost+'-settings';
  old.dataset.mnDecoration='true';document.body.append(old);frame=null;
  window.__MALA_NAUKA_AUDIO_HOST_ACTIVE__=false;
  window.__MALA_NAUKA_EXTERNAL_TRANSITION__=true;
  navigate(target);
  audio.setScene({view:target,mode:app.dataset.mode,playing:false,paused:false});
  const motion=transitionMotion(getDesign()?.motion,from,target==='history'?'progress':target);
  if(motion.style==='blob'&&motion.speed!==0&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
   transition=playScreenBlob({incoming:app,liveOutgoing:old,config:getDesign()?.exitTransition,speed:motion.speed,onFinish:()=>{old.remove();window.__MALA_NAUKA_EXTERNAL_TRANSITION__=false;}});
  }else{old.remove();requestAnimationFrame(()=>{window.__MALA_NAUKA_EXTERNAL_TRANSITION__=false;});}
 };
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame?.contentWindow||event.data?.channel!==CHANNEL)return;
  const target=event.data.target;
  if(target?.endsWith('-settings')&&Object.hasOwn(FOLDERS,target.slice(0,-9)))open(target.slice(0,-9));
  else if(['home','settings','players'].includes(target))close(target);
 });
 return {open,close};
}
