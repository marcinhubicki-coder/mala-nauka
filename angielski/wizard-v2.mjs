
const root=document.querySelector('#app');
const STORAGE_KEY='malaNauka.v1.englishWizardV2';
const CATEGORIES=[
 ['numbers','Liczby'],['colors','Kolory'],['family','Rodzina'],['people','Ludzie'],['body','Ciało'],
 ['home','Dom'],['objects','Przedmioty'],['school','Szkoła'],['food','Jedzenie'],['animals','Zwierzęta'],
 ['nature','Natura'],['places','Miejsca'],['transport','Transport'],['clothes','Ubrania'],['jobs','Zawody'],
 ['verbs','Czasowniki'],['adjectives','Przymiotniki'],['time','Czas']
];
const LEVELS=[[1,'Znaczenie'],[2,'Pisownia']];
const DURATIONS=[60,120,180,300];
const START_COPY={60:'Szybka akcja!',120:'Zaczynamy!',180:'Dłuższa misja!',300:'Jesteś pewien?'};

let state=null;
let editingCategories=false;
let editorClosing=false;
let editorSaving=false;
let editSnapshot=null;
let draftCategories=[];
let suppressClickUntil=0;
const segmentAnimations=new WeakMap();
const segmentTimers=new WeakMap();
const dragStates=new WeakMap();

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
    difficulty:[1,2].includes(Number(saved.difficulty))?Number(saved.difficulty):1,
    duration:DURATIONS.includes(Number(saved.duration))?Number(saved.duration):fallback.duration
   };
  }
 }catch{}
 const parsed=parseCategory(fallback.category);
 return {
  scope:parsed.scope,
  categories:parsed.categories,
  difficulty:[1,2].includes(Number(fallback.difficulty))?Number(fallback.difficulty):1,
  duration:DURATIONS.includes(Number(fallback.duration))?Number(fallback.duration):180
 };
}

function saveState(){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}
}

function currentCategories(){
 return editingCategories?draftCategories:state.categories;
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
  '<label class="english-v2-choice"><input type="radio" name="englishScope" value="all" '+(state.scope==='all'&&!editingCategories?'checked':'')+'><span>Wszystkie słówka</span></label>'+
  '<label class="english-v2-choice"><input type="radio" name="englishScope" value="categories" '+((state.scope==='categories'||editingCategories)?'checked':'')+'><span>Kategorie</span></label>'+
  '</div>';
}

