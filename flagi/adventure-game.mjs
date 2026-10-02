import { FLAGS } from '../data/flags.mjs';
import { flagOnPole, paintFlags, prepareFlag } from './flag-on-pole.mjs?v=10';
import { fitLabel } from './text-fit.mjs?v=2';

const root=document.querySelector('#app'),records=new Map(FLAGS.map(record=>[record.id,record]));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const language=()=>window.MalaNaukaFlagLanguage?.language||'pl';
const countryName=record=>language()==='en'?record.countryEn:record.country;
const canvas=document.createElement('canvas'),ink=canvas.getContext('2d');
let queued=false,nextCountryId=null;

function fit(node,{max=23,min=11,lines=2,height=Infinity}={}){
  if(!node?.isConnected)return;
  const text=node.dataset.fitText||node.textContent;
  node.dataset.fitText=text;
  const style=getComputedStyle(node),family=style.fontFamily,weight=style.fontWeight;
  const available=Math.max(1,node.clientWidth);
  const lineHeight=parseFloat(style.lineHeight)/parseFloat(style.fontSize)||1.13;
  const result=fitLabel(text,(value,size)=>{ink.font=`${weight} ${size}px ${family}`;return ink.measureText(value).width;},available,{max,min,lines,height,lineHeight});
  node.style.fontSize=result.size+'px';
  node.style.setProperty('--fit-scale',String(result.scale||1));
  node.innerHTML=result.lines.map(line=>`<span>${esc(line)}</span>`).join(' ');
}
function fitAll(){
  root.querySelectorAll('.flag-cloth').forEach(cloth=>{
    const host=cloth.closest('.flag-on-pole'),[width,height=1]=getComputedStyle(cloth).aspectRatio.split('/').map(Number);
    // Constrain both axes through width; max-height alone distorts square flags.
    cloth.style.width=Math.min(host.clientWidth*.71,host.clientHeight*.67*width/height)+'px';
  });
  paintFlags(root);
  const host=root.querySelector('.flag-on-pole');
  const record=records.get(root.querySelector('.question-card')?.dataset.countryId);
  if(record)void window.MalaNaukaContinentMap?.preload?.(record.continent).catch(()=>{});
  if(nextCountryId)void window.MalaNaukaContinentMap?.preload?.(records.get(nextCountryId)?.continent).catch(()=>{});
  if(host)void prepareFlag(record,host).catch(()=>{});
  if(host&&nextCountryId)void prepareFlag(records.get(nextCountryId),host).catch(()=>{});
  root.querySelectorAll('.flag-answer-label').forEach(node=>{
    const button=node.closest('.answer'),style=getComputedStyle(button);
    fit(node,{max:Math.min(23,root.clientWidth*.0525),min:11,height:button.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)});
  });
  root.querySelectorAll('.flag-adventure-name').forEach(node=>{
    fit(node,{max:root.clientWidth*(node.closest('.flag-reveal-scene')?.108:.095),min:11,lines:2,height:node.clientHeight||62});
  });
  root.querySelectorAll('.flag-adventure-capital>span').forEach(node=>fit(node,{max:17,min:10,lines:1}));
  root.querySelectorAll('.flag-adventure-country,.flag-adventure-capital-question').forEach(node=>fit(node,{max:36,min:17}));
}
function flagAnswer(button,id){
  const record=records.get(id);if(!record)return;
  button.classList.add('flag-option-answer');
  button.dataset.flagOptionId=id;
  // Answers keep their original indices and hitboxes. No country name leaks here.
  button.setAttribute('aria-label',`Flaga ${Number(button.dataset.index)+1}`);
  button.innerHTML=`<img class="flag-option-image" src="${esc(record.flagSvg)}" alt="" width="156" height="117">`;
}
function enhance(){
  if(!root||root.dataset.mode!=='flags')return;
  if(root.dataset.view==='wizard'){
    const intro=root.querySelector('.wizard-intro');
    if(intro&&!intro.querySelector('.flag-mission-art'))intro.insertAdjacentHTML('afterbegin','<img class="flag-mission-art" src="assets/flags/adventure/mission-v1.webp" alt="" width="2172" height="724" decoding="async">');
    return;
  }
  if(root.dataset.view!=='game')return;
  const card=root.querySelector('.question-card');
  if(!card||card.dataset.adventureReady)return;
  const record=records.get(card.dataset.countryId);if(!record)return;
  card.dataset.adventureReady='true';
  const variant=card.dataset.flagVariant||'flags',feedback=card.matches('.correct,.wrong'),wrong=card.classList.contains('wrong');
  const reference=window.__MALA_NAUKA_FLAGS_PREVIEW__&&new URLSearchParams(location.search).get('scene')==='material';
  if(reference){card.classList.add('flag-reference-scene');root.querySelector('.time-block small').textContent='Czas zatrzymany';}
  root.dataset.flagGameVariant=variant;
  const iconPaths={exit:'M6 6l12 12M18 6 6 18',pause:'M8 5v14M16 5v14'};
  for(const [action,path] of Object.entries(iconPaths)){
    const button=root.querySelector(`[data-action="${action}"]`);
    if(button)button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>`;
  }
  const content=card.querySelector('.question-content');
  if(variant==='countries'&&!feedback){
    content.innerHTML=`<div class="flag-country-emblem" aria-hidden="true">${compass()}</div><div class="flag-adventure-country" data-fit-text="${esc(countryName(record))}">${esc(countryName(record))}</div><p class="flag-country-hint">Wybierz właściwą flagę poniżej.</p>`;
  }else if(variant==='capitals'&&!feedback){
    content.innerHTML=`<div class="flag-capital-pin" aria-hidden="true">${pin()}</div><small class="flag-capital-label">Czyja to stolica?</small><div class="flag-adventure-capital-question" data-fit-text="${esc(record.capital)}">${esc(record.capital)}</div>`;
  }else{
    content.innerHTML=flagOnPole(record,{label:feedback?'Flaga: '+countryName(record):'Flaga do rozpoznania'})+
      (feedback||reference?`<div class="flag-adventure-details"><div class="flag-adventure-name">${esc(countryName(record))}</div><div class="flag-adventure-capital">${pin()}<span data-fit-text="${esc(record.capital)}">${esc(record.capital)}</span></div></div>`:'');
    if(feedback||reference){
      card.classList.add('flag-reveal-scene');
      content.insertAdjacentHTML('beforeend',`<div class="flag-reveal-mask" aria-hidden="true"><div class="flag-adventure-map"><div data-adventure-map></div></div><span class="flag-scene-compass">${compass()}</span></div>`);
      const nextButton=root.querySelector('[data-action="next"]');
      const held=feedback&&!reference;
      const hold=value=>document.dispatchEvent(new CustomEvent('mala-nauka:flag-presentation',{detail:{held:value,countryId:record.id}}));
      if(held){hold(true);if(nextButton)nextButton.disabled=true;}
      card.dataset.flagScenePhase='preparing';
      const ready=()=>{
        if(!card.isConnected)return;
        card.dataset.flagScenePhase='revealed';
        if(nextButton)nextButton.disabled=false;
        if(held)hold(false);
      };
      const reveal=()=>{
        if(!card.isConnected)return;
        card.classList.add('is-revealed');card.dataset.flagScenePhase='revealing';
        if(reference||matchMedia('(prefers-reduced-motion: reduce)').matches)ready();
        else setTimeout(ready,1150);
      };
      // Mount already-preloaded vector geography under the closed mask.
      const mounted=window.MalaNaukaContinentMap?.mount(content.querySelector('[data-adventure-map]'),{countryId:record.id,continent:record.continent,countryName:countryName(record),language:language(),showCopy:false,interactive:false});
      const show=()=>requestAnimationFrame(()=>requestAnimationFrame(reveal));
      Promise.resolve(mounted).then(show,show);
    }

  }
  root.querySelectorAll('.answers .answer').forEach(button=>{
    if(variant==='countries')flagAnswer(button,(button.textContent||'').trim().toLowerCase());
    else{
      const text=window.MalaNaukaFlagLanguage?.nameFromAny(button.textContent)||button.textContent;
      button.classList.add('flag-text-answer');button.setAttribute('aria-label',text);
      button.innerHTML=`<span class="flag-answer-label" data-fit-text="${esc(text)}">${esc(text)}</span>`;
    }
  });
  root.querySelector('.answers')?.classList.add(variant==='countries'?'flag-image-answers':'flag-text-answers');
  const prompt=root.querySelector('.prompt');if(prompt){prompt.classList.add('flag-adventure-prompt');}
  fitAll();
}
function pin(){return '<svg viewBox="0 0 24 28" aria-hidden="true"><path fill="currentColor" d="M12 1C5.9 1 2 5.4 2 10.2c0 6.2 10 16.6 10 16.6s10-10.4 10-16.6C22 5.4 18.1 1 12 1Z"/><circle cx="12" cy="10" r="3.6" fill="#fff8df"/></svg>';}
function compass(){return '<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor"><circle cx="50" cy="50" r="31" stroke-width="1"/><circle cx="50" cy="50" r="26" stroke-width=".5"/><path d="M50 12v76M12 50h76" stroke-width=".7"/></g><g fill="currentColor"><path d="m50 14 6 30 30 6-30 6-6 30-6-30-30-6 30-6Z"/><path d="m27 27 19 16 27-16-16 19 16 27-19-16-27 16 16-19Z" opacity=".6"/></g><g fill="#fff2d0"><path d="m50 14 0 36 6-6ZM86 50H50l6 6ZM50 86V50l-6 6ZM14 50h36l-6-6Z"/><circle cx="50" cy="50" r="2"/></g><g fill="currentColor" font-family="sans-serif" font-size="11" text-anchor="middle"><text x="50" y="10">N</text><text x="50" y="99">S</text><text x="5" y="54">W</text><text x="95" y="54">E</text></g></svg>';}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enhance();});}
document.addEventListener('mala-nauka:flag-prepare',event=>{nextCountryId=event.detail.nextCountryId||null;});
new MutationObserver(schedule).observe(root,{childList:true});
document.addEventListener('mala-nauka:flag-language-change',()=>{
  const card=root.querySelector('.question-card'),record=records.get(card?.dataset.countryId);
  if(record){
    for(const selector of ['.flag-adventure-name','.flag-adventure-country']){
      const node=card.querySelector(selector);if(node){node.dataset.fitText=countryName(record);node.textContent=countryName(record);}
    }
    card.querySelector('.flag-on-pole')?.setAttribute('aria-label',card.matches('.correct,.wrong')?'Flaga: '+countryName(record):'Flaga do rozpoznania');
    card.querySelector('.continent-map-host')?.setAttribute('aria-label',language()==='en'?`Location of ${countryName(record)}`:`Położenie kraju ${countryName(record)}`);
  }
  root.querySelectorAll('.flag-text-answer').forEach(button=>{
    const text=window.MalaNaukaFlagLanguage.nameFromAny(button.getAttribute('aria-label'));
    button.setAttribute('aria-label',text);
    button.innerHTML=`<span class="flag-answer-label" data-fit-text="${esc(text)}">${esc(text)}</span>`;
  });
  fitAll();
});
new ResizeObserver(()=>requestAnimationFrame(fitAll)).observe(root);
document.fonts.ready.then(fitAll);
document.fonts.addEventListener('loadingdone',fitAll);
enhance();
