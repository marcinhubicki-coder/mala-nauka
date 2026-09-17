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
 const left=Math.max(inset,targetRect.left-containerRect.left+inset);
 const right=Math.max(inset,containerRect.right-targetRect.right+inset);
 const width=Math.max(0,containerRect.width-left-right);
 const center=left+(width/2);
 return {left,right,width,center};
}

function applyIndicator(indicator,geometry){
 indicator.style.left=`${geometry.left}px`;
 indicator.style.right=`${geometry.right}px`;
}

function currentGeometry(container,indicator){
 if(!indicator)return null;
 const containerRect=container.getBoundingClientRect();
 const rect=indicator.getBoundingClientRect();
 if(rect.width>0){
  const left=Math.max(0,rect.left-containerRect.left);
  const right=Math.max(0,containerRect.right-rect.right);
  const width=Math.max(0,containerRect.width-left-right);
  return {left,right,width,center:left+(width/2)};
 }
 const left=parseFloat(indicator.style.left);
 const right=parseFloat(indicator.style.right);
 if(Number.isFinite(left)&&Number.isFinite(right)){
  const width=Math.max(0,containerRect.width-left-right);
  return {left,right,width,center:left+(width/2)};
 }
 const activeIndex=Number(container.dataset.activeIndex);
 return segmentGeometry(container,Number.isFinite(activeIndex)?activeIndex:0);
}

function stopSegmentAnimation(container,indicator){
 const visual=currentGeometry(container,indicator);
 const animation=segmentAnimations.get(container);
 if(animation){
  try{animation.cancel();}catch{}
  segmentAnimations.delete(container);
 }
 if(visual)applyIndicator(indicator,visual);
 return visual;
}

function motionTiming(distancePx){
 const total=Math.min(1180,Math.max(780,Math.round(780+distancePx*0.72)));
 return {total};
}

// The leading side always moves first and never overshoots.
// The trailing side waits, stretches the bubble, overshoots once, then eases back home.
function buildSegmentFrames(previous,next,forward,overshoot){
 const leadingMid=.57;
 const trailingStart=.16;
 const trailingOvershoot=.72;
 const trailingSettle=.88;
 const trailingEase='cubic-bezier(.22,.02,.18,1)';
 const leadingEase='cubic-bezier(.24,.06,.18,1)';
 const settleEase='cubic-bezier(.18,.62,.2,1)';

 if(forward){
  // Forward = right side leads (right offset shrinks); left side trails.
  const leadMid=previous.right+(next.right-previous.right)*.72;
  const trailMid=previous.left+(next.left-previous.left)*.42;
  const trailOver=next.left+overshoot;
  const trailReturn=next.left-Math.max(2,overshoot*.18);
  return [
   {offset:0,left:`${previous.left}px`,right:`${previous.right}px`,easing:leadingEase},
   // Leading/right side accelerates first. Trailing/left edge stays put.
   {offset:trailingStart,left:`${previous.left}px`,right:`${leadMid}px`,easing:leadingEase},
   // Leading edge brakes into its final position without any overshoot.
   {offset:leadingMid,left:`${trailMid}px`,right:`${next.right}px`,easing:trailingEase},
   // Leading edge is parked. Trailing edge softly stretches past its target.
   {offset:trailingOvershoot,left:`${trailOver}px`,right:`${next.right}px`,easing:'cubic-bezier(.2,.12,.16,1)'},
   // Gentle recoil, deliberately a touch too far in the other direction.
   {offset:trailingSettle,left:`${trailReturn}px`,right:`${next.right}px`,easing:settleEase},
   // Long, soft landing.
   {offset:1,left:`${next.left}px`,right:`${next.right}px`}
  ];
 }

 // Backward = left side leads (left offset shrinks); right side trails.
 const leadMid=previous.left+(next.left-previous.left)*.72;
 const trailMid=previous.right+(next.right-previous.right)*.42;
 const trailOver=next.right+overshoot;
 const trailReturn=next.right-Math.max(2,overshoot*.18);
 return [
  {offset:0,left:`${previous.left}px`,right:`${previous.right}px`,easing:leadingEase},
  {offset:trailingStart,left:`${leadMid}px`,right:`${previous.right}px`,easing:leadingEase},
  {offset:leadingMid,left:`${next.left}px`,right:`${trailMid}px`,easing:trailingEase},
  {offset:trailingOvershoot,left:`${next.left}px`,right:`${trailOver}px`,easing:'cubic-bezier(.2,.12,.16,1)'},
  {offset:trailingSettle,left:`${next.left}px`,right:`${trailReturn}px`,easing:settleEase},
  {offset:1,left:`${next.left}px`,right:`${next.right}px`}
 ];
}

function updateSegment(container,index,count,animate=true){
 if(!container)return;
 const indicator=container.querySelector('.flag-segment-indicator');
 if(!indicator)return;
 const previousIndex=Number(container.dataset.activeIndex);
 const nextIndex=Math.max(0,Math.min(count-1,index));
 const nextGeometry=segmentGeometry(container,nextIndex);
 if(!nextGeometry)return;
 const hasPrevious=Number.isFinite(previousIndex);
 const changed=hasPrevious&&previousIndex!==nextIndex;
 const forward=!hasPrevious?true:nextIndex>previousIndex;
 container.dataset.direction=forward?'forward':'backward';
 container.dataset.activeIndex=String(nextIndex);

 const previousGeometry=stopSegmentAnimation(container,indicator)||nextGeometry;
 const timer=segmentTimers.get(container);
 if(timer)window.clearTimeout(timer);

 if(!animate||!changed){
  container.classList.add('is-segment-instant');
  applyIndicator(indicator,nextGeometry);
  requestAnimationFrame(()=>container.classList.remove('is-segment-instant'));
  container.classList.remove('is-segment-moving');
  return;
 }

 const distancePx=Math.abs(nextGeometry.center-previousGeometry.center);
 const {total}=motionTiming(distancePx);
 const overshoot=Math.min(22,Math.max(8,Math.round(distancePx*0.10)));
 const keyframes=buildSegmentFrames(previousGeometry,nextGeometry,forward,overshoot);

 applyIndicator(indicator,previousGeometry);
 container.classList.remove('is-segment-instant');
 container.classList.remove('is-segment-moving');
 void container.offsetWidth;
 container.classList.add('is-segment-moving');
 container.style.setProperty('--segment-total-ms',`${total}ms`);

 const animation=indicator.animate(keyframes,{duration:total,easing:'linear',fill:'forwards'});
 segmentAnimations.set(container,animation);
 const token=`${Date.now()}-${Math.random()}`;
 container.dataset.segmentToken=token;

 const finish=()=>{
  if(container.dataset.segmentToken!==token)return;
  applyIndicator(indicator,nextGeometry);
  if(segmentAnimations.get(container)===animation)segmentAnimations.delete(container);
  try{animation.cancel();}catch{}
  container.classList.remove('is-segment-moving');
 };

 animation.finished.then(finish).catch(finish);
 segmentTimers.set(container,window.setTimeout(()=>{
  finish();
  segmentTimers.delete(container);
 },total+120));
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
