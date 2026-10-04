import {DEFAULT_EFFECTS,effectBudget,frameStats} from './effect-model.mjs';

export function applyBubbleSettings(bubble,config=DEFAULT_EFFECTS){
 const b=config.bubble;
 bubble.setTuning({speed:b.speed});bubble.setChaos({amplitude:b.amplitude,orbit:b.orbit});
 bubble.setTransition({duration:b.transitionDuration/1000,blur:b.transitionBlur,sparks:Math.min(b.transitionSparks,config.particleBudget)});
}
// Only transforms and opacity. One bounded layer, one burst, never stacked loops.
export function playResponseEffect(host,{config=DEFAULT_EFFECTS,preset=config.presets.spark,event='correct',combo=false,target,onMetrics=()=>{}}={}){
 const start=performance.now(),motion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const budget=effectBudget(config,preset,combo),animations=[],frames=[];
 let stopped=false,timer,frame,last=0,observer;
 const memory=()=>performance.memory?{heapMB:Math.round(performance.memory.usedJSHeapSize/1048576),scope:'Cała karta, nie sam efekt'}:null;
 if(!config.enabled||document.hidden){onMetrics({disabled:true,particles:0,memory:memory()});return ()=>{};}
 const layer=document.createElement('div');layer.className='response-effect-layer';layer.setAttribute('aria-hidden','true');
 Object.assign(layer.style,{position:'absolute',inset:'0',pointerEvents:'none',overflow:'visible',zIndex:'4'});
 host.append(layer);
 const duration=event==='wrong'?config.wrong.duration:preset.duration;
 const animate=(node,keys,options)=>{const a=node.animate(keys,{fill:'none',...options});animations.push(a);return a;};
 if(motion){
  const badge=document.createElement('span');badge.textContent=event==='wrong'?'Spróbuj jeszcze raz':combo?'Świetna seria!':'Brawo!';
  Object.assign(badge.style,{position:'absolute',top:'12%',left:'50%',transform:'translateX(-50%)',background:'white',borderRadius:'20px',padding:'10px 16px',fontWeight:'800',color:event==='wrong'?config.wrong.color:preset.color});layer.append(badge);
 }else if(event==='wrong'){
  if(target)animate(target,[{transform:'translateX(0)'},{transform:`translateX(-${config.wrong.shake}px)`,offset:.2},{transform:`translateX(${config.wrong.shake}px)`,offset:.4},{transform:`translateX(-${config.wrong.shake/2}px)`,offset:.65},{transform:'translateX(0)'}],{duration,easing:'ease-out'});
  const ring=document.createElement('span');Object.assign(ring.style,{position:'absolute',inset:'12%',border:`3px solid ${config.wrong.color}`,borderRadius:'50%'});layer.append(ring);
  animate(ring,[{opacity:0,transform:'scale(.94)'},{opacity:.65,offset:.3},{opacity:0,transform:'scale(1.08)'}],{duration});
 }else{
  if(target)animate(target,[{transform:'scale(1)'},{transform:`scale(${Math.min(1.18,preset.scale+(combo?0.025:0))})`,offset:.27},{transform:'scale(.99)',offset:.7},{transform:'scale(1)'}],{duration:Math.min(600,duration),easing:'ease-out'});
  for(let i=0;i<budget.particles;i++){
   const node=document.createElement('i'),angle=2*Math.PI*i/Math.max(1,budget.particles),spread=preset.spread*(.65+(i%4)*.12),x=Math.cos(angle)*spread,y=Math.sin(angle)*spread;
   const style=preset.style,size=style==='halo'||style==='ripple'?30:style==='comet'?14:8;
   Object.assign(node.style,{position:'absolute',left:'50%',top:style==='fountain'?'78%':'50%',width:size+'px',height:(style==='confetti'?12:size)+'px',background:style==='halo'||style==='ripple'?'transparent':preset.color,border:style==='halo'||style==='ripple'?`2px solid ${preset.color}`:'0',borderRadius:style==='petal'?'80% 0 80% 0':['star','diamond','confetti'].includes(style)?'2px':'50%',opacity:'0',margin:`-${size/2}px`,transformOrigin:'center'});
   if(style==='comet'){node.style.width='20px';node.style.height='5px';node.style.background=`linear-gradient(90deg,transparent,${preset.color})`;}
   if(style==='star')node.style.clipPath='polygon(50% 0,61% 35%,98% 35%,68% 58%,79% 94%,50% 72%,21% 94%,32% 58%,2% 35%,39% 35%)';
   layer.append(node);
   const from=style==='orbit'?`translate(${x*.4}px,${y*.4}px)`:'translate(0,0)';
   const to=style==='confetti'?`translate(${x}px,${y+65}px) rotate(${i*47}deg)`:
    style==='fountain'?`translate(${x*.65}px,${-Math.abs(y)-45}px) rotate(${i*29}deg)`:
    style==='ripple'||style==='halo'?`translate(${x*.45}px,${y*.45}px) scale(${2+i%3})`:
    style==='comet'?`translate(${x}px,${y}px) rotate(${angle*180/Math.PI}deg) scaleX(.25)`:
    style==='diamond'?`translate(${x}px,${y}px) rotate(45deg)`:`translate(${x}px,${y}px) rotate(${i*21}deg)`;
   const orbitMid=style==='orbit'?{opacity:1,transform:`translate(${Math.cos(angle+1)*spread}px,${Math.sin(angle+1)*spread}px)`,offset:.55}:{opacity:1,offset:.18};
   animate(node,[{opacity:0,transform:from+' scale(.4)'},orbitMid,{opacity:0,transform:to}],{duration:duration-(i%3)*35,delay:(i%4)*20,easing:'cubic-bezier(.16,.65,.25,1)'});
  }
 }
 const setupMs=performance.now()-start;
 const stop=()=>{
  if(stopped)return;stopped=true;clearTimeout(timer);cancelAnimationFrame(frame);observer?.disconnect();
  animations.forEach(a=>a.cancel());layer.remove();document.removeEventListener('visibilitychange',hidden);
  onMetrics({...frameStats(frames),intervals:frames,presetName:preset.name,particles:event==='wrong'||motion?0:budget.particles,requested:budget.requested,capped:budget.capped,duration,setupMs:Math.round(setupMs*10)/10,reduced:motion,memory:memory(),cancelled:document.hidden});
 };
 const hidden=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hidden);
 const tick=now=>{if(stopped)return;if(last)frames.push(now-last);last=now;frame=requestAnimationFrame(tick);};
 frame=requestAnimationFrame(tick);timer=setTimeout(stop,duration+140);
 return stop;
}
