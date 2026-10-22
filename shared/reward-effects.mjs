// Shared by real reward/forge cards and Studio. No scoring or economy changes.
export const CARD_EFFECTS={sparks:'Ciepłe iskry',bubbles:'Perłowe bąbelki',fireflies:'Świetliki',electric:'Elektryczne obrzeże',diamonds:'Tańczące romby',waves:'Fale światła',wind:'Smugi wiatru',aurora:'Kolorowa zorza'};
// These are live border recipes, not card surfaces. The underlying card owns its fill.
export const BORDER_DIRECTIONS={
 filament:{letter:'A',name:'Złota nić',description:'Cienki, ciepły kontur i wędrujące refleksy.',effect:'sparks',colors:['#bc7b25','#fff2bd','#e8b75e'],kind:'silk',settings:{intensity:1.3,glow:16,width:1.4,roughness:.35,speed:.65,density:12}},
 storm:{letter:'B',name:'Żywe wyładowanie',description:'Poszarpana energia, gorący rdzeń i iskry.',effect:'electric',colors:['#d27c29','#fff2cf','#efa456'],kind:'electric',settings:{intensity:1.7,glow:24,width:1.9,roughness:1.25,speed:1,density:22}},
 opal:{letter:'C',name:'Opalowe szkło',description:'Perłowy blask, turkus i róż na podwójnym brzegu.',effect:'bubbles',colors:['#a47acb','#f4ffff','#63becf'],kind:'opal',settings:{intensity:1.6,glow:22,width:1.7,roughness:.5,speed:.5,density:10}},
 stardust:{letter:'D',name:'Gwiezdny pył',description:'Złote komety i drobne świetliki przy krawędzi.',effect:'fireflies',colors:['#a78330','#fff4b4','#4aab9a'],kind:'dust',settings:{intensity:1.5,glow:19,width:1.1,roughness:.55,speed:.7,density:30}},
 prism:{letter:'E',name:'Kryształowa energia',description:'Chłodne fasety i ostre, migoczące załamania.',effect:'diamonds',colors:['#9261cf','#f6eeff','#55bed0'],kind:'prism',settings:{intensity:1.5,glow:18,width:1.5,roughness:.85,speed:.8,density:14}},
 aurora:{letter:'F',name:'Płynna zorza',description:'Trzy pasma koloru płynące wokół jasnej karty.',effect:'aurora',colors:['#aa69c2','#f6ffff','#4bb6b0'],kind:'aurora',settings:{intensity:1.6,glow:26,width:2.2,roughness:.7,speed:.45,density:16}}
};
export const BORDER_TUNING=[['intensity','Siła światła',0,5,.05,'×'],['glow','Zasięg poświaty',0,64,1,' px'],['width','Grubość rdzenia',.4,8,.1,' px'],['roughness','Odkształcenie ramki',0,4,.05,'×'],['speed','Tempo ruchu',.1,4,.05,'×'],['density','Liczba drobinek',0,96,1,''],['spread','Zasięg drobinek',.25,3,.05,'×'],['particleScale','Wielkość drobinek',.3,3,.05,'×']];
export const REWARD_EFFECT_DEFAULTS={enabled:true,intensity:1,speed:1,density:16,glow:18,width:1.7,roughness:1,spread:1,particleScale:1,direction:'classic',progressDuration:1000,stagger:280,blackout:true,levels:['sparks','bubbles','fireflies','electric']};
export function rewardEffectSettings(config={}){return {...REWARD_EFFECT_DEFAULTS,...config.rewardEffects,levels:[...(config.rewardEffects?.levels||REWARD_EFFECT_DEFAULTS.levels)]};}
export function validateRewardEffects(config){const c=rewardEffectSettings({rewardEffects:config});if(typeof c.enabled!=='boolean'||typeof c.blackout!=='boolean'||c.levels.length!==4||c.levels.some(id=>!Object.hasOwn(CARD_EFFECTS,id)))throw Error('Sprawdź efekty poziomów kart.');if(c.direction!=='classic'&&!Object.hasOwn(BORDER_DIRECTIONS,c.direction))throw Error('Sprawdź kierunek ramki.');for(const [k,,min,max]of [...BORDER_TUNING,['progressDuration','',400,2400],['stagger','',250,300]])if(!Number.isFinite(c[k])||c[k]<min||c[k]>max)throw Error('Sprawdź parametr efektu: '+k);if(!Number.isInteger(c.density))throw Error('Liczba drobinek musi być całkowita.');return c;}
export function cardEffectAttributes(level=1,ready=false){return `data-card-level="${Math.max(1,Math.min(4,level))}" data-card-ready="${ready}"`;}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const CLASSIC_COLORS={electric:['#e59b50','#ffddb0','#e59b50'],sparks:['#dba446','#fff4bb','#e8b75e'],bubbles:['#a77fdb','#eafaff','#72c5d4'],fireflies:['#60ad80','#ecffa9','#c5c56c'],diamonds:['#b37ad1','#f5d6ff','#8bbddc'],waves:['#559fc3','#d6f8ff','#9bd7d4'],wind:['#7ea49c','#edfbe3','#b8c6a1'],aurora:['#b27bce','#e4ffff','#7ccbbc']};
function cardSettings(node,config){let local={};try{local=JSON.parse(node.dataset.cardBorderSettings||'{}');}catch{}return validateRewardEffects({...rewardEffectSettings(config),...local});}
function borderProfile(node,settings){return BORDER_DIRECTIONS[settings.direction]||{colors:CLASSIC_COLORS[node.dataset.cardEffect]||CLASSIC_COLORS.sparks,kind:'electric'};}

