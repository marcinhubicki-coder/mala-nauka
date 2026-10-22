import {CAMPAIGN_STAR_MEDALLION} from './campaign-star-assets.mjs';
import {assetUrl} from './asset-loader.mjs';
const path='M50 5 63.6 33.2 95 37.8 72.3 59.9 77.7 91 50 76.3 22.3 91 27.7 59.9 5 37.8 36.4 33.2Z';
let sequence=0;
const presentations=new WeakMap();
export function cancelCampaignStars(root){const screen=root.querySelector('.campaign-screen');if(!screen)return;presentations.get(screen)?.();presentations.delete(screen);delete screen.dataset.ratingPhase;}

export function campaignStarSVG(filled=false,key=null){
 const id=key||'campaign-star-'+(++sequence);
 return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${filled?'#fff5a5':'#d4c9aa'}"/><stop offset=".45" stop-color="${filled?'#ffce4e':'#e7ddc3'}"/><stop offset="1" stop-color="${filled?'#e8a522':'#bdb292'}"/></linearGradient></defs><path d="${path}" fill="url(#${id})" stroke="${filled?'#fff4ba':'#b6a788'}" stroke-width="3" stroke-linejoin="round"/><path d="M50 12 61 36 85 40 68 57 72 81 50 69 28 81 32 57 15 40 39 36Z" fill="none" stroke="${filled?'#fff4b9':'#fbf4df'}" stroke-opacity=".65" stroke-width="1.4"/></svg>`;
}
export function campaignRatingMarkup(score,{heldStars,showEmpty=false}={}){
 if(!score&&!showEmpty)return '';
 const filled=heldStars??score?.stars??0;
 const sockets=[[24.5,39.2],[50,29.2],[75,39.2],[37.5,65.2],[63.4,65.2]];
 return `<div class="campaign-rating" role="img" aria-label="${score?`Najlepsza ocena: ${score.stars} z 5 gwiazdek · ${score.percent}%`:'Jeszcze nie oceniono · 5 miejsc na gwiazdki'}"><span class="campaign-rating-label">${score?`Najlepiej: ${score.percent}%`:'Jeszcze nie oceniono'}</span><img class="campaign-rating-art" src="${assetUrl(CAMPAIGN_STAR_MEDALLION.path)}" width="512" height="512" alt=""><span class="campaign-rating-slots">${sockets.map(([x,y],i)=>`<span class="campaign-star-slot ${i<filled?'is-earned':''}" data-star-slot="${i}" style="left:${x}%;top:${y}%">${campaignStarSVG(i<filled,'campaign-card-star-'+i+'-'+(i<filled?'filled':'empty'))}</span>`).join('')}</span></div>`;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
export async function presentCampaignStars(root,award,{sharedShade=false}={}){
 cancelCampaignStars(root);const screen=root.querySelector('.campaign-screen'),slots=[...screen?.querySelectorAll('[data-star-slot]')||[]];
 if(!screen||slots.length!==5)return false;
 const layer=document.createElement('div');layer.className='campaign-star-presentation';layer.setAttribute('aria-hidden','true');layer.dataset.mnDecoration='true';
 const shade=document.createElement('div');shade.className='campaign-star-shade';if(!sharedShade)layer.append(shade);
 const message=document.createElement('div');message.className='campaign-star-message';message.textContent=award.stars>=3?'Twój krok rozbłysnął!':'Każda próba przybliża do celu';layer.append(message);screen.append(layer);
 screen.dataset.travelling='true';screen.dataset.ratingPhase='presenting';
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,animations=new Set();let cancelled=false;
 const cancel=()=>{cancelled=true;for(const a of animations)a.cancel();layer.remove();};presentations.set(screen,cancel);
 const observer=new MutationObserver(()=>{if(!screen.isConnected){cancelled=true;for(const a of animations)a.cancel();}});observer.observe(root,{childList:true,subtree:true});
 const visibility=()=>{layer.toggleAttribute('data-paused',document.hidden);for(const a of animations)document.hidden?a.pause():a.play();};document.addEventListener('visibilitychange',visibility);
 const play=(node,frames,options)=>{const a=node.animate(frames,options);animations.add(a);if(document.hidden)a.pause();return a.finished.catch(()=>{}).finally(()=>animations.delete(a));};
 const land=i=>{if(cancelled)return;slots[i].classList.add('is-earned');slots[i].innerHTML=campaignStarSVG(true);};
 try{
  if(reduced){for(let i=0;i<award.stars;i++)land(i);await wait(120);return screen.isConnected;}
  if(!sharedShade)void play(shade,[{opacity:0},{opacity:1}],{duration:220,fill:'forwards'});
  const flights=[];
  for(let i=0;i<award.stars;i++){
   if(cancelled||!screen.isConnected)return false;
   const star=document.createElement('div');star.className='campaign-awarded-star';star.innerHTML=campaignStarSVG(true)+`<i class="campaign-star-ring"></i><span class="campaign-star-burst">${Array.from({length:10},(_,n)=>`<i style="--ray:${n}"></i>`).join('')}</span>`;layer.append(star);
   const rect=screen.getBoundingClientRect(),size=Math.min(150,rect.width*.36),start={x:rect.width/2,y:rect.height*.42};star.style.width=star.style.height=size+'px';
   const transform=(x,y,scale,rotate=0)=>`translate3d(${x-size/2}px,${y-size/2}px,0) scale(${scale}) rotate(${rotate}deg)`;
   star.style.transform=transform(start.x,start.y,1);
   await play(star,[{opacity:0,transform:transform(start.x,start.y,.12,-12)},{opacity:1,offset:.62,transform:transform(start.x,start.y,1.13,4)},{opacity:1,transform:transform(start.x,start.y,1)}],{duration:650,easing:'cubic-bezier(.18,.8,.25,1)',fill:'forwards'});
   if(cancelled)return false;
   star.querySelector('.campaign-star-burst').remove();star.querySelector('.campaign-star-ring').remove();
   const target=slots[i].getBoundingClientRect(),end={x:target.left+target.width/2-rect.left,y:target.top+target.height/2-rect.top},control={x:(start.x+end.x)/2+Math.min(100,rect.width*.25),y:Math.min(start.y,end.y)-90},scale=target.width/size;
   const frames=Array.from({length:25},(_,n)=>{const t=n/24,u=1-t;return {offset:t,opacity:1,transform:transform(u*u*start.x+2*u*t*control.x+t*t*end.x,u*u*start.y+2*u*t*control.y+t*t*end.y,1-(1-scale)*t,24*Math.sin(t*Math.PI))};});
   flights.push(play(star,frames,{duration:650,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).then(()=>{land(i);star.remove();if(!cancelled)void play(slots[i],[{transform:'scale(.8)'},{transform:'scale(1.16)',offset:.45},{transform:'scale(1)'}],{duration:250,easing:'ease-out'});}));
  }
  if(!award.stars)await wait(800);
  await Promise.all(flights);if(cancelled)return false;
  // Better scores remain permanent even when a replay earns fewer stars.
  for(let i=0;i<award.bestStars;i++)land(i);
  await play(layer,[{opacity:1},{opacity:0}],{duration:220,easing:'ease-out'});
  return screen.isConnected;
 }finally{document.removeEventListener('visibilitychange',visibility);observer.disconnect();for(const a of animations)a.cancel();layer.remove();if(presentations.get(screen)===cancel){presentations.delete(screen);if(screen.isConnected)screen.dataset.ratingPhase=cancelled?'cancelled':'complete';}}
}
