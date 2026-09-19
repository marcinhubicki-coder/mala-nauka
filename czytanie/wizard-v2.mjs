const root=document.querySelector('#app');

const LEVELS=[
  [1,'Słowa'],
  [2,'Frazy'],
  [3,'Zdania']
];
const DURATIONS=[60,120,180,300];
const START_COPY={
  60:'Szybka runda!',
  120:'Zaczynamy!',
  180:'Dłuższa misja!',
  300:'Pełna misja!'
};

const movingTimers=new WeakMap();

function esc(value){
  return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function indicator(){
  return '<span class="reading-segment-indicator" aria-hidden="true"></span>';
}

function choices(name,items,selected,extraClass=''){
  return '<div class="reading-segmented '+extraClass+'" role="radiogroup">'+indicator()+
    items.map(([value,label])=>
      '<label class="reading-choice"><input type="radio" name="'+name+'" value="'+value+'" '+(Number(selected)===Number(value)?'checked':'')+'><span>'+esc(label)+'</span></label>'
    ).join('')+
  '</div>';
}

function durationChoices(selected){
  return choices('duration',DURATIONS.map(seconds=>[seconds,(seconds/60)+' min']),selected,'reading-time-segmented');
}

function updateSegment(container,animate=true){
  if(!container)return;
  const labels=[...container.querySelectorAll(':scope > label')];
  const checked=container.querySelector('input:checked');
  let index=labels.findIndex(label=>label.contains(checked));
  if(index<0)index=0;
  const indicatorNode=container.querySelector('.reading-segment-indicator');
  if(!indicatorNode)return;
  if(!animate)indicatorNode.style.transition='none';
  indicatorNode.style.transform='translateX('+(index*100)+'%)';
  if(!animate){
    requestAnimationFrame(()=>{indicatorNode.style.transition='';});
    return;
  }
  container.classList.add('is-moving');
  labels[index]?.classList.add('is-pop');
  clearTimeout(movingTimers.get(container));
  movingTimers.set(container,setTimeout(()=>{
    container.classList.remove('is-moving');
    labels.forEach(label=>label.classList.remove('is-pop'));
  },660));
}

function syncSegments(animate=false){
  root.querySelectorAll('.reading-segmented').forEach(node=>updateSegment(node,animate));
}

function updateStartButton(animate=false){
  const form=root.querySelector('#setup-form[data-reading-v2="1"]');
  if(!form)return;
  const duration=Number(form.querySelector('input[name="duration"]:checked')?.value)||180;
  const button=form.querySelector('.start-button');
  const copy=button?.querySelector('[data-start-copy]');
  if(!button||!copy)return;
  copy.textContent=START_COPY[duration]||'Zaczynamy!';
  if(animate){
    button.classList.remove('reading-start-pop');
    void button.offsetWidth;
    button.classList.add('reading-start-pop');
    setTimeout(()=>button.classList.remove('reading-start-pop'),380);
  }
}

function install(){
  if(root?.dataset.mode!=='reading'||root.dataset.view!=='wizard')return;
  const form=root.querySelector('#setup-form');
  if(!form||form.dataset.readingV2==='1')return;

  const difficulty=Number(form.querySelector('input[name="difficulty"]:checked')?.value)||1;
  const duration=Number(form.querySelector('input[name="duration"]:checked')?.value)||180;

  form.dataset.readingV2='1';
  form.innerHTML=
    '<section class="card setup-card reading-wizard-v2">'+
      '<input type="hidden" name="category" value="all">'+
      '<fieldset class="reading-v2-section">'+
        '<legend><span class="step-dot">1</span>Co czytamy?</legend>'+
        choices('difficulty',LEVELS,difficulty,'reading-level-segmented')+
      '</fieldset>'+
      '<fieldset class="reading-v2-section">'+
        '<legend><span class="step-dot">2</span>Ile mamy czasu?</legend>'+
        durationChoices(duration)+
      '</fieldset>'+
    '</section>'+
    '<p class="wizard-note reading-hint"><span class="reading-hint-dot" aria-hidden="true"></span><span>Tekst znika po chwili. Potem odtwarzasz to, co zapamiętasz.</span></p>'+
    '<p id="setup-error" role="status" hidden></p>'+
    '<button class="primary start-button" type="submit"><span data-start-copy>Zaczynamy!</span><span aria-hidden="true">→</span></button>';

  requestAnimationFrame(()=>{
    syncSegments(false);
    updateStartButton(false);
  });
}

root?.addEventListener('change',event=>{
  if(root.dataset.mode!=='reading'||root.dataset.view!=='wizard')return;
  const target=event.target;
  if(!(target instanceof HTMLInputElement))return;
  if(target.name==='difficulty'||target.name==='duration'){
    updateSegment(target.closest('.reading-segmented'),true);
  }
  if(target.name==='duration')updateStartButton(true);
});

window.addEventListener('resize',()=>{
  if(root?.dataset.mode==='reading'&&root.dataset.view==='wizard')requestAnimationFrame(()=>syncSegments(false));
},{passive:true});

const observer=new MutationObserver(()=>requestAnimationFrame(install));
if(root){
  observer.observe(root,{childList:true,subtree:true});
  install();
}
