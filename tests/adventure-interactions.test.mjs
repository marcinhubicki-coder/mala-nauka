import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dragFraction, completedDrag } from '../spelling/continue-drag.mjs';
import { dictationPacks, dictationSource } from '../spelling/dictation.mjs';
import { addLearningSession, learningSummary } from '../shared/mastery.mjs';
import { cleanProgress, recordResult } from '../progress.mjs';

test('a tap, partial drag, backward drag and zero-width rail never complete',()=>{
  assert.equal(completedDrag(dragFraction(100,100,240),0),false);
  assert.equal(completedDrag(dragFraction(100,230,240),130),false);
  assert.equal(completedDrag(dragFraction(100,30,240),-70),false);
  assert.equal(completedDrag(dragFraction(100,400,0),300),false);
  assert.equal(completedDrag(dragFraction(100,338,240),238),true);
});

test('dictation pills derive from real tags and select exactly one pack',async()=>{
  const shards=await Promise.all(Array.from({length:8},(_,i)=>readFile(new URL(`../data/words-0${i+1}.json`,import.meta.url),'utf8').then(JSON.parse)));
  const words=shards.flat();
  assert.deepEqual(dictationPacks(words),[{tag:'dyktando',label:'Dyktando',count:80}]);
  const tagged=[{word:'król',tags:['dyktando','dyktando:zamki']},{word:'burza',tags:['dyktando','dyktando:pogoda']},{word:'kot',tags:[]}];
  assert.deepEqual(dictationSource(tagged,'dyktando:zamki').map(w=>w.word),['król']);
  assert.deepEqual(dictationSource(tagged,'dyktando:pogoda').map(w=>w.word),['burza']);
});

const attempt=(correct=true,hintUsed=false)=>({kind:'spelling',word:'burza',masked:'bu_a',answer:'rz',category:'rz/ż',correct,hintUsed});
const round=(id,date,attempts)=>({id,date,attempts,mode:'spelling',duration:180,correct:attempts.filter(a=>a.correct).length,wrong:attempts.filter(a=>!a.correct).length});
test('mastery requires unassisted recall across days; one round cannot earn it',()=>{
  const first=round('a','2026-09-01T12:00:00Z',Array.from({length:8},()=>attempt()));
  let learning=addLearningSession(null,first);
  assert.equal(learningSummary(learning).mastered,0);
  const duplicate=addLearningSession(learning,first);
  assert.equal(duplicate.items['word:burza'].attempts,8);
  learning=addLearningSession(learning,round('b','2026-09-03T12:00:00Z',[attempt()]));
  assert.equal(learning.items['word:burza'].state,'consolidating');
  learning=addLearningSession(learning,round('hint','2026-09-08T12:00:00Z',[attempt(true,true)]));
  assert.equal(learningSummary(learning).mastered,0);
  learning=addLearningSession(learning,round('c','2026-09-09T12:00:00Z',[attempt()]));
  assert.equal(learningSummary(learning).mastered,1);
  learning=addLearningSession(learning,round('d','2026-09-10T12:00:00Z',[attempt(false)]));
  assert.equal(learning.items['word:burza'].state,'review');
  assert.equal(learning.items['word:burza'].masteryEarned,true);
});

test('migration derives learning from legacy attempts and durable knowledge survives the 50-round history window',()=>{
  const sessions=[round('a','2026-09-01T12:00:00Z',[attempt()]),round('b','2026-09-03T12:00:00Z',[attempt()]),round('c','2026-09-09T12:00:00Z',[attempt()])];
  const progress=cleanProgress({history:[...sessions].reverse()});
  assert.equal(learningSummary(progress.learning).mastered,1);
  for(let i=0;i<55;i++)recordResult(progress,{id:'other'+i,mode:'math',date:'2026-09-11T12:00:00Z',duration:180,correct:1,wrong:0});
  const restored=cleanProgress(JSON.parse(JSON.stringify(progress)));
  assert.equal(restored.history.length,50);
  assert.equal(learningSummary(restored.learning).mastered,1);
});
