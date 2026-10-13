import {SCENIC} from './scenic-config.mjs';

async function bitmap(src){const image=new Image();image.src=src;await image.decode();return image;}
function wrap(ctx,text,max){const lines=[''];for(const word of text.split(' ')){const i=lines.length-1,candidate=lines[i]?lines[i]+' '+word:word;if(ctx.measureText(candidate).width>max&&lines[i])lines.push(word);else lines[i]=candidate;}return lines;}
// Three textured surfaces use slices of the actual prepared atlas, including
// its top caption and flag. Opening never substitutes a blank sheet.
export async function preparePaper(sheet,mapResult,record){
 const inner=sheet.querySelector('.scenic-map-inner'),base=inner.getBoundingClientRect();
 const width=inner.clientWidth,height=inner.clientHeight,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 canvas.width=width*2;canvas.height=height*2;ctx.scale(2,2);
 const paper=ctx.createRadialGradient(width*.25,height*.1,0,width*.5,height*.5,width);paper.addColorStop(0,'#fff7dc');paper.addColorStop(1,'#eed4a1');ctx.fillStyle=paper;ctx.fillRect(0,0,width,height);
 try{ctx.globalAlpha=.75;ctx.drawImage(await bitmap(new URL('assets/flags/adventure/paper-v3-detail.svg',document.baseURI)),0,0,width,height);ctx.globalAlpha=1;}catch{ctx.globalAlpha=1;}
 const map=inner.querySelector('.scenic-europe-map'),mapRect=map.getBoundingClientRect(),x=mapRect.left-base.left,y=mapRect.top-base.top,w=map.clientWidth,h=map.clientHeight;
 if(mapResult?.svg){
  const svg=mapResult.svg.cloneNode(true);svg.setAttribute('width',w*2);svg.setAttribute('height',h*2);
  const raster=svg.querySelector('image');if(raster&&mapResult.image){const c=document.createElement('canvas');c.width=mapResult.image.naturalWidth;c.height=mapResult.image.naturalHeight;c.getContext('2d').drawImage(mapResult.image,0,0);raster.setAttribute('href',c.toDataURL('image/png'));}
  for(const path of svg.querySelectorAll('.country')){if(path.dataset.country!==record.id){path.setAttribute('fill','#b9d69c');continue;}path.setAttribute('fill','#087235');path.setAttribute('fill-opacity','.86');path.setAttribute('style','mix-blend-mode:multiply');path.setAttribute('stroke','#fff8d9');path.setAttribute('stroke-width','1.7');}
  const halo=svg.querySelector('.scenic-country-halo');if(halo){halo.setAttribute('fill','none');halo.setAttribute('stroke','#fffde0');halo.setAttribute('stroke-width','2.4');}
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
  try{ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,7);ctx.clip();ctx.drawImage(await bitmap(url),x,y,w,h);ctx.restore();}finally{URL.revokeObjectURL(url);}
  ctx.font='850 10px ScenicBody';ctx.textAlign='center';
  for(const label of inner.querySelectorAll('.scenic-map-label')){const r=label.getBoundingClientRect();ctx.fillStyle=label.classList.contains('is-selected')?'#fcffe4':'#284a38';ctx.fillText(label.textContent,r.left-base.left+r.width/2,r.top-base.top+r.height*.8);}
 }else{ctx.fillStyle='#456754';ctx.font='700 14px ScenicBody';ctx.textAlign='center';ctx.fillText('Mapa jest chwilowo niedostępna.',width/2,height*.6,width-28);}
 for(const element of [inner.querySelector('.scenic-map-caption strong'),inner.querySelector('.scenic-map-caption span')]){
  const r=element.getBoundingClientRect(),style=getComputedStyle(element),size=parseFloat(style.fontSize);ctx.font=`${style.fontWeight} ${size}px ${style.fontFamily}`;ctx.fillStyle=style.color;ctx.textAlign='left';
  wrap(ctx,element.textContent,r.width).forEach((line,i)=>ctx.fillText(line,r.left-base.left,r.top-base.top+size*.86+i*parseFloat(style.lineHeight),r.width));
 }
 const flag=inner.querySelector('.scenic-map-flag');try{await flag.decode();const r=flag.getBoundingClientRect();ctx.save();ctx.shadowColor='#55391450';ctx.shadowBlur=8;ctx.shadowOffsetY=3;ctx.drawImage(flag,r.left-base.left,r.top-base.top,r.width,r.height);ctx.restore();}catch{}
 const snapshot=canvas.toDataURL('image/webp',.93);
 for(const leaf of sheet.querySelectorAll('.scenic-fold-leaf'))leaf.style.backgroundImage=`url("${snapshot}")`;
}

export async function foldPaper(sheet,{opening,timeline,reduced}){
 sheet.classList.remove('is-open','is-opening','is-closing');sheet.classList.add(opening?'is-opening':'is-closing');
 if(reduced){sheet.classList.toggle('is-open',opening);sheet.classList.remove('is-opening','is-closing');return;}
 const duration=opening?SCENIC.openMs:SCENIC.closeMs,leaves=[...sheet.querySelectorAll('.scenic-fold-leaf')],operations=[];
 for(const [index,leaf] of leaves.entries()){
  const start=index*.23,end=Math.min(.99,start+.48),shift=index*100;
  const flat={transform:'translateY(0) rotateX(0deg)',opacity:1},closed={transform:`translateY(${shift}%) rotateX(${index%2?79:-79}deg)`,opacity:index?0:1};
  const frames=[{...closed,offset:0},{...closed,offset:start},{transform:'translateY(0) rotateX(3deg)',opacity:1,offset:end},{...flat,offset:1}];
  const shades=[{opacity:.65,offset:0},{opacity:.65,offset:start},{opacity:.18,offset:(start+end)/2},{opacity:.025,offset:end},{opacity:0,offset:1}];
  const lights=[{opacity:.1,offset:0},{opacity:.1,offset:start},{opacity:.7,offset:(start+end)/2},{opacity:.2,offset:end},{opacity:.07,offset:1}];
  const reverse=f=>opening?f:f.slice().reverse().map(x=>({...x,offset:1-x.offset}));
  const options={duration,fill:'both',easing:'cubic-bezier(.25,.7,.22,1)'};
  operations.push(timeline.animate(leaf,reverse(frames),options),timeline.animate(leaf.querySelector('.scenic-fold-shade'),reverse(shades),options),timeline.animate(leaf.querySelector('.scenic-fold-light'),reverse(lights),options));
 }
 operations.push(timeline.animate(sheet.querySelector('.scenic-paper-shadow'),opening?[{opacity:.2,transform:'scaleX(.8) scaleY(.65)'},{opacity:.48,transform:'scaleX(1) scaleY(1.1)',offset:.45},{opacity:.25,transform:'scaleX(.96) scaleY(.65)'}]:[{opacity:.25,transform:'scaleX(.96) scaleY(.65)'},{opacity:.5,transform:'scaleX(1) scaleY(1.1)',offset:.6},{opacity:0,transform:'scaleX(.8) scaleY(.5)'}],{duration,fill:'both'}));
 await Promise.all(operations);sheet.classList.remove('is-opening','is-closing');sheet.classList.toggle('is-open',opening);
}
