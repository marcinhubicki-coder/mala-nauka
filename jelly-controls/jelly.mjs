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
const x1=v=>Number(v).toFixed(1)+'×';
const px=v=>Number(v).toFixed(1)+'px';
const pct=v=>Math.round(Number(v))+'%';
const deg=v=>(Number(v)>=0?'+':'')+Number(v).toFixed(1)+'°';

const CATEGORIES={
  motion:{
    title:'Ruch',
    params:[
      {key:'duration',short:'C',label:'Czas',min:.35,max:2.2,step:.05,base:1,format:x2},
      {key:'stretch',short:'R',label:'Rozciągnięcie',min:0,max:2.6,step:.05,base:1,format:x2},
      {key:'recoil',short:'P',label:'Powrót',min:0,max:2.5,step:.05,base:1,format:x2},
      {key:'bounce',short:'D',label:'Dobicie',min:0,max:3.5,step:.05,base:1,format:x2},
      {key:'inertia',short:'B',label:'Bezwładność',min:.35,max:2.4,step:.05,base:1,format:x2},
      {key:'drag',short:'M',label:'Magnes',min:.25,max:1.8,step:.05,base:1,format:x2},
    ]
  },
  shape:{
    title:'Kształt',
    params:[
      {key:'radius',short:'R',label:'Promień',min:6,max:28,step:1,base:14,format:px},
      {key:'inset',short:'I',label:'Margines',min:1,max:9,step:.5,base:4,format:px},
      {key:'squish',short:'S',label:'Ścisk',min:0,max:24,step:1,base:0,format:pct},
      {key:'tilt',short:'O',label:'Przechył',min:-8,max:8,step:.25,base:0,format:deg},
      {key:'border',short:'K',label:'Krawędź',min:.25,max:3,step:.05,base:1,format:px},
      {key:'depth',short:'G',label:'Głębia',min:.25,max:2.5,step:.05,base:1,format:x2},
    ]
  },
  light:{
    title:'Światło',
    params:[
      {key:'shadow',short:'C',label:'Cień',min:0,max:2.5,step:.05,base:1,format:x2},
      {key:'glow',short:'P',label:'Poświata',min:0,max:2.5,step:.05,base:1,format:x2},
      {key:'shine',short:'B',label:'Blask',min:0,max:2.5,step:.05,base:1,format:x2},
      {key:'blur',short:'L',label:'Blur',min:0,max:3,step:.1,base:0,format:px},
      {key:'saturation',short:'S',label:'Nasycenie',min:.4,max:1.8,step:.05,base:1,format:x2},
      {key:'contrast',short:'K',label:'Kontrast',min:.7,max:1.5,step:.05,base:1,format:x2},
    ]
  },
  touch:{
    title:'Dotyk',
    params:[
      {key:'tap',short:'T',label:'Tap bump',min:0,max:2.5,step:.05,base:1,format:x2},
      {key:'label',short:'L',label:'Tekst',min:0,max:2.5,step:.05,base:1,format:x2},
      {key:'press',short:'P',label:'Wciśnięcie',min:0,max:2.5,step:.05,base:1,format:x2},
      {key:'toggle',short:'G',label:'Toggle',min:0,max:3,step:.05,base:1,format:x2},
      {key:'release',short:'O',label:'Odbicie',min:0,max:3,step:.05,base:1,format:x2},
      {key:'velocity',short:'V',label:'Prędkość gestu',min:.3,max:2,step:.05,base:1,format:x2},
    ]
  }
};

const defaults={
  motion:{duration:1,stretch:1,recoil:1,bounce:1,inertia:1,drag:1},
  shape:{radius:14,inset:4,squish:0,tilt:0,border:1,depth:1},
  light:{shadow:1,glow:1,shine:1,blur:0,saturation:1,contrast:1},
  touch:{tap:1,label:1,press:1,toggle:1,release:1,velocity:1},
};
let state=structuredClone(defaults);
let activeCategory='motion';
let activeParam='duration';
const segmentAnimations=new WeakMap();
const dragState=new WeakMap();
let demoTimer=0;

function cfg(){return CATEGORIES[activeCategory]}
function param(){return cfg().params.find(p=>p.key===activeParam)||cfg().params[0]}
function current(){return state[activeCategory][activeParam]}

