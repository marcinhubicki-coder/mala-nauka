import {effectiveTokens} from '../design-system/model.mjs';
export const JELLY_V4_DEFAULTS=Object.freeze({
 motion:Object.freeze({duration:.90,stretch:1.45,recoil:.55,bounce:.75,inertia:2.40,magnet:1.80}),
 shape:Object.freeze({radius:18,inset:4,squish:15,tilt:1.3,border:1,depth:1}),
 light:Object.freeze({shadow:1,glow:.65,shine:1.50,blur:0,saturation:1,contrast:1}),
 text:Object.freeze({delay:440,duration:430,bump:1.25,glow:.65,fade:1.10,blur:0}),
});

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const lerp=(a,b,t)=>a+(b-a)*t;

// One deformation model serves segmented Jelly controls and continuous drag
// handles. Skins keep their own colour and geometry; motion stays coherent.
export function jellyTransform(amount,direction=1,shape=JELLY_V4_DEFAULTS.shape){
 const strength=clamp(Number(amount)||0,0,1),dir=direction<0?-1:1;
 const shapeSquish=Number(shape?.squish),shapeTilt=Number(shape?.tilt);
 const squish=(Number.isFinite(shapeSquish)?shapeSquish:JELLY_V4_DEFAULTS.shape.squish)/100;
 const tilt=(Number.isFinite(shapeTilt)?shapeTilt:JELLY_V4_DEFAULTS.shape.tilt)*dir;
 const sx=1+strength*squish*.45,sy=1-strength*squish;
 return 'scale('+sx.toFixed(4)+','+sy.toFixed(4)+') rotate('+(tilt*strength).toFixed(2)+'deg)';
}

