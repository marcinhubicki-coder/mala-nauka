
const root=document.querySelector('#app');
const STORAGE_KEY='malaNauka.v1.englishWizardV2';
const CATEGORIES=[
 ['numbers','Liczby'],['colors','Kolory'],['family','Rodzina'],['people','Ludzie'],['body','Ciało'],
 ['home','Dom'],['objects','Przedmioty'],['school','Szkoła'],['food','Jedzenie'],['animals','Zwierzęta'],
 ['nature','Natura'],['places','Miejsca'],['transport','Transport'],['clothes','Ubrania'],['jobs','Zawody'],
 ['verbs','Czasowniki'],['adjectives','Przymiotniki'],['time','Czas']
];
const LEVELS=[[1,'Znaczenie'],[2,'Pisownia'],[3,'Trudniejsza pisownia']];
const DURATIONS=[60,120,180,300];
let state=null;
const segmentAnimations=new WeakMap();
const segmentTimers=new WeakMap();

function parseCategory(value){
 const raw=String(value||'all');
 if(raw.startsWith('engcfg:')){
  const parts=raw.split(':');
  const categories=String(parts[2]||'').split(',').filter(id=>CATEGORIES.some(([key])=>key===id));
  return {scope:parts[1]==='categories'&&categories.length?'categories':'all',categories:categories.length?categories:['numbers']};
 }
 if(raw!=='all'&&CATEGORIES.some(([id])=>id===raw))return {scope:'categories',categories:[raw]};
 return {scope:'all',categories:['numbers']};
}

function readState(fallback){
 try{
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
  if(saved&&typeof saved==='object'){
   const categories=Array.isArray(saved.categories)?saved.categories.filter(id=>CATEGORIES.some(([key])=>key===id)):[];
   return {
    scope:saved.scope==='categories'?'categories':'all',
    categories:categories.length?categories:['numbers'],
    difficulty:[1,2,3].includes(Number(saved.difficulty))?Number(saved.difficulty):fallback.difficulty,
    duration:DURATIONS.includes(Number(saved.duration))?Number(saved.duration):fallback.duration
   };
  }
 }catch{}
 const parsed=parseCategory(fallback.category);
 return {scope:parsed.scope,categories:parsed.categories,difficulty:fallback.difficulty,duration:fallback.duration};
}

function saveState(){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}
}

function encodeCategory(){
 if(state.scope!=='categories'||state.categories.length===CATEGORIES.length)return 'engcfg:all:';
 return 'engcfg:categories:'+state.categories.join(',');
}

