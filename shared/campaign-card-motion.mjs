const states=new WeakMap();
const contentSelector='.campaign-step-eyebrow,.campaign-task-launch,.campaign-story,.campaign-book-medallion,.campaign-reward-hint,.campaign-next-world';
export async function changeCampaignCard(card,html,{animate=true}={}){
 if(card.mnCardHTML===html)return states.get(card)?.done;
 const height=card.offsetHeight,previous=states.get(card);previous?.cancel();card.mnCardHTML=html;card.dataset.campaignFlow='changing';card.dataset.mnManagedPresence='true';
 card.style.height='auto';card.innerHTML=html;const target=card.offsetHeight,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 if(!animate||reduced){states.delete(card);delete card.dataset.campaignFlow;card.style.height='';return;}
 const animations=new Set();let dead=false;const play=(node,frames,options)=>{const a=node.animate(frames,options);animations.add(a);return a.finished.catch(()=>{});};
 const cancel=()=>{dead=true;for(const a of animations)a.cancel();animations.clear();};const row={cancel,done:null};states.set(card,row);
 row.done=(async()=>{card.style.height=height+'px';const resize=play(card,[{height:height+'px'},{height:target+'px'}],{duration:480,easing:'cubic-bezier(.22,.85,.25,1)',fill:'forwards'});
 const entries=[...card.querySelectorAll(contentSelector)].filter(n=>!n.hidden);const incoming=entries.map((node,i)=>play(node,[{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,delay:65+i*65,easing:'cubic-bezier(.22,.85,.25,1)',fill:'both'}));
 await Promise.all([resize,...incoming]);if(dead||!card.isConnected)return;for(const a of animations)a.cancel();card.style.height='';delete card.dataset.campaignFlow;states.delete(card);})();return row.done;
}
