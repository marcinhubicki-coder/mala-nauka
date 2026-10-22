// A continuous, geographically registered atlas. Every continent and every
// highlight uses the very same paths; imagegen supplies material and relief.
import {randomFrom,seedOf} from './scenic-config.mjs?v=36';
let pending;
const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const image=src=>new Promise(resolve=>{const img=new Image(),timer=setTimeout(()=>resolve(null),5000);img.onload=()=>{clearTimeout(timer);resolve(img)};img.onerror=()=>{clearTimeout(timer);resolve(null)};img.src=new URL(src,document.baseURI).href;});
export function loadWorldAtlas(){
 pending??=(async()=>{
  const [response,ground,mountain]=await Promise.all([fetch(new URL('assets/maps/atlas-world-v36.data',document.baseURI)),image('assets/maps/atlas-ground-v36.webp'),image('assets/maps/atlas-mountain-v36.webp')]);
  if(!response.ok)throw Error('World atlas unavailable');
  const bytes=await response.arrayBuffer(),magic=new Uint8Array(bytes);
  const json=magic[0]===31&&magic[1]===139?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json():JSON.parse(new TextDecoder().decode(bytes));
  const shapes=json.features.map(f=>({...f,shape:new Path2D(f.path)})),land=new Path2D();for(const f of shapes)land.addPath(f.shape);
  const regions=json.regions.map(r=>({...r,shape:new Path2D(r.path)})),rivers=json.rivers.map(r=>({...r,shape:new Path2D(r.path)})),lakes=json.lakes.map(r=>({...r,shape:new Path2D(r.path)}));
  const scratch=document.createElement('canvas').getContext('2d'),reliefCache=new Map();
  function relief(region){
   if(reliefCache.has(region.name))return reliefCache.get(region.name);
   const {box,shape}=region,step=Math.max(11,Math.sqrt(box.w*box.h/220)),rand=randomFrom(seedOf(region.name)),points=[];
   for(let y=box.y;y<box.y+box.h;y+=step*.75)for(let x=box.x;x<box.x+box.w;x+=step){const px=x+(rand()-.5)*step,py=y+(rand()-.5)*step;if(scratch.isPointInPath(shape,px,py,'evenodd')&&!points.some(p=>(p.x-px)**2+(p.y-py)**2<step*step*.5))points.push({x:px,y:py,w:11+rand()*8});}
   points.sort((a,b)=>a.y-b.y);reliefCache.set(region.name,points);return points;
  }
  let groundPattern;
  function paint(ctx,frame,rect){
   const scale=rect.w/frame.w;
   // The sea fills the camera before the torn viewport mask is applied. A
   // geographic source edge can never expose a rectangular patch of parchment.
   const sea=ctx.createLinearGradient(0,0,rect.w,rect.h);sea.addColorStop(0,'#188fae');sea.addColorStop(.5,'#27b8c8');sea.addColorStop(1,'#107eaa');ctx.fillStyle=sea;ctx.fillRect(0,0,rect.w,rect.h);
   ctx.save();ctx.scale(scale,rect.h/frame.h);ctx.translate(-frame.x,-frame.y);
   ctx.strokeStyle='#daf1d67a';ctx.lineWidth=.7/scale;
   const waves=Math.max(12,22/scale);for(let y=Math.floor(frame.y/waves)*waves;y<frame.y+frame.h;y+=waves)for(let x=Math.floor(frame.x/waves)*waves;x<frame.x+frame.w;x+=waves*2){ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+3/scale,y+2/scale,x+7/scale,y);ctx.stroke();}
   ctx.save();ctx.clip(land,'evenodd');
   if(ground&&!groundPattern){groundPattern=ctx.createPattern(ground,'repeat');groundPattern.setTransform(new DOMMatrix().scale(240/ground.naturalWidth));}
   ctx.fillStyle=groundPattern||'#c2d07a';ctx.fillRect(frame.x,frame.y,frame.w,frame.h);
   // Deserts and mountain belts follow named physical-region footprints.
   for(const r of regions){if(!intersects(r.box,frame))continue;if(r.kind==='desert'){ctx.fillStyle='#dcc58ec9';ctx.fill(r.shape,'evenodd');continue;}ctx.fillStyle='#8b765627';ctx.fill(r.shape,'evenodd');}
   for(const r of regions){if(r.kind!=='mountain'||!intersects(r.box,frame))continue;for(const p of relief(r)){if(p.x<frame.x-20||p.x>frame.x+frame.w+20||p.y<frame.y-20||p.y>frame.y+frame.h+20)continue;if(mountain)ctx.drawImage(mountain,p.x-p.w/2,p.y-p.w*.62,p.w,p.w*.72);}}
   ctx.fillStyle='#48bdcd';ctx.strokeStyle='#f2e4b3';ctx.lineWidth=.45/scale;
   for(const lake of lakes)if(intersects(lake.box,frame)){ctx.fill(lake.shape,'evenodd');ctx.stroke(lake.shape);}
   ctx.strokeStyle='#31aebd';ctx.lineWidth=Math.max(.5,1/scale);ctx.lineCap='round';ctx.lineJoin='round';
   for(const river of rivers)if(intersects(river.box,frame)&&(scale>.6||river.rank<=3))ctx.stroke(river.shape);
   ctx.restore();
   // These are also the source paths used by the interactive overlay.
   ctx.strokeStyle='#fff1ba';ctx.lineWidth=Math.max(.6,1.2/scale);ctx.lineJoin='round';
   for(const f of shapes)if(intersects(f.bounds,frame))ctx.stroke(f.shape);
   ctx.restore();
  }
  return {...json,paint,shapes};
 })().catch(error=>{pending=null;throw error});
 return pending;
}