export function progressCount(target,fraction){return Math.round(target*clamp(fraction,0,1));}
let cssReady;
function styles(){if(cssReady)return cssReady;let link=document.querySelector('link[data-reward-effects]');if(link?.sheet)return cssReady=Promise.resolve(true);cssReady=new Promise(resolve=>{if(!link){link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./reward-effects.css',import.meta.url).href;link.dataset.rewardEffects='1';}link.addEventListener('load',()=>resolve(true),{once:true});link.addEventListener('error',()=>resolve(false),{once:true});if(!link.isConnected)document.head.append(link);});return cssReady;}
function particle(i){const dot=document.createElement('i'),phase=(i*.61803398875%1)*4,edge=Math.floor(phase),f=phase-edge;
 const [x,y,dx,dy]=edge===0?[8+f*84,0,8,-32]:edge===1?[100,8+f*84,30,-12]:edge===2?[92-f*84,100,-9,28]:[0,92-f*84,-30,-14];
 dot.style.cssText=`--i:${i};--x:${x}%;--y:${y}%;--dx:${dx}px;--dy:${dy}px;--delay:${-i*.47}s;--angle:${i*137.5}deg`;return dot;}
export function mountRewardEffects(root,getConfig=()=>({})){
 const styled=styles();const rows=new Map(),progressRows=new Map(),reduce=matchMedia('(prefers-reduced-motion:reduce)');let dead=false,queued=false,energyFrame=0,lastEnergy=0,energyTime=0,geometryFrame=0;const pendingGeometry=new Set();
 const resize=new ResizeObserver(entries=>{for(const {target}of entries)pendingGeometry.add(target);if(!geometryFrame)geometryFrame=requestAnimationFrame(()=>{geometryFrame=0;for(const node of pendingGeometry){const layer=rows.get(node);if(layer&&node.isConnected)geometry(node,layer);}pendingGeometry.clear();});});
 function geometry(node,layer){const w=node.clientWidth,h=node.clientHeight;if(w<1||h<1)return;const r=Math.min(parseFloat(getComputedStyle(node).borderRadius)||24,w/2,h/2),pad=2;
 const path=`M ${r} ${pad} H ${w-r} Q ${w-pad} ${pad} ${w-pad} ${r} V ${h-r} Q ${w-pad} ${h-pad} ${w-r} ${h-pad} H ${r} Q ${pad} ${h-pad} ${pad} ${h-r} V ${r} Q ${pad} ${pad} ${r} ${pad} Z`;
 const svg=layer.querySelector('svg');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);for(const p of svg.querySelectorAll('path')){p.setAttribute('d',path);p.setAttribute('pathLength','1000');}const settings=layer.mnSettings||rewardEffectSettings(getConfig()),padCanvas=Math.ceil(18+settings.glow*.9+settings.roughness*8),area=(w+padCanvas*2)*(h+padCanvas*2),dpr=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1000000/area));
 let canvas=layer.mnEnergy?.canvas;if(!canvas){canvas=document.createElement('canvas');canvas.className='reward-energy-border';layer.append(canvas);}
 canvas.width=Math.ceil((w+padCanvas*2)*dpr);canvas.height=Math.ceil((h+padCanvas*2)*dpr);canvas.style.cssText=`left:-${padCanvas}px;top:-${padCanvas}px;width:${w+padCanvas*2}px;height:${h+padCanvas*2}px`;
 const ctx=canvas.getContext('2d'),curve=svg.querySelector('.reward-border-line'),length=curve.getTotalLength(),count=Math.min(900,Math.ceil(length/2.1)),points=[];
 for(let i=0;i<=count;i++){const s=i/count,a=curve.getPointAtLength(s*length),b=curve.getPointAtLength((s*length+.6)%length),dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;points.push({x:a.x+padCanvas,y:a.y+padCanvas,nx:dy/n,ny:-dx/n,s});}
 layer.mnEnergy={canvas,ctx,points,dpr,width:w+padCanvas*2,height:h+padCanvas*2,pad:padCanvas};wakeEnergy();}
 function wakeEnergy(){if(!dead&&!energyFrame&&!document.hidden&&!reduce.matches){lastEnergy=performance.now();energyFrame=requestAnimationFrame(drawEnergy);}}
 function drawEnergy(now){energyFrame=0;if(dead||document.hidden||reduce.matches)return;const active=[...rows].filter(([n,l])=>l.mnEnergy&&n.isConnected&&n.dataset.effectVisible==='true'&&n.dataset.cardReady==='true'&&n.dataset.cardCharged!=='false'&&n.dataset.effectsEnabled==='true'&&n.dataset.effectPaused!=='true');if(!active.some(([,l])=>l.mnSettings.intensity>0))return;
 if(now-lastEnergy<32){energyFrame=requestAnimationFrame(drawEnergy);return;}energyTime+=Math.min(100,now-lastEnergy)/1000;lastEnergy=now;
 const tau=Math.PI*2;
 for(const [node,layer]of active){const settings=layer.mnSettings;if(settings.intensity<=0)continue;const t=energyTime*settings.speed,{ctx,canvas,points,dpr,width,height}=layer.mnEnergy,{colors,kind}=borderProfile(node,settings),power=settings.intensity,paths=[],positions=[];
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
 const count=kind==='opal'||kind==='aurora'?3:2;
 for(let strand=0;strand<count;strand++){
  const path=new Path2D(),coords=[];
  for(let i=0;i<points.length;i++){const p=points[i],s=p.s,river=.35+.65*Math.sin(tau*(s*3-t*.12))**6;
   const jagged=Math.sin(s*tau*17+t*1.4)*.5+Math.sin(s*tau*53-t*2.1)*.27+Math.sin(s*tau*117+t*3.7)*.15+Math.sin(s*tau*229-t*5.1)*.06+Math.sin(s*tau*367+t*7.3)*.04;
   const smooth=Math.sin(s*tau*7+t*.8+strand*1.8)*2+Math.sin(s*tau*13-t*.6)*.7;
   const offset=(kind==='electric'?jagged*(3+10*river)*(strand?-.42:1):kind==='prism'?jagged*7*(strand?-.6:1):smooth*(strand?1:-.6)+strand*1.5)*settings.roughness;
   const pos={x:p.x+p.nx*offset,y:p.y+p.ny*offset};coords.push(pos);if(i)path.lineTo(pos.x,pos.y);else path.moveTo(pos.x,pos.y);
  }path.closePath();paths.push(path);positions.push(coords);
 }
 const rainbow=ctx.createLinearGradient(width*(.2+.15*Math.sin(t*.25)),0,width,height);
 rainbow.addColorStop(0,colors[0]);rainbow.addColorStop(.35,colors[2]);rainbow.addColorStop(.65,colors[0]);rainbow.addColorStop(1,colors[2]);
 const stroke=(path,color,line,alpha,glow=0)=>{ctx.strokeStyle=color;ctx.lineWidth=line;ctx.globalAlpha=clamp(alpha,0,1);ctx.shadowColor=colors[0];ctx.shadowBlur=glow;ctx.stroke(path);};
 ctx.lineJoin='round';ctx.lineCap='round';
 // A broad transparent light stroke, a coloured filament and a crisp hot core.
 stroke(paths[0],kind==='opal'||kind==='aurora'?rainbow:colors[0],settings.width+power*1.5,.12*power,settings.glow);
 for(let j=paths.length-1;j>=0;j--){stroke(paths[j],j?colors[2]:kind==='aurora'||kind==='opal'?rainbow:colors[0],settings.width*(j?.55:1),power*(j?.35:.7),settings.glow*.35);}
 stroke(paths[0],colors[1],Math.max(.35,settings.width*.32),power*.85);
 const coords=positions[0],n=coords.length-1,comets=kind==='dust'?7:kind==='silk'?3:2;
 for(let c=0;c<comets;c++){
  const head=((t*(kind==='dust'?.026:.018)+c/comets)%1)*n,trail=new Path2D();
  for(let j=0;j<22;j++){const k=(Math.floor(head)-j+n)%n,p=coords[k];if(j)trail.lineTo(p.x,p.y);else trail.moveTo(p.x,p.y);}
  stroke(trail,colors[1],settings.width*(kind==='dust'?.8:1.1),power*.7,settings.glow*.35);
  if(kind==='dust'||kind==='prism'){const p=coords[Math.floor(head)%n],r=(1.3+Math.sin(t+c)**2)*Math.sqrt(power);ctx.fillStyle=colors[1];ctx.shadowColor=colors[0];ctx.shadowBlur=settings.glow*.5;ctx.globalAlpha=Math.min(1,power*.8);ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*1.8,Math.PI/4,0,tau);ctx.fill();}
 }
 ctx.globalAlpha=1;ctx.shadowBlur=0;canvas.mnEnergyPaints=(canvas.mnEnergyPaints||0)+1;
 }

 energyFrame=requestAnimationFrame(drawEnergy);
 }
 const observer=new IntersectionObserver(entries=>{for(const {target,isIntersecting}of entries){target.dataset.effectVisible=String(isIntersecting);if(isIntersecting)startProgress(target);wakeEnergy();}});
 function startProgress(node){const row=progressRows.get(node);if(!row||row.started)return;row.started=true;const settings=rewardEffectSettings(getConfig());let start,last=-1;
  const tick=now=>{if(dead||!node.isConnected)return;const t=reduce.matches?1:clamp((now-(start??=now)-row.delay)/settings.progressDuration,0,1);if(document.hidden){row.frame=requestAnimationFrame(tick);start=undefined;return;}
   const ease=1-(1-t)**3,value=progressCount(row.current,ease);row.bar.value=row.current*ease;
   if(row.count&&value!==last){row.count.textContent=String(value);last=value;if(!reduce.matches){row.bump?.cancel();row.bump=row.count.animate([{transform:'scale(1)'},{transform:'scale(1.13)',offset:.4},{transform:'scale(1)'}],{duration:150,easing:'ease-out'});}}
   if(t<1)row.frame=requestAnimationFrame(tick);else{node.dataset.progressComplete=String(row.current>=row.bar.max);node.dataset.progressSettled='true';if(node.matches('progress'))node.parentElement.dataset.cardCharged='true';row.frame=0;}
  };row.frame=requestAnimationFrame(tick);
 }
 function attach(node){
  if(rows.has(node))return;const settings=cardSettings(node,getConfig());
  node.dataset.cardEffect=node.dataset.cardEffectPreset||settings.levels[Number(node.dataset.cardLevel)-1]||'sparks';const layer=document.createElement('span');layer.className='reward-card-magic';layer.style.visibility='hidden';styled.then(ok=>{if(ok&&!dead&&layer.isConnected)layer.style.removeProperty('visibility');});layer.setAttribute('aria-hidden','true');layer.dataset.mnDecoration='true';layer.mnSettings=settings;
  layer.innerHTML=`<svg class="reward-card-border" aria-hidden="true"><path class="reward-border-halo"/><path class="reward-border-line"/><path class="reward-border-current"/></svg>`;
  for(let i=0;i<settings.density;i++)layer.append(particle(i));
  resize.observe(node);geometry(node,layer);
  node.append(layer);node.dataset.cardCharged=node.querySelector(':scope > progress')?'false':'true';node.dataset.effectsEnabled=String(settings.enabled);applySettings(node,layer,settings);observer.observe(node);rows.set(node,layer);
 }
 function scan(){
  queued=false;if(dead)return;
  for(const [node,layer]of rows)if(!root.contains(node)){observer.unobserve(node);resize.unobserve(node);layer.remove();rows.delete(node);}
  for(const [node,row]of progressRows)if(!root.contains(node)){observer.unobserve(node);cancelAnimationFrame(row.frame);row.bump?.cancel();progressRows.delete(node);}
  root.querySelectorAll('[data-card-level]').forEach(attach);
  root.querySelectorAll('.reward-criteria').forEach(group=>group.querySelectorAll('.reward-criterion').forEach((node,i)=>{
   if(progressRows.has(node))return;const bar=node.querySelector('progress'),count=node.querySelector('[data-progress-count]');if(!bar)return;
   const current=Number(bar.getAttribute('value'));progressRows.set(node,{bar,current,count,delay:i*rewardEffectSettings(getConfig()).stagger,started:false});bar.value=reduce.matches?current:0;if(count&&!reduce.matches)count.textContent='0';observer.observe(node);
  }));
  root.querySelectorAll('[data-card-level] > progress').forEach(bar=>{if(progressRows.has(bar))return;const current=Number(bar.getAttribute('value'));progressRows.set(bar,{bar,current,count:null,delay:0,started:false});bar.value=reduce.matches?current:0;observer.observe(bar);});
 }
 const changes=new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'))wakeEnergy();if(!records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1)))return;if(!queued){queued=true;queueMicrotask(scan);}});changes.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['data-card-ready','data-card-charged','data-effects-enabled']});
 const pause=()=>{root.querySelectorAll('[data-card-level]').forEach(n=>n.dataset.effectPaused=String(document.hidden||reduce.matches));if(document.hidden||reduce.matches){cancelAnimationFrame(energyFrame);energyFrame=0;}else wakeEnergy();};document.addEventListener('visibilitychange',pause);reduce.addEventListener('change',pause);
 function applySettings(node,layer,settings){
  layer.mnSettings=settings;const profile=borderProfile(node,settings);node.dataset.cardBorderDirection=settings.direction;
  for(const [name,value]of Object.entries({'--reward-intensity':settings.intensity,'--reward-duration':6/settings.speed+'s','--reward-glow':settings.glow+'px','--reward-width':settings.width+'px','--reward-spread':settings.spread,'--reward-particle-scale':settings.particleScale,'--rim':profile.colors[0],'--rim-light':profile.colors[1]}))layer.style.setProperty(name,value);
 }
 function refresh(){for(const [node,layer]of rows){const settings=cardSettings(node,getConfig()),previous=layer.mnSettings;node.dataset.cardEffect=node.dataset.cardEffectPreset||settings.levels[Number(node.dataset.cardLevel)-1]||'sparks';node.dataset.effectsEnabled=String(settings.enabled);applySettings(node,layer,settings);while(layer.querySelectorAll('i').length>settings.density)layer.querySelector('i:last-of-type').remove();for(let i=layer.querySelectorAll('i').length;i<settings.density;i++)layer.append(particle(i));if(previous.glow!==settings.glow||previous.roughness!==settings.roughness)geometry(node,layer);if(settings.intensity===0)layer.mnEnergy?.ctx.clearRect(0,0,layer.mnEnergy.width,layer.mnEnergy.height);}wakeEnergy();}


 scan();pause();const dispose=()=>{dead=true;cancelAnimationFrame(energyFrame);cancelAnimationFrame(geometryFrame);pendingGeometry.clear();changes.disconnect();observer.disconnect();resize.disconnect();document.removeEventListener('visibilitychange',pause);reduce.removeEventListener('change',pause);for(const [node,layer]of rows){layer.remove();delete node.dataset.cardEffect;}for(const row of progressRows.values()){cancelAnimationFrame(row.frame);row.bump?.cancel();}rows.clear();progressRows.clear();};dispose.refresh=refresh;return dispose;
}

