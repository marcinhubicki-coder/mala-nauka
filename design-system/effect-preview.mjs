import {designReady,applyDesign} from '../shared/design-runtime.mjs';
import {configureAssets,wordAsset,previewAssets} from '../shared/asset-loader.mjs';
import {createBubble} from '../spelling/bubble.mjs';
import {DEFAULT_EFFECTS,createEffectPicker} from '../spelling/effect-model.mjs';
import {applyBubbleSettings,playResponseEffect,createScreenAtmosphere} from '../spelling/response-effects.mjs';
await designReady;
const host=document.getElementById('effect-bubble'),scene=document.getElementById('effect-scene'),bubble=createBubble(host),pick=createEffectPicker();
let config=window.__MALA_NAUKA_DESIGN__,stop=()=>{},streak=0,selected='spark',currentEvent='correct',run=0,currentWord='brzuch',lastUrl='';
const atmosphere=createScreenAtmosphere(scene,config.effects||DEFAULT_EFFECTS);
const send=(type,payload={})=>parent.postMessage({channel:'mala-nauka-effects',type,...payload},location.origin);
function setWord(word){currentWord=word;document.getElementById('word-before').textContent=word==='brzuch'?'b':'p';document.getElementById('word-after').textContent=word==='brzuch'?'uch':'ód';document.getElementById('answer-slot').textContent='?';document.getElementById('effect-word').setAttribute('aria-label','Uzupełnij słowo '+word);}
function update(){const effects=config.effects||DEFAULT_EFFECTS;applyBubbleSettings(bubble,effects);atmosphere.update(effects);}
async function reset(){stop();bubble.clearReactions();streak=0;document.querySelectorAll('.effect-answers button').forEach(b=>b.className='');document.getElementById('answer-slot').textContent='?';document.getElementById('effect-copy').textContent='Wybierz właściwy zapis';setWord(currentWord);const url=wordAsset(currentWord);if(url){lastUrl=url;await bubble.transitionToScene(url,{key:currentWord},true);}}
function play(event='correct',id=selected,comboCount=1,runId=0){
 stop();run=runId;currentEvent=event;selected=id;
 const effects=config.effects||DEFAULT_EFFECTS;
 if(event==='idle'){bubble.clearReactions();bubble.setPaused(false);const intervals=[];let previous=0,raf;let begin;const sample=now=>{begin??=now;if(previous)intervals.push(now-previous);previous=now;if(now-begin<1800)raf=requestAnimationFrame(sample);else send('metrics',{run:runId,metrics:{disabled:false,presetName:'Bańka · spoczynek',particles:0,requested:0,intervals,duration:1800,memory:performance.memory?{heapMB:Math.round(performance.memory.usedJSHeapSize/1048576),heapLimitMB:Math.round(performance.memory.jsHeapSizeLimit/1048576)}:null}});};raf=requestAnimationFrame(sample);stop=()=>cancelAnimationFrame(raf);return;}
 const combo=event==='combo';streak=event==='wrong'?0:comboCount;
 bubble.react(combo?'combo':event);
 const preset=effects.presets[id]||pick(effects).preset;
 document.getElementById('answer-slot').textContent='rz';
 document.getElementById('correct-answer').className='is-correct';document.getElementById('wrong-answer').className=event==='wrong'?'is-wrong':'';
 document.getElementById('combo-label').textContent=combo?`Seria ×${streak}`:'Próba efektu';
 document.getElementById('effect-copy').textContent=event==='wrong'?'Przyjrzyj się poprawnej odpowiedzi':combo?'Świetna seria!':'Pięknie!';
 stop=playResponseEffect(host,{config:effects,preset,event,combo,target:host.querySelector('.soap-svg'),onMetrics:metrics=>send('metrics',{metrics,run:runId})});
 send('played',{id,event,streak,run:runId});
}
window.addEventListener('message',async event=>{
 if(event.origin!==location.origin||event.source!==parent||event.data?.channel!=='mala-nauka-effects')return;
 const data=event.data;
 if(data.type==='design'){config=data.config;applyDesign(config);if(data.assets)configureAssets(data.assets,new URL('../',import.meta.url).href);previewAssets(data.previewURLs||{});update();const url=wordAsset(currentWord);if(url&&url!==lastUrl){lastUrl=url;await bubble.transitionToScene(url,{key:currentWord},false);}}
 if(data.type==='play')play(data.event,data.id,data.streak,data.run);
 if(data.type==='react'){bubble.setPaused(false);bubble.react(data.event);}
 if(data.type==='stop'){stop();bubble.setPaused(true);}
 if(data.type==='resume'){bubble.setPaused(false);}
 if(data.type==='picture'){stop();bubble.setPaused(false);const word=currentWord==='przód'?'brzuch':'przód';setWord(word);document.querySelectorAll('.effect-answers button').forEach(b=>b.className='');lastUrl=wordAsset(word);await bubble.transitionToScene(lastUrl,{key:word},false);document.getElementById('effect-copy').textContent='Wybierz właściwy zapis';}
 if(data.type==='reset'){bubble.setPaused(false);await reset();}
});
document.getElementById('correct-answer').onclick=()=>{const effects=config.effects||DEFAULT_EFFECTS;streak++;const combo=streak%effects.comboEvery===0;play(combo?'combo':'correct',pick(effects).id,streak);};
document.getElementById('wrong-answer').onclick=()=>play('wrong');
update();await reset();send('ready');
