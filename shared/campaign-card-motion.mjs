import {syncCampaignCardShape} from './campaign-card-shape.mjs';
const states=new WeakMap();
const contentSelector='.campaign-step-number,.campaign-step-eyebrow,.campaign-task-launch,.campaign-story,.campaign-keepsakes,.campaign-next-world';
const entries=card=>[...card.querySelectorAll(contentSelector)].filter(n=>!n.hidden&&!n.parentElement.closest(contentSelector));
const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));

// A new selection takes over the currently painted height, including an
// interrupted unfolding. The decoded frost and its outline keep their identity.
export async function changeCampaignCard(card,html,{animate=true}={}){
 if(card.mnCardHTML===html)return states.get(card)?.done;
 const height=card.getBoundingClientRect().height,previous=states.get(card),hadContent=card.mnCardHTML!==undefined;
 card.style.height=height+'px';previous?.cancel();card.mnCardHTML=html;
 card.dataset.campaignFlow='changing';card.dataset.mnManagedPresence='true';
 const animations=new Set();let dead=false;
 const play=(node,frames,options)=>{const a=node.animate(frames,options);animations.add(a);return a.finished.catch(()=>{});};
 const cancel=()=>{dead=true;for(const a of animations){if(a.effect?.target!==card){try{a.commitStyles();}catch{/* A replaced outgoing node has no paint to retain. */}}a.cancel();}animations.clear();};
 const row={cancel,done:null};states.set(card,row);
 const reduced=!animate||matchMedia('(prefers-reduced-motion:reduce)').matches;
 row.done=(async()=>{
  if(hadContent&&!reduced){await Promise.all(entries(card).map(node=>play(node,[{opacity:getComputedStyle(node).opacity},{opacity:0}],{duration:110,easing:'ease-in',fill:'both'})));if(dead)return;}
  const template=document.createElement('template');template.innerHTML=html;
  for(const selector of ['.campaign-card-frame','.campaign-card-frost']){
   const incoming=template.content.querySelector(selector),existing=card.querySelector(selector);
   if(incoming&&existing&&(selector.includes('frame')||incoming.querySelector('img')?.getAttribute('src')===existing.querySelector('img')?.getAttribute('src')))incoming.replaceWith(existing);
  }
  card.replaceChildren(template.content);
  const incoming=entries(card);if(!reduced)for(const node of incoming)node.style.opacity='0';
  // Apply the new contract before measuring its natural height. Its content is
  // hidden and the outer frame retains the old height throughout preparation.
  syncCampaignCardShape(card);if(!reduced)await frame();if(dead)return;
  card.style.height='auto';const target=card.getBoundingClientRect().height;card.style.height=height+'px';syncCampaignCardShape(card);
  if(!reduced){
   const resize=play(card,[{height:height+'px'},{height:target+'px'}],{duration:480,easing:'cubic-bezier(.22,.85,.25,1)',fill:'both'});
   const reveal=incoming.map((node,i)=>play(node,[{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,delay:35+i*55,easing:'cubic-bezier(.22,.85,.25,1)',fill:'both'}));
   await Promise.all([resize,...reveal]);if(dead||!card.isConnected)return;
  }
  // Commit the endpoint before cancelling the height effect; no rounded
  // offsetHeight measurement or one-frame fallback to the starting size.
  card.style.height=target+'px';for(const a of animations)a.cancel();animations.clear();
  for(const node of incoming)node.style.removeProperty('opacity');card.style.height='';syncCampaignCardShape(card);
  delete card.dataset.campaignFlow;if(states.get(card)===row)states.delete(card);
 })();return row.done;
}
