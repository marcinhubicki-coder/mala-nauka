import {cleanProgress} from '../progress.mjs';
import {cleanJourney,POWERS,visibleAchievementIds,answerReward,discoverWord} from './progression.mjs';
import {wordSlots,practiceCategories} from '../spelling/word-pools.mjs';
import {targetId} from './mastery.mjs';
// Only the Test PWA build can opt in. No query string or saved Studio preference
// is sufficient to enable this database in an ordinary production build.
export const testProfilesEnabled=()=>globalThis.__MN_TEST_PROFILES__===true;
export function exampleJourney(words,fraction){
 const progress=cleanProgress(null);if(!fraction)return progress;
 const selected=words.slice(0,Math.round(words.length*fraction)),stamp='2026-09-15T12:00:00.000Z';
 progress.journey=cleanJourney(null);progress.journey.tutorialDone=true;progress.journey.sparks=(fraction<.5?220:1800)*1e6;progress.journey.lifetimeSparks=(fraction<.5?450:9000)*1e6;
 progress.journey.powers=fraction<.5?['spark','shield']:POWERS.map(p=>p.id);progress.journey.meter=65;
 progress.journey.totals={spelling:fraction<.5?180:15000,math:160,reading:100,english:100,flags:150};
 for(const [index,word]of selected.entries()){
  const mastered=fraction<.5?index<8:index<selected.length*.95,correct=fraction<.5?(mastered?16:1+index%20):30;
  progress.journey.cards[word.word]={firstSeenAt:stamp,correct};
  const slots=wordSlots(word).filter(s=>practiceCategories(word).includes(s.category));
  progress.learning.items['word:'+word.word]={word:word.word,masked:word.masked,answer:word.answer,category:word.category,firstSeenAt:stamp,lastSeenAt:stamp,attempts:correct+2,correct,incorrect:2,correctDays:mastered?['2026-9-1','2026-9-8','2026-9-15']:['2026-9-15'],masteryEarned:mastered,state:mastered?'mastered':index%4===0?'review':'learning',needsReview:index%4===0,nextReviewAt:'2026-09-22T12:00:00.000Z',requiredTargets:slots.map(targetId),targets:Object.fromEntries(slots.map(slot=>[targetId(slot),{correctDays:mastered?['2026-9-1','2026-9-8','2026-9-15']:['2026-9-15'],firstRecallAt:'2026-09-01T12:00:00Z',lastSeenAt:stamp,masteryEarned:mastered}]))};
 }
 progress.journey.achievements={'mastery-5':stamp};
 if(fraction>.5)for(const n of [25,50,100,250])progress.journey.achievements['mastery-'+n]=stamp;
 if(fraction>.5)for(const id of visibleAchievementIds(words))if(!id.startsWith('discover-')&&!id.startsWith('mastery-'))progress.journey.achievements[id]=stamp;
 progress.journey.trophies['mastery-5']={family:2,path:fraction>.5?'a':''};
 return progress;
}
export async function seedTestProfiles(service,words){
 if(!testProfilesEnabled())return false;
 await service.init();if(await service.getMeta('demoProfilesV1'))return false;
 // Never replace profiles, including previous test runs edited by the tester.
 if((await service.listPlayers()).length)return false;
 for(const [nickname,avatarId,fraction]of [['Nowy','a',0],['Odkrywca','e',.25],['Mistrz','h',.9]]){
  const player=await service.createPlayer({nickname,avatarId,pinEnabled:false});await service.saveProgress(player.id,exampleJourney(words,fraction));
 }
 await service.setMeta('demoProfilesV1',true);return true;
}

export function exampleRewardSummary(attempts,mode='spelling'){
 let journey=cleanJourney(null),streak=0;const summary={sparks:0,discovered:[],stars:[],powers:[]};
 for(const [index,a]of attempts.entries()){
  if(mode==='spelling'){const found=discoverWord(journey,a.word,a.at||'2026-09-15T12:00:00Z');journey=found.journey;if(found.discovered)summary.discovered.push(a.word);}
  const reward=answerReward(journey,a,{id:'fixture:'+index,mode,streak});journey=reward.journey;streak=reward.streak;summary.sparks+=reward.sparks;
 }
 return summary;
}
