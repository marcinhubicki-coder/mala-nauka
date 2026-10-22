import {SCENIC,randomFrom} from './scenic-config.mjs?v=36';
const mix=(a,b,t)=>a+(b-a)*t,clamp=t=>Math.max(0,Math.min(1,t)),ease=t=>t*t*(3-2*t);
const surface=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};

// Sample the actual CSS glyph at its measured DOM baseline, without stretching
// a generic 40px letter into a different box. The same raster forms the handoff.
function glyphs(answers,origin,rand,dpr){
 const ink=surface(Math.round(origin.width*dpr),Math.round(origin.height*dpr)),paint=ink.getContext('2d');paint.scale(dpr,dpr);
 const scratch=surface(1,1),groups=[];
 for(const button of answers.querySelectorAll('.scenic-answer')){
  const points=[],spans=[...button.querySelectorAll('.sand-letter')].filter(s=>s.textContent.trim()),lines=[];
  for(const span of spans){const r=span.getBoundingClientRect();let line=lines.find(l=>Math.abs(l.top-r.top)<2);if(!line){line={top:r.top,bottom:r.bottom};lines.push(line);}line.bottom=Math.max(line.bottom,r.bottom);}
  for(const span of spans){
   const r=span.getBoundingClientRect(),style=getComputedStyle(span),size=parseFloat(style.fontSize),pad=4;
   const marker=document.createElement('i');marker.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;vertical-align:baseline';span.append(marker);const baseline=marker.getBoundingClientRect().top;marker.remove();
   const font=`${style.fontWeight} ${size}px ${style.fontFamily}`;
   paint.font=font;paint.fillStyle=style.color;paint.textBaseline='alphabetic';paint.fillText(span.textContent,r.left-origin.left,baseline-origin.top);
   scratch.width=Math.ceil((r.width+size*.6+pad*2)*dpr);scratch.height=Math.ceil((r.height+size*.8+pad*2)*dpr);
   const ctx=scratch.getContext('2d',{willReadFrequently:true});ctx.scale(dpr,dpr);ctx.font=font;ctx.fillStyle='#000';ctx.textBaseline='alphabetic';ctx.fillText(span.textContent,pad,baseline-r.top+pad);
   const pixels=ctx.getImageData(0,0,scratch.width,scratch.height).data,candidates=[];
   for(let y=0;y<scratch.height;y+=2)for(let x=0;x<scratch.width;x+=2)if(pixels[(y*scratch.width+x)*4+3]>110)candidates.push({x:r.left-origin.left+x/dpr-pad,y:r.top-origin.top+y/dpr-pad});
   if(!candidates.length)candidates.push({x:r.left-origin.left+r.width/2,y:baseline-origin.top});
   // Spread dots across all strokes rather than randomly sampling one thick arm.
   const distances=new Float32Array(candidates.length).fill(Infinity);let chosen=Math.floor(rand()*candidates.length);
   for(let i=0;i<SCENIC.grainsPerLetter;i++){
    const p=candidates[chosen];points.push({...p,color:style.color,baseline:Math.max(baseline-origin.top+2,p.y+1),letterCenter:(r.left+r.right)/2-origin.left,letterWidth:r.width});
    let farthest=-1;for(let j=0;j<candidates.length;j++){const q=candidates[j];distances[j]=Math.min(distances[j],(q.x-p.x)**2+(q.y-p.y)**2);if(distances[j]>farthest){farthest=distances[j];chosen=j;}}
   }
  }
  groups.push({points});
 }
 return {groups,ink};
}
export function createSand(canvas,app,answers){
 const ctx=canvas.getContext('2d',{alpha:true});
 const clear=()=>{canvas.width=canvas.height=1;delete app.dataset.sandPhase;delete app.dataset.sandProgress;delete app.dataset.qaCaptured;delete canvas.dataset.grains;answers.classList.remove('is-sanding','is-growing');answers.style.removeProperty('--ink-opacity');};
 async function transition({timeline,reduced,seed,replace}){
  clear();if(reduced){replace();return;}
  const dpr=Math.min(devicePixelRatio||1,SCENIC.maxDpr),origin=canvas.getBoundingClientRect(),rand=randomFrom(seed);
  canvas.width=Math.round(origin.width*dpr);canvas.height=Math.round(origin.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  const old=glyphs(answers,origin,rand,dpr);answers.classList.add('is-sanding');replace();
  const next=glyphs(answers,origin,rand,dpr),grains=[],formed=surface(canvas.width,canvas.height),dotMask=surface(canvas.width,canvas.height);
  old.groups.forEach((group,row)=>{
   const target=next.groups[row],count=Math.max(group.points.length,target.points.length);
   group.points.sort((a,b)=>a.x-b.x||a.y-b.y);target.points.sort((a,b)=>a.x-b.x||a.y-b.y);
   for(let i=0;i<count;i++){
    const start=group.points[Math.min(group.points.length-1,Math.floor(i/count*group.points.length))],end=target.points[Math.min(target.points.length-1,Math.floor(i/count*target.points.length))],ridge=Math.max(0,1-Math.abs(start.x-start.letterCenter)/Math.max(1,start.letterWidth/2));
    grains.push({start,end,fromOld:Math.floor((i+1)*group.points.length/count)>Math.floor(i*group.points.length/count),toNew:Math.floor((i+1)*target.points.length/count)>Math.floor(i*target.points.length/count),pile:{x:start.x,y:Math.max(start.y,start.baseline-ridge*(2+rand()*4))},radius:.48+rand()*.32,delay:rand()*.06});
   }
  });
  canvas.dataset.grains=String(grains.length);
  if(app.dataset.qa==='true'){canvas.dataset.upward=String(grains.filter(g=>g.toNew&&g.end.y<g.pile.y).length);canvas.dataset.downward=String(grains.filter(g=>g.toNew&&g.end.y>g.pile.y).length);canvas.dataset.shape='circle';canvas.dataset.grainsPerLetter=String(SCENIC.grainsPerLetter);}
  try{await timeline.tween(SCENIC.sandMs,t=>{
   ctx.clearRect(0,0,origin.width,origin.height);
   const phase=t<SCENIC.sandFall?'falling':t<SCENIC.sandSettle?'settled':'forming',solid=clamp((t-.80)/.13),handoff=clamp((t-.93)/.07);
   app.dataset.sandPhase=phase;if(app.dataset.qa==='true')app.dataset.sandProgress=t.toFixed(3);
   answers.style.setProperty('--ink-opacity',String(handoff));
   for(const g of grains){
    let x,y,alpha=g.fromOld?1:0;
    if(t<SCENIC.sandFall){const q=clamp((t-g.delay)/(SCENIC.sandFall-g.delay));x=g.start.x;y=mix(g.start.y,g.pile.y,q*q);}
    else if(t<SCENIC.sandSettle){x=g.pile.x;y=g.pile.y;}
    else{const q=ease(clamp((t-SCENIC.sandSettle)/(.88-SCENIC.sandSettle)));x=mix(g.pile.x,g.end.x,q);y=mix(g.pile.y,g.end.y,q);alpha=(g.toNew?(g.fromOld?1:q):1-q)*(1-solid)*(1-handoff);}
    if(alpha<=0)continue;ctx.globalAlpha=alpha;ctx.fillStyle=phase==='forming'?g.end.color:g.start.color;ctx.beginPath();ctx.arc(x,y,g.radius,0,Math.PI*2);ctx.fill();
   }
   // The arriving dots reveal the exact glyph mask. Once complete, this crisp
   // full font fades out at exactly the rate the identical DOM font fades in.
   if(solid>0){
    const mask=dotMask.getContext('2d');mask.setTransform(dpr,0,0,dpr,0,0);mask.clearRect(0,0,origin.width,origin.height);mask.fillStyle='#000';
    if(solid>.98)mask.fillRect(0,0,origin.width,origin.height);
    else{mask.beginPath();for(const g of grains)if(g.toNew){mask.moveTo(g.end.x+(.6+solid*3),g.end.y);mask.arc(g.end.x,g.end.y,.6+solid*3,0,Math.PI*2);}mask.fill();}
    const f=formed.getContext('2d');f.globalCompositeOperation='source-over';f.clearRect(0,0,formed.width,formed.height);f.drawImage(next.ink,0,0);f.globalCompositeOperation='destination-in';f.drawImage(dotMask,0,0);
    ctx.globalAlpha=solid*(1-handoff);ctx.drawImage(formed,0,0,origin.width,origin.height);
   }
   ctx.globalAlpha=1;
   if(app.dataset.qa==='true'&&app.dataset.qaCaptureAt!==undefined&&t>=Number(app.dataset.qaCaptureAt)){const target=app.dataset.qaCaptureAt;delete app.dataset.qaCaptureAt;app.dataset.qaCaptured=target;timeline.setPaused(true);}
  },app.dataset.qa==='true'?{stopAt:()=>app.dataset.qaCaptureAt===undefined?undefined:Number(app.dataset.qaCaptureAt)}:{});}finally{clear();}
 }
 return {transition,clear};
}
