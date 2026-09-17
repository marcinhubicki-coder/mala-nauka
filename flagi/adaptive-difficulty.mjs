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
let segmentTimer=0;

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

function motionTiming(distance){
 const hops=Math.max(1,distance||1);
 // About 30% slower than the previous motion, then progressively longer for longer jumps.
 const total=Math.min(980,720+(hops-1)*110);
 return {
  total,
  lead:Math.round(total*.76),
  trail:Math.round(total*.82),
  delay:Math.round(total*.18)
 };
}

function updateSegment(container,index,count,animate=true){
 if(!container)return;
 const previous=Number(container.dataset.activeIndex);
 const next=Math.max(0,Math.min(count-1,index));
 const geometry=segmentGeometry(container,next);
 if(!geometry)return;
 const changed=Number.isFinite(previous)&&previous!==next;
 const distance=changed?Math.abs(next-previous):0;
 const timing=motionTiming(distance);

 if(changed)container.dataset.direction=next>previous?'forward':'backward';
 else if(!container.dataset.direction)container.dataset.direction='forward';
 container.dataset.activeIndex=String(next);
 container.style.setProperty('--segment-lead-ms',`${timing.lead}ms`);
 container.style.setProperty('--segment-trail-ms',`${timing.trail}ms`);
 container.style.setProperty('--segment-delay-ms',`${timing.delay}ms`);

 if(!animate||!changed){
  container.classList.add('is-segment-instant');
  container.style.setProperty('--segment-left',`${geometry.left}px`);
  container.style.setProperty('--segment-right',`${geometry.right}px`);
  requestAnimationFrame(()=>container.classList.remove('is-segment-instant'));
  return;
 }

 container.classList.remove('is-segment-instant');
 container.classList.remove('is-segment-moving');
 void container.offsetWidth;
 container.classList.add('is-segment-moving');
 container.style.setProperty('--segment-left',`${geometry.left}px`);
 container.style.setProperty('--segment-right',`${geometry.right}px`);
 window.clearTimeout(segmentTimer);
 segmentTimer=window.setTimeout(()=>container.classList.remove('is-segment-moving'),timing.total+80);
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

const observer=new MutationObserver(()=>requestAnimationFrame(install));
if(root){
 observer.observe(root,{childList:true,subtree:true});
 install();
}
