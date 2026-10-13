import {FLAGS} from '../data/flags.mjs';
import {flagOnPole,paintFlags} from './flag-on-pole.mjs?v=13-all-webp';
import {mountScenicEurope} from './scenic-europe.mjs?v=1';

const $=id=>document.getElementById(id);
const app=$('scenic-screen'),hero=$('scenic-hero'),flagHost=$('scenic-flag-host');
const answers=$('scenic-answers'),sheet=$('scenic-map-scroll'),mapHost=$('scenic-europe-map');
const scoreNode=$('scenic-score'),taskNode=$('scenic-task'),feedback=$('scenic-feedback');
const swipe=$('scenic-swipe'),knob=$('scenic-swipe-knob'),autohint=$('scenic-auto-hint');
const sand=$('scenic-sand-canvas'),sandctx=sand.getContext('2d',{alpha:true});
const query=new URLSearchParams(location.search);
const records=new Map(FLAGS.map(x=>[x.id,x]));
const europe=FLAGS.filter(x=>x.continent==='europe');
const initial=records.get(query.get('country'))?.continent==='europe' ? query.get('country') : 'by';
const queue=[initial,'pl','ch','de','fr','cz','hu','it','lt','ua','at','sk','es','no','gb','ro','pt','se'].filter((id,i,array)=>records.has(id)&&array.indexOf(id)===i);
let step=0,points=0,state='playing',seconds=166,ticker,swipePointer=null,slideMax=0;
let transitionToken=0,readyForNext=false,autoTimer=null,currentOptions=[];
let reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const escape=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const delay=ms=>new Promise(done=>setTimeout(done,reduceMotion?0:ms));
const name=record=>record.country;
const fmtTime=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
const seedOf=id=>[...id].reduce((v,c)=>(Math.imul(v,31)+c.charCodeAt(0))>>>0,13579);
function optionsFor(record){
  if(record.id==='by')return ['pl','by','de','hu'].map(id=>records.get(id));
  const pool=europe.filter(x=>x.id!==record.id);
  const seed=seedOf(record.id);const offset=seed%Math.max(1,pool.length);
  const picks=[record,pool[offset],pool[(offset+13)%pool.length],pool[(offset+29)%pool.length]];
  if(new Set(picks.map(x=>x.id)).size!==4){
    return [record,...pool.filter(x=>x.id!==pool[offset]?.id).slice(0,3)];
  }
  return [picks[1],picks[0],picks[2],picks[3]];
}
const letters=text=>[...String(text)].map((ch,i)=>
 '<span class="sand-letter" style="--char-index:'+i+'" aria-hidden="true">'+(ch===' '?'&nbsp;':escape(ch))+'</span>').join('');
