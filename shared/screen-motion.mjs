export const DEFAULT_MOTION={style:'fade',duration:320,distance:18,easing:'ease-out'};
export const MOTION_STYLES=['none','fade','slide'];
export const MOTION_EASINGS=['ease','ease-out','ease-in-out','linear'];
export function validateMotion(value){
  if(!value||Object.keys(value).some(key=>!Object.hasOwn(DEFAULT_MOTION,key))||!MOTION_STYLES.includes(value.style)||!MOTION_EASINGS.includes(value.easing)||!Number.isFinite(value.duration)||value.duration<0||value.duration>2000||!Number.isFinite(value.distance)||value.distance<0||value.distance>120)throw Error('Nieprawidłowe ustawienia przejść ekranów.');
  return value;
}
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
  constructor({setTimer=setTimeout,clearTimer=clearTimeout}={}){this.setTimer=setTimer;this.clearTimer=clearTimer;this.generation=0;this.pending=null;}
  cancel(){this.generation++;if(this.pending){this.clearTimer(this.pending.timer);this.pending.resolve(false);this.pending=null;}}
  start(){this.cancel();return this.generation;}
  valid(generation){return generation===this.generation;}
  pause(ms,generation){if(!this.valid(generation))return Promise.resolve(false);return new Promise(resolve=>{this.pending={resolve,timer:this.setTimer(()=>{this.pending=null;resolve(this.valid(generation));},ms)};});}
}
