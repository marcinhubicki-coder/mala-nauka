import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {wordSlots,practiceCategories,spellingPool,questionForWord,auditWordPools,canonicalWords} from '../spelling/word-pools.mjs';
import {Session} from '../game.mjs';
import {createSource,cleanConfig} from '../modes.mjs';
import {configureSpellingRound} from '../spelling/round.mjs';
import {configureAssets,wordAsset} from '../shared/asset-loader.mjs';
import {configureRules,RULE_CATEGORIES} from '../shared/rules-library.mjs';
import {DEFAULT_EFFECTS,validateEffects,createEffectPicker,effectBudget,frameStats} from '../spelling/effect-model.mjs';
import {playResponseEffect} from '../spelling/response-effects.mjs';
import {DEFAULT_SCORING,scoreAttempts,scoreResult,validateScoring} from '../spelling/scoring.mjs';
import {validateConfig,changedViews} from '../design-system/model.mjs';
import {recordResult,cleanProgress} from '../progress.mjs';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8').then(JSON.parse);
const words=(await Promise.all(Array.from({length:8},(_,i)=>read(`data/words-0${i+1}.json`)))).flat();
const [assets,rules,config,registry]=await Promise.all(['assets','rules','config','registry'].map(s=>read(`design-system/${s}.json`)));
configureAssets(assets,'https://test.example/');configureRules(rules);

