import {SCENIC} from './scenic-config.mjs';
const MATERIAL='assets/flags/adventure/scenic-paper-v10.webp';
let material;
export function preloadPaper(){
 material??=new Promise(resolve=>{const image=new Image(),timer=setTimeout(()=>resolve(null),SCENIC.flagTimeoutMs);image.onload=()=>{clearTimeout(timer);resolve(image)};image.onerror=()=>{clearTimeout(timer);resolve(null)};image.src=new URL(MATERIAL,document.baseURI).href;});
 return material.then(question=>({question,atlas:question}));
}
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
function geometry(sheet,p){
 const height=sheet.clientHeight,closed=document.querySelector('#scenic-paper-row').clientHeight;
 const bottom=closed*.62,top=closed-bottom,h=(height-closed)/4;
 const angles=[0,.09,.18,.27].map(start=>Math.PI/2*(1-smooth((p-start)/.73)));
 let rise=0,depth=0;
 const panels=angles.map((a,i)=>{const angle=a*(i%2?-1:1);const y=height-bottom-rise-h;const z=depth;rise+=h*Math.cos(angle);depth-=h*Math.sin(angle);return {transform:`translate3d(0,${y}px,${z}px) rotateX(${angle*180/Math.PI}deg)`,shade:Math.sin(a)*.29,light:Math.sin(a)*(i%2?.12:.35)};});
 const capY=height-bottom-rise-top,projectedY=height+(capY-height)*2400/(2400-depth);
 return {panels,cap:`translate3d(0,${capY}px,${depth}px)`,compass:`translate3d(0,${projectedY}px,0)`,bottom,top,h,height};
}
export function placePaper(sheet){
 const g=geometry(sheet,sheet.classList.contains('is-open')?1:0);
 sheet.style.setProperty('--paper-height',g.height+'px');sheet.style.setProperty('--paper-bottom',g.bottom+'px');sheet.style.setProperty('--paper-top',g.top+'px');
 [...sheet.querySelectorAll('.scenic-fold-leaf')].forEach((leaf,i)=>{leaf.style.height=g.h+1+'px';leaf.style.backgroundPosition=`center ${-(g.height-g.bottom-(i+1)*g.h)}px`;leaf.style.transform=g.panels[i].transform;});
 sheet.querySelector('.scenic-paper-top').style.transform=g.cap;sheet.querySelector('.scenic-compass').style.transform=g.compass;
 sheet.dataset.paperProgress=sheet.classList.contains('is-open')?'1':'0';
}
// The very same top, four middle folds and engraved bottom remain mounted.
// Nothing is photographed, replaced, rescaled or cross-faded at a fold boundary.
export async function foldPaper(sheet,{opening,timeline,reduced}){
 sheet.classList.remove('is-opening','is-closing');sheet.classList.add(opening?'is-opening':'is-closing');
 const duration=opening?SCENIC.openMs:SCENIC.closeMs,leaves=[...sheet.querySelectorAll('.scenic-fold-leaf')],operations=[];
 if(!reduced){
  const frames=Array.from({length:61},(_,i)=>({offset:i/60,g:geometry(sheet,opening?i/60:1-i/60)}));
  leaves.forEach((leaf,i)=>{
   const opts={duration,fill:'both',easing:'linear'};
   operations.push(timeline.animate(leaf,frames.map(({offset,g})=>({offset,transform:g.panels[i].transform})),opts));
   for(const [selector,property] of [['.scenic-fold-shade','shade'],['.scenic-fold-light','light']])operations.push(timeline.animate(leaf.querySelector(selector),frames.map(({offset,g})=>({offset,opacity:g.panels[i][property]})),opts));
  });
  for(const [selector,key] of [['.scenic-paper-top','cap'],['.scenic-compass','compass']])operations.push(timeline.animate(sheet.querySelector(selector),frames.map(({offset,g})=>({offset,transform:g[key]})),{duration,fill:'both',easing:'linear'}));
  const prompt=document.querySelector('.scenic-prompt');
  operations.push(timeline.animate(prompt,opening?[{opacity:1},{opacity:0,offset:.2},{opacity:0}]:[{opacity:0},{opacity:0,offset:.76},{opacity:1}],{duration,fill:'both'}));
 }
 await Promise.all(operations);
 sheet.classList.remove('is-opening','is-closing');sheet.classList.toggle('is-open',opening);placePaper(sheet);
}
