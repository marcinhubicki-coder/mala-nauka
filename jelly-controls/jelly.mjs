const root=document.querySelector('#jelly-lab');
const slider=document.querySelector('#jelly-range');
const sliderLabel=document.querySelector('.slider-card label');
const sliderOutput=document.querySelector('.slider-card output');
const tabsHost=document.querySelector('.param-tabs');
const valuesHost=document.querySelector('.param-values');
const categoryTitle=document.querySelector('.category-title');
const categoryDialog=document.querySelector('.category-dialog');
const categoryCards=[...document.querySelectorAll('.category-card')];

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const x2=v=>Number(v).toFixed(2)+'×';
const px=v=>Number(v).toFixed(1)+'px';
const pct=v=>Math.round(Number(v))+'%';
const deg=v=>(Number(v)>=0?'+':'')+Number(v).toFixed(1)+'°';
const ms=v=>Math.round(Number(v))+'ms';

const CATEGORIES={
  motion:{
    title:'Ruch',
    params:[
      {key:'duration',short:'C',label:'Czas',min:.35,max:2.2,step:.05,base:.90,format:x2},
      {key:'stretch',short:'R',label:'Rozciągnięcie',min:0,max:2.6,step:.05,base:1.45,format:x2},
      {key:'recoil',short:'P',label:'Powrót',min:0,max:2.5,step:.05,base:.55,format:x2},
      {key:'bounce',short:'D',label:'Dobicie',min:0,max:3.5,step:.05,base:.75,format:x2},
      {key:'inertia',short:'B',label:'Bezwładność',min:.35,max:2.4,step:.05,base:2.40,format:x2},
      {key:'drag',short:'M',label:'Magnes',min:.25,max:1.8,step:.05,base:1.80,format:x2},
    ]
  },
  shape:{
    title:'Kształt',
    params:[
      {key:'radius',short:'R',label:'Promień',min:6,max:28,step:1,base:18,format:px},
      {key:'inset',short:'I',label:'Margines',min:1,max:9,step:.5,base:4,format:px},
      {key:'squish',short:'S',label:'Ścisk',min:0,max:24,step:1,base:15,format:pct},
      {key:'tilt',short:'O',label:'Przechył',min:-8,max:8,step:.1,base:1.3,format:deg},
      {key:'border',short:'K',label:'Krawędź',min:.25,max:3,step:.05,base:1,format:px},
      {key:'depth',short:'G',label:'Głębia',min:.25,max:2.5,step:.05,base:1,format:x2},
    ]
  },
  light:{
    title:'Światło',
    params:[
      {key:'shadow',short:'C',label:'Cień',min:0,max:2.5,step:.05,base:1.25,format:x2},
      {key:'glow',short:'P',label:'Poświata',min:0,max:2.5,step:.05,base:.65,format:x2},
      {key:'shine',short:'B',label:'Blask',min:0,max:2.5,step:.05,base:1.50,format:x2},
      {key:'blur',short:'L',label:'Blur',min:0,max:3,step:.1,base:0,format:px},
      {key:'saturation',short:'S',label:'Nasycenie',min:.4,max:1.8,step:.05,base:1,format:x2},
      {key:'contrast',short:'K',label:'Kontrast',min:.7,max:1.5,step:.05,base:1,format:x2},
    ]
  },
  text:{
    title:'Tekst',
    params:[
      {key:'delay',short:'O',label:'Opóźnienie koloru',min:0,max:650,step:10,base:440,format:ms},
      {key:'duration',short:'C',label:'Czas koloru',min:80,max:800,step:10,base:430,format:ms},
      {key:'bump',short:'B',label:'Bump tekstu',min:0,max:2.5,step:.05,base:1,format:x2},
      {key:'glow',short:'P',label:'Poświata tekstu',min:0,max:2.5,step:.05,base:.65,format:x2},
      {key:'fade',short:'W',label:'Wygaszenie',min:0,max:2,step:.05,base:1.10,format:x2},
      {key:'blur',short:'L',label:'Blur tekstu',min:0,max:3,step:.1,base:0,format:px},
    ]
  }
};

const defaults={
  motion:{duration:.90,stretch:1.45,recoil:.55,bounce:.75,inertia:2.40,drag:1.80},
  shape:{radius:18,inset:4,squish:15,tilt:1.3,border:1,depth:1},
  light:{shadow:1,glow:.65,shine:1.50,blur:0,saturation:1,contrast:1},
  text:{delay:440,duration:430,bump:1.25,glow:.65,fade:1.10,blur:0},
};
let state=structuredClone(defaults);
let activeCategory='motion';
let activeParam='duration';

