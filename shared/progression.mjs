import {cleanAdventure,trackAdventure} from './adventure-model.mjs';
// One versioned economy for the game, Studio's calculator and saved rounds.
// Coins are stored in millionths: short rounds never lose rounding remainders.
export const GAME_MODES = Object.freeze({spelling:'Ortografia',math:'Matematyka',english:'Angielski',flags:'Flagi',reading:'Czytanie'});
export const PROGRESSION_RULES = Object.freeze({
 version:1, pack:'base-v1', stars:[5,15,30], starBonus:[0,.02,.04,.06],
 mastery:{recallDays:3,spanDays:7,consolidateDays:2}, ruleDiscovery:3,ruleCompleteBonus:5,
 combo:{thresholds:[3,6,10],multipliers:[1.25,1.5,2]},
 meter:{capacity:100,answer:5,correct:5},
 modes:{spelling:{questionsPerMinute:8},math:{questionsPerMinute:12},english:{questionsPerMinute:8},flags:{questionsPerMinute:16},reading:{questionsPerMinute:6}},
 activeDayAnswers:10, balanceTolerance:.15
});
export const POWERS = Object.freeze([
 {id:'spark',name:'Iskra odkrywcy',tier:'rare',icon:'✦',cost:40,bonus:.2,requires:{spelling:10},description:'Rozświetla zadanie i dodaje 20% iskier za poprawną odpowiedź.'},
 {id:'shield',name:'Spokojna tarcza',tier:'rare',icon:'◈',cost:70,bonus:.2,guard:true,requires:{spelling:20,math:10},description:'Chroni combo przy jednym potknięciu. Błąd nadal jest błędem do nauki.'},
 {id:'aurora',name:'Srebrna zorza',tier:'epic',icon:'❋',cost:180,bonus:.35,requires:{spelling:50,math:30,reading:20},description:'Otula zadanie zorzą i dodaje 35% iskier za poprawną odpowiedź.'},
 {id:'recall',name:'Latarnia pamięci',tier:'rare',icon:'◉',cost:55,bonus:.2,requires:{reading:15},description:'Rozświetla zadanie kręgiem pamięci i wzmacnia zdobywane iskry.'},
 {id:'orbit',name:'Orbita odkrywcy',tier:'epic',icon:'◎',cost:160,bonus:.3,requires:{flags:40,math:20},description:'Zatacza świetlistą orbitę wokół zadania i dodaje iskier.'},
 {id:'rainbow',name:'Tęczowy most',tier:'epic',icon:'⌒',cost:200,bonus:.35,requires:{english:40,reading:20},description:'Łączy kolory nauki w tęczową falę światła.'},
 {id:'trail',name:'Szlak świetlików',tier:'legendary',icon:'✧',cost:350,bonus:.45,requires:{spelling:60,math:40,reading:30,english:30,flags:30},description:'Świetliki otaczają zadanie i wzmacniają premię iskier.'},
 {id:'comet',name:'Złota kometa',tier:'legendary',icon:'☄',cost:400,bonus:.5,requires:{spelling:100,math:60,reading:40,english:40,flags:40},description:'Dodaje 50% iskier. Jej przepis łączy naukę we wszystkich pięciu przygodach.'}
]);
const integer=n=>Number.isSafeInteger(n)&&n>=0?n:0;
const own=(v,key)=>Object.hasOwn(v||{},key);
const copy=v=>JSON.parse(JSON.stringify(v));
export function validateProgression(r){
 if(r?.version!==1||typeof r.pack!=='string'||!r.pack||r.pack.length>64)throw Error('Nieprawidłowa wersja zasad gry.');
 const numbers=[...r.stars||[],...r.starBonus||[],...r.combo?.thresholds||[],...r.combo?.multipliers||[],...Object.values(r.mastery||{}),...Object.values(r.meter||{}),r.ruleDiscovery,r.ruleCompleteBonus,r.activeDayAnswers,r.balanceTolerance,...Object.values(r.modes||{}).map(m=>m.questionsPerMinute)];
 if(numbers.some(n=>!Number.isFinite(n)||n<0)||r.stars?.length!==3||r.starBonus?.length!==4||r.combo?.thresholds?.length!==3||r.combo?.multipliers?.length!==3||Object.keys(r.modes||{}).sort().join()!==Object.keys(GAME_MODES).sort().join())throw Error('Nieprawidłowe progi postępu.');
 if(r.stars.some((n,i)=>!Number.isInteger(n)||n<1||(i&&n<=r.stars[i-1]))||r.starBonus.some(n=>n>.1)||r.combo.thresholds.some((n,i)=>!Number.isInteger(n)||n<1||(i&&n<=r.combo.thresholds[i-1]))||r.combo.multipliers.some((n,i)=>n<1||n>2||(i&&n<r.combo.multipliers[i-1]))||r.meter.capacity<10||r.meter.capacity>10000||r.meter.answer<1||r.meter.correct>100||r.mastery.recallDays<3||r.mastery.spanDays<7||r.ruleDiscovery<1||r.activeDayAnswers<1||Object.values(r.modes).some(m=>m.questionsPerMinute<1||m.questionsPerMinute>120))throw Error('Progi wykraczają poza bezpieczny zakres gry.');
 return r;
}
export function progressionRules(config=globalThis.__MALA_NAUKA_DESIGN__){return validateProgression(config?.progression||PROGRESSION_RULES);}
export function cleanJourney(value){
 const cards={};for(const [word,card]of Object.entries(value?.cards||{}))if(word&&!['__proto__','prototype','constructor'].includes(word)&&word.length<100&&card&&typeof card.firstSeenAt==='string')cards[word]={firstSeenAt:card.firstSeenAt,correct:integer(card.correct)};
 const receipts={};for(const [id,n]of Object.entries(value?.receipts||{}))if(id.length<150&&integer(n)>0)receipts[id]=n;
 return {version:1,adventure:cleanAdventure(value?.adventure),powerLevels:Object.fromEntries(POWERS.map(p=>[p.id,Math.max((value?.powers||[]).includes(p.id)?1:0,Math.min(3,integer(value?.powerLevels?.[p.id])))])),receipts,tutorialDone:value?.tutorialDone===true,pack:typeof value?.pack==='string'?value.pack:PROGRESSION_RULES.pack,cards,
  sparks:integer(value?.sparks),lifetimeSparks:integer(value?.lifetimeSparks),meter:Math.min(10000,Number.isFinite(value?.meter)&&value.meter>=0?value.meter:0),
  powers:[...new Set((value?.powers||[]).filter(id=>POWERS.some(p=>p.id===id)))],pending:POWERS.some(p=>p.id===value?.pending)?value.pending:null,
  queued:POWERS.some(p=>p.id===value?.queued)?value.queued:null,
  totals:Object.fromEntries(Object.keys(GAME_MODES).map(m=>[m,integer(value?.totals?.[m])])),
  activeDays:Object.fromEntries(Object.entries(value?.activeDays||{}).filter(([d,n])=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&integer(n)>0)),
  achievements:value?.achievements&&typeof value.achievements==='object'?copy(value.achievements):{},
  trophies:value?.trophies&&typeof value.trophies==='object'?copy(value.trophies):{},
  rules:value?.rules&&typeof value.rules==='object'?copy(value.rules):{},
  applied:[...new Set((value?.applied||[]).filter(id=>typeof id==='string'))]};
}
export function starLevel(correct,rules=progressionRules()){return rules.stars.filter(n=>correct>=n).length;}
export const sparkBalance=journey=>Math.floor(integer(journey?.sparks)/1e6);
export function comboMultiplier(streak,rules=PROGRESSION_RULES){let n=1;rules.combo.thresholds.forEach((t,i)=>{if(streak>=t)n=rules.combo.multipliers[i];});return n;}
export function discoverWord(value,word,at=new Date().toISOString()){
 const journey=cleanJourney(value);if(typeof word!=='string'||!word||own(journey.cards,word))return {journey,discovered:false};
 journey.cards[word]={firstSeenAt:at,correct:0};return {journey,discovered:true};
}
function choosePower(journey,random){
 if(journey.queued&&journey.powers.includes(journey.queued)){const id=journey.queued;journey.queued=null;return id;}
 const tiers=['rare','epic','legendary'].filter(t=>journey.powers.some(id=>POWERS.find(p=>p.id===id)?.tier===t));
 const weights=tiers.length===3?[.4,.35,.25]:tiers.length===2?[.6,.4]:[1];
 let roll=random(),tier=tiers.at(-1);for(let i=0;i<tiers.length;i++){roll-=weights[i];if(roll<0){tier=tiers[i];break;}}
 const eligible=journey.powers.filter(id=>POWERS.find(p=>p.id===id)?.tier===tier);
 return eligible.length?eligible[Math.min(eligible.length-1,Math.floor(random()*eligible.length))]:null;
}
export function reservePower(value,rules=PROGRESSION_RULES,random=Math.random){
 const journey=cleanJourney(value);if(!journey.pending&&journey.powers.length&&journey.meter>=rules.meter.capacity){journey.pending=choosePower(journey,random);journey.meter-=rules.meter.capacity;}return journey;
}
// Explicit choice uses exactly the same charge and one-answer duration as a draw.
export function reserveChosenPower(value,id,rules=PROGRESSION_RULES){
 validateProgression(rules);const journey=cleanJourney(value);
 if(journey.pending)throw Error('Moc jest już przygotowana.');
 if(!journey.powers.includes(id)||journey.meter<rules.meter.capacity)throw Error('Ta moc nie jest naładowana.');
 journey.pending=id;journey.meter-=rules.meter.capacity;journey.queued=null;return journey;
}
export function answerReward(value,attempt,{mode='spelling',id,streak=0,rules=PROGRESSION_RULES,random=Math.random}={}){
 validateProgression(rules);if(!id||!GAME_MODES[mode])throw Error('Odpowiedź wymaga trwałego identyfikatora i trybu.');
 let journey=cleanJourney(value);const receipt=/^(.*):([1-9][0-9]*)$/.exec(id);if(journey.applied.includes(id)||receipt&&(journey.receipts[receipt[1]]||0)>=Number(receipt[2]))return {journey,streak,duplicate:true,sparks:0};
 const power=powerDefinition(POWERS.find(p=>p.id===journey.pending)),correct=attempt.correct===true,assisted=attempt.hintUsed===true||attempt.explanationUsed===true;
 const nextStreak=correct?(assisted?streak:streak+1):power?.guard?streak:0;
 const multiplier=comboMultiplier(nextStreak,rules),work=8/rules.modes[mode].questionsPerMinute;
 const previousLevel=starLevel(journey.cards[attempt.word]?.correct||0,rules);
 if(mode==='spelling'&&journey.cards[attempt.word]&&correct)journey.cards[attempt.word].correct++;
 const base=correct?work*multiplier*(1+rules.starBonus[previousLevel]):0;
 const earned=Math.round((base*(1+(power?Math.min(.8,power.bonus*[0,1,1.35,1.75][journey.powerLevels[power.id]||1]):0))+(power?work:0))*1e6);
 journey.adventure=trackAdventure(journey.adventure,mode,attempt);
 journey.sparks+=earned;journey.lifetimeSparks+=earned;journey.totals[mode]++;
 const date=new Date(attempt.at||Date.now());const day=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
 journey.activeDays[day]=(journey.activeDays[day]||0)+1;
 // Charge comes from work and accuracy, never from the power's own bonus.
 journey.meter=Math.min(rules.meter.capacity,journey.meter+work*(rules.meter.answer+(correct?rules.meter.correct*multiplier:0)));
 journey.pending=null;if(receipt)journey.receipts[receipt[1]]=Number(receipt[2]);else journey.applied.push(id);
 return {journey,streak:nextStreak,sparks:earned/1e6,multiplier,power:power?.id||null,star:starLevel(journey.cards[attempt.word]?.correct||0,rules),starEarned:mode==='spelling'&&starLevel(journey.cards[attempt.word]?.correct||0,rules)>previousLevel};
}
export function powerRecipe(journey,power){
 power=powerDefinition(power);
 const have=cleanJourney(journey),missing=Object.entries(power.requires).filter(([mode,n])=>have.totals[mode]<n);
 const predecessor=power.tier==='legendary'?'epic':power.tier==='epic'?'rare':null;
 const unlocked=!predecessor||have.powers.some(id=>POWERS.find(p=>p.id===id)?.tier===predecessor);
 return {missing,unlocked,owned:have.powers.includes(power.id),affordable:sparkBalance(have)>=power.cost,ready:!missing.length&&unlocked&&sparkBalance(have)>=power.cost};
}
export function forgePower(value,id,rules=PROGRESSION_RULES){
 const journey=cleanJourney(value),power=powerDefinition(POWERS.find(p=>p.id===id));if(!power)throw Error('Nieznana moc.');
 const recipe=powerRecipe(journey,power);if(recipe.owned)return journey;if(!recipe.ready)throw Error('Zbierz składniki przepisu i iskry.');
 journey.sparks-=power.cost*1e6;const first=!journey.powers.length;journey.powers.push(id);journey.powerLevels[id]=1;journey.queued=id;if(first)journey.meter=rules.meter.capacity;return journey;
}
export function visibleAchievementIds(words){const categories=[...new Set(words.map(w=>w.category))];return [...[5,25,50,100,250,500].filter(n=>n<=words.length).map(n=>'mastery-'+n),...categories.map(c=>'discover-'+c),'active-days-7',...[10,20,40,80].filter(n=>n<=words.length).map(n=>'flawless-count-'+n),...Object.keys(GAME_MODES).flatMap(m=>[60,120,180,300].map(n=>'flawless-time-'+m+'-'+n))];}
export function awardAchievements(value,learning,words,result=null,rules=PROGRESSION_RULES){
 const journey=cleanJourney(value),earned=(id)=>journey.achievements[id]||=(result?.date||new Date().toISOString());
 const mastered=Object.values(learning?.items||{}).filter(i=>i.masteryEarned).length;
 for(const n of [5,25,50,100,250,500])if(mastered>=n)earned('mastery-'+n);
 for(const category of new Set(words.map(w=>w.category))){const all=words.filter(w=>w.category===category);if(all.length&&all.every(w=>journey.cards[w.word]))earned('discover-'+category);}
 if(Object.values(journey.activeDays).filter(n=>n>=rules.activeDayAnswers).length>=7)earned('active-days-7');
 if(result&&!result.early&&result.correct>0&&!result.wrong&&result.attempts?.length===result.correct&&result.attempts.every(a=>a.correct&&!a.hintUsed&&!a.explanationUsed&&!a.skipped)){
  if(result.limitMode==='count'&&!result.dyktando&&result.correct>=result.wordLimit&&result.actualWordLimit>=result.wordLimit)earned('flawless-count-'+result.wordLimit);
  if(result.limitMode!=='count'&&!result.dyktando&&result.elapsedMs>=result.duration*1000&&result.correct>=Math.ceil(result.duration/60*rules.modes[result.mode].questionsPerMinute))earned('flawless-time-'+result.mode+'-'+result.duration);
 }
 if(words.length&&words.every(w=>journey.cards[w.word]&&starLevel(journey.cards[w.word].correct,rules)===3&&learning?.items?.['word:'+w.word]?.masteryEarned)&&POWERS.every(p=>journey.powers.includes(p.id))&&visibleAchievementIds(words).every(id=>journey.achievements[id]))earned('complete-'+rules.pack);
 return journey;
}
// Path is append-only. L0 chooses the family; L1-L3 each add one binary choice.
export function chooseTrophy(value,id,{family,choice},allowedLevel=0){
 const journey=cleanJourney(value);if(!journey.achievements[id])throw Error('Najpierw zdobądź osiągnięcie.');
 const previous=journey.trophies[id];
 if(!previous){if(!Number.isInteger(family)||family<0||family>4)throw Error('Wybierz podstawę pucharu.');journey.trophies[id]={family,path:''};}
 else {if(family!==undefined&&family!==previous.family)throw Error('Wybór podstawy jest trwały.');if(!['a','b'].includes(choice)||previous.path.length>=Math.min(3,allowedLevel))throw Error('Ten etap nie jest jeszcze dostępny.');journey.trophies[id]={family:previous.family,path:previous.path+choice};}
 return journey;
}
export function trophySpriteIndex(path=''){return (2**path.length-1)+(path?parseInt(path.replaceAll('a','0').replaceAll('b','1'),2):0);}
export function balanceBenchmark(rules=PROGRESSION_RULES,{accuracy=.8,minutes=5}={}){
 return Object.entries(GAME_MODES).map(([mode,name])=>{let journey=cleanJourney(null),streak=0,total=0,charge=0;const n=Math.round(minutes*rules.modes[mode].questionsPerMinute);for(let i=0;i<n;i++){const correct=(i+1)*accuracy-Math.floor(i*accuracy)>=1-1e-8;const r=answerReward(journey,{correct,at:'2026-01-01T12:00:00Z'},{mode,id:'benchmark-'+i,streak,rules});journey=r.journey;streak=r.streak;total+=r.sparks;charge+=8/rules.modes[mode].questionsPerMinute*(rules.meter.answer+(correct?rules.meter.correct*r.multiplier:0));}return {mode,name,sparksPerMinute:total/minutes,chargesPerMinute:charge/rules.meter.capacity/minutes,questions:n};});
}

