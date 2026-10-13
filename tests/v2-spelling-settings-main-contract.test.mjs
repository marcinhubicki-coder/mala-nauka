import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPELLING_SETTINGS_CONTRACT,spellingAttrs,validateSpellingSettingsContract} from '../shared/spelling-settings-contract.mjs';
import {viewContract,validateViewContract,hydrateViewContract} from '../shared/view-contracts.mjs';
import {PART_BY_ID} from '../shared/structure-model.mjs';
const blocks=viewContract('spelling-settings');
test('Orthography wizard shares exactly one complete 29-block contract with Studio',()=>{
 assert.equal(validateSpellingSettingsContract(),true);
 assert.equal(validateViewContract('spelling-settings'),true);
 assert.equal(blocks.length,29);
 assert.equal(Object.keys(SPELLING_SETTINGS_CONTRACT).length,blocks.length);
 assert.deepEqual(new Set(blocks.map(x=>x.id)),new Set(Object.keys(SPELLING_SETTINGS_CONTRACT)));
 for(const row of blocks){assert.ok(PART_BY_ID[row.recipe],row.recipe);assert.match(spellingAttrs(row.id.replace(/^spelling-/,'')),new RegExp('data-ds-key="'+row.id+'"'));}
 assert.equal(blocks.find(x=>x.id==='spelling-back').action,'home');
 assert.equal(blocks.find(x=>x.id==='spelling-start').action,'submit-setup');
 assert.equal(blocks.filter(x=>x.level==='atom').length,19);
});
test('DOM hydration preserves existing jelly controls rather than remounting their subtree',()=>{
 const nodes=blocks.map(row=>({dataset:{dsKey:row.id,dsRecipe:row.recipe,dsKind:row.kind,...(row.action?{action:row.action}:{})}}));
 const root={querySelectorAll:selector=>{assert.equal(selector,'[data-ds-key]');return nodes;}};
 const before=nodes.slice();
 assert.equal(hydrateViewContract(root,'spelling-settings'),29);
 for(let i=0;i<nodes.length;i++){
  assert.equal(nodes[i],before[i]);
  assert.equal(nodes[i].dataset.dsElement,blocks[i].id);
  assert.equal(nodes[i].dataset.dsContract,'v2');
 }
 assert.equal(hydrateViewContract(root,'spelling-settings'),29);
 const without=nodes.filter(x=>x.dataset.dsKey!=='spelling-start');
 assert.throws(()=>hydrateViewContract({querySelectorAll:()=>without},'spelling-settings'),/Incomplete mounted contract/);
});
test('Spelling's runtime never loads a DOM classifier while the jelly form is mounting',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const wizard=readFileSync(new URL('../ortografia/wizard-v2.mjs',import.meta.url),'utf8');
 const runtime=readFileSync(new URL('../shared/design-runtime.mjs',import.meta.url),'utf8');
 assert.match(app,/dsContractPending='spelling-settings'/);
 assert.match(wizard,/hydrateViewContract\(root,'spelling-settings'\)/);
 assert.match(runtime,/root\.dataset\.dsContractPending==='spelling-settings'\)return/);
});
