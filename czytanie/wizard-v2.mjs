const root=document.querySelector('#app');
const STORAGE_KEY='malaNauka.v1.readingWizardV2';
const LEVELS=[[1,'Słowa'],[2,'Frazy'],[3,'Zdania']];
const DURATIONS=[60,120,180,300];
const START_COPY={60:'Szybka runda!',120:'Zaczynamy!',180:'Dłuższa misja!',300:'Pełna misja!'};

let state=null;
let suppressClickUntil=0;
const segmentAnimations=new WeakMap();
const segmentTimers=new WeakMap();
const dragStates=new WeakMap();

function esc(value){
 return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function readState(fallback){
 try{
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
  if(saved&&typeof saved==='object'){
   return {
    training:saved.training==='memory'?'memory':'reading',
    level:[1,2,3].includes(Number(saved.level))?Number(saved.level):fallback.level,
    duration:DURATIONS.includes(Number(saved.duration))?Number(saved.duration):fallback.duration
   };
  }
 }catch{}
 return {
  training:fallback.training==='memory'?'memory':'reading',
  level:[1,2,3].includes(Number(fallback.level))?Number(fallback.level):1,
  duration:DURATIONS.includes(Number(fallback.duration))?Number(fallback.duration):180
 };
}
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}}
function indicator(){return '<span class="reading-segment-indicator" aria-hidden="true"></span>';}
function trainingChoices(){
 return indicator()+
  '<label class="reading-choice"><input type="radio" name="readingTraining" value="reading" '+(state.training==='reading'?'checked':'')+'><span>Czytanie</span></label>'+
  '<label class="reading-choice"><input type="radio" name="readingTraining" value="memory" '+(state.training==='memory'?'checked':'')+'><span>Pamięć</span></label>';
}
function levelChoices(){
 return indicator()+LEVELS.map(([value,label])=>
  '<label class="reading-choice"><input type="radio" name="difficulty" value="'+value+'" '+(state.level===value?'checked':'')+'><span>'+esc(label)+'</span></label>'
 ).join('');
}
function durationChoices(){
 return indicator()+DURATIONS.map(seconds=>
  '<label class="reading-choice"><input type="radio" name="duration" value="'+seconds+'" '+(state.duration===seconds?'checked':'')+'><span>'+(seconds/60)+' min</span></label>'
 ).join('');
}

