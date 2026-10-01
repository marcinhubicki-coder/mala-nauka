const root=document.querySelector('#progress-lab');
const track=document.querySelector('#progress-track');
const fill=document.querySelector('#progress-fill');
const progressRange=document.querySelector('#progress-range');
const progressOutput=document.querySelector('#progress-output');
const previewPercent=document.querySelector('#preview-percent');
const categoryTabs=document.querySelector('#category-tabs');
const parameterTabs=document.querySelector('#parameter-tabs');
const parameterRange=document.querySelector('#parameter-range');
const parameterName=document.querySelector('#parameter-name');
const parameterValue=document.querySelector('#parameter-value');
const categoryKicker=document.querySelector('#category-kicker');
const parameterSummary=document.querySelector('#parameter-summary');
const presetOutput=document.querySelector('#preset-output');
const playButton=document.querySelector('#play');
const pauseButton=document.querySelector('#pause');
const loopToggle=document.querySelector('#loop');
const sparkLayer=document.querySelector('#spark-layer');

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const px=v=>`${Number(v).toFixed(Number(v)%1?1:0)}px`;
const pct=v=>`${Math.round(Number(v))}%`;
const x=v=>`${Number(v).toFixed(2)}×`;
const ms=v=>`${Math.round(Number(v))}ms`;
const deg=v=>`${Math.round(Number(v))}°`;

const CATEGORIES={
  shape:{title:'Kształt',params:[
    {key:'height',short:'G',label:'Grubość',min:10,max:42,step:1,base:24,format:px},
    {key:'radius',short:'R',label:'Zaokrąglenie',min:6,max:30,step:1,base:24,format:px},
    {key:'trackOpacity',short:'T',label:'Tło paska',min:.25,max:1,step:.05,base:.82,format:x},
    {key:'trackBorder',short:'K',label:'Krawędź tła',min:0,max:3,step:.25,base:0,format:px},
    {key:'trackInset',short:'M',label:'Margines fill',min:0,max:5,step:.5,base:0,format:px},
    {key:'edgeSoftness',short:'S',label:'Miękkość krawędzi',min:0,max:3,step:.1,base:0,format:px},
  ]},
  fill:{title:'Wypełnienie',params:[
    {key:'hue',short:'H',label:'Odcień',min:300,max:355,step:1,base:335,format:deg},
    {key:'hueShift',short:'Z',label:'Gradient',min:-25,max:30,step:1,base:10,format:deg},
    {key:'saturation',short:'N',label:'Nasycenie',min:45,max:100,step:1,base:86,format:pct},
    {key:'lightness',short:'J',label:'Jasność',min:42,max:70,step:1,base:56,format:pct},
    {key:'depth',short:'D',label:'Głębia',min:0,max:1.8,step:.05,base:.72,format:x},
    {key:'brightness',short:'B',label:'Blask fill',min:.8,max:1.3,step:.01,base:1,format:x},
  ]},
  light:{title:'Światło',params:[
    {key:'glowBlur',short:'P',label:'Promień poświaty',min:0,max:30,step:1,base:12,format:px},
    {key:'glowAlpha',short:'A',label:'Siła poświaty',min:0,max:.6,step:.02,base:.18,format:x},
    {key:'shadowY',short:'Y',label:'Cień pionowy',min:0,max:10,step:.5,base:3,format:px},
    {key:'shadowBlur',short:'C',label:'Rozmycie cienia',min:0,max:24,step:1,base:8,format:px},
    {key:'innerShine',short:'I',label:'Górny połysk',min:0,max:1,step:.05,base:.52,format:x},
    {key:'rimAlpha',short:'O',label:'Obrys wewnętrzny',min:0,max:.65,step:.025,base:.18,format:x},
  ]},
  motion:{title:'Ruch',params:[
    {key:'duration',short:'C',label:'Czas 0 → 100',min:450,max:4200,step:50,base:1750,format:ms},
    {key:'ease',short:'E',label:'Miękkość ruchu',min:.4,max:2.4,step:.05,base:1.15,format:x},
    {key:'stretch',short:'R',label:'Rozciągnięcie końcówki',min:0,max:1.8,step:.05,base:.65,format:x},
    {key:'bounce',short:'D',label:'Dobicie przy 100%',min:0,max:2.5,step:.05,base:.85,format:x},
    {key:'wobble',short:'F',label:'Falowanie',min:0,max:2.2,step:.05,base:.35,format:x},
    {key:'startKick',short:'S',label:'Startowy impuls',min:0,max:2,step:.05,base:.45,format:x},
  ]},
  shimmer:{title:'Shimmer',params:[
    {key:'alpha',short:'A',label:'Siła shimmer',min:0,max:.9,step:.03,base:.36,format:x},
    {key:'width',short:'S',label:'Szerokość',min:6,max:45,step:1,base:18,format:pct},
    {key:'angle',short:'K',label:'Kąt',min:65,max:145,step:1,base:110,format:deg},
    {key:'speed',short:'C',label:'Prędkość',min:450,max:3200,step:50,base:1500,format:ms},
    {key:'blur',short:'L',label:'Blur shimmer',min:0,max:8,step:.25,base:2,format:px},
    {key:'pulse',short:'P',label:'Puls jasności',min:0,max:.45,step:.02,base:.10,format:x},
  ]},
  finish:{title:'Finał 100%',params:[
    {key:'pop',short:'P',label:'Pop końcówki',min:0,max:2.4,step:.05,base:1,format:x},
    {key:'flash',short:'B',label:'Błysk',min:0,max:2.5,step:.05,base:.85,format:x},
    {key:'sparkCount',short:'I',label:'Iskry',min:0,max:18,step:1,base:8,format:v=>String(Math.round(v))},
    {key:'sparkSpread',short:'R',label:'Rozrzut iskier',min:10,max:80,step:2,base:42,format:px},
    {key:'sparkSize',short:'S',label:'Rozmiar iskier',min:2,max:12,step:.5,base:5,format:px},
    {key:'sparkDuration',short:'C',label:'Czas iskier',min:250,max:1500,step:50,base:700,format:ms},
  ]},
};

