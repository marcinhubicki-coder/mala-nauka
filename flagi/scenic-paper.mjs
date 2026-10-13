import {SCENIC} from './scenic-config.mjs';

async function bitmap(src){const image=new Image();image.src=src;await image.decode();return image;}
let paperImage;
export async function preloadPaper(){
 paperImage??=bitmap(new URL('assets/flags/adventure/scenic-atlas-paper-v6.webp',document.baseURI)).catch(()=>null);
 await Promise.all([paperImage,bitmap(new URL('assets/flags/adventure/scenic-question-paper-v6.webp',document.baseURI)).catch(()=>null)]);
}
function wrap(ctx,text,max){const lines=[''];for(const word of text.split(' ')){const i=lines.length-1,candidate=lines[i]?lines[i]+' '+word:word;if(ctx.measureText(candidate).width>max&&lines[i])lines.push(word);else lines[i]=candidate;}return lines;}
// Three textured surfaces use slices of the actual prepared atlas, including
// its top caption and flag. Opening never substitutes a blank sheet.
export async function preparePaper(sheet,mapResult,record,{isCurrent=()=>true}={}){
 const inner=sheet.querySelector('.scenic-map-inner'),base=inner.getBoundingClientRect();
 const width=inner.clientWidth,height=inner.clientHeight,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 canvas.width=width*2;canvas.height=height*2;ctx.scale(2,2);
 await preloadPaper();const paper=await paperImage;
 if(paper)ctx.drawImage(paper,0,0,width,height);
 else{ctx.fillStyle='#fff0cf';ctx.fillRect(0,0,width,height);}
 const map=inner.querySelector('.scenic-europe-map'),mapRect=map.getBoundingClientRect(),x=mapRect.left-base.left,y=mapRect.top-base.top,w=map.clientWidth,h=map.clientHeight;
 if(mapResult?.svg){
  const svg=mapResult.svg.cloneNode(true);svg.setAttribute('width',w*2);svg.setAttribute('height',h*2);
  const raster=svg.querySelector('image');if(raster&&mapResult.image){const c=document.createElement('canvas');c.width=mapResult.image.naturalWidth;c.height=mapResult.image.naturalHeight;c.getContext('2d').drawImage(mapResult.image,0,0);raster.setAttribute('href',c.toDataURL('image/png'));}
  for(const path of svg.querySelectorAll('.country')){if(path.dataset.country!==record.id){path.setAttribute('fill','#b9d69c');continue;}path.setAttribute('fill','#087235');path.setAttribute('fill-opacity','.80');path.setAttribute('style','mix-blend-mode:multiply');path.setAttribute('stroke','#fff8d9');path.setAttribute('stroke-width','1');}
  const halo=svg.querySelector('.scenic-country-halo');if(halo){halo.setAttribute('fill','none');halo.setAttribute('stroke','#fffde0');halo.setAttribute('stroke-width','2');}
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
  const surface=document.createElement('canvas');surface.width=w*2;surface.height=h*2;const ink=surface.getContext('2d');ink.scale(2,2);
  try{ink.drawImage(await bitmap(url),0,0,w,h);}finally{URL.revokeObjectURL(url);}
  ink.font='850 10px ScenicBody';ink.textAlign='center';
  for(const label of inner.querySelectorAll('.scenic-map-label')){const r=label.getBoundingClientRect();ink.fillStyle=label.classList.contains('is-selected')?'#fcffe4':'#284a38';ink.fillText(label.textContent,r.left-mapRect.left+r.width/2,r.top-mapRect.top+r.height*.8);}
  // Match the live atlas feathering, so the final frame has no hard-edge pop.
  ink.save();ink.globalCompositeOperation='destination-in';ink.translate(w/2,h/2);ink.scale(w*.8,h*.78);const feather=ink.createRadialGradient(0,0,0,0,0,1);feather.addColorStop(.55,'#000');feather.addColorStop(.81,'#0009');feather.addColorStop(1,'#0000');ink.fillStyle=feather;ink.fillRect(-1,-1,2,2);ink.restore();ctx.drawImage(surface,x,y,w,h);
 }else{ctx.fillStyle='#456754';ctx.font='700 14px ScenicBody';ctx.textAlign='center';ctx.fillText('Mapa jest chwilowo niedostępna.',width/2,height*.6,width-28);}
 for(const element of [inner.querySelector('.scenic-map-caption strong'),inner.querySelector('.scenic-map-caption span')]){
  const r=element.getBoundingClientRect(),style=getComputedStyle(element),size=parseFloat(style.fontSize);ctx.font=`${style.fontWeight} ${size}px ${style.fontFamily}`;ctx.fillStyle=style.color;ctx.textAlign='left';
  wrap(ctx,element.textContent,r.width).forEach((line,i)=>ctx.fillText(line,r.left-base.left,r.top-base.top+size*.86+i*parseFloat(style.lineHeight),r.width));
 }
 const flag=inner.querySelector('.scenic-map-flag');try{await flag.decode();const r=flag.getBoundingClientRect();ctx.save();ctx.shadowColor='#55391450';ctx.shadowBlur=8;ctx.shadowOffsetY=3;ctx.drawImage(flag,r.left-base.left,r.top-base.top,r.width,r.height);ctx.restore();}catch{}
 for(const item of document.querySelectorAll('#scenic-feedback strong,#scenic-feedback small')){const r=item.getBoundingClientRect(),style=getComputedStyle(item),size=parseFloat(style.fontSize);ctx.font=`${style.fontWeight} ${size}px ${style.fontFamily}`;ctx.fillStyle=style.color;ctx.textAlign='left';ctx.fillText(item.textContent,r.left-base.left,r.top-base.top+size*.9,r.width);}
 const snapshot=canvas.toDataURL('image/webp',.93);
 if(!isCurrent())return;
 for(const leaf of sheet.querySelectorAll('.scenic-fold-leaf'))leaf.style.backgroundImage=`url("${snapshot}")`;
}

