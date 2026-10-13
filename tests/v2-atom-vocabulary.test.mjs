import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {semanticCatalog,runtimeCatalog} from '../shared/runtime-blocks.mjs';
import {ATOM_TYPE_IDS,ATOM_TYPES,atomTypeFor,countDesignConcepts} from '../shared/atom-vocabulary.mjs';
import {TYPE_STYLE_IDS} from '../shared/type-system.mjs';
import {inventorySnapshot} from '../design-system/view-inventory-snapshots.mjs';
const registry=JSON.parse(readFileSync(new URL('../design-system/registry.json',import.meta.url),'utf8'));
const original=runtimeCatalog(registry,new Map(registry.views.map(view=>[view.id,{items:inventorySnapshot(view)}])));
const grouped=semanticCatalog(original);
test('Thirteen base atom responsibilities, ten type styles, no H1-H9 duplicate text atoms',()=>{
 assert.equal(ATOM_TYPE_IDS.length,13);
 assert.equal(TYPE_STYLE_IDS.length,10);
 assert.equal(Object.values(ATOM_TYPES).filter(x=>x.kind==='text').length,3);
 assert.equal(atomTypeFor({kind:'text',recipe:'text-home-headline'}),'text');
 assert.equal(atomTypeFor({kind:'button',recipe:'button-back'}),'button');
 assert.equal(atomTypeFor({kind:'toggle',recipe:'control-slider'}),'slider');
 assert.equal(atomTypeFor({kind:'container',level:'group'}),null);
});
test('Semantic hierarchy references only existing canonical children, never itself',()=>{
 const ids=new Set(grouped.map(x=>x.id));
 for(const row of grouped){
  for(const child of row.children){
   assert.ok(ids.has(child),'Unknown child '+child+' of '+row.id);
   assert.notEqual(child,row.id);
  }
 }
});
test('Grouping does not drop use-level edit identities or independent actions',()=>{
 for(const row of original){
  const matches=grouped.filter(x=>x.variants.includes(row.id));
  assert.equal(matches.length,1,row.id);
  for(const use of row.uses)assert.ok(matches[0].uses.some(item=>item.id===use.id&&item.view===use.view),row.id);
 }
 assert.equal(grouped.filter(x=>x.recipe==='button-back').length,1);
 const vocab=countDesignConcepts(grouped);
 assert.equal(vocab.atomVocabulary,13);
 assert.ok(vocab.sharedBuildingBlocks>=40&&vocab.sharedBuildingBlocks<=90);
 assert.ok(vocab.groups>0&&vocab.families>0);
});
