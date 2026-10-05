export const DEFAULT_MOTION={style:'fade',duration:320,distance:18,easing:'ease-out'};
export const MOTION_STYLES=['none','fade','slide'];
export const MOTION_EASINGS=['ease','ease-out','ease-in-out','linear'];
export function validateMotion(value){
  if(!value||Object.keys(value).some(key=>!Object.hasOwn(DEFAULT_MOTION,key)&&key!=='transitions')||!MOTION_STYLES.includes(value.style)||!MOTION_EASINGS.includes(value.easing)||!Number.isFinite(value.duration)||value.duration<0||value.duration>2000||!Number.isFinite(value.distance)||value.distance<0||value.distance>120)throw Error('Nieprawidłowe ustawienia przejść ekranów.');
  if(value.transitions){if(typeof value.transitions!=='object'||Array.isArray(value.transitions)||Object.keys(value.transitions).length>250)throw Error('Nieprawidłowe połączenia animacji.');for(const [key,row]of Object.entries(value.transitions)){if(!/^[a-z0-9-]+--[a-z0-9-]+$/.test(key))throw Error('Nieprawidłowa para ekranów.');if(row.inheritReverse===true){if(Object.keys(row).length!==1)throw Error('Powrót dziedziczy ustawienia drugiego kierunku.');}else validateMotion({...row,transitions:undefined});}}
  return value;
}
export function transitionMotion(config,from,to){const base=Object.fromEntries(Object.keys(DEFAULT_MOTION).map(k=>[k,config?.[k]??DEFAULT_MOTION[k]])),key=`${from}--${to}`,row=config?.transitions?.[key],source=row?.inheritReverse?config?.transitions?.[`${to}--${from}`]:row;return Object.fromEntries(Object.keys(DEFAULT_MOTION).map(k=>[k,source?.[k]??base[k]]));}
export function motionFrames(motion){
  validateMotion(motion);
  if(motion.style==='none'||motion.duration===0)return [];
  return motion.style==='slide'?[{opacity:0,transform:`translateX(${motion.distance}px)`},{opacity:1,transform:'translateX(0px)'}]:[{opacity:0},{opacity:1}];
}
export function animateScreen(node,motion=DEFAULT_MOTION,{reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false}={}){
  const frames=motionFrames(motion);if(reduced||!frames.length||!node?.animate)return null;
  return node.animate(frames,{duration:motion.duration,easing:motion.easing});
}
// Both cancellation and changing screens invalidate callbacks still waiting to run.
export class PlaybackClock {
  constructor({setTimer=(callback,delay)=>globalThis.setTimeout(callback,delay),clearTimer=id=>globalThis.clearTimeout(id)}={}){this.setTimer=setTimer;this.clearTimer=clearTimer;this.generation=0;this.pending=null;}
  cancel(){this.generation++;if(this.pending){this.clearTimer(this.pending.timer);this.pending.resolve(false);this.pending=null;}}
  start(){this.cancel();return this.generation;}
  valid(generation){return generation===this.generation;}
  pause(ms,generation){if(!this.valid(generation))return Promise.resolve(false);return new Promise(resolve=>{this.pending={resolve,timer:this.setTimer(()=>{this.pending=null;resolve(this.valid(generation));},ms)};});}
}
