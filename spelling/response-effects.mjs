import {DEFAULT_EFFECTS,effectBudget,frameStats,normalizeEffectsConfig} from './effect-model.mjs';

// A decorative top layer: it never receives pointer events, while taps on the
// real screen may pull a short, bounded group of particles toward that point.
export function createScreenAtmosphere(host,initial=DEFAULT_EFFECTS){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),layer=document.createElement('div');
 layer.className='screen-atmosphere';layer.setAttribute('aria-hidden','true');host.append(layer);
 let settings,bursts=[];
 const render=next=>{
  settings={...DEFAULT_EFFECTS.ambient,...(next?.ambient||next||{})};
  layer.className=`screen-atmosphere ambient-${settings.style} ambient-filter-${settings.filter}`;
  const variables={
   intensity:settings.intensity,density:settings.density,size:settings.size,speed:settings.speed,
   softness:`${settings.softness}px`,duration:`${Math.max(4,11-settings.speed*3)}s`,warmth:settings.warmth,bloom:settings.bloom,
   flare:settings.flare,grain:settings.grain,vignette:settings.vignette,
   'particle-opacity':settings.intensity*.76,'look-opacity':settings.intensity*(.58+settings.bloom*.42),
   'flare-opacity':settings.intensity*settings.flare,'grain-opacity':settings.intensity*settings.grain,
   'vignette-opacity':settings.intensity*settings.vignette,
  };
  for(const [key,value]of Object.entries(variables))layer.style.setProperty(`--ambient-${key}`,value);
  layer.replaceChildren();
  const finish=document.createElement('span'),lens=document.createElement('span');finish.className='ambient-finish';lens.className='ambient-lens';layer.append(finish,lens);
  if(settings.style==='none'||settings.style==='grain')return;
  const count=Math.min(36,Math.round((8+settings.intensity*18)*settings.density));
  for(let i=0;i<count;i++){
   const dot=document.createElement('i'),base=settings.style==='bokeh'?24+(i%6)*11:settings.style==='bubbles'?9+(i%5)*4:settings.style==='sparkles'?7+(i%4)*3:2+(i%3);
   dot.style.setProperty('--ambient-x',`${(i*37+13)%101}%`);dot.style.setProperty('--ambient-y',`${(i*61+7)%103}%`);
   dot.style.setProperty('--ambient-delay',`${-(i%11)*.73}s`);dot.style.setProperty('--ambient-size',`${base*settings.size}px`);
   dot.style.setProperty('--ambient-dx',`${-9+(i*17)%19}px`);dot.style.setProperty('--ambient-dy',`${-11-(i*13)%18}px`);layer.append(dot);
  }
 };
 const react=event=>{
  if(!settings?.responsive||settings.style==='none'||reduced.matches)return;
  const rect=host.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top,count=Math.min(10,4+Math.round(settings.intensity*8));
  for(let i=0;i<count;i++){const dot=document.createElement('b'),angle=i/count*Math.PI*2,radius=(34+(i%3)*18)*(settings.touchStrength||.6);dot.style.left=`${x+Math.cos(angle)*radius}px`;dot.style.top=`${y+Math.sin(angle)*radius}px`;layer.append(dot);const animation=dot.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.35)'},{opacity:.72,offset:.25},{opacity:0,transform:`translate(calc(-50% + ${-Math.cos(angle)*radius}px),calc(-50% + ${-Math.sin(angle)*radius}px)) scale(${.75+(settings.touchStrength||.6)*.5})`}],{duration:520+(i%3)*80,easing:'cubic-bezier(.16,.72,.22,1)'});bursts.push(animation);animation.finished.catch(()=>{}).finally(()=>{dot.remove();bursts=bursts.filter(row=>row!==animation);});}
 };
 host.addEventListener('pointerdown',react,{capture:true,passive:true});render(initial);
 return {update:render,destroy(){host.removeEventListener('pointerdown',react,{capture:true});bursts.forEach(a=>a.cancel());bursts=[];layer.remove();}};
}

