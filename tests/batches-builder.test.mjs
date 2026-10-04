import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EMPTY_BATCHES,createCandidate,addCandidates,validateBatches,batchSummary,batchWords,candidateProblems,publicationPlan,validatePublication,matchBatchImage} from '../design-system/batch-model.mjs';
import {spellingPool} from '../spelling/word-pools.mjs';
import {mergeWordPack} from '../design-system/git-client.mjs';
import {planStudioMerge,resolveStudioMerge} from '../design-system/merge-model.mjs';
import {validateWords} from '../game.mjs';
import {DEFAULT_RECIPES,validateRecipes,recipesCSS,blueprintTemplate,validateBlueprint,validateBlueprints} from '../shared/component-recipes.mjs';
import {validateConfig,configCSS,changedViews} from '../design-system/model.mjs';
import {performanceStatus} from '../spelling/performance-model.mjs';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const [queue,catalog,library,config,registry]=await Promise.all(['design-system/word-batches.json','design-system/assets.json','design-system/rules.json','design-system/config.json','design-system/registry.json'].map(read));
const active=(await Promise.all(Array.from({length:8},(_,i)=>read(`data/words-0${i+1}.json`)))).flat();
const sample=()=>{const row=createCandidate('chrzanić');row.assetPath=catalog.assets.find(a=>a.group==='scenes').path;return {batch:{id:'batch-test',name:'Próba',stage:'images',words:[row]},assets:{...structuredClone(catalog),assets:catalog.assets.map(a=>a.path===row.assetPath?{...a,width:1024,height:1024}:a)}};};
test('the complete queue reaches 100 in every pool without publishing or duplicating game words',()=>{
 validateBatches(queue);assert.equal(batchWords(queue).length,256);assert.equal(queue.batches.length,13);assert.ok(queue.batches.every(b=>b.stage==='proposed'&&b.words.every(r=>r.selected&&r.assetPath===null)));assert.ok(batchSummary(queue,active).every(p=>p.total>=100));assert.equal(new Set([...active.map(w=>w.word),...batchWords(queue).map(w=>w.word)]).size,active.length+256);assert.equal(active.length,455);
});
test('category recognition precedes review; one brzuch counts in three distinct pools',()=>{
 const result=addCandidates(structuredClone(EMPTY_BATCHES),[' BRZUCH ','brzuch','pies'],[]);
 assert.equal(result.added,1);assert.equal(result.rejected.length,2);assert.deepEqual(result.value.batches[0].words[0].categories,['u/ó','rz/ż','ch/h']);assert.equal(batchSummary(result.value,[]).filter(r=>r.proposed===1).length,3);
 result.value.batches[0].words[0].selected=false;assert.equal(batchSummary(result.value,[]).reduce((n,r)=>n+r.proposed,0),0);
});
test('batches reject manual category drift, unknown difficulty, paths and repeated words',()=>{
 for(const change of [r=>r.categories.pop(),r=>r.levels['u/ó']=3,r=>r.assetPath='assets/../secret',r=>r.word='<img>']){const v=structuredClone(queue);change(v.batches[0].words[0]);assert.throws(()=>validateBatches(v));}
 const v=structuredClone(queue);v.batches[1].words.push(structuredClone(v.batches[0].words[0]));assert.throws(()=>validateBatches(v));
});
test('final group acceptance requires a verified square image and selected words only',()=>{
 const {batch,assets}=sample();assert.equal(candidateProblems(batch.words[0],assets,active).length,0);const plan=publicationPlan(batch,assets,active,library);assert.equal(plan.records.length,1);assert.equal(plan.records[0].masked.split('_').length,2);assert.equal(plan.assignments.chrzanić.families.length,4);
 const missing=structuredClone(assets);delete missing.assets.find(a=>a.path===batch.words[0].assetPath).width;assert.throws(()=>publicationPlan(batch,missing,active,library));
 const nonsquare=structuredClone(assets);nonsquare.assets.find(a=>a.path===batch.words[0].assetPath).height=500;assert.throws(()=>publicationPlan(batch,nonsquare,active,library));
 assert.throws(()=>publicationPlan({...batch,stage:'proposed'},assets,active,library));assert.throws(()=>publicationPlan({...batch,words:batch.words.map(r=>({...r,selected:false}))},assets,active,library));
});
test('approved records validate in the real game; category difficulty selects the right one-slot question',()=>{
 const {batch,assets}=sample();batch.words[0].levels['rz/ż']=2;const [word]=publicationPlan(batch,assets,active,library).records;validateWords([...active,word]);
 assert.equal(spellingPool([word],{category:'rz/ż',difficulty:1}).length,0);const [q]=spellingPool([word],{category:'rz/ż',difficulty:2});assert.equal(q.difficulty,2);assert.equal(q.masked.replace('_',q.answer),word.word);assert.equal(q.masked.match(/_/g).length,1);assert.equal(spellingPool([word],{category:'ch/h',difficulty:1}).length,1);
});
test('generic Git save cannot bypass final approval or use a different asset',()=>{
 const {batch,assets}=sample(),plan=publicationPlan(batch,assets,active,library),v={...structuredClone(EMPTY_BATCHES),batches:[batch]},edits=[{baseValue:[],value:plan.records}];
 assets.words.chrzanić={path:batch.words[0].assetPath,source:'data/words-01.json',masked:plan.records[0].masked};assert.throws(()=>validatePublication(v,assets,edits));batch.stage='published';assert.doesNotThrow(()=>validatePublication(v,assets,edits));batch.words[0].selected=false;assert.throws(()=>validatePublication(v,assets,edits));batch.words[0].selected=true;assets.words.chrzanić.path='assets/other.jpg';assert.throws(()=>validatePublication(v,assets,edits));
});
test('bulk image names resolve Polish spelling and refuse ambiguous ASCII matches',()=>{
 const batch={words:[createCandidate('śnieg'),createCandidate('łódź'),createCandidate('lódź')]};assert.equal(matchBatchImage('snieg.JPG',batch).word,'śnieg');assert.equal(matchBatchImage('łódź.webp',batch).word,'łódź');assert.throws(()=>matchBatchImage('lodz.png',batch));assert.throws(()=>matchBatchImage('random.png',batch));batch.words[0].selected=false;assert.throws(()=>matchBatchImage('śnieg.jpg',batch));
});
test('parallel edits append distinct words without losing either group and catch duplicate drift',()=>{
 const base=[{word:'brzuch',difficulty:1}],local=[...base,{word:'chrzanić',difficulty:1}],remote=[...base,{word:'śnieg',difficulty:2}];assert.deepEqual(mergeWordPack(base,local,remote).map(r=>r.word),['brzuch','śnieg','chrzanić']);assert.throws(()=>mergeWordPack(base,local,[...base,{word:'chrzanić',difficulty:2}]));
});
test('concurrent batch decisions require a deliberate conflict choice instead of dropping review',()=>{
 const b={config,assets:catalog,rules:library,batches:queue},l=structuredClone(b),r=structuredClone(b);l.batches.batches[0].words[0].selected=false;r.batches.batches[1].stage='images';const plan=planStudioMerge(b,l,r);assert.ok(plan.conflicts.some(c=>c.kind==='batches'));assert.throws(()=>resolveStudioMerge(plan));const choices=Object.fromEntries(plan.conflicts.map(c=>[c.id,'local']));assert.equal(resolveStudioMerge(plan,choices).batches.batches[0].words[0].selected,false);
});
test('global atom recipes stay inactive until applied, reject CSS injection and identify related views',()=>{
 const recipes=structuredClone(DEFAULT_RECIPES);validateRecipes(recipes);assert.equal(recipesCSS(recipes),'');recipes.title.enabled=true;recipes.title.size=30;const c={...config,recipes};validateConfig(c);assert.match(configCSS(c),/\.page-head h1/);assert.match(configCSS(c),/font-size:calc\(30/);assert.ok(changedViews([{path:'recipes.title.size'}],registry).length>1);recipes.title.role='body;display:none';assert.throws(()=>validateRecipes(recipes));
});
test('blueprint templates validate nested layers and reject invalid hierarchy, excessive depth and duplicate IDs',()=>{
 for(const type of ['card','popup','flashcard','button'])validateBlueprint(blueprintTemplate(type));const b=blueprintTemplate();assert.throws(()=>validateBlueprints([b,b]));b.root.children[0].children[0].children.push(structuredClone(b.root.children[0].children[1]));assert.throws(()=>validateBlueprint(b));const d=blueprintTemplate();d.root.children.push({...structuredClone(d.root.children[0]),id:d.root.id});assert.throws(()=>validateBlueprint(d));
});
test('performance colours distinguish measurable frame and script budgets and hide absent memory',()=>{
 const green=performanceStatus({ready:true,fps:60,p95:16.7,samples:60,setupMs:2});assert.equal(green.overall,'green');assert.equal(green.cards.length,2);assert.equal(performanceStatus({ready:true,fps:45,p95:25,setupMs:10}).overall,'yellow');assert.equal(performanceStatus({ready:true,fps:20,p95:60,setupMs:2}).overall,'red');assert.equal(performanceStatus({setupMs:17}).overall,'red');assert.equal(performanceStatus({}).cards.length,0);assert.equal(performanceStatus({memory:{heapMB:80,heapLimitMB:100}}).cards[0].status,'red');assert.equal(performanceStatus({memory:{heapMB:20}}).cards[0].status,'neutral');
});
