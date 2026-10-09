import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {partLevel,PART_BY_ID,structureCatalog,viewParts} from '../shared/structure-model.mjs';
import {librarySections,previewScale,PREVIEW_DEVICE,viewIcon,MODE_ICONS,studioIcon} from '../design-system/studio-ui.mjs';
import {jellyChoices} from '../design-system/studio-jelly.mjs';
const registry=JSON.parse(await readFile(new URL('../design-system/registry.json',import.meta.url)));

test('buttons stay atomic in the library and runtime hierarchy, retaining their editable composition',()=>{
 for(const id of ['button-main','button-answer','button-home-card','button-avatar-choice','button-player-card'])assert.equal(PART_BY_ID[id].level,'atom');
 const items=[{id:'layout-root'},{id:'new-action',recipe:'button-new-action',kind:'button',parent:'layout-root',label:'Nowa akcja'},{id:'action-copy',recipe:'text-action-copy',kind:'text',parent:'new-action',label:'Tekst'}];
 assert.equal(partLevel(items[1],items),'atom');
 const parts=viewParts(registry.views[0],{items});assert.equal(parts[0].level,'atom');assert.equal(parts[0].children[0].recipe,'text-action-copy');
 assert.equal(PART_BY_ID['control-pin'].level,'group','PIN remains a composed variant of the Jelly atom');
});
test('each library level has only its own blocks; folding details loses no recipes',()=>{
 const catalog=structureCatalog(registry);
 for(const level of ['atom','group','family']){
  const rows=librarySections(catalog,level).flatMap(s=>s.rows),expected=catalog.filter(p=>p.level===level);
  assert.deepEqual(new Set(rows.map(p=>p.id)),new Set(expected.map(p=>p.id)));assert.equal(rows.length,expected.length);
  assert.ok(rows.every(row=>row.level===level));
 }
 const sections=librarySections(catalog,'atom');
 assert.ok(sections.find(s=>s.id==='objects').rows.some(p=>p.id==='button-main'));
 assert.ok(sections.find(s=>s.id==='graphics').rows.some(p=>p.id==='image-mn-soap-picture'));
 assert.ok(sections.find(s=>s.id==='details').rows.some(p=>p.id==='jelly-option'));
});
test('device previews fit their available area, including mobile and side-by-side comparisons',()=>{
 for(const [width,height,options] of [[900,950,{}],[330,470,{}],[740,600,{columns:2,paddingX:28,paddingY:42}],[100,100,{}]]){
  const scale=previewScale(width,height,options),columns=options.columns||1;
  assert.ok(scale<=1&&scale>=0);
  assert.ok(PREVIEW_DEVICE.width*scale*columns+(columns-1)*(options.gap??18)<=width-(options.paddingX??24)+.001);
  assert.ok(PREVIEW_DEVICE.height*scale<=height-(options.paddingY??24)+.001);
 }
 assert.equal(previewScale(0,0),0);
});
test('navigation symbols match modes and states, including the previously ambiguous incorrect state',()=>{
 assert.equal(new Set(Object.values(MODE_ICONS)).size,5);
 for(const [view,icon] of [[{id:'home',state:'initial'},'home'],[{id:'players',state:'initial'},'users'],[{id:'player-pin'},'lock'],[{state:'incorrect'},'sad'],[{id:'math-results',state:'initial'},'trophy']])assert.equal(viewIcon(view),icon);
 assert.notEqual(studioIcon('music'),studioIcon('spark'));
});
test('shared Jelly controls expose accessible names for both labeled and icon-only navigation',()=>{
 for(const iconOnly of [true,false]){
  const markup=jellyChoices('sample','Wybierz',[['atom','Atomy','atom'],['group','Grupy','layers']],'group',{icons:true,iconOnly});
  assert.match(markup,/role="radiogroup" aria-label="Wybierz"/);assert.match(markup,/value="group" aria-label="Grupy" checked/);
  assert.match(markup,/value="atom" aria-label="Atomy"/);
 }
});
