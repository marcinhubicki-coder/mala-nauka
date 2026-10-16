import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {exampleJourney,seedTestProfiles} from '../shared/test-profiles.mjs';
import {addLearningSession} from '../shared/mastery.mjs';
import {recordResult,cleanProgress} from '../progress.mjs';
import {simulateProgression} from '../design-system/scoring-progression.mjs';
import {POWERS,answerReward,cleanJourney,PROGRESSION_RULES} from '../shared/progression.mjs';
const words=Array.from({length:8},(_,i)=>JSON.parse(readFileSync(new URL(`../data/words-0${i+1}.json`,import.meta.url)))).flat();
test('three fixtures use published word identities, begin before tutorial and approximate 25/90 percent without fabricating all mastery',()=>{
 const start=exampleJourney(words,0),mid=exampleJourney(words,.25),advanced=exampleJourney(words,.9);
 assert.equal(Object.keys(start.journey.cards).length,0);assert.equal(start.journey.tutorialDone,false);
 assert.ok(Math.abs(Object.keys(mid.journey.cards).length/words.length-.25)<.01);assert.equal(mid.journey.powers.length,2);
 assert.equal(Object.values(mid.learning.items).filter(w=>w.masteryEarned).length,8);
 assert.ok(Math.abs(Object.keys(advanced.journey.cards).length/words.length-.9)<.01);
 assert.equal(advanced.journey.achievements['mastery-500'],undefined);assert.ok(advanced.journey.trophies['mastery-5'].path.length<=2);
});
test('fixture seeding is disabled in ordinary PWA and never touches an existing store',async()=>{
 let calls=0;const service={init:async()=>calls++,getMeta:async()=>false,listPlayers:async()=>[{id:'existing'}]};
 delete globalThis.__MN_TEST_PROFILES__;assert.equal(await seedTestProfiles(service,words),false);assert.equal(calls,0);
 globalThis.__MN_TEST_PROFILES__=true;assert.equal(await seedTestProfiles(service,words),false);assert.equal(calls,1);delete globalThis.__MN_TEST_PROFILES__;
});
test('answer-level retention survives interruption and round settlement cannot replay it',()=>{
 const w=words[0],a={...w,kind:'spelling',at:'2026-10-16T12:00:00Z',correct:true,eventId:'round:1'};
 const p=cleanProgress(null);p.learning=addLearningSession(p.learning,{mode:'spelling',id:'round',incremental:true,date:a.at,attempts:[a]});
 recordResult(p,{mode:'spelling',id:'round',date:a.at,duration:60,correct:1,wrong:0,attempts:[a]});assert.equal(p.learning.items['word:'+w.word].attempts,1);
});
test('Studio and runtime produce the same sparks, combo and power charging for every mode',()=>{
 const attempts=[{correct:true},{correct:true},{correct:true,hintUsed:true},{correct:false},{correct:true}];
 for(const mode of ['spelling','math','english','flags','reading'])for(const power of [null,...POWERS.map(p=>p.id)]){
  const preview=simulateProgression(attempts,{mode,power});let journey=cleanJourney(null),streak=0,total=0;
  if(power){journey.powers=[power];journey.pending=power;}
  for(const [index,a]of attempts.entries()){const r=answerReward(journey,{...a,at:'2026-01-01T12:00:00Z'},{mode,id:'live:'+index,streak});journey=r.journey;streak=r.streak;total+=r.sparks;}
  assert.equal(preview.total,total,mode+'/'+power);
 }
});
