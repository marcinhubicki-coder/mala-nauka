import {SCENIC,randomFrom,seedOf} from './scenic-config.mjs';
import {layoutAtlasLabels} from './scenic-atlas-labels.mjs';
import {FLAGS} from '../data/flags.mjs';
import {drawCapitalSymbol} from './scenic-capital.mjs';
const EUROPE_IDS=new Set(FLAGS.filter(record=>record.continent==='europe').map(record=>record.id));
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
const surface=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
// Persistent geographic and heading canvases share one ink reveal/erase mask.
// Prepared surfaces remain continuous; no live HTML swap at completion.
export function createMapInk(canvas,sheet,app){
 const ctx=canvas.getContext('2d'),headingCanvas=sheet.querySelector('#scenic-map-heading'),headingCtx=headingCanvas.getContext('2d'),mask=surface(1,1),masked=surface(1,1),geographySurface=surface(1,1),hit=surface(1,1).getContext('2d');
 let target,width,height,dpr,field,maskPixels,mapSpec,heading,edgeMask,viewGeneration=0;
 const edgeImage=new Image();edgeImage.src=new URL('assets/maps/europe-edge-v22.webp',document.baseURI).href;
 function paintGeography(paint,frame){
  if(!mapSpec)return;const {result,rect,paths}=mapSpec;
  const geo=geographySurface,w=Math.round(rect.w*dpr),h=Math.round(rect.h*dpr);if(geo.width!==w||geo.height!==h){geo.width=w;geo.height=h;}
  const ink=geo.getContext('2d');ink.setTransform(dpr,0,0,dpr,0,0);ink.clearRect(0,0,rect.w,rect.h);
  if(result.image){const sx=result.image.naturalWidth/680,sy=result.image.naturalHeight/500;ink.drawImage(result.image,frame.x*sx,frame.y*sy,frame.w*sx,frame.h*sy,0,0,rect.w,rect.h);}
  ink.save();ink.scale(rect.w/frame.w,rect.h/frame.h);ink.translate(-frame.x,-frame.y);ink.lineJoin='round';
  const scale=rect.w/frame.w;
  for(const {path,box,selected,id} of paths){
   if(selected){ink.shadowColor='#17442d70';ink.shadowBlur=4/scale;ink.strokeStyle='#ffefad';ink.lineWidth=3/scale;ink.stroke(path);ink.shadowBlur=0;
    ink.save();ink.globalCompositeOperation='multiply';ink.globalAlpha=.34;ink.fillStyle='#3c8750';ink.fill(path);ink.restore();
    ink.strokeStyle='#fff4c5';ink.lineWidth=1.1/scale;ink.stroke(path);
   }else{if(!result.image){ink.fillStyle='#c8d18a';ink.fill(path);}ink.strokeStyle='#fff5d1cc';ink.lineWidth=.55/scale;ink.stroke(path);if(mapSpec.neighbors.has(id)){ink.fillStyle='#8c58272c';ink.fill(path);ink.strokeStyle='#fff5d1';ink.lineWidth=3/scale;ink.stroke(path);ink.strokeStyle='#70421d';ink.lineWidth=1.8/scale;ink.stroke(path);}}
  }
  ink.restore();
  // The atlas's source rectangle is inside the viewport in the overview.
  // Chip that rectangle too, so it can never expose a straight vertical edge.
  ink.globalCompositeOperation='destination-in';ink.drawImage(edgeImage.naturalWidth?edgeImage:edgeMask,-frame.x/frame.w*rect.w,-frame.y/frame.h*rect.h,680/frame.w*rect.w,500/frame.h*rect.h);ink.globalCompositeOperation='source-over';
  const blend=clamp((frame.w-result.crop.w)/(result.fullCrop.w-result.crop.w||1)),nearMix=1-blend;
  ink.font='700 10.5px ScenicBody';ink.textAlign='center';ink.textBaseline='top';ink.lineJoin='round';
  const plans=new Map();for(const label of mapSpec.nearLabels)plans.set(label.key,{near:label});for(const label of mapSpec.fullLabels){if(!plans.has(label.key))plans.set(label.key,{});plans.get(label.key).full=label;}
  const drawn=[];
  for(const pair of plans.values()){
   const label=pair.near||pair.full,alpha=pair.near&&pair.full?1:pair.near?nearMix:blend;if(alpha<.015)continue;
   const p0=pair.near?.point||pair.full.point,p1=pair.full?.point||pair.near.point,point={x:p0.x+(p1.x-p0.x)*blend,y:p0.y+(p1.y-p0.y)*blend},ax=(point.x-frame.x)/frame.w*rect.w,ay=(point.y-frame.y)/frame.h*rect.h;
   const a=pair.near||{x:ax,y:ay},b=pair.full||{x:ax,y:ay},x=a.x+(b.x-a.x)*blend,y=a.y+(b.y-a.y)*blend;
   ink.save();ink.globalAlpha=alpha;
   const leader=(pair.near?.leader&&nearMix>.01)||(pair.full?.leader&&blend>.01);
   if(leader){ink.beginPath();ink.moveTo(ax,ay);ink.lineTo(x,y+5);ink.strokeStyle='#fff4d8';ink.lineWidth=3;ink.stroke();ink.strokeStyle='#644321';ink.lineWidth=1.2;ink.stroke();ink.fillStyle='#fff3ce';ink.beginPath();ink.arc(ax,ay,2,0,Math.PI*2);ink.fill();ink.stroke();}
   label.lines.forEach((text,i)=>{ink.strokeStyle='#fff5dce8';ink.lineWidth=2.2;ink.strokeText(text,x,y+i*11);ink.fillStyle=label.capital?'#6b3b25':label.selected?'#18482f':'#354428';ink.fillText(text,x,y+i*11);});
   const flag=label.flag&&result.flags[label.id];if(flag&&pair.near&&nearMix>.015){const ratio=flag.naturalWidth/flag.naturalHeight,fw=Math.min(16,10*ratio),fh=fw/ratio,fy=y+label.lines.length*11+2;ink.globalAlpha=alpha*nearMix;ink.fillStyle='#fffae9';ink.shadowColor='#35482f50';ink.shadowBlur=2;ink.fillRect(x-fw/2-1,fy-1,fw+2,fh+2);ink.shadowBlur=0;ink.drawImage(flag,x-fw/2,fy,fw,fh);}
   const activeLabel=blend>.5?(pair.full||pair.near):(pair.near||pair.full);
   ink.restore();drawn.push({id:label.id,name:label.name,capital:!!label.capital,flag:!!flag&&!!pair.near&&nearMix>.5,leader:!!leader,x,y,anchor:{x:ax,y:ay},box:{x:x-activeLabel.box.w/2,y:y-2,w:activeLabel.box.w,h:activeLabel.box.h}});
  }
  if(result.capital&&nearMix>.01){
   const x=(result.capital.point[0]-frame.x)/frame.w*rect.w,y=(result.capital.point[1]-frame.y)/frame.h*rect.h;
   ink.save();ink.globalAlpha=nearMix;drawCapitalSymbol(ink,x-9,y-9,18,{circle:true});ink.restore();
  }
  if(app.dataset.qa==='true'){sheet.dataset.drawnLabels=JSON.stringify(drawn.filter(x=>!x.capital).map(p=>p.name));sheet.dataset.atlasLabels=JSON.stringify(drawn);sheet.dataset.capitalPin=JSON.stringify(result.capital);sheet.dataset.atlasFrame=JSON.stringify(frame);}
  ink.globalCompositeOperation='destination-in';ink.drawImage(edgeMask,0,0,rect.w,rect.h);ink.globalCompositeOperation='source-over';
  paint.drawImage(geo,rect.x,rect.y,rect.w,rect.h);
 }
 function clear(){delete sheet.dataset.highlightedNeighbors;delete sheet.dataset.atlasLabels;delete sheet.dataset.capitalPin;geographySurface.width=geographySurface.height=1;viewGeneration++;mapSpec=null;if(heading)heading.width=heading.height=1;if(edgeMask)edgeMask.width=edgeMask.height=1;if(target)target.width=target.height=1;canvas.width=canvas.height=headingCanvas.width=headingCanvas.height=1;delete sheet.dataset.drawnLabels;delete sheet.dataset.toolsReady;sheet.querySelector('.scenic-atlas-tools').inert=true;delete sheet.dataset.inkPasses;delete sheet.dataset.inkPhase;delete sheet.dataset.inkProgress;delete sheet.dataset.inkGrains;delete sheet.dataset.inkPaintP95;delete sheet.dataset.inkFrames;delete sheet.dataset.inkOutside;delete sheet.dataset.inkBounds;delete app.dataset.qaInkAt;delete app.dataset.qaInkCaptured;target=null;field=null;maskPixels=null;masked.width=mask.width=1;masked.height=mask.height=1;}
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
  // The torn paint edge can reach farther inward than a rectangular inset.
  // Inspect its alpha once while preparing layouts, never on animation frames.
  const edgePixels=em.getImageData(0,0,edgeMask.width,edgeMask.height).data;
  const sourceEdge=surface(edgeImage.naturalWidth||edgeMask.width,edgeImage.naturalHeight||edgeMask.height),sourceCtx=sourceEdge.getContext('2d');sourceCtx.drawImage(edgeImage.naturalWidth?edgeImage:edgeMask,0,0,sourceEdge.width,sourceEdge.height);const sourcePixels=sourceCtx.getImageData(0,0,sourceEdge.width,sourceEdge.height).data;
  const sourceInsideEdge=(box,frame)=>{
   for(let y=box.y;y<=box.y+box.h;y+=1)for(let x=box.x;x<=box.x+box.w;x+=1){
    const sx=Math.floor((frame.x+x/r.width*frame.w)/680*sourceEdge.width),sy=Math.floor((frame.y+y/r.height*frame.h)/500*sourceEdge.height);
    if(sx<0||sy<0||sx>=sourceEdge.width||sy>=sourceEdge.height||sourcePixels[(sy*sourceEdge.width+sx)*4+3]<240)return false;
   }
   return true;
  };
  const labelInsideEdge=box=>{
   const left=Math.floor(box.x*dpr),top=Math.floor(box.y*dpr),right=Math.ceil((box.x+box.w)*dpr),bottom=Math.ceil((box.y+box.h)*dpr);
   if(left<0||top<0||right>=edgeMask.width||bottom>=edgeMask.height)return false;
   for(let y=top;y<=bottom;y+=2)for(let x=left;x<=right;x+=2)if(edgePixels[(y*edgeMask.width+x)*4+3]<240)return false;
   return true;
  };
  if(result?.svg){
   const paths=result.geometry.map(item=>({...item,path:new Path2D(item.path),selected:item.id===record.id}));
   mapSpec={result,paths,neighbors:new Set(),rect:{x:r.left-origin.left,y:r.top-origin.top,w:r.width,h:r.height},frame:{...result.crop}};
   const measure=surface(1,1).getContext('2d');measure.font='700 10.5px ScenicBody';
   function plan(frame,near){
    const project=p=>({ax:(p.x-frame.x)/frame.w*r.width,ay:(p.y-frame.y)/frame.h*r.height}),active=paths.find(p=>p.selected);
    const items=result.labels.filter(item=>item.point&&(near?item.id!==record.id&&(result.neighbors.length>0?result.neighbors.includes(item.id):!!result.flags[item.id]):EUROPE_IDS.has(item.id)&&(item.box.w>24||item.id===record.id))).sort((a,b)=>{
     const priority=x=>near?(result.neighbors.includes(x.id)?0:1):(x.id===record.id?-1:0);
     return priority(a)-priority(b)||(near&&priority(a)===0?a.box.w*a.box.h-b.box.w*b.box.h:b.box.w*b.box.h-a.box.w*a.box.h);
    }).map(item=>{const point=near?(item.nearPoint||item.point):item.point;return {...item,...project(point),point,key:'country:'+item.id,flag:!!result.flags[item.id],selected:item.id===record.id,required:near?result.neighbors.includes(item.id):item.id===record.id,small:item.box.w/frame.w*r.width<measure.measureText(item.name).width+6};});
    if(near&&result.capital){const point={x:result.capital.point[0],y:result.capital.point[1]};items.unshift({key:'capital:'+record.id,id:record.id,name:record.capital,...project(point),point,capital:true});}
    return layoutAtlasLabels(items,{width:r.width,height:r.height,measure:text=>measure.measureText(text).width,near,max:near?8:7,onCountry:(item,box)=>{const path=paths.find(p=>p.id===item.id)?.path;return path&&hit.isPointInPath(path,frame.x+(box.x+box.w/2)/r.width*frame.w,frame.y+(box.y+box.h/2)/r.height*frame.h);},allowed:box=>labelInsideEdge(box)&&sourceInsideEdge(box,frame),blocked:box=>near&&[.15,.5,.85].every(f=>hit.isPointInPath(active.path,frame.x+(box.x+box.w*f)/r.width*frame.w,frame.y+(box.y+box.h*.5)/r.height*frame.h))});
   }
   mapSpec.nearLabels=plan(result.crop,true);mapSpec.fullLabels=plan(result.fullCrop,false);
   paintGeography(paint,result.crop);
  }else{paint.fillStyle='#705332';paint.font='700 14px ScenicBody';paint.textAlign='center';paint.fillText('Mapa jest chwilowo niedostępna.',width/2,height*.56,width-36);}
  heading=surface(art.width,art.height);const headingPaint=heading.getContext('2d');headingPaint.scale(dpr,dpr);
  const geography=paint;paint=headingPaint;
  // Heading is outside the map's permanent paint viewport. No rectangular
  // backing is needed: the original parchment supplies natural contrast.
  let headerTop=Infinity,headerBottom=-Infinity;
  for(const node of inner.querySelectorAll('.scenic-title-line,#scenic-country-capital')){
   const box=node.getBoundingClientRect(),style=getComputedStyle(node),size=parseFloat(style.fontSize);
   paint.font=`${style.fontWeight} ${size}px ${style.fontFamily}`;paint.letterSpacing=(parseFloat(style.letterSpacing)||0)+'px';paint.fillStyle=style.color;paint.textAlign='left';
   const baseline=box.top-origin.top+size*.86,metrics=paint.measureText(node.textContent);
   headerTop=Math.min(headerTop,baseline-metrics.actualBoundingBoxAscent);headerBottom=Math.max(headerBottom,baseline+metrics.actualBoundingBoxDescent);
   paint.fillText(node.textContent,box.left-origin.left,baseline);
  }
  const city=inner.querySelector('.scenic-capital-icon').getBoundingClientRect();
  drawCapitalSymbol(paint,city.left-origin.left,city.top-origin.top,18);
  const flag=inner.querySelector('.scenic-map-flag');try{await flag.decode();const box=flag.getBoundingClientRect(),scale=Math.min(box.width/flag.naturalWidth,(headerBottom-headerTop)/flag.naturalHeight),fw=flag.naturalWidth*scale,fh=flag.naturalHeight*scale;paint.save();paint.translate(box.right-origin.left-fw/2,(headerTop+headerBottom)/2);paint.rotate(-2*Math.PI/180);paint.shadowColor='#65472a38';paint.shadowBlur=3;paint.shadowOffsetY=1.5;paint.drawImage(flag,-fw/2,-fh/2,fw,fh);paint.shadowColor='transparent';const sheen=paint.createLinearGradient(-fw/2,0,fw/2,fh);sheen.addColorStop(0,'#fff3');sheen.addColorStop(.45,'#fff0');sheen.addColorStop(1,'#63472910');paint.fillStyle=sheen;paint.fillRect(-fw/2,-fh/2,fw,fh);paint.restore();}catch{}
  geography.drawImage(heading,0,0,width,height);paint=geography;
  if(!isCurrent()){art.width=art.height=1;return;}
  target=art;canvas.width=headingCanvas.width=art.width;canvas.height=headingCanvas.height=art.height;masked.width=art.width;masked.height=art.height;
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
  // The separate heading surface shares the ink mask, while only geographic
  // pigment multiplies into the paper. White flags retain their own material.
  paint.clearRect(0,0,width,mapSpec?.rect.y||112);
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
  out.globalCompositeOperation='source-over';out.clearRect(0,0,masked.width,masked.height);out.drawImage(heading,0,0);out.globalCompositeOperation='destination-in';out.drawImage(mask,0,0,masked.width,masked.height);headingCtx.clearRect(0,0,headingCanvas.width,headingCanvas.height);headingCtx.drawImage(masked,0,0);
  if(app.dataset.qa==='true'){sheet.dataset.inkProgress=t.toFixed(3);sheet.dataset.inkOutside='0';}
 }
 async function animate({timeline,reduced,erasing=false}){
  if(!target)return;
  if(erasing){viewGeneration++;delete sheet.dataset.toolsReady;sheet.querySelector('.scenic-atlas-tools').inert=true;}
  sheet.dataset.inkPhase=erasing?'erasing':'drawing';
  if(reduced){if(erasing){ctx.clearRect(0,0,canvas.width,canvas.height);headingCtx.clearRect(0,0,headingCanvas.width,headingCanvas.height);}else{ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(target,0,0);headingCtx.drawImage(heading,0,0);}}
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
   const paint=target.getContext('2d');paint.setTransform(dpr,0,0,dpr,0,0);paint.clearRect(0,0,width,height);paintGeography(paint,frame);
   ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(target,0,0);
  };
  if(reduced)update(1);else await timeline.tween(SCENIC.atlas.viewMs,update);
 }
 function setNeighbor(id,active){if(!mapSpec||!target)return;if(active)mapSpec.neighbors.add(id);else mapSpec.neighbors.delete(id);sheet.dataset.highlightedNeighbors=JSON.stringify([...mapSpec.neighbors]);const paint=target.getContext('2d');paint.setTransform(dpr,0,0,dpr,0,0);paint.clearRect(0,0,width,height);paintGeography(paint,mapSpec.frame);ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(target,0,0);}
 return {prepare,setView,setNeighbor,reveal:options=>animate(options),erase:options=>animate({...options,erasing:true}),clear};
}
