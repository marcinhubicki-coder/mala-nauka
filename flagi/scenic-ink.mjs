import {SCENIC,randomFrom,seedOf} from './scenic-config.mjs';
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
const surface=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
async function decode(src){const image=new Image();image.src=src;await image.decode();return image;}
// One persistent Canvas owns the dry atlas ink through drawing, rest and erasing.
// The target is prepared once, never exchanged for live HTML at completion.
export function createMapInk(canvas,sheet,app){
 const ctx=canvas.getContext('2d'),mask=surface(1,1),masked=surface(1,1);
 let target,width,height,dpr,field,maskPixels;
 function clear(){ctx.clearRect(0,0,canvas.width,canvas.height);delete sheet.dataset.inkPasses;delete sheet.dataset.inkPhase;delete sheet.dataset.inkProgress;delete sheet.dataset.inkGrains;delete sheet.dataset.inkPaintP95;delete sheet.dataset.inkFrames;delete sheet.dataset.inkOutside;delete sheet.dataset.inkBounds;delete app.dataset.qaInkAt;delete app.dataset.qaInkCaptured;target=null;field=null;maskPixels=null;masked.width=mask.width=1;masked.height=mask.height=1;}
 async function prepare(result,record,{isCurrent=()=>true}={}){
  width=sheet.clientWidth;height=sheet.clientHeight;dpr=Math.min(devicePixelRatio||1,SCENIC.maxDpr);
  const art=surface(Math.round(width*dpr),Math.round(height*dpr)),paint=art.getContext('2d');paint.scale(dpr,dpr);
  const origin=sheet.getBoundingClientRect(),inner=sheet.querySelector('.scenic-map-inner'),map=inner.querySelector('.scenic-europe-map'),r=map.getBoundingClientRect();
  if(result?.svg){
   const svg=result.svg.cloneNode(true);svg.setAttribute('width',r.width*dpr);svg.setAttribute('height',r.height*dpr);
   svg.querySelectorAll('style').forEach(n=>n.remove());
   const raster=svg.querySelector('image');
   // The bitmap goes directly to Canvas; the SVG contains only its registered highlight.
   if(raster)raster.remove();
   for(const path of svg.querySelectorAll('.country')){
    path.removeAttribute('style');path.setAttribute('style','animation:none;transform:none;mix-blend-mode:multiply');
    path.setAttribute('fill',path.dataset.country===record.id?'#a27437':'#d9c79e');path.setAttribute('fill-opacity',path.dataset.country===record.id?'.20':'.28');path.setAttribute('stroke','#70471f');path.setAttribute('stroke-width','.9');
   }
   const ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs');defs.innerHTML='<radialGradient id="atlas-selected-wash" cx=".32" cy=".26" r=".85"><stop stop-color="#d0a65e"/><stop offset=".65" stop-color="#ad7f40"/><stop offset="1" stop-color="#82552c"/></radialGradient>';svg.prepend(defs);
   const chosen=svg.querySelector('.scenic-country-overlay');if(chosen){chosen.setAttribute('fill','url(#atlas-selected-wash)');chosen.setAttribute('fill-opacity','.24');}
   const halo=svg.querySelector('.scenic-country-halo');if(halo){halo.removeAttribute('style');halo.setAttribute('fill','none');halo.setAttribute('stroke','#f8d590');halo.setAttribute('stroke-width','2.3');halo.setAttribute('vector-effect','non-scaling-stroke');halo.removeAttribute('filter');}
   const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
   const geo=surface(Math.round(r.width*dpr),Math.round(r.height*dpr)),ink=geo.getContext('2d');ink.scale(dpr,dpr);
   try{
    if(result.image){
     const [x,y,w,h]=svg.getAttribute('viewBox').split(/\s+/).map(Number),sx=result.image.naturalWidth/680,sy=result.image.naturalHeight/500;
     ink.drawImage(result.image,x*sx,y*sy,w*sx,h*sy,0,0,r.width,r.height);
    }
    ink.save();ink.globalCompositeOperation='multiply';ink.shadowColor='#6a411c45';ink.shadowBlur=1.4*dpr;ink.shadowOffsetY=.7*dpr;
    ink.drawImage(await decode(url),0,0,r.width,r.height);ink.restore();
   }finally{URL.revokeObjectURL(url);}
   // Dry, irregular crop edges, with actual holes instead of a blurred vignette.
   const edgePixels=ink.getImageData(0,0,geo.width,geo.height),ep=edgePixels.data;
   for(let y=0;y<geo.height;y++)for(let x=0;x<geo.width;x++){
    const nx=x/dpr,ny=y/dpr,edge=Math.min(nx,ny,r.width-nx,r.height-ny);
    const ridge=5+4*Math.sin(nx*.31+ny*.17)+3*Math.sin(nx*.77-ny*.43);
    if(edge<ridge)ep[(y*geo.width+x)*4+3]=0;
   }
   ink.putImageData(edgePixels,0,0);
   paint.drawImage(geo,r.left-origin.left,r.top-origin.top,r.width,r.height);
  }else{paint.fillStyle='#705332';paint.font='700 14px ScenicBody';paint.textAlign='center';paint.fillText('Mapa jest chwilowo niedostępna.',width/2,height*.56,width-36);}
  // An ivory cartouche protects the heading while geography fills the whole sheet.
  const caption=inner.querySelector('.scenic-map-caption'),cb=caption.getBoundingClientRect();
  const cx=cb.left-origin.left-8,cy=cb.top-origin.top-5,cw=cb.width+15,ch=cb.height+9;
  paint.fillStyle='#fff0d6';paint.beginPath();
  for(let x=0;x<=cw;x+=3){const y=cy+Math.sin(x*.17)*1.2; if(!x)paint.moveTo(cx+x,y);else paint.lineTo(cx+x,y);}
  paint.lineTo(cx+cw,cy+ch-2);
  for(let x=cw;x>=0;x-=3)paint.lineTo(cx+x,cy+ch+Math.sin(x*.23)*1.8);
  paint.closePath();paint.globalAlpha=.94;paint.fill();paint.globalAlpha=1;
  for(const node of inner.querySelectorAll('#scenic-country-name,#scenic-country-capital')){
   const box=node.getBoundingClientRect(),style=getComputedStyle(node),size=parseFloat(style.fontSize);
   paint.font=`${style.fontWeight} ${size}px ${style.fontFamily}`;paint.fillStyle=style.color;paint.textAlign='left';
   const words=node.textContent.split(' '),lines=[''];for(const word of words){const i=lines.length-1,line=lines[i]?lines[i]+' '+word:word;if(paint.measureText(line).width>box.width&&lines[i])lines.push(word);else lines[i]=line;}
   lines.forEach((line,i)=>paint.fillText(line,box.left-origin.left,box.top-origin.top+size*.86+i*parseFloat(style.lineHeight),box.width));
  }
  const city=inner.querySelector('.scenic-capital-icon').getBoundingClientRect();
  paint.save();paint.translate(city.left-origin.left,city.top-origin.top);paint.strokeStyle='#785637';paint.fillStyle='#785637';paint.lineWidth=1.2;
  paint.beginPath();paint.moveTo(1,6);paint.lineTo(7,1);paint.lineTo(13,6);paint.closePath();paint.stroke();
  paint.strokeRect(2,7,10,7);for(const x of [4,7,10]){paint.beginPath();paint.moveTo(x,8);paint.lineTo(x,13);paint.stroke();}paint.beginPath();paint.moveTo(0,15);paint.lineTo(14,15);paint.stroke();paint.restore();
  const flag=inner.querySelector('.scenic-map-flag');try{await flag.decode();const box=flag.getBoundingClientRect();paint.save();paint.translate(box.left-origin.left+box.width/2,box.top-origin.top+box.height/2);paint.rotate(6*Math.PI/180);paint.globalAlpha=.93;paint.drawImage(flag,-box.width/2,-box.height/2,box.width,box.height);paint.restore();}catch{}
  if(!isCurrent())return;
  target=art;canvas.width=art.width;canvas.height=art.height;masked.width=art.width;masked.height=art.height;
  // Coarse ink field is independent of device DPR: bounded CPU work on iPhone.
  mask.width=Math.ceil(width*.8);mask.height=Math.ceil(height*.8);
  const sample=surface(mask.width,mask.height),sctx=sample.getContext('2d',{willReadFrequently:true});sctx.drawImage(art,0,0,sample.width,sample.height);
  const pixels=sctx.getImageData(0,0,sample.width,sample.height).data,rand=randomFrom(seedOf(record.id+':atlas'));
  field=new Float32Array(mask.width*mask.height*5);maskPixels=mask.getContext('2d').createImageData(mask.width,mask.height);
  for(let y=0;y<mask.height;y++)for(let x=0;x<mask.width;x++){
   const k=y*mask.width+x,index=k*4,fx=x/mask.width,fy=y/mask.height;
   const darkness=clamp((245-(pixels[index]*.3+pixels[index+1]*.59+pixels[index+2]*.11))/150);
   // Correlated ridges behave like irregular dry-brush passes, never flying specks.
   const ridge=Math.sin(fy*39+Math.sin(fx*13)*2)*.055+Math.sin(fy*87-fx*9)*.018;
   field[k*5]=clamp(fx*.76+fy*.11+ridge+(rand()-.5)*.065);
   field[k*5+1]=clamp((1-fx)*.66+fy*.18-ridge+(rand()-.5)*.11);
   field[k*5+2]=clamp(fx*.24+(1-fy)*.58+ridge+(rand()-.5)*.17);
   field[k*5+3]=darkness;field[k*5+4]=clamp((1-fx)*.36+fy*.4+ridge+rand()*.17);
  }
  sheet.dataset.inkGrains='0';sheet.dataset.inkBounds='contained';sheet.dataset.inkPasses='3';
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
  if(app.dataset.qa==='true'){sheet.dataset.inkProgress=t.toFixed(3);sheet.dataset.inkOutside='0';}
 }
 async function animate({timeline,reduced,erasing=false}){
  if(!target)return;
  sheet.dataset.inkPhase=erasing?'erasing':'drawing';
  if(reduced){if(erasing)ctx.clearRect(0,0,canvas.width,canvas.height);else{ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(target,0,0);}}
  else {const costs=[];await timeline.tween(erasing?SCENIC.inkEraseMs:SCENIC.inkDrawMs,t=>{
   const started=app.dataset.qa==='true'?performance.now():0;draw(t,erasing);if(started)costs.push(performance.now()-started);
   if(app.dataset.qa==='true'&&app.dataset.qaInkAt!==undefined&&t>=Number(app.dataset.qaInkAt)){const at=app.dataset.qaInkAt;delete app.dataset.qaInkAt;app.dataset.qaInkCaptured=at;timeline.setPaused(true);}
  },app.dataset.qa==='true'?{stopAt:()=>app.dataset.qaInkAt===undefined?undefined:Number(app.dataset.qaInkAt)}:{});if(costs.length){costs.sort((a,b)=>a-b);sheet.dataset.inkPaintP95=costs[Math.floor(costs.length*.95)].toFixed(2);sheet.dataset.inkFrames=String(costs.length);}}
  sheet.dataset.inkPhase=erasing?'empty':'complete';
 }
 return {prepare,reveal:options=>animate(options),erase:options=>animate({...options,erasing:true}),clear};
}