export async function foldPaper(sheet,{opening,timeline,reduced}){
 sheet.classList.remove('is-open','is-opening','is-closing');sheet.classList.add(opening?'is-opening':'is-closing');
 if(reduced){sheet.classList.toggle('is-open',opening);sheet.classList.remove('is-opening','is-closing');return;}
 const duration=opening?SCENIC.openMs:SCENIC.closeMs,leaves=[...sheet.querySelectorAll('.scenic-fold-leaf')],operations=[];
 // The top of one panel is the bottom hinge of the next. Precomputed
 // keyframes preserve that joint in 3D; no panels slide across the landscape.
 const ease=(p,start,end)=>{const t=Math.max(0,Math.min(1,(p-start)/(end-start)));return t*t*(3-2*t);};
 const angles=p=>[75*(1-ease(p,0,.44)),-75*(1-ease(p,.18,.73)),75*(1-ease(p,.40,.97))];
 const h=sheet.clientHeight/3;
 for(const [index,leaf] of leaves.entries()){
  const frames=[],shades=[],lights=[];
  for(let frame=0;frame<=60;frame++){
   const offset=frame/60,p=opening?offset:1-offset,a=angles(p);let y=0,z=0;
   for(let joint=0;joint<index;joint++){const r=a[joint]*Math.PI/180;y-=h*Math.cos(r);z-=h*Math.sin(r);}
   const tilt=Math.sin(Math.abs(a[index])*Math.PI/180);
   frames.push({offset,transform:`translate3d(0,${y+index*h}px,${z}px) rotateX(${a[index]}deg)`,opacity:1});
   shades.push({offset,opacity:tilt*.32});
   lights.push({offset,opacity:tilt*(index%2?.22:.52)});
  }
  const options={duration,fill:'both',easing:'linear'};
  operations.push(timeline.animate(leaf,frames,options),timeline.animate(leaf.querySelector('.scenic-fold-shade'),shades,options),timeline.animate(leaf.querySelector('.scenic-fold-light'),lights,options));
 }
 operations.push(timeline.animate(sheet.querySelector('.scenic-paper-shadow'),opening?[{opacity:.2,transform:'scaleX(.8) scaleY(.65)'},{opacity:.48,transform:'scaleX(1) scaleY(1.1)',offset:.45},{opacity:.25,transform:'scaleX(.96) scaleY(.65)'}]:[{opacity:.25,transform:'scaleX(.96) scaleY(.65)'},{opacity:.5,transform:'scaleX(1) scaleY(1.1)',offset:.6},{opacity:0,transform:'scaleX(.8) scaleY(.5)'}],{duration,fill:'both'}));
 await Promise.all(operations);sheet.classList.remove('is-opening','is-closing');sheet.classList.toggle('is-open',opening);
}
