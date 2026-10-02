const TAU=Math.PI*2;
export const CLOTH={columns:48,rows:16,dpr:3,drape:.28,fold:.052,contrast:.18,grain:.012};
const images=new Map(),renders=new WeakMap(),surfaces=new Map(),pending=new Map();
const lighting=new Map(),surfaceStats=new WeakMap();
const MAX_SURFACES=3;
const MATERIAL_URL=new URL('../assets/flags/adventure/cloth-light-v1.webp',import.meta.url).href;

// The printed design and lighting share one continuous surface. UV stays
// anchored along the hoist; no country-specific folds or replacement artwork.
export function clothPoint(u,v,settings=CLOTH){
  const wave=Math.sin(TAU*(1.6*u-.25*v));
  return {
    x:.012+.976*u+.012*u*Math.sin(Math.PI*v)*wave,
    y:(.025+.94*v+settings.drape*u*(1-.5*v)+settings.fold*u*Math.sin(TAU*(1.6*u-.25*v))*(.35+.65*Math.sin(Math.PI*v)))/1.15
  };
}
export function clothLight(u,v,settings=CLOTH){
  const broad=Math.sin(TAU*(1.6*u-.25*v)+.7);
  const crease=Math.sin(TAU*(3.2*u-.48*v)+.3)*(.25+.75*u);
  const gathering=Math.sin(TAU*(5*u+.65*v))*Math.exp(-u*5);
  const seam=u-(.07+.38*v),second=u-(.5+.25*v);
  const fine=.05*Math.exp(-((seam/.024)**2))-.06*Math.exp(-(((seam-.032)/.03)**2))
    +.035*Math.exp(-((second/.026)**2))-.04*Math.exp(-(((second-.026)/.035)**2));
  return .98+settings.contrast*(.63*broad+.20*crease+.17*gathering)+fine;
}
export function sizedSvg(source){
  const opening=source.match(/<svg\b[^>]*>/i)?.[0];
  const box=opening?.match(/viewBox=["']([^"']+)["']/i)?.[1].trim().split(/[\s,]+/).map(Number);
  if(!opening||box?.length!==4||!box.every(Number.isFinite)||box[2]<=0||box[3]<=0)throw Error('Nieprawidłowy SVG flagi');
  const sized=opening.replace(/\s(?:width|height)=["'][^"']*["']/gi,'').replace(/>$/,` width="${box[2]}" height="${box[3]}">`);
  return source.replace(opening,sized);
}
function sourceImage(url){
  if(!images.has(url)){
    const promise=(async()=>{
      let source=url;
      if(/\.svg(?:[?#]|$)/i.test(url)){
        const response=await fetch(url);
        if(!response.ok)throw Error('Nie udało się wczytać SVG flagi');
        source='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(sizedSvg(await response.text()));
      }
      const image=new Image();image.decoding='sync';
      await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Nie udało się zdekodować flagi'));image.src=source;});
      if(image.decode)await image.decode();
      return image;
    })();
    images.set(url,promise);promise.catch(()=>images.delete(url));
    while(images.size>6)images.delete(images.keys().next().value);
  }
  return images.get(url);
}
export function hasVisiblePixels(pixels){
  for(let i=3;i<pixels.length;i+=4)if(pixels[i])return true;
  return false;
}
// Yield between small batches, including during next-question prewarming. Never
// monopolise the main thread while the compositor moves the complete photograph.
function yieldWork(){
  return new Promise(resolve=>{
    if(typeof MessageChannel==='undefined'){setTimeout(resolve,0);return;}
    const channel=new MessageChannel();
    channel.port1.onmessage=()=>{channel.port1.close();channel.port2.close();resolve();};
    channel.port2.postMessage(null);
  });
}
export function clothSize(cssWidth,cssHeight,dpr){
  return {width:Math.max(1,Math.round(cssWidth)*dpr),height:Math.max(1,Math.round(cssHeight)*dpr)};
}
async function lightField(weave,width,height){
  const key=`${width}:${height}`;
  if(lighting.has(key))return lighting.get(key);
  const work=(async()=>{
    const values=new Float32Array(width*height);let fabric=null,seed=8191,start=performance.now();
    if(weave){
      const layer=document.createElement('canvas');layer.width=width;layer.height=height;
      const ctx=layer.getContext('2d',{willReadFrequently:true});ctx.drawImage(weave,0,0,width,height);
      fabric=ctx.getImageData(0,0,width,height).data;layer.width=layer.height=0;
    }
    for(let y=0;y<height;y++){
      const v=y/(height-1);
      for(let x=0;x<width;x++){
        const u=x/(width-1),i=y*width+x;seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const grain=(seed/4294967296-.5)*CLOTH.grain;
        const thread=(x%3===0?.004:0)+(y%3===0?-.003:0);
        const edge=Math.min(u,1-u,v,1-v),hem=edge<.009?-.035:edge<.015?.018:0;
        const f=i*4,fabricLight=fabric?Math.max(.65,Math.min(1.06,(fabric[f]*.2126+fabric[f+1]*.7152+fabric[f+2]*.0722)/245)):1;
        values[i]=(clothLight(u,v)+grain+thread+hem)*fabricLight;
      }
      if(y%8===7&&performance.now()-start>4){await yieldWork();start=performance.now();}
    }
    return values;
  })();
  lighting.set(key,work);work.catch(()=>lighting.delete(key));
  while(lighting.size>2)lighting.delete(lighting.keys().next().value);
  return work;
}
async function material(image,lights,width,height){
  const surface=document.createElement('canvas');surface.width=width;surface.height=height;
  const ctx=surface.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,width,height);
  const pixels=ctx.getImageData(0,0,width,height),data=pixels.data;let visible=0,start=performance.now();
  for(let y=0;y<height;y++){
   for(let x=0;x<width;x++){
    const i=(y*width+x)*4;if(!data[i+3])continue;visible++;
    const light=lights[y*width+x];
    const diffuse=Math.min(data[i],data[i+1],data[i+2])>220?1+(light-1)*.58:light;
    for(let channel=0;channel<3;channel++){
      const color=data[i+channel];
      // Undyed cloth scatters more light than saturated printed pigment.
      data[i+channel]=diffuse<=1?color*diffuse:color+(255-color)*(diffuse-1)*.55;
    }
   }
   if(y%16===15&&performance.now()-start>4){await yieldWork();start=performance.now();}
  }
  if(!visible){surface.width=surface.height=0;throw Error('Dekoder zwrócił pustą flagę');}
  ctx.putImageData(pixels,0,0);return surface;
}
function triangle(ctx,image,source,target){
  const [s0,s1,s2]=source,[d0,d1,d2]=target;
  const sx1=s1.x-s0.x,sy1=s1.y-s0.y,sx2=s2.x-s0.x,sy2=s2.y-s0.y;
  const determinant=sx1*sy2-sx2*sy1;
  const dx1=d1.x-d0.x,dy1=d1.y-d0.y,dx2=d2.x-d0.x,dy2=d2.y-d0.y;
  const a=(dx1*sy2-dx2*sy1)/determinant,b=(dy1*sy2-dy2*sy1)/determinant;
  const c=(dx2*sx1-dx1*sx2)/determinant,d=(dy2*sx1-dy1*sx2)/determinant;
  ctx.save();ctx.beginPath();
  // Subpixel overlap removes antialias cracks between adjacent triangles.
  const centre={x:(d0.x+d1.x+d2.x)/3,y:(d0.y+d1.y+d2.y)/3};
  target.forEach((p,i)=>{const vx=p.x-centre.x,vy=p.y-centre.y,l=Math.hypot(vx,vy);const px=p.x+vx/l*.38,py=p.y+vy/l*.38;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});
  ctx.closePath();ctx.clip();ctx.transform(a,b,c,d,d0.x-a*s0.x-c*s0.y,d0.y-b*s0.x-d*s0.y);ctx.drawImage(image,0,0);ctx.restore();
}
async function buildSurface(url,width,height){
  const started=performance.now();
  const [image,weave]=await Promise.all([sourceImage(url),sourceImage(MATERIAL_URL).catch(()=>null)]);
  const reusedLight=lighting.has(`${width}:${height}`);
  const lights=await lightField(weave,width,height);
  const texture=await material(image,lights,width,height);
  const surface=await drawSurface(texture,width,height);texture.width=texture.height=0;
  surfaceStats.set(surface,{buildMs:performance.now()-started,reusedLight});return surface;
}
async function drawSurface(texture,width,height,mesh=CLOTH){
  const surface=document.createElement('canvas');surface.width=width;surface.height=height;
  const ctx=surface.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';

    const {columns,rows}=mesh,points=[];
    for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++){
      const u=column/columns,v=row/rows,p=clothPoint(u,v);
      points.push({source:{x:u*width,y:v*height},target:{x:p.x*width,y:p.y*height}});
    }
    let start=performance.now();
    for(let row=0;row<rows;row++){
     for(let column=0;column<columns;column++){
      const a=points[row*(columns+1)+column],b=points[row*(columns+1)+column+1],c=points[(row+1)*(columns+1)+column],d=points[(row+1)*(columns+1)+column+1];
      triangle(ctx,texture,[a.source,b.source,c.source],[a.target,b.target,c.target]);
      triangle(ctx,texture,[b.source,d.source,c.source],[b.target,d.target,c.target]);
     }
     if(performance.now()-start>4){await yieldWork();start=performance.now();}
    }
  return surface;
}
function remember(key,surface){
  surfaces.delete(key);surfaces.set(key,surface);
  while(surfaces.size>MAX_SURFACES){const oldest=surfaces.keys().next().value;const discarded=surfaces.get(oldest);surfaces.delete(oldest);discarded.width=discarded.height=0;}
  return surface;
}
function preparedSurface(url,width,height){
  const key=`${url}:${width}:${height}`;
  if(surfaces.has(key))return Promise.resolve(remember(key,surfaces.get(key)));
  if(!pending.has(key)){
    const work=buildSurface(url,width,height).then(surface=>remember(key,surface)).finally(()=>pending.delete(key));
    pending.set(key,work);
  }
  return pending.get(key);
}
const pixelRatio=()=>Math.max(CLOTH.dpr,Math.min(4,window.devicePixelRatio||1));
export function prewarmFlagCloth(url,cssWidth,cssHeight){
  const {width,height}=clothSize(cssWidth,cssHeight,pixelRatio());
  return preparedSurface(url,width,height);
}
export async function renderFlagCloth(canvas){
  const url=canvas.dataset.clothSource;
  if(!canvas.clientWidth||!canvas.clientHeight||!url)return;
  const {width,height}=clothSize(canvas.clientWidth,canvas.clientHeight,pixelRatio());
  const key=`${url}:${width}:${height}`;
  if(renders.get(canvas)===key)return;
  renders.set(canvas,key);
  const paint=surface=>{
    if(!canvas.isConnected||renders.get(canvas)!==key)return;
    canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d');context.drawImage(surface,0,0);
    // The source was validated once in material(). A full Retina GPU readback on
    // every cached copy was redundant and forced a synchronous pipeline flush.
    const stats=surfaceStats.get(surface);
    canvas.dataset.clothBuildMs=stats?.buildMs.toFixed(1)||'0';
    canvas.dataset.clothLightCache=stats?.reusedLight?'hit':'miss';
    canvas.closest('.flag-cloth').classList.add('is-painted');canvas.dataset.clothReady='true';
    canvas.dataset.clothMotion='still';
  };
  try{
    // Cached cloth is copied synchronously, before the browser paints this frame.
    if(surfaces.has(key)){canvas.dataset.clothCache='hit';paint(remember(key,surfaces.get(key)));}
    else{canvas.dataset.clothCache='miss';paint(await preparedSurface(url,width,height));}
  }catch(error){
    renders.delete(canvas);canvas.width=canvas.height=0;canvas.closest('.flag-cloth')?.classList.remove('is-painted');canvas.dataset.clothReady='fallback';
    console.warn('[flags/cloth] Render fallback', {source:new URL(url).pathname,message:error.message});
  }
}
