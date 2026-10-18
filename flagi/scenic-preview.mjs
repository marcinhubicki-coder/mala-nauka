import {FLAGS} from '../data/flags.mjs';
import {Session} from '../game.mjs';
import {createContinueDrag} from '../spelling/continue-drag.mjs?v=3';
import {flagOnPole,paintFlags,prepareFlag} from './flag-on-pole.mjs?v=39-decoded';
import {mountScenicEurope,preloadScenicEurope,scenicNeighborIds} from './scenic-europe.mjs?v=39';
import {COPY,localizedRecord} from './scenic-language.mjs?v=39';
import {SCENIC,seedOf} from './scenic-config.mjs?v=36';
import {ScenicTimeline} from './scenic-timeline.mjs?v=36';
import {placePaper,foldPaper,preloadPaper} from './scenic-paper.mjs?v=36';
import {createSand} from './scenic-sand.mjs?v=36';
import {createMapInk} from './scenic-ink.mjs?v=39';
import {prepareScenicScene,createScenicGate,decodeScenicImage} from './scenic-ready.mjs?v=39';
const $=id=>document.getElementById(id),app=$('scenic-screen'),hero=$('scenic-hero'),flagHost=$('scenic-flag-host');
const answers=$('scenic-answers'),sheet=$('scenic-map-scroll'),mapHost=$('scenic-europe-map');
const feedback=$('scenic-feedback'),swipe=$('scenic-swipe'),knob=$('scenic-swipe-knob'),hint=$('scenic-auto-hint');
const captionMeasure=document.createElement('canvas').getContext('2d'),neighborLayouts=new Map();
const query=new URLSearchParams(location.search),records=new Map(FLAGS.map(x=>[x.id,x]));
const hostedSession=window.frameElement?.scenicSession,byName=new Map(FLAGS.map(r=>[r.country,r]));
if(hostedSession){const inset=window.frameElement.scenicInsets;app.style.setProperty('--safe-top',inset.top+'px');app.style.setProperty('--safe-bottom',inset.bottom+'px');}
let hostedActive=!hostedSession||window.frameElement.scenicActive===true,hostPaused=false;
let language=query.get('lang')==='en'?'en':'pl',lastMapResult;
const local=record=>localizedRecord(record,language),copy=()=>COPY[language];
const scope=FLAGS.filter(r=>!query.has('category')||query.get('category')==='all'||r.continent===query.get('category'));
const pool=[...(scope.length?scope:FLAGS)];
if(!query.has('country')&&!query.has('qa'))for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
const initial=records.has(query.get('country'))?query.get('country'):pool[0].id;
const queue=[initial,...pool.map(x=>x.id)].filter((id,i,all)=>records.has(id)&&all.indexOf(id)===i);
app.dataset.qa=String(query.has('qa'));
const motion=matchMedia('(prefers-reduced-motion:reduce)');
let step=0,points=0,seconds=SCENIC.seconds,state='loading',timeline=new ScenicTimeline(),round=0,paused=false,visibilityPaused=false;
let readyForNext=false,fixtureTimer,game=hostedSession||createSession();
const roundSeconds=hostedSession?.duration||SCENIC.seconds;
const entry=createScenicGate(app,()=>language);
const continueDrag=createContinueDrag(swipe,{canContinue:()=>state==='feedback-wrong'&&readyForNext&&!paused&&!visibilityPaused&&!hostPaused&&hostedActive,completionDelay:SCENIC.feedback.exitDelayMs,onComplete:()=>caught(toNext())});
const sand=createSand($('scenic-sand-canvas'),app,answers);
const mapInk=createMapInk($('scenic-map-ink'),sheet,app);
const escape=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const caught=task=>void task.catch(error=>{if(error.name!=='AbortError'){console.error('[scenic]',error);feedback.textContent='Coś poszło nie tak. Uruchom grę ponownie.';}});
const current=()=>records.get(hostedSession?game.current.countryId:queue[step]);
const optionRecords=values=>values.map(value=>records.get(value)||byName.get(value));
const optionsNow=()=>hostedSession?optionRecords(game.options):optionsFor(current());
const alive=owner=>owner===timeline&&!owner.cancelled;
function setState(value){state=value;app.dataset.state=value;$('scenic-language').disabled=!['playing','feedback-correct','feedback-wrong'].includes(value);}
function optionsFor(record){
  if(record.id==='pl')return ['is','ch','pl','rs'].map(id=>records.get(id));
  if(record.id==='by')return ['pl','by','de','hu'].map(id=>records.get(id));
  const pool=FLAGS.filter(x=>x.id!==record.id&&x.continent===record.continent),offset=seedOf(record.id)%pool.length;
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
  if(!answers.children.length)answers.innerHTML=options.map(()=>'<button class="scenic-answer" type="button"><i class="scenic-paper-center" aria-hidden="true"></i><span class="scenic-answer-label" aria-hidden="true"></span><span class="scenic-answer-mark" aria-hidden="true">×</span></button>').join('');
  [...answers.children].forEach((button,i)=>{
    const record=local(options[i]);button.dataset.id=record.id;button.dataset.long=String(record.country.length>17);
    button.setAttribute('aria-label',record.country);button.disabled=disabled;button.classList.remove('correct','wrong');
    button.querySelector('.scenic-answer-label').innerHTML=letters(record.country);
  });
}
function alignNextOptions(options){
  const previous=[...answers.children].map(b=>local(records.get(b.dataset.id)).country.length);
  let best=options,bestCost=Infinity;
  function visit(rest,order,cost){
    if(!rest.length){if(cost<bestCost){best=order;bestCost=cost;}return;}
    for(const record of rest)visit(rest.filter(r=>r!==record),[...order,record],cost+(local(record).country.length-previous[order.length])**2);
  }
  visit(options,[],0);return best;
}
function updateHud(){
  points=game.correct;seconds=Math.ceil(game.remaining/1000);
  $('scenic-clock-caption').textContent=state==='playing'||state==='loading'?copy().flags:copy().stopped;
  $('scenic-task').textContent=copy().task+' '+(step+1);$('scenic-score').textContent=points+(language==='pl'?' pkt':' pts');
  $('scenic-clock').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  $('scenic-progress-fill').style.width=Math.max(0,seconds/roundSeconds*100)+'%';
  $('scenic-progress').setAttribute('aria-label',language==='pl'?'Pozostało '+seconds+' sekund':seconds+' seconds remaining');
}
function fitFlag(){
  const cloth=flagHost.querySelector('.flag-cloth');if(!cloth)return;
  const ratio=(app.dataset.country==='ch'||app.dataset.country==='va'?1:4/3)/1.15;
  const stage=$('scenic-stage'),mast=SCENIC.mast,scale=Math.max(app.clientWidth/mast.imageWidth,app.clientHeight/mast.imageHeight)*mast.zoom;
  const top=mast.attachY*scale-stage.offsetTop,left=(app.clientWidth-mast.imageWidth*scale)/2+mast.attachX*scale;
  cloth.style.left=left+'px';cloth.style.top=top+'px';
  cloth.style.width=Math.min(app.clientWidth*.61,Math.max(80,$('scenic-paper-row').offsetTop-top-6)*ratio)+'px';
}
function showFlag(record){
  flagHost.innerHTML=flagOnPole(record,{label:'Flaga do rozpoznania'});
  flagHost.querySelector('.flag-pole')?.remove();
  app.dataset.country=record.id;syncAtlasScope();fitFlag();paintFlags(flagHost);
  return Promise.all([...flagHost.querySelectorAll('img')].map(image=>image.decode().catch(()=>null)));
}
function syncAtlasScope(){
  const russia=app.dataset.country==='ru',scope=$('scenic-atlas-context'),full=sheet.dataset.view==='europe';
  scope.hidden=!russia||!app.classList.contains('is-presenting');scope.textContent=language==='pl'?(full?'Rosja · Europa i Azja':'Rosja · część europejska'):(full?'Russia · Europe and Asia':'Russia · European part');
  const continent=records.get(app.dataset.country)?.continent||'europe',names={europe:['Europa','Europe'],asia:['Azja','Asia'],africa:['Afryka','Africa'],'north-america':['Ameryka Północna','North America'],'south-america':['Ameryka Południowa','South America'],oceania:['Oceania','Oceania']};
  sheet.querySelector('[data-map-view="europe"]').setAttribute('aria-label',russia?(language==='pl'?'Europa i Azja':'Europe and Asia'):names[continent][language==='pl'?0:1]);
}
function fitCaption(forRecord=current()){
  const title=$('scenic-country-name');if(!title.textContent)return;
  const record=local(forRecord),parent=title.parentElement,style=getComputedStyle(title);
  const available=parent.clientWidth-parseFloat(getComputedStyle(parent).paddingRight);
  const fits=(text,size)=>{captionMeasure.font=`700 ${size}px ${style.fontFamily}`;captionMeasure.letterSpacing='-.35px';return captionMeasure.measureText(text).width<=available;};
  let lines=[record.country],size=[28,26,24,22,20,18].find(n=>fits(record.country,n));
  if(!size){
    const words=record.country.split(' ');let best=Infinity;
    for(let i=1;i<words.length;i++){const pair=[words.slice(0,i).join(' '),words.slice(i).join(' ')];captionMeasure.font=`700 18px ${style.fontFamily}`;const width=Math.max(...pair.map(t=>captionMeasure.measureText(t).width));if(width<best){best=width;lines=pair;}}
    size=18;
  }
  title.setAttribute('aria-label',record.country);title.style.fontSize=size+'px';
  title.replaceChildren(...lines.map(text=>{const line=document.createElement('span');line.className='scenic-title-line';line.textContent=text;return line;}));
  parent.style.setProperty('--title-lines',lines.length);parent.style.setProperty('--title-size',size+'px');
  // One common capital slot, tucked directly below the pen face's descenders.
  captionMeasure.font=`700 28px ${style.fontFamily}`;
  const descent=captionMeasure.measureText('gjpqy').actualBoundingBoxDescent-captionMeasure.measureText('Polska').actualBoundingBoxDescent;
  const capitalTop=title.clientHeight+Math.ceil(descent)+1;
  const capital=$('scenic-country-capital'),capitalStyle=getComputedStyle(capital),capitalWidth=Math.max(40,available-23);
  const capitalSize=[16,15,14,13,12,11].find(n=>{captionMeasure.font=`${capitalStyle.fontWeight} ${n}px ${capitalStyle.fontFamily}`;return captionMeasure.measureText(record.capital).width<=capitalWidth;})||11;
  capital.style.fontSize=capitalSize+'px';
  parent.style.setProperty('--capital-top',capitalTop+'px');parent.style.setProperty('--caption-height',(capitalTop+18)+'px');
}
function neighborPartition(sizes,max,firstMax=max){
 let best=null;
 function visit(index,rows){
  if(index===sizes.length){const widths=rows.map(a=>a.reduce((sum,i)=>sum+sizes[i],0)+(a.length-1)*5),score=rows.length*10000+Math.max(...widths)-Math.min(...widths)+(widths.at(-1)>widths[0]?90:0)+(rows.at(-1).length===1&&sizes[rows.at(-1)[0]]<110?140:0);if(!best||score<best.score)best={rows:rows.map(a=>[...a]),score};return;}
  const row=[];let width=0;for(let i=index;i<sizes.length;i++){width+=sizes[i]+(row.length?5:0);if(width>(rows.length?max:firstMax)&&row.length)break;row.push(i);visit(i+1,[...rows,[...row]]);}
 }visit(0,[]);return best;
}
async function prepareNeighborLayout(record){
 const key=record.id+':'+language;if(neighborLayouts.has(key))return;
 const ids=await scenicNeighborIds(record),probe=$('scenic-neighbors').cloneNode(false);probe.removeAttribute('id');probe.hidden=false;probe.dataset.rows='3';probe.dataset.wide='false';probe.style.cssText='position:absolute;left:0;right:auto;top:0;visibility:hidden;pointer-events:none';
 const row=document.createElement('div');row.className='scenic-neighbor-row is-measuring';const label=document.createElement('b');label.textContent=`${copy().neighbors} (${ids.length}):`;row.append(label);
 for(const id of ids){const button=document.createElement('button');button.textContent=local(records.get(id)).country;row.append(button);}if(!ids.length){const note=document.createElement('span');note.textContent=copy().none;row.append(note);}probe.append(row);$('scenic-stage').append(probe);
 const max=probe.clientWidth-20;let plan=neighborPartition([...row.children].map(n=>n.getBoundingClientRect().width),max);
 if(plan.rows.length>3){probe.dataset.wide='true';probe.dataset.rows='4';plan=neighborPartition([...row.children].map(n=>n.getBoundingClientRect().width),max,answers.clientWidth-20);}
 neighborLayouts.set(key,{rows:Math.max(3,plan.rows.length)});probe.remove();
}
function measureScroll(record=current()){
  const viewport=$('scenic-stage').getBoundingClientRect();
  // Reserve the feedback stack before answering, so revealing neighbors never
  // moves a choice under the child's finger. Include the compass above its rail.
  const controls=$('scenic-controls').getBoundingClientRect(),knobSize=parseFloat(getComputedStyle(knob).height);
  const railTop=controls.top-viewport.top-Math.max(0,(knobSize-controls.height)/2);
  const rows=neighborLayouts.get(record.id+':'+language)?.rows||(record.id==='ru'?4:SCENIC.neighbors.rows),rowHeight=rows>=4?31:SCENIC.neighbors.rowHeight;
  const ribbons=rows*rowHeight+(rows+1)*SCENIC.neighbors.gap;
  const answerHeight=answers.getBoundingClientRect().height;
  const answerTop=Math.min(viewport.height*.62,railTop-ribbons-answerHeight);
  const compassTop=$('scenic-progress').getBoundingClientRect().bottom-viewport.top+SCENIC.atlas.compassGap;
  const top=compassTop+24,height=answerTop-SCENIC.atlas.answerGap-top;
  return {viewport,answerTop,top,height};
}
function placeScroll(){
  const {viewport,answerTop,top,height}=measureScroll();
  answers.style.top=answerTop+'px';
  const answer=answers.getBoundingClientRect();
  sheet.style.top=top+'px';sheet.style.height=height+'px';
  const paper=$('scenic-paper-row'),closed=Math.min(64,Math.max(50,viewport.height*.075))+20;paper.style.height=closed+'px';paper.style.top=(top+height-closed)+'px';
  $('scenic-compass').style.top=(top-24)+'px';
  const origin=app.getBoundingClientRect(),boy=app.querySelector('.scenic-boy'),boyHeight=app.clientHeight-(answer.bottom-origin.top-10)+12;
  boy.style.height=boyHeight+'px';boy.style.left=(-boyHeight*.4)+'px';
  $('scenic-neighbors').style.top=(answer.bottom-viewport.top+SCENIC.neighbors.gap)+'px';
  fitFlag();
  if(!sheet.classList.contains('is-opening')&&!sheet.classList.contains('is-closing'))placePaper(sheet);
}
async function showNeighbors(result,owner,{immediate=false,withSlider=false}={}){
  if(!result?.found){
    if(withSlider){swipe.hidden=false;resetSwipe();if(!motion.matches&&!immediate)await owner.animate($('scenic-controls'),[{transform:`translateY(${exitDistance()}px)`},{transform:'translateY(0)'}],{duration:SCENIC.feedback.ribbonMs,easing:'cubic-bezier(.16,.8,.2,1)',fill:'backwards'});}
    return;
  }
  const nav=$('scenic-neighbors'),ids=result.neighbors.filter(id=>records.has(id));
  nav.dataset.wide='false';nav.dataset.rows=String(neighborLayouts.get(current().id+':'+language)?.rows||3);
  const buttons=ids.map(id=>{const b=document.createElement('button');b.type='button';b.dataset.neighbor=id;b.textContent=local(records.get(id)).country;b.setAttribute('aria-pressed','false');return b;});
  const label=document.createElement('b');label.textContent=`${copy().neighbors} (${ids.length}):`;
  const items=[label,...buttons];if(!ids.length){const empty=document.createElement('span');empty.textContent=copy().none;items.push(empty);}
  const measure=document.createElement('div');measure.className='scenic-neighbor-row is-measuring';measure.append(...items);nav.replaceChildren(measure);nav.hidden=false;
  let sizes=items.map(n=>n.getBoundingClientRect().width);const max=nav.clientWidth-20;
  // Partition in compass order. Prefer a broad first ribbon and a shorter second
  // one; avoid leaving a lone short country on the last ribbon.
  let best=neighborPartition(sizes,max);
  if(best.rows.length>SCENIC.neighbors.rows){
    // The first ribbon is above the face; it can use the answer width. Later
    // ribbons keep their narrow width so the boy stays visible on the left.
    nav.dataset.wide='true';nav.style.setProperty('--neighbor-narrow-width',(max+20)+'px');
    sizes=items.map(n=>n.getBoundingClientRect().width);
    best=neighborPartition(sizes,max,answers.clientWidth-20);
  }
  nav.replaceChildren();nav.dataset.rows=best.rows.length;
  for(const indices of best.rows){const row=document.createElement('div');row.className='scenic-neighbor-row';row.append(...indices.map(i=>items[i]));nav.append(row);}
  const jobs=[...nav.children].map((row,i)=>motion.matches||immediate?Promise.resolve():owner.animate(row,[{transform:'translateX(110%)',opacity:0},{transform:'translateX(0)',opacity:1}],{duration:SCENIC.feedback.ribbonMs,delay:i*SCENIC.feedback.staggerMs,easing:'cubic-bezier(.16,.8,.2,1)',fill:'backwards'}));
  if(withSlider){
    swipe.hidden=false;resetSwipe();
    if(!motion.matches&&!immediate)jobs.push(owner.animate($('scenic-controls'),[{transform:`translateY(${exitDistance()}px)`},{transform:'translateY(0)'}],{duration:SCENIC.feedback.ribbonMs+Math.max(0,nav.children.length-1)*SCENIC.feedback.staggerMs,easing:'cubic-bezier(.16,.8,.2,1)',fill:'backwards'}));
  }
  await Promise.all(jobs);
}
const exitDistance=()=>app.clientHeight-$('scenic-controls').offsetTop+80;
async function dismissFeedback(owner){
  const nav=$('scenic-neighbors'),controls=$('scenic-controls'),jobs=[];
  if(!motion.matches){
    for(const [i,row] of [...nav.children].reverse().entries())jobs.push(owner.animate(row,[{transform:'translateX(0)',opacity:1},{transform:'translateX(115%)',opacity:0}],{duration:SCENIC.feedback.exitMs,delay:i*SCENIC.feedback.staggerMs,easing:'cubic-bezier(.5,0,.85,.35)',fill:'both'}).then(()=>row.style.visibility='hidden'));
    if(!swipe.hidden)jobs.push(owner.animate(controls,[{transform:'translateY(0)'},{transform:`translateY(${exitDistance()}px)`}],{duration:SCENIC.feedback.exitMs,easing:'cubic-bezier(.5,0,.85,.35)',fill:'both'}).then(()=>swipe.hidden=true));
  }
  await Promise.all(jobs);if(!alive(owner))return;nav.hidden=true;swipe.hidden=true;
}
$('scenic-neighbors').addEventListener('click',event=>{
  const button=event.target.closest('[data-neighbor]');if(!button||!readyForNext||paused||visibilityPaused||hostPaused||!hostedActive)return;
  const active=button.getAttribute('aria-pressed')!=='true';
  button.setAttribute('aria-pressed',String(active));mapInk.setNeighbor(button.dataset.neighbor,active);
});
async function warmFlag(record){
  if(!record)return;
  await Promise.all([prepareFlag(record,flagHost),decodeScenicImage(record.flagSvg)]);
}
function captionFor(record){
 const item=local(record);$('scenic-country-name').textContent=item.country;$('scenic-country-capital').textContent=item.capital;
 $('scenic-map-flag').src=new URL(record.flagSvg,document.baseURI).href;fitCaption(record);
}
async function warmMap(record,{prefetch=false}={}){
 const r=sheet.querySelector('.scenic-europe-map').getBoundingClientRect(),layout=measureScroll(record);
 const height=layout.height-(sheet.clientHeight-r.height);
 const caption=sheet.querySelector('.scenic-map-caption').getBoundingClientRect();
 const stats=await preloadScenicEurope(record,{width:r.width,height,headerTop:caption.bottom-r.top+15,prefetch});
 if(!prefetch){app.dataset.atlasReady=record.id;app.dataset.atlasMemory=JSON.stringify(stats);}
 return stats;
}
async function warmRound(record,{caption=true}={}){await Promise.all([warmFlag(record),prepareNeighborLayout(record)]);if(caption){captionFor(record);placeScroll();}await warmMap(record);}
function prefetchNext(){
 const record=hostedSession?records.get(game.prepareNext()?.countryId):records.get(queue[(step+1)%queue.length]);if(!record)return;app.dataset.nextAssets='loading';
 void Promise.all([warmFlag(record),(async()=>{await prepareNeighborLayout(record);return warmMap(record,{prefetch:true});})()]).then(()=>{app.dataset.nextAssets=record.id},()=>{app.dataset.nextAssets='retry'});
}
function resetSwipe(){continueDrag.reset();}
function clearPresentation(){
  sheet.classList.remove('is-opening','is-open','is-closing');sheet.setAttribute('aria-hidden','true');$('scenic-paper-row').setAttribute('aria-hidden','false');
  $('scenic-neighbors').hidden=true;$('scenic-neighbors').replaceChildren();
  lastMapResult=null;$('scenic-desktop-neighbors').replaceChildren();mapHost.replaceChildren();feedback.textContent='';feedback.classList.remove('is-ended');sheet.dataset.view='near';
  for(const button of sheet.querySelectorAll('[data-map-view]'))button.setAttribute('aria-pressed',String(button.dataset.mapView==='near'));
  swipe.hidden=true;hint.hidden=true;resetSwipe();app.classList.remove('is-pending','is-presenting','is-transitioning');syncAtlasScope();sand.clear();mapInk.clear();placeScroll();
}
async function playQuestion({prepared=false}={}){
  const owner=timeline;readyForNext=false;clearPresentation();setState('loading');
  const record=current();renderButtons(optionsNow(),{disabled:true});
  const material=await preloadPaper();if(!alive(owner))return;
  app.dataset.questionPaper=material.question?'ready':'fallback';sheet.dataset.materialReady=String(!!material.question);
  if(!prepared)await warmRound(record);if(!alive(owner))return;
  await showFlag(record);if(!alive(owner))return;for(const b of answers.children)b.disabled=false;game.setPresentationHold(app.dataset.ready!=='true');setState('playing');updateHud();
  prefetchNext();
}
function renderDesktop(result,record){
  const desktop=$('scenic-desktop-neighbors');desktop.replaceChildren();
  if(result?.found){
    const title=document.createElement('h3');title.textContent=copy().neighbors+': '+local(record).country;desktop.append(title);
    const list=document.createElement('ul');
    for(const id of result.neighbors){const neighbor=records.get(id);if(!neighbor)continue;const item=document.createElement('li'),image=document.createElement('img'),name=document.createElement('span');image.src=new URL(neighbor.flagSvg,document.baseURI).href;image.alt='';image.width=24;image.height=16;name.textContent=local(neighbor).country;item.append(image,name);list.append(item);}
    if(list.children.length)desktop.append(list);else{const note=document.createElement('p');note.textContent=language==='en'?'Island country — no land borders.':'Państwo wyspiarskie — bez sąsiadów lądowych.';desktop.append(note);}
  }
}
async function respond(chosenId){
  if(state!=='playing'||paused||visibilityPaused||hostPaused||!hostedActive)return;
  const owner=timeline,record=current(),correct=chosenId===record.id;
  setState('showing-map');app.classList.add('is-pending');$('scenic-paper-row').setAttribute('aria-hidden','true');
  game.answer(hostedSession?records.get(chosenId).country:chosenId);game.setPresentationHold(true);updateHud();prefetchNext();if(hostedSession)parent.postMessage({type:'mala-nauka:scenic-answer',correct},location.origin);
  for(const button of answers.children){button.disabled=true;button.classList.toggle('correct',button.dataset.id===record.id);button.classList.toggle('wrong',button.dataset.id===chosenId&&!correct);}
  feedback.textContent=correct?copy().correct:copy().answer+local(record).country+'.';
  $('scenic-map-flag').src=new URL(record.flagSvg,document.baseURI).href;
  $('scenic-map-flag').onerror=()=>{$('scenic-map-flag').onerror=null;$('scenic-map-flag').src=new URL(record.flagSvg,document.baseURI).href;};
  $('scenic-country-name').textContent=local(record).country;$('scenic-country-capital').textContent=local(record).capital;
  sheet.dataset.long=String(record.country.length>15);placeScroll();sheet.setAttribute('aria-hidden','false');
  app.classList.add('is-presenting');syncAtlasScope();
  const opening=foldPaper(sheet,{opening:true,timeline:owner,reduced:motion.matches});
  // Cancellation may happen while the independent asset preparation is pending.
  void opening.catch(()=>{});
  const mountPoint=document.createElement('div');mountPoint.style.cssText='position:absolute;inset:0';mapHost.replaceChildren(mountPoint);
  let timer,mapResult;
  try{mapResult=await Promise.race([mountScenicEurope(mountPoint,{record,language}),new Promise(done=>timer=setTimeout(()=>done({found:false}),SCENIC.mapTimeoutMs+2000))]);}
  finally{clearTimeout(timer);}
  if(!alive(owner))return;
  if(!mapResult?.found){
    mapHost.replaceChildren();const note=document.createElement('p');note.className='scenic-map-unavailable';note.textContent=copy().unavailable;mapHost.append(note);
  }
  renderDesktop(mapResult,record);
  // Paper opens while geography decodes. Ink starts only once both are ready.
  await document.fonts.ready;if(!alive(owner))return;fitCaption();
  lastMapResult=mapResult;
  await mapInk.prepare(mapResult,local(record),{isCurrent:()=>alive(owner)});if(!alive(owner))return;
  await opening;await owner.wait(0);if(!alive(owner))return;
  await Promise.all([
    mapInk.reveal({timeline:owner,reduced:motion.matches}),
    (async()=>{if(!motion.matches)await owner.wait(SCENIC.inkDrawMs*2/3);if(alive(owner))await showNeighbors(mapResult,owner,{withSlider:!correct});})()
  ]);if(!alive(owner))return;
  setState(correct?'feedback-correct':'feedback-wrong');readyForNext=true;
  if(correct){
    hint.hidden=false;
    if(!(query.has('qa')&&query.has('freeze'))){await owner.wait(SCENIC.memoryMs);if(alive(owner))await toNext();}
  }
}
async function toNext(){
  if(!readyForNext||paused||visibilityPaused||hostPaused||!hostedActive||!['feedback-correct','feedback-wrong'].includes(state))return;
  const owner=timeline;readyForNext=false;setState('preparing-next');hint.hidden=true;
  const nextStep=(step+1)%queue.length,preparedQuestion=hostedSession?game.prepareNext():null;
  if(hostedSession&&!preparedQuestion){parent.postMessage({type:'mala-nauka:scenic-ended'},location.origin);return;}
  const next=records.get(hostedSession?preparedQuestion.countryId:queue[nextStep]),nextOptions=alignNextOptions(hostedSession?optionRecords(preparedQuestion.options):optionsFor(next));
  await Promise.all([warmRound(next,{caption:false}),dismissFeedback(owner),mapInk.erase({timeline:owner,reduced:motion.matches})]);if(!alive(owner))return;
  setState('transition');feedback.textContent='';
  // The decoded next cloth sits beneath the paper before the folds close.
  captionFor(next);await showFlag(next);if(!alive(owner))return;
  await Promise.all([
    foldPaper(sheet,{opening:false,timeline:owner,reduced:motion.matches}).then(()=>{if(alive(owner))app.classList.add('is-transitioning');}),
    sand.transition({timeline:owner,reduced:motion.matches,seed:seedOf(next.id+':'+(++round)),replace:()=>renderButtons(nextOptions,{disabled:true})})
  ]);
  await owner.wait(0);if(!alive(owner))return;
  game.next();game.options=nextOptions.map(x=>hostedSession?x.country:x.id);game.setPresentationHold(false);step=nextStep;clearPresentation();setState('playing');updateHud();for(const b of answers.children)b.disabled=false;
  // Keep the very same cloth and answer DOM after completion (no second paint).
  prefetchNext();
}
function syncPause(){
  if(paused||visibilityPaused||hostPaused||!hostedActive){game.pause();resetSwipe();}else game.resume();
  timeline.setPaused(paused||visibilityPaused||hostPaused||!hostedActive);app.classList.toggle('is-paused',paused||hostPaused);
  const button=app.querySelector('[data-action="pause"]');button.textContent=paused?'▷':'Ⅱ';button.setAttribute('aria-label',paused?copy().resume:copy().pause);button.setAttribute('aria-pressed',String(paused));
  answers.inert=paused||hostPaused||!hostedActive;swipe.inert=answers.inert;
}
function restart(){
  if(hostedSession){parent.postMessage({type:'mala-nauka:scenic-exit'},location.origin);return;}
  clearTimeout(fixtureTimer);timeline.cancel();timeline=new ScenicTimeline();
  step=0;points=0;seconds=SCENIC.seconds;game=createSession();paused=false;readyForNext=false;syncPause();entry.hold();void enter();
}
answers.addEventListener('click',event=>{const button=event.target.closest('.scenic-answer');if(button&&!button.disabled)caught(respond(button.dataset.id));});
sheet.addEventListener('click',event=>{
  const button=event.target.closest('[data-map-view]');if(!button||!readyForNext||paused||visibilityPaused||hostPaused||!hostedActive||sheet.dataset.view===button.dataset.mapView)return;
  const owner=timeline;sheet.dataset.view=button.dataset.mapView;
  syncAtlasScope();
  for(const item of sheet.querySelectorAll('[data-map-view]'))item.setAttribute('aria-pressed',String(item===button));
  caught(mapInk.setView(button.dataset.mapView,{timeline:owner,reduced:motion.matches}));
});
function localizeChrome(){
 const aside=document.querySelector('.scenic-atlas-desktop');aside.querySelector('p').innerHTML=language==='en'?'<b>Explorer’s atlas</b><br>Choose the globe or magnifier to change the map view.':'<b>Atlas odkrywcy</b><br>Wybierz globus lub lupę, by zmienić zasięg mapy.';aside.querySelectorAll('p')[1].textContent=language==='en'?'The building symbol marks the capital. The highlighted area is the country being explored.':'Symbol budynku pokazuje położenie stolicy. Wyróżniony obszar wskazuje poznawany kraj.';if(lastMapResult)renderDesktop(lastMapResult,current());
 document.documentElement.lang=language;app.dataset.language=language;$('scenic-language').querySelector('b').textContent=language.toUpperCase();$('scenic-language').setAttribute('aria-label',language==='pl'?'Zmień język na angielski':'Switch to Polish');
 syncAtlasScope();
 document.querySelector('.scenic-prompt').textContent=copy().question;document.querySelector('.continue-copy').textContent=copy().next;swipe.setAttribute('aria-label',copy().next);swipe.dataset.completeLabel=copy().complete;hint.textContent=copy().auto;
 app.querySelector('[data-action="restart"]').setAttribute('aria-label',hostedSession?(language==='pl'?'Zakończ rundę':'Leave the round'):copy().restart);
 for(const button of answers.children){const record=local(records.get(button.dataset.id));button.setAttribute('aria-label',record.country);button.dataset.long=String(record.country.length>17);button.querySelector('.scenic-answer-label').innerHTML=letters(record.country);}
 updateHud();
}
$('scenic-language').addEventListener('click',()=>caught((async()=>{
 const owner=timeline,previousState=state;if(!['playing','feedback-correct','feedback-wrong'].includes(state))return;
 $('scenic-language').disabled=true;timeline.setPaused(true);language=language==='pl'?'en':'pl';localizeChrome();parent.postMessage({type:'mala-nauka:scenic-language',language},location.origin);
 try{await prepareNeighborLayout(current());placeScroll();if(lastMapResult?.found&&previousState.startsWith('feedback')){
  const view=sheet.dataset.view,active=[...document.querySelectorAll('#scenic-neighbors button[aria-pressed="true"]')].map(n=>n.dataset.neighbor),record=local(current());
  const result={...lastMapResult,labels:lastMapResult.labels.map(item=>({...item,name:local(records.get(item.id)).country})),capital:{...lastMapResult.capital,name:record.capital}};
  $('scenic-country-name').textContent=record.country;$('scenic-country-capital').textContent=record.capital;fitCaption();
  await mapInk.prepare(result,record,{isCurrent:()=>alive(owner)});if(!alive(owner))return;
  await mapInk.reveal({timeline:owner,reduced:true});if(view==='europe')await mapInk.setView(view,{timeline:owner,reduced:true});
  await showNeighbors(result,owner,{immediate:true});for(const id of active){mapInk.setNeighbor(id,true);document.querySelector(`[data-neighbor="${id}"]`)?.setAttribute('aria-pressed','true');}
  feedback.textContent=previousState==='feedback-correct'?copy().correct:copy().answer+record.country+'.';
 }}finally{if(alive(owner)){timeline.setPaused(paused||visibilityPaused||hostPaused||!hostedActive);$('scenic-language').disabled=false;}}
})()));
app.querySelector('[data-action="restart"]').addEventListener('click',restart);
app.querySelector('[data-action="pause"]').addEventListener('click',()=>{if(state==='ended')return;paused=!paused;syncPause();});
const ticker=setInterval(()=>{
  if(state!=='playing'||paused||visibilityPaused||hostPaused||!hostedActive)return;game.tick();const previous=seconds;seconds=Math.ceil(game.remaining/1000);if(seconds!==previous)updateHud();
  if(!seconds){setState('ended');for(const b of answers.children)b.disabled=true;feedback.textContent=language==='pl'?'Dobra robota! Zdobywasz '+points+' pkt.':'Well done! You earn '+points+' points.';feedback.classList.add('is-ended');if(hostedSession)parent.postMessage({type:'mala-nauka:scenic-ended'},location.origin);}
},100);
window.addEventListener('message',event=>{if(!hostedSession||event.origin!==location.origin||event.source!==parent)return;if(event.data?.type==='mala-nauka:scenic-activate'){hostedActive=true;syncPause();game.setPresentationHold(false)}if(event.data?.type==='mala-nauka:scenic-pause'){hostPaused=event.data.paused===true;syncPause()}});
document.addEventListener('visibilitychange',()=>{visibilityPaused=document.hidden;syncPause();});
// Test-only capture bridge: freeze Canvas without changing the photographed UI.
if(query.has('qa'))window.addEventListener('scenic-qa-pause',event=>timeline.setPaused(event.detail===true||paused||visibilityPaused));
const observer=new ResizeObserver(()=>{placeScroll();fitCaption();});observer.observe($('scenic-stage'));
window.addEventListener('pagehide',()=>{timeline.cancel();clearInterval(ticker);clearTimeout(fixtureTimer);observer.disconnect();continueDrag.destroy();sand.clear();mapInk.clear();});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
motion.addEventListener('change',()=>{if(state==='transition'||state==='showing-map')restart();});
async function enter(){try{
  const owner=timeline;localizeChrome();await Promise.all([prepareScenicScene(),preloadPaper()]);if(!alive(owner))return;await playQuestion();
  if(!alive(owner))return;await entry.reveal();game.setPresentationHold(false);
  const fixture=query.get('state');if(['correct','wrong'].includes(fixture))fixtureTimer=setTimeout(()=>caught(respond(fixture==='correct'?current().id:optionsFor(current()).find(x=>x.id!==current().id).id)),100);
}catch(error){console.error('[scenic entry]',error);entry.fail(()=>void enter());}}
void enter();