function applyVars(){
  const s=state.shape,l=state.light,t=state.touch;
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
  document.documentElement.style.setProperty('--press-scale',(1-.03*t.press).toFixed(4));
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
function timing(current,target){
  const distance=Math.abs(target.center-current.center);
  const base=clamp(Math.round(860+distance*.72),860,1280);
  return {
    total:Math.round(base*1.23*state.motion.duration),
    overshoot:clamp(distance*.065,5,16)*state.motion.stretch,
    distance
  };
}
function transformAt(amount,dir=1){
  const squish=state.shape.squish/100;
  const tilt=state.shape.tilt*dir;
  const sx=1+amount*squish*.45;
  const sy=1-amount*squish;
  return `scale(${sx.toFixed(4)},${sy.toFixed(4)}) rotate(${(tilt*amount).toFixed(2)}deg)`;
}
function frames(current,target,forward,t){
  const dir=forward?1:-1;
  const inertia=state.motion.inertia;
  const back=Math.max(0,t.overshoot*.34*state.motion.recoil);
  const bounce=Math.max(0,t.overshoot*.10*state.motion.bounce);
  const early=clamp(.58/inertia,.18,.88);
  const mid=clamp(.93/Math.sqrt(inertia),.55,.995);
  const overshoot=t.overshoot;
  if(forward){
    return [
      {offset:0,left:current.left+'px',right:current.right+'px',transform:transformAt(0,dir),easing:'cubic-bezier(.30,.04,.22,1)'},
      {offset:.13,left:current.left+'px',right:lerp(current.right,target.right,early)+'px',transform:transformAt(.35,dir),easing:'cubic-bezier(.18,.78,.22,1)'},
      {offset:.31,left:lerp(current.left,target.left,.26)+'px',right:lerp(current.right,target.right,mid)+'px',transform:transformAt(.7,dir),easing:'cubic-bezier(.16,.84,.20,1)'},
      {offset:.44,left:(target.left+overshoot)+'px',right:lerp(current.right,target.right,.992)+'px',transform:transformAt(1,dir),easing:'cubic-bezier(.14,.80,.18,1)'},
      {offset:.69,left:(target.left-back)+'px',right:target.right+'px',transform:transformAt(.38,-dir),easing:'cubic-bezier(.16,.76,.18,1)'},
      {offset:.86,left:(target.left+bounce)+'px',right:target.right+'px',transform:transformAt(.16,dir),easing:'cubic-bezier(.12,.70,.16,1)'},
      {offset:1,left:target.left+'px',right:target.right+'px',transform:'scale(1) rotate(0deg)'}
    ];
  }
  return [
    {offset:0,left:current.left+'px',right:current.right+'px',transform:transformAt(0,dir),easing:'cubic-bezier(.30,.04,.22,1)'},
    {offset:.13,left:lerp(current.left,target.left,early)+'px',right:current.right+'px',transform:transformAt(.35,dir),easing:'cubic-bezier(.18,.78,.22,1)'},
    {offset:.31,left:lerp(current.left,target.left,mid)+'px',right:lerp(current.right,target.right,.26)+'px',transform:transformAt(.7,dir),easing:'cubic-bezier(.16,.84,.20,1)'},
    {offset:.44,left:lerp(current.left,target.left,.992)+'px',right:(target.right+overshoot)+'px',transform:transformAt(1,dir),easing:'cubic-bezier(.14,.80,.18,1)'},
    {offset:.69,left:target.left+'px',right:(target.right-back)+'px',transform:transformAt(.38,-dir),easing:'cubic-bezier(.16,.76,.18,1)'},
    {offset:.86,left:target.left+'px',right:(target.right+bounce)+'px',transform:transformAt(.16,dir),easing:'cubic-bezier(.12,.70,.16,1)'},
    {offset:1,left:target.left+'px',right:target.right+'px',transform:'scale(1) rotate(0deg)'}
  ];
}
function stopAnimation(container,node){
  const a=segmentAnimations.get(container);
  if(!a)return indicatorGeometry(container,node);
  const visual=indicatorGeometry(container,node);
  try{a.cancel()}catch{}
  segmentAnimations.delete(container);
  node.style.left=visual.left+'px';node.style.right=visual.right+'px';node.style.transform='';
  container.classList.remove('is-moving');
  return visual;
}
function labelBump(button){
  const amount=.085*state.touch.label;
  button.animate([
    {transform:'scale(1)',filter:'brightness(1)'},
    {transform:`scale(${(1+amount).toFixed(4)})`,filter:'brightness(1.08)',offset:.42},
    {transform:'scale(1)',filter:'brightness(1)'}
  ],{duration:Math.round(420*state.motion.duration),easing:'cubic-bezier(.18,.78,.22,1)'});
}
function moveSegment(container,index,animate=true,fromDrag=false){
  const node=container.querySelector('.jelly-indicator'),list=choices(container);
  if(!node||!list.length)return;
  const previous=Number(container.dataset.activeIndex||0);
  const next=clamp(index,0,list.length-1);
  const target=geometry(container,next);if(!target)return;
  const currentGeom=stopAnimation(container,node);
  list.forEach((b,i)=>b.classList.toggle('is-selected',i===next));
  container.dataset.activeIndex=String(next);
  if(!animate||Math.abs(previous-next)<.001||matchMedia('(prefers-reduced-motion: reduce)').matches){
    node.style.left=target.left+'px';node.style.right=target.right+'px';node.style.transform='';
    return;
  }
  const t=timing(currentGeom,target);
  container.style.setProperty('--move-ms',t.total+'ms');
  container.classList.add('is-moving');
  const a=node.animate(frames(currentGeom,target,next>previous,t),{duration:t.total,easing:'linear',fill:'both'});
  segmentAnimations.set(container,a);
  node.style.left=target.left+'px';node.style.right=target.right+'px';
  labelBump(list[next]);
  a.finished.catch(()=>{}).then(()=>{
    if(segmentAnimations.get(container)===a){segmentAnimations.delete(container);try{a.cancel()}catch{};container.classList.remove('is-moving');node.style.transform='';}
  });
  if(fromDrag&&state.touch.release>0){
    const scale=.02*state.touch.release;
    container.animate([{transform:'scale(1)'},{transform:`scale(${(1+scale).toFixed(4)})`},{transform:'scale(1)'}],{duration:280,easing:'cubic-bezier(.2,.8,.25,1)'});
  }
}
function initSegment(container){
  container.dataset.activeIndex='0';
  requestAnimationFrame(()=>moveSegment(container,0,false));
  choices(container).forEach((button,index)=>{
    button.addEventListener('click',()=>moveSegment(container,index,true));
    button.addEventListener('pointerdown',()=>button.style.transform=`scale(${(1-.025*state.touch.press).toFixed(4)})`);
    const clear=()=>button.style.transform='';
    button.addEventListener('pointerup',clear);button.addEventListener('pointercancel',clear);button.addEventListener('pointerleave',clear);
  });
  container.addEventListener('pointerdown',event=>{
    if(event.button!==undefined&&event.button!==0)return;
    const node=container.querySelector('.jelly-indicator'); if(!node)return;
    const rect=container.getBoundingClientRect();
    dragState.set(container,{id:event.pointerId,startX:event.clientX,lastX:event.clientX,lastT:performance.now(),moved:false,rect});
    stopAnimation(container,node);
    try{container.setPointerCapture(event.pointerId)}catch{}
  });
  container.addEventListener('pointermove',event=>{
    const d=dragState.get(container);if(!d||d.id!==event.pointerId)return;
    const delta=Math.abs(event.clientX-d.startX);if(delta>4)d.moved=true;if(!d.moved)return;
    event.preventDefault();
    const count=choices(container).length,rect=d.rect;
    const local=clamp(event.clientX-rect.left,state.shape.inset,rect.width-state.shape.inset);
    let progress=clamp((local-state.shape.inset)/Math.max(1,rect.width-state.shape.inset*2),0,1)*(count-1);
    const active=Number(container.dataset.activeIndex||0);
    progress=clamp(active+(progress-active)*state.motion.drag,0,count-1);
    const low=Math.floor(progress),high=Math.ceil(progress),mix=progress-low;
    const a=geometry(container,low),b=geometry(container,high),node=container.querySelector('.jelly-indicator');
    if(a&&b&&node){node.style.left=lerp(a.left,b.left,mix)+'px';node.style.right=lerp(a.right,b.right,mix)+'px';node.style.transform=transformAt(Math.min(1,Math.abs(progress-active)),progress>=active?1:-1)}
    d.lastX=event.clientX;d.lastT=performance.now();
  });
  const finish=(event,cancelled)=>{
    const d=dragState.get(container);if(!d||d.id!==event.pointerId)return;dragState.delete(container);
    try{container.releasePointerCapture(event.pointerId)}catch{}
    if(cancelled||!d.moved){moveSegment(container,Number(container.dataset.activeIndex||0),true);return}
    const list=choices(container),rect=container.getBoundingClientRect();
    const raw=clamp((event.clientX-rect.left)/Math.max(1,rect.width),0,1)*(list.length-1);
    const velocity=(event.clientX-d.lastX)/Math.max(16,performance.now()-d.lastT)*state.touch.velocity;
    const index=clamp(Math.round(raw+velocity*.14),0,list.length-1);
    moveSegment(container,index,true,true);
  };
  container.addEventListener('pointerup',e=>finish(e,false));container.addEventListener('pointercancel',e=>finish(e,true));
}
document.querySelectorAll('[data-jelly-segmented]').forEach(initSegment);

function pulseSingle(){
  const el=document.querySelector('.single-jelly');
  const tap=.075*state.touch.tap,press=.03*state.touch.press,release=.016*state.touch.release;
  const squish=state.shape.squish/100;
  el.animate([
    {transform:'scale(1,1)',filter:'brightness(1)'},
    {transform:`scale(${(1-press).toFixed(4)},${(1-press+squish*.15).toFixed(4)})`,filter:'brightness(1.03)',offset:.18},
    {transform:`scale(${(1+tap).toFixed(4)},${(1-tap*.28).toFixed(4)})`,filter:'brightness(1.08)',offset:.48},
    {transform:`scale(${(1-release*.5).toFixed(4)},${(1+release).toFixed(4)})`,filter:'brightness(1.02)',offset:.72},
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
  const stretch=.18*state.touch.toggle;
  knob.animate([
    {transform:`translateX(${on?0:distance}px) scaleX(1)`},
    {transform:`translateX(${x-dir*distance*.08}px) scaleX(${(1+stretch).toFixed(3)})`,offset:.38},
    {transform:`translateX(${x+dir*distance*.04}px) scaleX(${(1-stretch*.25).toFixed(3)})`,offset:.72},
    {transform:`translateX(${x}px) scaleX(1)`}
  ],{duration:Math.round(520*state.motion.duration),easing:'cubic-bezier(.18,.78,.22,1)',fill:'forwards'});
}
toggle.addEventListener('click',()=>toggleSwitch());

function renderPanel(){
  const c=cfg();if(!c.params.some(p=>p.key===activeParam))activeParam=c.params[0].key;
  categoryTitle.textContent=c.title;
  tabsHost.innerHTML=c.params.map(p=>`<button type="button" class="param-tab ${p.key===activeParam?'is-active':''}" data-param="${p.key}">${p.short}</button>`).join('');
  valuesHost.innerHTML=c.params.map(p=>{
    const v=state[activeCategory][p.key],cls=v<p.base-1e-6?'is-less':v>p.base+1e-6?'is-more':'';
    return `<span class="${cls}"><b>${p.short}</b><em>${p.format(v)}</em></span>`;
  }).join('');
  tabsHost.querySelectorAll('.param-tab').forEach(b=>b.addEventListener('click',()=>{activeParam=b.dataset.param;renderPanel()}));
  const p=param();slider.min=p.min;slider.max=p.max;slider.step=p.step;slider.value=current();sliderLabel.textContent=p.label;sliderOutput.textContent=p.format(current());
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
  },170);
}
slider.addEventListener('input',()=>{
  const p=param();let v=Number(slider.value);
  state[activeCategory][p.key]=v;sliderOutput.textContent=p.format(v);applyVars();renderPanel();scheduleDemo();
});

function openDialog(){updateDialog();categoryDialog.showModal()}
document.querySelector('.category-button').addEventListener('click',openDialog);
document.querySelector('.category-pill').addEventListener('click',openDialog);
document.querySelector('.dialog-close').addEventListener('click',()=>categoryDialog.close());
categoryDialog.addEventListener('click',e=>{if(e.target===categoryDialog)categoryDialog.close()});
categoryCards.forEach(card=>card.addEventListener('click',()=>{activeCategory=card.dataset.category;activeParam=CATEGORIES[activeCategory].params[0].key;categoryDialog.close();renderPanel()}));

document.querySelector('.reset-button').addEventListener('click',()=>{
  state=structuredClone(defaults);activeCategory='motion';activeParam='duration';applyVars();renderPanel();
  document.querySelectorAll('[data-jelly-segmented]').forEach(c=>moveSegment(c,0,false));
  toggleSwitch(false);
  pulseSingle();
});
window.addEventListener('resize',()=>requestAnimationFrame(()=>document.querySelectorAll('[data-jelly-segmented]').forEach(c=>moveSegment(c,Number(c.dataset.activeIndex||0),false))),{passive:true});

applyVars();renderPanel();requestAnimationFrame(()=>document.querySelectorAll('[data-jelly-segmented]').forEach(c=>moveSegment(c,0,false)));