const defaults={
  shape:{height:24,radius:24,trackOpacity:.82,trackBorder:0,trackInset:0,edgeSoftness:0},
  fill:{hue:335,hueShift:10,saturation:86,lightness:56,depth:.72,brightness:1},
  light:{glowBlur:12,glowAlpha:.18,shadowY:3,shadowBlur:8,innerShine:.52,rimAlpha:.18},
  motion:{duration:1750,ease:1.15,stretch:.65,bounce:.85,wobble:.35,startKick:.45},
  shimmer:{alpha:.36,width:18,angle:110,speed:1500,blur:2,pulse:.10},
  finish:{pop:1,flash:.85,sparkCount:8,sparkSpread:42,sparkSize:5,sparkDuration:700},
};

let state=structuredClone(defaults);
let activeCategory='shape';
let activeParam='height';
let progress=33;
let raf=0;
let playStarted=0;
let paused=false;
let lastWasComplete=false;
let pointerId=null;

function category(){return CATEGORIES[activeCategory]}
function param(){return category().params.find(p=>p.key===activeParam)||category().params[0]}
function current(){return state[activeCategory][activeParam]}

function applyVars(){
  const s=state.shape,f=state.fill,l=state.light,h=state.shimmer;
  root.style.setProperty('--bar-height',`${s.height}px`);
  root.style.setProperty('--bar-radius',`${s.radius}px`);
  root.style.setProperty('--track-opacity',s.trackOpacity);
  root.style.setProperty('--track-border',`${s.trackBorder}px`);
  root.style.setProperty('--track-inset',`${s.trackInset}px`);
  root.style.setProperty('--edge-softness',`${s.edgeSoftness}px`);
  root.style.setProperty('--fill-hue',f.hue);
  root.style.setProperty('--fill-hue-shift',f.hueShift);
  root.style.setProperty('--fill-saturation',`${f.saturation}%`);
  root.style.setProperty('--fill-lightness',`${f.lightness}%`);
  root.style.setProperty('--fill-depth',f.depth);
  root.style.setProperty('--fill-brightness',f.brightness);
  root.style.setProperty('--glow-blur',`${l.glowBlur}px`);
  root.style.setProperty('--glow-alpha',l.glowAlpha);
  root.style.setProperty('--shadow-y',`${l.shadowY}px`);
  root.style.setProperty('--shadow-blur',`${l.shadowBlur}px`);
  root.style.setProperty('--shadow-alpha',Math.min(.5,.12*Math.max(.2,l.shadowBlur/8)));
  root.style.setProperty('--inner-shine',l.innerShine);
  root.style.setProperty('--rim-alpha',l.rimAlpha);
  root.style.setProperty('--shimmer-alpha',h.alpha);
  root.style.setProperty('--shimmer-width',`${h.width}%`);
  root.style.setProperty('--shimmer-angle',`${h.angle}deg`);
  root.style.setProperty('--shimmer-speed',`${h.speed}ms`);
  root.style.setProperty('--shimmer-blur',`${h.blur}px`);
  root.style.setProperty('--pulse-alpha',h.pulse);
  track.classList.toggle('is-shimmering',h.alpha>0.01 && h.speed>0);
}

