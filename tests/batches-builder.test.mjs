import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EMPTY_BATCHES,createCandidate,addCandidates,validateBatches,batchSummary,batchWords,candidateProblems,publicationPlan,validatePublication,matchBatchImage,requeueRejected} from '../design-system/batch-model.mjs';
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
 validateBatches(queue);assert.equal(batchWords(queue).length,247);assert.equal(queue.batches.length,13);assert.ok(queue.batches.every(b=>b.stage==='proposed'&&b.words.every(r=>r.selected&&r.assetPath===null)));assert.ok(batchSummary(queue,active).every(p=>p.total>=100));assert.equal(new Set([...active.map(w=>w.word),...batchWords(queue).map(w=>w.word)]).size,active.length+247);assert.equal(active.length,455);
});
test('category recognition precedes review; one brzuch counts in three distinct pools',()=>{
 const result=addCandidates(structuredClone(EMPTY_BATCHES),[' BRZUCH ','brzuch','pies'],[]);
 assert.equal(result.added,1);assert.equal(result.rejected.length,2);assert.deepEqual(result.value.batches[0].words[0].categories,['u/ó','rz/ż','ch/h']);assert.equal(batchSummary(result.value,[]).filter(r=>r.proposed===1).length,3);
 result.value.batches[0].words[0].selected=false;assert.equal(batchSummary(result.value,[]).reduce((n,r)=>n+r.proposed,0),0);
});
test('batches allow reviewed category subsets but reject drift, unknown difficulty, paths and repeated words',()=>{
 const reviewed=structuredClone(queue),part=reviewed.batches[1].words.find(r=>r.word==='część');assert.deepEqual(part.categories,['ś/si']);assert.doesNotThrow(()=>validateBatches(reviewed));
 for(const change of [r=>r.categories.reverse(),r=>r.levels['u/ó']=1,r=>r.levels[r.categories[0]]=3,r=>r.assetPath='assets/../secret',r=>r.word='<img>']){const v=structuredClone(queue);change(v.batches[0].words[0]);assert.throws(()=>validateBatches(v));}
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
test('valid inflections and real alternative words never become wrong-answer distractors',()=>{
 const queued=new Map(batchWords(queue).map(r=>[r.word,r]));
 for(const word of ['ryś','gęś','łoś','miś','miedź','więź','krawędź','łabędź','łabędzi'])assert.equal(queued.has(word),false);
 assert.deepEqual(queued.get('część').categories,['ś/si']);assert.deepEqual(queued.get('pieśń').categories,['ś/si']);assert.deepEqual(queued.get('śledź').categories,['ś/si']);assert.deepEqual(queued.get('gwoźdź').categories,['ź/zi']);
 const grzebien=active.find(r=>r.word==='grzebień'),mozliwosc=active.find(r=>r.word==='możliwość'),uczen=active.find(r=>r.word==='uczeń'),cien=active.find(r=>r.word==='cień');
 assert.deepEqual(grzebien.practiceCategories,['rz/ż']);assert.deepEqual(mozliwosc.practiceCategories,['rz/ż','ś/si']);assert.deepEqual(uczen.practiceCategories,['u/ó']);assert.deepEqual(cien.practiceCategories,['ć/ci']);
 assert.equal(spellingPool(active,{category:'ń/ni'},()=>0).some(q=>q.word==='grzebień'),false);
 assert.equal(spellingPool(active,{category:'ć/ci'},()=>0).some(q=>q.word==='możliwość'),false);
 const bear=spellingPool(active,{category:'dź/dzi'},()=>0).find(q=>q.word==='niedźwiedź');assert.equal(bear.masked,'nie_wiedź');assert.equal(bear.answer,'dź');
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

test('deferred words can return as a selected batch without duplicating accepted words',()=>{
 const v=structuredClone(queue);const old=v.batches[0];old.stage='published';old.words[1].selected=false;const next=requeueRejected(v,old.id,'batch-retry-test');assert.equal(next.batches[0].words.length,old.words.length-1);assert.equal(next.batches.at(-1).words[0].word,old.words[1].word);assert.equal(next.batches.at(-1).words[0].selected,true);assert.equal(new Set(batchWords(next).map(w=>w.word)).size,batchWords(next).length);assert.throws(()=>requeueRejected(queue,queue.batches[0].id));
});
test('short frame samples do not show a green overall status based only on setup time',()=>{
 assert.equal(performanceStatus({ready:false,setupMs:1,memory:{heapMB:10,heapLimitMB:100}}).overall,'neutral');
});

test('one Git commit carries final batch, shared image assignment, rules and word pack together',async()=>{
 const {GitClient}=await import('../design-system/git-client.mjs');const {batch,assets}=sample(),plan=publicationPlan(batch,assets,active,library);batch.stage='published';assets.words.chrzanić={path:batch.words[0].assetPath,source:'data/words-01.json',masked:plan.records[0].masked};const requests=[],sha='a'.repeat(40),treeSha='b'.repeat(40),commitSha='c'.repeat(40);
 const client=new GitClient(async(url,options={})=>{const path=new URL(url).pathname;requests.push({path,method:options.method||'GET',body:options.body&&JSON.parse(options.body)});let body;if(/\/mala-nauka\/?$/.test(path))body={permissions:{push:true}};else if(path.endsWith('/git/ref/heads/design/system-v1'))body={object:{sha}};else if(path.includes('/git/commits/'))body={tree:{sha:treeSha}};else if(path.endsWith('/git/trees'))body={sha:treeSha};else if(path.endsWith('/git/commits'))body={sha:commitSha};else if(path.endsWith('/git/refs/heads/design/system-v1'))body={object:{sha:commitSha}};else if(path.endsWith('/contents/design-system/config.json'))body={content:Buffer.from(JSON.stringify(config)).toString('base64')};else throw Error(path);return new Response(JSON.stringify(body),{status:200});});
 await client.connect('qa-token-only',config);await client.save({config,assets,rules:{...library,assignments:{...library.assignments,...plan.assignments}},batches:{...EMPTY_BATCHES,batches:[batch]},wordEdits:[{path:'data/words-01.json',baseValue:await read('data/words-01.json'),value:[...await read('data/words-01.json'),...plan.records]}]});const tree=requests.find(r=>r.path.endsWith('/git/trees')).body.tree;assert.ok(['design-system/config.json','design-system/assets.json','design-system/rules.json','design-system/word-batches.json','data/words-01.json'].every(p=>tree.some(e=>e.path===p)));assert.equal(requests.filter(r=>r.method==='PATCH').length,1);assert.equal(requests.find(r=>r.method==='PATCH').body.force,false);
});

test('replenishing proposals preserves earlier batch review, images and category levels',async()=>{
 const {mkdtemp,mkdir,writeFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{execFileSync}=await import('node:child_process');const dir=await mkdtemp(join(tmpdir(),'mn-batches-'));
 try{await mkdir(join(dir,'data'));await mkdir(join(dir,'design-system'));for(let i=1;i<=8;i++)await writeFile(join(dir,`data/words-0${i}.json`),JSON.stringify(await read(`data/words-0${i}.json`)));const prior=structuredClone(queue);prior.batches[0].stage='images';prior.batches[0].words[0].selected=false;prior.batches[0].words[1].assetPath=catalog.assets.find(a=>a.group==='scenes').path;for(const c of prior.batches[0].words[1].categories)prior.batches[0].words[1].levels[c]=2;await writeFile(join(dir,'design-system/word-batches.json'),JSON.stringify(prior));execFileSync(process.execPath,[new URL('../tools/prepare-word-batches.mjs',import.meta.url).pathname],{cwd:dir});const next=JSON.parse(await readFile(join(dir,'design-system/word-batches.json'),'utf8'));assert.deepEqual(next.batches.slice(0,prior.batches.length),prior.batches);assert.ok(batchSummary(next,active).every(r=>r.total>=100));validateBatches(next);}finally{await rm(dir,{recursive:true,force:true});}
});