const segmentAnimations=new WeakMap();
const textAnimations=new WeakMap();
const dragStates=new WeakMap();
const suppressedClicks=new WeakMap();
let demoTimer=0;

function cfg(){return CATEGORIES[activeCategory]}
function param(){return cfg().params.find(p=>p.key===activeParam)||cfg().params[0]}
function current(){return state[activeCategory][activeParam]}

function applyVars(){
  const s=state.shape,l=state.light;
  document.documentElement.style.setProperty('--indicator-radius',s.radius+'px');
  document.documentElement.style.setProperty('--indicator-inset',s.inset+'px');
  document.documentElement.style.setProperty('--indicator-border',s.border+'px');
  document.documentElement.style.setProperty('--indicator-depth',s.depth);
  document.documentElement.style.setProperty('--indicator-glow',l.glow);
  document.documentElement.style.setProperty('--indicator-shine',l.shine);
  document.documentElement.style.setProperty('--indicator-blur',l.blur+'px');
  document.documentElement.style.setProperty('--indicator-saturation',l.saturation);
  document.documentElement.style.setProperty('--indicator-contrast',l.contrast);
  document.documentElement.style.setProperty('--shadow-alpha',(0.10*l.shadow).toFixed(3));
  document.documentElement.style.setProperty('--shadow-y',(4*l.shadow)+'px');
  document.documentElement.style.setProperty('--shadow-blur',(12*l.shadow)+'px');
}

function choices(container){return [...container.querySelectorAll('.jelly-choice')]}
function geometry(container,index){
  const list=choices(container),target=list[index]; if(!target)return null;
  const cr=container.getBoundingClientRect(),tr=target.getBoundingClientRect(),inset=state.shape.inset;
  const left=Math.max(inset,tr.left-cr.left+inset);
  const right=Math.max(inset,cr.right-tr.right+inset);
  const width=Math.max(0,cr.width-left-right);
  return {left,right,width,center:left+width/2};
}
function indicatorGeometry(container,node){
  const cr=container.getBoundingClientRect(),r=node.getBoundingClientRect();
  const left=Math.max(0,r.left-cr.left),right=Math.max(0,cr.right-r.right),width=Math.max(0,cr.width-left-right);
  return {left,right,width,center:left+width/2};
}
function timing(currentGeom,target){
  const distance=Math.abs(target.center-currentGeom.center);
  const base=clamp(Math.round(860+distance*.72),860,1280);
  return {
    total:Math.round(base*1.23*state.motion.duration),
    overshoot:clamp(distance*.065,5,16)*state.motion.stretch,
  };
}
function transformAt(amount,dir=1){
  const squish=state.shape.squish/100;
  const tilt=state.shape.tilt*dir;
  const sx=1+amount*squish*.45;
  const sy=1-amount*squish;
  return `scale(${sx.toFixed(4)},${sy.toFixed(4)}) rotate(${(tilt*amount).toFixed(2)}deg)`;
}
function jellyFrames(currentGeom,target,forward,t){
  const dir=forward?1:-1;
  const inertia=state.motion.inertia;
  const back=Math.max(0,t.overshoot*.34*state.motion.recoil);
  const bounce=Math.max(0,t.overshoot*.10*state.motion.bounce);
  const early=clamp(.58/inertia,.18,.88);
  const mid=clamp(.93/Math.sqrt(inertia),.55,.995);
  const overshoot=t.overshoot;
  if(forward){
    return [
      {offset:0,left:currentGeom.left+'px',right:currentGeom.right+'px',transform:transformAt(0,dir),easing:'cubic-bezier(.30,.04,.22,1)'},
      {offset:.13,left:currentGeom.left+'px',right:lerp(currentGeom.right,target.right,early)+'px',transform:transformAt(.35,dir),easing:'cubic-bezier(.18,.78,.22,1)'},
      {offset:.31,left:lerp(currentGeom.left,target.left,.26)+'px',right:lerp(currentGeom.right,target.right,mid)+'px',transform:transformAt(.7,dir),easing:'cubic-bezier(.16,.84,.20,1)'},
      {offset:.44,left:(target.left+overshoot)+'px',right:lerp(currentGeom.right,target.right,.992)+'px',transform:transformAt(1,dir),easing:'cubic-bezier(.14,.80,.18,1)'},
      {offset:.69,left:(target.left-back)+'px',right:target.right+'px',transform:transformAt(.38,-dir),easing:'cubic-bezier(.16,.76,.18,1)'},
      {offset:.86,left:(target.left+bounce)+'px',right:target.right+'px',transform:transformAt(.16,dir),easing:'cubic-bezier(.12,.70,.16,1)'},
      {offset:1,left:target.left+'px',right:target.right+'px',transform:'scale(1) rotate(0deg)'}
    ];
  }
  return [
    {offset:0,left:currentGeom.left+'px',right:currentGeom.right+'px',transform:transformAt(0,dir),easing:'cubic-bezier(.30,.04,.22,1)'},
    {offset:.13,left:lerp(currentGeom.left,target.left,early)+'px',right:currentGeom.right+'px',transform:transformAt(.35,dir),easing:'cubic-bezier(.18,.78,.22,1)'},
    {offset:.31,left:lerp(currentGeom.left,target.left,mid)+'px',right:lerp(currentGeom.right,target.right,.26)+'px',transform:transformAt(.7,dir),easing:'cubic-bezier(.16,.84,.20,1)'},
    {offset:.44,left:lerp(currentGeom.left,target.left,.992)+'px',right:(target.right+overshoot)+'px',transform:transformAt(1,dir),easing:'cubic-bezier(.14,.80,.18,1)'},
    {offset:.69,left:target.left+'px',right:(target.right-back)+'px',transform:transformAt(.38,-dir),easing:'cubic-bezier(.16,.76,.18,1)'},
    {offset:.86,left:target.left+'px',right:(target.right+bounce)+'px',transform:transformAt(.16,dir),easing:'cubic-bezier(.12,.70,.16,1)'},
    {offset:1,left:target.left+'px',right:target.right+'px',transform:'scale(1) rotate(0deg)'}
  ];
}