// One authored lift → charge/upgrade → settle. No pointer tracking or idle loop.
export async function holographicUpgrade(card,upgrade){
 if(!card||matchMedia('(prefers-reduced-motion:reduce)').matches)return upgrade();
 await styles();
 const layer=document.createElement('span');layer.className='reward-hologram';layer.dataset.mnDecoration='true';layer.setAttribute('aria-hidden','true');
 layer.innerHTML='<i class="hologram-spectrum"></i><i class="hologram-glare"></i><b class="hologram-charge"></b>';
 card.append(layer);card.classList.add('is-holographic-upgrade');const animations=[];
 const pose=(y,x,z,scale=1)=>`perspective(1100px) translateY(${y}px) rotateX(${x}deg) rotateY(${z}deg) scale(${scale})`;
 const play=(node,frames,options)=>{const animation=node.animate(frames,options);animations.push(animation);return animation.finished.catch(()=>{});};
 try{
  card.dataset.hologramPhase='lifting';
  void play(layer,[{opacity:0},{opacity:.85}],{duration:450,fill:'forwards'});
  void play(layer.querySelector('.hologram-spectrum'),[{transform:'translateX(-35%) rotate(-20deg)'},{transform:'translateX(35%) rotate(15deg)'}],{duration:2700,easing:'ease-in-out',fill:'forwards'});
  void play(layer.querySelector('.hologram-glare'),[{transform:'translateX(-110%)'},{transform:'translateX(110%)'}],{duration:2200,easing:'ease-in-out',fill:'forwards'});
  await play(card,[{transform:pose(0,0,0)},{transform:pose(-12,5,-7,1.025)}],{duration:480,easing:'cubic-bezier(.2,.7,.25,1)',fill:'forwards'});
  if(!card.isConnected)return;
  card.dataset.hologramPhase='charging';
  void play(layer.querySelector('.hologram-charge'),[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:900,easing:'cubic-bezier(.2,.65,.3,1)',fill:'forwards'});
  const sway=play(card,[{transform:pose(-12,5,-7,1.025)},{transform:pose(-16,-4,7,1.035)},{transform:pose(-12,3,-3,1.025)}],{duration:1150,easing:'ease-in-out',fill:'forwards'});
  await Promise.all([sway,upgrade()]);
  if(!card.isConnected)return;
  card.dataset.hologramPhase='returning';
  const current=getComputedStyle(card).transform;
  void play(layer,[{opacity:.85},{opacity:0}],{duration:650,easing:'ease-out',fill:'forwards'});
  await play(card,[{transform:current},{transform:pose(0,0,0)}],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'});
 }finally{for(const animation of animations)animation.cancel();layer.remove();card.classList.remove('is-holographic-upgrade');delete card.dataset.hologramPhase;}
}

// A finite blackout only inside the upgrade illustration, with staggered beams.
export async function upgradeLight(stage,settings=REWARD_EFFECT_DEFAULTS){
 if(!settings.blackout||matchMedia('(prefers-reduced-motion:reduce)').matches)return ()=>{};
 const layer=document.createElement('div');layer.className='reward-upgrade-light';layer.setAttribute('aria-hidden','true');
 for(let i=0;i<5;i++){const beam=document.createElement('i');beam.className='upgrade-beam';beam.style.setProperty('--beam',i);layer.append(beam);}for(let i=0;i<32;i++){const grain=document.createElement('b');grain.className='upgrade-dust';grain.style.cssText=`--dust-size:${2+i%3}px;--x:${8+(i*37)%86}%;--y:${10+(i*53)%82}%;--delay:${i%8*.055}s;--dx:${(i%5-2)*9}px`;layer.append(grain);}
 stage.prepend(layer);stage.classList.add('is-upgrading');
 const animation=layer.animate([{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.7},{opacity:0}],{duration:1600,fill:'both',easing:'ease-in-out'});
 await new Promise(r=>setTimeout(r,320));return async()=>{await animation.finished.catch(()=>{});layer.remove();stage.classList.remove('is-upgrading');};
}
