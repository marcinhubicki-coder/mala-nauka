import { FLAGS } from '../data/flags.mjs';

const root=document.querySelector('#app');
const byId=new Map(FLAGS.map(flag=>[flag.id,flag]));
const byPl=new Map(FLAGS.map(flag=>[flag.country.toLocaleLowerCase('pl-PL'),flag]));
const byEn=new Map(FLAGS.map(flag=>[flag.countryEn.toLocaleLowerCase('en-US'),flag]));
const byCapital=new Map(FLAGS.map(flag=>[String(flag.capital||'').toLocaleLowerCase('pl-PL'),flag]));
let enhanceQueued=false;
let lastPrimaryFlagSrc='';

function safeHtml(value){
 return String(value).replace(/[&<>"']/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
 }[char]));
}

function fitTextAnswer(button){
 const label=button?.querySelector('.flag-answer-label');
 if(!label)return;

 const words=[...label.querySelectorAll('.flag-answer-word')];
 if(!words.length)return;

 const rebuild=breakAt=>{
  const fragments=words.map(word=>word);
  label.replaceChildren();
  const first=document.createElement('span');
  first.className='flag-answer-line';
  fragments.slice(0,breakAt||fragments.length).forEach(word=>first.append(word));
  label.append(first);
  if(breakAt&&breakAt<fragments.length){
   const second=document.createElement('span');
   second.className='flag-answer-line';
   fragments.slice(breakAt).forEach(word=>second.append(word));
   label.append(second);
  }
 };

 const measureLine=(items,size)=>{
  const gap=size*.28;
  return items.reduce((sum,word,index)=>sum+word.getBoundingClientRect().width+(index?gap:0),0);
 };

 let size=18;
 while(size>=13){
  button.style.setProperty('--flag-answer-font-size',`${size}px`);
  rebuild(null);
  const available=label.clientWidth;
  const oneLine=measureLine(words,size);

  if(oneLine<=available+1){
   label.dataset.lines='1';
   return;
  }

  let best=null;
  for(let split=1;split<words.length;split+=1){
   const first=measureLine(words.slice(0,split),size);
   const second=measureLine(words.slice(split),size);
   if(first<=available+1&&second<=available+1){
    const score=Math.max(first,second)+Math.abs(first-second)*.12;
    if(!best||score<best.score)best={split,score};
   }
  }

  if(best){
   rebuild(best.split);
   label.dataset.lines='2';
   return;
  }

  size-=1;
 }

 button.style.setProperty('--flag-answer-font-size','13px');
 rebuild(words.length>1?Math.ceil(words.length/2):null);
 label.dataset.lines=words.length>1?'2':'1';
}

function textAnswerMarkup(text,animated){
 let letterIndex=0;
 const words=text.trim().split(/\s+/).filter(Boolean);
 const content=words.map(token=>{
  if(!animated)return `<span class="flag-answer-word">${safeHtml(token)}</span>`;
  const letters=Array.from(token).map(character=>{
   const delay=Math.min(letterIndex,28);
   letterIndex+=1;
   return `<span class="flag-answer-letter" style="--flag-letter-index:${delay}">${safeHtml(character)}</span>`;
  }).join('');
  return `<span class="flag-answer-word" aria-hidden="true">${letters}</span>`;
 }).join('');
 return `<span class="flag-answer-label"><span class="flag-answer-line">${content}</span></span>`;
}

function animateTextAnswer(button){
 if(!button||button.dataset.flagTextAnimated==='true'||button.disabled)return;
 const text=(button.textContent||'').trim();
 if(!text)return;
 button.dataset.flagTextAnimated='true';
 button.setAttribute('aria-label',text);
 button.innerHTML=textAnswerMarkup(text,true);
 requestAnimationFrame(()=>fitTextAnswer(button));
}

function prepareStaticTextAnswer(button){
 if(!button)return;
 const text=(button.getAttribute('aria-label')||button.textContent||'').trim();
 if(!text)return;
 if(button.dataset.flagTextStatic===text&&button.querySelector('.flag-answer-label')){
  return;
 }
 button.dataset.flagTextStatic=text;
 button.setAttribute('aria-label',text);
 button.innerHTML=textAnswerMarkup(text,false);
 requestAnimationFrame(()=>fitTextAnswer(button));
}

function animateTextAnswers(answers){
 if(!answers)return;
 answers.querySelectorAll('.answer.flag-text-answer').forEach(button=>animateTextAnswer(button));
}

