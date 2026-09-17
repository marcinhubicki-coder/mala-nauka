import { FLAGS } from '../data/flags.mjs';

const root=document.querySelector('#app');
const byId=new Map(FLAGS.map(flag=>[flag.id,flag]));
const byPl=new Map(FLAGS.map(flag=>[flag.country.toLocaleLowerCase('pl-PL'),flag]));
const byEn=new Map(FLAGS.map(flag=>[flag.countryEn.toLocaleLowerCase('en-US'),flag]));
const byCapital=new Map(FLAGS.map(flag=>[String(flag.capital||'').toLocaleLowerCase('pl-PL'),flag]));

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
 card.querySelectorAll('.answers .answer').forEach(button=>{
  const id=button.dataset.flagOptionId||button.textContent.trim().toLowerCase();
  if(!byId.has(id))return;
  button.dataset.flagOptionId=id;
  button.classList.add('flag-option-answer');
  if(!button.querySelector('img')){
   const record=byId.get(id);
   button.innerHTML=`<img src="${record.flagSvg}" alt="Flaga do wyboru" width="112" height="75">`;
  }
 });
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
  badge(card,'Stolice');

  if(feedback)feedbackFlag(card,record);
 }
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
}

document.addEventListener('mala-nauka:flag-language-change',()=>{
 requestAnimationFrame(()=>{
  refreshLanguage();
  enhanceCard();
 });
});

const observer=new MutationObserver(()=>queueMicrotask(enhanceCard));
if(root){
 observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 enhanceCard();
}
