import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {viewContract,viewAttrs,viewKey,validateViewContract,compileViewMarkup,staticViewInventory} from '../shared/view-contracts.mjs';
import {PART_BY_ID} from '../shared/structure-model.mjs';
const items=viewContract('math-settings');
test('Maths settings contains four duration buttons, four category buttons and independent start/back',()=>{
 assert.equal(validateViewContract('math-settings'),true);
 assert.equal(items.length,17);
 assert.deepEqual(items.filter(row=>row.action==='choose-duration').map(row=>row.id),[60,120,180,300].map(x=>'math-duration-'+x));
 assert.deepEqual(items.filter(row=>row.action==='choose-category').map(row=>row.id),['add','subtract','multiply','divide'].map(x=>'math-category-'+x));
 assert.ok(items.every(row=>PART_BY_ID[row.recipe]),'Unknown Math component recipe');
 assert.equal(items.filter(row=>row.kind==='button').length,10);
 assert.equal(staticViewInventory('math-settings').length,18);
 assert.equal(viewKey('math-settings','math-back'),'data-ds-key="math-back"');
 assert.throws(()=>viewAttrs('math-settings','phantom'),/Unknown component/);
});
test('Maths entrypoint uses compiler; visual choices stay discrete buttons',()=>{
 const src=readFileSync(new URL('../matematyka/app.js',import.meta.url),'utf8');
 assert.match(src,/compileViewMarkup\('math-settings'/);
 assert.match(src,/viewAttrs\('math-settings','math-duration-'\+duration\)/);
 assert.match(src,/viewAttrs\('math-settings','math-category-'\+item.key\)/);
 assert.match(src,/data-action="choose-duration"/);
 assert.match(src,/data-action="choose-category"/);
});
test('Maths compiler detects missing action independently',()=>{
 const html=items.map(item=>'<div '+viewAttrs('math-settings',item.id)+(item.action?' data-action="'+item.action+'"':'')+'></div>').join('');
 const result=compileViewMarkup('math-settings',html);
 assert.equal((result.match(/data-ds-contract="v2"/g)||[]).length,17);
 assert.throws(()=>compileViewMarkup('math-settings',html.replace('data-action="choose-category"','data-action="not-category"')),/Action mismatch/);
});
