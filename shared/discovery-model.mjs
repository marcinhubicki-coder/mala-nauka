// A bounded, replayable learning ledger. Discovery currency never grants mastery.
export const DISCOVERY_RULES = {
  memoryEvery:7,memoryAmount:1,mapCost:1,mapTiles:9,comboEvery:3,comboBonus:1,comboCap:2,
  recallDays:3,spanDays:7,levelThresholds:[0,3,10,25],
  skins:[{id:'forest',name:'Las',tiles:0,color:'#f92b98'},{id:'ocean',name:'Ocean',tiles:3,color:'#167eaf'},{id:'space',name:'Kosmos',tiles:6,color:'#7c55c7'}],
  trophies:[{id:'return',name:'Wracam i pamiętam',metric:'mastered',threshold:5},{id:'explorer',name:'Badacz słów',metric:'eligible',threshold:14},{id:'families',name:'Poznaję rodziny',metric:'families',threshold:3}],
  challenges:[{id:'small-steps',name:'Małe kroki',family:'wszystkie',target:5}]
};
const integer=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const text=(v,n=80)=>typeof v==='string'&&v.trim()&&v.length<=n&&!/[<>\u0000-\u001f]/.test(v);
export function validateDiscoveryRules(r){
  const limits={memoryEvery:[2,30],memoryAmount:[1,3],mapCost:[1,10],mapTiles:[4,25],comboEvery:[2,12],comboBonus:[0,5],comboCap:[0,10],recallDays:[2,7],spanDays:[2,30]};
  if(!r||Object.entries(limits).some(([k,[a,b]])=>!integer(r[k],a,b)))throw Error('Sprawdź zakresy zasad nauki i odkrywania.');
  if(!Array.isArray(r.levelThresholds)||r.levelThresholds.length<2||r.levelThresholds.length>8||r.levelThresholds[0]!==0||r.levelThresholds.some((v,i)=>!integer(v,0,500)||(i&&v<=r.levelThresholds[i-1])))throw Error('Progi poziomów muszą rosnąć i zaczynać się od zera.');
  for(const [key,max] of [['skins',8],['trophies',12],['challenges',12]]){
    if(!Array.isArray(r[key])||!r[key].length||r[key].length>max)throw Error('Sprawdź listę nagród i wyzwań.');
    const ids=new Set();for(const v of r[key]){if(!text(v.id)||!text(v.name)||ids.has(v.id)||!/^[-a-z0-9]+$/.test(v.id))throw Error('Nazwa i identyfikator nagrody muszą być unikalne.');ids.add(v.id);}
  }
  if(r.skins.some(s=>!integer(s.tiles,0,25)||!/^#[0-9a-f]{6}$/i.test(s.color))||r.skins[0].tiles!==0)throw Error('Pierwsza skórka jest bezpłatna. Sprawdź jej kolor i progi.');
  if(r.trophies.some(t=>!['eligible','mastered','families','returnDays'].includes(t.metric)||!integer(t.threshold,1,500)))throw Error('Sprawdź warunek zdobycia pucharu.');
  if(r.challenges.some(c=>!text(c.family)||!integer(c.target,1,100)))throw Error('Sprawdź cel wyzwania.');
  return r;
}
export function discoveryState(){return {eligible:0,memoryEarned:0,memorySpent:0,points:0,streak:0,bestStreak:0,comboBySession:{},revealed:[],skin:'forest',items:{},seen:{},applied:[],earnedTrophies:[],lastEvents:[]};}
export const dayKey=at=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(at));return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');};
const daysBetween=(a,b)=>(Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000;
export function discoverySummary(state,rules=DISCOVERY_RULES){
  const items=Object.values(state.items),mastered=items.filter(i=>i.mastered).length;
  const families=new Set(items.filter(i=>i.correctDays.length).flatMap(i=>i.families));
  const returnDays=new Set(items.flatMap(i=>i.correctDays)).size;
  const level=rules.levelThresholds.filter(n=>mastered>=n).length;
  return {eligible:state.eligible,balance:state.memoryEarned-state.memorySpent,mastered,families:families.size,returnDays,level,nextLevel:rules.levelThresholds[level]??null,remaining:rules.memoryEvery-state.eligible%rules.memoryEvery,
    learning:items.filter(i=>!i.mastered&&!i.needsReview).length,review:items.filter(i=>i.needsReview).length,
    challenges:rules.challenges.map(c=>({...c,count:items.filter(i=>i.correctDays.length&&(c.family==='wszystkie'||i.families.includes(c.family))).length})),
    skins:rules.skins.map(s=>({...s,unlocked:state.revealed.length>=s.tiles})),
    trophies:rules.trophies.map(t=>({...t,earned:state.earnedTrophies.includes(t.id)}))};
}
export function applyDiscoveryEvent(previous,event,rules=DISCOVERY_RULES){
  validateDiscoveryRules(rules);
  if(!event||!text(event.id,160)||!['answer','reveal','skin'].includes(event.type))throw Error('Nieprawidłowa akcja w labie.');
  if(previous.applied.includes(event.id))return structuredClone(previous);
  const s=structuredClone(previous);s.lastEvents=[];
  if(event.type==='answer'){
    if(!text(event.word,80)||!Number.isFinite(Date.parse(event.at))||typeof event.correct!=='boolean'||!text(event.sessionId,80))throw Error('Odpowiedź musi mieć słowo, dzień i rundę.');
    if(event.families&&(!Array.isArray(event.families)||event.families.length>8||event.families.some(v=>!text(v,30))))throw Error('Sprawdź kategorie słowa.');
    if(s.sessionId!==event.sessionId){s.streak=0;s.sessionId=event.sessionId;}
    const day=dayKey(event.at),key=event.word.normalize('NFC').toLocaleLowerCase('pl-PL'),seen=s.seen[day]||=[];
    const first=!seen.includes(key);if(first)seen.push(key);
    const i=s.items[key]||={word:key,correctDays:[],families:[],mastered:false,needsReview:false};
    i.families=[...new Set([...i.families,...(event.families||[])])].slice(0,8);
    const recall=event.correct&&!event.hintUsed&&!event.retry&&first;
    if(recall){
      s.eligible++;s.points++;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak);
      i.correctDays.push(day);i.correctDays=[...new Set(i.correctDays)].sort().slice(-32);i.needsReview=false;
      if(i.correctDays.length>=rules.recallDays&&daysBetween(i.correctDays[0],day)>=rules.spanDays)i.mastered=true;
      if(s.eligible%rules.memoryEvery===0){s.memoryEarned+=rules.memoryAmount;s.lastEvents.push({kind:'memory',text:`Zdobywasz ${rules.memoryAmount} punkt pamięci. Twoje małe kroki otwierają mapę.`});}
      const used=s.comboBySession[event.sessionId]||0;
      if(s.streak%rules.comboEvery===0&&used<rules.comboCap){const bonus=Math.min(rules.comboBonus,rules.comboCap-used);s.points+=bonus;s.comboBySession[event.sessionId]=used+bonus;if(bonus)s.lastEvents.push({kind:'combo',text:`Seria daje ${bonus} punkt wyniku. Utrwalenie nadal wymaga powrotu po czasie.`});}
    }else{s.streak=0;if(!event.correct)i.needsReview=true;s.lastEvents.push({kind:'practice',text:event.correct?'Ćwiczenie zaliczone. Podpowiedź lub powtórka dziś nie daje kolejnego punktu pamięci.':'Pomyłka pomaga wybrać kolejną powtórkę. Zdobyte odkrycia zostają.'});}
  }
  if(event.type==='reveal'){
    if(!integer(event.tile,0,rules.mapTiles-1))throw Error('Wybierz fragment mapy.');
    if(s.revealed.includes(event.tile))return s;
    if(s.memoryEarned-s.memorySpent<rules.mapCost)throw Error(`Do odkrycia potrzeba ${rules.mapCost} punkt pamięci.`);
    s.memorySpent+=rules.mapCost;s.revealed.push(event.tile);s.lastEvents.push({kind:'reveal',text:'Nowy fragment odkryty. Zobacz, co jest dalej!'});
  }
  if(event.type==='skin'){
    const skin=rules.skins.find(v=>v.id===event.skin);if(!skin||s.revealed.length<skin.tiles)throw Error('Ta skórka czeka na kolejne odkrycia.');s.skin=skin.id;
  }
  s.applied.push(event.id);if(s.applied.length>5000)throw Error('Próbka ma już 5000 zdarzeń. Zacznij nową próbę.');
  const summary=discoverySummary(s,rules);
  for(const t of rules.trophies)if(summary[t.metric]>=t.threshold&&!s.earnedTrophies.includes(t.id)){s.earnedTrophies.push(t.id);s.lastEvents.push({kind:'trophy',text:`Puchar: ${t.name}.`});}
  return s;
}
export function fixtureEvents(preset='six',seed=42,words=[]){
  let random=seed>>>0;const next=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/4294967296;};
  const fallback=['brzuch','rzeka','chmura','ogród','królik','morze','ucho','śnieg','źrebak','dzień','dźwig','cień','liść','góra','burza'];
  const source=[...new Map((words.length?words:fallback.map(word=>({word,families:['u/ó']}))).map(w=>[w.word.normalize('NFC').toLocaleLowerCase('pl'),w])).values()];
  const chosen=[...source].sort((a,b)=>a.word.localeCompare(b.word,'pl'));for(let i=chosen.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[chosen[i],chosen[j]]=[chosen[j],chosen[i]];}
  const count=Math.min(source.length,preset==='empty'?0:preset==='six'?6:preset==='seven'?7:preset==='mixed'?21:preset==='long'?40:12);
  const rounds=preset==='returns'?3:1,out=[];
  for(let d=0;d<rounds;d++)for(let i=0;i<count;i++){const row=chosen[i%chosen.length];out.push({id:`fixture-${seed}-${d}-${i}`,type:'answer',sessionId:`round-${d}`,word:row.word,at:new Date(Date.UTC(2026,9,5+d*4,10,i)).toISOString(),correct:preset==='mixed'?i%5!==2:true,hintUsed:preset==='mixed'&&i%7===3,families:row.families||row.categories||[row.category||'u/ó']});}
  return out;
}
export function replayDiscovery(events,rules=DISCOVERY_RULES){return events.reduce((s,e)=>applyDiscoveryEvent(s,e,rules),discoveryState());}
