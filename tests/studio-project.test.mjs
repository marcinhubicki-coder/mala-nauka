import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DISCOVERY_RULES,discoveryState,applyDiscoveryEvent,fixtureEvents,replayDiscovery,discoverySummary} from '../shared/discovery-model.mjs';
import {discoveryProject,newScreen,newElement,planSchedule,projectIssues,makeRelease,approveRelease,publishRelease,projectContract,editableProjectConfig,validateProject,validateScreen,fingerprint,triggerTarget,projectTriggers} from '../design-system/project-model.mjs';
import {draftRecovery} from '../design-system/draft-recovery.mjs';
import {resolveStudioMerge} from '../design-system/merge-model.mjs';
import {GitClient} from '../design-system/git-client.mjs';
import {validateConfig} from '../design-system/model.mjs';
import {encodeShare,decodeShare,previewLink,validateEnvelope,validateFeedback} from '../design-system/project-share.mjs';
const config=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url),'utf8'));
const answer=(word,n,other={})=>({id:'event-'+n,type:'answer',word,at:'2026-10-05T10:00:00Z',sessionId:'one',correct:true,families:['u/ó'],...other});
test('seventh distinct independent answer grants memory; repeat, hint and retry cannot farm it',()=>{
 let s=replayDiscovery(fixtureEvents('six'));assert.equal(s.memoryEarned,0);assert.equal(s.eligible,6);
 s=applyDiscoveryEvent(s,answer('portfel',100));assert.equal(s.memoryEarned,1);
 for(const e of [answer('portfel',101),answer('słoń',102,{hintUsed:true}),answer('chrzanić',103,{retry:true})])s=applyDiscoveryEvent(s,e);
 assert.equal(s.eligible,7);assert.equal(s.memoryEarned,1);assert.equal(discoverySummary(s).mastered,0);
 s=applyDiscoveryEvent(s,answer('brzuch',104,{correct:false}));assert.equal(s.memoryEarned,1);
});
test('wrong first attempt blocks same-day points and does not remove existing discoveries',()=>{
 let s=replayDiscovery(fixtureEvents('seven'));s=applyDiscoveryEvent(s,{id:'tile',type:'reveal',tile:0});
 s=applyDiscoveryEvent(s,answer('nowe',200,{correct:false}));s=applyDiscoveryEvent(s,answer('nowe',201));
 assert.equal(s.eligible,7);assert.deepEqual(s.revealed,[0]);assert.equal(s.memoryEarned,1);
});
test('mastery and levels require recall across days, irrespective of combo and map currency',()=>{
 const s=replayDiscovery(fixtureEvents('returns')),summary=discoverySummary(s);assert.equal(summary.mastered,12);assert.equal(summary.level,3);
 const early=replayDiscovery(fixtureEvents('returns').map(e=>({...e,at:e.at.replace(/2026-10-13/,'2026-10-10')})));assert.equal(discoverySummary(early).mastered,0);
 const oneDay=replayDiscovery(fixtureEvents('long'));assert.equal(discoverySummary(oneDay).mastered,0);
});
test('combo is bounded per session and new sessions start their own streak',()=>{
 let s=discoveryState();for(let i=0;i<12;i++)s=applyDiscoveryEvent(s,answer('słowo'+i,i));assert.equal(s.comboBySession.one,2);assert.equal(s.points,14);
 s=applyDiscoveryEvent(s,answer('inne',500,{sessionId:'two'}));assert.equal(s.streak,1);assert.equal(s.comboBySession.two,undefined);
});
test('duplicate delivery and duplicate tile cannot charge twice; locked skins cannot be selected',()=>{
 let s=replayDiscovery(fixtureEvents('seven'));const event={id:'tile',type:'reveal',tile:0};s=applyDiscoveryEvent(s,event);
 assert.deepEqual(applyDiscoveryEvent(s,event),s);const twice=applyDiscoveryEvent(s,{...event,id:'tile-2'});assert.equal(twice.memorySpent,1);
 assert.throws(()=>applyDiscoveryEvent(s,{id:'locked',type:'skin',skin:'ocean'}),/czeka/);
 assert.throws(()=>applyDiscoveryEvent(s,{id:'no-balance',type:'reveal',tile:1}),/potrzeba/);
});
test('seeded fixtures de-duplicate source rows and are reproducible',()=>{
 const words=[{word:'brzuch',category:'u/ó'},{word:'brzuch',category:'rz/ż'},{word:'rzeka',category:'rz/ż'}];
 const a=fixtureEvents('long',42,words);assert.equal(a.length,2);assert.deepEqual(a,fixtureEvents('long',42,words));
});
test('schedule takes longest dependency path, exposes cycles and deadline risk',()=>{
 const p=discoveryProject(),schedule=planSchedule(p);assert.equal(schedule.days,9);assert.equal(schedule.end,'2026-10-14');assert.ok(schedule.critical.includes('task-2'));
 p.tasks[0].depends=['task-5'];assert.match(planSchedule(p).errors[0],/pętlę/);assert.ok(projectIssues(p).some(i=>i.level==='error'));
});
test('broken navigation is a release blocker; drafts may keep incomplete screens',()=>{
 const p=discoveryProject();p.screens.push(newScreen());assert.doesNotThrow(()=>validateProject(p));
 p.screens[0].elements[3].action.target='gone';assert.ok(projectIssues(p).some(i=>i.level==='error'));assert.throws(()=>makeRelease(p,config));
});
test('saved preview freezes content and rules; draft-only Git save leaves active design untouched',()=>{
 const p=discoveryProject(),local={...structuredClone(config),project:p};const r=makeRelease(p,local);p.releases.push(r);const old=r.snapshot.screens[0].elements[0].text;
 p.screens[0].elements[0].text='Nowa treść';p.rules.memoryEvery=8;local.tokens.jelly.height=60;
 assert.equal(r.snapshot.screens[0].elements[0].text,old);assert.equal(r.snapshot.rules.memoryEvery,7);
 const contract=projectContract(local,config);assert.equal(contract.tokens.jelly.height,config.tokens.jelly.height);assert.equal(contract.project.designDraft.tokens.jelly.height,60);assert.equal(editableProjectConfig(contract).tokens.jelly.height,60);assert.doesNotThrow(()=>validateConfig(contract));
});
test('four checks and resolved feedback are required before publishing frozen design',()=>{
 const p=discoveryProject(),local={...structuredClone(config),project:p};local.tokens.jelly.height=60;const r=makeRelease(p,local);p.releases.push(r);
 assert.throws(()=>approveRelease(r));assert.throws(()=>publishRelease(p,r.id));r.checks={flow:true,learning:true,content:true,mobile:true};r.reviews=[{text:'Popraw napis',screen:p.entry,status:'open'}];assert.throws(()=>approveRelease(r));r.reviews[0].status='addressed';p.releases[0]=approveRelease(r);local.project=publishRelease(p,r.id);
 local.tokens.jelly.height=70;const contract=projectContract(local,config);assert.equal(contract.tokens.jelly.height,60);assert.equal(contract.project.designDraft.tokens.jelly.height,70);
 const forged=structuredClone(local);forged.project.releases[0].checks.mobile=false;assert.throws(()=>projectContract(forged,config));
});
test('import rejects mutated frozen versions, missing controls, traversal assets and unsafe nested keys',()=>{
 const p=discoveryProject();p.releases.push(makeRelease(p,config));const mutated=structuredClone(p);mutated.releases[0].snapshot.rules.memoryEvery=8;assert.throws(()=>validateProject(mutated));
 const missing=structuredClone(p);missing.releases[0].checks={};assert.throws(()=>validateProject(missing));
 const s=newScreen();s.asset='assets/../outside.png';assert.throws(()=>validateScreen(s));
 const poisoned=JSON.parse(JSON.stringify(p).replace('"tasks":','"__proto__":{"bad":true},"tasks":'));assert.throws(()=>validateProject(poisoned));
});
test('compressed preview round-trips, protects version identity and only accepts matching host access links',async()=>{
 const p=discoveryProject(),r=makeRelease(p,config),envelope={kind:'mala-nauka-preview',schemaVersion:1,releaseId:r.id,fingerprint:r.fingerprint,snapshot:r.snapshot};const encoded=await encodeShare(envelope);assert.deepEqual(validateEnvelope(await decodeShare(encoded)),envelope);
 const altered=structuredClone(envelope);altered.snapshot.name='Zmiana';assert.throws(()=>validateEnvelope(altered));assert.equal(fingerprint(envelope.snapshot),r.fingerprint);
 const base='https://preview.example/design-system/';assert.match(previewLink(encoded,'https://preview.example/?_vercel_share=temporary',base),/\?_vercel_share=temporary#preview=/);assert.throws(()=>previewLink(encoded,'https://other.example/',base));
 assert.throws(()=>validateFeedback({kind:'mala-nauka-feedback',releaseId:r.id,fingerprint:r.fingerprint,comments:[{text:'',screen:p.entry}]}));await assert.rejects(decodeShare('z.'+'a'.repeat(250001)));
});


test('editable event routes preserve legacy previews and prioritize memory over combo',()=>{
 const p=discoveryProject();assert.equal(triggerTarget(p,[{kind:'memory'}],'correct'),'memory-reward');
 p.triggers={memory:'discovery-map',combo:'discovery-progress',correct:'discovery-start',wrong:''};
 assert.equal(triggerTarget(p,[{kind:'combo'},{kind:'memory'}],'correct'),'discovery-map');
 assert.equal(triggerTarget(p,[],'correct'),'discovery-start');assert.equal(triggerTarget(p,[],'wrong'),'');
 const r=makeRelease(p,config);p.triggers.memory='missing-screen';assert.equal(r.snapshot.triggers.memory,'discovery-map');
 assert.ok(projectIssues(p).some(i=>i.level==='error'));assert.throws(()=>makeRelease(p,config));
 p.triggers={memory:'../bad'};assert.throws(()=>validateProject(p));
});

test('unknown catalog assets prevent release even if their path is syntactically valid',()=>{
 const p=discoveryProject();p.screens[0].asset='assets/not-in-catalog.png';
 assert.throws(()=>makeRelease(p,config,'Próba',{assets:[],aliases:{}}));
});


test('stale drafts merge unrelated changes and keep conflicts for explicit resolution',async()=>{
 const state={config:structuredClone(config),assets:JSON.parse(await readFile(new URL('../design-system/assets.json',import.meta.url))),rules:JSON.parse(await readFile(new URL('../design-system/rules.json',import.meta.url))),batches:JSON.parse(await readFile(new URL('../design-system/word-batches.json',import.meta.url)))};
 const draft={schemaVersion:1,baseRevision:state.config.revision,...structuredClone(state),baseState:structuredClone(state)};
 draft.config.project=discoveryProject();draft.config.tokens.jelly.height=65;
 const remote=structuredClone(state);remote.config.revision++;remote.config.tokens.layout.sidePadding=16;
 const recovered=draftRecovery(draft,remote);assert.equal(recovered.kind,'merge');assert.equal(recovered.plan.conflicts.length,0);
 const merged=resolveStudioMerge(recovered.plan);assert.equal(merged.config.tokens.jelly.height,65);assert.equal(merged.config.tokens.layout.sidePadding,16);assert.ok(merged.config.project);
 remote.config.tokens.jelly.height=70;const conflict=draftRecovery(draft,remote);assert.equal(conflict.plan.conflicts.length,1);assert.throws(()=>resolveStudioMerge(conflict.plan));
 assert.equal(draft.config.tokens.jelly.height,65);delete draft.baseState;assert.equal(draftRecovery(draft,remote).kind,'legacy');
});

test('deployment indicator uses the Vercel commit status and exposes unavailable data honestly',async()=>{
 let requested='';const client=new GitClient(async url=>{requested=url;return {ok:true,json:async()=>({statuses:[{context:'Vercel',state:'pending',description:'Building preview',target_url:'https://vercel.example/deployment'}]})};});
 const result=await client.deploymentStatus('a'.repeat(40));assert.match(requested,/commits\/a{40}\/status$/);assert.equal(result.state,'pending');assert.equal(result.providerUrl,'https://vercel.example/deployment');
 const missing=new GitClient(async()=>({ok:true,json:async()=>({statuses:[]})}));assert.equal((await missing.deploymentStatus('b'.repeat(40))).state,'unknown');await assert.rejects(()=>client.deploymentStatus('bad'));
});

test('production promotion merges exactly the green preview SHA and refuses a stale branch',async()=>{
 const sha='a'.repeat(40),main='b'.repeat(40),mergeSha='c'.repeat(40),calls=[];
 const makeClient=stale=>new GitClient(async(url,options={})=>{
  const path=(url.split('/mala-nauka/')[1]||url.split('/mala-nauka')[1]||'').replace(/^\//,''),method=options.method||'GET',body=options.body?JSON.parse(options.body):undefined;calls.push({path,method,body});
  let value,status=200;
  if(path==='')value={permissions:{push:true}};
  else if(path==='git/ref/heads/design/system-v1')value={object:{sha:stale?'d'.repeat(40):sha}};
  else if(path.startsWith('contents/design-system/config.json'))value={content:Buffer.from(JSON.stringify(config)).toString('base64')};
  else if(path===`commits/${sha}/status`)value={statuses:[{context:'Vercel',state:'success',description:'Preview ready'}]};
  else if(path===`compare/main...${sha}`)value={status:'ahead',ahead_by:95,behind_by:0,files:[{filename:'one'},{filename:'two'}],base_commit:{sha:main}};
  else if(path===`git/ref/heads/studio/release-${sha.slice(0,12)}`){status=404;value={message:'Not Found'};}
  else if(path==='git/refs'&&method==='POST')value={};
  else if(path.startsWith('pulls?'))value=[];
  else if(path==='pulls'&&method==='POST')value={number:42,html_url:'https://github.example/pull/42'};
  else if(path==='pulls/42/merge'&&method==='PUT')value={merged:true,sha:mergeSha};
  else throw Error(path+' '+method);
  return {ok:status>=200&&status<300,status,json:async()=>value};
 });
 const client=makeClient(false);await client.connect('test-token',config);const summary=await client.productionSummary(sha);assert.equal(summary.commits,95);assert.equal(summary.files,2);assert.equal(summary.mainSha,main);
 const result=await client.promoteToProduction(sha);
 assert.equal(result.sha,sha);assert.equal(result.mergeSha,mergeSha);assert.equal(result.prNumber,42);
 assert.equal(calls.find(row=>row.path==='pulls'&&row.method==='POST').body.head,`studio/release-${sha.slice(0,12)}`);
 assert.equal(calls.find(row=>row.path==='pulls/42/merge').body.sha,sha);
 const stale=makeClient(true);await stale.connect('test-token',config);await assert.rejects(()=>stale.promoteToProduction(sha),/nowszy commit/);
});

test('browser-native fetch keeps its Window receiver in the Git client',async()=>{
 const original=globalThis.fetch;
 try{globalThis.fetch=function(){assert.equal(this,globalThis);return Promise.resolve({ok:true,json:async()=>({statuses:[{context:'Vercel',state:'success'}]})});};
 const client=new GitClient();assert.equal((await client.deploymentStatus('c'.repeat(40))).state,'success');
 }finally{globalThis.fetch=original;}
});
