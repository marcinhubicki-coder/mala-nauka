// Reveal the original text ranges: no glyph boxes or masks to clip a calligraphic
// swash. Unsupported browsers keep the same typography and fade whole paragraphs.
let registered=false,serial=0;
const active=new WeakMap();
function registerRows(){
 if(registered)return true;if(!globalThis.CSS?.registerProperty||!CSS.highlights||!globalThis.Highlight)return false;
 for(let i=0;i<64;i++){try{CSS.registerProperty({name:'--book-row-ink-'+i,syntax:'<number>',inherits:true,initialValue:'0'});}catch{/* Shared by mounted books. */}}
 registered=true;return true;
}
function textRows(p){
 const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('.book-initial-letter,svg')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}),rows=[];
 while(walker.nextNode()){
  const text=walker.currentNode;let start=0,lastTop=null;
  for(let i=0;i<text.length;i++){
   const range=document.createRange();range.setStart(text,i);range.setEnd(text,i+1);const r=range.getBoundingClientRect();if(!r.height)continue;
   if(lastTop!==null&&Math.abs(lastTop-r.top)>3){const line=document.createRange();line.setStart(text,start);line.setEnd(text,i);rows.push(line);start=i;}lastTop=r.top;
  }
  if(start<text.length){const line=document.createRange();line.setStart(text,start);line.setEnd(text,text.length);rows.push(line);}
 }
 return rows.slice(0,64);
}
export function revealBookInk(surface){
 const owner=surface.closest('.book-reading-layout')||surface;active.get(owner)?.();
 if(matchMedia('(prefers-reduced-motion:reduce)').matches)return {animations:[],finished:Promise.resolve()};
 const animations=[],names=[],paragraphs=[],style=document.createElement('style'),rules=[],rowsSupported=registerRows(),uid=++serial;let delay=70;
 for(const p of surface.querySelectorAll('.book-entry-copy>p')){
  const rows=rowsSupported?textRows(p):[];
  if(!rows.length){animations.push(p.animate([{opacity:0},{opacity:1}],{duration:600,delay,fill:'both'}));delay+=160;continue;}
  paragraphs.push(p);p.dataset.inkRows=String(rows.length);
  rows.forEach((range,i)=>{const name=`book-ink-${uid}-${paragraphs.length}-${i}`;names.push(name);CSS.highlights.set(name,new Highlight(range));rules.push(`::highlight(${name}){color:rgb(71 56 45 / var(--book-row-ink-${i}))}`);p.style.setProperty('--book-row-ink-'+i,0);animations.push(p.animate({['--book-row-ink-'+i]:[0,1]},{duration:430,delay,easing:'ease-out',fill:'both'}));delay+=90;});
 }
 style.textContent=rules.join('');document.head.append(style);
 for(const node of surface.querySelectorAll('.manuscript-sprite,.book-chapter-heading,.book-index-links>header,.book-index-links>button,.book-index-steps>button')){
  animations.push(node.animate([{opacity:0,transform:'translateY(2px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,delay:node.matches('.book-index-steps>button')?70+Number(node.dataset.bookNumber||0)*35:30,easing:'ease-out',fill:'both'}));
 }
 let cleared=false;
 const clear=()=>{if(cleared)return;cleared=true;names.forEach(n=>CSS.highlights?.delete(n));style.remove();for(const a of animations){const node=a.effect?.target;node?.style.removeProperty('opacity');node?.style.removeProperty('transform');}for(const p of paragraphs){for(let i=0;i<64;i++)p.style.removeProperty('--book-row-ink-'+i);delete p.dataset.inkRows;}if(active.get(owner)===clear)active.delete(owner);};active.set(owner,clear);
 return {animations,finished:Promise.all(animations.map(a=>a.finished.catch(()=>{}))),hold(){for(const a of animations){try{a.commitStyles();}catch{/* Detached outgoing pages need no held paint. */}}},clear};
}