function setProgress(value,{fromAnimation=false,triggerFinish=true}={}){
  progress=clamp(Number(value)||0,0,100);
  const rounded=Math.round(progress);
  fill.style.width=`${progress}%`;
  progressRange.value=String(rounded);
  progressOutput.textContent=`${rounded}%`;
  previewPercent.textContent=`${rounded}%`;
  track.setAttribute('aria-valuenow',String(rounded));

  const pulse=state.shimmer.pulse;
  const phase=progress/100*Math.PI*2;
  const pulseBrightness=1+pulse*Math.max(0,Math.sin(phase*1.4));
  fill.style.filter=`brightness(${(state.fill.brightness*pulseBrightness).toFixed(3)})`;

  const wasComplete=lastWasComplete;
  lastWasComplete=progress>=99.8;
  if(triggerFinish && lastWasComplete && !wasComplete) finishBurst();
  if(!fromAnimation && raf){ cancelAnimationFrame(raf);raf=0;track.classList.remove('is-playing'); }
}

function easeProgress(t){
  const e=state.motion.ease;
  const power=clamp(3.2/e,1.35,6);
  return 1-Math.pow(1-t,power);
}

function animateFrame(ts){
  if(paused){ playStarted=ts-(progress/100)*state.motion.duration; raf=requestAnimationFrame(animateFrame); return; }
  if(!playStarted)playStarted=ts;
  const duration=Math.max(120,state.motion.duration);
  const raw=clamp((ts-playStarted)/duration,0,1);
  const eased=easeProgress(raw);
  const kick=state.motion.startKick*Math.exp(-raw*9)*Math.sin(raw*Math.PI*3.2)*1.2;
  const wobble=state.motion.wobble*Math.sin(raw*Math.PI*4.3)*Math.pow(1-raw,1.7);
  let p=(eased*100)+(kick+wobble);
  p=clamp(p,0,100);
  setProgress(p,{fromAnimation:true,triggerFinish:true});

  const stretch=1+state.motion.stretch*Math.sin(Math.min(1,raw*1.45)*Math.PI)*.035;
  fill.style.transform=`scaleX(${stretch.toFixed(4)})`;
  fill.style.transformOrigin='left center';

  if(raw<1){ raf=requestAnimationFrame(animateFrame); return; }
  raf=0;playStarted=0;fill.style.transform='';
  completeBounce();
  if(loopToggle.checked){ setTimeout(()=>{if(loopToggle.checked)play();},Math.max(250,state.finish.sparkDuration*.55)); }
  else track.classList.remove('is-playing');
}

function play(){
  if(raf)cancelAnimationFrame(raf);
  paused=false;pauseButton.textContent='Pauza';playStarted=0;lastWasComplete=false;
  setProgress(0,{fromAnimation:true,triggerFinish:false});
  track.classList.add('is-playing');
  raf=requestAnimationFrame(animateFrame);
}

function completeBounce(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const m=state.motion,f=state.finish;
  const pop=1+.06*f.pop+.025*m.bounce;
  const recoil=1-.018*m.bounce;
  const cap=track.querySelector('.fill-cap');
  cap.animate([
    {transform:'scaleX(1) scaleY(1)',filter:'brightness(1)'},
    {transform:`scaleX(${(pop+0.035*m.stretch).toFixed(3)}) scaleY(${(1+.028*f.pop).toFixed(3)})`,filter:`brightness(${(1+.18*f.flash).toFixed(3)})`,offset:.38},
    {transform:`scaleX(${recoil.toFixed(3)}) scaleY(1.015)`,filter:'brightness(1.05)',offset:.72},
    {transform:'scaleX(1) scaleY(1)',filter:'brightness(1)'}
  ],{duration:Math.round(520+160*m.bounce),easing:'cubic-bezier(.16,.78,.2,1)'});
  fill.animate([
    {filter:`brightness(${state.fill.brightness})`},
    {filter:`brightness(${(state.fill.brightness*(1+.18*f.flash)).toFixed(3)})`,offset:.42},
    {filter:`brightness(${state.fill.brightness})`}
  ],{duration:Math.round(560+120*f.flash),easing:'ease-out'});
}

function finishBurst(){
  completeBounce();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  sparkLayer.replaceChildren();
  const f=state.finish,count=Math.round(f.sparkCount);
  for(let i=0;i<count;i++){
    const s=document.createElement('span');s.className='spark';
    const angle=(-105+(210*(i/(Math.max(1,count-1))))) * Math.PI/180;
    const spread=f.sparkSpread*(.55+(i%4)*.15);
    const x=Math.cos(angle)*spread;
    const y=Math.sin(angle)*spread;
    s.style.setProperty('--spark-x',`${x.toFixed(1)}px`);
    s.style.setProperty('--spark-y',`${y.toFixed(1)}px`);
    s.style.setProperty('--spark-size',`${(f.sparkSize*(.75+(i%3)*.18)).toFixed(1)}px`);
    s.style.setProperty('--spark-ms',`${Math.round(f.sparkDuration*(.82+(i%4)*.08))}ms`);
    s.style.setProperty('--spark-alpha',String(clamp(.55+.12*f.flash,0,1)));
    sparkLayer.appendChild(s);
    requestAnimationFrame(()=>s.classList.add('is-active'));
  }
  setTimeout(()=>sparkLayer.replaceChildren(),f.sparkDuration+200);
}