export function createJellyV4({indicatorSelector,getTokens=()=>effectiveTokens('jelly')}={}){
 const params=structuredClone(JELLY_V4_DEFAULTS);
 function syncDesign(){
  const tokens=getTokens()||{};
  if(tokens.height===undefined)return;
  params.motion.duration=tokens.duration/1000;
  for(const key of ['stretch','recoil','bounce','inertia','magnet'])if(tokens[key]!==undefined)params.motion[key]=tokens[key];
  params.shape.radius=Math.max(8,tokens.radius-3);params.shape.inset=tokens.inset;
  for(const key of ['squish','tilt'])if(tokens[key]!==undefined)params.shape[key]=tokens[key];
  for(const key of ['glow','shine','blur','saturation','contrast'])if(tokens[key]!==undefined)params.light[key]=tokens[key];
  params.text.delay=tokens.inkDelay;params.text.duration=tokens.inkDuration;
  const textKeys={inkBump:'bump',inkGlow:'glow',inkFade:'fade',inkBlur:'blur'};
  for(const [token,key] of Object.entries(textKeys))if(tokens[token]!==undefined)params.text[key]=tokens[token];
 }
 const motionAnimations=new WeakMap();
 const textAnimations=new WeakMap();
 const dragStates=new WeakMap();

 function labels(container){return [...container.querySelectorAll(':scope > label')];}
 function indicator(container){return container.querySelector(indicatorSelector);}
 function spanFor(label){return label?.querySelector('span')||null;}

 function ensurePrepared(container,index=0){
  syncDesign();
  if(!container)return null;
  container.classList.add('jelly-v4-container');
  container.style.setProperty('--jelly-radius',params.shape.radius+'px');
  container.style.setProperty('--jelly-inset',params.shape.inset+'px');
  container.style.setProperty('--jelly-border',params.shape.border+'px');
  container.style.setProperty('--jelly-depth',String(params.shape.depth));
  container.style.setProperty('--jelly-glow',String(params.light.glow));
  container.style.setProperty('--jelly-shine',String(params.light.shine));
  container.style.setProperty('--jelly-blur',params.light.blur+'px');
  container.style.setProperty('--jelly-saturation',String(params.light.saturation));
  container.style.setProperty('--jelly-contrast',String(params.light.contrast));

  const node=indicator(container);
  node?.classList.add('jelly-v4-indicator');

  const list=labels(container);
  list.forEach((label,i)=>{
    label.classList.add('jelly-v4-label');
    const span=spanFor(label);
    if(span)span.classList.toggle('jelly-v4-text-active',i===index);
  });
  container.dataset.jellyPreviewIndex=String(index);
  return node;
 }

 function ensureBuffer(container){
  if(container.parentElement?.classList.contains('jelly-v4-buffer'))return container.parentElement;
  const buffer=document.createElement('div');
  buffer.className='jelly-v4-buffer';
  container.parentNode?.insertBefore(buffer,container);
  buffer.append(container);
  return buffer;
 }

 function geometry(container,index){
  const list=labels(container),target=list[index];
  if(!target)return null;
  const cr=container.getBoundingClientRect(),tr=target.getBoundingClientRect(),inset=params.shape.inset;
  const left=Math.max(inset,tr.left-cr.left+inset);
  const right=Math.max(inset,cr.right-tr.right+inset);
  const width=Math.max(0,cr.width-left-right);
  return {left,right,width,center:left+width/2};
 }
 function visualGeometry(container,node){
  const cr=container.getBoundingClientRect(),r=node.getBoundingClientRect();
  const left=Math.max(0,r.left-cr.left),right=Math.max(0,cr.right-r.right),width=Math.max(0,cr.width-left-right);
  return {left,right,width,center:left+width/2};
 }
 function fractionalGeometry(container,progress){
  const list=labels(container);
  const low=clamp(Math.floor(progress),0,list.length-1),high=clamp(Math.ceil(progress),0,list.length-1);
  const mix=progress-low,a=geometry(container,low),b=geometry(container,high);
  if(!a||!b)return null;
  return {left:lerp(a.left,b.left,mix),right:lerp(a.right,b.right,mix),center:lerp(a.center,b.center,mix)};
 }
 function transformAt(amount,dir=1){
  return jellyTransform(amount,dir,params.shape);
 }
 function timing(current,target){
  const distance=Math.abs(target.center-current.center);
  const base=clamp(Math.round(860+distance*.72),860,1280);
  return {total:Math.round(base*1.23*params.motion.duration),overshoot:clamp(distance*.065,5,16)*params.motion.stretch};
 }
 function frames(current,target,forward,t){
  const dir=forward?1:-1;
  const back=Math.max(0,t.overshoot*.34*params.motion.recoil);
  const bounce=Math.max(0,t.overshoot*.10*params.motion.bounce);
  const early=clamp(.58/params.motion.inertia,.18,.88);
  const mid=clamp(.93/Math.sqrt(params.motion.inertia),.55,.995);
  const o=t.overshoot;
  if(forward){
   return [
    {offset:0,left:current.left+'px',right:current.right+'px',transform:transformAt(0,dir),easing:'cubic-bezier(.30,.04,.22,1)'},
    {offset:.13,left:current.left+'px',right:lerp(current.right,target.right,early)+'px',transform:transformAt(.35,dir),easing:'cubic-bezier(.18,.78,.22,1)'},
    {offset:.31,left:lerp(current.left,target.left,.26)+'px',right:lerp(current.right,target.right,mid)+'px',transform:transformAt(.7,dir),easing:'cubic-bezier(.16,.84,.20,1)'},
    {offset:.44,left:(target.left+o)+'px',right:lerp(current.right,target.right,.992)+'px',transform:transformAt(1,dir),easing:'cubic-bezier(.14,.80,.18,1)'},
    {offset:.69,left:(target.left-back)+'px',right:target.right+'px',transform:transformAt(.38,-dir),easing:'cubic-bezier(.16,.76,.18,1)'},
    {offset:.86,left:(target.left+bounce)+'px',right:target.right+'px',transform:transformAt(.16,dir),easing:'cubic-bezier(.12,.70,.16,1)'},
    {offset:1,left:target.left+'px',right:target.right+'px',transform:'scale(1) rotate(0deg)'}
   ];
  }
  return [
   {offset:0,left:current.left+'px',right:current.right+'px',transform:transformAt(0,dir),easing:'cubic-bezier(.30,.04,.22,1)'},
   {offset:.13,left:lerp(current.left,target.left,early)+'px',right:current.right+'px',transform:transformAt(.35,dir),easing:'cubic-bezier(.18,.78,.22,1)'},
   {offset:.31,left:lerp(current.left,target.left,mid)+'px',right:lerp(current.right,target.right,.26)+'px',transform:transformAt(.7,dir),easing:'cubic-bezier(.16,.84,.20,1)'},
   {offset:.44,left:lerp(current.left,target.left,.992)+'px',right:(target.right+o)+'px',transform:transformAt(1,dir),easing:'cubic-bezier(.14,.80,.18,1)'},
   {offset:.69,left:target.left+'px',right:(target.right-back)+'px',transform:transformAt(.38,-dir),easing:'cubic-bezier(.16,.76,.18,1)'},
   {offset:.86,left:target.left+'px',right:(target.right+bounce)+'px',transform:transformAt(.16,dir),easing:'cubic-bezier(.12,.70,.16,1)'},
   {offset:1,left:target.left+'px',right:target.right+'px',transform:'scale(1) rotate(0deg)'}
  ];
 }
 function stopMotion(container,node){
  const animation=motionAnimations.get(container);
  if(!animation)return visualGeometry(container,node);
  const visual=visualGeometry(container,node);
  try{animation.cancel();}catch{}
  motionAnimations.delete(container);
  container.classList.remove('jelly-v4-moving');
  node.style.left=visual.left+'px';node.style.right=visual.right+'px';node.style.transform='';
  return visual;
 }

 function cancelText(span){
  const list=textAnimations.get(span)||[];
  list.forEach(a=>{try{a.cancel();}catch{}});
  textAnimations.delete(span);
 }
 function colors(container){
  const cs=getComputedStyle(container);
  return {
   active:(cs.getPropertyValue('--jelly-active-ink')||'#a74869').trim(),
   idle:(cs.getPropertyValue('--jelly-idle-ink')||'#697a91').trim()
  };
 }
 function animateText(container,fromIndex,toIndex,{instant=false}={}){
  const list=labels(container),from=spanFor(list[fromIndex]),to=spanFor(list[toIndex]);
  if(!to)return;
  const allSpans=list.map(spanFor).filter(Boolean);
  allSpans.forEach((span,i)=>span.classList.toggle('jelly-v4-text-active',i===toIndex));
  container.dataset.jellyPreviewIndex=String(toIndex);
  if(instant||fromIndex===toIndex||matchMedia('(prefers-reduced-motion: reduce)').matches)return;

  [from,to].filter(Boolean).forEach(cancelText);
  const t=params.text,{active,idle}=colors(container);
  const glow='0 0 '+(3.5*t.glow).toFixed(1)+'px rgba(255,255,255,.92),0 0 '+(9*t.glow).toFixed(1)+'px color-mix(in srgb,'+active+' 22%,transparent)';
  const fadeDip=clamp(1-.18*t.fade,.55,1),bump=1+.075*t.bump,blur=Math.max(0,t.blur);

  if(from){
   const out=from.animate([
    {color:active,opacity:1,filter:'blur(0px)',transform:'scale(1)',textShadow:glow},
    {color:idle,opacity:fadeDip,filter:'blur('+blur+'px)',transform:'scale(.985)',offset:.52},
    {color:idle,opacity:1,filter:'blur(0px)',transform:'scale(1)',textShadow:'none'}
   ],{duration:Math.max(80,t.duration),easing:'cubic-bezier(.2,.65,.25,1)',fill:'both'});
   textAnimations.set(from,[out]);
   out.finished.catch(()=>{}).then(()=>{if(textAnimations.get(from)?.includes(out)){try{out.cancel();}catch{} textAnimations.delete(from);}});
  }
  const incoming=to.animate([
   {color:idle,opacity:fadeDip,filter:'blur('+blur+'px)',transform:'scale(.985)',textShadow:'none'},
   {color:active,opacity:1,filter:'blur(0px)',transform:'scale('+bump.toFixed(4)+')',textShadow:glow,offset:.58},
   {color:active,opacity:1,filter:'blur(0px)',transform:'scale(1)',textShadow:glow}
  ],{delay:Math.max(0,t.delay),duration:Math.max(80,t.duration),easing:'cubic-bezier(.18,.78,.22,1)',fill:'both'});
  textAnimations.set(to,[incoming]);
  incoming.finished.catch(()=>{}).then(()=>{if(textAnimations.get(to)?.includes(incoming)){try{incoming.cancel();}catch{} textAnimations.delete(to);}});
 }

 function update(container,index,{animate=true}={}){
  if(!container)return;
  const list=labels(container),next=clamp(index,0,Math.max(0,list.length-1));
  const node=ensurePrepared(container,Number(container.dataset.activeIndex ?? next));
  if(!node||!list.length)return;
  const previous=Number(container.dataset.activeIndex ?? next);
  const target=geometry(container,next);
  if(!target)return;
  const current=stopMotion(container,node);
  container.dataset.activeIndex=String(next);
  animateText(container,Number(container.dataset.jellyPreviewIndex ?? previous),next,{instant:!animate});

  if(!animate||Math.abs(previous-next)<.001||matchMedia('(prefers-reduced-motion: reduce)').matches||typeof node.animate!=='function'){
   node.style.left=target.left+'px';node.style.right=target.right+'px';node.style.transform='';
   return;
  }
  const t=timing(current,target);
  container.style.setProperty('--jelly-total-ms',t.total+'ms');
  container.classList.add('jelly-v4-moving');
  const animation=node.animate(frames(current,target,next>previous,t),{duration:t.total,easing:'linear',fill:'both'});
  motionAnimations.set(container,animation);
  node.style.left=target.left+'px';node.style.right=target.right+'px';
  animation.finished.catch(()=>{}).then(()=>{
   if(motionAnimations.get(container)===animation){
    motionAnimations.delete(container);try{animation.cancel();}catch{}
    container.classList.remove('jelly-v4-moving');node.style.transform='';
   }
  });
 }

 function directionalCandidate(progress,direction,count){
  if(direction>0)return clamp(Math.floor(progress+.48),0,count-1);
  if(direction<0)return clamp(Math.ceil(progress-.48),0,count-1);
  return clamp(Math.round(progress),0,count-1);
 }
 function magnetize(progress,direction,count){
  const candidate=directionalCandidate(progress,direction,count);
  const delta=candidate-progress,dist=Math.abs(delta);
  if(dist>.58)return progress;
  const proximity=1-dist/.58;
  const strength=clamp(.10*params.motion.magnet*proximity*proximity,0,.42);
  return clamp(progress+delta*strength,0,count-1);
 }
 function setupDrag(container,{getActiveIndex,commitIndex,suppressClick,canDrag,captureOnDrag=false}={}){
  if(!container||container.dataset.jellyV4DragReady==='true')return;
  container.dataset.jellyV4DragReady='true';
  const active=Number(getActiveIndex?.()??0);
  ensurePrepared(container,active);
  const buffer=ensureBuffer(container);

  buffer.addEventListener('pointerdown',event=>{
   if(event.button!==undefined&&event.button!==0)return;
   if(canDrag && !canDrag())return;
   const node=indicator(container);if(!node)return;
   const list=labels(container),activeIndex=Number(getActiveIndex?.()??container.dataset.activeIndex??0);
   const activeGeom=geometry(container,activeIndex);if(!activeGeom)return;
   const label=event.target.closest('label'),tapIndex=label?list.indexOf(label):activeIndex;
   const now=performance.now();
   stopMotion(container,node);
   dragStates.set(container,{
    pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,
    startTime:now,lastTime:now,activeIndex,tapIndex,progress:activeIndex,direction:0,dragging:false
   });
   buffer.classList.add('is-grabbed');
   // Capturing a tap on the buffer retargets its native click away from the
   // label. English opts into capture after the drag threshold instead.
   if(!captureOnDrag){try{buffer.setPointerCapture(event.pointerId);}catch{}}
  });

  buffer.addEventListener('pointermove',event=>{
   const d=dragStates.get(container);if(!d||d.pointerId!==event.pointerId)return;
   const dx=event.clientX-d.startX,elapsed=performance.now()-d.startTime;
   if(!d.dragging){
    if(Math.abs(dx)>5||(elapsed>115&&Math.abs(dx)>2)){
     d.dragging=true;
     if(captureOnDrag){try{buffer.setPointerCapture(event.pointerId);}catch{}}
     suppressClick?.(520);
    }else{
     d.lastX=event.clientX;d.lastY=event.clientY;d.lastTime=performance.now();return;
    }
   }
   event.preventDefault();
   const list=labels(container),count=list.length;
   const g0=geometry(container,0),g1=geometry(container,1)||g0;
   const slot=Math.max(1,Math.abs((g1?.center||1)-(g0?.center||0)));
   const raw=clamp(d.activeIndex+dx/slot,0,count-1);
   d.direction=Math.sign(raw-d.progress)||d.direction||Math.sign(dx);
   d.progress=raw;
   const visual=magnetize(raw,d.direction,count),g=fractionalGeometry(container,visual),node=indicator(container);
   if(g&&node){
    node.style.left=g.left+'px';node.style.right=g.right+'px';
    const between=Math.min(1,Math.abs(visual-Math.round(visual))*2);
    node.style.transform=transformAt(between,d.direction||1);
   }
   const candidate=directionalCandidate(raw,d.direction,count);
   const preview=Number(container.dataset.jellyPreviewIndex??d.activeIndex);
   if(candidate!==preview)animateText(container,preview,candidate);
   d.lastX=event.clientX;d.lastY=event.clientY;d.lastTime=performance.now();
  });

  const finish=(event,cancelled=false)=>{
   const d=dragStates.get(container);if(!d||d.pointerId!==event.pointerId)return;
   dragStates.delete(container);buffer.classList.remove('is-grabbed');
   try{buffer.releasePointerCapture(event.pointerId);}catch{}
   if(cancelled){
    suppressClick?.(380);update(container,d.activeIndex,{animate:true});return;
   }
   if(!d.dragging){
    // Do not move on pointer-down/up alone. Native click handles direct jumps.
    return;
   }
   suppressClick?.(520);
   const finalIndex=directionalCandidate(d.progress,d.direction,labels(container).length);
   commitIndex?.(finalIndex);
  };
  buffer.addEventListener('pointerup',event=>finish(event,false));
  buffer.addEventListener('pointercancel',event=>finish(event,true));
 }

 return {update,setupDrag,ensurePrepared};
}