function stopSegmentAnimation(container,node){
  const animation=segmentAnimations.get(container);
  if(!animation)return indicatorGeometry(container,node);
  const visual=indicatorGeometry(container,node);
  try{animation.cancel()}catch{}
  segmentAnimations.delete(container);
  node.style.left=visual.left+'px';node.style.right=visual.right+'px';node.style.transform='';
  container.classList.remove('is-moving');
  return visual;
}
function cancelText(button){
  const list=textAnimations.get(button)||[];
  list.forEach(a=>{try{a.cancel()}catch{}});
  textAnimations.delete(button);
}
function animateTextPair(container,fromIndex,toIndex,instant=false){
  const list=choices(container);
  const from=list[fromIndex],to=list[toIndex];
  if(!to)return;
  if(from===to){
    list.forEach((button,index)=>button.classList.toggle('is-selected',index===toIndex));
    return;
  }
  [from,to].filter(Boolean).forEach(cancelText);
  list.forEach((button,index)=>button.classList.toggle('is-selected',index===toIndex));
  if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches)return;

  const t=state.text;
  const inactive='#71839a',active='#a93d60';
  const glow=`0 0 ${(3.5*t.glow).toFixed(1)}px rgba(255,255,255,.92),0 0 ${(9*t.glow).toFixed(1)}px rgba(196,95,135,.22)`;
  const blur=Math.max(0,t.blur);
  const fadeDip=clamp(1-.18*t.fade,.58,1);
  const bump=1+.075*t.bump;

  if(from){
    const a=from.animate([
      {color:active,opacity:1,filter:'blur(0px)',transform:'scale(1)',textShadow:glow},
      {color:'#936f82',opacity:fadeDip,filter:`blur(${blur}px)`,transform:'scale(.985)',offset:.45},
      {color:inactive,opacity:1,filter:'blur(0px)',transform:'scale(1)',textShadow:'none'}
    ],{duration:Math.max(80,t.duration),easing:'cubic-bezier(.2,.65,.25,1)',fill:'both'});
    textAnimations.set(from,[a]);
    a.finished.catch(()=>{}).then(()=>{if(textAnimations.get(from)?.includes(a)){try{a.cancel()}catch{};textAnimations.delete(from)}});
  }
  const a=to.animate([
    {color:inactive,opacity:fadeDip,filter:`blur(${blur}px)`,transform:'scale(.985)',textShadow:'none'},
    {color:'#bb5774',opacity:1,filter:'blur(0px)',transform:`scale(${bump.toFixed(4)})`,textShadow:glow,offset:.55},
    {color:active,opacity:1,filter:'blur(0px)',transform:'scale(1)',textShadow:glow}
  ],{delay:Math.max(0,t.delay),duration:Math.max(80,t.duration),easing:'cubic-bezier(.18,.78,.22,1)',fill:'both'});
  textAnimations.set(to,[a]);
  a.finished.catch(()=>{}).then(()=>{if(textAnimations.get(to)?.includes(a)){try{a.cancel()}catch{};textAnimations.delete(to)}});
}
function setPreviewIndex(container,index,animate=true){
  const list=choices(container),next=clamp(index,0,list.length-1);
  const prev=Number(container.dataset.previewIndex ?? container.dataset.activeIndex ?? 0);
  if(prev===next)return;
  container.dataset.previewIndex=String(next);
  animateTextPair(container,prev,next,!animate);
}
function commitIndex(container,index,animate=true){
  const list=choices(container),next=clamp(index,0,list.length-1);
  const preview=Number(container.dataset.previewIndex ?? container.dataset.activeIndex ?? 0);
  if(preview!==next)animateTextPair(container,preview,next,!animate);
  else list.forEach((button,i)=>button.classList.toggle('is-selected',i===next));
  container.dataset.previewIndex=String(next);
  container.dataset.activeIndex=String(next);
}
function moveSegment(container,index,animate=true){
  const node=container.querySelector('.jelly-indicator'),list=choices(container);
  if(!node||!list.length)return;
  const previous=Number(container.dataset.activeIndex||0);
  const next=clamp(index,0,list.length-1);
  const target=geometry(container,next);if(!target)return;
  const currentGeom=stopSegmentAnimation(container,node);
  commitIndex(container,next,animate);

  if(!animate||Math.abs(previous-next)<.001||matchMedia('(prefers-reduced-motion: reduce)').matches){
    node.style.left=target.left+'px';node.style.right=target.right+'px';node.style.transform='';
    return;
  }
  const t=timing(currentGeom,target);
  container.style.setProperty('--move-ms',t.total+'ms');
  container.classList.add('is-moving');
  const a=node.animate(jellyFrames(currentGeom,target,next>previous,t),{duration:t.total,easing:'linear',fill:'both'});
  segmentAnimations.set(container,a);
  node.style.left=target.left+'px';node.style.right=target.right+'px';
  a.finished.catch(()=>{}).then(()=>{
    if(segmentAnimations.get(container)===a){
      segmentAnimations.delete(container);try{a.cancel()}catch{}
      container.classList.remove('is-moving');node.style.transform='';
    }
  });
}
function fractionalGeometry(container,progress){
  const list=choices(container);
  const low=clamp(Math.floor(progress),0,list.length-1);
  const high=clamp(Math.ceil(progress),0,list.length-1);
  const mix=progress-low;
  const a=geometry(container,low),b=geometry(container,high);
  if(!a||!b)return null;
  return {
    left:lerp(a.left,b.left,mix),
    right:lerp(a.right,b.right,mix),
    center:lerp(a.center,b.center,mix),
  };
}
function directionalCandidate(progress,direction,count){
  if(direction>0)return clamp(Math.floor(progress+.48),0,count-1);
  if(direction<0)return clamp(Math.ceil(progress-.48),0,count-1);
  return clamp(Math.round(progress),0,count-1);
}
function magnetize(progress,direction,count){
  const candidate=directionalCandidate(progress,direction,count);
  const delta=candidate-progress;
  const dist=Math.abs(delta);
  if(dist>.58)return progress;
  const proximity=1-dist/.58;
  const strength=clamp(.10*state.motion.drag*proximity*proximity,0,.42);
  return clamp(progress+delta*strength,0,count-1);
}

