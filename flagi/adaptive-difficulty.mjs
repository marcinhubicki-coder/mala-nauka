const STYLE_ID='flags-adaptive-difficulty-styles';
const MIGRATION_KEY='malaNauka.flags.world-default.v1';
const root=document.querySelector('#app');
const LABELS={1:'Łatwe',2:'Średnie',3:'Trudne'};

if(!document.getElementById(STYLE_ID)){
 const style=document.createElement('style');
 style.id=STYLE_ID;
 style.textContent=`
  #app[data-mode="flags"] .flag-difficulty-slider{display:grid;gap:12px;padding:2px 2px 0}
  #app[data-mode="flags"] .flag-difficulty-readout{display:flex;align-items:baseline;justify-content:space-between;gap:12px;color:#6d7d93;font-size:12px}
  #app[data-mode="flags"] .flag-difficulty-readout strong{font-size:15px;color:#2b465f}
  #app[data-mode="flags"] .flag-difficulty-range{--flag-slider-progress:0%;width:100%;height:30px;margin:0;appearance:none;-webkit-appearance:none;background:transparent;cursor:pointer;touch-action:pan-y}
  #app[data-mode="flags"] .flag-difficulty-range::-webkit-slider-runnable-track{height:8px;border-radius:999px;background:linear-gradient(90deg,#4f9a82 0 var(--flag-slider-progress),#e5ebf2 var(--flag-slider-progress) 100%);box-shadow:inset 0 0 0 1px #dce4ed}
  #app[data-mode="flags"] .flag-difficulty-range::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:28px;height:28px;margin-top:-10px;border:4px solid #fff;border-radius:50%;background:#4f9a82;box-shadow:0 3px 10px rgba(32,55,91,.20)}
  #app[data-mode="flags"] .flag-difficulty-range::-moz-range-track{height:8px;border-radius:999px;background:#e5ebf2}
  #app[data-mode="flags"] .flag-difficulty-range::-moz-range-progress{height:8px;border-radius:999px;background:#4f9a82}
  #app[data-mode="flags"] .flag-difficulty-range::-moz-range-thumb{width:20px;height:20px;border:4px solid #fff;border-radius:50%;background:#4f9a82;box-shadow:0 3px 10px rgba(32,55,91,.20)}
  #app[data-mode="flags"] .flag-difficulty-labels{display:grid;grid-template-columns:repeat(3,1fr);margin-top:-8px;font-size:11px;color:#8794a6;font-weight:700}
  #app[data-mode="flags"] .flag-difficulty-labels span{cursor:pointer;user-select:none}
  #app[data-mode="flags"] .flag-difficulty-labels span:nth-child(2){text-align:center}
  #app[data-mode="flags"] .flag-difficulty-labels span:last-child{text-align:right}
  #app[data-mode="flags"] .flag-difficulty-labels span.is-active{color:#397b67;font-weight:850}
  #app[data-mode="flags"] .flag-difficulty-help{font-size:10px;line-height:1.4;color:#8190a4;text-align:center;margin-top:1px}
 `;
 document.head.append(style);
}

function updateSlider(wrapper,value){
 const level=Math.min(3,Math.max(1,Number(value)||1));
 const input=wrapper.querySelector('.flag-difficulty-range');
 if(!input)return;
 input.value=String(level);
 input.style.setProperty('--flag-slider-progress',`${(level-1)*50}%`);
 wrapper.querySelector('[data-current-level]').textContent=LABELS[level];
 wrapper.querySelectorAll('[data-level]').forEach(label=>label.classList.toggle('is-active',Number(label.dataset.level)===level));
}

function migrateDefaultCategory(select){
 try{
  if(localStorage.getItem(MIGRATION_KEY))return;
  localStorage.setItem(MIGRATION_KEY,'1');
  if(select.value!=='all'){
   select.value='all';
   select.dispatchEvent(new Event('change',{bubbles:true}));
  }
 }catch{
  // Keep the saved selection when storage is unavailable.
 }
}

function syncVisibility(){
 if(!root||root.dataset.mode!=='flags'||root.dataset.view!=='wizard')return;
 const select=root.querySelector('#category');
 const range=root.querySelector('.flag-difficulty-range');
 const fieldset=range?.closest('fieldset');
 if(!select||!range||!fieldset)return;
 const allCountries=select.value==='all';
 fieldset.hidden=allCountries;
 if(allCountries&&Number(range.value)!==1){
  updateSlider(range.closest('.flag-difficulty-slider'),1);
  range.dispatchEvent(new Event('change',{bubbles:true}));
 }
 const timeInput=root.querySelector('input[name="duration"]');
 const timeDot=timeInput?.closest('fieldset')?.querySelector('legend .step-dot');
 if(timeDot)timeDot.textContent=allCountries?'2':'3';
}

function enhance(){
 if(!root||root.dataset.mode!=='flags'||root.dataset.view!=='wizard')return;
 const select=root.querySelector('#category');
 const difficultyInput=root.querySelector('input[name="difficulty"]');
 if(!select||!difficultyInput)return;
 migrateDefaultCategory(select);
 const fieldset=difficultyInput.closest('fieldset');
 const choices=fieldset?.querySelector('.choices.levels, .flag-difficulty-slider');
 if(!fieldset||!choices)return;

 if(choices.dataset.adaptive!=='true'){
  const checked=fieldset.querySelector('input[name="difficulty"]:checked');
  const value=Number(checked?.value||difficultyInput.value||1);
  const legend=fieldset.querySelector('legend');
  if(legend)legend.innerHTML='<span class="step-dot">2</span>Poziom startowy';
  choices.dataset.adaptive='true';
  choices.className='flag-difficulty-slider';
  choices.innerHTML=`
   <div class="flag-difficulty-readout"><span>Zacznij od</span><strong data-current-level></strong></div>
   <input class="flag-difficulty-range" type="range" name="difficulty" min="1" max="3" step="1" value="${value}" aria-label="Poziom startowy">
   <div class="flag-difficulty-labels"><span data-level="1">Łatwe</span><span data-level="2">Średnie</span><span data-level="3">Trudne</span></div>
   <p class="flag-difficulty-help">W obrębie kontynentu poziomy biegną od krajów najbliższych Polsce do najdalszych.</p>`;
  const range=choices.querySelector('.flag-difficulty-range');
  updateSlider(choices,value);
  range.addEventListener('input',()=>updateSlider(choices,range.value));
  choices.querySelectorAll('[data-level]').forEach(label=>label.addEventListener('click',()=>{
   updateSlider(choices,label.dataset.level);
   range.dispatchEvent(new Event('change',{bubbles:true}));
  }));
 }
 syncVisibility();
}

root?.addEventListener('change',event=>{
 if(event.target?.id==='category')requestAnimationFrame(syncVisibility);
});
const observer=new MutationObserver(()=>requestAnimationFrame(enhance));
if(root){observer.observe(root,{childList:true,subtree:true});enhance();}
