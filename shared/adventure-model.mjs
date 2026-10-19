// One data model for campaign, reward cards and Studio's simulator.
import {CAMPAIGN_ROUTE,LEGACY_CAMPAIGN_ROUTE} from './campaign-layout.mjs';
import {DISCOVERY_DEFAULTS,validateDiscovery} from './campaign-discovery.mjs';
import {FLAGS} from '../data/flags.mjs';
import {ENGLISH} from '../data/english.mjs';
import {READING} from '../data/reading.mjs';
export const ADVENTURE_MODES={spelling:'Ortografia',math:'Matematyka',english:'Angielski',flags:'Flagi',reading:'Czytanie'};
export const REALMS=[['city','Port odkrywców','Pierwszy krok w wielką przygodę'],['jungle','Zielona wyprawa','Nowe ścieżki wśród drzew'],['caves','Kryształowe podziemia','Odkrywaj to, co ukryte'],['fairies','Kraina świetlików','Wiedza nabiera blasku'],['space','Gwiezdny szlak','Twoja własna droga do gwiazd'],['heavens','Niebiosa','Przygoda ponad chmurami'],['underwater','Podwodne królestwo','Odkrywaj tajemnice oceanu']];
export const MATH_SKILLS=['add-10','add-20','subtract-10','subtract-20','add-100','subtract-100','multiply-5','divide-5','add-1000','subtract-1000','multiply-10','divide-10'];
export const METRICS={discovered:'Odkryte zagadnienia',mastered:'Zagadnienia w „Umiem”',gold:'Złote gwiazdki',answers:'Wszystkie odpowiedzi',correct:'Samodzielne poprawne odpowiedzi',days:'Aktywne dni',rules:'Odkryte zasady',worlds:'Ukończone światy'};
const copy=v=>structuredClone(v),count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
const safe=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const validKey=s=>typeof s==='string'&&s.length<180&&!['__proto__','prototype','constructor'].includes(s);
export function cleanAdventure(v){
 const units={};for(const mode of Object.keys(ADVENTURE_MODES)){units[mode]={};for(const[k,r]of Object.entries(safe(v?.units?.[mode]))){if(!validKey(k))continue;units[mode][k]={text:String(r.text||k).slice(0,180),correct:count(r.correct),seen:count(r.seen),days:[...new Set((r.days||[]).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)))].sort(),first:String(r.first||''),last:String(r.last||'')};}}
 const claims={};for(const[k,r]of Object.entries(safe(v?.claims)))if(validKey(k))claims[k]={level:Math.min(10,count(r.level)),choices:(r.choices||[]).filter(x=>Number.isInteger(x)&&x>=0&&x<10).slice(0,9)};
 const campaign=safe(v?.campaign);return {version:1,units,claims,campaign:{started:campaign.started===true,traveller:['boy','girl','horse'].includes(campaign.traveller)?campaign.traveller:null,completed:[...new Set((campaign.completed||[]).filter(validKey))],coverage:Object.fromEntries(Object.entries(safe(campaign.coverage)).filter(([k])=>validKey(k)).map(([k,v])=>[k,[...new Set((Array.isArray(v)?v:[]).filter(validKey))]])),rewards:[...new Set((campaign.rewards||[]).filter(validKey))],receipts:[...new Set((campaign.receipts||[]).filter(validKey))].slice(-300)}};
}
export function unitKey(mode,a){
 if(a.learningKey)return String(a.learningKey);
 if(mode==='flags')return a.countryId||a.word||a.full;
 if(mode==='reading'&&a.kind==='memory')return 'memory-'+Math.max(3,Math.min(10,a.difficulty||3));
 if(mode==='math'){const t=a.full||a.text||'',op=a.category||(/[×*]/.test(t)?'multiply':/[÷/]/.test(t)?'divide':/[−-]/.test(t)?'subtract':'add'),n=Math.max(...(t.match(/\d+/g)||[0]).map(Number));return op+'-'+(['multiply','divide'].includes(op)?n<=25?5:10:n<=10?10:n<=20?20:n<=100?100:1000);}
 return a.word||a.full||a.text;
}
export function trackAdventure(value,mode,a){
 const v=cleanAdventure(value),key=unitKey(mode,a);if(!ADVENTURE_MODES[mode]||!validKey(key))return v;
 const at=new Date(a.at||Date.now()),day=at.toISOString().slice(0,10),r=v.units[mode][key]||={text:String(a.word||a.full||a.text||key).slice(0,180),seen:0,correct:0,days:[],first:day,last:day};
 r.seen++;r.last=day;if(a.correct&&!a.hintUsed&&!a.explanationUsed){r.correct++;if(!r.days.includes(day))r.days.push(day);r.days.sort();}return v;
}
export const isUnitMastered=r=>r.correct>=5&&r.days.length>=3&&Date.parse(r.days.at(-1))-Date.parse(r.days[0])>=7*86400000;
export function material(mode,words=[]){
 if(mode==='spelling')return words.map(w=>({key:w.word,text:w.word,category:w.category,difficulty:w.difficulty}));
 if(mode==='english')return ENGLISH.map(w=>({key:w.word,text:w.word,category:w.category,translation:w.meaning||w.translation}));
 if(mode==='flags')return FLAGS.map(w=>({key:w.id,text:w.country,category:w.continent,capital:w.capital}));
 if(mode==='reading')return READING.map(w=>({key:w.text,text:w.text,category:'reading',difficulty:w.level}));
 return MATH_SKILLS.map(key=>({key,text:({'add':'Dodawanie','subtract':'Odejmowanie','multiply':'Mnożenie','divide':'Dzielenie'})[key.split('-')[0]]+' do '+key.split('-')[1],category:key.split('-')[0]}));
}
export function modeMetrics(progress,mode,words=[],{category}={}){
 const j=progress?.journey||{},a=cleanAdventure(j.adventure),pool=material(mode,words).filter(r=>!category||r.category===category),known=new Set(pool.map(r=>r.key));
 const units=Object.entries(a.units[mode]).filter(([key])=>known.has(key)).map(([,r])=>r);
 const spelling=mode==='spelling',mastered=spelling?Object.values(progress?.learning?.items||{}).filter(r=>r.masteryEarned&&known.has(r.word)).length:units.filter(isUnitMastered).length;
 return {total:pool.length,discovered:spelling?pool.filter(r=>j.cards?.[r.key]).length:units.length,mastered,gold:spelling?pool.filter(r=>(j.cards?.[r.key]?.correct||0)>=30).length:units.filter(r=>r.correct>=30).length,answers:j.totals?.[mode]||0,correct:spelling?Object.entries(j.cards||{}).filter(([key])=>!category||known.has(key)).reduce((n,[,r])=>n+r.correct,0):(category?units:Object.values(a.units[mode])).reduce((n,r)=>n+r.correct,0),days:Object.values(j.activeDays||{}).filter(n=>n>=10).length,rules:Object.values(j.rules||{}).filter(r=>r.collected).length,worlds:a.campaign.rewards.length};
}
const criterion=(metric,target)=>({metric,target});
export function defaultAdventure(){
 const recipes=Object.keys(ADVENTURE_MODES).flatMap((mode,i)=>[
 {id:mode+'-explorer',mode,kind:'medal',title:'Mały odkrywca',description:'Poznawaj nowe zagadnienia. Każde odkrycie otwiera drogę.',chest:i,stages:(mode==='math'?[3,6,12]:[5,10,15]).map(n=>[criterion('discovered',n)])},
 {id:mode+'-persistence',mode,kind:'medal',title:'Wytrwały podróżnik',description:'Wracaj do ćwiczeń i zbieraj poprawne odpowiedzi.',chest:(i+1)%5,stages:[1,2,3].map(n=>[criterion('correct',n*25)])},
 {id:mode+'-constellation',mode,kind:'trophy',title:'Konstelacja wiedzy',description:'Łącz odkrycia, powtórki i złote gwiazdki.',chest:(i+2)%5,stages:[[criterion('discovered',mode==='math'?3:10),criterion('correct',30)],[criterion('discovered',mode==='math'?6:20),criterion('correct',100)],[criterion('mastered',3),criterion('correct',200)],[criterion('mastered',5),criterion('gold',5)]]}
 ]);
 recipes.push({id:'campaign-voyager',mode:'spelling',kind:'trophy',title:'Puchar siedmiu światów',description:'Odkrywaj kolejne krainy. Jedna wielka pamiątka wyprawy.',chest:4,stages:[1,2,4,7].map(n=>[criterion('worlds',n)])});
 const realms=REALMS.map(([id,name,description],wi)=>({id,name,description,art:id,reward:20+wi*10,route:copy(CAMPAIGN_ROUTE),milestones:[5,10,15].map((n,mi)=>({id:id+'-m'+(mi+1),name:'Kamień milowy '+(mi+1),...CAMPAIGN_ROUTE[n]}))}));
 const math=['add','add','subtract','subtract','add','subtract','multiply','divide','add','subtract','multiply','divide','add','multiply','divide','add','subtract','multiply','divide','add','subtract'];
 const steps=realms.flatMap((realm,wi)=>realm.milestones.flatMap((m,mi)=>Object.keys(ADVENTURE_MODES).map((mode,ki)=>{const cohort=wi*3+mi;return {id:realm.id+'-'+mi+'-'+mode,realm:realm.id,milestone:m.id,mode,name:ADVENTURE_MODES[mode]+' · krok '+(cohort+1),cohort,cohorts:21,taskCount:10,duration:120,limitMode:mode==='math'&&cohort%3===2?'time':'count',accuracy:.7,difficulty:mode==='spelling'?0:mode==='english'?cohort<11?1:2:mode==='reading'?1+Math.floor(cohort/7):mode==='math'?cohort<8?1:cohort<12?2:3:1,category:mode==='math'?math[cohort]:'all',maxValue:[0,2].includes(cohort)?10:cohort<4?20:cohort<8?100:1000,...CAMPAIGN_ROUTE[mi*5+ki+1]};})));
 return {version:2,routeVersion:2,recipes,realms,steps,discovery:{...DISCOVERY_DEFAULTS}};
}
export function migrateAdventure(value){
 if(!value)return defaultAdventure();if(value.version===2){if(value.routeVersion===2&&value.discovery)return value;const next=copy(value);next.routeVersion=2;next.discovery??={...DISCOVERY_DEFAULTS};for(const realm of next.realms){if(realm.route?.every((p,i)=>Math.abs(p.x-LEGACY_CAMPAIGN_ROUTE[i][0])<.00001&&Math.abs(p.y-LEGACY_CAMPAIGN_ROUTE[i][1])<.00001)){realm.route=copy(CAMPAIGN_ROUTE);realm.milestones.forEach((m,i)=>Object.assign(m,CAMPAIGN_ROUTE[Math.min(15,(i+1)*5)]));next.steps.filter(s=>s.realm===realm.id).forEach((s,i)=>Object.assign(s,CAMPAIGN_ROUTE[Math.min(15,i+1)]));}}return next;}
 const next=copy(value),defaults=defaultAdventure();next.version=2;next.routeVersion=2;next.discovery??={...DISCOVERY_DEFAULTS};
 for(const realm of next.realms){realm.route=copy(CAMPAIGN_ROUTE);realm.milestones.forEach((m,i)=>Object.assign(m,CAMPAIGN_ROUTE[Math.min(15,(i+1)*5)]));}
 for(const realm of defaults.realms)if(!next.realms.some(r=>r.id===realm.id)){next.realms.push(realm);next.steps.push(...defaults.steps.filter(s=>s.realm===realm.id));}
 for(const step of next.steps){const replacement=defaults.steps.find(s=>s.id===step.id);if(replacement)Object.assign(step,{cohort:replacement.cohort,cohorts:21,difficulty:replacement.difficulty,x:replacement.x,y:replacement.y});}
 const trophy=next.recipes.find(r=>r.id==='campaign-voyager');if(trophy?.title==='Puchar pięciu światów'){trophy.title='Puchar siedmiu światów';trophy.stages=defaults.recipes.find(r=>r.id===trophy.id).stages;}
 return next;
}
export function adventureConfig(config=globalThis.__MALA_NAUKA_DESIGN__){return migrateAdventure(config?.adventure);}

