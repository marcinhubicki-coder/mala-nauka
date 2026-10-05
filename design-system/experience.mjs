import {designReady,applyDesign} from '../shared/design-runtime.mjs';
import {previewAssets} from '../shared/asset-loader.mjs';
import {applyDiscoveryEvent,fixtureEvents,replayDiscovery,discoverySummary,dayKey} from '../shared/discovery-model.mjs';
import {validateSnapshot,fingerprint} from './project-model.mjs';
import {decodeShare,encodeShare,validateEnvelope} from './project-share.mjs';
import {renderExperience} from './experience-renderer.mjs';
import {animateScreen} from '../shared/screen-motion.mjs';
import {html} from './preview-model.mjs';
const app=document.getElementById('app'),embedded=new URLSearchParams(location.search).has('embed');
let snapshot,state,screenId,releaseId='live',sourceFingerprint='',comments=[],counter=0,editing=false,selected='',stateOverride='initial',animation;
let trialEvents=[],availableWords=[],simulationAt='2026-10-05T15:00:00Z';
const emit=data=>{if(parent!==window)parent.postMessage({channel:'mala-nauka-project',...data},location.origin);};
const status=text=>document.getElementById('experience-events').textContent=text;
function draw(){
  if(!snapshot)return;renderExperience(app,snapshot,screenId,state,{editing,selected,stateOverride,select:id=>emit({type:'selected',id}),action:perform});
  const summary=discoverySummary(state,snapshot.rules);status(state.lastEvents.map(e=>e.text).join(' ')||`Pamięć: ${summary.balance} · jeszcze ${summary.remaining} odpowiedzi · umiem: ${summary.mastered}`);
  emit({type:'state',screenId,summary,points:state.points,events:state.lastEvents,trialEvents,overflow:app.scrollWidth>app.clientWidth+1});
}
function setScreen(id){if(!snapshot.screens.some(s=>s.id===id)){status('Brak ekranu docelowego.');return;}screenId=id;draw();animation?.cancel();animation=animateScreen(app,snapshot.design.motion||{});}
function answer(correct=true){
  const source=fixtureEvents('long',43,availableWords),seen=state.seen[dayKey(simulationAt)]||[],row=source.find(r=>!seen.includes(r.word.normalize('NFC').toLocaleLowerCase('pl')));counter++;
  if(!row)throw Error('Wszystkie słowa próbki były już dziś użyte. Zmień dane lub rozpocznij nową próbę.');
  const event={...row,id:'interactive-'+Date.now()+'-'+counter,type:'answer',at:simulationAt,sessionId:'interactive',correct};const next=applyDiscoveryEvent(state,event,snapshot.rules);trialEvents.push(event);return next;
}
function perform(action){
  try{
    if(action.kind==='navigate'){setScreen(action.target);return;}
    if(action.kind==='answer'||action.kind==='wrong')state=answer(action.kind==='answer');
    if(action.kind==='skin'){const event={id:'skin-'+Date.now()+'-'+(++counter),type:'skin',skin:action.value};state=applyDiscoveryEvent(state,event,snapshot.rules);trialEvents.push(event);}
    if(action.kind==='reveal'){const tile=action.value!==''&&action.value!==undefined?Number(action.value):Array.from({length:snapshot.rules.mapTiles},(_,i)=>i).find(i=>!state.revealed.includes(i));if(tile===undefined){status('Cała mapa jest już odkryta.');return;}const event={id:'reveal-'+Date.now()+'-'+(++counter),type:'reveal',tile};state=applyDiscoveryEvent(state,event,snapshot.rules);trialEvents.push(event);}
    draw();emit({type:'action',kind:action.kind,screenId,summary:discoverySummary(state,snapshot.rules)});
    if(state.lastEvents.some(e=>e.kind==='memory')&&snapshot.screens.some(s=>s.id==='memory-reward'))setScreen('memory-reward');
  }catch(e){status(e.message);emit({type:'notice',message:e.message});}
}
function load(value,events,screen,options={}){
  validateSnapshot(value);snapshot=structuredClone(value);applyDesign(snapshot.design);previewAssets(options.previewURLs||{});
  trialEvents=structuredClone(events||fixtureEvents('six'));availableWords=options.words||[];simulationAt=trialEvents.filter(e=>e.type==='answer').at(-1)?.at||'2026-10-05T15:00:00Z';state=replayDiscovery(trialEvents,snapshot.rules);screenId=screen||snapshot.entry;editing=options.editing||false;selected=options.selected||'';stateOverride=options.stateOverride||'initial';counter=0;draw();
}
function renderComments(){document.getElementById('experience-comments').innerHTML=comments.map(c=>`<p><strong>${html(snapshot.screens.find(s=>s.id===c.screen)?.name||'Ekran')}</strong><br>${html(c.text)}</p>`).join('');try{localStorage.setItem('mn-review-'+releaseId+'-'+sourceFingerprint,JSON.stringify(comments));}catch{}}
document.getElementById('experience-answer').onclick=()=>perform({kind:'answer'});
document.getElementById('experience-wrong').onclick=()=>perform({kind:'wrong'});
document.getElementById('experience-reset').onclick=()=>load(snapshot,fixtureEvents(document.getElementById('experience-fixture').value),snapshot.entry);
document.getElementById('experience-fixture').onchange=()=>load(snapshot,fixtureEvents(document.getElementById('experience-fixture').value),snapshot.entry);
document.getElementById('experience-add-comment').onclick=()=>{const input=document.getElementById('experience-comment'),text=input.value.trim();if(!text||text.length>1200||comments.length>=60){document.getElementById('experience-feedback-status').textContent='Napisz uwagę do 1200 znaków. Wersja mieści do 60 uwag.';return;}comments.push({text,screen:screenId,status:'open'});input.value='';renderComments();document.getElementById('experience-feedback-status').textContent='Uwaga zapisana. Skopiuj pakiet dla autora.';};
document.getElementById('experience-copy-feedback').onclick=async()=>{
  try{const value=await encodeShare({kind:'mala-nauka-feedback',releaseId,fingerprint:sourceFingerprint,comments});const output=new URL('./index.html',location.href);output.hash='feedback='+value;const field=document.getElementById('experience-feedback-output');field.hidden=false;field.value=output.href;try{await navigator.clipboard.writeText(output.href);document.getElementById('experience-feedback-status').textContent='Pakiet skopiowany. Autor wkleja go w Studio → Wersje i wydanie → Importuj uwagi.';}catch{field.select();document.getElementById('experience-feedback-status').textContent='Skopiuj zaznaczony pakiet i przekaż go autorowi.';}}catch(e){document.getElementById('experience-feedback-status').textContent=e.message;}
};
if(embedded){document.getElementById('experience-toolbar').hidden=true;document.getElementById('experience-review').hidden=true;document.querySelector('.experience-wrapper').style.cssText='display:block;padding:0';document.querySelector('.experience-phone').style.cssText='border-radius:0;box-shadow:none;max-width:none';}
window.addEventListener('message',event=>{
  if(!embedded||event.origin!==location.origin||event.source!==parent||event.data?.channel!=='mala-nauka-project')return;
  try{const m=event.data;if(m.type==='load')load(m.snapshot,m.events,m.screen,m);if(m.type==='action')perform(m.action);if(m.type==='screen')setScreen(m.screen);}catch(e){emit({type:'notice',message:e.message});}
});
try{
  const design=await designReady;
  if(embedded)emit({type:'ready'});
  else if(new URLSearchParams(location.hash.slice(1)).has('preview')){
    const value=validateEnvelope(await decodeShare(new URLSearchParams(location.hash.slice(1)).get('preview')));releaseId=value.releaseId;sourceFingerprint=value.fingerprint;
    document.getElementById('experience-version').textContent=value.name+' · wersja testowa';
    try{comments=JSON.parse(localStorage.getItem('mn-review-'+releaseId+'-'+sourceFingerprint)||'[]');}catch{}
    load(value.snapshot,fixtureEvents('six'),value.snapshot.entry);renderComments();
  }else{
    const r=design.project?.releases.find(r=>r.id===(new URLSearchParams(location.search).get('release')||design.project.activeRelease)&&r.status==='published');
    if(!r)throw Error('Nie ma jeszcze wydanego pilota. Otwórz Studio → Projekt i wydanie, aby przygotować wersję testową.');
    releaseId=r.id;sourceFingerprint=fingerprint(r.snapshot);document.getElementById('experience-version').textContent=r.name+' · wydany pilot';load(r.snapshot,fixtureEvents('empty'),r.snapshot.entry);
  }
}catch(e){app.innerHTML='<h1>Podgląd jest niedostępny</h1><p>'+html(e.message)+'</p><a href="./">Otwórz Studio</a>';emit({type:'notice',message:e.message});}
