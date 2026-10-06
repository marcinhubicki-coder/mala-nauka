import {createJellyV4} from '../shared/jelly-v4.mjs';
import {html} from './preview-model.mjs';
const jelly=createJellyV4({indicatorSelector:'.studio-jelly-ink'});
const mounted=new WeakSet();
export function jellyChoices(id,label,choices,value){
 return `<div class="studio-choice-field choice-${id}"><span class="studio-choice-caption">${html(label)}</span><div class="studio-choice-scroll"><div class="studio-jelly" data-jelly-nav="${id}" role="radiogroup" aria-label="${html(label)}"><i class="studio-jelly-ink" aria-hidden="true"></i>${choices.map(([key,name])=>`<label><input type="radio" name="studio-${id}" data-studio-nav="${id}" value="${html(key)}" ${key===value?'checked':''}><span>${html(name)}</span></label>`).join('')}</div></div></div>`;
}
export function mountJellies(root,previous=new Map()){
 for(let node of root.querySelectorAll('[data-jelly-nav]')){
  const old=previous.get(node.dataset.jellyNav),inputs=[...node.querySelectorAll('input')],value=inputs.find(i=>i.checked)?.value;
  if(old&&[...old.querySelectorAll('input')].map(i=>i.value).join('|')===inputs.map(i=>i.value).join('|')){
   const buffer=old.closest('.jelly-v4-buffer');node.replaceWith(buffer||old);node=old;
   for(const input of node.querySelectorAll('input'))input.checked=input.value===value;
  }
  const active=()=>[...node.querySelectorAll('input')].findIndex(i=>i.checked);
  jelly.update(node,active(),{animate:mounted.has(node)});
  const revealSelection=()=>{const selected=node.querySelector('input:checked')?.closest('label'),scroller=node.closest('.studio-choice-scroll');
    if(selected&&scroller){const left=selected.offsetLeft,right=left+selected.offsetWidth;if(left<scroller.scrollLeft)scroller.scrollLeft=Math.max(0,left-8);else if(right>scroller.scrollLeft+scroller.clientWidth)scroller.scrollLeft=right-scroller.clientWidth+8;}};
  revealSelection();
  if(!mounted.has(node)){
   mounted.add(node);let suppress=0;
   jelly.setupDrag(node,{getActiveIndex:active,captureOnDrag:true,suppressClick:ms=>suppress=performance.now()+ms,commitIndex:index=>{const input=node.querySelectorAll('input')[index];if(input&&!input.checked){input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));}}});
   node.addEventListener('click',e=>{if(performance.now()<suppress){e.preventDefault();e.stopPropagation();}},true);
   const observer=new ResizeObserver(()=>{if(node.isConnected){jelly.update(node,active(),{animate:false});revealSelection();}else observer.disconnect();});observer.observe(node);observer.observe(node.closest('.studio-choice-scroll'));
  }
 }
}
