import {FLAGS} from '../data/flags.mjs';
import {Session} from '../game.mjs';
import {createContinueDrag} from '../spelling/continue-drag.mjs?v=3';
import {flagOnPole,paintFlags,prepareFlag} from './flag-on-pole.mjs?v=13-all-webp';
import {mountScenicEurope,preloadScenicEurope} from './scenic-europe.mjs';
import {SCENIC,seedOf} from './scenic-config.mjs';
import {ScenicTimeline} from './scenic-timeline.mjs';
import {preparePaper,foldPaper,preloadPaper} from './scenic-paper.mjs';
import {createSand} from './scenic-sand.mjs';
const $=id=>document.getElementById(id),app=$('scenic-screen'),hero=$('scenic-hero'),flagHost=$('scenic-flag-host');
const answers=$('scenic-answers'),sheet=$('scenic-map-scroll'),mapHost=$('scenic-europe-map');
const feedback=$('scenic-feedback'),swipe=$('scenic-swipe'),knob=$('scenic-swipe-knob'),hint=$('scenic-auto-hint');
const query=new URLSearchParams(location.search),records=new Map(FLAGS.map(x=>[x.id,x])),europe=FLAGS.filter(x=>x.continent==='europe');
const initial=records.get(query.get('country'))?.continent==='europe'?query.get('country'):'by';
const queue=[initial,'pl','ch','de','fr','cz','hu','it','lt','ua','at','sk','es','no','gb','ro','pt','se',...europe.map(x=>x.id)].filter((id,i,all)=>records.has(id)&&all.indexOf(id)===i);
app.dataset.qa=String(query.has('qa'));
const motion=matchMedia('(prefers-reduced-motion:reduce)');
let step=0,points=0,seconds=SCENIC.seconds,state='loading',timeline=new ScenicTimeline(),round=0,paused=false,visibilityPaused=false;
let readyForNext=false,fixtureTimer,game=createSession();
const continueDrag=createContinueDrag(swipe,{canContinue:()=>state==='feedback-wrong'&&readyForNext&&!paused&&!visibilityPaused,onComplete:()=>caught(toNext())});
const sand=createSand($('scenic-sand-canvas'),app,answers);
const escape=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const caught=task=>void task.catch(error=>{if(error.name!=='AbortError'){console.error('[scenic]',error);feedback.textContent='Coś poszło nie tak. Uruchom grę ponownie.';}});
const current=()=>records.get(queue[step]);
const alive=owner=>owner===timeline&&!owner.cancelled;
function setState(value){state=value;app.dataset.state=value;}
function optionsFor(record){
  if(record.id==='pl')return ['is','ch','pl','rs'].map(id=>records.get(id));
  if(record.id==='by')return ['pl','by','de','hu'].map(id=>records.get(id));
  const pool=europe.filter(x=>x.id!==record.id),offset=seedOf(record.id)%pool.length;
  const picks=[pool[offset],record,pool[(offset+13)%pool.length],pool[(offset+29)%pool.length]];
  return new Set(picks.map(x=>x.id)).size===4?picks:[record,...pool.slice(0,3)];
}
function createSession(){
  const session=new Session(owner=>{
    const record=records.get(queue[owner.question%queue.length]);
    return {kind:'flags',countryId:record.id,answer:record.id,options:optionsFor(record).map(x=>x.id)};
  },180);
  session.mode='flags';session.remaining=SCENIC.seconds*1000;session.options=optionsFor(records.get(queue[0])).map(x=>x.id);return session;
}
const letters=text=>text.split(' ').map(word=>'<span class="scenic-answer-word">'+[...word].map(ch=>'<span class="sand-letter" aria-hidden="true">'+escape(ch)+'</span>').join('')+'</span>').join(' ');
function renderButtons(options,{disabled=false}={}){
  if(!answers.children.length)answers.innerHTML=options.map(()=>'<button class="scenic-answer" type="button"><span class="scenic-answer-label" aria-hidden="true"></span></button>').join('');
  [...answers.children].forEach((button,i)=>{
    const record=options[i];button.dataset.id=record.id;button.dataset.long=String(record.country.length>17);
    button.setAttribute('aria-label',record.country);button.disabled=disabled;button.classList.remove('correct','wrong');
    button.querySelector('.scenic-answer-label').innerHTML=letters(record.country);
  });
}
function updateHud(){
  points=game.correct;seconds=Math.ceil(game.remaining/1000);
  $('scenic-clock-caption').textContent=state==='playing'||state==='loading'?'Flagi':'Czas zatrzymany';
  $('scenic-task').textContent='Zadanie '+(step+1);$('scenic-score').textContent=points+' pkt';
  $('scenic-clock').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  $('scenic-progress-fill').style.width=Math.max(0,seconds/SCENIC.seconds*100)+'%';
  $('scenic-progress').setAttribute('aria-label','Pozostało '+seconds+' sekund');
}
function fitFlag(){
  app.querySelector('.scenic-ios-status').hidden=$('scenic-stage').offsetTop>0;
  const cloth=flagHost.querySelector('.flag-cloth');if(!cloth)return;
  const ratio=(current()?.id==='ch'||current()?.id==='va'?1:4/3)/1.15;
  cloth.style.width=Math.min(hero.clientWidth*.65,hero.clientHeight*.94*ratio)+'px';
}
function showFlag(record){
  flagHost.innerHTML=flagOnPole(record,{label:'Flaga do rozpoznania'});
  const pole=flagHost.querySelector('.flag-pole');pole.replaceChildren();
  const poleImage=document.createElement('img');poleImage.src='assets/flags/adventure/scenic-pole-v4.webp';poleImage.alt='';poleImage.decoding='async';pole.append(poleImage);
  const cloth=flagHost.querySelector('.flag-cloth'),ratio=(record.id==='ch'||record.id==='va'?1:4/3)/1.15;
  cloth.style.width=Math.min(hero.clientWidth*.65,hero.clientHeight*.94*ratio)+'px';paintFlags(flagHost);
  app.dataset.country=record.id;
}
function fitCaption(){
  const title=$('scenic-country-name');if(!title.textContent)return;
  title.style.removeProperty('font-size');
  const available=title.clientWidth;if(!available)return;
  const caption=title.parentElement,style=getComputedStyle(title);
  const height=caption.clientHeight-$('scenic-country-capital').getBoundingClientRect().height-2;
  const scale=Math.min(1,available/title.scrollWidth,height/title.getBoundingClientRect().height);
  if(scale<1)title.style.fontSize=Math.max(22,parseFloat(style.fontSize)*scale*.98)+'px';
}
function placeScroll(){
  const viewport=$('scenic-stage').getBoundingClientRect();
  sheet.style.top=viewport.height*.212+'px';sheet.style.height=viewport.height*.376+'px';
}
async function warmFlag(record){
  if(!record)return;
  // Bound a slow or missing image. Existing SVG/Canvas fallback stays available.
  let timer;try{await Promise.race([prepareFlag(record,flagHost),new Promise(done=>timer=setTimeout(done,SCENIC.flagTimeoutMs))]);}
  finally{clearTimeout(timer);}
}
function resetSwipe(){continueDrag.reset();}
function clearPresentation(){
  sheet.classList.remove('is-opening','is-open','is-closing');sheet.setAttribute('aria-hidden','true');
  mapHost.replaceChildren();feedback.textContent='';feedback.classList.remove('is-ended');
  swipe.hidden=true;hint.hidden=true;resetSwipe();app.classList.remove('is-pending','is-presenting','is-transitioning');sand.clear();
}
async function playQuestion({prepared=false}={}){
  const owner=timeline;readyForNext=false;clearPresentation();setState('loading');
  const record=current();renderButtons(optionsFor(record),{disabled:true});
  const material=await preloadPaper();if(!alive(owner))return;
  app.dataset.questionPaper=material.question?'ready':'fallback';
  if(!prepared)await warmFlag(record);if(!alive(owner))return;
  showFlag(record);for(const b of answers.children)b.disabled=false;game.setPresentationHold(false);setState('playing');updateHud();
  void warmFlag(records.get(queue[(step+1)%queue.length]));void preloadScenicEurope().catch(()=>{});
}
async function respond(chosenId){
  if(state!=='playing'||paused||visibilityPaused)return;
  const owner=timeline,record=current(),correct=chosenId===record.id;
  setState('showing-map');app.classList.add('is-pending');
  game.answer(chosenId);game.setPresentationHold(true);updateHud();
  for(const button of answers.children){button.disabled=true;button.classList.toggle('correct',button.dataset.id===record.id);button.classList.toggle('wrong',button.dataset.id===chosenId&&!correct);}
  feedback.innerHTML=correct?'<strong>Świetnie!</strong><small>Zapamiętaj kraj i stolicę.</small>':'<strong>Zapamiętaj kraj i jego stolicę.</strong>';
  $('scenic-map-flag').src=new URL('assets/flags/cloth-prebaked/'+record.id+'.webp',document.baseURI).href;
  $('scenic-map-flag').onerror=()=>{$('scenic-map-flag').onerror=null;$('scenic-map-flag').src=new URL(record.flagSvg,document.baseURI).href;};
  $('scenic-country-name').textContent=record.country;$('scenic-country-capital').textContent='Stolica: '+record.capital;
  sheet.dataset.long=String(record.country.length>15);placeScroll();sheet.setAttribute('aria-hidden','false');
  const mountPoint=document.createElement('div');mountPoint.style.cssText='position:absolute;inset:0';mapHost.replaceChildren(mountPoint);
  let timer,mapResult;
  try{mapResult=await Promise.race([mountScenicEurope(mountPoint,{record}),new Promise(done=>timer=setTimeout(()=>done({found:false}),SCENIC.mapTimeoutMs))]);}
  finally{clearTimeout(timer);}
  if(!alive(owner))return;
  if(!mapResult?.found){
    mapHost.replaceChildren();const note=document.createElement('p');note.className='scenic-map-unavailable';note.textContent='Mapa jest chwilowo niedostępna.';mapHost.append(note);
  }
  // Map decoding and the fold snapshot precede the entire learning interval.
  await document.fonts.ready;if(!alive(owner))return;fitCaption();
  await preparePaper(sheet,mapResult,record,{isCurrent:()=>alive(owner)});if(!alive(owner))return;
  app.classList.add('is-presenting');
  await foldPaper(sheet,{opening:true,timeline:owner,reduced:motion.matches});if(!alive(owner))return;
  setState(correct?'feedback-correct':'feedback-wrong');readyForNext=true;
  if(correct){
    hint.hidden=false;
    if(!query.has('freeze')){await owner.wait(SCENIC.memoryMs);if(alive(owner))await toNext();}
  }else{swipe.hidden=false;resetSwipe();}
}
async function toNext(){
  if(!readyForNext||paused||visibilityPaused||!['feedback-correct','feedback-wrong'].includes(state))return;
  const owner=timeline;readyForNext=false;setState('preparing-next');hint.hidden=true;swipe.hidden=true;
  const nextStep=(step+1)%queue.length,next=records.get(queue[nextStep]);
  await warmFlag(next);if(!alive(owner))return;
  setState('transition');feedback.textContent='';
  // The decoded next cloth sits beneath the paper before the folds close.
  showFlag(next);
  await Promise.all([
    foldPaper(sheet,{opening:false,timeline:owner,reduced:motion.matches}).then(()=>{if(alive(owner))app.classList.add('is-transitioning');}),
    sand.transition({timeline:owner,reduced:motion.matches,seed:seedOf(next.id+':'+(++round)),replace:()=>renderButtons(optionsFor(next),{disabled:true})})
  ]);
  if(!alive(owner))return;
  game.next();game.options=optionsFor(next).map(x=>x.id);game.setPresentationHold(false);step=nextStep;clearPresentation();setState('playing');updateHud();for(const b of answers.children)b.disabled=false;
  // Keep the very same cloth and answer DOM after completion (no second paint).
  void warmFlag(records.get(queue[(step+1)%queue.length]));
}
function syncPause(){
  if(paused||visibilityPaused){game.pause();resetSwipe();}else game.resume();
  timeline.setPaused(paused||visibilityPaused);app.classList.toggle('is-paused',paused);
  const button=app.querySelector('[data-action="pause"]');button.textContent=paused?'▷':'Ⅱ';button.setAttribute('aria-label',paused?'Wznów':'Pauza');button.setAttribute('aria-pressed',String(paused));
  answers.inert=paused;swipe.inert=paused;
}
function restart(){
  clearTimeout(fixtureTimer);timeline.cancel();timeline=new ScenicTimeline();
  step=0;points=0;seconds=SCENIC.seconds;game=createSession();paused=false;readyForNext=false;syncPause();caught(playQuestion());
}
answers.addEventListener('click',event=>{const button=event.target.closest('.scenic-answer');if(button&&!button.disabled)caught(respond(button.dataset.id));});
app.querySelector('[data-action="restart"]').addEventListener('click',restart);
app.querySelector('[data-action="pause"]').addEventListener('click',()=>{if(state==='ended')return;paused=!paused;syncPause();});
const ticker=setInterval(()=>{
  if(state!=='playing'||paused||visibilityPaused)return;game.tick();const previous=seconds;seconds=Math.ceil(game.remaining/1000);if(seconds!==previous)updateHud();
  if(!seconds){setState('ended');for(const b of answers.children)b.disabled=true;feedback.textContent='Dobra robota! Zdobywasz '+points+' pkt.';feedback.classList.add('is-ended');}
},100);
document.addEventListener('visibilitychange',()=>{visibilityPaused=document.hidden;syncPause();});
// Test-only capture bridge: freeze Canvas without changing the photographed UI.
if(query.has('qa'))window.addEventListener('scenic-qa-pause',event=>timeline.setPaused(event.detail===true||paused||visibilityPaused));
const observer=new ResizeObserver(()=>{fitFlag();placeScroll();fitCaption();});observer.observe($('scenic-stage'));
window.addEventListener('pagehide',()=>{timeline.cancel();clearInterval(ticker);clearTimeout(fixtureTimer);observer.disconnect();continueDrag.destroy();sand.clear();});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
motion.addEventListener('change',()=>{if(state==='transition'||state==='showing-map')restart();});
caught((async()=>{
  const owner=timeline;await Promise.all([document.fonts.ready,preloadPaper()]);if(!alive(owner))return;await playQuestion();
  const fixture=query.get('state');if(['correct','wrong'].includes(fixture))fixtureTimer=setTimeout(()=>caught(respond(fixture==='correct'?current().id:optionsFor(current()).find(x=>x.id!==current().id).id)),100);
})());
