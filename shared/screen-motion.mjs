export const DEFAULT_MOTION={style:'blur',duration:320,distance:18,easing:'ease-out',speed:1};
export const MOTION_STYLES=['none','fade','blur','blob','slide'];
export const MOTION_EASINGS=['ease','ease-out','ease-in-out','linear'];
export function validateMotion(value){
  if(!value||Object.keys(value).some(key=>!Object.hasOwn(DEFAULT_MOTION,key)&&!['transitions','defaults'].includes(key))||(value.speed!==undefined&&(!Number.isFinite(value.speed)||value.speed<0||value.speed>2))||!MOTION_STYLES.includes(value.style)||!MOTION_EASINGS.includes(value.easing)||!Number.isFinite(value.duration)||value.duration<0||value.duration>2000||!Number.isFinite(value.distance)||value.distance<0||value.distance>120)throw Error('Nieprawidłowe ustawienia przejść ekranów.');
  if(value.defaults){if(Object.keys(value.defaults).some(k=>!['normal','game','blob'].includes(k)))throw Error('Nieprawidłowe domyślne przejścia.');for(const row of Object.values(value.defaults))validateMotion(row);}
  if(value.transitions){if(typeof value.transitions!=='object'||Array.isArray(value.transitions)||Object.keys(value.transitions).length>250)throw Error('Nieprawidłowe połączenia animacji.');for(const [key,row]of Object.entries(value.transitions)){if(!/^[a-z0-9-]+--[a-z0-9-]+$/.test(key))throw Error('Nieprawidłowa para ekranów.');if(row.inheritReverse===true){if(Object.keys(row).length!==1)throw Error('Powrót dziedziczy ustawienia drugiego kierunku.');}else validateMotion({...row,transitions:undefined});}}
  return value;
}
export function defaultBlobRoute(from,to){return (to==='home'&&(/-settings$/.test(from)||from==='progress'))||(to==='progress'&&(from==='home'||/-results$/.test(from)));}
export function transitionMotion(config,from,to){const base=Object.fromEntries(Object.keys(DEFAULT_MOTION).map(k=>[k,config?.[k]??DEFAULT_MOTION[k]])),key=`${from}--${to}`,row=config?.transitions?.[key],source=row?.inheritReverse?config?.transitions?.[`${to}--${from}`]:row;const end=((/-initial$|-correct$|-wrong$/.test(from)&&to===from.replace(/-(initial|correct|wrong)$/,'-results'))||(/-settings$/.test(from)&&to===from.replace(/-settings$/,'-initial')))?{style:'blur',duration:1500}:defaultBlobRoute(from,to)?{style:'blob'}:{};const fallback=config?.defaults?.[end.style==='blur'?'game':end.style==='blob'?'blob':'normal'];const result=Object.fromEntries(Object.keys(DEFAULT_MOTION).map(k=>[k,source?.[k]??fallback?.[k]??end[k]??base[k]]));if(result.style==='slide')result.style='fade';return result;}
export function motionFrames(motion){
  validateMotion(motion);
  if(['none','blob'].includes(motion.style)||motion.speed===0||motion.duration===0)return [];
  return motion.style==='blur'?[{opacity:0,filter:'blur(28px)'},{opacity:1,filter:'blur(0px)'}]:motion.style==='slide'?[{opacity:0,transform:`translateX(${motion.distance}px)`},{opacity:1,transform:'translateX(0px)'}]:[{opacity:0},{opacity:1}];
}
export function animateScreen(node,motion=DEFAULT_MOTION,{reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false}={}){
  const frames=motionFrames(motion);if(reduced||!frames.length||!node?.animate)return null;
  return node.animate(frames,{duration:motion.duration/(motion.speed??1),easing:motion.easing});
}
// Both cancellation and changing screens invalidate callbacks still waiting to run.
export class PlaybackClock {
  constructor({setTimer=(callback,delay)=>globalThis.setTimeout(callback,delay),clearTimer=id=>globalThis.clearTimeout(id)}={}){this.setTimer=setTimer;this.clearTimer=clearTimer;this.generation=0;this.pending=null;}
  cancel(){this.generation++;if(this.pending){this.clearTimer(this.pending.timer);this.pending.resolve(false);this.pending=null;}}
  start(){this.cancel();return this.generation;}
  valid(generation){return generation===this.generation;}
  pause(ms,generation){if(!this.valid(generation))return Promise.resolve(false);return new Promise(resolve=>{this.pending={resolve,timer:this.setTimer(()=>{this.pending=null;resolve(this.valid(generation));},ms)};});}
}
