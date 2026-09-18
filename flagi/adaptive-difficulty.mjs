const root=document.querySelector('#app');
const STORAGE_KEY='malaNauka.v1.flagsWizardV2';
const GAME_TYPES=[
 ['flags','Flagi'],
 ['countries','Państwa'],
 ['capitals','Stolice']
];
const CONTINENTS=[
 ['europe','Europa'],
 ['asia','Azja'],
 ['africa','Afryka'],
 ['north-america','Ameryka Północna'],
 ['south-america','Ameryka Południowa']
];
const DURATIONS=[60,120,180,300];
const START_COPY={
 60:'Szybka akcja!',
 120:'Zaczynamy!',
 180:'Dłuższa misja!',
 300:'Jesteś pewien?'
};
const NOTES={
 flags:'Rozpoznawaj flagi i odkrywaj, gdzie leżą państwa.',
 countries:'Patrz na nazwę państwa i wybierz jego flagę.',
 capitals:'Połącz stolicę z właściwym państwem.'
};

let state=null;
let suppressClickUntil=0;
const segmentAnimations=new WeakMap();
const segmentTimers=new WeakMap();
const dragStates=new WeakMap();

function readState(fallbackDuration=60){
 try{
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
  if(saved&&typeof saved==='object'){
   const continents=Array.isArray(saved.continents)?saved.continents.filter(id=>CONTINENTS.some(([key])=>key===id)):[];
   return {
    gameType:GAME_TYPES.some(([id])=>id===saved.gameType)?saved.gameType:'flags',
    scope:saved.scope==='continents'?'continents':'world',
    continents:continents.length?continents:['europe'],
    duration:DURATIONS.includes(Number(saved.duration))?Number(saved.duration):fallbackDuration
   };
  }
 }catch{}
 return {gameType:'flags',scope:'world',continents:['europe'],duration:fallbackDuration};
}

function saveState(){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}
}

function encodeCategory(){
 if(state.scope!=='continents'||state.continents.length===CONTINENTS.length)return `flagcfg:${state.gameType}:world:`;
 return `flagcfg:${state.gameType}:continents:${state.continents.join(',')}`;
}