function initSegment(container){
  const buffer=container.closest('.jelly-gesture-buffer')||container;
  container.dataset.activeIndex='0';
  container.dataset.previewIndex='0';
  requestAnimationFrame(()=>moveSegment(container,0,false));

  choices(container).forEach((button,index)=>{
    button.addEventListener('click',event=>{
      if(performance.now()<(suppressedClicks.get(container)||0)){event.preventDefault();return}
      moveSegment(container,index,true);
    });
  });

  buffer.addEventListener('pointerdown',event=>{
    if(event.button!==undefined&&event.button!==0)return;
    const node=container.querySelector('.jelly-indicator');if(!node)return;
    const list=choices(container);
    const active=Number(container.dataset.activeIndex||0);
    const activeGeom=geometry(container,active);if(!activeGeom)return;
    const button=event.target.closest('.jelly-choice');
    const tapIndex=button?list.indexOf(button):active;
    const now=performance.now();
    stopSegmentAnimation(container,node);
    dragStates.set(container,{
      pointerId:event.pointerId,
      startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,
      startTime:now,lastTime:now,activeIndex:active,tapIndex,
      activeCenter:activeGeom.center,dragging:false,progress:active,direction:0
    });
    buffer.classList.add('is-grabbed');
    try{buffer.setPointerCapture(event.pointerId)}catch{}
  });

  buffer.addEventListener('pointermove',event=>{
    const d=dragStates.get(container);if(!d||d.pointerId!==event.pointerId)return;
    const dx=event.clientX-d.startX,dy=event.clientY-d.startY;
    const elapsed=performance.now()-d.startTime;
    if(!d.dragging){
      // Large vertical drift is tolerated; once there is meaningful horizontal intent,
      // the control owns the gesture until pointerup.
      if(Math.abs(dx)>5 || (elapsed>115 && Math.abs(dx)>2)){
        d.dragging=true;
        suppressedClicks.set(container,performance.now()+500);
      }else{
        d.lastX=event.clientX;d.lastY=event.clientY;d.lastTime=performance.now();
        return;
      }
    }
    event.preventDefault();

    const list=choices(container),count=list.length;
    const g0=geometry(container,0),g1=geometry(container,1)||g0;
    const slot=Math.max(1,Math.abs((g1?.center||1)-(g0?.center||0)));
    const raw=clamp(d.activeIndex+(dx/slot),0,count-1);
    d.direction=Math.sign(raw-d.progress)||d.direction||Math.sign(dx);
    d.progress=raw;
    const visual=magnetize(raw,d.direction,count);
    const g=fractionalGeometry(container,visual);
    const node=container.querySelector('.jelly-indicator');
    if(g&&node){
      node.style.left=g.left+'px';node.style.right=g.right+'px';
      const distanceFromCenter=Math.min(1,Math.abs(visual-Math.round(visual))*2);
      node.style.transform=transformAt(distanceFromCenter,d.direction||1);
    }

    const candidate=directionalCandidate(raw,d.direction,count);
    setPreviewIndex(container,candidate,true);
    d.lastX=event.clientX;d.lastY=event.clientY;d.lastTime=performance.now();
  });

  const finish=(event,cancelled=false)=>{
    const d=dragStates.get(container);if(!d||d.pointerId!==event.pointerId)return;
    dragStates.delete(container);
    buffer.classList.remove('is-grabbed');
    try{buffer.releasePointerCapture(event.pointerId)}catch{}

    if(cancelled){
      suppressedClicks.set(container,performance.now()+350);
      moveSegment(container,d.activeIndex,true);
      return;
    }

    if(!d.dragging){
      suppressedClicks.set(container,performance.now()+350);
      // A tap targets the touched option directly. Pointer-down itself never moves the jelly.
      moveSegment(container,d.tapIndex>=0?d.tapIndex:d.activeIndex,true);
      return;
    }

    suppressedClicks.set(container,performance.now()+500);
    const count=choices(container).length;
    const finalIndex=directionalCandidate(d.progress,d.direction,count);
    // No velocity fling: release before the directional half-way threshold returns naturally.
    moveSegment(container,finalIndex,true);
  };
  buffer.addEventListener('pointerup',event=>finish(event,false));
  buffer.addEventListener('pointercancel',event=>finish(event,true));
}
document.querySelectorAll('[data-jelly-segmented]').forEach(initSegment);

