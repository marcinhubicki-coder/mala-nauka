import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VIEW_CONTRACTS,viewContract,validateViewContract,resolveDeclaredPart} from '../shared/view-contracts.mjs';
import {identifyResultAttempts} from '../ortografia/result-attempts.mjs';
import {visualValue} from '../shared/element-styles.mjs';
import {contractInstanceKey} from '../shared/view-contract-mount.mjs';
import {projectContract,designFields} from '../design-system/project-model.mjs';
import {optimizedTestConfig} from '../design-system/pwa-test-build.mjs';
import {planStyleEdit,inspectEditableBlock} from '../tools/studio-engine.mjs';
import {CENTRAL_DESIGN_BRANCH,pinnedContentSource} from '../tools/content-source.mjs';
const registry=JSON.parse(readFileSync(new URL('../design-system/registry.json',import.meta.url)));
const base=JSON.parse(readFileSync(new URL('../design-system/config.json',import.meta.url)));
test('Every registered V2 view has a validated source-owned renderer contract',()=>{
 assert.equal(registry.views.length,41);
 assert.deepEqual(new Set(Object.keys(VIEW_CONTRACTS)),new Set(registry.views.map(v=>v.id)));
 for(const view of registry.views){assert.ok(validateViewContract(view.id));assert.ok(viewContract(view.id).length>=8,view.id);}
});
test('All 41 view edits survive project publication and PWA export without a second design draft',()=>{
 for(const {id:view} of registry.views){
  const item=viewContract(view).find(item=>item.kind==='button'&&!item.repeatKey&&!item.within);
  assert.ok(item,view);
  const edited=planStyleEdit(base,{view,id:item.id,property:'radius',value:27,scope:'view'}).config;
  const saved=JSON.parse(JSON.stringify(projectContract(edited,base))),{config:pwa}=optimizedTestConfig(saved);
  assert.deepEqual(designFields(pwa),designFields(saved),view);
  assert.equal(inspectEditableBlock(pwa,{view,id:item.id}).style.radius,27,view);
  assert.equal(saved.project?.designDraft,undefined);
 }
});
test('Repeat identities use domain keys and remain stable when records are reordered',()=>{
 const before=['Ania','Łódź','a/b'],after=['new','a/b','Ania','Łódź'];
 const ids=rows=>new Map(rows.map(key=>[key,contractInstanceKey(key)]));
 for(const [key,id]of ids(before))assert.equal(ids(after).get(key),id);
 assert.equal(new Set(before.map(contractInstanceKey)).size,3);
 assert.throws(()=>contractInstanceKey(''),/Missing/);
 const profile='profile-'+contractInstanceKey('studio-ania');
 assert.equal(resolveDeclaredPart('players',profile).recipe,'button-player-card');
 assert.equal(resolveDeclaredPart('players',profile+'-profile-avatar').recipe,'image-player-avatar-art');
 assert.equal(resolveDeclaredPart('players','profile-kzz'),null);
 assert.equal(resolveDeclaredPart('players','invented-'+contractInstanceKey('studio-ania')),null);
});
test('A broken source contract cannot silently become a legacy view',()=>{
 const rows=structuredClone(viewContract('players'));
 assert.throws(()=>validateViewContract('players',[...rows,rows[0]]),/Duplicate/);
 rows.find(row=>row.id==='player-grid').parent='not-declared';
 assert.throws(()=>validateViewContract('players',rows),/Unknown component parent/);
 assert.throws(()=>validateViewContract('invented'),/Missing/);
});
test('New consumers resolve the V2 central branch once and freeze its SHA',async()=>{
 let requested;
 const source=await pinnedContentSource({fetcher:async url=>{requested=url;return {ok:true,json:async()=>({sha:'b'.repeat(40)})};}});
 assert.equal(CENTRAL_DESIGN_BRANCH,base.branch);
 assert.ok(requested.endsWith(encodeURIComponent(base.branch)));
 assert.ok(source.endsWith('b'.repeat(40)+'/'));
});

test('Migrated view families retain the shared appearance and mission copy cascade',()=>{
 const config={elementStyles:{'container-setup-form':{gap:7},'container-card':{radius:21}},familyStyles:{flags:{'text-mission-hint':{text:'Podróż dookoła świata.'}}}};
 assert.equal(visualValue(config,'flags-settings',{id:'setup-form',recipe:'family-game-setup',kind:'container'}).gap,7);
 assert.equal(visualValue(config,'flags-initial',{id:'game-question',recipe:'family-game-question',kind:'container'}).radius,21);
 assert.equal(visualValue(config,'flags-settings',{id:'mission-copy',recipe:'text-mission-copy',kind:'text',mode:'flags'}).text,'Podróż dookoła świata.');
});

test('Repeated result attempts keep distinct identities through grouping and reordering',()=>{
 const records=[{word:'róża',at:'2026-10-16T10:01:00Z'},{word:'ucho'},{word:'róża',at:'2026-10-16T10:02:00Z'}];
 const rows=identifyResultAttempts(records),reordered=identifyResultAttempts([...records].reverse());
 assert.equal(new Set(rows.map(r=>r.resultKey)).size,3);
 assert.equal(rows[1].resultKey,'ucho');
 for(const row of rows)assert.equal(reordered.find(r=>r.word===row.word&&r.at===row.at).resultKey,row.resultKey);
 assert.equal(new Set(identifyResultAttempts(Array.from({length:14},()=>({word:'róża'}))).map(r=>r.resultKey)).size,14);
});
