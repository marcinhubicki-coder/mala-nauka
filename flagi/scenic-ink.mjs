import {SCENIC,randomFrom,seedOf} from './scenic-config.mjs';
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
const surface=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
// One persistent Canvas owns the dry atlas ink through drawing, rest and erasing.
// The target is prepared once, never exchanged for live HTML at completion.
export function createMapInk(canvas,sheet,app){
 const ctx=canvas.getContext('2d'),mask=surface(1,1),masked=surface(1,1),geographySurface=surface(1,1),hit=surface(1,1).getContext('2d');
 let target,width,height,dpr,field,maskPixels,mapSpec,heading,edgeMask,viewGeneration=0;
 const edgeImage=new Image();edgeImage.src=new URL('assets/maps/europe-edge-v22.webp',document.baseURI).href;
 function paintGeography(paint,frame){
  if(!mapSpec)return;const {result,rect,paths}=mapSpec;
  const geo=geographySurface,w=Math.round(rect.w*dpr),h=Math.round(rect.h*dpr);if(geo.width!==w||geo.height!==h){geo.width=w;geo.height=h;}
  const ink=geo.getContext('2d');ink.setTransform(dpr,0,0,dpr,0,0);ink.clearRect(0,0,rect.w,rect.h);
  if(result.image){const sx=result.image.naturalWidth/680,sy=result.image.naturalHeight/500;ink.drawImage(result.image,frame.x*sx,frame.y*sy,frame.w*sx,frame.h*sy,0,0,rect.w,rect.h);}
  ink.save();ink.scale(rect.w/frame.w,rect.h/frame.h);ink.translate(-frame.x,-frame.y);ink.lineJoin='round';
  const scale=rect.w/frame.w;
  for(const {path,box,selected} of paths){
   if(selected){ink.shadowColor='#17442d70';ink.shadowBlur=4/scale;ink.strokeStyle='#ffefad';ink.lineWidth=3/scale;ink.stroke(path);ink.shadowBlur=0;
    ink.save();ink.globalCompositeOperation='multiply';ink.globalAlpha=.62;ink.fillStyle='#3c8750';ink.fill(path);ink.restore();
    ink.strokeStyle='#fff4c5';ink.lineWidth=1.1/scale;ink.stroke(path);
   }else if(!result.image){ink.fillStyle='#c8d18a';ink.fill(path);ink.strokeStyle='#fff2c7';ink.lineWidth=.7/scale;ink.stroke(path);}
  }
  ink.restore();
  // Constant-size labels: exclude cropped words and dense overlaps on mobile.
  const accepted=[],near=frame.w<500;
  ink.font='800 11px ScenicBody';ink.textAlign='center';ink.lineJoin='round';
  const candidates=(result.labels||[]).filter(item=>item.point&&!paths.some(p=>p.selected&&item.id===app.dataset.country)).sort((a,b)=>b.box.w*b.box.h-a.box.w*a.box.h);
  for(const item of candidates){const blend=clamp((frame.w-result.crop.w)/(result.fullCrop.w-result.crop.w)),anchor=item.nearPoint||item.point,point={x:anchor.x+(item.point.x-anchor.x)*blend,y:anchor.y+(item.point.y-anchor.y)*blend};const x=(point.x-frame.x)/frame.w*rect.w,y=(point.y-frame.y)/frame.h*rect.h;
   const half=ink.measureText(item.name).width/2;const active=paths.find(p=>p.selected);if(active&&[-half,0,half].some(dx=>hit.isPointInPath(active.path,frame.x+(x+dx)/rect.w*frame.w,point.y)))continue;if(x<half+22||x>rect.w-half-22||y<24||y>rect.h-26||(x+half>rect.w-90&&y>rect.h-46)||accepted.some(p=>Math.abs(p.x-x)<p.half+half+8&&Math.abs(p.y-y)<18))continue;
   if(!near&&item.box.w<45)continue;
   ink.strokeStyle='#fff5d9';ink.lineWidth=3;ink.strokeText(item.name,x,y);ink.fillStyle='#354428';ink.fillText(item.name,x,y);accepted.push({id:item.id,name:item.name,x,y,half});if(accepted.length>=(near?6:7))break;
  }
  if(app.dataset.qa==='true')sheet.dataset.drawnLabels=JSON.stringify(accepted.map(p=>p.name));
  ink.globalCompositeOperation='destination-in';ink.drawImage(edgeMask,0,0,rect.w,rect.h);ink.globalCompositeOperation='source-over';
  paint.drawImage(geo,rect.x,rect.y,rect.w,rect.h);
 }
 function clear(){geographySurface.width=geographySurface.height=1;viewGeneration++;mapSpec=null;if(heading)heading.width=heading.height=1;if(edgeMask)edgeMask.width=edgeMask.height=1;if(target)target.width=target.height=1;canvas.width=canvas.height=1;delete sheet.dataset.drawnLabels;delete sheet.dataset.toolsReady;sheet.querySelector('.scenic-atlas-tools').inert=true;delete sheet.dataset.inkPasses;delete sheet.dataset.inkPhase;delete sheet.dataset.inkProgress;delete sheet.dataset.inkGrains;delete sheet.dataset.inkPaintP95;delete sheet.dataset.inkFrames;delete sheet.dataset.inkOutside;delete sheet.dataset.inkBounds;delete app.dataset.qaInkAt;delete app.dataset.qaInkCaptured;target=null;field=null;maskPixels=null;masked.width=mask.width=1;masked.height=mask.height=1;}
 async function prepare(result,record,{isCurrent=()=>true}={}){
  width=sheet.clientWidth;height=sheet.clientHeight;dpr=Math.min(devicePixelRatio||1,SCENIC.maxDpr);
  const art=surface(Math.round(width*dpr),Math.round(height*dpr));let paint=art.getContext('2d');paint.scale(dpr,dpr);
  const origin=sheet.getBoundingClientRect(),inner=sheet.querySelector('.scenic-map-inner'),map=inner.querySelector('.scenic-europe-map'),r=map.getBoundingClientRect();
  mapSpec=null;viewGeneration++;
  try{await edgeImage.decode();}catch{}
  if(!isCurrent()){art.width=art.height=1;return;}
  edgeMask=surface(Math.round(r.width*dpr),Math.round(r.height*dpr));
  const em=edgeMask.getContext('2d');
  if(edgeImage.naturalWidth)em.drawImage(edgeImage,0,0,edgeMask.width,edgeMask.height);
  else{em.fillStyle='#fff';em.beginPath();for(let x=0;x<edgeMask.width;x+=3){const y=8+5*Math.sin(x*.09)+3*Math.sin(x*.27);if(!x)em.moveTo(x,y);else em.lineTo(x,y);}em.lineTo(edgeMask.width,edgeMask.height-12);em.lineTo(8,edgeMask.height-8);em.closePath();em.fill();}
  if(result?.svg){
   const paths=[...result.svg.querySelectorAll('.country')].map(node=>{let path;if(node.tagName.toLowerCase()==='circle'){path=new Path2D();path.arc(Number(node.getAttribute('cx')),Number(node.getAttribute('cy')),Number(node.getAttribute('r')),0,Math.PI*2);}else path=new Path2D(node.getAttribute('d'));return {path,box:node.getBBox(),selected:node.dataset.country===record.id};});
   mapSpec={result,paths,rect:{x:r.left-origin.left,y:r.top-origin.top,w:r.width,h:r.height},frame:{...result.crop}};
   paintGeography(paint,result.crop);
  }else{paint.fillStyle='#705332';paint.font='700 14px ScenicBody';paint.textAlign='center';paint.fillText('Mapa jest chwilowo niedostępna.',width/2,height*.56,width-36);}
  heading=surface(art.width,art.height);const headingPaint=heading.getContext('2d');headingPaint.scale(dpr,dpr);
  const geography=paint;paint=headingPaint;
  // Heading is outside the map's permanent paint viewport. No rectangular
  // backing is needed: the original parchment supplies natural contrast.
  for(const node of inner.querySelectorAll('.scenic-title-line,#scenic-country-capital')){
   const box=node.getBoundingClientRect(),style=getComputedStyle(node),size=parseFloat(style.fontSize);
   paint.font=`${style.fontWeight} ${size}px ${style.fontFamily}`;paint.fillStyle=style.color;paint.textAlign='left';
   paint.fillText(node.textContent,box.left-origin.left,box.top-origin.top+size*.86);
  }
  const city=inner.querySelector('.scenic-capital-icon').getBoundingClientRect();
  paint.save();paint.translate(city.left-origin.left,city.top-origin.top);paint.strokeStyle='#785637';paint.fillStyle='#785637';paint.lineWidth=1.2;
  paint.beginPath();paint.moveTo(1,6);paint.lineTo(7,1);paint.lineTo(13,6);paint.closePath();paint.stroke();
  paint.strokeRect(2,7,10,7);for(const x of [4,7,10]){paint.beginPath();paint.moveTo(x,8);paint.lineTo(x,13);paint.stroke();}paint.beginPath();paint.moveTo(0,15);paint.lineTo(14,15);paint.stroke();paint.restore();
  const flag=inner.querySelector('.scenic-map-flag');try{await flag.decode();const box=flag.getBoundingClientRect();paint.save();paint.translate(box.left-origin.left+box.width/2,box.top-origin.top+box.height/2);paint.rotate(6*Math.PI/180);paint.globalAlpha=.93;paint.drawImage(flag,-box.width/2,-box.height/2,box.width,box.height);paint.restore();}catch{}
  geography.drawImage(heading,0,0,width,height);paint=geography;
  if(!isCurrent()){art.width=art.height=1;return;}
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
  sample.width=sample.height=1;
  sheet.dataset.inkGrains='0';sheet.dataset.inkBounds='contained';sheet.dataset.inkPasses='3';
 }
 function draw(t,erasing){
  if(!erasing&&t>.88){sheet.dataset.toolsReady='true';sheet.querySelector('.scenic-atlas-tools').inert=false;}
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
  if(erasing){viewGeneration++;delete sheet.dataset.toolsReady;sheet.querySelector('.scenic-atlas-tools').inert=true;}
  sheet.dataset.inkPhase=erasing?'erasing':'drawing';
  if(reduced){if(erasing)ctx.clearRect(0,0,canvas.width,canvas.height);else{ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(target,0,0);}}
  else {const costs=[];await timeline.tween(erasing?SCENIC.inkEraseMs:SCENIC.inkDrawMs,t=>{
   const started=app.dataset.qa==='true'?performance.now():0;draw(t,erasing);if(started)costs.push(performance.now()-started);
   if(app.dataset.qa==='true'&&app.dataset.qaInkAt!==undefined&&t>=Number(app.dataset.qaInkAt)){const at=app.dataset.qaInkAt;delete app.dataset.qaInkAt;app.dataset.qaInkCaptured=at;timeline.setPaused(true);}
  },app.dataset.qa==='true'?{stopAt:()=>app.dataset.qaInkAt===undefined?undefined:Number(app.dataset.qaInkAt)}:{});if(costs.length){costs.sort((a,b)=>a-b);sheet.dataset.inkPaintP95=costs[Math.floor(costs.length*.95)].toFixed(2);sheet.dataset.inkFrames=String(costs.length);}}
  if(!erasing){sheet.dataset.toolsReady='true';sheet.querySelector('.scenic-atlas-tools').inert=false;}
  sheet.dataset.inkPhase=erasing?'empty':'complete';
 }
 async function setView(view,{timeline,reduced}){
  if(!target||!mapSpec)return;const generation=++viewGeneration,start={...mapSpec.frame},end=view==='europe'?mapSpec.result.fullCrop:mapSpec.result.crop;
  const update=t=>{if(generation!==viewGeneration)return;const p=ease(t),frame={};for(const key of ['x','y','w','h'])frame[key]=start[key]+(end[key]-start[key])*p;mapSpec.frame=frame;
   const paint=target.getContext('2d');paint.setTransform(dpr,0,0,dpr,0,0);paint.clearRect(0,0,width,height);paintGeography(paint,frame);paint.drawImage(heading,0,0,width,height);
   ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(target,0,0);
  };
  if(reduced)update(1);else await timeline.tween(SCENIC.atlas.viewMs,update);
 }
 return {prepare,setView,reveal:options=>animate(options),erase:options=>animate({...options,erasing:true}),clear};
}