function pulseSingle(){
  const el=document.querySelector('.single-jelly');
  const squish=state.shape.squish/100;
  el.animate([
    {transform:'scale(1,1)',filter:'brightness(1)'},
    {transform:`scale(.975,${(.975+squish*.12).toFixed(4)})`,filter:'brightness(1.03)',offset:.2},
    {transform:`scale(${(1.065+squish*.10).toFixed(4)},.985)`,filter:'brightness(1.08)',offset:.52},
    {transform:'scale(.992,1.012)',filter:'brightness(1.02)',offset:.76},
    {transform:'scale(1,1)',filter:'brightness(1)'}
  ],{duration:Math.round(460*state.motion.duration),easing:'cubic-bezier(.18,.78,.22,1)'});
}
document.querySelector('.single-jelly').addEventListener('click',pulseSingle);

const toggle=document.querySelector('.jelly-toggle'),knob=toggle.querySelector('.toggle-knob');
function toggleSwitch(force){
  const on=typeof force==='boolean'?force:toggle.getAttribute('aria-checked')!=='true';
  toggle.setAttribute('aria-checked',String(on));
  const track=toggle.getBoundingClientRect(),kr=knob.getBoundingClientRect();
  const distance=Math.max(0,track.width-kr.width-10);
  const x=on?distance:0,dir=on?1:-1;
  knob.animate([
    {transform:`translateX(${on?0:distance}px) scaleX(1)`},
    {transform:`translateX(${x-dir*distance*.08}px) scaleX(1.18)`,offset:.38},
    {transform:`translateX(${x+dir*distance*.04}px) scaleX(.955)`,offset:.72},
    {transform:`translateX(${x}px) scaleX(1)`}
  ],{duration:Math.round(520*state.motion.duration),easing:'cubic-bezier(.18,.78,.22,1)',fill:'forwards'});
}
toggle.addEventListener('click',()=>toggleSwitch());

