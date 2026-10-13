import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VIEW_SNAPSHOT_IDS,inventorySnapshot} from '../design-system/view-inventory-snapshots.mjs';
import {findEditableBlock,planStyleEdit} from '../tools/studio-engine.mjs';
const registry=JSON.parse(readFileSync(new URL('../design-system/registry.json',import.meta.url),'utf8'));
test('All 41 browser-rendered screens have deterministic inventory snapshots',()=>{
 assert.equal(VIEW_SNAPSHOT_IDS.length,41);
 assert.deepEqual(new Set(VIEW_SNAPSHOT_IDS),new Set(registry.views.map(v=>v.id)));
 let count=0;
 for(const v of registry.views){
  const items=inventorySnapshot(v);assert.ok(items?.length>1,v.id);
  const ids=new Set(items.map(row=>row.id));assert.equal(ids.size,items.length,v.id);
  assert.ok(ids.has('layout-root'),v.id);
  for(const item of items){if(item.id!=='layout-root')assert.ok(ids.has(item.parent),v.id+'/'+item.id+' missing '+item.parent);assert.ok(item.recipe&&item.blockId&&item.kind,v.id+'/'+item.id);}
  count+=items.length;
 }
 assert.ok(count>=1700,'Inventory coverage unexpectedly fell');
});
test('Legacy renderer elements can be edited by stable audited view IDs',()=>{
 const items=inventorySnapshot(registry.views.find(v=>v.id==='spelling-results'));
 const back=items.find(item=>item.recipe==='button-back');assert.ok(back);
 const block=findEditableBlock('spelling-results',back.id);
 assert.equal(block.legacyAdapter,true);
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
