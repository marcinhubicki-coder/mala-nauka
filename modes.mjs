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
export function cleanConfig(mode, value) {
 const categories = MODES[mode].categories.map(([id])=>id);
 return { category:categories.includes(value?.category)?value.category:'all',
  difficulty:[1,2,3,...(mode==='spelling'?[0]:[])].includes(value?.difficulty)?value.difficulty:(mode==='spelling'?0:1),
  duration:DURATIONS.includes(value?.duration)?value.duration:180 };
}
export function levelLabel(mode, level) { return MODES[mode].levels[mode==='spelling'?level:level-1]; }
export function categoryLabel(mode, category) { return MODES[mode].categories.find(([id])=>id===category)?.[1] || ''; }
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

function flagWeights(startDifficulty, session) {
 const recent=(session?.recentAnswers||[]).slice(-8);
 const attempts=recent.length;
 if(startDifficulty===3)return {1:0,2:0,3:1};
 if(attempts<3)return startDifficulty===2?{1:0,2:1,3:0}:{1:1,2:0,3:0};
 const correct=recent.filter(result=>result.correct).length;
 const accuracy=correct/attempts;
 const averageMs=recent.reduce((sum,result)=>sum+Math.min(result.responseMs||8000,12000),0)/attempts;
 if(startDifficulty===2){
  if(attempts>=6&&accuracy>=.85&&averageMs<=3800)return {1:0,2:.45,3:.55};
  if(accuracy>=.80&&averageMs<=4800)return {1:0,2:.75,3:.25};
  return {1:0,2:1,3:0};
 }
 if(attempts>=8&&accuracy>=.88&&averageMs<=3200)return {1:.15,2:.45,3:.40};
 if(attempts>=6&&accuracy>=.84&&averageMs<=4200)return {1:.35,2:.50,3:.15};
 if(accuracy>=.80&&averageMs<=5200)return {1:.65,2:.35,3:0};
 return {1:1,2:0,3:0};
}

function chooseFlagDifficulty(pools,startDifficulty,session,random){
 const weights=flagWeights(startDifficulty,session);
 const weighted=[1,2,3].filter(level=>weights[level]>0&&(pools.get(level)?.length||0));
 if(weighted.length){
  const total=weighted.reduce((sum,level)=>sum+weights[level],0);
  let pick=random()*total;
  for(const level of weighted){pick-=weights[level];if(pick<=0)return level;}
  return weighted.at(-1);
 }
 const atOrAbove=[1,2,3].filter(level=>level>=startDifficulty&&(pools.get(level)?.length||0));
 if(atOrAbove.length)return atOrAbove[0];
 return [3,2,1].find(level=>pools.get(level)?.length)||1;
}

function flagQuestion(flag,region,config,random){
 return {kind:'flags',text:'Co to za kraj?',image:flag.flagSvg,answer:flag.country,full:flag.country,
  countryId:flag.id,continent:flag.continent,capital:flag.capital,startDifficulty:config.difficulty,
  options:[flag.country,...shuffle(region.filter(other=>other.id!==flag.id),random).slice(0,3).map(other=>other.country)],
  prompt:'Który kraj ma taką flagę?',difficulty:flag.difficulty};
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
  const region=FLAGS.filter(f=>config.category==='all'||f.continent===config.category);
  const pools=new Map([1,2,3].map(level=>[level,region.filter(flag=>flag.difficulty===level)]));
  return session=>{
   const level=chooseFlagDifficulty(pools,config.difficulty,session,random);
   let candidates=pools.get(level)||[];
   const previousId=session?.current?.countryId;
   if(candidates.length>1&&previousId)candidates=candidates.filter(flag=>flag.id!==previousId);
   const flag=candidates[Math.floor(random()*candidates.length)]||region[Math.floor(random()*region.length)];
   if(!flag)throw Error('Brak flag dla tego wyboru.');
   return flagQuestion(flag,region,config,random);
  };
 }
 if(mode==='reading') return READING.filter(r=>r.level===config.difficulty).map(r=>({...r,kind:'reading',full:r.text,difficulty:r.level}));
 throw Error('Nieznany tryb.');
}
