
const root=document.querySelector('#app');
const STORAGE_KEY='malaNauka.v1.spellingWizardV2';
const CATEGORIES=[['u/ó','u / ó'],['rz/ż','rz / ż'],['ch/h','ch / h'],['ć/ci','ć / ci'],['ś/si','ś / si'],['ź/zi','ź / zi'],['ń/ni','ń / ni'],['dź/dzi','dź / dzi']];
const LEVELS=[[0,'Wszystkie'],[1,'Łatwe'],[2,'Średnie'],[3,'Trudne']];
const DURATIONS=[60,120,180,300];
const START_COPY={60:'Szybka akcja!',120:'Zaczynamy!',180:'Dłuższa misja!',300:'Jesteś pewien?'};

let state=null;
let suppressClickUntil=0;
const segmentAnimations=new WeakMap();
const segmentTimers=new WeakMap();
const dragStates=new WeakMap();

function readState(fallback){
 try{
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
  if(saved&&typeof saved==='object'){
   const category=CATEGORIES.some(([id])=>id===saved.category)?saved.category:'u/ó';
   return {
    scope:saved.scope==='categories'?'categories':'all',
    category,
    difficulty:[0,1,2,3].includes(Number(saved.difficulty))?Number(saved.difficulty):fallback.difficulty,
    duration:DURATIONS.includes(Number(saved.duration))?Number(saved.duration):fallback.duration
   };
  }
 }catch{}
 const category=CATEGORIES.some(([id])=>id===fallback.category)?fallback.category:'u/ó';
 return {
  scope:fallback.category==='all'?'all':'categories',
  category,
  difficulty:[0,1,2,3].includes(Number(fallback.difficulty))?Number(fallback.difficulty):0,
  duration:DURATIONS.includes(Number(fallback.duration))?Number(fallback.duration):180
 };
}

function saveState(){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}
}

