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
  <div class="flag-scope-toggle flag-segmented" data-segmented="scope" role="radiogroup" aria-label="Zakres państw">
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
 return {
  left:Math.max(inset,targetRect.left-containerRect.left+inset),
  right:Math.max(inset,containerRect.right-targetRect.right+inset)
 };
}

function indicatorGeometry(container,indicator){
 const containerRect=container.getBoundingClientRect();
 const rect=indicator.getBoundingClientRect();
 return {
  left:Math.max(0,rect.left-containerRect.left),
  right:Math.max(0,containerRect.right-rect.right)
 };
}

function lerp(a,b,t){
 return a+(b-a)*t;
}

function motionTiming(container,current,target){
 const width=Math.max(1,container.clientWidth);
 const currentCenter=(current.left+(width-current.right))/2;
 const targetCenter=(target.left+(width-target.right))/2;
 const distance=Math.abs(targetCenter-currentCenter);
 const ratio=Math.min(1,distance/width);
 // Longer travel = more time. One-segment hops sit around 0.9s, long jumps a little over 1s.
 const total=Math.round(Math.min(1120,800+ratio*360));
 const overshoot=Math.max(8,Math.min(24,distance*.09));
 return {total,overshoot,distance};
}

function jellyFrames(current,target,forward,overshoot){
 const trailOvershoot=Math.min(4,overshoot*.14);
 const o2=overshoot*.58;
 const o3=overshoot*.26;
 const o4=overshoot*.08;
 const easeA='cubic-bezier(.34,.02,.16,1)';
 const easeB='cubic-bezier(.38,.01,.18,1)';
 const easeC='cubic-bezier(.3,.02,.2,1)';
 const easeD='cubic-bezier(.24,.04,.2,1)';
 const easeE='cubic-bezier(.18,.72,.22,1)';

 if(forward){
  return [
   {left:`${current.left}px`,right:`${current.right}px`,offset:0,easing:easeA},
   // The far/right edge shoots beyond the destination while the rear edge stays put.
   {left:`${current.left}px`,right:`${target.right-overshoot}px`,offset:.36,easing:easeB},
   // It recoils too far; the trailing edge only now starts catching up.
   {left:`${lerp(current.left,target.left,.45)}px`,right:`${target.right+o2}px`,offset:.58,easing:easeC},
   // A smaller second overshoot creates the jelly wobble.
   {left:`${lerp(current.left,target.left,.84)}px`,right:`${target.right-o3}px`,offset:.76,easing:easeD},
   {left:`${target.left+trailOvershoot}px`,right:`${target.right+o4}px`,offset:.9,easing:easeE},
   {left:`${target.left}px`,right:`${target.right}px`,offset:1}
  ];
 }

 return [
  {left:`${current.left}px`,right:`${current.right}px`,offset:0,easing:easeA},
  // Mirror image: the far/left edge leads.
  {left:`${target.left-overshoot}px`,right:`${current.right}px`,offset:.36,easing:easeB},
  {left:`${target.left+o2}px`,right:`${lerp(current.right,target.right,.45)}px`,offset:.58,easing:easeC},
  {left:`${target.left-o3}px`,right:`${lerp(current.right,target.right,.84)}px`,offset:.76,easing:easeD},
  {left:`${target.left+o4}px`,right:`${target.right+trailOvershoot}px`,offset:.9,easing:easeE},
  {left:`${target.left}px`,right:`${target.right}px`,offset:1}
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
 const previous=Number(container.dataset.activeIndex);
 const next=Math.max(0,Math.min(count-1,index));
 const target=segmentGeometry(container,next);
 if(!target)return;
 const changed=Number.isFinite(previous)&&previous!==next;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const current=stopSegmentAnimation(container,indicator);

 container.dataset.activeIndex=String(next);
 container.dataset.direction=changed&&next<previous?'backward':'forward';

 const timer=segmentTimers.get(container);
 if(timer)window.clearTimeout(timer);

 if(!animate||!changed||reduced||typeof indicator.animate!=='function'){
  indicator.style.left=`${target.left}px`;
  indicator.style.right=`${target.right}px`;
  container.classList.remove('is-segment-moving');
  return;
 }

 const forward=next>previous;
 const timing=motionTiming(container,current,target);
 container.style.setProperty('--segment-total-ms',`${timing.total}ms`);
 container.classList.remove('is-segment-moving');
 void container.offsetWidth;
 container.classList.add('is-segment-moving');

 const animation=indicator.animate(
  jellyFrames(current,target,forward,timing.overshoot),
  {duration:timing.total,easing:'linear',fill:'both'}
 );
 segmentAnimations.set(container,animation);

 // Keep the final geometry in regular styles after the WAAPI animation releases its layer.
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
 animation.addEventListener('cancel',()=>{}, {once:true});
 const cleanup=window.setTimeout(finish,timing.total+90);
 segmentTimers.set(container,cleanup);
}

function syncSegmentedControls(animate=false){
 const game=root.querySelector('[data-segmented="game"]');
 const gameIndex=Math.max(0,GAME_TYPES.findIndex(([id])=>id===state.gameType));
 updateSegment(game,gameIndex,GAME_TYPES.length,animate);

 const scope=root.querySelector('[data-segmented="scope"]');
 updateSegment(scope,state.scope==='continents'?1:0,2,animate);

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
 syncSegmentedControls(animate);
 if(open)requestAnimationFrame(()=>syncSegmentedControls(false));
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
 requestAnimationFrame(()=>syncSegmentedControls(false));
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
