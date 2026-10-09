import {partSample} from '../shared/part-samples.mjs';
import {assetUrl} from '../shared/asset-loader.mjs';
import {createJellyV4} from '../shared/jelly-v4.mjs';
import {familyTokens} from '../shared/building-blocks.mjs';
import {declarations,visualValue} from '../shared/element-system.mjs';
import {syncElementMotion} from '../shared/element-motion.mjs';
import {syncElementSurface} from '../shared/surface-effects.mjs';
import {animateStateChange} from '../shared/state-motion.mjs';

export function mountPartSample(library,sample){
 const settings=()=>({catalog:library.catalog(),assetURL:assetUrl,mode:library.mode,pin:library.pin!==false,pinDigits:library.pinDigits||0,playerCount:library.playerCount||3,selectedPlayer:library.selectedPlayer??-1,choice:library.choice,percent:library.percent});
 const render=()=>{
  sample.innerHTML=partSample(library.part,settings());
  let index=0;
  const scratch=document.createElement('div');
  const apply=()=>{for(const node of sample.querySelectorAll('[data-ds-recipe]')){
   node.dataset.dsElement||='sample-part-'+index++;
   const recipe=node.dataset.dsRecipe,style=visualValue(library.config,'',{id:node.dataset.dsElement,kind:node.dataset.dsKind,recipe,mode:library.mode});
   scratch.style.cssText=declarations(style);
   for(let i=0;i<scratch.style.length;i++){const key=scratch.style[i];node.style.setProperty(key,scratch.style.getPropertyValue(key),scratch.style.getPropertyPriority(key));}
   if(style.text&&node.dataset.dsKind==='text'){
    const text=node.querySelector('span')||node;if(!text.querySelector('input'))text.textContent=style.text;
   }
   if(['image','background'].includes(node.dataset.dsKind)){
    const image=node.matches('img')?node:node.querySelector('image,img');
    if(style.asset){if(image)image.setAttribute(image.localName==='image'?'href':'src',assetUrl(style.asset));else node.style.backgroundImage=`url("${assetUrl(style.asset)}")`;}
    if(style.fit)node.style.objectFit=style.fit;
    if(style.imageX!==undefined||style.imageY!==undefined){node.style.objectPosition=`${style.imageX??50}% ${style.imageY??50}%`;node.style.backgroundPosition=node.style.objectPosition;}
    if(style.imageScale!==undefined)node.style.scale=String(style.imageScale);
   }
   syncElementMotion(node,style);syncElementSurface(node,style);
  }};
  apply();
  const observers=[];
  for(const node of sample.querySelectorAll('.pin-mode,.ds-jelly')){
   const pin=node.matches('.pin-mode'),jelly=createJellyV4({indicatorSelector:pin?'.pin-mode-indicator':'.live-jelly-indicator',getTokens:()=>familyTokens(library.config,library.mode,'jelly')});
   const inputs=[...node.querySelectorAll('input')];let active=Math.max(0,inputs.findIndex(i=>i.checked));
   const choose=value=>{active=value;inputs.forEach((input,i)=>input.checked=i===value);jelly.update(node,value,{animate:true});apply();if(pin){library.pin=value===0;updatePinFields();}else library.choice=value;};
   node.addEventListener('change',()=>choose(inputs.findIndex(i=>i.checked)));
   let suppress=0;jelly.setupDrag(node,{getActiveIndex:()=>active,commitIndex:choose,captureOnDrag:true,suppressClick:ms=>suppress=performance.now()+ms});
   node.addEventListener('click',e=>{if(performance.now()<suppress){e.preventDefault();e.stopPropagation();}},true);
   jelly.update(node,active,{animate:false});
   const observer=new ResizeObserver(()=>jelly.update(node,active,{animate:false}));observer.observe(node);observers.push(observer);
  }
  library.observer={disconnect:()=>observers.forEach(o=>o.disconnect())};
  function updatePinFields(){
   const fields=sample.querySelector('.pin-fields');if(!fields)return;
   const card=fields.closest('.pin-card'),height=card?.getBoundingClientRect().height;
   fields.outerHTML=partSample('container-pin-fields',settings());
   card?.classList.toggle('pin-no-code',!library.pin);apply();if(card)animateStateChange(card,height);
  }
 };
 library.observer?.disconnect();render();
 sample.addEventListener('click',e=>{
  const node=e.target.closest('button');if(!node)return;
  if(node.dataset.action==='pin-digit'||node.dataset.action==='pin-backspace'){
   library.pinDigits=Math.max(0,Math.min(4,(library.pinDigits||0)+(node.dataset.action==='pin-digit'?1:-1)));
   library.observer?.disconnect();render();return;
  }
  if(node.dataset.action==='submit-pin'){library.pinDigits=0;library.observer?.disconnect();render();return;}
  if(node.hasAttribute('data-sample-player')){
   library.selectedPlayer=+node.dataset.samplePlayer;
   sample.querySelector('.player-grid')?.classList.add('has-selection');
   sample.querySelectorAll('[data-sample-player]').forEach(card=>{const active=+card.dataset.samplePlayer===library.selectedPlayer;card.classList.toggle('is-selected',active);card.setAttribute('aria-pressed',String(active));});
   library.observer?.disconnect();render();return;
  }
  if(node.hasAttribute('data-sample-avatar')){
   sample.querySelectorAll('[data-sample-avatar]').forEach(card=>{const active=card===node;card.classList.toggle('is-selected',active);card.setAttribute('aria-pressed',String(active));});return;
  }
  if(node.hasAttribute('data-sample-press')){
   const active=node.getAttribute('aria-pressed')!=='true';node.setAttribute('aria-pressed',String(active));node.classList.toggle('selected',active);
   syncElementMotion(node,visualValue(library.config,'',{id:node.dataset.dsElement,kind:node.dataset.dsKind,recipe:node.dataset.dsRecipe,mode:library.mode}));
  }
 });
}