function renderCategories(){
  categoryTabs.innerHTML=Object.entries(CATEGORIES).map(([key,c])=>`<button type="button" class="category-tab ${key===activeCategory?'is-active':''}" role="tab" aria-selected="${key===activeCategory}" data-category="${key}">${c.title}</button>`).join('');
  categoryTabs.querySelectorAll('.category-tab').forEach(b=>b.addEventListener('click',()=>{
    activeCategory=b.dataset.category;activeParam=CATEGORIES[activeCategory].params[0].key;renderAll();
  }));
}

function renderParameters(){
  const c=category();
  if(!c.params.some(p=>p.key===activeParam))activeParam=c.params[0].key;
  const p=param();
  categoryKicker.textContent=c.title.toUpperCase();
  parameterName.textContent=p.label;
  parameterValue.textContent=p.format(current());
  parameterTabs.innerHTML=c.params.map(item=>`<button type="button" class="parameter-tab ${item.key===activeParam?'is-active':''}" role="tab" aria-selected="${item.key===activeParam}" data-param="${item.key}" aria-label="${item.label}">${item.short}</button>`).join('');
  parameterTabs.querySelectorAll('.parameter-tab').forEach(b=>b.addEventListener('click',()=>{activeParam=b.dataset.param;renderParameters();}));
  parameterRange.min=p.min;parameterRange.max=p.max;parameterRange.step=p.step;parameterRange.value=current();
  parameterSummary.innerHTML=c.params.map(item=>{
    const v=state[activeCategory][item.key];
    const changed=Math.abs(v-item.base)>1e-7;
    return `<div class="summary-item ${changed?'is-changed':''}"><b>${item.label}</b><span>${item.format(v)}</span></div>`;
  }).join('');
}

function renderPreset(){
  const compact={progress:Math.round(progress),...state};
  presetOutput.value=JSON.stringify(compact,null,2);
}

function renderAll(){applyVars();renderCategories();renderParameters();renderPreset();}

parameterRange.addEventListener('input',()=>{
  state[activeCategory][activeParam]=Number(parameterRange.value);
  applyVars();renderParameters();renderPreset();setProgress(progress,{fromAnimation:true,triggerFinish:false});
});

progressRange.addEventListener('input',()=>{lastWasComplete=false;setProgress(Number(progressRange.value),{triggerFinish:true});renderPreset();});

function progressFromPointer(event){
  const r=track.getBoundingClientRect();
  const p=clamp((event.clientX-r.left)/Math.max(1,r.width),0,1)*100;
  lastWasComplete=false;setProgress(p,{triggerFinish:true});renderPreset();
}
track.addEventListener('pointerdown',event=>{
  if(event.button!==undefined&&event.button!==0)return;
  pointerId=event.pointerId;try{track.setPointerCapture(pointerId)}catch{};progressFromPointer(event);
});
track.addEventListener('pointermove',event=>{if(event.pointerId===pointerId)progressFromPointer(event)});
track.addEventListener('pointerup',event=>{if(event.pointerId!==pointerId)return;try{track.releasePointerCapture(pointerId)}catch{};pointerId=null});
track.addEventListener('pointercancel',()=>{pointerId=null});
track.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowDown'){event.preventDefault();setProgress(progress-1);renderPreset()}
  if(event.key==='ArrowRight'||event.key==='ArrowUp'){event.preventDefault();setProgress(progress+1);renderPreset()}
  if(event.key==='Home'){event.preventDefault();setProgress(0);renderPreset()}
  if(event.key==='End'){event.preventDefault();setProgress(100);renderPreset()}
});

playButton.addEventListener('click',play);
pauseButton.addEventListener('click',()=>{
  if(!raf)return;
  paused=!paused;pauseButton.textContent=paused?'Wznów':'Pauza';
});
loopToggle.addEventListener('change',()=>{if(loopToggle.checked&&!raf&&progress>=99)play()});

document.querySelector('#reset').addEventListener('click',()=>{
  if(raf)cancelAnimationFrame(raf);raf=0;playStarted=0;paused=false;pauseButton.textContent='Pauza';
  state=structuredClone(defaults);activeCategory='shape';activeParam='height';lastWasComplete=false;track.classList.remove('is-playing');
  setProgress(33,{fromAnimation:true,triggerFinish:false});renderAll();
});

document.querySelector('#select-preset').addEventListener('click',()=>{presetOutput.focus();presetOutput.select();});

applyVars();renderAll();setProgress(33,{fromAnimation:true,triggerFinish:false});
