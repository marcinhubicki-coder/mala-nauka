import {
  createBubble,
  BUBBLE_TUNING_DEFAULTS,
  BUBBLE_EFFECT_DEFAULTS,
  BUBBLE_CHAOS_DEFAULTS,
  BUBBLE_HEAVY_DEFAULTS
} from '../spelling/bubble.mjs?v=master-1';
import { sceneFor, sceneUrl } from '../spelling/scenes.mjs?v=26-generated-scenes';
import { createWord } from '../spelling/word-reveal.mjs?v=9-simple-text';

document.documentElement.classList.add('spelling-playing');

const x2=v=>Number(v).toFixed(2)+'×';
const x1=v=>Number(v).toFixed(1);
const signed=v=>`${Number(v)>=0?'+':''}${Number(v).toFixed(2)}`;

const CATEGORIES={
  motion:{
    title:'Ruch',setter:'setTuning',defaults:BUBBLE_TUNING_DEFAULTS,
    params:[
      {key:'speed',short:'S',label:'Szybkość',min:2.2,max:6.6,step:.1,base:4.4,format:x1},
      {key:'points',short:'P',label:'Punkty',min:24,max:72,step:4,base:48,format:v=>String(Math.round(v))},
      {key:'random',short:'R',label:'Random',min:0,max:5.7,step:.05,base:2.85,format:x2},
      {key:'smoothing',short:'W',label:'Wygładzanie',min:.35,max:2.35,step:.05,base:1.35,format:x2},
      {key:'bounce',short:'B',label:'Bounce',min:.2,max:1.3,step:.05,base:.75,format:x2},
      {key:'corners',short:'N',label:'Narożniki',min:0,max:4,step:.05,base:2,format:x2},
    ]
  },
  look:{
    title:'Wygląd',setter:'setEffects',defaults:BUBBLE_EFFECT_DEFAULTS,
    params:[
      {key:'shadow',short:'C',label:'Cień',min:0,max:2.5,step:.05,base:1.25,format:x2},
      {key:'depth',short:'D',label:'Głębia cienia',min:.3,max:2,step:.05,base:1.15,format:x2},
      {key:'glow',short:'P',label:'Poświata',min:0,max:4,step:.05,base:2,format:x2},
      {key:'sheen',short:'B',label:'Blask',min:0,max:3.1,step:.05,base:1.55,format:x2},
      {key:'rainbow',short:'T',label:'Tęcza',min:0,max:2.5,step:.05,base:1.25,format:x2},
      {key:'rim',short:'K',label:'Krawędź',min:0,max:2.1,step:.05,base:1.05,format:x2},
    ]
  },
  chaos:{
    title:'Chaos',setter:'setChaos',defaults:BUBBLE_CHAOS_DEFAULTS,
    params:[
      {key:'amplitude',short:'A',label:'Amplituda',min:-2,max:4,step:.05,base:1,format:x2},
      {key:'frequency',short:'F',label:'Fale',min:-2,max:4,step:.05,base:1,format:x2},
      {key:'orbit',short:'O',label:'Orbita',min:-2,max:4,step:.05,base:1,format:x2},
      {key:'magnet',short:'M',label:'Magnes',min:-3,max:3,step:.05,base:0,format:signed},
      {key:'jelly',short:'G',label:'Galareta',min:0,max:2,step:.05,base:1,format:x2},
      {key:'squash',short:'Z',label:'Zgniatanie',min:-1,max:1,step:.025,base:0,format:v=>`${Math.round(Number(v)*100)}%`},
    ]
  },
  fx:{
    title:'FX',setter:'setHeavy',defaults:BUBBLE_HEAVY_DEFAULTS,
    params:[
      {key:'blur',short:'B',label:'Blur obrazu',min:0,max:10,step:.25,base:0,format:v=>Number(v).toFixed(2)+'px'},
      {key:'shadowBlur',short:'C',label:'Blur cienia',min:0,max:18,step:.5,base:0,format:v=>Number(v).toFixed(1)+'px'},
      {key:'particles',short:'P',label:'Particles',min:0,max:48,step:1,base:0,format:v=>String(Math.round(v))},
      {key:'energy',short:'E',label:'Energia',min:0,max:4,step:.05,base:1,format:x2},
      {key:'refraction',short:'R',label:'Refrakcja',min:0,max:36,step:1,base:0,format:v=>String(Math.round(v))},
      {key:'bloom',short:'L',label:'Bloom',min:0,max:3,step:.05,base:0,format:x2},
    ]
  }
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
const tabsHost=app.querySelector('.tuner-tabs');
const valuesHost=app.querySelector('.tuner-values');
const slider=app.querySelector('#tuner-range');
const label=app.querySelector('.tuner-slider-label');
const current=app.querySelector('.tuner-current');
const resetButton=app.querySelector('.master-reset');
const categoryButton=app.querySelector('.master-categories');
const dialog=document.querySelector('.master-category-dialog');
const dialogClose=dialog.querySelector('.master-dialog-close');
const categoryCards=[...dialog.querySelectorAll('.master-category-card')];

const state={
  motion:{...BUBBLE_TUNING_DEFAULTS},
  look:{...BUBBLE_EFFECT_DEFAULTS},
  chaos:{...BUBBLE_CHAOS_DEFAULTS},
  fx:{...BUBBLE_HEAVY_DEFAULTS},
};

let activeCategory='motion';
let activeParam=CATEGORIES.motion.params[0].key;
let sceneIndex=0;
let bubble=null;
let resetSerial=0;

function category(){return CATEGORIES[activeCategory];}
function param(){
  return category().params.find(item=>item.key===activeParam)||category().params[0];
}
function setWord(item){
  wordHost.replaceChildren(createWord(item.masked));
  wordHost.setAttribute('aria-label','Podgląd: '+item.word);
}
async function showScene(index,first=false,targetBubble=bubble){
  if(!samples.length||!targetBubble)return;
  sceneIndex=(index+samples.length)%samples.length;
  const item=samples[sceneIndex];
  setWord(item);
  app.dataset.artScene=item.scene.key||'master';
  await targetBubble.transitionToScene(sceneUrl(item.scene),item.scene,first);
}
function nextScene(){showScene(sceneIndex+1,false,bubble);}

function resetBubble(){
  const serial=++resetSerial;
  const old=bubble;
  bubble=null;
  old?.destroy();
  visual.replaceChildren();
  const fresh=createBubble(visual,{
    tuning:state.motion,
    effects:state.look,
    chaos:state.chaos,
    heavy:state.fx,
    startAtZero:true
  });
  bubble=fresh;
  resetButton.classList.remove('is-resetting');
  void resetButton.offsetWidth;
  resetButton.classList.add('is-resetting');
  showScene(sceneIndex,true,fresh).finally(()=>{
    if(serial===resetSerial)resetButton.classList.remove('is-resetting');
  });
}

function formatSummary(categoryKey){
  const config=CATEGORIES[categoryKey],values=state[categoryKey];
  return config.params.map(item=>`${item.short} ${item.format(values[item.key])}`).join(' · ');
}
function updateDialog(){
  categoryCards.forEach(card=>{
    const key=card.dataset.category;
    card.classList.toggle('is-active',key===activeCategory);
    card.querySelector('[data-summary="'+key+'"]').textContent=formatSummary(key);
  });
}
function renderControls(){
  const config=category();
  if(!config.params.some(item=>item.key===activeParam))activeParam=config.params[0].key;

  tabsHost.innerHTML=config.params.map(item=>`
    <button type="button" class="tuner-tab ${item.key===activeParam?'is-active':''}" data-param="${item.key}" aria-selected="${item.key===activeParam}">${item.short}</button>
  `).join('');
  valuesHost.innerHTML=config.params.map(item=>`
    <span data-readout="${item.key}"><b>${item.short}</b><em></em></span>
  `).join('');

  tabsHost.querySelectorAll('.tuner-tab').forEach(tab=>tab.addEventListener('click',()=>{
    activeParam=tab.dataset.param;
    renderControls();
  }));

  configureSlider();
  updateReadouts();
  updateDialog();
}
function configureSlider(){
  const item=param(),value=state[activeCategory][item.key];
  label.textContent=item.label;
  slider.min=String(item.min);slider.max=String(item.max);slider.step=String(item.step);slider.value=String(value);
  current.textContent=item.format(value);
}
function updateReadouts(){
  const config=category(),values=state[activeCategory];
  config.params.forEach(item=>{
    const box=valuesHost.querySelector('[data-readout="'+item.key+'"]');
    if(!box)return;
    const value=values[item.key];
    box.querySelector('em').textContent=item.format(value);
    box.classList.toggle('is-less',value<item.base-1e-6);
    box.classList.toggle('is-more',value>item.base+1e-6);
  });
}
function applyValue(raw){
  const config=category(),item=param();
  let value=Number(raw);
  if(item.key==='points'||item.key==='particles')value=Math.round(value/item.step)*item.step;
  state[activeCategory]={...state[activeCategory],[item.key]:value};
  if(bubble)state[activeCategory]=bubble[config.setter](state[activeCategory]);
  slider.value=String(state[activeCategory][item.key]);
  current.textContent=item.format(state[activeCategory][item.key]);
  updateReadouts();
  updateDialog();
}
function setCategory(key){
  if(!CATEGORIES[key])return;
  activeCategory=key;
  activeParam=CATEGORIES[key].params[0].key;
  renderControls();
  dialog.close();
}

slider.addEventListener('input',()=>applyValue(slider.value));
visual.addEventListener('click',nextScene);
visual.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' '){event.preventDefault();nextScene();}
});
resetButton.addEventListener('click',resetBubble);
categoryButton.addEventListener('click',()=>{updateDialog();dialog.showModal();});
dialogClose.addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
categoryCards.forEach(card=>card.addEventListener('click',()=>setCategory(card.dataset.category)));

renderControls();
resetBubble();
