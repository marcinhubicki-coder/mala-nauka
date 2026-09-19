import { CATEGORIES, DURATIONS, shuffle } from './game.mjs';
import { ENGLISH } from './data/english.mjs';
import { READING } from './data/reading.mjs';
import { FLAGS, FLAG_CATEGORIES } from './data/flags.mjs';
import { filterSpellingPreview } from './spelling/preview.mjs';

export const MODES = {
 spelling: {name:'Ortografia',icon:'abc',hint:'Złap właściwą literę',color:'pink',categories:[['all','Wszystkie słowa'],...CATEGORIES.map(c=>[c,c.replace('/', ' / ')])],levels:['Wszystkie','Łatwe','Średnie','Trudne']},
 math: {name:'Matematyka',icon:'1+2',hint:'Małe działania, wielkie odkrycia',color:'blue',categories:[['all','Mieszane'],['add','Dodawanie'],['subtract','Odejmowanie'],['multiply','Mnożenie'],['divide','Dzielenie']],levels:['Łatwe','Średnie','Trudne']},
 english: {name:'Angielski',icon:'🇬🇧',hint:'Słówka i ich pisownia',color:'yellow',categories:[['all','Wszystkie słówka'],['numbers','Liczby'],['objects','Przedmioty'],['verbs','Czasowniki'],['jobs','Zawody'],['home','Dom'],['nature','Natura'],['animals','Zwierzęta']],levels:['Znaczenie','Pisownia','Trudniejsza pisownia']},
 flags: {name:'Flagi',icon:'🌍',hint:'Mała podróż dookoła świata',color:'green',categories:FLAG_CATEGORIES,levels:['Łatwe','Średnie','Trudne']},
 reading: {name:'Czytanie',icon:'book',hint:'Czytaj, zapamiętuj, rozumiej',color:'purple',categories:[['all','Trening czytania']],levels:['Słowa','Frazy','Zdania']}
};
export const modeIds = Object.keys(MODES);

const FLAG_GAME_TYPES=['flags','countries','capitals'];
const FLAG_CONTINENTS=FLAG_CATEGORIES.filter(([id])=>id!=='all').map(([id])=>id);
const FLAG_TYPE_LABELS={flags:'Flagi',countries:'Państwa',capitals:'Stolice'};
const FLAG_CONTINENT_LABELS=Object.fromEntries(FLAG_CATEGORIES);

function parseFlagCategory(raw=''){
 const value=String(raw||'');
 if(value.startsWith('flagcfg:')){
  const [,gameTypeRaw,scopeRaw,continentsRaw='']=value.split(':');
  const gameType=FLAG_GAME_TYPES.includes(gameTypeRaw)?gameTypeRaw:'flags';
  const scope=scopeRaw==='continents'?'continents':'world';
  const continents=continentsRaw.split(',').filter(id=>FLAG_CONTINENTS.includes(id));
  return {gameType,scope:scope==='continents'&&continents.length?'continents':'world',continents:continents.length?continents:['europe']};
 }
 if(value==='all')return {gameType:'flags',scope:'world',continents:['europe']};
 if(FLAG_CONTINENTS.includes(value))return {gameType:'flags',scope:'continents',continents:[value]};
 return {gameType:'flags',scope:'world',continents:['europe']};
}

function encodeFlagCategory({gameType='flags',scope='world',continents=['europe']}={}){
 const safeType=FLAG_GAME_TYPES.includes(gameType)?gameType:'flags';
 const selected=[...new Set(continents)].filter(id=>FLAG_CONTINENTS.includes(id));
 if(scope!=='continents'||!selected.length||selected.length===FLAG_CONTINENTS.length)return `flagcfg:${safeType}:world:`;
 return `flagcfg:${safeType}:continents:${selected.join(',')}`;
}

