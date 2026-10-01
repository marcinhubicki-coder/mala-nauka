import test from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../game.mjs';
import { cleanConfig } from '../modes.mjs';
import { cleanProgress, recordResult } from '../progress.mjs';
import { configureSpellingRound, spellingRoundLabel, WORD_LIMITS } from '../spelling/round.mjs';

const pool=[{kind:'spelling',word:'kot',masked:'k_t',answer:'o',options:['o','ó']},{kind:'spelling',word:'dom',masked:'d_m',answer:'o',options:['o','ó']}];
test('count rounds have no clock and end after exactly the selected number of answers',()=>{
 for(const wordLimit of WORD_LIMITS){
  let now=0;
  const config=cleanConfig('spelling',{limitMode:'count',wordLimit,duration:60});
  const game=configureSpellingRound(new Session(pool,60,()=>now),config,pool);
  now=90_000;game.tick();assert.equal(game.state,'playing');assert.equal(game.remaining,60_000);
  for(let i=0;i<wordLimit;i++){
   assert.equal(game.questionsRemaining(),wordLimit-i);
   assert.equal(game.answer(i%2?game.current.answer:'ó'),true);
   assert.equal(game.questionsRemaining(),wordLimit-i-1);
   game.skipFeedback();
  }
  assert.equal(game.state,'ended');assert.equal(game.question,wordLimit);
  assert.equal(game.correct+game.wrong,wordLimit);assert.equal(game.questionsRemaining(),0);
 }
});
test('time rounds still expire and dictation keeps its source limit',()=>{
 let now=0;const game=configureSpellingRound(new Session(pool,60,()=>now),{limitMode:'time'},pool);
 now=60_000;game.tick();assert.equal(game.state,'ended');assert.equal(game.questionLimit,0);
 const dictation=configureSpellingRound(new Session(pool,180),{dyktando:true,limitMode:'count',wordLimit:80},pool);
 assert.equal(dictation.questionLimit,2);assert.equal(dictation.untimed,true);
});
test('count results survive storage and never overwrite timed records',()=>{
 const progress=cleanProgress(null),result={...cleanConfig('spelling',{limitMode:'count',wordLimit:40}),mode:'spelling',date:new Date().toISOString(),correct:30,wrong:10};
 assert.equal(recordResult(progress,result),false);assert.deepEqual(progress.best,{});
 const restored=cleanProgress(JSON.parse(JSON.stringify(progress))).history[0];
 assert.equal(restored.wordLimit,40);assert.equal(restored.limitMode,'count');assert.equal(spellingRoundLabel(restored),'40 słów');
 assert.equal(cleanConfig('spelling',{}).limitMode,'time');
 assert.equal(cleanConfig('spelling',{limitMode:'bad',wordLimit:-1}).wordLimit,20);
});
