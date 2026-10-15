import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runtimeCatalog,semanticCatalog} from '../shared/runtime-blocks.mjs';
import {inventorySnapshot} from '../design-system/view-inventory-snapshots.mjs';
const registry=JSON.parse(readFileSync(new URL('../design-system/registry.json',import.meta.url),'utf8'));
const raw=runtimeCatalog(registry,new Map(registry.views.map(v=>[v.id,{items:inventorySnapshot(v)}])));
const semantic=semanticCatalog(raw);
test('Library groups registered recipes without losing any screen instance',()=>{
 assert.ok(semantic.length<=raw.length); // source identities are already shared
 for(const item of raw){
  const group=semantic.find(x=>x.variants.includes(item.id));
  assert.ok(group,item.id);
  for(const use of item.uses)assert.ok(group.uses.some(u=>u.view===use.view&&u.id===use.id),use.view+'/'+use.id);
 }
});
test('One BackButton concept retains all real BackButton instances',()=>{
 const back=semantic.filter(row=>row.id==='button-back');
 assert.equal(back.length,1);
 assert.equal(back[0].uses.length,33);
 assert.equal(back[0].variants.length,1); // no structural-hash variants remain
 assert.equal(back[0].registered,true);
});
test('Primary library remains focused; all technical elements are retained',()=>{
 const shared=semantic.filter(row=>row.registered&&new Set(row.uses.map(x=>x.view)).size>=2);
 assert.ok(shared.length>=30&&shared.length<=100);
 assert.ok(semantic.some(row=>row.kind==='text'));
 assert.ok(!shared.some(row=>row.recipe==='text'||row.recipe==='image'));
 const art=raw.filter(row=>row.kind==='image');
 assert.ok(art.some(row=>row.uses.length>=5));
 assert.ok(raw.every(row=>row.id.startsWith('screen-')||row.id==='block-'+row.recipe));
});
