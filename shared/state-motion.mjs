import {visualValue} from './element-system.mjs';
const stateAnimations=new WeakMap();
export function animateStateChange(node,oldHeight){
 if(!node||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 stateAnimations.get(node)?.();
 const style=visualValue(globalThis.__MALA_NAUKA_DESIGN__||{},document.documentElement.dataset.dsView,{id:node.dataset.dsElement,kind:node.dataset.dsKind,recipe:node.dataset.dsRecipe});
 const height=node.getBoundingClientRect().height,duration=style.stateDuration??260;if(!duration||Math.abs(height-oldHeight)<.5)return;
 // CSS transitions also interpolate local !important heights and return to auto.
 const prior=node.style.getPropertyValue('height'),priority=node.style.getPropertyPriority('height'),transition=node.style.transition;
 let timer,frame;const clean=()=>{clearTimeout(timer);cancelAnimationFrame(frame);node.style.transition=transition;if(prior)node.style.setProperty('height',prior,priority);else node.style.removeProperty('height');stateAnimations.delete(node);};
 node.style.transition='none';node.style.setProperty('height',oldHeight+'px','important');void node.offsetHeight;
 frame=requestAnimationFrame(()=>{node.style.transition=`height ${duration}ms cubic-bezier(.2,.75,.25,1)`;node.style.setProperty('height',height+'px','important');timer=setTimeout(clean,duration+30);});stateAnimations.set(node,clean);
}
function presenceFrames(style,exit=false){
 const d=style.stateDistance??6,kind=exit?style.exitAnimation:style.enterAnimation;
 const away=kind==='pulse'?{opacity:0,scale:'.9'}:kind==='sway'?{opacity:0,rotate:`${d/3}deg`}: {opacity:0,translate:`0 ${d}px`};
 const rest=kind==='pulse'?{opacity:1,scale:'1'}:kind==='sway'?{opacity:1,rotate:'0deg'}:{opacity:1,translate:'0 0'};return exit?[rest,away]:[away,rest];
}
const boxes=new WeakMap(),styles=new WeakMap();
const visibility=new WeakMap();
function exitGhost(node,style,box){
 if(!box?.width||!box.height||!node.animate)return;
 const ghost=node.cloneNode(true);ghost.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));ghost.removeAttribute('id');ghost.removeAttribute('hidden');ghost.dataset.mnDecoration='exit';
 Object.assign(ghost.style,{position:'fixed',display:box.display||'block',left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px',margin:'0',pointerEvents:'none',zIndex:1100});document.body.append(ghost);
 const d=style.stateDistance??6,a=ghost.animate(presenceFrames(style,true),{duration:style.stateDuration??260,easing:'ease-in',fill:'forwards'});a.finished.catch(()=>{}).finally(()=>ghost.remove());
}
export function rememberPresence(node,style){
 const conditional=node.matches('.spelling-category-panel,.english-category-panel,[data-dictation-panel]');
 if(conditional)style={enterAnimation:'enter',exitAnimation:'enter',...style};
 if(!style.enterAnimation&&!style.exitAnimation)return;
 const rect=node.getBoundingClientRect(),visible=Boolean(rect.width&&rect.height),before=visibility.get(node);
 if(before!==undefined&&before!==visible&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
  if(visible&&style.enterAnimation!=='none')node.animate(presenceFrames(style),{duration:style.stateDuration??260,easing:'ease-out'});
  else if(!visible&&style.exitAnimation!=='none')exitGhost(node,style,boxes.get(node));
 }
 visibility.set(node,visible);styles.set(node,style);if(visible)boxes.set(node,{left:rect.left,top:rect.top,width:rect.width,height:rect.height,display:getComputedStyle(node).display});
}
export function animatePresence(records){
 if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 let ghosts=0;
 for(const record of records){if(record.target.closest?.('[data-mn-decoration]'))continue;
  for(const node of record.removedNodes||[]){const style=styles.get(node),box=boxes.get(node);if(!style||style.exitAnimation==='none'||!style.exitAnimation||!box?.width||ghosts++>=2)continue;exitGhost(node,style,box);}
  for(const node of record.addedNodes||[]){const style=styles.get(node);if(!style||style.enterAnimation==='none'||!style.enterAnimation||!node.animate)continue;node.animate(presenceFrames(style),{duration:style.stateDuration??260,easing:'ease-out'});}
 }
}
