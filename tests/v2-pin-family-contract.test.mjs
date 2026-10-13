import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {viewContract,viewAttrs,validateViewContract,compileViewMarkup,staticViewInventory} from '../shared/view-contracts.mjs';
import {PART_BY_ID} from '../shared/structure-model.mjs';
const contract=view=>viewContract(view);
test('PIN setup and PIN unlock share the same 8 atomic/group/family responsibilities',()=>{
 for(const view of ['player-pin','player-unlock']){
  assert.equal(validateViewContract(view),true);
  assert.equal(contract(view).length,8);
  assert.equal(contract(view).filter(row=>row.level==='family').length,1);
  assert.ok(contract(view).every(row=>PART_BY_ID[row.recipe]),view);
  assert.deepEqual(contract(view).map(row=>row.id),['pin-back','pin-page-title','pin-card','pin-profile','pin-avatar','pin-nickname','pin-fields','pin-error']);
  assert.equal(staticViewInventory(view).length,9);
 }
 assert.deepEqual(contract('player-pin').map(x=>x.recipe),contract('player-unlock').map(x=>x.recipe));
 assert.deepEqual(contract('player-pin')[0].variantActions,{create:'edit-player',edit:'settings',delete:'settings'});
 assert.equal(contract('player-unlock')[0].action,'players');
});
test('PIN renderer validates correct back action for each state without multiplying components',()=>{
 for(const [view,variant,back] of [['player-pin','create','edit-player'],['player-pin','edit','settings'],['player-pin','delete','settings'],['player-unlock','unlock','players']]){
  const html=contract(view).map(item=>'<div '+viewAttrs(view,item.id)+(item.id==='pin-back'?' data-action="'+back+'"':'')+'></div>').join('');
  const compiled=compileViewMarkup(view,html,{variant});
  assert.equal((compiled.match(/data-ds-contract="v2"/g)||[]).length,8);
  assert.match(compiled,/data-ds-element="pin-avatar"/);
  assert.match(compiled,/data-ds-element="pin-fields"/);
  assert.throws(()=>compileViewMarkup(view,html.replace('data-action="'+back+'"','data-action="wrong"'),{variant}),/Action mismatch/);
 }
});
test('PIN renderer keeps structural contract outside dynamic dots and keypad',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(app,/const contractView=purpose==='unlock'\?'player-unlock':'player-pin'/);
 assert.match(app,/root\.innerHTML=compileViewMarkup\(contractView,markup,\{variant:purpose\}\)/);
 assert.match(app,/const fields=root\.querySelector\('\.pin-fields'\)/);
 assert.match(app,/if\(changed\)\{pinInput='';pinError='';renderPinFields\(true\);\}/);
 assert.match(app,/const dots=fields\.querySelector\('\.pin-dots'\)/);
 assert.ok(!app.includes('root.innerHTML=pageHead(deleting?'));
});
