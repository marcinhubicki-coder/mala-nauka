import {ScenicTiles} from './scenic-tiles.mjs?v=39';
import {decodeScenicImage} from './scenic-ready.mjs?v=39';
let pending;
export function loadWorldAtlas(){
 pending??=(async()=>{
  const [response,index,water]=await Promise.all([fetch(new URL('assets/maps/atlas-world-v39.data',document.baseURI)),fetch(new URL('assets/maps/atlas-world-v39/manifest.json',document.baseURI)).then(r=>{if(!r.ok)throw Error('Atlas index unavailable');return r.json()}),decodeScenicImage('assets/maps/atlas-world-v39/water.webp')]);
  if(!response.ok)throw Error('World geometry unavailable');
  const bytes=await response.arrayBuffer(),magic=new Uint8Array(bytes),json=magic[0]===31&&magic[1]===139?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json():JSON.parse(new TextDecoder().decode(bytes));
  const tiles=new ScenicTiles(index),shapes=json.features.map(f=>({...f,shape:new Path2D(f.path)}));
  const patterns=new WeakMap();
  function paint(ctx,frame,rect){
   ctx.fillStyle='#188fae';ctx.fillRect(0,0,rect.w,rect.h);
   let pattern=patterns.get(ctx);if(!pattern){pattern=ctx.createPattern(water,'repeat');pattern.setTransform(new DOMMatrix().scale(240/water.naturalWidth));patterns.set(ctx,pattern);}
   ctx.save();ctx.scale(rect.w/frame.w,rect.h/frame.h);ctx.translate(-frame.x,-frame.y);ctx.fillStyle=pattern;ctx.fillRect(frame.x,frame.y,frame.w,frame.h);ctx.restore();
   tiles.paint(ctx,frame,rect,pattern);
  }
  addEventListener('pagehide',()=>tiles.destroy(),{once:true});return {...json,paint,shapes,tiles};
 })().catch(error=>{pending=null;throw error});return pending;
}
