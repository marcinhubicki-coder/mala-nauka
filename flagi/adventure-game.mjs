import { FLAGS } from '../data/flags.mjs';
import { flagOnPole } from './flag-on-pole.mjs?v=2';
import { fitLabel } from './text-fit.mjs?v=2';

const root=document.querySelector('#app'),records=new Map(FLAGS.map(record=>[record.id,record]));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const language=()=>window.MalaNaukaFlagLanguage?.language||'pl';
const countryName=record=>language()==='en'?record.countryEn:record.country;
const canvas=document.createElement('canvas'),ink=canvas.getContext('2d');
let queued=false;

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
    cloth.style.width=Math.min(host.clientWidth*.7,host.clientHeight*.65*width/height)+'px';
  });
  root.querySelectorAll('.flag-answer-label').forEach(node=>{
    const button=node.closest('.answer'),style=getComputedStyle(button);
    fit(node,{max:Math.min(25,root.clientWidth*.061),min:11,height:button.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)});
  });
  root.querySelectorAll('.flag-adventure-name').forEach(node=>{
    const mapReview=node.closest('.flag-map-review');
    fit(node,{max:root.clientWidth*.095,min:11,lines:mapReview?2:1,height:mapReview?48:30});
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
  root.dataset.flagGameVariant=variant;
  const content=card.querySelector('.question-content');
  if(variant==='countries'&&!feedback){
    content.innerHTML=`<div class="flag-country-emblem" aria-hidden="true">${compass()}</div><div class="flag-adventure-country" data-fit-text="${esc(countryName(record))}">${esc(countryName(record))}</div><p class="flag-country-hint">Wybierz właściwą flagę poniżej.</p>`;
  }else if(variant==='capitals'&&!feedback){
    content.innerHTML=`<div class="flag-capital-pin" aria-hidden="true">${pin()}</div><small class="flag-capital-label">Czyja to stolica?</small><div class="flag-adventure-capital-question" data-fit-text="${esc(record.capital)}">${esc(record.capital)}</div>`;
  }else{
    content.innerHTML=flagOnPole(record,{label:feedback?'Flaga: '+countryName(record):'Flaga do rozpoznania'})+
      (feedback?`<div class="flag-adventure-details"><div class="flag-adventure-name">${esc(countryName(record))}</div><div class="flag-adventure-capital">${pin()}<span data-fit-text="${esc(record.capital)}">${esc(record.capital)}</span></div></div>`:'');
    if(wrong){
      card.classList.add('flag-map-review');
      content.insertAdjacentHTML('beforeend',`<img class="flag-review-thumbnail" src="${esc(record.flagSvg)}" alt="" width="108" height="81"><div class="flag-adventure-map"><div data-adventure-map></div></div>`);
      const mapHost=content.querySelector('[data-adventure-map]');
      const map=window.MalaNaukaContinentMap;
      map?.mount(mapHost,{countryId:record.id,continent:record.continent,countryName:countryName(record),language:language(),showCopy:false,interactive:false});
      // Only content fades; the question/answer rows keep exactly the same size.
      requestAnimationFrame(()=>{if(card.isConnected)card.classList.add('is-map-visible');});
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
  requestAnimationFrame(fitAll);
}
function pin(){return '<svg viewBox="0 0 24 28" aria-hidden="true"><path fill="currentColor" d="M12 1C5.9 1 2 5.4 2 10.2c0 6.2 10 16.6 10 16.6s10-10.4 10-16.6C22 5.4 18.1 1 12 1Z"/><circle cx="12" cy="10" r="3.6" fill="#fff8df"/></svg>';}
function compass(){return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m50 5 7 38 38 7-38 7-7 38-7-38-38-7 38-7Z" fill="currentColor" opacity=".65"/><path d="m50 5 0 45 7-7ZM95 50H50l7 7ZM50 95V50l-7 7ZM5 50h45l-7-7Z" fill="#fff9dc"/><circle cx="50" cy="50" r="4" fill="currentColor"/></svg>';}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enhance();});}
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
