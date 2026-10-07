// One small canvas owns every word fragment. Physics paints at 30 Hz, never
// writes animated DOM attributes and stops on pause, hidden tabs and teardown.
export const DEFAULT_WORD_TRANSITION={style:'particles',dots:64,interactive:false,piecesPerLetter:144,duration:1100,spread:42,drift:400,jitter:.8,pieceSize:3.8,chromatic:0,randomness:.85,particleShape:'square',attraction:.45,breathing:12,colorVariation:.22,answerHold:500,letterSpacing:1,particleSpacing:1.2,strokeMagnet:.25,settleFill:.85,colorSpread:.45,colorDeviation:.12,colorSpeed:.4};
export const MAX_WORD_PIECES=1200;
const cache=new Map(),TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function ensureCss(){if(document.querySelector('link[data-mn-word-particles]'))return;const link=document.createElement('link');link.rel='stylesheet';link.dataset.mnWordParticles='1';link.href=new URL('./word-particles.css',import.meta.url).href;document.head.append(link);}
export function sampleInkPoints(pixels,count,random=Math.random){
 // Blue-noise placement follows the actual glyph silhouette, including holes.
 // Random tie-breaking and subpixel offsets remove rows/columns of cut tiles.
 if(!pixels.length)return [];
 const selected=[],distance=pixels.map(()=>Infinity),bias=pixels.map(()=>.9+random()*.2);let index=Math.floor(random()*pixels.length);
 for(let n=0;n<Math.min(count,pixels.length);n++){
  const p=pixels[index];selected.push([p[0]+(random()-.5)*.6,p[1]+(random()-.5)*.6]);let best=-1;
  for(let j=0;j<pixels.length;j++){const q=pixels[j];distance[j]=Math.min(distance[j],(p[0]-q[0])**2+(p[1]-q[1])**2);const score=distance[j]*bias[j];if(score>best){best=score;index=j;}}
 }
 return selected;
}
// Small distance field follows the stroke, including counters (holes). Climbing
// its ridge attracts pieces to the centre of each stroke, never a letter centroid.
export function strokeDistanceField(mask,width,height){
 const d=new Float32Array(width*height);for(let i=0;i<d.length;i++)d[i]=mask[i]?width+height:0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;if(!d[i])continue;d[i]=Math.min(d[i],x?d[i-1]+1:1,y?d[i-width]+1:1,x&&y?d[i-width-1]+1.414:1);}
 for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){const i=y*width+x;if(!d[i])continue;d[i]=Math.min(d[i],x<width-1?d[i+1]+1:1,y<height-1?d[i+width]+1:1,x<width-1&&y<height-1?d[i+width+1]+1.414:1);}
 return {distance:d,width,height};
}
export function strokeRidge(x,y,field){
 let cx=clamp(Math.round(x),0,field.width-1),cy=clamp(Math.round(y),0,field.height-1);
 for(let step=0;step<16;step++){let nx=cx,ny=cy,best=field.distance[cy*field.width+cx];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=cx+dx,yy=cy+dy;if(xx<0||yy<0||xx>=field.width||yy>=field.height)continue;const value=field.distance[yy*field.width+xx];if(value>best+.01){best=value;nx=xx;ny=yy;}}if(nx===cx&&ny===cy)break;cx=nx;cy=ny;}
 return [cx,cy];
}
export function spaceInkPoints(points,spacing=0){const spaced=[];for(const point of points)if(spaced.every(q=>(q[0]-point[0])**2+(q[1]-point[1])**2>=spacing**2))spaced.push(point);return spaced;}
function glyphRandom(key){let seed=2166136261;for(const letter of key)seed=Math.imul(seed^letter.charCodeAt(0),16777619);return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};}
function glyphPoints(letter,count,font,magnet=0,spacing=0){
 const key=[letter,count,font.fontWeight,font.fontSize,font.fontFamily,document.fonts.check(`${font.fontWeight} ${font.fontSize} ${font.fontFamily}`),magnet,spacing].join('|');if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return {points:[],advance:0};
 const size=parseFloat(font.fontSize);ctx.font=`${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;const advance=ctx.measureText(letter).width;
 canvas.width=Math.ceil(advance+8);canvas.height=Math.ceil(size*1.6);ctx.font=`${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;ctx.textBaseline='middle';ctx.fillStyle='white';ctx.fillText(letter,4,canvas.height/2);
 const data=ctx.getImageData(0,0,canvas.width,canvas.height).data,pixels=[],stride=Math.max(1.5,size/35),gw=Math.ceil(canvas.width/stride),gh=Math.ceil(canvas.height/stride),mask=new Uint8Array(gw*gh);
 for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const ink=data[(Math.floor(y*stride)*canvas.width+Math.floor(x*stride))*4+3]>150;mask[y*gw+x]=ink?1:0;if(ink)pixels.push([x*stride,y*stride]);}
 const field=strokeDistanceField(mask,gw,gh),points=sampleInkPoints(pixels,count,glyphRandom(key)).map(([x,y])=>{const [rx,ry]=strokeRidge(x/stride,y/stride,field);return [x+(rx*stride-x)*magnet-4,y+(ry*stride-y)*magnet-canvas.height/2];});
 const spaced=spaceInkPoints(points,spacing);
 const result={points:spaced,advance,mask:canvas};if(cache.size>=80)cache.delete(cache.keys().next().value);cache.set(key,result);return result;
}
export function sampleWordPoints(label,dots=96,fontFamily='system-ui',fontSize=46){return glyphPoints(label,clamp(Math.round(dots),12,180),{fontWeight:800,fontSize:fontSize+'px',fontFamily}).points;}
export function localPieceRoute(from,to,settings,random=Math.random){const angle=random()*TAU,reach=settings.spread*(.25+random()*.75)*settings.randomness;return {x:(from.x+to.x)/2+Math.cos(angle)*reach,y:(from.y+to.y)/2+Math.sin(angle)*reach};}
export function advancePiece(p,cfg,t,dt,bubble){
 const age=Math.max(0,t-p.born),loose=p.scatterUntil>t||age<cfg.drift,freedom=loose?1:Math.max(0,1-(age-cfg.drift)/cfg.duration);
 const side=p.side==='left'?-1:p.side==='right'?1:p.direction;
 const noise=Math.sin(t*.0013*p.frequency+p.seed)+Math.sin(t*.0021+p.seed*3)*.47;
 const wobble=cfg.jitter*(1+freedom*7),tx=p.tx+noise*wobble,ty=p.ty+Math.cos(t*.0017*p.frequency+p.seed*2)*wobble;
 const gain=loose?.007:.02+(1-freedom)*(.065+(cfg.strokeMagnet||0)*.045),drag=loose?.965:.82;
 // Attraction is a local curl field beneath the photograph, not a pull that
 // drags the assembled word away. Answer direction adds a transient impulse.
 const dx=bubble.x-p.x,dy=bubble.y-p.y,range=Math.max(50,Math.hypot(dx,dy));
 const field=cfg.attraction*freedom*.24;
 p.vx=(p.vx+(tx-p.x)*gain+noise*cfg.randomness*freedom*.7+side*field+dy/range*field)*drag;
 p.vy=(p.vy+(ty-p.y)*gain+Math.cos(t*.0019+p.seed)*cfg.randomness*freedom*.65-dx/range*field)*drag;
 const step=Math.min(1.7,dt/33.333);p.x+=clamp(p.vx,-8,8)*step;p.y+=clamp(p.vy,-8,8)*step;
 const reach=Math.max(30,cfg.spread*2.5);p.x=clamp(p.x,p.tx-reach,p.tx+reach);p.y=clamp(p.y,p.ty-reach,p.ty+reach);
 p.alpha=p.dying?Math.max(0,p.alpha-dt/500):Math.min(1,p.alpha+dt/220);
}
export function separatePieces(particles,distance=2){
 // Local spatial buckets avoid quadratic all-pairs collision work.
 const bins=new Map(),cell=Math.max(2,distance*2);
 for(const p of particles){if(p.dying)continue;const cx=Math.floor(p.x/cell),cy=Math.floor(p.y/cell);
  for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++)for(const q of bins.get(x+':'+y)||[]){const dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy);if(d>0&&d<distance){const push=(distance-d)*.14;p.vx+=dx/d*push;p.vy+=dy/d*push;q.vx-=dx/d*push;q.vy-=dy/d*push;}}
  const key=cx+':'+cy;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(p);
 }
}
export function particlePalette(ink,cfg,time=0){
 const rgb=(ink.match(/[\d.]+/g)||['18','15','70']).slice(0,3).map(Number);
 const phase=time*.0006*(cfg.colorSpeed||0),deviation=cfg.colorDeviation||0,spread=cfg.colorSpread||0;
 return Array.from({length:16},(_,i)=>{const angle=phase+i/16*TAU*spread;return `rgb(${rgb.map((c,j)=>Math.round(clamp(c+(i-7.5)*(cfg.colorVariation||0)*(j===2?7:4)+deviation*(60+55*Math.sin(angle+j*2.094)),0,210))).join(',')})`;});
}
function freedom(p,cfg,t){return p.scatterUntil>t?1:clamp(1-(t-p.born-cfg.drift)/cfg.duration,0,1);}
export function createWordParticles(host,getEffects=()=>null){
 ensureCss();const reduced=matchMedia('(prefers-reduced-motion: reduce)');let layer,ctx,rows=[],frame,previous=0,painted=0,destroyed=false,paused=false,serial=0,bounds,bubble={x:0,y:0},lastSignature='',settlers=new Set(),inkMask,stableCanvas,stableCtx,fillLayers=[],ink='rgb(18,15,70)';
 const settings=()=>({...DEFAULT_WORD_TRANSITION,...getEffects()?.wordTransition});
 const enabled=()=>settings().style==='particles'&&!reduced.matches&&!destroyed;
 function settle(){for(const resolve of settlers)resolve(false);settlers.clear();}
 function clear(){serial++;settle();cancelAnimationFrame(frame);frame=undefined;previous=0;layer?.remove();layer=null;ctx=null;rows=[];lastSignature='';inkMask=stableCanvas=stableCtx=null;fillLayers=[];host.querySelector('.word')?.classList.remove('mn-particle-ink');}
 function ensure(){if(layer)return;layer=document.createElement('canvas');layer.className='mn-word-particles';layer.dataset.mnDecoration='1';layer.setAttribute('aria-hidden','true');document.body.append(layer);ctx=layer.getContext('2d',{alpha:true});}
 function measure(){if(!layer)return;const rect=host.getBoundingClientRect(),cfg=settings(),pad=Math.max(36,cfg.spread*2.5+cfg.pieceSize);bounds={left:rect.left-pad,top:rect.top-pad,width:rect.width+pad*2,height:rect.height+pad*2};const dpr=Math.min(1.5,devicePixelRatio||1);Object.assign(layer.style,{left:bounds.left+'px',top:bounds.top+'px',width:bounds.width+'px',height:bounds.height+'px'});layer.width=Math.ceil(bounds.width*dpr);layer.height=Math.ceil(bounds.height*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);const br=host.closest('#app')?.querySelector('.spelling-visual')?.getBoundingClientRect();bubble=br?{x:br.left+br.width/2,y:br.bottom}:{x:rect.left+rect.width/2,y:rect.top-100};}
 function targets(){const word=host.querySelector('.word');if(!word)return [];const cfg=settings(),css=getComputedStyle(word),colors=particlePalette(css.color,cfg),out=[],glyphs=[];ink=css.color;
  const nodes=[['left','.word-before'],['middle','.revealed-chunk'],['right','.word-after']],length=nodes.reduce((n,[,s])=>n+(word.querySelector(s)?.textContent.length||0),0)+(word.querySelector('.revealed-chunk')?0:Number(host.dataset.answerLength||2)),count=Math.min(Math.round(cfg.piecesPerLetter),Math.floor(MAX_WORD_PIECES/Math.max(1,length)));
  for(const [side,selector]of nodes){const node=word.querySelector(selector);if(!node||!node.getClientRects().length||getComputedStyle(node).visibility==='hidden')continue;const font=getComputedStyle(node),rect=node.getBoundingClientRect(),spacing=parseFloat(font.letterSpacing)||0;let x=rect.left;
   for(const letter of node.textContent){const glyph=glyphPoints(letter,count,font,cfg.strokeMagnet,cfg.particleSpacing),y=rect.top+rect.height/2;glyphs.push({side,mask:glyph.mask,x:x-4,y:y-glyph.mask.height/2});for(const [dx,dy]of glyph.points)out.push({side,tx:x+dx,ty:y+dy,color:colors[Math.floor(Math.random()*colors.length)],size:cfg.pieceSize*(.88+Math.random()*.24),letter});x+=glyph.advance+spacing;}
  }
  // One exact native-font alpha mask cuts settled pieces to the original glyph
  // weight/counters. Cached fills restore missing ink independently of dot size.
  inkMask=document.createElement('canvas');stableCanvas=document.createElement('canvas');
  for(const canvas of [inkMask,stableCanvas]){canvas.width=layer.width;canvas.height=layer.height;}
  const scale=layer.width/bounds.width,maskCtx=inkMask.getContext('2d');maskCtx.setTransform(scale,0,0,scale,0,0);stableCtx=stableCanvas.getContext('2d');stableCtx.setTransform(scale,0,0,scale,0,0);
  fillLayers=nodes.map(([side])=>{const canvas=document.createElement('canvas');canvas.width=layer.width;canvas.height=layer.height;const fill=canvas.getContext('2d');fill.setTransform(scale,0,0,scale,0,0);for(const glyph of glyphs.filter(g=>g.side===side)){const x=glyph.x-bounds.left,y=glyph.y-bounds.top;fill.drawImage(glyph.mask,x,y);maskCtx.drawImage(glyph.mask,x,y);}fill.globalCompositeOperation='source-in';fill.fillStyle=ink;fill.fillRect(0,0,bounds.width,bounds.height);return {side,canvas};});
  return out;
 }
 function wait(ms,own){return new Promise(resolve=>{settlers.add(resolve);setTimeout(()=>{settlers.delete(resolve);resolve(own===serial&&!destroyed);},ms);});}
 function tick(t){frame=undefined;if(!enabled()||paused||document.hidden||!layer||!host.isConnected)return;
  const word=host.querySelector('.word'),visible=word&&word.getClientRects().length>0&&getComputedStyle(word).visibility!=='hidden';layer.hidden=!visible;if(!visible){frame=requestAnimationFrame(tick);return;}
  if(t-painted>=32){const dt=previous?Math.min(50,t-previous):33.33;previous=painted=t;const cfg=settings();ctx.clearRect(0,0,bounds.width,bounds.height);
   for(const p of rows)advancePiece(p,cfg,t,dt,bubble);if(cfg.particleSpacing>0&&(cfg.jitter||rows.some(p=>t-p.born<cfg.duration+cfg.drift)))separatePieces(rows,cfg.particleSpacing);
   rows=rows.filter(p=>p.alpha>0||!p.dying);stableCtx.globalCompositeOperation='source-over';stableCtx.clearRect(0,0,bounds.width,bounds.height);
   const colors=particlePalette(ink,cfg,t),progress={left:0,middle:0,right:0},counts={left:0,middle:0,right:0};
   for(const p of rows){const loose=freedom(p,cfg,t),x=p.x-bounds.left,y=p.y-bounds.top,s=p.size,color=colors[Math.min(15,Math.floor(p.seed/TAU*16))];
    if(!p.dying){progress[p.side]+=1-loose;counts[p.side]++;}
    const paint=(context,alpha,chroma)=>{if(alpha<.001)return;context.globalAlpha=alpha;if(chroma&&cfg.chromatic){context.globalAlpha=alpha*.24;context.fillStyle='#c4367c';context.fillRect(x-s/2+cfg.chromatic,y-s/2,s,s);context.fillStyle='#1479bb';context.fillRect(x-s/2-cfg.chromatic,y-s/2,s,s);context.globalAlpha=alpha;}context.fillStyle=color;if(cfg.particleShape==='circle'){context.beginPath();context.arc(x,y,s*.5,0,TAU);context.fill();}else context.fillRect(x-s/2,y-s/2,s,s);};
    paint(ctx,p.alpha*(p.dying?1:loose),true);
    if(!p.dying)paint(stableCtx,p.alpha*(1-loose)*(1-cfg.settleFill),false);
   }
   stableCtx.globalAlpha=1;stableCtx.globalCompositeOperation='destination-in';stableCtx.drawImage(inkMask,0,0,bounds.width,bounds.height);ctx.globalAlpha=1;ctx.drawImage(stableCanvas,0,0,bounds.width,bounds.height);
   for(const {side,canvas} of fillLayers){ctx.globalAlpha=cfg.settleFill*(progress[side]/Math.max(1,counts[side]));ctx.drawImage(canvas,0,0,bounds.width,bounds.height);}
   ctx.globalAlpha=1;layer.dataset.solidFill=String(cfg.settleFill);layer.dataset.letterSpacing=String(cfg.letterSpacing);layer.dataset.sampleColor=colors[0];
   layer.dataset.count=String(rows.length);layer.dataset.paintCount=String(++paintCount);
  }frame=requestAnimationFrame(tick);
 }
 let paintCount=0;
 function start(){if(frame===undefined&&!paused&&!document.hidden&&enabled())frame=requestAnimationFrame(tick);}
 async function assemble(origin,direction=1,preserveSides=false){if(!enabled()){clear();return false;}serial++;settle();ensure();if(!ctx){clear();return false;}const cfg=settings(),own=serial,t=performance.now();host.style.setProperty('--mn-word-breathing',cfg.breathing+'px');measure();const points=targets(),old=rows.filter(p=>!p.dying),next=[],groups=Object.fromEntries(['left','middle','right'].map(side=>[side,old.filter(p=>p.side===side)]));
  for(const point of points){const pool=groups[point.side];let index=-1,distance=preserveSides?Infinity:100**2;for(let i=0;i<pool.length;i++){const d=(pool[i].x-point.tx)**2+(pool[i].y-point.ty)**2;if(d<distance){distance=d;index=i;}}
   let p=index<0?null:pool.splice(index,1)[0];if(!p){const angle=Math.random()*TAU,reach=cfg.spread*(.15+Math.random()*.7),bornAt=point.side==='middle'&&origin?origin:null;p={x:bornAt?bornAt.x+Math.cos(angle)*bornAt.radius:point.tx+Math.cos(angle)*reach,y:bornAt?bornAt.y+Math.sin(angle)*bornAt.radius:point.ty+Math.sin(angle)*reach,vx:direction*(1+Math.random()*2),vy:(Math.random()-.65)*3,seed:Math.random()*TAU,frequency:.55+Math.random()*1.4,alpha:0};}
   next.push({...p,...point,color:preserveSides&&point.side!=='middle'?p.color:point.color,born:preserveSides&&point.side!=='middle'?(p.born??t):t-Math.random()*100,direction,dying:false});
  }
  const unused=Object.values(groups).flat().map(p=>({...p,dying:true}));rows=[...next,...unused.slice(0,MAX_WORD_PIECES-next.length)];host.querySelector('.word')?.classList.add('mn-particle-ink');lastSignature=signature();for(const side of ['left','middle','right']){const group=next.filter(p=>p.side===side);layer.dataset[side+'Count']=String(group.length);layer.dataset[side+'Born']=String(group.length?Math.min(...group.map(p=>p.born)):0);}start();return wait(cfg.duration+cfg.drift,own);
 }
 async function disperse(direction=1){if(!enabled()||!rows.length)return false;serial++;settle();const cfg=settings(),t=performance.now(),own=serial;
  for(const p of rows){const bias=p.side==='left'?-1:1,angle=Math.random()*TAU;p.vx=Math.cos(angle)*cfg.spread*.11+direction*1.5+bias*Math.random()*2;p.vy=Math.sin(angle)*cfg.spread*.08-1;p.scatterUntil=t+cfg.drift+Math.random()*200;p.born=t;}
  start();return wait(cfg.drift+cfg.duration*.25,own);
 }
 async function reveal(answer,change,direction=1){const rect=host.querySelector('.gap')?.getBoundingClientRect(),origin=rect?{x:rect.left+rect.width/2,y:rect.top+rect.height/2,radius:rect.width*.4}:null;const cfg=settings(),t=performance.now();
  // Emit from the missing-letter bubble before it disappears. Existing letters
  // continue their independent flow while the answer fragments are born here.
  if(enabled()&&origin){ensure();measure();const colors=particlePalette(getComputedStyle(host.querySelector('.word')).color,cfg),count=Math.min(MAX_WORD_PIECES-rows.length,answer.length*cfg.piecesPerLetter);for(let i=0;i<count;i++){const a=Math.random()*TAU,r=origin.radius*(.7+Math.random()*.3);rows.push({side:'middle',x:origin.x+Math.cos(a)*r,y:origin.y+Math.sin(a)*r,tx:origin.x,ty:origin.y,born:t,scatterUntil:t+cfg.drift,seed:Math.random()*TAU,frequency:.5+Math.random()*1.5,vx:Math.cos(a)*3+direction*2,vy:Math.sin(a)*3,size:cfg.pieceSize*(.8+Math.random()*.4),color:colors[i%colors.length],alpha:.75,direction});}start();}
  const own=serial;if(!await wait(Math.min(180,cfg.drift),own)||destroyed)return false;await change();if(destroyed||own!==serial)return false;if(!await assemble(origin,direction,true))return false;return wait(cfg.answerHold??500,serial);
 }
 function signature(){const w=host.querySelector('.word');return JSON.stringify([w?.textContent,w&&getComputedStyle(w).fontSize,w&&document.fonts.check(getComputedStyle(w).font),settings(),['.word-before','.revealed-chunk','.word-after'].map(s=>{const n=w?.querySelector(s);if(!n)return null;return [getComputedStyle(n).visibility,Boolean(n.getClientRects().length)];})]);}
 function setPaused(value){paused=Boolean(value);if(paused){cancelAnimationFrame(frame);frame=undefined;}else {previous=0;start();}}
 const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=undefined;}else{previous=0;start();}};document.addEventListener('visibilitychange',visibility);
 const resize=()=>{if(rows.length)void assemble();};window.addEventListener('resize',resize);const preference=()=>{if(reduced.matches)clear();else void assemble();};reduced.addEventListener('change',preference);
 return {play:direction=>direction==='out'?disperse():assemble(),reveal,setPaused,clear,refresh(){if(!enabled())clear();else if(lastSignature!==signature())void assemble();else start();},destroy(){destroyed=true;clear();host.style.removeProperty('--mn-word-breathing');document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',resize);reduced.removeEventListener('change',preference);}};
}