function esc(value){
 return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function indicator(){return '<span class="spelling-segment-indicator" aria-hidden="true"></span>';}

function scopeChoices(){
 return '<div class="spelling-v2-scope-grid spelling-segmented" data-segmented="scope" role="radiogroup" aria-label="Zakres słów">'+indicator()+
  '<label class="spelling-v2-choice"><input type="radio" name="spellingScope" value="all" '+(state.scope==='all'?'checked':'')+'><span>Wszystkie słowa</span></label>'+
  '<label class="spelling-v2-choice"><input type="radio" name="spellingScope" value="categories" '+(state.scope==='categories'?'checked':'')+'><span>Kategorie</span></label></div>';
}
function categoryChoices(){
 return CATEGORIES.map(([id,label])=>
  '<label class="spelling-category-chip"><input type="radio" name="spellingCategory" value="'+esc(id)+'" '+(state.category===id?'checked':'')+'><span>'+esc(label)+'</span></label>'
 ).join('');
}
function levelChoices(){
 return indicator()+LEVELS.map(([value,label])=>
  '<label class="spelling-v2-choice"><input type="radio" name="difficulty" value="'+value+'" '+(state.difficulty===value?'checked':'')+'><span>'+esc(label)+'</span></label>'
 ).join('');
}
function durationChoices(){
 return indicator()+DURATIONS.map(seconds=>
  '<label class="spelling-time-choice"><input type="radio" name="duration" value="'+seconds+'" '+(state.duration===seconds?'checked':'')+'><span>'+(seconds/60)+' min</span></label>'
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
function indicatorGeometry(container,indicatorNode){
 const cr=container.getBoundingClientRect(),r=indicatorNode.getBoundingClientRect();
 const left=Math.max(0,r.left-cr.left),right=Math.max(0,cr.right-r.right),width=Math.max(0,cr.width-left-right);
 return {left,right,width,center:left+width/2};
}
function lerp(a,b,t){return a+(b-a)*t;}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function motionTiming(current,target){
 const distance=Math.abs(target.center-current.center);
 const base=Math.min(1280,Math.max(860,Math.round(860+distance*.72)));
 return {total:Math.round(base*1.23),overshoot:Math.min(16,Math.max(5,Math.round(distance*.065)))};
}
function jellyFrames(current,target,forward,overshoot){
 const back=Math.max(2,Math.round(overshoot*.34)),bounce=Math.max(1,Math.round(overshoot*.10));
 if(forward)return[
  {offset:0,left:current.left+'px',right:current.right+'px',easing:'cubic-bezier(.30,.04,.22,1)'},
  {offset:.13,left:current.left+'px',right:lerp(current.right,target.right,.58)+'px',easing:'cubic-bezier(.18,.78,.22,1)'},
  {offset:.31,left:lerp(current.left,target.left,.26)+'px',right:lerp(current.right,target.right,.93)+'px',easing:'cubic-bezier(.16,.84,.20,1)'},
  {offset:.44,left:(target.left+overshoot)+'px',right:lerp(current.right,target.right,.992)+'px',easing:'cubic-bezier(.14,.80,.18,1)'},
  {offset:.69,left:(target.left-back)+'px',right:target.right+'px',easing:'cubic-bezier(.16,.76,.18,1)'},
  {offset:.86,left:(target.left+bounce)+'px',right:target.right+'px',easing:'cubic-bezier(.12,.70,.16,1)'},
  {offset:1,left:target.left+'px',right:target.right+'px'}];
 return[
  {offset:0,left:current.left+'px',right:current.right+'px',easing:'cubic-bezier(.30,.04,.22,1)'},
  {offset:.13,left:lerp(current.left,target.left,.58)+'px',right:current.right+'px',easing:'cubic-bezier(.18,.78,.22,1)'},
  {offset:.31,left:lerp(current.left,target.left,.93)+'px',right:lerp(current.right,target.right,.26)+'px',easing:'cubic-bezier(.16,.84,.20,1)'},
  {offset:.44,left:lerp(current.left,target.left,.992)+'px',right:(target.right+overshoot)+'px',easing:'cubic-bezier(.14,.80,.18,1)'},
  {offset:.69,left:target.left+'px',right:(target.right-back)+'px',easing:'cubic-bezier(.16,.76,.18,1)'},
  {offset:.86,left:target.left+'px',right:(target.right+bounce)+'px',easing:'cubic-bezier(.12,.70,.16,1)'},
  {offset:1,left:target.left+'px',right:target.right+'px'}];
}
function stopSegmentAnimation(container,indicatorNode){
 const animation=segmentAnimations.get(container);
 if(!animation)return indicatorGeometry(container,indicatorNode);
 const visual=indicatorGeometry(container,indicatorNode);
 try{animation.cancel();}catch{}
 segmentAnimations.delete(container);
 indicatorNode.style.left=visual.left+'px';indicatorNode.style.right=visual.right+'px';
 return visual;
}
function updateSegment(container,index,count,animate=true){
 if(!container)return;
 const indicatorNode=container.querySelector('.spelling-segment-indicator');
 if(!indicatorNode)return;
 const previousIndex=Number(container.dataset.activeIndex),nextIndex=Math.max(0,Math.min(count-1,index));
 const target=segmentGeometry(container,nextIndex);if(!target)return;
 const changed=Number.isFinite(previousIndex)&&Math.abs(previousIndex-nextIndex)>.001;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const current=stopSegmentAnimation(container,indicatorNode);
 container.dataset.activeIndex=String(nextIndex);
 const timer=segmentTimers.get(container);if(timer)window.clearTimeout(timer);
 if(!animate||!changed||reduced||typeof indicatorNode.animate!=='function'){
  indicatorNode.style.left=target.left+'px';indicatorNode.style.right=target.right+'px';container.classList.remove('is-segment-moving');return;
 }
 const timing=motionTiming(current,target);container.style.setProperty('--segment-total-ms',timing.total+'ms');
 container.classList.remove('is-segment-moving');void container.offsetWidth;container.classList.add('is-segment-moving');
 const animation=indicatorNode.animate(jellyFrames(current,target,nextIndex>previousIndex,timing.overshoot),{duration:timing.total,easing:'linear',fill:'both'});
 segmentAnimations.set(container,animation);indicatorNode.style.left=target.left+'px';indicatorNode.style.right=target.right+'px';
 const finish=()=>{if(segmentAnimations.get(container)===animation){segmentAnimations.delete(container);try{animation.cancel();}catch{}container.classList.remove('is-segment-moving');}};
 animation.addEventListener('finish',finish,{once:true});segmentTimers.set(container,window.setTimeout(finish,timing.total+120));
}
function segmentCount(container){return container?.querySelectorAll(':scope > label').length||0;}
function activeIndexFor(container){
 const type=container?.dataset.segmented;
 if(type==='scope')return state.scope==='categories'?1:0;
 if(type==='level')return Math.max(0,LEVELS.findIndex(([v])=>v===state.difficulty));
 if(type==='time')return Math.max(0,DURATIONS.indexOf(state.duration));
 return 0;
}
function syncSegments(animate=false){
 root.querySelectorAll('.spelling-segmented').forEach(container=>{
  if(!container.offsetWidth||!container.offsetHeight)return;
  updateSegment(container,activeIndexFor(container),segmentCount(container),animate);
 });
}
function bumpLabel(label){
 if(!label)return;label.classList.remove('is-tap-bump');void label.offsetWidth;label.classList.add('is-tap-bump');
 window.setTimeout(()=>label.classList.remove('is-tap-bump'),430);
}
function applySegmentSelection(input){
 if(!input||input.disabled)return;
 const container=input.closest('.spelling-segmented'),label=input.closest('label'),labels=[...container.querySelectorAll(':scope > label')];
 const index=Math.max(0,labels.indexOf(label));
 if(input.checked){updateSegment(container,index,labels.length,true);bumpLabel(label);return;}
 input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));
}
function setupDrag(container){
 if(!container||container.dataset.dragReady==='true')return;container.dataset.dragReady='true';
 container.addEventListener('pointerdown',event=>{
  if(event.button!==undefined&&event.button!==0)return;
  const indicatorNode=container.querySelector('.spelling-segment-indicator');if(!indicatorNode)return;
  const rect=container.getBoundingClientRect();
  dragStates.set(container,{pointerId:event.pointerId,startX:event.clientX,moved:false,rect,currentIndex:activeIndexFor(container)});
  stopSegmentAnimation(container,indicatorNode);container.classList.add('is-dragging');try{container.setPointerCapture(event.pointerId);}catch{}
 });
 container.addEventListener('pointermove',event=>{
  const drag=dragStates.get(container);if(!drag||drag.pointerId!==event.pointerId)return;
  if(Math.abs(event.clientX-drag.startX)>4)drag.moved=true;if(!drag.moved)return;event.preventDefault();
  const count=segmentCount(container),local=clamp(event.clientX-drag.rect.left,4,drag.rect.width-4);
  const progress=clamp((local-4)/Math.max(1,drag.rect.width-8),0,1)*(count-1),low=Math.floor(progress),high=Math.ceil(progress),mix=progress-low;
  const a=segmentGeometry(container,low),b=segmentGeometry(container,high),indicatorNode=container.querySelector('.spelling-segment-indicator');
  if(!a||!b||!indicatorNode)return;
  indicatorNode.style.left=lerp(a.left,b.left,mix)+'px';indicatorNode.style.right=lerp(a.right,b.right,mix)+'px';container.dataset.activeIndex=String(progress);
 });
 const finish=(event,cancelled=false)=>{
  const drag=dragStates.get(container);if(!drag||drag.pointerId!==event.pointerId)return;
  dragStates.delete(container);container.classList.remove('is-dragging');try{container.releasePointerCapture(event.pointerId);}catch{}
  if(cancelled||!drag.moved){updateSegment(container,activeIndexFor(container),segmentCount(container),true);return;}
  suppressClickUntil=performance.now()+350;const labels=[...container.querySelectorAll(':scope > label')];let index=drag.currentIndex;
  if(event.clientX>drag.startX){for(let i=drag.currentIndex+1;i<labels.length;i++){const r=labels[i].getBoundingClientRect();if(event.clientX>=(r.left+r.right)/2)index=i;}}
  else{for(let i=drag.currentIndex-1;i>=0;i--){const r=labels[i].getBoundingClientRect();if(event.clientX<=(r.left+r.right)/2)index=i;}}
  const input=labels[index]?.querySelector('input');if(input)applySegmentSelection(input);
 };
 container.addEventListener('pointerup',e=>finish(e,false));container.addEventListener('pointercancel',e=>finish(e,true));
}
function installDrag(){root.querySelectorAll('.spelling-segmented').forEach(setupDrag);}

function updateStartButton(animate=false){
 const button=root.querySelector('.start-button');if(!button)return;
 const next=START_COPY[state.duration]||'Zaczynamy!';let copy=button.querySelector('[data-start-copy]');
 if(!copy){button.innerHTML='<span data-start-copy></span><span aria-hidden="true">→</span>';copy=button.querySelector('[data-start-copy]');}
 if(copy.textContent!==next){copy.textContent=next;if(animate){button.classList.remove('spelling-start-pop');void button.offsetWidth;button.classList.add('spelling-start-pop');}}
}
function syncPanel(animate=false){
 const panel=root.querySelector('[data-category-panel]'),open=state.scope==='categories';
 if(panel){panel.classList.toggle('is-open',open);panel.setAttribute('aria-hidden',open?'false':'true');}
 root.querySelectorAll('input[name="spellingScope"]').forEach(input=>{input.checked=input.value===state.scope;});
 syncSegments(animate);
}
function syncHidden(dispatch=true){
 const category=root.querySelector('input[name="category"]');if(!category)return;
 const next=state.scope==='all'?'all':state.category,changed=category.value!==next;category.value=next;saveState();
 if(dispatch&&changed)category.dispatchEvent(new Event('change',{bubbles:true}));
}

function install(){
 if(!root||root.dataset.mode!=='spelling'||root.dataset.view!=='wizard')return;
 const card=root.querySelector('.setup-card');if(!card||card.dataset.spellingWizardV2==='true')return;
 const fallback={category:card.querySelector('[name="category"]')?.value||'all',difficulty:Number(card.querySelector('[name="difficulty"]:checked')?.value)||0,duration:Number(card.querySelector('[name="duration"]:checked')?.value)||180};
 state=readState(fallback);card.dataset.spellingWizardV2='true';card.classList.add('spelling-wizard-v2');
 card.innerHTML=
  '<input id="category" type="hidden" name="category" value="'+esc(state.scope==='all'?'all':state.category)+'">'+
  '<fieldset class="spelling-v2-section"><legend><span class="step-dot">1</span>Co ćwiczymy?</legend>'+scopeChoices()+
   '<div class="spelling-category-panel '+(state.scope==='categories'?'is-open':'')+'" data-category-panel aria-hidden="'+(state.scope==='categories'?'false':'true')+'"><div class="spelling-category-grid">'+categoryChoices()+'</div></div></fieldset>'+
  '<fieldset class="spelling-v2-section"><legend><span class="step-dot">2</span>Wybierz poziom</legend><div class="spelling-v2-level-grid spelling-segmented" data-segmented="level">'+levelChoices()+'</div></fieldset>'+
  '<fieldset class="spelling-v2-section"><legend><span class="step-dot">3</span>Jak długo dasz radę?</legend><div class="spelling-time-segmented spelling-segmented" data-segmented="time">'+durationChoices()+'</div></fieldset>';
 updateStartButton(false);syncPanel(false);syncHidden(true);requestAnimationFrame(()=>{syncSegments(false);installDrag();});
}

root?.addEventListener('click',event=>{
 if(root.dataset.mode!=='spelling'||root.dataset.view!=='wizard')return;
 const label=event.target.closest('.spelling-segmented > label');if(!label)return;event.preventDefault();
 if(performance.now()<suppressClickUntil){event.stopPropagation();return;}
 const input=label.querySelector('input');if(!input||input.disabled)return;applySegmentSelection(input);
});
root?.addEventListener('change',event=>{
 if(root.dataset.mode!=='spelling'||root.dataset.view!=='wizard'||!state)return;
 const target=event.target;
 if(target?.name==='spellingScope'){
  state.scope=target.value==='categories'?'categories':'all';syncPanel(true);syncHidden(true);return;
 }
 if(target?.name==='spellingCategory'){
  const chip=target.closest('.spelling-category-chip');if(chip){chip.classList.remove('is-selecting');void chip.offsetWidth;chip.classList.add('is-selecting');window.setTimeout(()=>chip.classList.remove('is-selecting'),520);}
  state.category=target.value;saveState();syncHidden(true);return;
 }
 if(target?.name==='difficulty'){state.difficulty=Number(target.value)||0;saveState();syncSegments(true);return;}
 if(target?.name==='duration'){state.duration=Number(target.value)||180;saveState();syncSegments(true);updateStartButton(true);}
});
window.addEventListener('resize',()=>{if(root?.dataset.mode==='spelling'&&root.dataset.view==='wizard'&&state)requestAnimationFrame(()=>syncSegments(false));},{passive:true});
window.addEventListener('orientationchange',()=>{if(root?.dataset.mode==='spelling'&&root.dataset.view==='wizard'&&state)window.setTimeout(()=>syncSegments(false),120);},{passive:true});
const observer=new MutationObserver(()=>requestAnimationFrame(install));
if(root){observer.observe(root,{childList:true,subtree:true});install();}