export function cleanConfig(mode, value) {
 if(mode==='flags'){
  const parsed=parseFlagCategory(value?.category);
  return {
   category:encodeFlagCategory(parsed),
   difficulty:1,
   duration:DURATIONS.includes(value?.duration)?value.duration:180,
   flagGameType:parsed.gameType,
   flagScope:parsed.scope,
   flagContinents:parsed.continents
  };
 }
 const categories = MODES[mode].categories.map(([id])=>id);
 return { category:categories.includes(value?.category)?value.category:'all',
  difficulty:[1,2,3,...(mode==='spelling'?[0]:[])].includes(value?.difficulty)?value.difficulty:(mode==='spelling'?0:1),
  duration:DURATIONS.includes(value?.duration)?value.duration:180 };
}

export function levelLabel(mode, level) { return MODES[mode].levels[mode==='spelling'?level:level-1]; }

export function categoryLabel(mode, category) {
 if(mode==='flags'){
  const parsed=parseFlagCategory(category);
  const scope=parsed.scope==='world'
   ? 'Cały świat'
   : parsed.continents.map(id=>FLAG_CONTINENT_LABELS[id]).join(', ');
  return `${FLAG_TYPE_LABELS[parsed.gameType]} · ${scope}`;
 }
 return MODES[mode].categories.find(([id])=>id===category)?.[1] || '';
}

const integer = (min,max,random) => min+Math.floor(random()*(max-min+1));
export function mathQuestion(config, random = Math.random) {
 const level=config.difficulty, limit=[0,10,50,100][level];
 const operation=config.category==='all'?shuffle(['add','subtract','multiply','divide'],random)[0]:config.category;
 let a,b,result,symbol;
 if(operation==='add') { a=integer(0,limit-1,random); b=integer(1,limit-a,random); result=a+b;symbol='+'; }
 if(operation==='subtract') { a=integer(1,limit,random); b=integer(0,a,random);result=a-b;symbol='−'; }
 if(operation==='multiply'||operation==='divide') {
  const factor=[0,5,10,12][level]; a=integer(1,factor,random);b=integer(1,factor,random);
  if(operation==='multiply') {result=a*b;symbol='×';}
  else {result=a;a*=b;symbol='÷';}
 }
 const radius=level===3&&result>20?8:5;
 const neighbours=Array.from({length:radius*2+1},(_,i)=>result+i-radius).filter(n=>n>=0&&n!==result);
 const options=[result,...shuffle(neighbours,random).slice(0,5)].map(String);
 return {kind:'math',text:`${a} ${symbol} ${b} = ?`,answer:String(result),options,full:`${a} ${symbol} ${b} = ${result}`,prompt:'Wybierz wynik działania',difficulty:level};
}

const WORLD_EUROPE=FLAGS.filter(flag=>flag.continent==='europe').sort((a,b)=>a.distanceKm-b.distanceKm||a.distanceRank-b.distanceRank);

function ensureFlagUsed(session){
 if(!session)return new Set();
 if(!(session.flagUsedIds instanceof Set))session.flagUsedIds=new Set();
 return session.flagUsedIds;
}

function randomPick(items,random){
 return items.length?items[Math.floor(random()*items.length)]:null;
}

function europeFrontierSize(questionNumber){
 if(questionNumber<=12)return Math.min(14,WORLD_EUROPE.length);
 if(questionNumber<=28)return Math.min(26,WORLD_EUROPE.length);
 if(questionNumber<=46)return Math.min(38,WORLD_EUROPE.length);
 return WORLD_EUROPE.length;
}

function jumpRankBand(questionNumber){
 if(questionNumber<=20)return [60,110];
 if(questionNumber<=40)return [80,140];
 if(questionNumber<=60)return [105,165];
 return [130,195];
}

function scheduleNextJump(session,questionNumber,random){
 session.flagNextJumpAt=questionNumber+6+Math.floor(random()*3);
}

