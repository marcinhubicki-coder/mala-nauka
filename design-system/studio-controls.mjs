// Fixed tooltips escape every scrolling pane and stacking context. Native
// title bubbles are removed so each control has one accessible description.
let mounted=false;
export function mountStudioControls(){
 if(mounted)return;mounted=true;
 let bubble,target,timer;
 const clear=()=>{clearTimeout(timer);bubble?.remove();bubble=null;target=null;};
 const clean=node=>{if(node?.nodeType!==1)return;const rows=[...(node.matches('[data-tooltip]')?[node]:[]),...node.querySelectorAll('[data-tooltip]')];for(const n of rows)n.removeAttribute('title');};
 const show=node=>{
  if(target===node)return;clear();target=node;
  const reveal=()=>{if(!node.isConnected)return;const rect=node.getBoundingClientRect();bubble=document.createElement('div');bubble.className='studio-tooltip-layer';bubble.setAttribute('role','tooltip');bubble.textContent=node.dataset.tooltip;document.body.append(bubble);const size=bubble.getBoundingClientRect();bubble.style.left=Math.max(10,Math.min(innerWidth-size.width-10,rect.left+(rect.width-size.width)/2))+'px';bubble.style.top=Math.max(8,rect.top-size.height-10)+'px';};
  timer=setTimeout(reveal,180);
 };
 document.addEventListener('pointerover',e=>{const node=e.target.closest('[data-tooltip]');if(node)show(node);});
 document.addEventListener('pointerout',e=>{if(target&&!target.contains(e.relatedTarget))clear();});
 document.addEventListener('focusin',e=>{const node=e.target.closest('[data-tooltip]');if(node)show(node);else clear();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')clear();});
 document.addEventListener('scroll',clear,true);window.addEventListener('blur',clear);
 clean(document.documentElement);
 const observer=new MutationObserver(rows=>{for(const row of rows)for(const node of row.addedNodes)clean(node);if(target&&!target.isConnected)clear();});observer.observe(document.body,{childList:true,subtree:true});
}