function segmentGeometry(container,index){
 const labels=[...container.querySelectorAll(':scope > label')];
 const target=labels[index];
 if(!target)return null;
 const cr=container.getBoundingClientRect(),tr=target.getBoundingClientRect(),inset=4;
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
function lerp(a,b,t){return a+(b-a)*t}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function motionTiming(current,target){
 const distance=Math.abs(target.center-current.center);
 const base=Math.min(1280,Math.max(860,Math.round(860+distance*.72)));
 return {total:Math.round(base*1.23),overshoot:Math.min(16,Math.max(5,Math.round(distance*.065)))};
}
function jellyFrames(current,target,forward,overshoot){
 const back=Math.max(2,Math.round(overshoot*.34));
 const bounce=Math.max(1,Math.round(overshoot*.10));
 if(forward){
  return [
   {offset:0,left:current.left+'px',right:current.right+'px',easing:'cubic-bezier(.30,.04,.22,1)'},
   {offset:.13,left:current.left+'px',right:lerp(current.right,target.right,.58)+'px',easing:'cubic-bezier(.18,.78,.22,1)'},
   {offset:.31,left:lerp(current.left,target.left,.26)+'px',right:lerp(current.right,target.right,.93)+'px',easing:'cubic-bezier(.16,.84,.20,1)'},
   {offset:.44,left:(target.left+overshoot)+'px',right:lerp(current.right,target.right,.992)+'px',easing:'cubic-bezier(.14,.80,.18,1)'},
   {offset:.69,left:(target.left-back)+'px',right:target.right+'px',easing:'cubic-bezier(.16,.76,.18,1)'},
   {offset:.86,left:(target.left+bounce)+'px',right:target.right+'px',easing:'cubic-bezier(.12,.70,.16,1)'},
   {offset:1,left:target.left+'px',right:target.right+'px'}
  ];
 }
 return [
  {offset:0,left:current.left+'px',right:current.right+'px',easing:'cubic-bezier(.30,.04,.22,1)'},
  {offset:.13,left:lerp(current.left,target.left,.58)+'px',right:current.right+'px',easing:'cubic-bezier(.18,.78,.22,1)'},
  {offset:.31,left:lerp(current.left,target.left,.93)+'px',right:lerp(current.right,target.right,.26)+'px',easing:'cubic-bezier(.16,.84,.20,1)'},
  {offset:.44,left:lerp(current.left,target.left,.992)+'px',right:(target.right+overshoot)+'px',easing:'cubic-bezier(.14,.80,.18,1)'},
  {offset:.69,left:target.left+'px',right:(target.right-back)+'px',easing:'cubic-bezier(.16,.76,.18,1)'},
  {offset:.86,left:target.left+'px',right:(target.right+bounce)+'px',easing:'cubic-bezier(.12,.70,.16,1)'},
  {offset:1,left:target.left+'px',right:target.right+'px'}
 ];
}
function stopSegmentAnimation(container,node){
 const animation=segmentAnimations.get(container);
 if(!animation)return indicatorGeometry(container,node);
 const visual=indicatorGeometry(container,node);
 try{animation.cancel()}catch{}
 segmentAnimations.delete(container);
 node.style.left=visual.left+'px';
 node.style.right=visual.right+'px';
 return visual;
}
function updateSegment(container,index,count,animate=true){
 if(!container)return;
 const node=container.querySelector('.reading-segment-indicator');
 if(!node)return;
 const previousIndex=Number(container.dataset.activeIndex);
 const nextIndex=Math.max(0,Math.min(count-1,index));
 const target=segmentGeometry(container,nextIndex);
 if(!target)return;
 const changed=Number.isFinite(previousIndex)&&Math.abs(previousIndex-nextIndex)>.001;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const current=stopSegmentAnimation(container,node);
 container.dataset.activeIndex=String(nextIndex);
 container.dataset.direction=changed&&nextIndex<previousIndex?'backward':'forward';
 const timer=segmentTimers.get(container);
 if(timer)window.clearTimeout(timer);
 if(!animate||!changed||reduced||typeof node.animate!=='function'){
  node.style.left=target.left+'px';
  node.style.right=target.right+'px';
  container.classList.remove('is-segment-moving');
  return;
 }
 const timing=motionTiming(current,target);
 container.style.setProperty('--segment-total-ms',timing.total+'ms');
 container.classList.remove('is-segment-moving');
 void container.offsetWidth;
 container.classList.add('is-segment-moving');
 const animation=node.animate(jellyFrames(current,target,nextIndex>previousIndex,timing.overshoot),{duration:timing.total,easing:'linear',fill:'both'});
 segmentAnimations.set(container,animation);
 node.style.left=target.left+'px';
 node.style.right=target.right+'px';
 const finish=()=>{
  if(segmentAnimations.get(container)===animation){
   segmentAnimations.delete(container);
   try{animation.cancel()}catch{}
   container.classList.remove('is-segment-moving');
  }
 };
 animation.addEventListener('finish',finish,{once:true});
 segmentTimers.set(container,window.setTimeout(finish,timing.total+120));
}
function segmentCount(container){return container?.querySelectorAll(':scope > label').length||0}
function activeIndexFor(container){
 const type=container?.dataset.segmented;
 if(type==='training')return state.training==='memory'?1:0;
 if(type==='level')return Math.max(0,LEVELS.findIndex(([value])=>value===state.level));
 if(type==='time')return Math.max(0,DURATIONS.indexOf(state.duration));
 return 0;
}
function syncSegments(animate=false){
 root.querySelectorAll('.reading-segmented').forEach(container=>{
  if(!container.offsetWidth||!container.offsetHeight)return;
  updateSegment(container,activeIndexFor(container),segmentCount(container),animate);
 });
}
function bumpLabel(label){
 if(!label)return;
 label.classList.remove('is-tap-bump');
 void label.offsetWidth;
 label.classList.add('is-tap-bump');
 window.setTimeout(()=>label.classList.remove('is-tap-bump'),430);
}
function updateStartButton(animate=false){
 const button=root.querySelector('.start-button');
 if(!button)return;
 let copy=button.querySelector('[data-start-copy]');
 if(!copy){
  button.innerHTML='<span data-start-copy></span><span aria-hidden="true">→</span>';
  copy=button.querySelector('[data-start-copy]');
 }
 const next=START_COPY[state.duration]||'Zaczynamy!';
 if(copy.textContent!==next){
  copy.textContent=next;
  if(animate){
   button.classList.remove('reading-start-pop');
   void button.offsetWidth;
   button.classList.add('reading-start-pop');
  }
 }
}
function syncTrainingUI(animate=false){
 const form=root.querySelector('#setup-form');
 if(!form)return;
 const hidden=form.querySelector('input[name="category"]');
 const nextCategory=state.training;
 const changed=hidden&&hidden.value!==nextCategory;
 if(hidden)hidden.value=nextCategory;
 form.classList.toggle('reading-memory-selected',state.training==='memory');
 const levelWrap=form.querySelector('.reading-level-wrap');
 if(levelWrap){
  levelWrap.classList.toggle('is-hidden',state.training==='memory');
  levelWrap.setAttribute('aria-hidden',state.training==='memory'?'true':'false');
 }
 const timeStep=form.querySelector('[data-time-step]');
 if(timeStep)timeStep.textContent=state.training==='memory'?'2':'3';
 const note=root.querySelector('.wizard-note');
 if(note)note.textContent=state.training==='memory'
  ?'Zapamiętaj liczby w kolejności, a potem odtwórz sekwencję.'
  :'Tekst znika po chwili. Potem odpowiadasz z pamięci.';
 const intro=root.querySelector('.wizard-intro p');
 if(intro)intro.textContent=state.training==='memory'
  ?'Ćwicz pamięć roboczą krótkimi seriami liczb.'
  :'Przeczytaj, zapamiętaj i odpowiedz.';
 saveState();
 if(changed)hidden.dispatchEvent(new Event('change',{bubbles:true}));
 requestAnimationFrame(()=>syncSegments(animate));
}
function applySegmentSelection(input){
 if(!input||input.disabled)return;
 const container=input.closest('.reading-segmented');
 const label=input.closest('label');
 const labels=[...container.querySelectorAll(':scope > label')];
 const index=Math.max(0,labels.indexOf(label));
 if(input.checked){
  updateSegment(container,index,labels.length,true);
  bumpLabel(label);
  return;
 }
 input.checked=true;
 input.dispatchEvent(new Event('change',{bubbles:true}));
}
function setupDrag(container){
 if(!container||container.dataset.dragReady==='true')return;
 container.dataset.dragReady='true';
 container.addEventListener('pointerdown',event=>{
  if(event.button!==undefined&&event.button!==0)return;
  const node=container.querySelector('.reading-segment-indicator');
  if(!node)return;
  const rect=container.getBoundingClientRect();
  const currentIndex=activeIndexFor(container);
  dragStates.set(container,{pointerId:event.pointerId,startX:event.clientX,x:event.clientX,moved:false,rect,currentIndex});
  stopSegmentAnimation(container,node);
  container.classList.add('is-dragging');
  try{container.setPointerCapture(event.pointerId)}catch{}
 });
 container.addEventListener('pointermove',event=>{
  const drag=dragStates.get(container);
  if(!drag||drag.pointerId!==event.pointerId)return;
  drag.x=event.clientX;
  if(Math.abs(drag.x-drag.startX)>4)drag.moved=true;
  if(!drag.moved)return;
  event.preventDefault();
  const count=segmentCount(container),rect=drag.rect;
  const local=clamp(event.clientX-rect.left,4,rect.width-4);
  const progress=clamp((local-4)/Math.max(1,rect.width-8),0,1)*(count-1);
  const low=Math.floor(progress),high=Math.ceil(progress),mix=progress-low;
  const a=segmentGeometry(container,low),b=segmentGeometry(container,high);
  const node=container.querySelector('.reading-segment-indicator');
  if(!a||!b||!node)return;
  node.style.left=lerp(a.left,b.left,mix)+'px';
  node.style.right=lerp(a.right,b.right,mix)+'px';
  container.dataset.activeIndex=String(progress);
 });
 const finishDrag=(event,cancelled=false)=>{
  const drag=dragStates.get(container);
  if(!drag||drag.pointerId!==event.pointerId)return;
  dragStates.delete(container);
  container.classList.remove('is-dragging');
  try{container.releasePointerCapture(event.pointerId)}catch{}
  if(cancelled){
   updateSegment(container,activeIndexFor(container),segmentCount(container),true);
   return;
  }
  if(!drag.moved)return;
  suppressClickUntil=performance.now()+350;
  const labels=[...container.querySelectorAll(':scope > label')];
  const x=event.clientX;
  let index=drag.currentIndex;
  if(x>drag.startX){
   for(let i=drag.currentIndex+1;i<labels.length;i++){
    const r=labels[i].getBoundingClientRect();
    if(x>=(r.left+r.right)/2)index=i;
   }
  }else if(x<drag.startX){
   for(let i=drag.currentIndex-1;i>=0;i--){
    const r=labels[i].getBoundingClientRect();
    if(x<=(r.left+r.right)/2)index=i;
   }
  }
  const input=labels[index]?.querySelector('input');
  if(input)applySegmentSelection(input);
  else updateSegment(container,activeIndexFor(container),labels.length,true);
 };
 container.addEventListener('pointerup',event=>finishDrag(event,false));
 container.addEventListener('pointercancel',event=>finishDrag(event,true));
}
function installDrag(){root.querySelectorAll('.reading-segmented').forEach(setupDrag)}

function install(){
 if(!root||root.dataset.mode!=='reading'||root.dataset.view!=='wizard')return;
 const form=root.querySelector('#setup-form');
 if(!form||form.dataset.readingV3==='true')return;
 const fallback={
  training:form.querySelector('[name="category"]')?.value==='memory'?'memory':'reading',
  level:Number(form.querySelector('[name="difficulty"]:checked')?.value)||1,
  duration:Number(form.querySelector('[name="duration"]:checked')?.value)||180
 };
 state=readState(fallback);
 form.dataset.readingV3='true';
 form.innerHTML=
  '<section class="card setup-card reading-wizard-v2">'+
   '<input id="category" type="hidden" name="category" value="'+esc(state.training)+'">'+
   '<fieldset class="reading-v2-section"><legend><span class="step-dot">1</span>Co ćwiczymy?</legend>'+
    '<div class="reading-training-segmented reading-segmented" data-segmented="training">'+trainingChoices()+'</div></fieldset>'+
   '<fieldset class="reading-v2-section reading-level-wrap"><legend><span class="step-dot">2</span>Co czytamy?</legend>'+
    '<div class="reading-level-segmented reading-segmented" data-segmented="level">'+levelChoices()+'</div></fieldset>'+
   '<fieldset class="reading-v2-section reading-time-wrap"><legend><span class="step-dot" data-time-step>3</span>Ile mamy czasu?</legend>'+
    '<div class="reading-time-segmented reading-segmented" data-segmented="time">'+durationChoices()+'</div></fieldset>'+
  '</section>'+
  '<p class="wizard-note reading-hint"></p>'+
  '<p id="setup-error" role="status" hidden></p>'+
  '<button class="primary start-button" type="submit"><span data-start-copy>Zaczynamy!</span><span aria-hidden="true">→</span></button>';
 updateStartButton(false);
 syncTrainingUI(false);
 requestAnimationFrame(()=>{syncSegments(false);installDrag()});
}

root?.addEventListener('click',event=>{
 if(root.dataset.mode!=='reading'||root.dataset.view!=='wizard')return;
 const label=event.target.closest('.reading-segmented > label');
 if(!label)return;
 event.preventDefault();
 if(performance.now()<suppressClickUntil){
  event.stopPropagation();
  return;
 }
 const input=label.querySelector('input');
 if(!input||input.disabled)return;
 applySegmentSelection(input);
});

root?.addEventListener('change',event=>{
 if(root.dataset.mode!=='reading'||root.dataset.view!=='wizard'||!state)return;
 const target=event.target;
 if(target?.name==='readingTraining'){
  state.training=target.value==='memory'?'memory':'reading';
  updateSegment(target.closest('.reading-segmented'),state.training==='memory'?1:0,2,true);
  syncTrainingUI(true);
  return;
 }
 if(target?.name==='difficulty'){
  state.level=Number(target.value)||1;
  saveState();
  updateSegment(target.closest('.reading-segmented'),activeIndexFor(target.closest('.reading-segmented')),3,true);
  return;
 }
 if(target?.name==='duration'){
  state.duration=Number(target.value)||180;
  saveState();
  updateSegment(target.closest('.reading-segmented'),activeIndexFor(target.closest('.reading-segmented')),4,true);
  updateStartButton(true);
 }
});

window.addEventListener('resize',()=>{
 if(root?.dataset.mode==='reading'&&root.dataset.view==='wizard'&&state)requestAnimationFrame(()=>syncSegments(false));
},{passive:true});
window.addEventListener('orientationchange',()=>{
 if(root?.dataset.mode==='reading'&&root.dataset.view==='wizard'&&state)window.setTimeout(()=>syncSegments(false),120);
},{passive:true});

const observer=new MutationObserver(()=>requestAnimationFrame(install));
if(root){
 observer.observe(root,{childList:true,subtree:true});
 install();
}
