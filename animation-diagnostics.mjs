// Opt-in iOS animation diagnostic: ?animationDebug=1 (never enabled for ordinary players).
if(new URLSearchParams(location.search).has('animationDebug')){
 const view=document.createElement('output');
 view.id='mn-animation-diagnostics';
 view.setAttribute('aria-label','Diagnostyka odświeżania animacji');
 view.style.cssText='position:fixed;z-index:2147483647;bottom:calc(12px + env(safe-area-inset-bottom));left:8px;right:8px;max-width:390px;pointer-events:none;padding:9px 12px;background:rgba(12,25,48,.91);color:white;border:1px solid #7bb8fc;border-radius:12px;white-space:pre-wrap;font:600 11px/1.45 ui-monospace,monospace;box-shadow:0 4px 14px #0005;';
 const install=()=>{if(!view.isConnected)document.body.append(view);};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
 let rafCount=0,lastRaf=0,maxRafGap=0,lastRafGap=0,largeGaps=0,lastShape='',shapeChanges=0,previousAnimationTime=null;
 const sampleRaf=time=>{if(lastRaf){lastRafGap=time-lastRaf;maxRafGap=Math.max(maxRafGap,lastRafGap);if(lastRafGap>220&&document.visibilityState==='visible')largeGaps++;}lastRaf=time;rafCount++;requestAnimationFrame(sampleRaf);};
 requestAnimationFrame(sampleRaf);
 const sample=()=>{
  install();
  const path=document.querySelector('.soap-svg path[id$="-shape"]');
  if(path){const d=path.getAttribute('d')||'';if(d!==lastShape&&lastShape)shapeChanges++;lastShape=d;}
  const animations=document.getAnimations().filter(a=>a.playState==='running');
  const a=animations.find(a=>a.effect?.getTiming?.().iterations===Infinity)||animations[0];
  const t=Number(a?.currentTime)||0,cssAdvance=previousAnimationTime===null?null:Math.round(t-previousAnimationTime);
  previousAnimationTime=t||null;
  const soap=document.querySelector('.soap-svg');
  const paused=document.querySelector('#app')?.classList.contains('paused')||false;
  view.textContent=[
   'ANIMACJE · Test PWA / iOS',
   'RAF/s: '+rafCount+' · odstęp: '+Math.round(lastRafGap)+' ms · max: '+Math.round(maxRafGap)+' ms',
   'RAF >220 ms: '+largeGaps+' · SVG: '+shapeChanges+' zm./s',
   'CSS: '+animations.length+' aktywnych · czas: '+(cssAdvance===null?'—':cssAdvance+' ms'),
   'document.hidden: '+document.hidden+' · pauza: '+paused+' · soap-still: '+Boolean(soap?.closest('.soap-still')),
   'Timer: '+new URLSearchParams(location.search).has('animationTimer')+' · dotknij ekranu, gdy obraz stanie'
  ].join('\\n');
  rafCount=0;maxRafGap=0;largeGaps=0;shapeChanges=0;
 };
 sample();setInterval(sample,1000);
}