function categoryChoices(){
 const selected=currentCategories();
 return CATEGORIES.map(([id,label])=>
  '<label class="english-category-chip"><input type="checkbox" name="englishCategories" value="'+id+'" '+(selected.includes(id)?'checked':'')+'><span>'+esc(label)+'</span></label>'
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

function editActionChoices(){
 return indicator()+
  '<label class="english-v2-choice"><input type="radio" name="englishEditAction" value="cancel" checked><span>Anuluj</span></label>'+
  '<label class="english-v2-choice"><input type="radio" name="englishEditAction" value="save"><span>Zapisz</span></label>';
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
function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

function motionTiming(current,target){
 const distance=Math.abs(target.center-current.center);
 const base=Math.min(1280,Math.max(860,Math.round(860+distance*.72)));
 const total=Math.round(base*1.23);
 const overshoot=Math.min(16,Math.max(5,Math.round(distance*.065)));
 return {total,overshoot};
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
 const changed=Number.isFinite(previousIndex)&&Math.abs(previousIndex-nextIndex)>.001;
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

function segmentCount(container){
 return container?.querySelectorAll(':scope > label').length||0;
}

function activeIndexFor(container){
 const type=container?.dataset.segmented;
 if(type==='scope'){
  if(editorClosing)return state.scope==='categories'?1:0;
  return editingCategories||state.scope==='categories'?1:0;
 }
 if(type==='level')return Math.max(0,LEVELS.findIndex(([value])=>value===state.difficulty));
 if(type==='time')return Math.max(0,DURATIONS.indexOf(state.duration));
 if(type==='edit'){
  const labels=[...container.querySelectorAll(':scope > label')];
  const checked=labels.findIndex(label=>label.querySelector('input')?.checked);
  return checked>=0?checked:0;
 }
 return 0;
}

function syncSegments(animate=false){
 root.querySelectorAll('.english-segmented').forEach(container=>{
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
 const next=START_COPY[state.duration]||'Zaczynamy!';
 let copy=button.querySelector('[data-start-copy]');
 if(!copy){
  button.innerHTML='<span data-start-copy></span><span aria-hidden="true">→</span>';
  copy=button.querySelector('[data-start-copy]');
 }
 if(copy.textContent!==next){
  copy.textContent=next;
  if(animate){
   button.classList.remove('english-start-pop');
   void button.offsetWidth;
   button.classList.add('english-start-pop');
  }
 }
}

function refreshCategoryChecks(){
 const selected=currentCategories();
 root.querySelectorAll('input[name="englishCategories"]').forEach(input=>{input.checked=selected.includes(input.value);});
}

function syncEditorUI(animate=false,{resetAction=false}={}){
 const form=root.querySelector('#setup-form');
 const panel=root.querySelector('[data-category-panel]');
 const actions=root.querySelector('[data-category-actions]');
 const editingLayout=editingCategories||editorClosing;
 form?.classList.toggle('english-category-editing',editingLayout);
 form?.classList.toggle('english-category-closing',editorClosing);
 form?.classList.toggle('english-category-saving',editorSaving);
 if(panel){
  const open=editingCategories&&!editorClosing;
  panel.classList.toggle('is-open',open);
  panel.setAttribute('aria-hidden',open?'false':'true');
 }
 if(actions){
  const open=editingCategories&&!editorClosing;
  actions.classList.toggle('is-open',open);
  actions.setAttribute('aria-hidden',open?'false':'true');
  if(resetAction){
   const cancel=actions.querySelector('input[value="cancel"]');
   if(cancel)cancel.checked=true;
   const save=actions.querySelector('input[value="save"]');
   if(save)save.checked=false;
  }
 }
 root.querySelectorAll('input[name="englishScope"]').forEach(input=>{
  input.checked=input.value===((editingCategories&&!editorClosing)?'categories':state.scope);
 });
 root.querySelectorAll('input[name="englishCategories"],input[name="englishEditAction"]').forEach(input=>{
  input.disabled=!editingCategories||editorClosing||editorSaving;
 });
 root.querySelectorAll('input[name="difficulty"],input[name="duration"]').forEach(input=>{
  input.disabled=editingLayout;
 });
 refreshCategoryChecks();
 requestAnimationFrame(()=>syncSegments(animate));
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

function enterCategoryEditor(){
 if(editingCategories||editorClosing||editorSaving)return;
 editSnapshot={scope:state.scope,categories:[...state.categories]};
 draftCategories=[...(state.categories.length?state.categories:['numbers'])];
 editingCategories=true;
 editorClosing=false;
 editorSaving=false;
 syncEditorUI(true,{resetAction:true});
 requestAnimationFrame(()=>installDrag());
}

function revealLowerSections(){
 const form=root.querySelector('#setup-form');
 if(!form)return;
 form.classList.remove('english-editor-reveal');
 void form.offsetWidth;
 form.classList.add('english-editor-reveal');
 window.setTimeout(()=>form.classList.remove('english-editor-reveal'),1150);
}

function finishEditorClose(){
 editingCategories=false;
 editorClosing=false;
 editorSaving=false;
 draftCategories=[];
 editSnapshot=null;
 syncEditorUI(false,{resetAction:true});
 revealLowerSections();
}

function beginEditorClose(){
 if(!editingCategories||editorClosing)return;
 editorClosing=true;
 editorSaving=false;
 syncEditorUI(true);
 window.setTimeout(finishEditorClose,430);
}

function cancelCategoryEditor(){
 if(!editingCategories||editorClosing||editorSaving)return;
 if(editSnapshot){
  state.scope=editSnapshot.scope;
  state.categories=[...editSnapshot.categories];
 }
 syncHidden(true);
 beginEditorClose();
}

function switchToAllWords(){
 if(!editingCategories||editorClosing||editorSaving)return;
 // Keep the last saved category set in state.categories; only disable the filter.
 state.scope='all';
 draftCategories=[];
 syncHidden(true);
 beginEditorClose();
}

function saveCategoryEditorAfterJelly(container){
 if(!editingCategories||editorClosing||editorSaving)return;
 const raw=getComputedStyle(container).getPropertyValue('--segment-total-ms');
 const motionMs=Math.max(0,parseFloat(raw)||1000);
 editorSaving=true;
 syncEditorUI(false);
 window.setTimeout(()=>{
  if(!editingCategories)return;
  if(!draftCategories.length)draftCategories=['numbers'];
  state.scope='categories';
  state.categories=[...new Set(draftCategories)];
  syncHidden(true);
  editorSaving=false;
  beginEditorClose();
 },motionMs+400);
}
function applySegmentSelection(input){
 if(!input||input.disabled)return;
 const container=input.closest('.english-segmented');
 const label=input.closest('label');
 const labels=[...container.querySelectorAll(':scope > label')];
 const index=Math.max(0,labels.indexOf(label));
 const wasChecked=input.checked;

 if(wasChecked){
  updateSegment(container,index,labels.length,true);
  bumpLabel(label);
  if(input.name==='englishScope'&&input.value==='categories'&&!editingCategories)enterCategoryEditor();
  else if(input.name==='englishEditAction'&&input.value==='cancel'&&editingCategories)cancelCategoryEditor();
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
  const indicatorNode=container.querySelector('.english-segment-indicator');
  if(!indicatorNode)return;
  const rect=container.getBoundingClientRect();
  const currentIndex=activeIndexFor(container);
  dragStates.set(container,{
   pointerId:event.pointerId,
   startX:event.clientX,
   x:event.clientX,
   moved:false,
   rect,
   currentIndex
  });
  stopSegmentAnimation(container,indicatorNode);
  container.classList.add('is-dragging');
  try{container.setPointerCapture(event.pointerId);}catch{}
 });
 container.addEventListener('pointermove',event=>{
  const drag=dragStates.get(container);
  if(!drag||drag.pointerId!==event.pointerId)return;
  drag.x=event.clientX;
  if(Math.abs(drag.x-drag.startX)>4)drag.moved=true;
  if(!drag.moved)return;
  event.preventDefault();
  const count=segmentCount(container);
  const rect=drag.rect;
  const local=clamp(event.clientX-rect.left,4,rect.width-4);
  const progress=clamp((local-4)/Math.max(1,rect.width-8),0,1)*(count-1);
  const low=Math.floor(progress),high=Math.ceil(progress),mix=progress-low;
  const a=segmentGeometry(container,low),b=segmentGeometry(container,high);
  const indicatorNode=container.querySelector('.english-segment-indicator');
  if(!a||!b||!indicatorNode)return;
  indicatorNode.style.left=lerp(a.left,b.left,mix)+'px';
  indicatorNode.style.right=lerp(a.right,b.right,mix)+'px';
  container.dataset.activeIndex=String(progress);
 });
 const finishDrag=(event,cancelled=false)=>{
  const drag=dragStates.get(container);
  if(!drag||drag.pointerId!==event.pointerId)return;
  dragStates.delete(container);
  container.classList.remove('is-dragging');
  try{container.releasePointerCapture(event.pointerId);}catch{}
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
    const center=(r.left+r.right)/2;
    if(x>=center)index=i;
   }
  }else if(x<drag.startX){
   for(let i=drag.currentIndex-1;i>=0;i--){
    const r=labels[i].getBoundingClientRect();
    const center=(r.left+r.right)/2;
    if(x<=center)index=i;
   }
  }
  const input=labels[index]?.querySelector('input');
  if(input)applySegmentSelection(input);
  else updateSegment(container,activeIndexFor(container),labels.length,true);
 };
 container.addEventListener('pointerup',event=>finishDrag(event,false));
 container.addEventListener('pointercancel',event=>finishDrag(event,true));
}

function installDrag(){
 root.querySelectorAll('.english-segmented').forEach(setupDrag);
}

function install(){
 if(!root||root.dataset.mode!=='english'||root.dataset.view!=='wizard')return;
 const card=root.querySelector('.setup-card');
 if(!card||card.dataset.englishWizardV3==='true')return;
 const fallback={
  category:card.querySelector('[name="category"]')?.value||'all',
  difficulty:Number(card.querySelector('[name="difficulty"]:checked')?.value)||1,
  duration:Number(card.querySelector('[name="duration"]:checked')?.value)||180
 };
 state=readState(fallback);
 card.dataset.englishWizardV3='true';
 card.classList.add('english-wizard-v2');
 card.innerHTML=
  '<input id="category" type="hidden" name="category" value="'+esc(encodeCategory())+'">'+
  '<fieldset class="english-v2-section english-v2-scope"><legend><span class="step-dot">1</span>Co ćwiczymy?</legend>'+
   scopeChoices()+
   '<div class="english-category-panel" data-category-panel aria-hidden="true"><div class="english-category-grid">'+categoryChoices()+'</div>'+
    '<div class="english-category-actions english-segmented" data-segmented="edit" data-category-actions aria-hidden="true">'+editActionChoices()+'</div>'+
   '</div>'+
  '</fieldset>'+
  '<fieldset class="english-v2-section english-v2-level"><legend><span class="step-dot">2</span>Wybierz formę zabawy</legend><div class="english-v2-level-grid english-segmented" data-segmented="level">'+levelChoices()+'</div></fieldset>'+
  '<fieldset class="english-v2-section english-v2-time"><legend><span class="step-dot">3</span>Jak długo dasz radę?</legend><div class="english-time-segmented english-segmented" data-segmented="time">'+durationChoices()+'</div></fieldset>';
 const note=root.querySelector('.wizard-note');
 if(note)note.textContent='Wybierz słówka, które chcesz dziś poćwiczyć.';
 updateStartButton(false);
 syncEditorUI(false,{resetAction:true});
 syncHidden(true);
 requestAnimationFrame(()=>{syncSegments(false);installDrag();});
}

root?.addEventListener('click',event=>{
 if(root.dataset.mode!=='english'||root.dataset.view!=='wizard')return;
 const label=event.target.closest('.english-segmented > label');
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
 if(root.dataset.mode!=='english'||root.dataset.view!=='wizard'||!state)return;
 const target=event.target;
 if(target?.name==='englishScope'){
  if(target.value==='categories'){
   if(!editingCategories)enterCategoryEditor();
  }else if(editingCategories){
   switchToAllWords();
  }else{
   state.scope='all';
   syncHidden(true);
   syncEditorUI(true);
  }
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
  draftCategories=checked;
  return;
 }
 if(target?.name==='englishEditAction'){
  const container=target.closest('.english-segmented');
  const labels=[...container.querySelectorAll(':scope > label')];
  const index=Math.max(0,labels.findIndex(label=>label.querySelector('input')===target));
  updateSegment(container,index,labels.length,true);
  if(target.value==='save')saveCategoryEditorAfterJelly(container);
  else cancelCategoryEditor();
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
  updateStartButton(true);
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
