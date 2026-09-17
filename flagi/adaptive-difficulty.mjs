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
const segmentAnimations=new WeakMap();
const segmentTimers=new WeakMap();

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
  <div class="flag-scope-toggle flag-segmented" data-scope-slider role="radiogroup" aria-label="Zakres państw">
   ${indicator()}
   <label>
    <input type="radio" name="flagScope" value="world" ${state.scope==='world'?'checked':''}>
    <span>Cały świat</span>
   </label>
   <label>
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

function motionTiming(current,target){
 const distance=Math.abs(target.center-current.center);
 const base=Math.min(1280,Math.max(860,Math.round(860+distance*.72)));
 // Lead-to-overshoot stays at the old tempo; the return/settle phase is 50% longer.
 const total=Math.round(base*1.23);
 const overshoot=Math.min(24,Math.max(8,Math.round(distance*.10)));
 return {total,overshoot};
}

function jellyFrames(current,target,forward,overshoot){
 const back=Math.max(4,Math.round(overshoot*.50));
 const bounce=Math.max(2,Math.round(overshoot*.20));

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

 const changed=Number.isFinite(previousIndex)&&previousIndex!==nextIndex;
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

function scopeTargetGeometry(container,index){
 if(!container)return null;
 const width=container.clientWidth;
 const inset=4;
 const half=width/2;
 if(index===0){
  const left=inset;
  const right=half+inset;
  return {left,right,width:Math.max(0,width-left-right),center:(left+(width-right))/2};
 }
 const left=half+inset;
 const right=inset;
 return {left,right,width:Math.max(0,width-left-right),center:(left+(width-right))/2};
}

function updateScopeSegment(animate=false){
 const container=root.querySelector('[data-scope-slider]');
 if(!container)return;
 const indicator=container.querySelector('.flag-segment-indicator');
 if(!indicator)return;

 const previousIndex=Number(container.dataset.activeIndex);
 const nextIndex=state.scope==='continents'?1:0;
 const target=scopeTargetGeometry(container,nextIndex);
 if(!target)return;

 const changed=Number.isFinite(previousIndex)&&previousIndex!==nextIndex;
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

 const timing=motionTiming(current,target);
 container.style.setProperty('--segment-total-ms',`${timing.total}ms`);
 container.classList.remove('is-segment-moving');
 void container.offsetWidth;
 container.classList.add('is-segment-moving');

 const animation=indicator.animate(
  jellyFrames(current,target,nextIndex>previousIndex,timing.overshoot),
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

function syncSegmentedControls(animate=false){
 const game=root.querySelector('[data-segmented="game"]');
 const gameIndex=Math.max(0,GAME_TYPES.findIndex(([id])=>id===state.gameType));
 updateSegment(game,gameIndex,GAME_TYPES.length,animate);

 const time=root.querySelector('[data-segmented="time"]');
 const timeIndex=Math.max(0,DURATIONS.indexOf(state.duration));
 updateSegment(time,timeIndex,DURATIONS.length,animate);
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
 // Scope animation is deliberately independent from the expanding continent tray.
 updateScopeSegment(animate);
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
   <legend><span class="step-dot">2</span>Zakres</legend>
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
 requestAnimationFrame(()=>{syncSegmentedControls(false);updateScopeSegment(false);});
}

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
  requestAnimationFrame(()=>{syncSegmentedControls(false);updateScopeSegment(false);});
 }
},{passive:true});

window.addEventListener('orientationchange',()=>{
 if(root?.dataset.mode==='flags'&&root.dataset.view==='wizard'&&state){
  window.setTimeout(()=>{syncSegmentedControls(false);updateScopeSegment(false);},120);
 }
},{passive:true});

const observer=new MutationObserver(()=>requestAnimationFrame(install));
if(root){
 observer.observe(root,{childList:true,subtree:true});
 install();
}
