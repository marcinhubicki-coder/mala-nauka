import {cleanJourney,GAME_MODES,POWERS,progressionRules,visibleAchievementIds,starLevel} from './progression.mjs';

export const TROPHY_STAGES=[5,25,100,500];
export function trophyLevel(journey){return TROPHY_STAGES.reduce((level,n,i)=>journey.achievements?.['mastery-'+n]?i:level,0);}
const ratio=a=>a.total?Math.min(1,a.current/a.total):0;
// Only real progression conditions are described here. Hidden awards have no
// public sprite until earned; they are never made into pretend trophy variants.
export function awardCatalog(value,mastered=0,words=[],mode='spelling'){
 const j=cleanJourney(value),rules=progressionRules(),selected=j.trophies['mastery-5'],level=trophyLevel(j);
 const categories=[...new Set(words.map(w=>w.category))],discovered=words.filter(w=>j.cards[w.word]).length;
 const complete=!!j.achievements['complete-'+j.pack];
 const requirements=[...words.map(w=>!!j.cards[w.word]&&starLevel(j.cards[w.word].correct)===3&&!!w.word),...visibleAchievementIds(words).map(id=>!!j.achievements[id]),...POWERS.map(p=>j.powers.includes(p.id))];
 // The pack trophy's progress also includes permanent mastery of every word.
 const packCurrent=requirements.filter(Boolean).length+Math.min(words.length,mastered),packTotal=requirements.length+words.length;
 const trophies=[{id:'mastery-5',title:'Puchar wiedzy',description:'Największa nagroda? To, co już umiesz.',owned:!!j.achievements['mastery-5'],revealed:!!selected,current:mastered,total:TROPHY_STAGES[(selected?.path.length??-1)+1]||500,unit:'słów w „Umiem”',family:selected?.family??0,path:selected?.path||'',canUpgrade:!!j.achievements['mastery-5']&&(!selected||selected.path.length<level),grows:true},
  {id:'discover-all',title:'Wielki odkrywca',description:'Każda karta ma już swoje miejsce w kolekcji.',owned:!!words.length&&categories.every(c=>j.achievements['discover-'+c]),current:discovered,total:words.length,unit:'odkrytych słów',family:1,path:'aaa'},
  {id:'complete-'+j.pack,title:'Cała przygoda',description:'Wiedza, złote karty, moce i wszystkie wyzwania pakietu.',owned:complete,current:complete?packTotal:packCurrent,total:packTotal,unit:'kroków całej przygody',family:4,path:'bbb'}];
 const medals=[];
 for(const [design,[m,name]] of Object.entries(Object.entries(GAME_MODES))){
  const goals=m==='spelling'?[...[10,20,40,80].filter(n=>n<=words.length).map((n,i)=>({id:'flawless-count-'+n,title:n+' słów bez błędu',condition:'Bezbłędna runda: '+n+' słów',tier:Math.min(2,i),design:Number(design)}))]:[];
  goals.push(...[60,120,180,300].map((n,i)=>({id:'flawless-time-'+m+'-'+n,title:name+' · '+n/60+' min',condition:`${n/60} min bez błędu · min. ${Math.ceil(n/60*rules.modes[m].questionsPerMinute)} zadań`,tier:Math.min(2,i),design:Number(design)})));
  const earned=goals.filter(a=>j.achievements[a.id]);const next=goals.find(a=>!j.achievements[a.id]);
  for(const a of [...earned,...(next&&((m===mode)||j.totals[m]>=10)?[next]:[])])medals.push({...a,owned:!!j.achievements[a.id],current:j.achievements[a.id]?1:0,total:1,unit:'pełna runda',near:a===next});
 }
 for(const [i,c] of categories.entries()){
  const all=words.filter(w=>w.category===c),current=all.filter(w=>j.cards[w.word]).length;
  medals.push({id:'discover-'+c,title:'Odkrywca '+c,condition:'Odkryj wszystkie słowa tej kategorii',owned:!!j.achievements['discover-'+c],current,total:all.length,unit:'odkrytych słów',design:i%5,tier:0,near:current>=all.length*.5});
 }
 const days=Object.values(j.activeDays).filter(n=>n>=rules.activeDayAnswers).length;
 medals.push({id:'active-days-7',title:'Wracam po wiedzę',condition:'7 dni z nauką, w Twoim rytmie',owned:!!j.achievements['active-days-7'],current:days,total:7,unit:'dni z min. '+rules.activeDayAnswers+' zadaniami',design:4,tier:0,near:days>0});
 return {trophies:trophies.filter((a,i)=>i===0||a.owned||ratio(a)>=.75),medals:medals.filter(a=>a.owned||a.near).sort((a,b)=>Number(b.owned)-Number(a.owned)||ratio(b)-ratio(a))};
}
export function awardProgress(a){return a.owned?'Zdobyte na zawsze ✓':`${Math.min(a.current,a.total)} / ${a.total} ${a.unit}`;}
