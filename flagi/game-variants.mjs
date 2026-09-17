import { FLAGS } from '../data/flags.mjs';

const root=document.querySelector('#app');
const byId=new Map(FLAGS.map(flag=>[flag.id,flag]));
const byPl=new Map(FLAGS.map(flag=>[flag.country.toLocaleLowerCase('pl-PL'),flag]));
const byEn=new Map(FLAGS.map(flag=>[flag.countryEn.toLocaleLowerCase('en-US'),flag]));
const byCapital=new Map(FLAGS.map(flag=>[String(flag.capital||'').toLocaleLowerCase('pl-PL'),flag]));
let enhanceQueued=false;

function recordFromCountryName(value){
 const text=String(value||'').trim();
 return byPl.get(text.toLocaleLowerCase('pl-PL'))||byEn.get(text.toLocaleLowerCase('en-US'))||null;
}

function language(){
 return window.MalaNaukaFlagLanguage?.language==='en'?'en':'pl';
}

function localizedName(record){
 if(!record)return '';
 return language()==='en'?record.countryEn:record.country;
}

function badge(card,label){
 const item=card?.querySelector('.badges .badge:first-child');
 if(item&&item.textContent!==label)item.textContent=label;
}

function decorateFlagAnswers(card){
 const answers=root.querySelector('.answers');
 if(!answers)return;
 root.dataset.flagGameVariant='countries';
 if(!answers.classList.contains('flag-image-answers'))answers.classList.add('flag-image-answers');

 answers.querySelectorAll('.answer').forEach(button=>{
  const raw=(button.dataset.flagOptionId||button.textContent||'').trim().toLowerCase();
  const record=byId.get(raw);
  if(!record)return;

  button.dataset.flagOptionId=record.id;
  if(!button.classList.contains('flag-option-answer'))button.classList.add('flag-option-answer');
  button.setAttribute('aria-label',`Flaga: ${localizedName(record)}`);

  const current=button.querySelector('img[data-country-flag]');
  if(current){
   if(current.getAttribute('src')!==record.flagSvg)current.setAttribute('src',record.flagSvg);
   current.setAttribute('alt',`Flaga: ${localizedName(record)}`);
   return;
  }

  button.replaceChildren();
  const image=document.createElement('img');
  image.dataset.countryFlag='';
  image.className='flag-option-image';
  image.src=record.flagSvg;
  image.alt=`Flaga: ${localizedName(record)}`;
  image.width=156;
  image.height=104;
  button.append(image);
 });
}

function decorateCapitalQuestion(card,record){
 if(!card||!record)return;
 root.dataset.flagGameVariant='capitals';
 const content=card.querySelector('.question-content');
 const question=content?.querySelector('.question-text.flag-capital');
 if(!content||!question)return;

 let wrap=content.querySelector('.capital-question-wrap');
 if(!wrap){
  wrap=document.createElement('div');
  wrap.className='capital-question-wrap';
  question.before(wrap);
  wrap.append(question);
 }

 let image=wrap.querySelector('img.capital-question-flag');
 if(!image){
  image=document.createElement('img');
  image.className='capital-question-flag';
  image.width=132;
  image.height=88;
  wrap.append(image);
 }
 image.src=record.flagSvg;
 image.alt=`Flaga: ${localizedName(record)}`;
}

function feedbackFlag(card,record){
 if(!card||!record||card.dataset.flagVariantFeedback==='true')return;
 const content=card.querySelector('.question-content');
 if(!content)return;
 card.dataset.flagVariantFeedback='true';
 card.dataset.countryId=record.id;
 content.innerHTML=`<img class="flag" src="${record.flagSvg}" alt="Flaga: ${localizedName(record)}" width="240" height="160"><div class="flag-name">${localizedName(record)}</div>`;
}

function enhanceCard(){
 if(!root||root.dataset.mode!=='flags'||root.dataset.view!=='game')return;
 const card=root.querySelector('.question-card');
 if(!card)return;

 const countryQuestion=card.querySelector('.question-text.flag-country');
 const capitalQuestion=card.querySelector('.question-text.flag-capital');
 const feedback=card.classList.contains('correct')||card.classList.contains('wrong');

 if(countryQuestion){
  const record=byId.get(card.dataset.countryId)||recordFromCountryName(countryQuestion.textContent);
  if(record)card.dataset.countryId=record.id;
  card.dataset.flagVariant='countries';
  root.dataset.flagGameVariant='countries';
  badge(card,'Państwa');

  if(feedback){
   feedbackFlag(card,record);
  }else{
   if(record){
    const name=localizedName(record);
    if(countryQuestion.textContent!==name)countryQuestion.textContent=name;
   }
   decorateFlagAnswers(card);
  }
  return;
 }

 if(capitalQuestion){
  let record=byId.get(card.dataset.countryId);
  if(!record){
   if(feedback)record=recordFromCountryName(capitalQuestion.textContent);
   else record=byCapital.get(capitalQuestion.textContent.trim().toLocaleLowerCase('pl-PL'));
  }
  if(record)card.dataset.countryId=record.id;
  card.dataset.flagVariant='capitals';
  root.dataset.flagGameVariant='capitals';
  badge(card,'Stolice');

  if(feedback)feedbackFlag(card,record);
  else decorateCapitalQuestion(card,record);
  return;
 }

 root.dataset.flagGameVariant='flags';
}

function scheduleEnhance(){
 if(enhanceQueued)return;
 enhanceQueued=true;
 queueMicrotask(()=>{
  enhanceQueued=false;
  enhanceCard();
 });
}

function refreshLanguage(){
 const card=root?.querySelector('.question-card');
 if(!card)return;
 const record=byId.get(card.dataset.countryId);
 if(!record)return;

 const countryQuestion=card.querySelector('.question-text.flag-country');
 if(countryQuestion&&!card.classList.contains('correct')&&!card.classList.contains('wrong')){
  countryQuestion.textContent=localizedName(record);
 }
 const name=card.querySelector('.flag-name');
 if(name)name.textContent=localizedName(record);

 const capitalFlag=card.querySelector('.capital-question-flag');
 if(capitalFlag)capitalFlag.alt=`Flaga: ${localizedName(record)}`;

 root.querySelectorAll('.answer.flag-option-answer').forEach(button=>{
  const option=byId.get(button.dataset.flagOptionId);
  if(!option)return;
  button.setAttribute('aria-label',`Flaga: ${localizedName(option)}`);
  const image=button.querySelector('img[data-country-flag]');
  if(image)image.alt=`Flaga: ${localizedName(option)}`;
 });
}

document.addEventListener('mala-nauka:flag-language-change',()=>{
 requestAnimationFrame(()=>{
  refreshLanguage();
  scheduleEnhance();
 });
});

const observer=new MutationObserver(mutations=>{
 if(!mutations.some(mutation=>mutation.type==='childList'&&(mutation.addedNodes.length||mutation.removedNodes.length)))return;
 scheduleEnhance();
});
if(root){
 observer.observe(root,{childList:true,subtree:true});
 scheduleEnhance();
}