function renderButtons(optionList){
  currentOptions=optionList;
  answers.innerHTML=optionList.map(record=>
    '<button class="scenic-answer" type="button" data-id="'+escape(record.id)+'" aria-label="'+escape(name(record))+'"><span class="scenic-answer-label" aria-hidden="true">'+letters(name(record))+'</span></button>'
  ).join('');
}
function updateHud(){
  taskNode.textContent='Zadanie '+(step+1);
  scoreNode.textContent=points+' '+(points===1?'pkt':'pkt');
  $('scenic-clock').textContent=fmtTime(seconds);
  $('scenic-progress-fill').style.width=Math.max(4,(1-step/queue.length)*100)+'%';
}
const flagUrl=id=>new URL('assets/flags/cloth-prebaked/'+id+'.webp',document.baseURI).href;
const preloaded=new Set();
function preload(id){
 if(!id||preloaded.has(id))return;
 preloaded.add(id);
 const image=new Image();image.src=flagUrl(id);
 image.decode?.().catch(()=>{});
}
function showFlag(record){
 flagHost.innerHTML=flagOnPole(record,{label:'Flaga do rozpoznania'});
 const cloth=flagHost.querySelector('.flag-cloth');
 cloth.style.width='79%';
 paintFlags(flagHost);
}
function playQuestion(){
 clearTimeout(autoTimer);readyForNext=false;
 state='playing';app.classList.remove('is-pending','is-presenting','is-transitioning');
 sheet.classList.remove('is-opening','is-open','is-closing');sheet.setAttribute('aria-hidden','true');
 mapHost.replaceChildren();
 feedback.textContent='';swipe.hidden=true;autohint.hidden=true;
 const record=records.get(queue[step]);
 showFlag(record);renderButtons(optionsFor(record));answers.classList.remove('is-growing','is-sanding');
 updateHud();
 preload(queue[step+1]);void window.MalaNaukaContinentMap?.preload?.('europe').catch(()=>{});
}
function placeScroll(){
 const viewport=app.getBoundingClientRect(),h=hero.getBoundingClientRect(),p=$('scenic-paper-row').getBoundingClientRect();
 const y=h.top-viewport.top+6;
 const maxHeight=p.bottom-viewport.top-y+4;
 const top=Math.max(150,y);
 sheet.style.top=top+'px';
 sheet.style.height=Math.max(185,maxHeight)+'px';
}
function startTicker(){
 clearInterval(ticker);
 ticker=setInterval(()=>{
   if(state!=='playing'||app.classList.contains('is-paused'))return;
   seconds=Math.max(0,seconds-1);$('scenic-clock').textContent=fmtTime(seconds);
   if(!seconds){state='ended';feedback.textContent='Koniec czasu! Dobra robota.';swipe.hidden=true;autohint.hidden=true}
 },1000);
}
async function respond(chosenId,{fixture=false}={}){
 if(state!=='playing')return;
 const record=records.get(queue[step]);if(!record)return;
 state='showing-map';app.classList.add('is-pending','is-presenting');app.classList.remove('is-transitioning');const token=++transitionToken;
 const correct=chosenId===record.id;if(correct)points++;
 updateHud();
 for(const button of answers.querySelectorAll('button')){
   button.disabled=true;
   button.classList.toggle('correct',button.dataset.id===record.id);
   button.classList.toggle('wrong',button.dataset.id===chosenId&&!correct);
 }
 feedback.textContent=correct?'✦ Świetnie!':'Spokojnie, zapamiętaj odpowiedź.';
 $('scenic-country-name').textContent=name(record);
 $('scenic-country-capital').textContent='★ Stolica: '+record.capital;
 placeScroll();
 sheet.classList.remove('is-open','is-closing','is-opening');
 sheet.setAttribute('aria-hidden','false');
 await mountScenicEurope(mapHost,{record}).catch(()=>({found:false}));
 if(token!==transitionToken)return;
 // The map is completely mounted before parchment starts opening.
 requestAnimationFrame(()=>requestAnimationFrame(()=>sheet.classList.add('is-opening')));
 await delay(1170);
 if(token!==transitionToken)return;
 sheet.classList.remove('is-opening');sheet.classList.add('is-open');
 state=correct?'feedback-correct':'feedback-wrong';readyForNext=true;
 if(correct){
   autohint.hidden=false;
   // A full memory interval after the atlas is visible, including on a right answer.
   if(!query.has('freeze')&&!fixture)autoTimer=setTimeout(()=>void toNext(),3900);
   else if(!query.has('freeze')&&fixture)autoTimer=setTimeout(()=>void toNext(),3900);
 }else{swipe.hidden=false;knob.style.transform='translateX(0px)'}
}
function resizeSand(){
 const dpr=Math.min(devicePixelRatio||1,2);
 sand.width=Math.round(app.clientWidth*dpr);sand.height=Math.round(app.clientHeight*dpr);
 sandctx.setTransform(dpr,0,0,dpr,0,0);
}
let sandAnimation=0;
function fallIntoSand(){
 cancelAnimationFrame(sandAnimation);resizeSand();
 const origin=app.getBoundingClientRect(),particles=[];
 let rng=seedOf(queue[step]);const rand=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
 const spans=[...answers.querySelectorAll('.sand-letter')];
 for(const span of spans){
   if(span.textContent.trim()==='')continue;
   const rect=span.getBoundingClientRect(),parent=span.closest('.scenic-answer').getBoundingClientRect();
   const x=rect.left-origin.left+rect.width/2,y=rect.top-origin.top+rect.height*.62;
   const center=parent.left-origin.left+parent.width/2;
   const ground=parent.bottom-origin.top-9;
   for(let i=0;i<15;i++){
     const dx=(rand()-.5)*Math.max(4,rect.width*.75);
     const target=center+(rand()-.5)*Math.min(parent.width*.65,88);
     particles.push({
       x:x+dx,y:y+(rand()-.5)*rect.height*.7,
       tx:target,ty:ground-(1-Math.abs(target-center)/55)*(2+rand()*11),
       delay:rand()*.19,spread:(rand()-.5)*24,
       size:1.35+rand()*1.8,
       shade:['#66482f','#7b593e','#987053','#4c3b32'][Math.floor(rand()*4)]
     });
   }
 }
 answers.classList.add('is-sanding');return new Promise(resolve=>{
   if(reduceMotion){sandctx.clearRect(0,0,app.clientWidth,app.clientHeight);resolve();return;}
   const start=performance.now(),duration=1100;
   function frame(now){
     let t=Math.min(1,(now-start)/duration);
     sandctx.clearRect(0,0,app.clientWidth,app.clientHeight);
     for(const grain of particles){
       const q=Math.min(1,Math.max(0,(t-grain.delay)/(1-grain.delay)));
       const fall=Math.min(1,q/.81);
       const arc=grain.spread*Math.sin(fall*Math.PI);
       const x=grain.x+(grain.tx-grain.x)*fall+arc;
       const ballistic=grain.y+(grain.ty-grain.y)*fall*fall;
       const bounce=fall>.82?Math.sin((fall-.82)/.18*Math.PI)*4*(1-fall):0;
       sandctx.fillStyle=grain.shade;
       sandctx.fillRect(x,ballistic-bounce,grain.size,grain.size);
     }
     if(t<1)sandAnimation=requestAnimationFrame(frame);else resolve();
   }
   sandAnimation=requestAnimationFrame(frame);
 });
}
let goingNext=false;
async function toNext(){
 if(goingNext||!readyForNext||state==='playing'||state==='ended')return;
 goingNext=true;readyForNext=false;clearTimeout(autoTimer);
 state='transition';app.classList.add('is-transitioning');app.classList.remove('is-presenting');const token=++transitionToken;
 autohint.hidden=true;swipe.hidden=true;feedback.textContent='';
 // Load the next flag *under* the unrolling sheet, then roll the sheet down.
 const next=step+1<queue.length?step+1:0,nextRecord=records.get(queue[next]);
 preload(nextRecord.id);
 const sandbox=fallIntoSand();
 await delay(85);
 if(token!==transitionToken)return;
 showFlag(nextRecord);
 sheet.classList.remove('is-open','is-opening');sheet.classList.add('is-closing');
 // Keep old answer buttons while their 15 grains/letter are settling.
 await delay(820);
 step=next;
 renderButtons(optionsFor(nextRecord));
 answers.classList.remove('is-sanding');answers.classList.add('is-growing');
 await sandbox;
 sandctx.clearRect(0,0,app.clientWidth,app.clientHeight);
 await delay(400);
 if(token!==transitionToken)return;
 sheet.classList.remove('is-closing');sheet.setAttribute('aria-hidden','true');
 mapHost.replaceChildren();answers.classList.remove('is-growing');
 goingNext=false;playQuestion();
}
function setupSwipe(){
 const reset=()=>{if(swipePointer!==null)swipePointer=null;knob.style.transform='translateX(0px)'};
 knob.addEventListener('pointerdown',event=>{
   if(state!=='feedback-wrong')return;
   swipePointer=event.pointerId;knob.setPointerCapture(event.pointerId);
   slideMax=Math.max(0,swipe.clientWidth-knob.clientWidth-9);
   event.preventDefault();
   knob.dataset.downX=String(event.clientX);
 });
 knob.addEventListener('pointermove',event=>{
   if(swipePointer!==event.pointerId)return;
   const dx=Math.max(0,Math.min(slideMax,event.clientX-Number(knob.dataset.downX)));
   knob.style.transform='translateX('+dx+'px)';knob.dataset.dragX=String(dx);
 });
 knob.addEventListener('pointerup',event=>{
   if(swipePointer!==event.pointerId)return;
   const done=Number(knob.dataset.dragX)>=slideMax*.82;
   reset();if(done)void toNext();
 });
 knob.addEventListener('pointercancel',reset);
 knob.addEventListener('keydown',event=>{
   if(state==='feedback-wrong'&&(event.key==='Enter'||event.key===' ')){
     event.preventDefault();void toNext();
   }
 });
}
// Desktop-only, maximum ±2 degrees, coalesced in requestAnimationFrame.
const tiltQueue=new Map();
let tiltFrame=0;
function updateTilt(){
 tiltFrame=0;
 for(const [element,coord] of tiltQueue){
  if(!element.isConnected)continue;
  element.style.setProperty('--tilt-x',(coord.y*-2).toFixed(2)+'deg');
  element.style.setProperty('--tilt-y',(coord.x*2).toFixed(2)+'deg');
 }
 tiltQueue.clear();
}
if(matchMedia('(hover:hover) and (pointer:fine)').matches){
 answers.addEventListener('pointermove',event=>{
  const el=event.target.closest('.scenic-answer');if(!el||el.disabled)return;
  const box=el.getBoundingClientRect();
  tiltQueue.set(el,{
   x:Math.max(-1,Math.min(1,((event.clientX-box.left)/box.width-.5)*2)),
   y:Math.max(-1,Math.min(1,((event.clientY-box.top)/box.height-.5)*2))
  });
  if(!tiltFrame)tiltFrame=requestAnimationFrame(updateTilt);
 });
 answers.addEventListener('pointerout',event=>{
  const el=event.target.closest('.scenic-answer');
  if(!el||el.contains(event.relatedTarget))return;
  el.style.removeProperty('--tilt-x');el.style.removeProperty('--tilt-y');
 });
}
answers.addEventListener('click',event=>{
 const button=event.target.closest('.scenic-answer');
 if(button&&!button.disabled)void respond(button.dataset.id);
});
app.querySelector('[data-action="restart"]').addEventListener('click',()=>{
 transitionToken++;clearTimeout(autoTimer);cancelAnimationFrame(sandAnimation);sandctx.clearRect(0,0,app.clientWidth,app.clientHeight);
 points=0;step=0;seconds=166;goingNext=false;playQuestion();
});
app.querySelector('[data-action="pause"]').addEventListener('click',event=>{
 if(state==='ended')return;app.classList.toggle('is-paused');
 event.currentTarget.setAttribute('aria-label',app.classList.contains('is-paused')?'Wznów':'Pauza');
});
const observer=new ResizeObserver(()=>{if(state==='playing')return;placeScroll()});
observer.observe(app);
setupSwipe();playQuestion();startTicker();
const initialState=query.get('state');
if(initialState==='correct'||initialState==='wrong'){
 setTimeout(()=>{
   const record=records.get(queue[step]);
   const wrong=optionsFor(record).find(x=>x.id!==record.id);
   void respond(initialState==='correct'?record.id:wrong.id,{fixture:true});
 },450);
}
