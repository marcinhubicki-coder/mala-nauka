import {advanceCampaign,trackAdventure} from './shared/adventure-model.mjs';
import {awardRuleProgress,collectibleRules} from './shared/rule-progress.mjs';
import {cleanJourney,discoverWord,answerReward,awardAchievements,progressionRules} from './shared/progression.mjs';
import {DEFAULT_SCORING,scoreAttempts} from './spelling/scoring.mjs';
import { cleanLearning, addLearningSession } from './shared/mastery.mjs?v=2';
import { DURATIONS, validResult } from './game.mjs?v=20261001-adventure';
import { modeIds, cleanConfig } from './modes.mjs?v=32-dictation-packs';
export const localDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const count = n => Number.isSafeInteger(n) && n >= 0;
export function cleanProgress(value) {
 const history=Array.isArray(value?.history)?value.history.filter(r=>r && modeIds.includes(r.mode)&&DURATIONS.includes(r.duration)&&count(r.correct)&&count(r.wrong)&&typeof r.date==='string'&&Number.isFinite(Date.parse(r.date))).slice(0,50).map(r=>({...r,...cleanConfig(r.mode,{...r,limitMode:r.limitMode||'time'})})):[];
 const best={};
 for(const mode of modeIds) for(const duration of DURATIONS) {
  const key=`${mode}:${duration}`,n=value?.best?.[key];if(count(n))best[key]=n;
 }
 const today=value?.today;
 const learning=value?.learning?cleanLearning(value.learning):[...history].reverse().reduce((ledger,result)=>addLearningSession(ledger,result),null);
 const journey=cleanJourney(value?.journey);if(!value?.journey?.adventure){if(Object.keys(journey.trophies).some(id=>id.startsWith('mastery-')))journey.adventure.claims['knowledge-spelling']={level:1,choices:[]};for(const result of [...history].reverse())for(const attempt of result.attempts||[])journey.adventure=trackAdventure(journey.adventure,result.mode,attempt);}if(!value?.journey&&Object.keys(learning?.items||{}).length)journey.tutorialDone=true;
 if(today&&/^\d{4}-\d{2}-\d{2}$/.test(today.day)&&count(today.count))journey.activeDays[today.day]=Math.max(journey.activeDays[today.day]||0,today.count);
 for(const item of Object.values(learning?.items||{}))if(!journey.cards[item.word])journey.cards[item.word]={firstSeenAt:item.firstSeenAt||item.lastSeenAt,correct:item.correct||0};
 const currentDay=localDay();const dailyCount=journey.activeDays[currentDay];
 return {history,best,learning:cleanLearning(learning),journey,today:dailyCount?{day:currentDay,count:dailyCount}:today&&/^\d{4}-\d{2}-\d{2}$/.test(today.day)&&count(today.count)?{day:today.day,count:journey.activeDays[today.day]||0}:{day:localDay(),count:0}};
}
export function migrateProgress(history,best) {
 const migrated=cleanProgress({history:Array.isArray(history)?history.filter(validResult).map(r=>({...r,mode:'spelling',difficulty:0})):[]});
 for(const duration of DURATIONS) {
  const values=Object.entries(best && typeof best==='object'?best:{}).filter(([key,value])=>key.endsWith(`:${duration}`)&&count(value)).map(([,value])=>value);
  if(values.length)migrated.best[`spelling:${duration}`]=Math.max(...values);
 }
 migrated.today.count=migrated.history.filter(r=>localDay(new Date(r.date))===migrated.today.day).reduce((sum,r)=>sum+r.correct+r.wrong,0);
 return migrated;
}
export function recordResult(progress,result,words=[]) {
 if(progress.history.some(r=>r.id&&r.id===result.id))return false;
 const rules=result.progressionRules||progressionRules();result.progressionRules=structuredClone(rules);
 const previousAchievements=new Set(Object.keys(progress.journey?.achievements||{})),previousMastered=new Set(Object.values(progress.learning?.items||{}).filter(w=>w.masteryEarned).map(w=>w.word));
 let journey=cleanJourney(progress.journey),streak=0;
 for(const [index,attempt]of (result.attempts||[]).entries()){
  if(result.mode==='spelling')journey=discoverWord(journey,attempt.word,attempt.at||result.date).journey;
  const reward=answerReward(journey,attempt,{mode:result.mode,id:(result.id||result.date)+':'+(index+1),streak,rules});journey=reward.journey;streak=reward.streak;
 }
 if(result.mode==='spelling'&&!result.early&&result.correct+result.wrong>=10)journey.tutorialDone=true;
 progress.journey=journey;
 if(result.mode==='spelling'&&!result.scoring){result.scoring=structuredClone(globalThis.__MALA_NAUKA_DESIGN__?.scoring||DEFAULT_SCORING);result.score=Array.isArray(result.attempts)?scoreAttempts(result.attempts,result.scoring).total:result.correct;
  if(!Array.isArray(result.attempts))delete result.scoring;}
 const key=`${result.mode}:${result.duration}`,timed=!result.dyktando&&result.limitMode!=='count',record=timed&&result.correct>(progress.best[key]??0);
 if(timed)progress.best[key]=Math.max(progress.best[key]??0,result.correct);
 progress.learning=addLearningSession(progress.learning,result,rules.mastery);
 progress.journey=awardRuleProgress(awardAchievements(progress.journey,progress.learning,words,result,rules),words,rules);
 if(result.rewards){result.rewards.mastered=[...new Set([...(result.rewards.mastered||[]),...Object.values(progress.learning.items).filter(w=>w.masteryEarned&&!previousMastered.has(w.word)).map(w=>w.word)])];result.rewards.achievements=[...new Set([...(result.rewards.achievements||[]),...Object.keys(progress.journey.achievements).filter(id=>!previousAchievements.has(id))])];const seen=new Set((result.attempts||[]).map(a=>a.word));result.rewards.rules=collectibleRules(words,progress.journey).filter(r=>r.words.some(w=>seen.has(w.word))).map(r=>({id:r.id,title:r.title,collected:progress.journey.rules[r.id]?.collected===true,discovered:r.discovered,threshold:r.threshold}));}
 const campaign=advanceCampaign(progress,result,words);if(campaign.world)result.campaignWorld=campaign.world.id;result.campaignCompleted=campaign.complete===true;if(campaign.rating){result.campaignStars=campaign.rating.stars;result.campaignPercent=campaign.rating.percent;}
 progress.history=[result,...progress.history].slice(0,50);
 const day=localDay(new Date(result.date));
 progress.today={day,count:result.attempts?.length?progress.journey.activeDays[day]||0:(progress.today.day===day?progress.today.count:0)+result.correct+result.wrong};
 return record;
}
