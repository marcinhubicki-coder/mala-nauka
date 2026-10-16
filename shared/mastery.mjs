import {PROGRESSION_RULES} from './progression.mjs';
export const MASTERY_RULES=PROGRESSION_RULES.mastery;
const DAY=86400000;
const dayNumber=at=>{const d=new Date(at);return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/DAY;};
const localDay=at=>{const d=new Date(at);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;};
export const targetId=attempt=>`${attempt.category}:${attempt.masked}:${attempt.answer}`;
export function cleanLearning(value){
 const items={};
 for(const [key,item]of Object.entries(value?.items||{})){
  if(!key.startsWith('word:')||!item||typeof item.word!=='string'||!Number.isFinite(Date.parse(item.lastSeenAt)))continue;
  const earned=item.masteryEarned===true||value?.version!==2&&item.state==='mastered';
  items[key]={...item,correctDays:Array.isArray(item.correctDays)?item.correctDays.filter(d=>typeof d==='string').slice(-32):[],targets:item.targets&&typeof item.targets==='object'?structuredClone(item.targets):{},requiredTargets:Array.isArray(item.requiredTargets)?item.requiredTargets:[],
   // Legacy achievements survive without manufacturing retention evidence.
   legacyMastery:item.legacyMastery===true||(value?.version!==2&&earned),masteryEarned:earned,
   needsReview:item.needsReview===true||item.state==='review',state:earned?'mastered':['learning','consolidating','review'].includes(item.state)?item.state:'learning'};
 }
 return {version:2,items,appliedAttempts:{...(value?.appliedAttempts||{})},appliedSessions:Array.isArray(value?.appliedSessions)?value.appliedSessions.filter(id=>typeof id==='string'):[]};
}
export function addLearningSession(value,result,rules=MASTERY_RULES){
 const ledger=cleanLearning(value);
 if(result.mode!=='spelling'||!Array.isArray(result.attempts))return ledger;
 const sessionId=result.id||`${result.mode}:${result.date}:${result.correct}:${result.wrong}`;
 if(!result.incremental&&ledger.appliedSessions.includes(sessionId))return ledger;
 for(const [index,attempt]of result.attempts.entries()){
  if(attempt.kind!=='spelling'||typeof attempt.word!=='string'||typeof attempt.correct!=='boolean')continue;
  const at=Number.isFinite(Date.parse(attempt.at))?attempt.at:result.date;if(!Number.isFinite(Date.parse(at)))continue;
  const eventId=attempt.eventId||sessionId+':'+(index+1),receipt=/^(.*):([1-9][0-9]*)$/.exec(eventId);
  if(receipt&&(ledger.appliedAttempts[receipt[1]]||0)>=Number(receipt[2]))continue;
  if(receipt)ledger.appliedAttempts[receipt[1]]=Number(receipt[2]);
  const itemId='word:'+attempt.word,previous=ledger.items[itemId];
  const item={...(previous||{}),itemId,word:attempt.word,masked:attempt.masked,answer:attempt.answer,category:attempt.category,
   firstSeenAt:previous?.firstSeenAt||at,lastSeenAt:at,attempts:(previous?.attempts||0)+1,correct:(previous?.correct||0)+(attempt.correct?1:0),incorrect:(previous?.incorrect||0)+(attempt.correct?0:1),
   correctDays:[...(previous?.correctDays||[])],targets:{...(previous?.targets||{})},requiredTargets:[...new Set([...(previous?.requiredTargets||[]),...(attempt.targetIds||[targetId(attempt)])])],
   masteryEarned:previous?.masteryEarned===true,needsReview:!attempt.correct||((attempt.hintUsed||attempt.explanationUsed)&&previous?.needsReview===true),state:previous?.state||'learning'};
  const id=targetId(attempt),target={correctDays:[],...item.targets[id]};
  const recalled=attempt.correct&&!attempt.hintUsed&&!attempt.explanationUsed;
  if(recalled){
   const day=localDay(at);if(!target.correctDays.includes(day))target.correctDays.push(day);target.firstRecallAt||=at;
   target.masteryEarned||=target.correctDays.length>=rules.recallDays&&dayNumber(at)-dayNumber(target.firstRecallAt)>=rules.spanDays;
   target.lastCorrectAt=at;target.nextReviewAt=new Date(Date.parse(at)+(target.masteryEarned?7:target.correctDays.length>=rules.consolidateDays?3:1)*DAY).toISOString();
   if(!item.correctDays.includes(day))item.correctDays.push(day);item.firstRecallAt||=at;item.lastCorrectAt=at;
  }
  target.correctDays=target.correctDays.slice(-32);target.lastSeenAt=at;if(!attempt.correct)target.nextReviewAt=new Date(Date.parse(at)+DAY).toISOString();item.targets[id]=target;
  item.masteryEarned||=item.requiredTargets.length>0&&item.requiredTargets.every(key=>item.targets[key]?.masteryEarned);
  item.state=item.masteryEarned?'mastered':item.needsReview?'review':item.correctDays.length>=rules.consolidateDays?'consolidating':'learning';
  item.nextReviewAt=Object.values(item.targets).map(t=>t.nextReviewAt).filter(Boolean).sort()[0]||new Date(Date.parse(at)+DAY).toISOString();
  ledger.items[itemId]=item;
 }
 if(!result.incremental)ledger.appliedSessions.push(sessionId);return ledger;
}
export function learningSummary(learning){
 const items=Object.values(cleanLearning(learning).items);
 return {items,mastered:items.filter(i=>i.masteryEarned).length,learning:items.filter(i=>!i.masteryEarned&&!i.needsReview).length,review:items.filter(i=>i.needsReview).length};
}
export function practicePriority(item,now=Date.now()){
 if(!item)return 3;if(item.needsReview||item.state==='review')return 7;
 if(!item.masteryEarned)return 5;
 return Date.parse(item.nextReviewAt||'')<=now?2:(item.correct||0)<30?1.5:.35;
}