function esc(value){
 return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function indicator(){
 return '<span class="english-segment-indicator" aria-hidden="true"></span>';
}

function scopeChoices(){
 return '<div class="english-v2-scope-grid english-segmented" data-segmented="scope" role="radiogroup" aria-label="Zakres słówek">'+
  indicator()+
  '<label class="english-v2-choice"><input type="radio" name="englishScope" value="all" '+(state.scope==='all'?'checked':'')+'><span>Wszystkie słówka</span></label>'+
  '<label class="english-v2-choice"><input type="radio" name="englishScope" value="categories" '+(state.scope==='categories'?'checked':'')+'><span>Kategorie</span></label>'+
  '</div>';
}

function categoryChoices(){
 return CATEGORIES.map(([id,label])=>
  '<label class="english-category-chip"><input type="checkbox" name="englishCategories" value="'+id+'" '+(state.categories.includes(id)?'checked':'')+'><span>'+esc(label)+'</span></label>'
 ).join('');
}

function levelChoices(){
 return indicator()+LEVELS.map(([value,label])=>
  '<label class="english-v2-choice"><input type="radio" name="difficulty" value="'+value+'" '+(state.difficulty===value?'checked':'')+'><span>'+esc(label)+'</span></label>'
 ).join('');
}

function durationChoices(){
 return indicator()+DURATIONS.map(seconds=>
  '<label class="english-time-choice"><input type="radio" name="duration" value="'+seconds+'" '+(state.duration===seconds?'checked':'')+'><span>'+(seconds/60)+' min</span></label>'
 ).join('');
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

function indicatorGeometry(container,indicatorNode){
 const containerRect=container.getBoundingClientRect();
 const rect=indicatorNode.getBoundingClientRect();
 const left=Math.max(0,rect.left-containerRect.left);
 const right=Math.max(0,containerRect.right-rect.right);
 const width=Math.max(0,containerRect.width-left-right);
 return {left,right,width,center:left+width/2};
}

function lerp(a,b,t){return a+(b-a)*t;}

function motionTiming(current,target){
 const distance=Math.abs(target.center-current.center);
 const base=Math.min(1280,Math.max(860,Math.round(860+distance*.72)));
 const total=Math.round(base*1.23);
 const overshoot=Math.min(18,Math.max(6,Math.round(distance*.075)));
 return {total,overshoot};
}

function jellyFrames(current,target,forward,overshoot){
 const back=Math.max(3,Math.round(overshoot*.38));
 const bounce=Math.max(1,Math.round(overshoot*.12));
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

function stopSegmentAnimation(container,indicatorNode){
 const animation=segmentAnimations.get(container);
 if(!animation)return indicatorGeometry(container,indicatorNode);
 const visual=indicatorGeometry(container,indicatorNode);
 try{animation.cancel();}catch{}
 segmentAnimations.delete(container);
 indicatorNode.style.left=visual.left+'px';
 indicatorNode.style.right=visual.right+'px';
 return visual;
}

function updateSegment(container,index,count,animate=true){
 if(!container)return;
 const indicatorNode=container.querySelector('.english-segment-indicator');
 if(!indicatorNode)return;
 const previousIndex=Number(container.dataset.activeIndex);
 const nextIndex=Math.max(0,Math.min(count-1,index));
 const target=segmentGeometry(container,nextIndex);
 if(!target)return;
 const changed=Number.isFinite(previousIndex)&&previousIndex!==nextIndex;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const current=stopSegmentAnimation(container,indicatorNode);
 container.dataset.activeIndex=String(nextIndex);
 container.dataset.direction=changed&&nextIndex<previousIndex?'backward':'forward';
 const timer=segmentTimers.get(container);
 if(timer)window.clearTimeout(timer);
 if(!animate||!changed||reduced||typeof indicatorNode.animate!=='function'){
  indicatorNode.style.left=target.left+'px';
  indicatorNode.style.right=target.right+'px';
  container.classList.remove('is-segment-moving');
  return;
 }
 const timing=motionTiming(current,target);
 container.style.setProperty('--segment-total-ms',timing.total+'ms');
 container.classList.remove('is-segment-moving');
 void container.offsetWidth;
 container.classList.add('is-segment-moving');
 const animation=indicatorNode.animate(jellyFrames(current,target,nextIndex>previousIndex,timing.overshoot),{duration:timing.total,easing:'linear',fill:'both'});
 segmentAnimations.set(container,animation);
 indicatorNode.style.left=target.left+'px';
 indicatorNode.style.right=target.right+'px';
 const finish=()=>{
  if(segmentAnimations.get(container)===animation){
   segmentAnimations.delete(container);
   try{animation.cancel();}catch{}
   container.classList.remove('is-segment-moving');
  }
 };
 animation.addEventListener('finish',finish,{once:true});
 segmentTimers.set(container,window.setTimeout(finish,timing.total+120));
}

function syncSegments(animate=false){
 updateSegment(root.querySelector('[data-segmented="scope"]'),state.scope==='categories'?1:0,2,animate);
 updateSegment(root.querySelector('[data-segmented="level"]'),Math.max(0,LEVELS.findIndex(([value])=>value===state.difficulty)),3,animate);
 updateSegment(root.querySelector('[data-segmented="time"]'),Math.max(0,DURATIONS.indexOf(state.duration)),4,animate);
}

function syncPanel(animate=false){
 const panel=root.querySelector('[data-category-panel]');
 const open=state.scope==='categories';
 if(panel){
  panel.classList.toggle('is-open',open);
  panel.setAttribute('aria-hidden',open?'false':'true');
 }
 root.querySelectorAll('input[name="englishScope"]').forEach(input=>{input.checked=input.value===state.scope;});
 syncSegments(animate);
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

function install(){
 if(!root||root.dataset.mode!=='english'||root.dataset.view!=='wizard')return;
 const card=root.querySelector('.setup-card');
 if(!card||card.dataset.englishWizardV2==='true')return;
 const fallback={
  category:card.querySelector('[name="category"]')?.value||'all',
  difficulty:Number(card.querySelector('[name="difficulty"]:checked')?.value)||1,
  duration:Number(card.querySelector('[name="duration"]:checked')?.value)||180
 };
 state=state||readState(fallback);
 card.dataset.englishWizardV2='true';
 card.classList.add('english-wizard-v2');
 card.innerHTML=
  '<input id="category" type="hidden" name="category" value="'+esc(encodeCategory())+'">'+
  '<fieldset class="english-v2-section english-v2-scope"><legend><span class="step-dot">1</span>Co ćwiczymy?</legend>'+
   scopeChoices()+
   '<div class="english-category-panel '+(state.scope==='categories'?'is-open':'')+'" data-category-panel aria-hidden="'+(state.scope==='categories'?'false':'true')+'"><div class="english-category-grid">'+categoryChoices()+'</div></div>'+
  '</fieldset>'+
  '<fieldset class="english-v2-section english-v2-level"><legend><span class="step-dot">2</span>Wybierz poziom</legend><div class="english-v2-level-grid english-segmented" data-segmented="level">'+levelChoices()+'</div></fieldset>'+
  '<fieldset class="english-v2-section english-v2-time"><legend><span class="step-dot">3</span>Jak długo dasz radę?</legend><div class="english-time-segmented english-segmented" data-segmented="time">'+durationChoices()+'</div></fieldset>';
 const note=root.querySelector('.wizard-note');
 if(note)note.textContent='Wybierz słówka, które chcesz dziś poćwiczyć.';
 syncPanel(false);
 syncHidden(true);
 requestAnimationFrame(()=>syncSegments(false));
}

root?.addEventListener('change',event=>{
 if(root.dataset.mode!=='english'||root.dataset.view!=='wizard'||!state)return;
 const target=event.target;
 if(target?.name==='englishScope'){
  state.scope=target.value==='categories'?'categories':'all';
  if(state.scope==='categories'&&(!state.categories.length||state.categories.length===CATEGORIES.length))state.categories=['numbers'];
  syncPanel(true);
  syncHidden(true);
  return;
 }
 if(target?.name==='englishCategories'){
  const chip=target.closest('.english-category-chip');
  if(chip){
   chip.classList.remove('is-selecting','is-deselecting');
   void chip.offsetWidth;
   chip.classList.add(target.checked?'is-selecting':'is-deselecting');
   window.setTimeout(()=>chip.classList.remove('is-selecting','is-deselecting'),560);
  }
  let checked=[...root.querySelectorAll('input[name="englishCategories"]:checked')].map(input=>input.value);
  if(!checked.length){
   checked=['numbers'];
   const fallback=root.querySelector('input[name="englishCategories"][value="numbers"]');
   if(fallback)fallback.checked=true;
  }
  state.categories=checked;
  if(checked.length===CATEGORIES.length){
   state.scope='all';
   syncPanel(true);
  }
  syncHidden(true);
  return;
 }
 if(target?.name==='difficulty'){
  state.difficulty=Number(target.value)||1;
  saveState();
  syncSegments(true);
  return;
 }
 if(target?.name==='duration'){
  state.duration=Number(target.value)||180;
  saveState();
  syncSegments(true);
 }
});

window.addEventListener('resize',()=>{
 if(root?.dataset.mode==='english'&&root.dataset.view==='wizard'&&state)requestAnimationFrame(()=>syncSegments(false));
},{passive:true});
window.addEventListener('orientationchange',()=>{
 if(root?.dataset.mode==='english'&&root.dataset.view==='wizard'&&state)window.setTimeout(()=>syncSegments(false),120);
},{passive:true});

const observer=new MutationObserver(()=>requestAnimationFrame(install));
if(root){
 observer.observe(root,{childList:true,subtree:true});
 install();
}