function escape(value){
 return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function indicator(){
 return '<span class="flag-segment-indicator" aria-hidden="true"></span>';
}

function gameTypeChoices(){
 return `${indicator()}${GAME_TYPES.map(([id,label])=>`
  <label class="flag-v2-choice">
   <input type="radio" name="flagGameType" value="${id}" ${state.gameType===id?'checked':''}>
   <span>${label}</span>
  </label>`).join('')}`;
}

function scopeChoices(){
 return `
  <div class="flag-v2-game-grid flag-v2-scope-grid flag-segmented" data-segmented="scope" role="radiogroup" aria-label="Zakres państw">
   ${indicator()}
   <label class="flag-v2-choice">
    <input type="radio" name="flagScope" value="world" ${state.scope==='world'?'checked':''}>
    <span>Cały świat</span>
   </label>
   <label class="flag-v2-choice">
    <input type="radio" name="flagScope" value="continents" ${state.scope==='continents'?'checked':''}>
    <span>Kontynenty</span>
   </label>
  </div>`;
}

function continentChoices(){
 return CONTINENTS.map(([id,label])=>`
  <label class="flag-continent-chip ${id.includes('america')?'wide':''}">
   <input type="checkbox" name="flagContinents" value="${id}" ${state.continents.includes(id)?'checked':''}>
   <span>${label}</span>
  </label>`).join('');
}

function durationChoices(){
 return `${indicator()}${DURATIONS.map(seconds=>`
  <label class="flag-time-choice">
   <input type="radio" name="duration" value="${seconds}" ${state.duration===seconds?'checked':''}>
   <span>${seconds/60} min</span>
  </label>`).join('')}`;
}

function segmentGeometry(container,index){
 const labels=[...container.querySelectorAll(':scope > label')];
 const target=labels[index];
 if(!target)return null;
 const containerRect=container.getBoundingClientRect();
 const targetRect=target.getBoundingClientRect();
 const inset=4;
 const left=Math.max(inset,targetRect.left-containerRect.left+inset);
 const right=Math.max(inset,containerRect.right-targetRect.right+inset);
 const width=Math.max(0,containerRect.width-left-right);
 return {left,right,width,center:left+width/2};
}

function indicatorGeometry(container,indicator){
 const containerRect=container.getBoundingClientRect();
 const rect=indicator.getBoundingClientRect();
 const left=Math.max(0,rect.left-containerRect.left);
 const right=Math.max(0,containerRect.right-rect.right);
 const width=Math.max(0,containerRect.width-left-right);
 return {left,right,width,center:left+width/2};
}

function lerp(a,b,t){
 return a+(b-a)*t;
}
function clamp(value,min,max){
 return Math.max(min,Math.min(max,value));
}

function motionTiming(current,target){
 const distance=Math.abs(target.center-current.center);
 const base=Math.min(1280,Math.max(860,Math.round(860+distance*.72)));
 // Lead-to-overshoot stays at the old tempo; the return/settle phase is 50% longer.
 const total=Math.round(base*1.23);
 const overshoot=Math.min(18,Math.max(6,Math.round(distance*.075)));
 return {total,overshoot};
}

function jellyFrames(current,target,forward,overshoot){
 const back=Math.max(3,Math.round(overshoot*.38));
 const bounce=Math.max(1,Math.round(overshoot*.12));

 // Leading edge: starts first, never overshoots. It accelerates, brakes and quietly settles.
 // Trailing edge: starts later, creates stretch, overshoots and spends a longer time returning.
 if(forward){
  return [
   {offset:0,left:`${current.left}px`,right:`${current.right}px`,easing:'cubic-bezier(.30,.04,.22,1)'},
   {offset:.13,left:`${current.left}px`,right:`${lerp(current.right,target.right,.58)}px`,easing:'cubic-bezier(.18,.78,.22,1)'},
   {offset:.31,left:`${lerp(current.left,target.left,.26)}px`,right:`${lerp(current.right,target.right,.93)}px`,easing:'cubic-bezier(.16,.84,.20,1)'},
   {offset:.44,left:`${target.left+overshoot}px`,right:`${lerp(current.right,target.right,.992)}px`,easing:'cubic-bezier(.14,.80,.18,1)'},
   {offset:.69,left:`${target.left-back}px`,right:`${target.right}px`,easing:'cubic-bezier(.16,.76,.18,1)'},
   {offset:.86,left:`${target.left+bounce}px`,right:`${target.right}px`,easing:'cubic-bezier(.12,.70,.16,1)'},
   {offset:1,left:`${target.left}px`,right:`${target.right}px`}
  ];
 }

 return [
  {offset:0,left:`${current.left}px`,right:`${current.right}px`,easing:'cubic-bezier(.30,.04,.22,1)'},
  {offset:.13,left:`${lerp(current.left,target.left,.58)}px`,right:`${current.right}px`,easing:'cubic-bezier(.18,.78,.22,1)'},
  {offset:.31,left:`${lerp(current.left,target.left,.93)}px`,right:`${lerp(current.right,target.right,.26)}px`,easing:'cubic-bezier(.16,.84,.20,1)'},
  {offset:.44,left:`${lerp(current.left,target.left,.992)}px`,right:`${target.right+overshoot}px`,easing:'cubic-bezier(.14,.80,.18,1)'},
  {offset:.69,left:`${target.left}px`,right:`${target.right-back}px`,easing:'cubic-bezier(.16,.76,.18,1)'},
  {offset:.86,left:`${target.left}px`,right:`${target.right+bounce}px`,easing:'cubic-bezier(.12,.70,.16,1)'},
  {offset:1,left:`${target.left}px`,right:`${target.right}px`}
 ];
}

function stopSegmentAnimation(container,indicator){
 const animation=segmentAnimations.get(container);
 if(!animation)return indicatorGeometry(container,indicator);
 const visual=indicatorGeometry(container,indicator);
 try{animation.cancel();}catch{}
 segmentAnimations.delete(container);
 indicator.style.left=`${visual.left}px`;
 indicator.style.right=`${visual.right}px`;
 return visual;
}

function updateSegment(container,index,count,animate=true){
 if(!container)return;
 const indicator=container.querySelector('.flag-segment-indicator');
 if(!indicator)return;

 const previousIndex=Number(container.dataset.activeIndex);
 const nextIndex=Math.max(0,Math.min(count-1,index));
 const target=segmentGeometry(container,nextIndex);
 if(!target)return;

 const changed=Number.isFinite(previousIndex)&&Math.abs(previousIndex-nextIndex)>.001;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const current=stopSegmentAnimation(container,indicator);

 container.dataset.activeIndex=String(nextIndex);
 container.dataset.direction=changed&&nextIndex<previousIndex?'backward':'forward';

 const timer=segmentTimers.get(container);
 if(timer)window.clearTimeout(timer);

 if(!animate||!changed||reduced||typeof indicator.animate!=='function'){
  indicator.style.left=`${target.left}px`;
  indicator.style.right=`${target.right}px`;
  container.classList.remove('is-segment-moving');
  return;
 }

 const forward=nextIndex>previousIndex;
 const timing=motionTiming(current,target);
 container.style.setProperty('--segment-total-ms',`${timing.total}ms`);
 container.classList.remove('is-segment-moving');
 void container.offsetWidth;
 container.classList.add('is-segment-moving');

 const animation=indicator.animate(
  jellyFrames(current,target,forward,timing.overshoot),
  {duration:timing.total,easing:'linear',fill:'both'}
 );
 segmentAnimations.set(container,animation);

 indicator.style.left=`${target.left}px`;
 indicator.style.right=`${target.right}px`;

 const finish=()=>{
  if(segmentAnimations.get(container)===animation){
   segmentAnimations.delete(container);
   try{animation.cancel();}catch{}
   container.classList.remove('is-segment-moving');
  }
 };
 animation.addEventListener('finish',finish,{once:true});
 const cleanup=window.setTimeout(finish,timing.total+120);
 segmentTimers.set(container,cleanup);
}

function segmentCount(container){
 return container?.querySelectorAll(':scope > label').length||0;
}
function activeIndexFor(container){
 const type=container?.dataset.segmented;
 if(type==='game')return Math.max(0,GAME_TYPES.findIndex(([id])=>id===state.gameType));
 if(type==='scope')return state.scope==='continents'?1:0;
 if(type==='time')return Math.max(0,DURATIONS.indexOf(state.duration));
 return 0;
}
function syncSegmentedControls(animate=false){
 root.querySelectorAll('.flag-segmented').forEach(container=>{
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

function applySegmentSelection(input){
 if(!input||input.disabled)return;
 const container=input.closest('.flag-segmented');
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
  const indicator=container.querySelector('.flag-segment-indicator');
  if(!indicator)return;
  const rect=container.getBoundingClientRect();
  dragStates.set(container,{pointerId:event.pointerId,startX:event.clientX,moved:false,rect,currentIndex:activeIndexFor(container)});
  stopSegmentAnimation(container,indicator);
  container.classList.add('is-dragging');
  try{container.setPointerCapture(event.pointerId);}catch{}
 });
 container.addEventListener('pointermove',event=>{
  const drag=dragStates.get(container);
  if(!drag||drag.pointerId!==event.pointerId)return;
  if(Math.abs(event.clientX-drag.startX)>4)drag.moved=true;
  if(!drag.moved)return;
  event.preventDefault();
  const count=segmentCount(container);
  const local=clamp(event.clientX-drag.rect.left,4,drag.rect.width-4);
  const progress=clamp((local-4)/Math.max(1,drag.rect.width-8),0,1)*(count-1);
  const low=Math.floor(progress),high=Math.ceil(progress),mix=progress-low;
  const a=segmentGeometry(container,low),b=segmentGeometry(container,high);
  const indicator=container.querySelector('.flag-segment-indicator');
  if(!a||!b||!indicator)return;
  indicator.style.left=lerp(a.left,b.left,mix)+'px';
  indicator.style.right=lerp(a.right,b.right,mix)+'px';
  container.dataset.activeIndex=String(progress);
 });
 const finish=(event,cancelled=false)=>{
  const drag=dragStates.get(container);
  if(!drag||drag.pointerId!==event.pointerId)return;
  dragStates.delete(container);
  container.classList.remove('is-dragging');
  try{container.releasePointerCapture(event.pointerId);}catch{}
  if(cancelled){
   updateSegment(container,activeIndexFor(container),segmentCount(container),true);
   return;
  }
  if(!drag.moved){
   updateSegment(container,activeIndexFor(container),segmentCount(container),true);
   return;
  }
  suppressClickUntil=performance.now()+350;
  const labels=[...container.querySelectorAll(':scope > label')];
  let index=drag.currentIndex;
  if(event.clientX>drag.startX){
   for(let i=drag.currentIndex+1;i<labels.length;i++){
    const r=labels[i].getBoundingClientRect();
    if(event.clientX>=(r.left+r.right)/2)index=i;
   }
  }else{
   for(let i=drag.currentIndex-1;i>=0;i--){
    const r=labels[i].getBoundingClientRect();
    if(event.clientX<=(r.left+r.right)/2)index=i;
   }
  }
  const input=labels[index]?.querySelector('input');
  if(input)applySegmentSelection(input);
 };
 container.addEventListener('pointerup',event=>finish(event,false));
 container.addEventListener('pointercancel',event=>finish(event,true));
}

function installDrag(){
 root.querySelectorAll('.flag-segmented').forEach(setupDrag);
}

function updateStartButton(animate=false){
 const button=root.querySelector('.start-button');
 if(!button)return;
 const next=START_COPY[state.duration]||'Zaczynamy!';
 let copy=button.querySelector('[data-start-copy]');
 if(!copy){
  button.innerHTML='<span data-start-copy></span><span aria-hidden="true">→</span>';
  copy=button.querySelector('[data-start-copy]');
 }
 if(copy.textContent!==next){
  copy.textContent=next;
  if(animate){
   button.classList.remove('flag-start-pop');
   void button.offsetWidth;
   button.classList.add('flag-start-pop');
  }
 }
}

function updateNote(){
 const note=root.querySelector('.wizard-note');
 if(note)note.textContent=NOTES[state.gameType]||NOTES.flags;
}

function syncPanel(animate=false){
 const panel=root.querySelector('[data-continent-panel]');
 const open=state.scope==='continents';
 if(panel){
  panel.classList.toggle('is-open',open);
  panel.setAttribute('aria-hidden',open?'false':'true');
 }
 root.querySelectorAll('input[name="flagScope"]').forEach(input=>{input.checked=input.value===state.scope;});
 syncSegmentedControls(animate);
}

function syncHidden(dispatch=true){
 const category=root.querySelector('input[name="category"]');
 if(!category)return;
 const next=encodeCategory();
 const changed=category.value!==next;
 category.value=next;
 saveState();
 if(dispatch&&changed)category.dispatchEvent(new Event('change',{bubbles:true}));
}

function setWorldFromAllContinents(){
 if(state.continents.length!==CONTINENTS.length)return false;
 state.scope='world';
 state.continents=['europe'];
 return true;
}

function install(){
 if(!root||root.dataset.mode!=='flags'||root.dataset.view!=='wizard')return;
 const card=root.querySelector('.setup-card');
 if(!card||card.dataset.flagsWizardV2==='true')return;

 const existingDuration=Number(root.querySelector('input[name="duration"]:checked')?.value)||60;
 state=state||readState(existingDuration);
 if(!DURATIONS.includes(state.duration))state.duration=existingDuration;

 card.dataset.flagsWizardV2='true';
 card.classList.add('flag-wizard-v2');
 card.innerHTML=`
  <input id="category" type="hidden" name="category" value="${escape(encodeCategory())}">
  <input type="hidden" name="difficulty" value="1">

  <fieldset class="flag-v2-section flag-v2-game">
   <legend><span class="step-dot">1</span>Rodzaj rozgrywki</legend>
   <div class="flag-v2-game-grid flag-segmented" data-segmented="game">${gameTypeChoices()}</div>
  </fieldset>

  <fieldset class="flag-v2-section flag-v2-scope">
   <legend><span class="step-dot">2</span>Co Cię interesuje?</legend>
   ${scopeChoices()}
   <div class="flag-continent-panel ${state.scope==='continents'?'is-open':''}" data-continent-panel aria-hidden="${state.scope==='continents'?'false':'true'}">
    <div class="flag-continent-grid">${continentChoices()}</div>
   </div>
  </fieldset>

  <fieldset class="flag-v2-section flag-v2-time">
   <legend><span class="step-dot">3</span>Jak długo dasz radę?</legend>
   <div class="flag-time-segmented flag-segmented" data-segmented="time" role="radiogroup" aria-label="Czas rozgrywki">${durationChoices()}</div>
  </fieldset>`;

 updateStartButton(false);
 updateNote();
 syncPanel(false);
 syncHidden(true);
 requestAnimationFrame(()=>{syncSegmentedControls(false);installDrag();});
}

root?.addEventListener('click',event=>{
 if(root.dataset.mode!=='flags'||root.dataset.view!=='wizard')return;
 const label=event.target.closest('.flag-segmented > label');
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
 if(root.dataset.mode!=='flags'||root.dataset.view!=='wizard'||!state)return;
 const target=event.target;
 if(target?.name==='flagGameType'){
  state.gameType=target.value;
  updateNote();
  syncSegmentedControls(true);
  syncHidden(true);
  return;
 }
 if(target?.name==='flagScope'){
  state.scope=target.value==='continents'?'continents':'world';
  if(state.scope==='continents'&&!state.continents.length)state.continents=['europe'];
  syncPanel(true);
  syncHidden(true);
  return;
 }
 if(target?.name==='flagContinents'){
  const chip=target.closest('.flag-continent-chip');
  if(chip){
   chip.classList.remove('is-selecting','is-deselecting');
   void chip.offsetWidth;
   chip.classList.add(target.checked?'is-selecting':'is-deselecting');
   window.setTimeout(()=>chip.classList.remove('is-selecting','is-deselecting'),560);
  }
  const checked=[...root.querySelectorAll('input[name="flagContinents"]:checked')].map(input=>input.value);
  if(!checked.length){
   state.continents=['europe'];
   const europe=root.querySelector('input[name="flagContinents"][value="europe"]');
   if(europe)europe.checked=true;
  }else{
   state.continents=checked;
  }
  const switched=setWorldFromAllContinents();
  syncPanel(switched);
  syncHidden(true);
  if(switched)requestAnimationFrame(()=>syncPanel(false));
  return;
 }
 if(target?.name==='duration'){
  state.duration=Number(target.value)||60;
  saveState();
  syncSegmentedControls(true);
  updateStartButton(true);
 }
});

window.addEventListener('resize',()=>{
 if(root?.dataset.mode==='flags'&&root.dataset.view==='wizard'&&state){
  requestAnimationFrame(()=>syncSegmentedControls(false));
 }
},{passive:true});

window.addEventListener('orientationchange',()=>{
 if(root?.dataset.mode==='flags'&&root.dataset.view==='wizard'&&state){
  window.setTimeout(()=>syncSegmentedControls(false),120);
 }
},{passive:true});

const observer=new MutationObserver(()=>requestAnimationFrame(install));
if(root){
 observer.observe(root,{childList:true,subtree:true});
 install();
}