function animateFlagOptions(answers){
 if(!answers||answers.dataset.flagOptionsAnimated==='true')return;
 answers.dataset.flagOptionsAnimated='true';
 answers.classList.add('flag-options-enter');
 answers.querySelectorAll('.flag-option-answer').forEach((button,index)=>{
  button.style.setProperty('--flag-option-index',String(index));
 });
}

function crossfadePrimaryFlag(card){
 if(!card||card.classList.contains('correct')||card.classList.contains('wrong'))return;
 const content=card.querySelector('.question-content');
 const flag=content?.querySelector(':scope > .flag');
 if(!content||!flag)return;

 const nextSrc=flag.currentSrc||flag.getAttribute('src')||'';
 if(!nextSrc)return;

 content.classList.add('flag-question-crossfade');
 if(lastPrimaryFlagSrc&&lastPrimaryFlagSrc!==nextSrc){
  const previous=document.createElement('img');
  previous.className='flag flag-transition-old';
  previous.src=lastPrimaryFlagSrc;
  previous.alt='';
  previous.setAttribute('aria-hidden','true');
  content.append(previous);
  flag.classList.add('flag-transition-new');
  window.setTimeout(()=>previous.remove(),720);
 }else{
  flag.classList.add('flag-transition-new','flag-transition-first');
 }
 lastPrimaryFlagSrc=nextSrc;
}

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

function decorateTextAnswers(){
 const answers=root.querySelector('.answers');
 if(!answers)return;
 answers.classList.remove('flag-image-answers','flag-options-enter');
 answers.classList.add('flag-text-answers');

 answers.querySelectorAll('.answer').forEach(button=>{
  button.classList.add('flag-text-answer');
  button.classList.remove('long-label','very-long-label');
 });

 const card=root.querySelector('.question-card');
 const feedback=card?.classList.contains('correct')||card?.classList.contains('wrong');
 if(!feedback)animateTextAnswers(answers);
 else answers.querySelectorAll('.answer.flag-text-answer').forEach(button=>prepareStaticTextAnswer(button));
}

function decorateFlagAnswers(card){
 const answers=root.querySelector('.answers');
 if(!answers)return;
 root.dataset.flagGameVariant='countries';
 answers.classList.remove('flag-text-answers');
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

 const feedback=card?.classList.contains('correct')||card?.classList.contains('wrong');
 if(!feedback)animateFlagOptions(answers);
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

 // Keep the variant once detected. Feedback replaces the question DOM, so relying
 // only on .flag-country/.flag-capital would incorrectly fall back to "flags".
 const detectedVariant=!feedback
  ? (countryQuestion?'countries':capitalQuestion?'capitals':'flags')
  : (countryQuestion?'countries':capitalQuestion?'capitals':root.dataset.flagGameVariant||'flags');

 if(detectedVariant==='countries'){
  let record=byId.get(card.dataset.countryId);
  if(!record&&countryQuestion)record=recordFromCountryName(countryQuestion.textContent);
  if(record)card.dataset.countryId=record.id;

  card.dataset.flagVariant='countries';
  root.dataset.flagGameVariant='countries';
  badge(card,'Państwa');
  decorateFlagAnswers(card);
  card.classList.toggle('country-feedback',feedback);

  if(feedback){
   feedbackFlag(card,record);
  }else if(record&&countryQuestion){
   const name=localizedName(record);
   if(countryQuestion.textContent!==name)countryQuestion.textContent=name;
  }
  return;
 }

 card.classList.remove('country-feedback');

 if(detectedVariant==='capitals'){
  let record=byId.get(card.dataset.countryId);
  if(!record&&capitalQuestion){
   record=feedback
    ? recordFromCountryName(capitalQuestion.textContent)
    : byCapital.get(capitalQuestion.textContent.trim().toLocaleLowerCase('pl-PL'));
  }
  if(record)card.dataset.countryId=record.id;

  card.dataset.flagVariant='capitals';
  root.dataset.flagGameVariant='capitals';
  badge(card,'Stolice');
  decorateTextAnswers();
  card.classList.toggle('country-feedback',feedback);

  if(feedback)feedbackFlag(card,record);
  else if(record&&capitalQuestion&&capitalQuestion.textContent!==record.capital)capitalQuestion.textContent=record.capital;
  return;
 }

 card.dataset.flagVariant='flags';
 root.dataset.flagGameVariant='flags';
 decorateTextAnswers();
 card.classList.toggle('country-feedback',feedback);
 if(!feedback)crossfadePrimaryFlag(card);
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