export function applyBubbleSettings(bubble,config=DEFAULT_EFFECTS){
 if(bubble.setBubbleConfig){bubble.setBubbleConfig(config);return;}
 const b=config.bubble;
 bubble.setTuning({speed:b.speed});bubble.setChaos({amplitude:b.amplitude,orbit:b.orbit});
 bubble.setTransition({duration:b.transitionDuration/1000,blur:b.transitionBlur,sparks:Math.min(b.transitionSparks,config.particleBudget)});
}
// Only transforms and opacity. One bounded layer, one burst, never stacked loops.
export function playResponseEffect(host,{config=DEFAULT_EFFECTS,preset=config.presets.spark,event='correct',combo=false,target,onMetrics=()=>{}}={}){
 const start=performance.now(),motion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 config=normalizeEffectsConfig(config);const settings=event==='wrong'?{...config.wrong,name:'Błąd'}:{...DEFAULT_EFFECTS.presets.spark,...preset};
 const budget=effectBudget(config,settings,combo),animations=[],frames=[];
 let stopped=false,timer,frame,last=0;
 const memory=()=>performance.memory?{heapMB:Math.round(performance.memory.usedJSHeapSize/1048576),heapLimitMB:Math.round(performance.memory.jsHeapSizeLimit/1048576),scope:'Cała karta, nie sam efekt'}:null;
 if(!config.enabled||document.hidden){onMetrics({disabled:true,particles:0,memory:memory()});return ()=>{};}
 const layer=document.createElement('div');layer.className='response-effect-layer';layer.setAttribute('aria-hidden','true');
 Object.assign(layer.style,{position:'absolute',inset:'0',pointerEvents:'none',overflow:'visible',zIndex:'4'});
 host.append(layer);
 const duration=settings.duration,maxDelay=(settings.delay||0)+Math.max(0,(settings.bursts||1)-1)*120,particleDuration=Math.min(5200,duration*(.55+(settings.lifetime||1)*.45)),runDuration=Math.max(duration,maxDelay+particleDuration);
 const animate=(node,keys,options)=>{const a=node.animate(keys,{fill:'none',...options});animations.push(a);return a;};
 if(motion){
  const badge=document.createElement('span');badge.textContent=event==='wrong'?'Spróbuj jeszcze raz':combo?'Świetna seria!':'Brawo!';
  Object.assign(badge.style,{position:'absolute',top:'12%',left:'50%',transform:'translateX(-50%)',background:'white',borderRadius:'20px',padding:'10px 16px',fontWeight:'800',color:settings.color});layer.append(badge);
 }else{
  if(event==='wrong'&&target)animate(target,[{transform:'translateX(0)'},{transform:`translateX(-${settings.shake}px)`,offset:.2},{transform:`translateX(${settings.shake}px)`,offset:.4},{transform:`translateX(-${settings.shake/2}px)`,offset:.65},{transform:'translateX(0)'}],{duration,easing:'ease-out'});
  if(event!=='wrong'&&target)animate(target,[{transform:'scale(1)'},{transform:`scale(${Math.min(1.5,settings.scale+(combo ? .025 : 0))})`,offset:.27},{transform:'scale(.99)',offset:.7},{transform:'scale(1)'}],{duration:Math.min(600,duration),easing:'ease-out'});
  for(let i=0;i<budget.particles;i++){
   const node=document.createElement('i'),variation=1+(((i*37)%101)/100-.5)*(settings.randomness||0),angle=2*Math.PI*i/Math.max(1,budget.particles)+(settings.randomness||0)*Math.sin(i*19),spread=settings.spread*(.65+(i%4)*.12)*variation,speed=settings.speed||1,x=Math.cos(angle)*spread*speed,y=Math.sin(angle)*spread*speed+(settings.gravity||0)*42;
   const style=settings.style,sizeMin=settings.sizeMin||7,sizeMax=Math.max(sizeMin,settings.sizeMax||20),size=sizeMin+(i%7)/6*(sizeMax-sizeMin),color=settings.color,originX=settings.originX??50,originY=style==='fountain'?82:settings.originY??50;
   Object.assign(node.style,{position:'absolute',left:originX+'%',top:originY+'%',width:size+'px',height:(['confetti','textConfetti'].includes(style)?size*1.45:size)+'px',background:['halo','ripple','textConfetti'].includes(style)?'transparent':color,border:['halo','ripple'].includes(style)?`2px solid ${color}`:'0',borderRadius:style==='petal'?'80% 0 80% 0':['star','star5','star9','diamond','confetti','textConfetti','lightning','dynamite'].includes(style)?'2px':'50%',color,opacity:'0',margin:`-${size/2}px`,transformOrigin:'center',fontSize:size+'px',fontWeight:'900',lineHeight:'1'});
   if(style==='comet'){node.style.width=size*2+'px';node.style.height=Math.max(3,size*.34)+'px';node.style.background=`linear-gradient(90deg,transparent,${color})`;}
   if(style==='textConfetti'){node.textContent=['A','B','C','1','2','3'][i%6];node.style.width='auto';node.style.height='auto';}
   if(style==='star'||style==='star5')node.style.clipPath='polygon(50% 0,61% 35%,98% 35%,68% 58%,79% 94%,50% 72%,21% 94%,32% 58%,2% 35%,39% 35%)';
   if(style==='star9')node.style.clipPath='polygon(50% 0,58% 31%,82% 11%,69% 38%,100% 41%,70% 54%,92% 78%,63% 65%,50% 100%,42% 69%,18% 89%,31% 62%,0 59%,30% 46%,8% 22%,37% 35%)';
   if(style==='lightning')node.style.clipPath='polygon(55% 0,18% 55%,47% 55%,35% 100%,84% 40%,55% 40%)';
   if(style==='dynamite'){node.style.borderRadius='40%';node.style.boxShadow=`0 0 ${size}px ${color}`;}
   layer.append(node);
   const from=style==='orbit'?`translate(${x*.4}px,${y*.4}px)`:'translate(0,0)';
   const rotation=(settings.rotation||220)*(i%5+1)/5,to=['confetti','textConfetti'].includes(style)?`translate(${x}px,${y+65}px) rotate(${rotation}deg)`:
    style==='fountain'?`translate(${x*.65}px,${-Math.abs(y)-45}px) rotate(${i*29}deg)`:
    style==='ripple'||style==='halo'?`translate(${x*.45}px,${y*.45}px) scale(${2+i%3})`:
    style==='comet'?`translate(${x}px,${y}px) rotate(${angle*180/Math.PI}deg) scaleX(.25)`:
    style==='diamond'?`translate(${x}px,${y}px) rotate(45deg)`:`translate(${x}px,${y}px) rotate(${rotation}deg)`;
   const opacity=settings.opacity??1,orbitMid=style==='orbit'?{opacity,transform:`translate(${Math.cos(angle+1)*spread}px,${Math.sin(angle+1)*spread}px)`,offset:.55}:{opacity,offset:.18};
   animate(node,[{opacity:0,transform:from+' scale(.4)'},orbitMid,{opacity:0,transform:to}],{duration:Math.max(180,particleDuration-(i%3)*35),delay:(settings.delay||0)+(i%(settings.bursts||1))*120+(i%4)*20,easing:'cubic-bezier(.16,.65,.25,1)'});
  }
 }
 const setupMs=performance.now()-start;
 const stop=()=>{
  if(stopped)return;stopped=true;clearTimeout(timer);cancelAnimationFrame(frame);
  animations.forEach(a=>a.cancel());layer.remove();document.removeEventListener('visibilitychange',hidden);
  onMetrics({...frameStats(frames),intervals:frames,presetName:settings.name,particles:motion?0:budget.particles,requested:budget.requested,capped:budget.capped,duration:runDuration,setupMs:Math.round(setupMs*10)/10,reduced:motion,memory:memory(),cancelled:document.hidden});
 };
 const hidden=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hidden);
 const tick=now=>{if(stopped)return;if(last)frames.push(now-last);last=now;frame=requestAnimationFrame(tick);};
 frame=requestAnimationFrame(tick);timer=setTimeout(stop,runDuration+140);
 return stop;
}
