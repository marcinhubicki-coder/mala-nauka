// Presentation consumes states, not thresholds. Retention is measured across
// days; repeated answers in a single round cannot grant mastery.
export const MASTERY_RULES = Object.freeze({ recallDays: 3, spanDays: 7, consolidateDays: 2 });
const DAY = 86400000;
const dayNumber = at => Math.floor(Date.parse(at) / DAY);
const localDay = at => {const d=new Date(at);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;};

export function cleanLearning(value) {
  const items={};
  for(const [key,item] of Object.entries(value?.items||{})) {
    if(!key.startsWith('word:')||!item||typeof item.word!=='string'||!Number.isFinite(Date.parse(item.lastSeenAt)))continue;
    items[key]={...item,correctDays:Array.isArray(item.correctDays)?item.correctDays.filter(d=>typeof d==='string').slice(-32):[],
      state:['learning','consolidating','mastered','review'].includes(item.state)?item.state:'learning'};
  }
  return {version:1,items,appliedSessions:Array.isArray(value?.appliedSessions)?value.appliedSessions.filter(id=>typeof id==='string').slice(-256):[]};
}

export function addLearningSession(value, result, rules=MASTERY_RULES) {
  const ledger=cleanLearning(value);
  if(result.mode!=='spelling'||!Array.isArray(result.attempts))return ledger;
  const sessionId=result.id||`${result.mode}:${result.date}:${result.correct}:${result.wrong}`;
  if(ledger.appliedSessions.includes(sessionId))return ledger;
  for(const attempt of result.attempts) {
    if(attempt.kind!=='spelling'||typeof attempt.word!=='string'||typeof attempt.correct!=='boolean')continue;
    const at=Number.isFinite(Date.parse(attempt.at))?attempt.at:result.date;
    if(!Number.isFinite(Date.parse(at)))continue;
    const itemId='word:'+attempt.word;
    const previous=ledger.items[itemId];
    const item={...(previous||{}),itemId,word:attempt.word,masked:attempt.masked,answer:attempt.answer,
      category:attempt.category,firstSeenAt:previous?.firstSeenAt||at,lastSeenAt:at,
      attempts:(previous?.attempts||0)+1,correct:(previous?.correct||0)+(attempt.correct?1:0),
      incorrect:(previous?.incorrect||0)+(attempt.correct?0:1),correctDays:[...(previous?.correctDays||[])],
      masteryEarned:previous?.masteryEarned===true,state:previous?.state||'learning'};
    if(attempt.correct) {
      item.lastCorrectAt=at;
      if(!attempt.hintUsed&&!attempt.explanationUsed) {
        const day=localDay(at);
        if(!item.correctDays.includes(day))item.correctDays.push(day);
        item.firstRecallAt ||= at;
        item.masteryEarned ||= item.correctDays.length>=rules.recallDays&&dayNumber(at)-dayNumber(item.firstRecallAt)>=rules.spanDays;
      }
      item.state=item.masteryEarned?'mastered':item.correctDays.length>=rules.consolidateDays?'consolidating':'learning';
    } else item.state='review';
    item.correctDays=item.correctDays.slice(-32);
    const wait=item.state==='mastered'?7:item.state==='consolidating'?3:1;
    item.nextReviewAt=new Date(Date.parse(at)+wait*DAY).toISOString();
    ledger.items[itemId]=item;
  }
  ledger.appliedSessions.push(sessionId);ledger.appliedSessions=ledger.appliedSessions.slice(-256);
  return ledger;
}

export function learningSummary(learning) {
  const items=Object.values(cleanLearning(learning).items);
  return {items,mastered:items.filter(i=>i.state==='mastered').length,
    learning:items.filter(i=>i.state==='learning'||i.state==='consolidating').length,
    review:items.filter(i=>i.state==='review').length};
}
