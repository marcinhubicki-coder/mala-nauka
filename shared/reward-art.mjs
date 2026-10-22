import {REWARD_PART_ART} from './reward-parts-assets.mjs';
import {assetUrl} from './asset-loader.mjs';

// Every reward uses this artboard and ground line, including all upgrade states.
export const REWARD_ARTBOARD=Object.freeze({width:512,height:512,center:256,baseline:460});
export const CUP_ORNAMENTS=Object.freeze(['cup-gem','cup-laurel','cup-ribbon','cup-foot-jewels','cup-crest','cup-chain','cup-wing','cup-orbit','cup-crown']);
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const box=(id,x,y,width,height,extra='')=>`<image href="${escape(assetUrl(REWARD_PART_ART[id].path))}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" ${extra}/>`;
const pair=(id,x,y,w,h)=>box(id,x,y,w,h)+box(id,x,y,w,h,'transform="translate(512 0) scale(-1 1)"');
const ornament={
 'cup-gem':()=>box('cup-gem',230,215,52,52),
 'cup-laurel':()=>pair('cup-laurel',110,204,75,150),
 'cup-ribbon':()=>box('cup-ribbon',160,291,192,66),
 'cup-foot-jewels':()=>box('cup-foot-jewels',201,423,110,40),
 'cup-crest':()=>box('cup-crest',232,161,48,48),
 'cup-chain':()=>box('cup-chain',198,267,116,62),
 'cup-wing':()=>pair('cup-wing',30,155,105,210),
 'cup-orbit':()=>box('cup-orbit',36,214,440,156),
 'cup-crown':()=>box('cup-crown',191,91,130,76)
};
const part=(id,markup,style='')=>`<g data-reward-part="${id}" ${style?`style="${style}"`:''}>${markup}</g>`;

export function cupOrnaments(level=1,choices=[],{knowledge=false,choice=0}={}){
 const count=knowledge?Math.max(0,Math.min(9,level-1)):Math.max(0,Math.min(9,(level-1)*3));
 // Choices only change the order of discoveries. The finished cup always has all nine parts.
 const chosen=[...new Set(choices.filter(n=>Number.isInteger(n)&&n>=0&&n<9))];
 const fallback=Array.from({length:9},(_,i)=>i);
 if(knowledge)return [...new Set([...chosen,...fallback])].slice(0,count).sort((a,b)=>a-b).map(i=>CUP_ORNAMENTS[i]);
 const result=[];for(let stage=0;stage<Math.min(3,level-1);stage++){
  const bit=(choice>>Math.max(0,level-2-stage))&1,order=bit?[...fallback.slice(3),...fallback.slice(0,3)]:fallback;
  result.push(...order.filter(n=>!result.includes(n)).slice(0,3));
 }
 return result.sort((a,b)=>a-b).map(i=>CUP_ORNAMENTS[i]);
}

export function rewardArt({level=1,medal=false,choices=[],knowledge=false,choice=0,label,className='adventure-award'}={}){
 const tier=Math.max(1,Math.min(medal?3:knowledge?10:4,Number(level)||1));
 let layers;
 if(medal){
  const filter=['sepia(.9) saturate(1.3) hue-rotate(-10deg) brightness(.84)','grayscale(.95) brightness(1.08)','sepia(.95) saturate(2) hue-rotate(2deg) brightness(1.12)'][tier-1];
  layers=part('medal-ribbon',box('medal-ribbon',166,32,180,164))+part('medal-body',box('medal-body',110,160,292,300),`filter:${filter}`);
 }else{
  const ids=cupOrnaments(tier,choices,{knowledge,choice}),back=['cup-orbit','cup-wing'];
  layers=ids.filter(id=>back.includes(id)).map(id=>part(id,ornament[id]())).join('')+
   part('cup-base',box('cup-base',76,139,360,321))+
   ids.filter(id=>!back.includes(id)).map(id=>part(id,ornament[id]())).join('');
 }
 const name=label||(medal?['Medal brązowy','Medal srebrny','Medal złoty'][tier-1]:`${knowledge?'Puchar wiedzy':'Trofeum'} · etap ${tier}/${knowledge?10:4}`);
 return `<svg class="${escape(className)} reward-art" data-reward-art="${medal?'medal':knowledge?'knowledge':'trophy'}" data-reward-level="${tier}" data-reward-baseline="460" viewBox="0 0 512 512" role="img" aria-label="${escape(name)}">${layers}</svg>`;
}

export function morphRewardParts(current,next,{reduced=false}={}){
 const pending=[];let added=0;
 for(const part of next.querySelectorAll('[data-reward-part]')){
  const old=current.querySelector(`[data-reward-part="${part.dataset.rewardPart}"]`);
  if(old){const from=old.style.filter||'none',to=part.style.filter||'none';old.style.filter=to;part.replaceWith(old);if(!reduced&&from!==to)pending.push(old.animate([{filter:from},{filter:to}],{duration:850,easing:'ease-in-out'}).finished.catch(()=>{}));}
  else {const delay=added++*160;if(!reduced)pending.push(part.animate([{opacity:0,transform:'translateY(12px) scale(.86)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:850,delay,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'}).finished.catch(()=>{}));}
 }
 return {added,finished:Promise.all(pending)};
}
