import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VIEW_SNAPSHOT_IDS,inventorySnapshot} from '../design-system/view-inventory-snapshots.mjs';
import {viewContract} from '../shared/view-contracts.mjs';
import {findEditableBlock,planStyleEdit} from '../tools/studio-engine.mjs';
const registry=JSON.parse(readFileSync(new URL('../design-system/registry.json',import.meta.url),'utf8'));
test('All registered renderer contracts have a derived, deterministic fixture inventory',()=>{
 assert.equal(VIEW_SNAPSHOT_IDS.length,45);
 assert.deepEqual(new Set(VIEW_SNAPSHOT_IDS),new Set(registry.views.map(v=>v.id)));
 let count=0;
 for(const v of registry.views){
  const items=inventorySnapshot(v);assert.ok(items?.length>1,v.id);
  const ids=new Set(items.map(row=>row.id));assert.equal(ids.size,items.length,v.id);
  assert.ok(ids.has('layout-root'),v.id);
  for(const item of items){if(item.id!=='layout-root')assert.ok(ids.has(item.parent),v.id+'/'+item.id+' missing '+item.parent);assert.ok(item.recipe&&item.blockId&&item.kind,v.id+'/'+item.id);}
  count+=items.length;
 }
 assert.ok(count>=1300,'Declared fixture coverage unexpectedly fell');
});
test('Compiled renderer elements are edited by their declared view IDs',()=>{
 const items=viewContract('spelling-results');
 const back=items.find(item=>item.recipe==='button-back');assert.ok(back);
 const block=findEditableBlock('spelling-results',back.id);
 assert.equal(block.legacyAdapter,false);
 const original={elementOverrides:{}};
 const change=planStyleEdit(original,{view:'spelling-results',id:back.id,property:'radius',value:26});
 assert.equal(change.config.elementOverrides['spelling-results'][back.id].radius,26);
 assert.equal(original.elementOverrides['spelling-results'],undefined);
 assert.equal(findEditableBlock('invented-view','button-back'),null);
});
test('Studio library starts with audit snapshots without hidden iframe scan of registered screens',()=>{
 const src=readFileSync(new URL('../design-system/runtime-catalog.mjs',import.meta.url),'utf8');
 assert.match(src,/inventorySnapshot\(view\)/);
 assert.match(src,/this.owner.acceptInventory\(view.id,rows\)/);
});
