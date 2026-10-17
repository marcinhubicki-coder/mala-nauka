import test from 'node:test';
import assert from 'node:assert/strict';
import {PROGRESSION_RULES as rules,cleanJourney,discoverWord,answerReward,reservePower,forgePower,chooseTrophy,starLevel,sparkBalance,balanceBenchmark} from '../shared/progression.mjs';
import {addLearningSession,cleanLearning,targetId} from '../shared/mastery.mjs';
import {cleanProgress,recordResult,localDay} from '../progress.mjs';
const attempt=(correct=true,extra={})=>({kind:'spelling',word:'róża',masked:'r_ża',answer:'ó',category:'u/ó',correct,at:'2026-10-01T12:00:00Z',...extra});
test('discovery is independent of correctness, stars are cumulative 5/15/30 and answer receipts prevent replays',()=>{
 let j=discoverWord(null,'róża').journey;
 j=answerReward(j,attempt(false),{id:'round:1'}).journey;
 assert.ok(j.cards.róża);assert.equal(j.cards.róża.correct,0);
 for(let i=0;i<30;i++)j=answerReward(j,attempt(true,{hintUsed:true}),{id:'star:'+i}).journey;
 assert.deepEqual([4,5,14,15,29,30].map(n=>starLevel(n)),[0,1,1,2,2,3]);
 assert.equal(starLevel(j.cards.róża.correct),3);
 assert.deepEqual(answerReward(j,attempt(),{id:'star:29'}).journey,j);
});
test('hints freeze combo; errors reset it; a reserved guard protects combo without changing the error',()=>{
 let j=cleanJourney(null);let r=answerReward(j,attempt(),{id:'a',streak:5});assert.equal(r.multiplier,1.5);
 r=answerReward(r.journey,attempt(true,{hintUsed:true}),{id:'b',streak:r.streak});assert.equal(r.streak,6);
 r.journey.pending='shield';r.journey.powers=['shield'];r=answerReward(r.journey,attempt(false),{id:'c',streak:6});assert.equal(r.streak,6);assert.equal(r.journey.cards.róża,undefined);assert.ok(r.sparks>0);
 r=answerReward(r.journey,attempt(false),{id:'d',streak:6});assert.equal(r.streak,0);
});
test('forge spends once, first craft charges once, reserved power survives reload and powers cannot charge themselves',()=>{
 let j=cleanJourney(null);j.totals.spelling=10;j.sparks=100e6;
 j=forgePower(j,'spark');assert.equal(sparkBalance(j),60);assert.equal(j.meter,100);assert.deepEqual(forgePower(j,'spark'),j);
 j=reservePower(j,rules,()=>0);assert.equal(j.pending,'spark');assert.equal(j.meter,0);assert.deepEqual(reservePower(cleanJourney(j),rules,()=>.99),j);
 const r=answerReward(j,attempt(),{id:'power:1'});assert.equal(r.journey.pending,null);assert.equal(r.journey.meter,10);assert.equal(r.sparks,2.2);
});
test('trophy base cannot be changed and each stage is an append-only earned choice',()=>{
 let j=cleanJourney(null);j.achievements['mastery-5']='2026-10-01';j=chooseTrophy(j,'mastery-5',{family:2});
 assert.throws(()=>chooseTrophy(j,'mastery-5',{family:1}));assert.throws(()=>chooseTrophy(j,'mastery-5',{choice:'a'},0));
 j=chooseTrophy(j,'mastery-5',{choice:'a'},1);j=chooseTrophy(j,'mastery-5',{choice:'b'},2);assert.deepEqual(j.trophies['mastery-5'],{family:2,path:'ab'});
});
test('retention requires every target in different days; earned mastery and legacy achievements survive later errors',()=>{
 const a=attempt(),b=attempt(true,{masked:'ró_a',answer:'ż',category:'rz/ż'}),targetIds=[a,b].map(targetId);let ledger;
 const add=(row,date,id)=>ledger=addLearningSession(ledger,{mode:'spelling',id,date,attempts:[{...row,at:date,targetIds}]});
 for(const [i,d]of ['01','04','08'].entries())add(a,'2026-10-'+d+'T12:00:00Z','a'+i);
 assert.equal(ledger.items['word:róża'].masteryEarned,false);
 for(const [i,d]of ['01','04','08'].entries())add(b,'2026-10-'+d+'T12:00:00Z','b'+i);
 assert.equal(ledger.items['word:róża'].masteryEarned,true);add({...b,correct:false},'2026-10-09T12:00:00Z','error');
 assert.equal(ledger.items['word:róża'].state,'mastered');assert.equal(ledger.items['word:róża'].needsReview,true);
 const legacy=cleanLearning({version:1,items:{'word:róża':{word:'róża',lastSeenAt:a.at,masteryEarned:true,state:'review'}}});assert.ok(legacy.items['word:róża'].legacyMastery);assert.equal(legacy.items['word:róża'].state,'mastered');
});
test('same-day repetitions and hints never grant retention, and replaying a round never doubles currency or history',()=>{
 let ledger;for(let i=0;i<30;i++)ledger=addLearningSession(ledger,{mode:'spelling',id:'day'+i,date:attempt().at,attempts:[attempt()]});assert.equal(ledger.items['word:róża'].masteryEarned,false);
 const p=cleanProgress(null),r={id:'one',mode:'spelling',duration:60,correct:1,wrong:0,date:attempt().at,attempts:[attempt()]};recordResult(p,r);const before=structuredClone(p);recordResult(p,r);assert.deepEqual(p,before);
});
test('normalization keeps reference modes within 15% and preserves fractional rewards across short sessions',()=>{
 const rows=balanceBenchmark();const median=rows.map(r=>r.sparksPerMinute).sort((a,b)=>a-b)[2];for(const r of rows)assert.ok(Math.abs(r.sparksPerMinute/median-1)<.15,JSON.stringify(r));
 let j=cleanJourney(null);for(let i=0;i<3;i++)j=answerReward(j,attempt(),{id:'fraction'+i,mode:'math'}).journey;assert.equal(sparkBalance(j),2);
});
test('today includes interrupted answers and settling their round never counts them twice',()=>{
 const at=new Date().toISOString(),p=cleanProgress({today:{day:localDay(new Date(at)),count:4}}),a=attempt(true,{at});
 p.journey=answerReward(p.journey,a,{id:'interrupted:1'}).journey;
 const reloaded=cleanProgress(p);assert.equal(reloaded.today.count,5);
 recordResult(reloaded,{id:'interrupted',mode:'spelling',date:at,duration:60,correct:1,wrong:0,attempts:[a]});assert.equal(reloaded.today.count,5);
});