function renderPanel(){
  const c=cfg();
  if(!c.params.some(p=>p.key===activeParam))activeParam=c.params[0].key;
  categoryTitle.textContent=c.title;
  tabsHost.innerHTML=c.params.map(p=>`<button type="button" class="param-tab ${p.key===activeParam?'is-active':''}" data-param="${p.key}">${p.short}</button>`).join('');
  valuesHost.innerHTML=c.params.map(p=>{
    const v=state[activeCategory][p.key],cls=v<p.base-1e-6?'is-less':v>p.base+1e-6?'is-more':'';
    return `<span class="${cls}"><b>${p.short}</b><em>${p.format(v)}</em></span>`;
  }).join('');
  tabsHost.querySelectorAll('.param-tab').forEach(b=>b.addEventListener('click',()=>{activeParam=b.dataset.param;renderPanel()}));
  const p=param();slider.min=p.min;slider.max=p.max;slider.step=p.step;slider.value=current();
  sliderLabel.textContent=p.label;sliderOutput.textContent=p.format(current());
  updateDialog();
}
function updateDialog(){
  categoryCards.forEach(card=>{
    const key=card.dataset.category,c=CATEGORIES[key];
    card.classList.toggle('is-active',key===activeCategory);
    card.querySelector('[data-summary="'+key+'"]').textContent=c.params.map(p=>p.short+' '+p.format(state[key][p.key])).join(' · ');
  });
}
function scheduleDemo(){
  clearTimeout(demoTimer);
  demoTimer=setTimeout(()=>{
    const demo=document.querySelector('.cols-2');
    const next=Number(demo.dataset.activeIndex||0)===0?1:0;
    moveSegment(demo,next,true);
    pulseSingle();
  },150);
}
slider.addEventListener('input',()=>{
  const p=param();
  state[activeCategory][p.key]=Number(slider.value);
  sliderOutput.textContent=p.format(state[activeCategory][p.key]);
  applyVars();renderPanel();scheduleDemo();
});

function openDialog(){updateDialog();categoryDialog.showModal()}
document.querySelector('.category-button').addEventListener('click',openDialog);
document.querySelector('.category-pill').addEventListener('click',openDialog);
document.querySelector('.dialog-close').addEventListener('click',()=>categoryDialog.close());
categoryDialog.addEventListener('click',e=>{if(e.target===categoryDialog)categoryDialog.close()});
categoryCards.forEach(card=>card.addEventListener('click',()=>{
  activeCategory=card.dataset.category;
  activeParam=CATEGORIES[activeCategory].params[0].key;
  categoryDialog.close();renderPanel();
}));

document.querySelector('.reset-button').addEventListener('click',()=>{
  state=structuredClone(defaults);activeCategory='motion';activeParam='duration';
  applyVars();renderPanel();
  document.querySelectorAll('[data-jelly-segmented]').forEach(c=>moveSegment(c,0,false));
  toggleSwitch(false);pulseSingle();
});
window.addEventListener('resize',()=>requestAnimationFrame(()=>{
  document.querySelectorAll('[data-jelly-segmented]').forEach(c=>moveSegment(c,Number(c.dataset.activeIndex||0),false));
}),{passive:true});

applyVars();renderPanel();
requestAnimationFrame(()=>document.querySelectorAll('[data-jelly-segmented]').forEach(c=>moveSegment(c,0,false)));
