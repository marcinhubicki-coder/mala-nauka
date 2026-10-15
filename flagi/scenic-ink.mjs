import {SCENIC,randomFrom,seedOf} from './scenic-config.mjs';
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
const surface=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
async function decode(src){const image=new Image();image.src=src;await image.decode();return image;}
// A single visible Canvas owns both the final ink and its moving grains.
// The target is prepared once, never exchanged for live HTML at completion.
export function createMapInk(canvas,sheet,app){
 const ctx=canvas.getContext('2d'),mask=surface(1,1),masked=surface(1,1);
 let target,width,height,dpr,field,maskPixels,grains=[];
 function clear(){ctx.clearRect(0,0,canvas.width,canvas.height);delete sheet.dataset.inkPhase;delete sheet.dataset.inkProgress;delete sheet.dataset.inkGrains;delete app.dataset.qaInkCaptured;target=null;field=null;maskPixels=null;grains=[];masked.width=mask.width=1;masked.height=mask.height=1;}
 async function prepare(result,record,{isCurrent=()=>true}={}){
  width=sheet.clientWidth;height=sheet.clientHeight;dpr=Math.min(devicePixelRatio||1,SCENIC.maxDpr);
  const art=surface(Math.round(width*dpr),Math.round(height*dpr)),paint=art.getContext('2d');paint.scale(dpr,dpr);
  const origin=sheet.getBoundingClientRect(),inner=sheet.querySelector('.scenic-map-inner'),map=inner.querySelector('.scenic-europe-map'),r=map.getBoundingClientRect();
  if(result?.svg){
   const svg=result.svg.cloneNode(true);svg.setAttribute('width',r.width*dpr);svg.setAttribute('height',r.height*dpr);
   svg.querySelectorAll('style').forEach(n=>n.remove());
   const raster=svg.querySelector('image');
   if(raster&&result.image){const c=surface(result.image.naturalWidth,result.image.naturalHeight);c.getContext('2d').drawImage(result.image,0,0);raster.setAttribute('href',c.toDataURL('image/png'));}
   for(const path of svg.querySelectorAll('.country')){
    path.removeAttribute('style');path.setAttribute('style','animation:none;transform:none;mix-blend-mode:multiply');
    path.setAttribute('fill',path.dataset.country===record.id?'#a27437':'#d9c79e');path.setAttribute('fill-opacity',path.dataset.country===record.id?'.58':'1');path.setAttribute('stroke','#70471f');path.setAttribute('stroke-width','.85');
   }
   const halo=svg.querySelector('.scenic-country-halo');if(halo){halo.removeAttribute('style');halo.setAttribute('fill','none');halo.setAttribute('stroke','#ffe6ac');halo.setAttribute('stroke-width','2.1');halo.setAttribute('vector-effect','non-scaling-stroke');}
   const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
   const geo=surface(Math.round(r.width*dpr),Math.round(r.height*dpr)),ink=geo.getContext('2d');ink.scale(dpr,dpr);
   try{ink.drawImage(await decode(url),0,0,r.width,r.height);}finally{URL.revokeObjectURL(url);}
   // Transparent, softly irregular margins let the atlas become part of vellum.
   ink.globalCompositeOperation='destination-in';
   const feather=ink.createRadialGradient(r.width/2,r.height/2,r.height*.24,r.width/2,r.height/2,r.width*.64);
   feather.addColorStop(0,'#000');feather.addColorStop(.6,'#000');feather.addColorStop(1,'#0000');ink.fillStyle=feather;ink.fillRect(0,0,r.width,r.height);
   paint.drawImage(geo,r.left-origin.left,r.top-origin.top,r.width,r.height);
  }else{paint.fillStyle='#705332';paint.font='700 14px ScenicBody';paint.textAlign='center';paint.fillText('Mapa jest chwilowo niedostępna.',width/2,height*.56,width-36);}
  for(const node of inner.querySelectorAll('.scenic-map-caption strong,.scenic-map-caption span')){
   const box=node.getBoundingClientRect(),style=getComputedStyle(node),size=parseFloat(style.fontSize);
   paint.font=`${style.fontWeight} ${size}px ${style.fontFamily}`;paint.fillStyle=style.color;paint.textAlign='left';
   const words=node.textContent.split(' '),lines=[''];for(const word of words){const i=lines.length-1,line=lines[i]?lines[i]+' '+word:word;if(paint.measureText(line).width>box.width&&lines[i])lines.push(word);else lines[i]=line;}
   lines.forEach((line,i)=>paint.fillText(line,box.left-origin.left,box.top-origin.top+size*.86+i*parseFloat(style.lineHeight),box.width));
  }
  const flag=inner.querySelector('.scenic-map-flag');try{await flag.decode();const box=flag.getBoundingClientRect();paint.save();paint.globalAlpha=.86;paint.drawImage(flag,box.left-origin.left,box.top-origin.top,box.width,box.height);paint.restore();}catch{}
  if(!isCurrent())return;
  target=art;canvas.width=art.width;canvas.height=art.height;masked.width=art.width;masked.height=art.height;
  // Coarse ink field is independent of device DPR: bounded CPU work on iPhone.
  mask.width=Math.ceil(width*.42);mask.height=Math.ceil(height*.42);
  const sample=surface(mask.width,mask.height),sctx=sample.getContext('2d',{willReadFrequently:true});sctx.drawImage(art,0,0,sample.width,sample.height);
  const pixels=sctx.getImageData(0,0,sample.width,sample.height).data,rand=randomFrom(seedOf(record.id+':atlas')),dark=[];
  field=new Float32Array(mask.width*mask.height*5);maskPixels=mask.getContext('2d').createImageData(mask.width,mask.height);
  for(let y=0;y<mask.height;y++)for(let x=0;x<mask.width;x++){
   const k=y*mask.width+x,index=k*4,fx=x/mask.width,fy=y/mask.height;
   const darkness=clamp((245-(pixels[index]*.3+pixels[index+1]*.59+pixels[index+2]*.11))/150);
   field[k*5]=clamp(fx*.71+fy*.20+Math.sin(fy*22)*.07+(rand()-.5)*.13);
   field[k*5+1]=clamp((1-fx)*.52+fy*.31+Math.sin(fy*28+fx*5)*.06+(rand()-.5)*.15);
   field[k*5+2]=clamp(fx*.38+(1-fy)*.43+(rand()-.5)*.22);
   field[k*5+3]=darkness;field[k*5+4]=clamp(Math.hypot(fx-.5,fy-.5)*1.3+rand()*.35);
   if(pixels[index+3]>50&&darkness>.31)dark.push({x:(x+.5)/mask.width*width,y:(y+.5)/mask.height*height});
  }
  grains=Array.from({length:SCENIC.inkGrains},()=>{
   const target=dark[Math.floor(rand()*dark.length)]||{x:width/2,y:height/2},side=Math.floor(rand()*4),t=rand();
   const edge=side===0?{x:3,y:3+t*(height-6)}:side===1?{x:width-3,y:3+t*(height-6)}:side===2?{x:3+t*(width-6),y:3}:{x:3+t*(width-6),y:height-3};
   return {target,edge,delay:rand()*.43,duration:.31+rand()*.2,phase:rand()*Math.PI*2,swirl:9+rand()*27,size:.48+rand()*.52};
  });
  sheet.dataset.inkGrains=String(grains.length);sheet.dataset.inkBounds='contained';
 }
 function draw(t,erasing){
  const mctx=mask.getContext('2d'),data=maskPixels.data;
  for(let k=0;k<field.length/5;k++){
   const i=k*5;
   const line=ease((t*3.2-field[i])/.24)*field[i+3]*.83;
   const wash=ease((t*3.2-1-field[i+1])/.26)*.76;
   const detail=ease((t*3.2-2-field[i+2])/.20);
   const alpha=erasing?1-ease((t*1.5-field[i+4])/.35):1-(1-line)*(1-wash)*(1-detail);
   data[k*4+3]=Math.round(clamp(alpha)*255);
  }
  mctx.putImageData(maskPixels,0,0);
  const out=masked.getContext('2d');out.clearRect(0,0,masked.width,masked.height);out.globalCompositeOperation='source-over';out.drawImage(target,0,0);out.globalCompositeOperation='destination-in';out.drawImage(mask,0,0,masked.width,masked.height);
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(masked,0,0);ctx.setTransform(dpr,0,0,dpr,0,0);
  let outside=0;
  for(const g of grains){
   const q=clamp((t-g.delay)/g.duration),travel=ease(q),wave=Math.sin(q*Math.PI)*(1-q);
   const from=erasing?g.target:g.edge,to=erasing?g.edge:g.target;
   let x=from.x+(to.x-from.x)*travel+Math.sin(q*16+g.phase)*g.swirl*wave;
   let y=from.y+(to.y-from.y)*travel+Math.cos(q*13+g.phase)*g.swirl*wave+8*Math.sin(q*Math.PI);
   // Soft reflected wall, never a grain outside the paper's useful margin.
   const reflect=(n,max)=>{n=Math.abs(n-5);const span=max-10;return 5+Math.abs((n+span)%(2*span)-span)};
   x=reflect(x,width);y=reflect(y,height);
   if(x<0||y<0||x>width||y>height)outside++;
   const alpha=Math.sin(q*Math.PI)*.62*(erasing?1:.8);
   if(alpha>.005){ctx.globalAlpha=alpha;ctx.fillStyle='#624326';ctx.fillRect(x,y,g.size,g.size);}
  }
  ctx.globalAlpha=1;
  if(app.dataset.qa==='true'){sheet.dataset.inkProgress=t.toFixed(3);sheet.dataset.inkOutside=String(outside);}
 }
 async function animate({timeline,reduced,erasing=false}){
  if(!target)return;
  sheet.dataset.inkPhase=erasing?'erasing':'drawing';
  if(reduced){if(erasing)ctx.clearRect(0,0,canvas.width,canvas.height);else{ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(target,0,0);}}
  else await timeline.tween(erasing?SCENIC.inkEraseMs:SCENIC.inkDrawMs,t=>{
   draw(t,erasing);
   if(app.dataset.qa==='true'&&app.dataset.qaInkAt!==undefined&&t>=Number(app.dataset.qaInkAt)){const at=app.dataset.qaInkAt;delete app.dataset.qaInkAt;app.dataset.qaInkCaptured=at;timeline.setPaused(true);}
  },app.dataset.qa==='true'?{stopAt:()=>app.dataset.qaInkAt===undefined?undefined:Number(app.dataset.qaInkAt)}:{});
  sheet.dataset.inkPhase=erasing?'empty':'complete';
 }
 return {prepare,reveal:options=>animate(options),erase:options=>animate({...options,erasing:true}),clear};
}
