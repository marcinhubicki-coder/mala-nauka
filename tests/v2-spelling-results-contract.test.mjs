import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {viewContract,validateViewContract,compileViewMarkup,viewAttrs} from '../shared/view-contracts.mjs';
import {PART_BY_ID} from '../shared/structure-model.mjs';
const ids=['spelling-results','spelling-rule'];
test('Results and educational rule modal reuse one 18-piece results family',()=>{
 const base=viewContract('spelling-results');
 assert.equal(base.length,18);
 for(const view of ids){
  assert.equal(validateViewContract(view),true);
  assert.deepEqual(viewContract(view).map(x=>x.id),base.map(x=>x.id));
  for(const block of viewContract(view))assert.ok(PART_BY_ID[block.recipe],block.recipe);
 }
 assert.equal(base.filter(x=>x.level==='family').length,1);
 assert.equal(base.find(x=>x.id==='spelling-result-repeat').kind,'container');
 assert.equal(base.find(x=>x.id==='spelling-result-history').action,'history');
 assert.equal(base.filter(x=>x.action==='toggle-result').length,2);
});
test('Results action hierarchy is independent; one can be styled or moved without remounting the other',()=>{
 const items=viewContract('spelling-results');
 const html=items.map(item=>'<div '+viewAttrs('spelling-results',item.id)+(item.action?' data-action="'+item.action+'"':'')+'></div>').join('');
 assert.equal((compileViewMarkup('spelling-results',html).match(/data-ds-contract="v2"/g)||[]).length,18);
 assert.notEqual(items.find(x=>x.id==='spelling-result-repeat').parent,'spelling-result-history');
 assert.notEqual(items.find(x=>x.id==='spelling-result-history').parent,'spelling-result-repeat');
 assert.throws(()=>compileViewMarkup('spelling-results',html.replace('data-action="history"','data-action="repeat"')),/Action mismatch/);
});
test('Result renderer uses one compiled family and preserves legacy rendering for other modes',()=>{
 const src=readFileSync(new URL('../ortografia/result-screen.mjs',import.meta.url),'utf8');
 assert.match(src,/root\.innerHTML=spelling\?compileViewMarkup\('spelling-results',resultMarkup\):resultMarkup/);
 for(const id of ['spelling-result-root','spelling-result-back','spelling-result-review-panel','spelling-result-retained','spelling-result-review','spelling-result-repeat','spelling-result-history']){
  assert.ok(src.includes(id),id);
 }
 assert.match(src,/attrs\('spelling-result-repeat'\)/);
 assert.match(src,/attrs\('spelling-result-history'\)/);
});
