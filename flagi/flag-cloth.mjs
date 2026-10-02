const TAU=Math.PI*2;
export const CLOTH={columns:64,rows:20,dpr:3,drape:.28,fold:.052,contrast:.27,grain:.022};
const images=new Map(),renders=new WeakMap();

// The printed design and lighting share one continuous surface. UV stays
// anchored along the hoist; no country-specific folds or replacement artwork.
export function clothPoint(u,v,settings=CLOTH){
  const wave=Math.sin(TAU*(1.6*u-.25*v));
  return {
    x:.012+.976*u+.012*u*Math.sin(Math.PI*v)*wave,
    y:(.025+.90*v+settings.drape*u*(1-.5*v)+settings.fold*u*Math.sin(TAU*(1.6*u-.25*v))*(.35+.65*Math.sin(Math.PI*v)))/1.15
  };
}
export function clothLight(u,v,settings=CLOTH){
  const broad=Math.sin(TAU*(1.6*u-.25*v)+.7);
  const crease=Math.sin(TAU*(3.2*u-.48*v)+.3)*(.25+.75*u);
  const gathering=Math.sin(TAU*(5*u+.65*v))*Math.exp(-u*5);
  return .92+settings.contrast*(.7*broad+.23*crease+.17*gathering);
}
function sourceImage(url){
  if(!images.has(url)){
    const image=new Image();image.decoding='async';
    const promise=new Promise((resolve,reject)=>{image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Nie udało się wczytać SVG flagi'));});
    image.src=url;images.set(url,promise);promise.catch(()=>images.delete(url));
  }
  return images.get(url);
}
function material(image,width,height){
  const surface=document.createElement('canvas');surface.width=width;surface.height=height;
  const ctx=surface.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,width,height);
  const pixels=ctx.getImageData(0,0,width,height),data=pixels.data;let seed=8191;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;if(!data[i+3])continue;
    const u=x/(width-1),v=y/(height-1);seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const grain=(seed/4294967296-.5)*CLOTH.grain;
    const thread=(x%3===0?.004:0)+(y%3===0?-.003:0);
    const edge=Math.min(u,1-u,v,1-v),hem=edge<.009?-.035:edge<.015?.018:0;
    const light=clothLight(u,v)+grain+thread+hem;
    for(let channel=0;channel<3;channel++){
      const color=data[i+channel];data[i+channel]=light<=1?color*light:color+(255-color)*(light-1)*.55;
    }
  }
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
export async function renderFlagCloth(canvas){
  const box=canvas.getBoundingClientRect(),url=canvas.dataset.clothSource;
  if(!box.width||!box.height||!url)return;
  const dpr=Math.max(CLOTH.dpr,Math.min(4,window.devicePixelRatio||1));
  const width=Math.ceil(canvas.clientWidth*dpr),height=Math.ceil(canvas.clientHeight*dpr);
  const key=`${url}:${width}:${height}`;if(renders.get(canvas)===key)return;renders.set(canvas,key);
  try{
    const image=await sourceImage(url);if(!canvas.isConnected||renders.get(canvas)!==key)return;
    const texture=material(image,width,height);canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    const {columns,rows}=CLOTH,points=[];
    for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++){
      const u=column/columns,v=row/rows,p=clothPoint(u,v);
      points.push({source:{x:u*width,y:v*height},target:{x:p.x*width,y:p.y*height}});
    }
    for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
      const a=points[row*(columns+1)+column],b=points[row*(columns+1)+column+1],c=points[(row+1)*(columns+1)+column],d=points[(row+1)*(columns+1)+column+1];
      triangle(ctx,texture,[a.source,b.source,c.source],[a.target,b.target,c.target]);
      triangle(ctx,texture,[b.source,d.source,c.source],[b.target,d.target,c.target]);
    }
    canvas.closest('.flag-cloth').classList.add('is-painted');canvas.dataset.clothReady='true';
  }catch{
    renders.delete(canvas);canvas.dataset.clothReady='fallback';
  }
}
