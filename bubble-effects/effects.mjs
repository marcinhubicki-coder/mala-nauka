import { createBubble, BUBBLE_TUNING_DEFAULTS, BUBBLE_EFFECT_DEFAULTS } from '../spelling/bubble.mjs?v=effects-1';
import { sceneFor, sceneUrl } from '../spelling/scenes.mjs?v=26-generated-scenes';
import { createWord } from '../spelling/word-reveal.mjs?v=9-simple-text';

document.documentElement.classList.add('spelling-playing');

const PARAMS={
  shadow:{short:'C',label:'Cień',min:0,max:2,step:.05,base:1,format:v=>Number(v).toFixed(2)+'×'},
  depth:{short:'D',label:'Głębia cienia',min:.4,max:1.6,step:.05,base:1,format:v=>Number(v).toFixed(2)+'×'},
  glow:{short:'P',label:'Poświata',min:0,max:2,step:.05,base:1,format:v=>Number(v).toFixed(2)+'×'},
  sheen:{short:'B',label:'Blask',min:0,max:2,step:.05,base:1,format:v=>Number(v).toFixed(2)+'×'},
  rainbow:{short:'T',label:'Tęcza',min:0,max:2,step:.05,base:1,format:v=>Number(v).toFixed(2)+'×'},
  rim:{short:'K',label:'Krawędź',min:0,max:2,step:.05,base:1,format:v=>Number(v).toFixed(2)+'×'},
};

const samples=[
  ['upominek','_pominek'],['drzewo','d_ewo'],['krzesło','k_esło'],['wrzesień','w_esień'],
  ['żuk','_uk'],['żubr','_ubr'],['żyrafa','_yrafa'],['żagiel','_agiel'],['żmija','_mija'],
  ['żuraw','_uraw'],['nożyczki','no_yczki'],['łyżwy','ły_wy'],['huśtawka','_uśtawka'],
  ['helikopter','_elikopter'],['miód','mi_d'],['sól','s_l'],['ogórek','og_rek'],
  ['wiewiórka','wiewi_rka'],['zima','_ma']
].map(([word,masked])=>({word,masked,scene:sceneFor(masked,word)})).filter(item=>item.scene?.asset);

const app=document.querySelector('#app');
const visual=app.querySelector('.tuner-visual');
const wordHost=app.querySelector('.question-content');
const slider=app.querySelector('#effects-range');
const label=app.querySelector('.tuner-slider-label');
const current=app.querySelector('.tuner-current');
const tabs=[...app.querySelectorAll('.tuner-tab')];
const pause=app.querySelector('.tuner-pause');
const bubble=createBubble(visual,{tuning:BUBBLE_TUNING_DEFAULTS,effects:BUBBLE_EFFECT_DEFAULTS});

let active='shadow',sceneIndex=0,paused=false;
let values={...BUBBLE_EFFECT_DEFAULTS};

function setWord(item){
  wordHost.replaceChildren(createWord(item.masked));
  wordHost.setAttribute('aria-label','Podgląd: '+item.word);
}
async function showScene(index,first=false){
  if(!samples.length)return;
  sceneIndex=(index+samples.length)%samples.length;
  const item=samples[sceneIndex];
  setWord(item);
  app.dataset.artScene=item.scene.key||'effects';
  await bubble.transitionToScene(sceneUrl(item.scene),item.scene,first);
}
function nextScene(){showScene(sceneIndex+1,false);}
function configureSlider(){
  const meta=PARAMS[active],value=values[active];
  label.textContent=meta.label;
  slider.min=String(meta.min);slider.max=String(meta.max);slider.step=String(meta.step);slider.value=String(value);
  current.textContent=meta.format(value);
  tabs.forEach(tab=>{
    const selected=tab.dataset.param===active;
    tab.classList.toggle('is-active',selected);
    tab.setAttribute('aria-selected',String(selected));
  });
}
function updateReadouts(){
  for(const [key,meta] of Object.entries(PARAMS)){
    const box=app.querySelector('[data-readout="'+key+'"]');
    const value=values[key];
    box.querySelector('em').textContent=meta.format(value);
    box.classList.toggle('is-less',value<meta.base-1e-6);
    box.classList.toggle('is-more',value>meta.base+1e-6);
  }
}
function applyValue(raw){
  values={...values,[active]:Number(raw)};
  values=bubble.setEffects(values);
  slider.value=String(values[active]);
  current.textContent=PARAMS[active].format(values[active]);
  updateReadouts();
}

tabs.forEach(tab=>tab.addEventListener('click',()=>{active=tab.dataset.param;configureSlider();}));
slider.addEventListener('input',()=>applyValue(slider.value));
visual.addEventListener('click',nextScene);
visual.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();nextScene();}});
pause.addEventListener('click',()=>{
  paused=!paused;bubble.setPaused(paused);pause.classList.toggle('is-paused',paused);
  pause.setAttribute('aria-label',paused?'Wznów animację':'Pauza animacji');
});
app.querySelector('.tuner-close').addEventListener('click',()=>{location.href='../';});

configureSlider();updateReadouts();showScene(0,true);