export function validateAdventure(c){
 if(c?.discovery)validateDiscovery(c.discovery);
 if(![1,2].includes(c?.version)||!Array.isArray(c.recipes)||c.recipes.length>100||!Array.isArray(c.realms)||!c.realms.length||c.realms.length>12||!Array.isArray(c.steps)||c.steps.length>300)throw Error('Sprawdź plan kampanii i nagród.');
 const ids=new Set(),text=(s,n)=>typeof s==='string'&&s.trim()&&s.length<=n&&!/[<>\u0000-\u001f]/.test(s),id=s=>/^[a-z][a-z0-9-]{0,79}$/.test(s),coord=n=>Number.isFinite(n)&&n>=0&&n<=1;
 for(const r of c.recipes){if(!id(r.id)||ids.has(r.id)||!ADVENTURE_MODES[r.mode]||!['medal','trophy'].includes(r.kind)||!text(r.title,80)||!text(r.description,240)||!Number.isInteger(r.chest)||r.chest<0||r.chest>4||r.stages?.length!==(r.kind==='medal'?3:4))throw Error('Nieprawidłowy przepis nagrody.');ids.add(r.id);for(const stage of r.stages)if(!Array.isArray(stage)||!stage.length||stage.length>8||stage.some(a=>!METRICS[a.metric]||!Number.isInteger(a.target)||a.target<1||a.target>100000||a.mode&&!ADVENTURE_MODES[a.mode]||a.category&&(typeof a.category!=='string'||a.category.length>80||/[<>\u0000-\u001f]/.test(a.category)||!['discovered','mastered','gold','correct'].includes(a.metric))))throw Error('Sprawdź wymagania nagrody.');}
 const realms=new Set();for(const r of c.realms){if(r.route&&(r.route.length!==16||r.route.some(p=>!coord(p.x)||!coord(p.y))))throw Error('Sprawdź pola izometrycznego szlaku.');if(r.art&&!REALMS.some(a=>a[0]===r.art))throw Error('Wybierz ilustrację świata z biblioteki.');if(!id(r.id)||realms.has(r.id)||!text(r.name,80)||!text(r.description,240)||!Number.isInteger(r.reward)||r.reward<0||r.reward>500||!r.milestones?.length||r.milestones.length>20||r.milestones.some(m=>!id(m.id)||!text(m.name,80)||!coord(m.x)||!coord(m.y)))throw Error('Nieprawidłowy świat.');realms.add(r.id);}
 const steps=new Set();for(const s of c.steps){if(!id(s.id)||steps.has(s.id)||!realms.has(s.realm)||!c.realms.find(r=>r.id===s.realm).milestones.some(m=>m.id===s.milestone)||!ADVENTURE_MODES[s.mode]||!text(s.name,100)||!['count','time'].includes(s.limitMode)||![60,120,180,300].includes(s.duration)||!Number.isInteger(s.taskCount)||s.taskCount<1||s.taskCount>100||!Number.isInteger(s.cohort)||s.cohort<0||!Number.isInteger(s.cohorts)||s.cohorts<=s.cohort||s.cohorts>100||!Number.isFinite(s.accuracy)||s.accuracy<.5||s.accuracy>1||!coord(s.x)||!coord(s.y)||!Number.isInteger(s.maxValue)||s.maxValue<10||s.maxValue>10000)throw Error('Nieprawidłowy krok kampanii.');steps.add(s.id);}
 if(c.powers){for(const[id,r]of Object.entries(c.powers)){if(!['spark','shield','aurora','comet','recall','orbit','rainbow','trail'].includes(id)||!Number.isInteger(r.cost)||r.cost<10||r.cost>5000||!Number.isFinite(r.bonus)||r.bonus<0||r.bonus>.8||!r.requires||Object.entries(r.requires).some(([m,n])=>!ADVENTURE_MODES[m]||!Number.isInteger(n)||n<0||n>10000))throw Error('Nieprawidłowy przepis mocy.');}}
 return c;
}
export function rewardState(recipe,progress,words=[]){
 const a=cleanAdventure(progress?.journey?.adventure),claim=a.claims[recipe.id]||{level:0,choices:[]},metrics=modeMetrics(progress,recipe.mode,words),stage=recipe.stages[Math.min(claim.level,recipe.stages.length-1)],criteria=stage.map(c=>({...c,current:(c.mode||c.category?modeMetrics(progress,c.mode||recipe.mode,words,{category:c.category}):metrics)[c.metric]||0}));
 return {claim,criteria,complete:claim.level>=recipe.stages.length,ready:claim.level<recipe.stages.length&&criteria.every(c=>c.current>=c.target),ratio:criteria.reduce((n,c)=>n+Math.min(1,c.current/c.target),0)/criteria.length};
}
export function cupState(progress,mode,words=[]){
 const m=modeMetrics(progress,mode,words),a=cleanAdventure(progress?.journey?.adventure),claim=a.claims['knowledge-'+mode]||{level:0,choices:[]};
 const thresholds=Array.from({length:10},(_,i)=>i===0?1:Math.max(1,Math.ceil(m.total*i/9))),target=thresholds[Math.min(claim.level,9)];
 return {claim,total:m.total,current:m.mastered,target,thresholds,ready:claim.level<10&&m.mastered>=target,complete:claim.level>=10};
}
export function claimReward(progress,id,{choice=0,expectedLevel}={},words=[],config=adventureConfig()){
 const next=copy(progress),a=cleanAdventure(next.journey?.adventure),recipe=config.recipes.find(r=>r.id===id),cup=id.startsWith('knowledge-')&&ADVENTURE_MODES[id.slice(10)];
 const s=cup?cupState(next,id.slice(10),words):recipe?rewardState(recipe,next,words):null;
 if(!s||!s.ready||expectedLevel!==s.claim.level)throw Error('Wymagania zmieniły się. Otwórz kartę ponownie.');
 const options=cup?Array.from({length:9},(_,i)=>i).filter(i=>!s.claim.choices.includes(i)):recipe.kind==='trophy'?[0,1]:[0];
 if(s.claim.level>0&&!options.includes(choice))throw Error('Wybierz dostępne ulepszenie.');
 const choices=[...s.claim.choices];if(cup&&s.claim.level>0||recipe?.kind==='trophy')choices.push(choice);
 a.claims[id]={level:s.claim.level+1,choices};next.journey.adventure=a;return next;
}
export function campaignPool(step,words=[]){
 if(step.mode==='math'){const range=['multiply','divide'].includes(step.category)?step.difficulty===1?5:10:step.maxValue<=10?10:step.maxValue<=20?20:step.maxValue<=100?100:1000;return material('math').filter(r=>r.key===step.category+'-'+range);}
 let pool=material(step.mode,words);if(step.mode==='spelling')pool.sort((a,b)=>a.difficulty-b.difficulty||a.text.localeCompare(b.text,'pl'));if(step.mode==='flags')pool.sort((a,b)=>(a.category==='europe'?0:1)-(b.category==='europe'?0:1)||a.text.localeCompare(b.text,'pl'));
 return pool.slice(Math.floor(pool.length*step.cohort/step.cohorts),Math.floor(pool.length*(step.cohort+1)/step.cohorts));
}
export function campaignStepState(progress,step,words=[],config=adventureConfig()){
 const a=cleanAdventure(progress?.journey?.adventure),i=config.steps.findIndex(s=>s.id===step.id),covered=new Set(a.campaign.coverage[step.id]||[]),pool=campaignPool(step,words),complete=a.campaign.completed.includes(step.id);
 return {complete,unlocked:i===0||a.campaign.completed.includes(config.steps[i-1]?.id),covered:pool.filter(r=>covered.has(r.key)).length,total:pool.length,pool};
}
export function advanceCampaign(progress,result,words=[],config=adventureConfig()){
 const a=cleanAdventure(progress.journey?.adventure),c=a.campaign,step=config.steps.find(s=>s.id===result.campaignStepId);if(!step||!result.id||c.receipts.includes(result.id))return {changed:false,world:null};
 const s=campaignStepState(progress,step,words,config);if(!s.unlocked||s.complete||result.early||result.mode!==step.mode)return {changed:false,world:null};
 c.receipts.push(result.id);c.receipts=c.receipts.slice(-300);const valid=new Set(s.pool.map(r=>r.key)),coverage=new Set(c.coverage[step.id]||[]);
 for(const r of result.attempts||[])if(r.correct&&!r.hintUsed&&!r.explanationUsed&&valid.has(unitKey(step.mode,r)))coverage.add(unitKey(step.mode,r));c.coverage[step.id]=[...coverage];
 const accuracy=result.correct/Math.max(1,result.correct+result.wrong),roundDone=step.limitMode==='count'?result.correct+result.wrong>=Math.min(step.taskCount,Math.max(1,s.total)):result.elapsedMs>=step.duration*1000;
 let world=null;if(roundDone&&accuracy>=step.accuracy){c.completed.push(step.id);const realm=config.realms.find(r=>r.id===step.realm);if(config.steps.filter(r=>r.realm===realm.id).every(r=>c.completed.includes(r.id))&&!c.rewards.includes(realm.id)){c.rewards.push(realm.id);progress.journey.sparks+=realm.reward*1e6;progress.journey.lifetimeSparks+=realm.reward*1e6;world=realm;}}
 progress.journey.adventure=a;return {changed:true,world,complete:c.completed.includes(step.id)};
}
export function campaignSummary(progress,words=[],config=adventureConfig()){
 const complete=cleanAdventure(progress?.journey?.adventure).campaign.completed,coverage=Object.fromEntries(Object.keys(ADVENTURE_MODES).map(mode=>[mode,new Set(config.steps.filter(s=>s.mode===mode).flatMap(s=>campaignPool(s,words).map(r=>r.key))).size]));
 return {completed:complete.length,total:config.steps.length,coverage,minimumRounds:config.steps.length,worldRewards:config.realms.reduce((n,r)=>n+r.reward,0),next:config.steps.find(s=>!complete.includes(s.id))};
}