function pickWorldCurriculumFlag(session,random){
 const used=ensureFlagUsed(session);
 const questionNumber=(session?.question||0)+1;
 if(!Number.isInteger(session?.flagNextJumpAt))scheduleNextJump(session,0,random);

 let unused=FLAGS.filter(flag=>!used.has(flag.id));
 if(!unused.length){used.clear();unused=[...FLAGS];}

 const nonEuropean=unused.filter(flag=>flag.continent!=='europe');
 const jumpDue=questionNumber>=session.flagNextJumpAt&&nonEuropean.length>0;
 let flag=null;
 let isDistanceJump=false;
 const frontierSize=europeFrontierSize(questionNumber);

 if(jumpDue){
  const [minRank,maxRank]=jumpRankBand(questionNumber);
  let jumpPool=nonEuropean.filter(item=>item.distanceRank>=minRank&&item.distanceRank<=maxRank);
  if(!jumpPool.length)jumpPool=nonEuropean;
  flag=randomPick(jumpPool,random);
  isDistanceJump=true;
  scheduleNextJump(session,questionNumber,random);
 }else{
  const unusedEurope=WORLD_EUROPE.filter(item=>!used.has(item.id));
  if(unusedEurope.length){
   let localPool=WORLD_EUROPE.slice(0,frontierSize).filter(item=>!used.has(item.id));
   if(!localPool.length)localPool=unusedEurope;
   localPool.sort((a,b)=>a.distanceKm-b.distanceKm||a.distanceRank-b.distanceRank);
   flag=randomPick(localPool.slice(0,Math.min(8,localPool.length)),random);
  }else{
   const nearest=[...unused].sort((a,b)=>a.distanceKm-b.distanceKm||a.distanceRank-b.distanceRank);
   flag=randomPick(nearest.slice(0,Math.min(12,nearest.length)),random);
  }
 }

 if(!flag)flag=randomPick(unused,random);
 if(!flag)throw Error('Brak państw dla tego wyboru.');
 used.add(flag.id);
 session.flagLastWasDistanceJump=isDistanceJump;
 session.flagCountriesSeen=used.size;
 return {flag,isDistanceJump,questionNumber};
}

function regionalDifficulty(flag,region){
 const ordered=[...region].sort((a,b)=>a.distanceKm-b.distanceKm||a.distanceRank-b.distanceRank);
 const index=Math.max(0,ordered.findIndex(item=>item.id===flag.id));
 return Math.min(3,Math.floor(index*3/Math.max(1,ordered.length))+1);
}

function regionalFrontierSize(questionNumber,total){
 const progress=Math.min(1,Math.max(0,(questionNumber-1)/36));
 return Math.min(total,Math.max(Math.min(6,total),Math.ceil(total*(.28+.72*progress))));
}

function pickRegionalCurriculumFlag(session,region,random){
 const used=ensureFlagUsed(session);
 const questionNumber=(session?.question||0)+1;
 let unused=region.filter(flag=>!used.has(flag.id));
 if(!unused.length){used.clear();unused=[...region];}
 const ordered=[...region].sort((a,b)=>a.distanceKm-b.distanceKm||a.distanceRank-b.distanceRank);
 const frontier=regionalFrontierSize(questionNumber,ordered.length);
 if(!Number.isInteger(session?.flagNextJumpAt))scheduleNextJump(session,0,random);

 let flag=null;
 let isDistanceJump=false;
 const jumpDue=questionNumber>=session.flagNextJumpAt&&unused.some(item=>ordered.indexOf(item)>=frontier);
 if(jumpDue){
  const farPool=unused.filter(item=>ordered.indexOf(item)>=frontier);
  flag=randomPick(farPool,random);
  isDistanceJump=true;
  scheduleNextJump(session,questionNumber,random);
 }else{
  let localPool=ordered.slice(0,frontier).filter(item=>!used.has(item.id));
  if(!localPool.length)localPool=unused;
  flag=randomPick(localPool.slice(0,Math.min(8,localPool.length)),random);
 }
 if(!flag)flag=randomPick(unused,random);
 if(!flag)throw Error('Brak państw dla tego zakresu.');
 used.add(flag.id);
 session.flagLastWasDistanceJump=isDistanceJump;
 session.flagCountriesSeen=used.size;
 return {flag,isDistanceJump,questionNumber};
}

