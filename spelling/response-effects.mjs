import {DEFAULT_EFFECTS,effectBudget,frameStats,normalizeEffectsConfig} from './effect-model.mjs';

export function applyBubbleSettings(bubble,config=DEFAULT_EFFECTS){
 const e=normalizeEffectsConfig(config);
 if(bubble.setBubbleConfig){bubble.setBubbleConfig(e);return;}
 const b=e.bubble;
 bubble.setTuning({speed:b.speed});bubble.setChaos({amplitude:b.amplitude,orbit:b.orbit});
 bubble.setTransition({duration:b.transitionDuration/1000,blur:b.transitionBlur,sparks:Math.min(b.transitionSparks,e.particleBudget)});
}

const star5='polygon(50% 0,61% 35%,98% 35%,68% 58%,79% 94%,50% 72%,21% 94%,32% 58%,2% 35%,39% 35%)';
const star9='polygon(50% 0,58% 27%,82% 9%,74% 37%,100% 41%,76% 54%,94% 76%,66% 68%,67% 100%,50% 74%,33% 100%,34% 68%,6% 76%,24% 54%,0 41%,26% 37%,18% 9%,42% 27%)';

function particleOrigin(host,preset,originTarget){
 const rect=host.getBoundingClientRect();
 if(preset.style==='textConfetti'&&originTarget?.getBoundingClientRect){
  const target=originTarget.getBoundingClientRect();
  return {x:target.left+target.width/2-rect.left,y:target.top+target.height/2-rect.top};
 }
 return {x:rect.width*preset.originX/100,y:rect.height*preset.originY/100};
}
function decorate(node,style,color,size,index){
 Object.assign(node.style,{position:'absolute',width:size+'px',height:size+'px',background:color,border:'0',borderRadius:'50%',opacity:'0',transformOrigin:'center',willChange:'transform,opacity,filter'});
 if(style==='confetti'||style==='textConfetti'){node.style.height=Math.max(5,size*.55)+'px';node.style.borderRadius=Math.max(2,size*.12)+'px';}
 if(style==='petal')node.style.borderRadius='80% 0 80% 0';
 if(style==='diamond'){node.style.borderRadius='2px';node.style.transform='rotate(45deg)';}
 if(style==='star'||style==='star5'){node.style.clipPath=star5;node.style.borderRadius='0';}
 if(style==='star9'){node.style.clipPath=star9;node.style.borderRadius='0';}
 if(style==='halo'||style==='ripple'){node.style.background='transparent';node.style.border=`2px solid ${color}`;node.style.borderRadius='50%';}
 if(style==='comet'){node.style.width=size*2.5+'px';node.style.height=Math.max(3,size*.22)+'px';node.style.borderRadius='999px';node.style.background=`linear-gradient(90deg,transparent,${color},#fff)`;}
 if(style==='lightning'){node.style.width=size*2.8+'px';node.style.height=Math.max(3,size*.16)+'px';node.style.borderRadius='2px';node.style.background=`linear-gradient(90deg,transparent,${color} 28%,#fff 52%,${color} 70%,transparent)`;node.style.filter=`drop-shadow(0 0 ${Math.max(3,size*.3)}px ${color})`;}
 if(style==='glitter'){node.style.clipPath=index%2?star9:star5;node.style.background=index%3===0?'#fff':color;node.style.filter=`drop-shadow(0 0 ${Math.max(2,size*.45)}px ${color})`;}
 if(style==='dynamite'){node.style.background=index%4===0?'#fff':index%3===0?'#ffd54f':color;node.style.filter=`drop-shadow(0 0 ${Math.max(3,size*.55)}px ${color})`;node.style.borderRadius=index%5===0?'2px':'50%';}
}
function makeParticlePreset(config,event,preset){
 return event==='wrong'?{name:'Błąd',enabled:true,scale:1,...config.wrong}:preset;
}

