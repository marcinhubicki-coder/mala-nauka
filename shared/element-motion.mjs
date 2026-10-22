// Per-element motion uses the same saved style contract as geometry and visibility.
export const ELEMENT_MOTIONS={none:'Bez animacji',float:'Spokojne unoszenie',pulse:'Miękki puls',sway:'Kołysanie',enter:'Wejście z przesunięciem',fade:'Płynne pojawienie',bump:'Pojawienie i bump'};
// Shared by continuous element motion and finite, renderer-owned entrances.
export function elementEntranceFrames(kind,distance=6){
 if(kind==='bump')return [{opacity:0,scale:'1',offset:0},{opacity:1,scale:'1',offset:.3},{opacity:1,scale:String(1+distance/100),offset:.57},{opacity:1,scale:'.97',offset:.78},{opacity:1,scale:'1',offset:1}];
 if(kind==='fade')return [{opacity:0},{opacity:1}];
 return [{opacity:0,translate:`0 ${distance}px`},{opacity:1,translate:'0 0'}];
}
const active=new Map();
export function syncElementMotion(node,style={}){
 for(const [old,row]of active)if(!old.isConnected){row.animation.cancel();active.delete(old);}
 const selected=node.matches?.(':is(.selected,.active,.is-active,.is-selected,[aria-pressed=true],label:has(input:checked))'),kind=(selected?style.activeAnimation:style.idleAnimation)||style.animation||'none',prefix=(selected&&style.activeAnimation?'active':!selected&&style.idleAnimation?'idle':'animation'),distance=style[prefix+'Distance']??style.animationDistance??6,duration=style[prefix+'Duration']??style.animationDuration??1600,signature=JSON.stringify([kind,duration,distance]);
 if(active.get(node)?.signature===signature){const a=active.get(node).animation;if(document.hidden||node.closest('.paused')||style.visibility==='hidden'||style.visibility==='removed')a.pause();else if(a.playState==='paused')a.play();return;}
 active.get(node)?.animation.cancel();active.delete(node);
 if(kind==='none'||duration===0||!ELEMENT_MOTIONS[kind]||!node.animate||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||active.size>=16)return;
 const d=distance;
 const frames=kind==='bump'?elementEntranceFrames(kind,d):kind==='fade'?[{opacity:0},{opacity:1}]:kind==='float'?[{transform:'translateY(0)'},{transform:`translateY(${-d}px)`},{transform:'translateY(0)'}]:kind==='pulse'?[{transform:'scale(1)'},{transform:`scale(${1+d/200})`},{transform:'scale(1)'}]:kind==='sway'?[{transform:`rotate(${-d/3}deg)`},{transform:`rotate(${d/3}deg)`},{transform:`rotate(${-d/3}deg)`}]:[{transform:`translateY(${d}px)`,opacity:0},{transform:'translateY(0)',opacity:1}];
 const animation=node.animate(frames,{duration,iterations:['enter','fade','bump'].includes(kind)?1:Infinity,easing:'ease-in-out',composite:['enter','fade','bump'].includes(kind)?'replace':'add'});
 if(document.hidden||node.closest('.paused'))animation.pause();
 active.set(node,{signature,animation});
}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{for(const [node,row]of active){if(document.hidden||node.closest('.paused'))row.animation.pause();else row.animation.play();}});