test('brzuch has three real pools, one blank per question, one canonical identity and one asset',()=>{
 const word=words.find(w=>w.word==='brzuch'),url=wordAsset(word.word);
 assert.deepEqual(new Set(wordSlots(word).map(s=>s.category)),new Set(['rz/ż','u/ó','ch/h']));
 for(const [category,masked,answer]of [['rz/ż','b_uch','rz'],['u/ó','brz_ch','u'],['ch/h','brzu_','ch']]){
  const q=createSource('spelling',cleanConfig('spelling',{category}),words,()=>0).find(w=>w.word==='brzuch');
  assert.ok(q,category);assert.equal(q.masked,masked);assert.equal(q.answer,answer);assert.equal(q.masked.replace('_',q.answer),'brzuch');assert.equal(q.masked.split('_').length,2);assert.equal(q.wordId,'brzuch');assert.equal(wordAsset(q.word),url);
 }
 const mixed=spellingPool(words,{category:'u/ó,rz/ż,ch/h'},()=>.8);assert.equal(mixed.filter(w=>w.word==='brzuch').length,1);
});
test('every generated family question reconstructs the exact word and secondary rules propagate centrally',()=>{
 for(const row of words)for(const category of practiceCategories(row)){
  const q=questionForWord(row,category,rules);assert.equal(q.masked.replace('_',q.answer),row.word);assert.ok(q.options.includes(q.answer));assert.equal(q.masked.split('_').length,2);
 }
 for(const row of words)for(const slot of wordSlots(row))if(!practiceCategories(row).includes(slot.category))assert.equal(questionForWord(row,slot.category,rules),null);
 const draft=structuredClone(rules),rule=Object.values(draft.rules).find(r=>r.category==='ch/h'&&r.poolDefault);rule.explanation='Jedna wspólna treść dla dodatkowej puli.';
 assert.equal(questionForWord(words.find(w=>w.word==='brzuch'),'ch/h',draft).learning.explanation,rule.explanation);
 const audit=auditWordPools(words,assets);assert.equal(audit.uniqueWords,words.length);assert.equal(audit.duplicates.length,0);assert.equal(audit.multipleCategories,words.filter(row=>practiceCategories(row).length>1).length);assert.equal(audit.missingAssets.length,words.filter(row=>!wordAsset(row.word)).length);
 assert.equal(audit.pools.find(p=>p.category==='ć/ci').total,words.filter(row=>practiceCategories(row).includes('ć/ci')).length);
});
test('duplicate records never become duplicate questions and conflicting levels are rejected',()=>{
 const row=words[0];assert.equal(canonicalWords([row,structuredClone(row)]).length,1);
 assert.equal(spellingPool([row,structuredClone(row)],{category:'all'}).length,1);
 assert.throws(()=>canonicalWords([row,{...row,difficulty:row.difficulty===1?2:1}]),/Konflikt/);
 const source=[{...row,kind:'spelling'},{...row,kind:'spelling'}],game=configureSpellingRound(new Session(source,180,()=>0),{limitMode:'count',wordLimit:80},source);
 assert.equal(game.questionLimit,1);game.answer(game.current.answer);game.skipFeedback();assert.equal(game.state,'ended');assert.equal(game.attempts.length,1);
});
test('all category pools and mixed timed pools exhaust without any repeated word',()=>{
 for(const category of [...RULE_CATEGORIES,'all','u/ó,rz/ż,ch/h']){
  const source=createSource('spelling',cleanConfig('spelling',{category,limitMode:'time'}),words,()=>.44),game=configureSpellingRound(new Session(source,180,()=>0,()=>.23),{limitMode:'time'},source),seen=new Set();
  while(game.state!=='ended'){
   assert.ok(!seen.has(game.current.word),category+': '+game.current.word);seen.add(game.current.word);game.answer(game.current.answer);game.skipFeedback();
  }
  assert.equal(seen.size,source.length);assert.equal(game.poolExhausted,true);assert.equal(game.attempts.length,seen.size);
 }
});
test('expanded effects validate, new effect types are available and combo cannot exceed particle budget',()=>{
 validateEffects(DEFAULT_EFFECTS);assert.equal(Object.keys(DEFAULT_EFFECTS.presets).length,16);for(const id of ['star5','star9','textConfetti','lightning','glitter','dynamite'])assert.ok(DEFAULT_EFFECTS.presets[id]);
 const pick=createEffectPicker(()=>0);let previous;
 for(let i=0;i<40;i++){const {id,preset}=pick(DEFAULT_EFFECTS);assert.notEqual(id,previous);previous=id;assert.ok(effectBudget({...DEFAULT_EFFECTS,particleBudget:8},preset,true).particles<=8);}
 for(const mutate of [e=>e.particleBudget=100,e=>e.presets.spark.duration=NaN,e=>e.presets.spark.color='red;',e=>e.bubble.transitionBlur=20,e=>e.comboEvery=0,e=>Object.values(e.presets).forEach(p=>p.enabled=false)]){const value=structuredClone(DEFAULT_EFFECTS);mutate(value);assert.throws(()=>validateEffects(value));const c=structuredClone(config);c.effects=value;assert.throws(()=>validateConfig(c));}
});
test('response effects module imports with the expanded effect library',()=>{assert.equal(typeof playResponseEffect,'function');});
test('performance sample reports measured frames honestly and refuses tiny samples',()=>{
 assert.equal(frameStats([16,17]).ready,false);const good=frameStats(Array(60).fill(16.67));assert.equal(good.fps,60);assert.equal(good.rating,'płynnie');assert.equal(good.longFrames,0);
 const heavy=frameStats(Array(20).fill(40));assert.equal(heavy.fps,25);assert.equal(heavy.rating,'ciężki');assert.equal(heavy.longFrames,20);
});
test('scoring preserves baseline, combo resets at mistakes or help and totals cannot go negative',()=>{
 const attempts=[true,true,true,false,true,true,true].map((correct,i)=>({word:'w'+i,correct}));
 assert.equal(scoreAttempts(attempts).total,6);
 const s={...DEFAULT_SCORING,correctPoints:10,wrongPenalty:5,comboBonus:4};
 const result=scoreAttempts(attempts,s);assert.equal(result.base,60);assert.equal(result.penalty,5);assert.equal(result.combo,8);assert.equal(result.total,63);assert.equal(result.accuracy,86);
 attempts[1].hintUsed=true;const assisted=scoreAttempts(attempts,{...s,hintPercent:50});assert.equal(assisted.hintDiscount,5);assert.equal(assisted.combo,4);assert.equal(assisted.rows[1].streak,0);
 assert.equal(scoreAttempts([{correct:false}],{...s,wrongPenalty:20}).total,0);assert.equal(scoreAttempts([],s).accuracy,0);
 assert.throws(()=>validateScoring({...s,comboEvery:1}));assert.throws(()=>validateScoring({...s,correctPoints:Infinity}));
});
test('finished rounds store scoring rules, restore identical points and do not rewrite learning counts or old results',()=>{
 const progress=cleanProgress(null),attempts=[{kind:'spelling',word:'brzuch',masked:'b_uch',answer:'rz',category:'rz/ż',correct:true,hintUsed:false,at:'2026-10-04T12:00:00Z'}];
 const result={id:'points-round',mode:'spelling',category:'rz/ż',difficulty:1,duration:180,limitMode:'count',wordLimit:10,correct:1,wrong:0,date:'2026-10-04T12:00:00Z',attempts,scoring:{...DEFAULT_SCORING,correctPoints:10}};
 recordResult(progress,result);assert.equal(scoreResult(result).total,10);assert.deepEqual(progress.best,{});
 const restored=cleanProgress(JSON.parse(JSON.stringify(progress))).history[0];assert.equal(scoreResult(restored).total,10);assert.equal(restored.correct,1);
 assert.equal(scoreResult({...result,scoring:undefined}).total,1);
 assert.ok(changedViews([{path:'scoring.correctPoints'}],registry).some(v=>v.id==='spelling-results'));
});
