// Sparse world tiles in the same coordinates as the country paths. Authoring
// masters never enter the browser; decoded allocations are reserved up front.
export class ScenicTiles{
 constructor(manifest,{budget=24*1024*1024,compressedBudget=8*1024*1024}={}){
  this.manifest=manifest;this.budget=budget;this.compressedBudget=compressedBudget;
  this.cache=new Map();this.blobs=new Map();this.fetches=new Map();this.controllers=new Map();this.bytes=0;this.blobBytes=0;this.downloads=0;this.peak=0;this.cap=manifest.levels.length-1;this.serial=Promise.resolve();this.active=null;this.destroyed=false;
  for(const level of manifest.levels)level.keys=new Set(level.available);
 }
 keys(frame,level,includeOcean=false){
  const m=this.manifest,span=m.tileSize/level.scale,period=m.width/m.pixelScale,result=[];
  const first=Math.floor((frame.x-m.origin.x)/period),last=Math.floor((frame.x+frame.w-m.origin.x)/period);
  for(let wrap=first;wrap<=last;wrap++){
   const ox=m.origin.x+wrap*period;
   for(let y=Math.max(0,Math.floor((frame.y-m.origin.y)/span));y<Math.min(level.rows,Math.ceil((frame.y+frame.h-m.origin.y)/span));y++)
    for(let x=Math.max(0,Math.floor((frame.x-ox)/span));x<Math.min(level.cols,Math.ceil((frame.x+frame.w-ox)/span));x++){
     const hasLand=level.keys.has(x+'-'+y);if(!hasLand&&!includeOcean)continue;
     const left=x*m.tileSize,top=y*m.tileSize,gx=left?m.gutter:0,gy=top?m.gutter:0;
     const width=Math.min(m.tileSize,level.width-left)+gx+(left+m.tileSize<level.width?m.gutter:0),height=Math.min(m.tileSize,level.height-top)+gy+(top+m.tileSize<level.height?m.gutter:0);
     result.push({key:level.id+'/'+x+'-'+y,hasLand,level,x,y,width,height,bytes:width*height*4,worldX:ox+(left-gx)/level.scale,worldY:m.origin.y+(top-gy)/level.scale});
    }
  }
  return result;
 }
 level(frame,width,cap=this.cap){const target=width*Math.min(globalThis.devicePixelRatio||1,2)/frame.w;return this.manifest.levels.slice(0,cap+1).find(l=>l.scale>=target*.8)||this.manifest.levels[cap];}
 plan(frames,width,ceiling=this.manifest.levels.length-1){
  // Prepare native close detail above a complete overview. During zoom the
  // same patches stay in world space; no intermediate network/decode is needed.
  const samples=[];for(let i=0;i<frames.length;i++){samples.push(frames[i]);if(i)for(let j=1;j<16;j++)samples.push(Object.fromEntries(['x','y','w','h'].map(k=>[k,frames[i-1][k]+(frames[i][k]-frames[i-1][k])*j/16])));}
  for(let cap=ceiling;cap>=0;cap--){
   const tiles=new Map(),paint=new Set(),levels=new Set();
   const add=(f,l)=>{levels.add(l.id);for(const t of this.keys(f,l,true)){paint.add(t.key);if(t.hasLand)tiles.set(t.key,t);}};
   for(const f of samples)add(f,this.manifest.levels[0]);for(const f of frames)add(f,this.level(f,width,cap));
   let bytes=[...tiles.values()].reduce((n,t)=>n+t.bytes,0);
   if(bytes<=this.budget){
    // One optional middle scale smooths the detail change while keeping the
    // native endpoint. Drop it before lowering the requested close detail.
    if(frames.length>1){const mid=Object.fromEntries(['x','y','w','h'].map(k=>[k,(frames[0][k]+frames.at(-1)[k])/2])),level=this.level(mid,width,cap),extra=this.keys(mid,level).filter(t=>!tiles.has(t.key));if(bytes+extra.reduce((n,t)=>n+t.bytes,0)<=this.budget){add(mid,level);bytes=[...tiles.values()].reduce((n,t)=>n+t.bytes,0);}}
    return {tiles,paint,levels:[...levels].sort((a,b)=>a-b),bytes,cap};
   }
  }
  throw Error('Atlas camera exceeds its bitmap budget');
 }
 evict(keep,allocation=0){
  for(const [key,t]of [...this.cache].sort((a,b)=>a[1].last-b[1].last)){
   if(this.bytes+allocation<=this.budget)break;if(keep.has(key))continue;
   t.image.close();this.cache.delete(key);this.bytes-=t.bytes;
  }
  if(this.bytes+allocation>this.budget)throw Error('Atlas allocation was not reserved');
 }
 async blob(tile){
  const old=this.blobs.get(tile.key);if(old){this.blobs.delete(tile.key);this.blobs.set(tile.key,old);return old;}
  if(this.fetches.has(tile.key))return this.fetches.get(tile.key);
  const job=(async()=>{const controller=new AbortController();this.controllers.set(tile.key,controller);const timer=setTimeout(()=>controller.abort(),12000);let blob;
   try{const response=await fetch(new URL(this.manifest.base+tile.key+'.webp',document.baseURI),{signal:controller.signal});if(!response.ok)throw Error('Atlas tile '+response.status);blob=await response.blob();}finally{clearTimeout(timer);this.controllers.delete(tile.key);}this.downloads++;
   this.blobs.set(tile.key,blob);this.blobBytes+=blob.size;
   for(const [key,b]of this.blobs){if(this.blobBytes<=this.compressedBudget)break;this.blobs.delete(key);this.blobBytes-=b.size;}
   return blob;})();this.fetches.set(tile.key,job);try{return await job}finally{this.fetches.delete(tile.key)}
 }
 async prefetch(frames,width){const {tiles}=this.plan(frames,width),jobs=[...tiles.values()];for(let i=0;i<jobs.length;i+=3)await Promise.all(jobs.slice(i,i+3).map(t=>this.blob(t)));}
 prepare(frames,width){
  const run=async()=>{
   if(this.destroyed)throw new DOMException('Atlas disposed','AbortError');
   for(let ceiling=this.manifest.levels.length-1;ceiling>=0;ceiling--){try{
   const plan=this.plan(frames,width,ceiling),keep=new Set(plan.tiles.keys());
   const missing=[...plan.tiles.values()].filter(t=>!this.cache.has(t.key));
   this.evict(keep,missing.reduce((n,t)=>n+t.bytes,0));
   for(let i=0;i<missing.length;i+=3){
    const batch=missing.slice(i,i+3),blobs=await Promise.all(batch.map(t=>this.blob(t)));
    // The complete plan already fits after eviction; every decode has a known
    // size, so parallel decodes cannot temporarily overrun the budget.
    const settled=await Promise.allSettled(batch.map(async(t,j)=>{const image=await createImageBitmap(blobs[j]);const bytes=image.width*image.height*4;
     if(this.destroyed){image.close();throw new DOMException('Atlas disposed','AbortError');}
     if(bytes!==t.bytes){image.close();throw Error('Atlas tile dimensions differ from its index');}
     this.cache.set(t.key,{image,bytes,last:performance.now()});this.bytes+=bytes;this.peak=Math.max(this.peak,this.bytes);
    }));
    const failure=settled.find(r=>r.status==='rejected');if(failure)throw failure.reason;
   }
   this.cap=plan.cap;this.active=plan;return this.stats();
   }catch(error){if(!ceiling||this.destroyed)throw error;this.degraded=true;}}
  };
  const task=this.serial.then(run,run);this.serial=task.catch(()=>{});return task;
 }
 paint(ctx,frame,rect,water){
  const m=this.manifest,scale=rect.w/frame.w;ctx.save();ctx.scale(scale,rect.h/frame.h);ctx.translate(-frame.x,-frame.y);
  for(const id of this.active?.levels||[])for(const t of this.keys(frame,m.levels[id],true)){
   if(!this.active.paint.has(t.key))continue;const level=m.levels[id],entry=this.cache.get(t.key);
   const gx=t.x?m.gutter:0,gy=t.y?m.gutter:0,w=Math.min(m.tileSize,level.width-t.x*m.tileSize),h=Math.min(m.tileSize,level.height-t.y*m.tileSize);
   const x=t.worldX+gx/level.scale,y=t.worldY+gy/level.scale;
   // Replace the lower-resolution silhouette as well as its land color. A
   // shared world-anchored sea avoids a coarse green halo around HD shores.
   ctx.fillStyle=water||'#188fae';ctx.fillRect(x,y,w/level.scale,h/level.scale);
   if(entry){entry.last=performance.now();ctx.drawImage(entry.image,gx,gy,w,h,x,y,w/level.scale,h/level.scale);}
  }
  ctx.restore();
 }
 stats(){return {decodedBytes:this.bytes,peakDecodedBytes:this.peak,compressedBytes:this.blobBytes,tiles:this.cache.size,downloads:this.downloads,budget:this.budget,cap:this.cap,degraded:!!this.degraded};}
 destroy(){this.destroyed=true;for(const c of this.controllers.values())c.abort();for(const t of this.cache.values())t.image.close();this.cache.clear();this.blobs.clear();this.active=null;this.bytes=this.blobBytes=0;}
}