export function playResponseEffect(host,{config=DEFAULT_EFFECTS,preset,event='correct',combo=false,target,originTarget,onMetrics=()=>{}}={}){
 const effects=normalizeEffectsConfig(config),selected=makeParticlePreset(effects,event,preset||effects.presets.spark);
 const start=performance.now(),motion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const budget=effectBudget(effects,selected,combo),animations=[],frames=[];
 let stopped=false,timer,frame,last=0,observer;
 const memory=()=>performance.memory?{heapMB:Math.round(performance.memory.usedJSHeapSize/1048576),heapLimitMB:Math.round(performance.memory.jsHeapSizeLimit/1048576),scope:'Cała karta, nie sam efekt'}:null;
 if(!effects.enabled||document.hidden){onMetrics({disabled:true,particles:0,memory:memory()});return ()=>{};}
 const layer=document.createElement('div');layer.className='response-effect-layer';layer.setAttribute('aria-hidden','true');
 Object.assign(layer.style,{position:'absolute',inset:'0',pointerEvents:'none',overflow:'visible',zIndex:'14'});
 host.append(layer);
 const duration=event==='wrong'?effects.wrong.duration:selected.duration;
 const animate=(node,keys,options)=>{const a=node.animate(keys,{fill:'none',...options});animations.push(a);return a;};

 if(motion){
  const badge=document.createElement('span');badge.textContent=event==='wrong'?'Spróbuj jeszcze raz':combo?'Świetna seria!':'Brawo!';
  Object.assign(badge.style,{position:'absolute',top:'12%',left:'50%',transform:'translateX(-50%)',background:'white',borderRadius:'20px',padding:'10px 16px',fontWeight:'800',color:event==='wrong'?effects.wrong.color:selected.color});layer.append(badge);
 }else{
  if(target){
   if(event==='wrong'){
    const w=effects.wrong,angle=Math.random()*Math.PI*2,hit=w.randomHit*14*w.intensity,dx=Math.cos(angle)*hit,dy=Math.sin(angle)*hit;
    animate(target,[
     {transform:'translate(0,0) rotate(0deg) scale(1)'},
     {transform:`translate(${dx}px,${dy}px) rotate(${(Math.random()-.5)*4*w.wobble}deg) scale(${1+.012*w.intensity})`,offset:.18},
     {transform:`translate(${-w.shake}px,0) rotate(${-1.5*w.wobble}deg)`,offset:.36},
     {transform:`translate(${w.shake}px,0) rotate(${1.5*w.wobble}deg)`,offset:.52},
     {transform:`translate(${-w.shake*.45}px,0) rotate(${-.6*w.wobble}deg)`,offset:.72},
      {transform:'translate(0,0) rotate(0deg) scale(1)'}
    ],{duration,easing:'cubic-bezier(.18,.72,.2,1)'});
   }else{
    animate(target,[
     {transform':scale(1) rotate(0deg)'},
     {transform:`scale(${Math.min(1.3,selected.scale+(combo?.035:0))}) rotate(${(Math.random()-.5)*2.5}deg)`,offset:.24},
     {transform:'scale(.99) rotate(0deg)',offset:.7},{transform:'scale(1) rotate(0deg)'}
    ],{duration:Math.min(720,duration),easing:'cubic-bezier(.15,.75,.2,1)'});
   }
  }
  if(event==='wrong'&effects.wrong.flash>0){
   const ring=document.createElement('span');
   Object.assign(ring.style,{position:'absolute',inset:'9%',border:`${Math.max(2,2+effects.wrong.flash)}px solid ${effects.wrong.color}`,borderRadius:'44%',boxShadow:`0 0 ${10+effects.wrong.flash*14}px ${effects.wrong.color}55`});layer.append(ring);
   animate(ring,[{opacity:0,transform:'scale(.94)'},{opacity:Math.min(.9,.35+effects.wrong.flash*.3),offset:.22},{opacity:0,transform:'scale(1.08)'}],{duration});
  }

  const origin=particleOrigin(host,selected,originTarget),bursts=Math.max(1,Math.round(selected.bursts));
  for(let i=0;i<budget.particles;i++){
   const node=document.createElement('i'),burst=i%bursts,base=i/Math.max(1,budget.particles)*Math.PI*2;
   const jitter=(Math.random()-.5)*selected.randomness*1.4,angle=base+jitter;
   const distance=selected.spread*(.55+Math.random()*(.55+selected.randomness*.45))*selected.speed*(1-selected.drag*.38);
   const x=Math.cos(angle)*distance,y=Math.sin(angle)*distance+selected.gravity*70;
   const size=selected.sizeMin+Math.random()*(selected.sizeMax-selected.sizeMin);
   decorate(node,selected.style,selected.color,size,i);
   node.style.left=origin.x+'px';node.style.top=origin.y+'px';node.style.margin=(-size/2)+'px';
   layer.append(node);
   const rotation=(Math.random()>.5?1:-1)*selected.rotation*(.45+Math.random()*.75);
   const delay=selected.delay+burst*Math.min(170,duration*.14)+Math.random()*selected.randomness*70;
   const localDuration=Math.max(180,duration*selected.lifetime*(.78+Math.random()*.3));
   const from=selected.style==='orbit'?`translate(${x*.2}px,${y*.2}px) scale(.35)`:'translate(0,0) scale(.25)';
   let middle={opacity:selected.opacity,offset:.18};
   let to=`translate(${x}px,${y}px) rotate(${rotation}deg) scale(.45)`;
   if(selected.style==='fountain')to=`translate(${x*.72}px,${-Math.abs(y)-55}px) rotate(${rotation}deg) scale(.45)`;
   if(selected.style==='orbit')middle={opacity:selected.opacity,transform:`translate(${Math.cos(angle+1.4)*distance}px,${Math.sin(angle+1.4)*distance}px) scale(1)`,offset:.56};
   if(selected.style==='halo'||selected.style==='ripple')to=`translate(${x*.32}px,${y*.32}px) scale(${2.2+Math.random()*1.8})`;
   if(selected.style==='comet'||selected.style==='lightning')to=`translate(${x}px,${y}px) rotate(${angle*180/Math.PI}deg) scaleX(.18)`;
   if(selected.style==='dynamite')middle={opacity:selected.opacity,transform:`translate(${x*.24}px,${y*.24}px) scale(${1.2+Math.random()*.8})`,offset:.24};
   animate(node,[{opacity:0,transform:from},middle,{opacity:0,transform:to}],{duration:localDuration,delay,easing:'cubic-bezier(.12,.66,.2,1)'});
  }
 }
 const setupMs=performance.now()-start;
 const stop=()=>{
  if(stopped)return;stopped=true;clearTimeout(timer);cancelAnimationFrame(frame);observer?.disconnect();
  animations.forEach(a=>a.cancel());layer.remove();document.removeEventListener('visibilitychange',hidden);
  onMetrics({...frameStats(frames),intervals:frames,presetName:selected.name,particles:motion?0:budget.particles,requested:budget.requested,capped:budget.capped,duration,setupMs:Math.round(setupMs*10)/10,reduced:motion,memory:memory(),cancelled:document.hidden});
 };
 const hidden=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hidden);
 const tick=now=>{if(stopped)return;if(last)frames.push(now-last);last=now;frame=requestAnimationFrame(tick);};
 frame=requestAnimationFrame(tick);timer=setTimeout(stop,Math.max(duration,duration*selected.lifetime)+selected.delay+bursts*180+160);
 return stop;
}