export function powerDefinition(power){if(!power)return null;return {...power,...(globalThis.__MALA_NAUKA_DESIGN__?.adventure?.powers?.[power.id]||{})};}
export function powerUpgradeRecipe(value,power){
 power=powerDefinition(power);
 const j=cleanJourney(value),level=j.powerLevels[power.id]||0,next=level+1,cost=Math.round(power.cost*[1,1.6,2.5][level]),missing=Object.entries(power.requires).filter(([mode,n])=>j.totals[mode]<Math.ceil(n*Math.max(1,next)));
 const base=powerRecipe(j,power);return {level,next,cost,missing,complete:level>=3,ready:level<3&&!missing.length&&(level>0||base.unlocked)&&sparkBalance(j)>=cost,bonus:Math.round(Math.min(.8,power.bonus*[0,1,1.35,1.75][Math.min(3,next)])*100)};
}
export function upgradePower(value,id,expectedLevel,rules=PROGRESSION_RULES){
 const j=cleanJourney(value),p=POWERS.find(p=>p.id===id);if(!p)throw Error('Nieznana moc.');const r=powerUpgradeRecipe(j,p);if(r.level!==expectedLevel||!r.ready)throw Error('Sprawdź poziom, składniki i portfel iskier.');if(!r.level)return forgePower(j,id,rules);j.sparks-=r.cost*1e6;j.powerLevels[id]=r.next;j.queued=id;return j;
}
