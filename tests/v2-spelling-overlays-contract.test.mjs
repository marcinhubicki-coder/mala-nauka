import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPELLING_OVERLAYS,overlayAttrs,validateSpellingOverlay,hydrateSpellingOverlay} from '../shared/spelling-overlays.mjs';
import {PART_BY_ID} from '../shared/structure-model.mjs';
test('Hint, pause and rule reuse one dialog family; 5/5/10 stable inner blocks',()=>{
 assert.deepEqual(Object.fromEntries(Object.entries(SPELLING_OVERLAYS).map(([name,rows])=>[name,rows.length])),{hint:5,pause:5,rule:10});
 for(const [type,rows] of Object.entries(SPELLING_OVERLAYS)){
  assert.equal(validateSpellingOverlay(type),true);
  assert.equal(rows[0].recipe,'family-education-popup');
  assert.equal(rows.filter(x=>x.level==='family').length,1);
  for(const row of rows){
   assert.ok(PART_BY_ID[row.recipe],row.recipe);
   assert.match(overlayAttrs(type,row.id),new RegExp('data-ds-key="'+row.id+'"'));
  }
 }
});
test('Pause dialog keeps independent return and exit actions across confirmation variants',()=>{
 const rows=SPELLING_OVERLAYS.pause;
 assert.deepEqual(rows.find(row=>row.id==='pause-end').variantActions,{pause:'exit',exit:'exit-confirm'});
 for(const variant of ['pause','exit']){
  const nodes=rows.map(row=>({dataset:{dsKey:row.id,dsRecipe:row.recipe,dsKind:row.kind,...(row.action?{action:row.id==='pause-end'&&variant==='exit'?'exit-confirm':row.action}:{})}}));
  const root={...nodes[0],querySelectorAll:()=>nodes.slice(1)};
  assert.equal(hydrateSpellingOverlay(root,'pause',{variant}),5);
  assert.ok(nodes.every(node=>node.dataset.dsSubcontract==='spelling-pause'));
  assert.equal(nodes.find(row=>row.dataset.dsKey==='pause-resume').dataset.action,'resume');
 }
});
test('Overlay renderers are in-place component groups, not duplicate screen templates',()=>{
 const art=readFileSync(new URL('../spelling/art.mjs',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const rules=readFileSync(new URL('../ortografia/result-rules.mjs',import.meta.url),'utf8');
 assert.match(art,/hydrateSpellingOverlay\(hint,'hint'\)/);
 assert.match(app,/hydrateSpellingOverlay\(modal,'pause'/);
 assert.match(rules,/hydrateSpellingOverlay\(dialog,'rule'\)/);
});
