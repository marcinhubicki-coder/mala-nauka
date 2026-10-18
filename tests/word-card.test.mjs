import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wordCardProgress,markedWord,wordRules,wordBadgeMarkup} from '../shared/word-card.mjs';
import {canonicalWords,spellingPool} from '../spelling/word-pools.mjs';
import {configureRules} from '../shared/rules-library.mjs';
import {addLearningSession,targetId} from '../shared/mastery.mjs';
import {WORD_BADGE_ASSETS} from '../shared/word-badge-assets.mjs';
const words=canonicalWords(Array.from({length:8},(_,i)=>JSON.parse(readFileSync(new URL('../data/words-0'+(i+1)+'.json',import.meta.url)))).flat());
configureRules(JSON.parse(readFileSync(new URL('../design-system/rules.json',import.meta.url))));
const turtle=words.find(w=>w.word==='żółw');
test('one card highlights every approved target and exposes every rule family',()=>{
 assert.ok(turtle);assert.equal(words.filter(w=>w.word==='żółw').length,1);
 const html=markedWord(turtle);assert.equal((html.match(/<mark /g)||[]).length,2);assert.equal(html.replace(/<[^>]+>/g,''),'żółw');
 assert.ok(html.includes('>ż</mark>'));assert.ok(html.includes('>ó</mark>'));
 assert.deepEqual(new Set(wordRules(turtle).map(r=>r.category)),new Set(['u/ó','rz/ż']));
});
test('word stars stay cumulative 5/15/30 regardless of target count; projection never changes saved data',()=>{
 for(const [correct,level,total] of [[0,0,5],[4,0,5],[5,1,15],[15,2,30],[30,3,30],[100,3,30]]){
  const journey={cards:{żółw:{correct}}},before=structuredClone(journey),p=wordCardProgress(turtle,journey);
  assert.equal(p.level,level);assert.equal(p.starTotal,total);assert.equal(p.starCurrent,Math.min(correct,total));assert.equal(p.masteryTotal,6);assert.deepEqual(journey,before);
 }
});
test('retention counter needs each target, different days and elapsed time; old earned mastery remains earned',()=>{
 const pool=spellingPool([turtle],{}),ids=pool[0].targetIds;
 const slots=[{...turtle,category:'u/ó',masked:'ż_łw',answer:'ó'},{...turtle,category:'rz/ż',masked:'_ółw',answer:'ż'}];
 let ledger;
 const add=(slot,day,i)=>ledger=addLearningSession(ledger,{id:'card-'+i,mode:'spelling',date:day+'T12:00:00Z',attempts:[{...slot,kind:'spelling',at:day+'T12:00:00Z',correct:true,targetIds:ids}]});
 for(let i=0;i<30;i++)add(slots[0],'2026-10-01',i);
 assert.equal(wordCardProgress(turtle,{},ledger.items['word:żółw']).masteryCurrent,1);
 add(slots[0],'2026-10-02',31);add(slots[0],'2026-10-03',32);
 assert.equal(wordCardProgress(turtle,{},ledger.items['word:żółw']).masteryCurrent,2);
 add(slots[0],'2026-10-08',33);
 let p=wordCardProgress(turtle,{},ledger.items['word:żółw']);assert.equal(p.masteryCurrent,3);assert.equal(p.mastered,false);
 for(const [i,d] of ['01','04','08'].entries())add(slots[1],'2026-10-'+d,40+i);
 p=wordCardProgress(turtle,{},ledger.items['word:żółw']);assert.equal(p.masteryCurrent,6);assert.equal(p.mastered,true);
 assert.equal(wordCardProgress(turtle,{}, {masteryEarned:true}).masteryCurrent,6);
 assert.equal(ledger.items['word:żółw'].targets[targetId(slots[1])].masteryEarned,true);
});
test('badges use distinct transparent library assets; placeholders and counters are accessible',()=>{
 assert.equal(new Set(Object.values(WORD_BADGE_ASSETS).map(a=>a.path)).size,4);
 const empty=wordBadgeMarkup('star',wordCardProgress(turtle),{counter:true});
 assert.match(empty,/is-empty/);assert.match(empty,/0\/5/);assert.match(empty,/loading="lazy"/);
 assert.match(wordBadgeMarkup('mastery',wordCardProgress(turtle),{counter:true}),/0\/6/);
 for(const asset of Object.values(WORD_BADGE_ASSETS)){assert.equal(asset.width,1254);assert.ok(asset.size<=256000);assert.match(asset.path,/^assets\/managed\/[a-f0-9]{64}\.webp$/);}
});
