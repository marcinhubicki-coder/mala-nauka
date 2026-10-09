// Per-element motion uses the same saved style contract as geometry and visibility.
export const ELEMENT_MOTIONS={none:'Bez animacji',float:'Spokojne unoszenie',pulse:'Miękki puls',sway:'Kołysanie',enter:'Wejście z przesunięciem',fade:'Płynne pojawienie'};
const active=new Map();
export function syncElementMotion(node,style={}){
 for(const [old,row]of active)if(!old.isConnected){row.animation.cancel();active.delete(old);}
 const selected=node.matches?.(':is(.selected,.active,.is-active,.is-selected,[aria-pressed=true],label:has(input:checked))'),kind=(selected?style.activeAnimation:style.idleAnimation)||style.animation||'none',signature=JSON.stringify([kind,style.animationDuration,style.animationDistance]);
 if(active.get(node)?.signature===signature){const a=active.get(node).animation;if(document.hidden||node.closest('.paused')||style.visibility==='hidden'||style.visibility==='removed')a.pause();else if(a.playState==='paused')a.play();return;}
 active.get(node)?.animation.cancel();active.delete(node);
 if(kind==='none'||!ELEMENT_MOTIONS[kind]||!node.animate||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||active.size>=16)return;
 const d=style.animationDistance??6,duration=style.animationDuration??1600;
 const frames=kind==='fade'?[{opacity:0},{opacity:1}]:kind==='float'?[{transform:'translateY(0)'},{transform:`translateY(${-d}px)`},{transform:'translateY(0)'}]:kind==='pulse'?[{transform:'scale(1)'},{transform:`scale(${1+d/200})`},{transform:'scale(1)'}]:kind==='sway'?[{transform:`rotate(${-d/3}deg)`},{transform:`rotate(${d/3}deg)`},{transform:`rotate(${-d/3}deg)`}]:[{transform:`translateY(${d}px)`,opacity:0},{transform:'translateY(0)',opacity:1}];
 const animation=node.animate(frames,{duration,iterations:['enter','fade'].includes(kind)?1:Infinity,easing:'ease-in-out',composite:['enter','fade'].includes(kind)?'replace':'add'});
 if(document.hidden||node.closest('.paused'))animation.pause();
 active.set(node,{signature,animation});
}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{for(const [node,row]of active){if(document.hidden||node.closest('.paused'))row.animation.pause();else row.animation.play();}});