function selectedFlagRegion(config){
 if(config.flagScope!=='continents')return FLAGS;
 const chosen=new Set(config.flagContinents||[]);
 const region=FLAGS.filter(flag=>chosen.has(flag.continent));
 return region.length?region:FLAGS.filter(flag=>flag.continent==='europe');
}

function distractorRegion(flag,region,config){
 if(config.flagScope==='world'){
  const sameContinent=FLAGS.filter(item=>item.continent===flag.continent);
  return sameContinent.length>=4?sameContinent:FLAGS;
 }
 return region.length>=4?region:FLAGS;
}

function flagQuestion(flag,optionRegion,config,random,difficulty,extra={}){
 const common={
  countryId:flag.id,continent:flag.continent,capital:flag.capital,image:flag.flagSvg,
  distanceKm:flag.distanceKm,distanceRank:flag.distanceRank,
  distanceJump:Boolean(extra.distanceJump),countriesSeen:Number(extra.countriesSeen)||0,
  difficulty,feedbackMs:1000
 };
 const distractors=shuffle(optionRegion.filter(other=>other.id!==flag.id),random).slice(0,3);

 if(config.flagGameType==='countries'){
  const ids=[flag.id,...distractors.map(other=>other.id)];
  return {...common,kind:'flag-country',flagGameType:'countries',text:flag.country,full:flag.country,
   answer:flag.id,options:ids,prompt:'Wybierz flagę tego państwa.',
   optionImages:Object.fromEntries([flag,...distractors].map(item=>[item.id,item.flagSvg]))};
 }
 if(config.flagGameType==='capitals'){
  return {...common,kind:'flag-capital',flagGameType:'capitals',text:flag.capital,full:flag.country,
   answer:flag.country,options:[flag.country,...distractors.map(other=>other.country)],
   prompt:'Które państwo ma tę stolicę?',feedbackMs:1250};
 }
 return {...common,kind:'flags',flagGameType:'flags',text:'Co to za kraj?',full:flag.country,
  answer:flag.country,options:[flag.country,...distractors.map(other=>other.country)],
  prompt:'Który kraj ma taką flagę?'};
}

export function createSource(mode, config, words, random = Math.random) {
 if(mode==='spelling') return filterSpellingPreview(words)
  .filter(w=>(config.category==='all'||w.category===config.category)&&(!config.difficulty||w.difficulty===config.difficulty))
  .map(w=>({...w,kind:'spelling',text:w.masked,full:w.word,prompt:'Co pasuje w lukę?'}));
 if(mode==='math') return ()=>mathQuestion(config,random);
 if(mode==='english') {
  let pool=ENGLISH.filter(w=>config.category==='all'||w.category===config.category);
  if(config.difficulty===3) { const longer=pool.filter(w=>w.word.length>=5);if(longer.length)pool=longer; }
  return pool.map(w=>({kind:'english',text:w.meaning,answer:w.word,full:w.word,
   options:config.difficulty===1?[w.word,...shuffle(ENGLISH.filter(o=>o.category===w.category&&o.word!==w.word),random).slice(0,3).map(o=>o.word)]:[w.word,...w.mistakes],
   prompt:config.difficulty===1?'Jak to jest po angielsku?':'Wybierz poprawną pisownię',difficulty:config.difficulty}));
 }
 if(mode==='flags') {
  const normalized=cleanConfig('flags',config);
  const region=selectedFlagRegion(normalized);
  return session=>{
   const picked=normalized.flagScope==='world'
    ? pickWorldCurriculumFlag(session,random)
    : pickRegionalCurriculumFlag(session,region,random);
   const flag=picked.flag;
   const options=distractorRegion(flag,region,normalized);
   const difficulty=normalized.flagScope==='world'?flag.difficulty:regionalDifficulty(flag,region);
   return flagQuestion(flag,options,normalized,random,difficulty,{
    distanceJump:picked.isDistanceJump,
    countriesSeen:session?.flagCountriesSeen
   });
  };
 }
 if(mode==='reading') return READING.filter(r=>r.level===config.difficulty).map(r=>({...r,kind:'reading',full:r.text,difficulty:r.level}));
 throw Error('Nieznany tryb.');
}
