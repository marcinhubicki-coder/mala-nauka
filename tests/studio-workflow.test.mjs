import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STUDIO_SECTIONS,findSections,sectionFromHash,navigationHTML,startHTML} from '../design-system/studio-workflow.mjs';
import {atomicCatalog,ATOMIC_LEVELS} from '../design-system/atomic-model.mjs';
const registry=JSON.parse(await readFile(new URL('../design-system/registry.json',import.meta.url)));
test('all tools remain reachable in grouped navigation and task shortcuts resolve',()=>{
 const markup=navigationHTML(()=>'<svg></svg>'),ids=STUDIO_SECTIONS.map(s=>s.id);assert.equal(new Set(ids).size,ids.length);
 for(const id of ids)assert.ok(markup.includes(`data-page="${id}"`));
 for(const [,id]of startHTML().matchAll(/data-studio-open="([^"]+)"/g))assert.ok(ids.includes(id));
 assert.equal(sectionFromHash('#sound'),'sound');assert.equal(sectionFromHash('#missing'),'start');
});
test('search supports Polish without accents, task descriptions and hidden tools',()=>{
 assert.ok(findSections('dzwiek').some(s=>s.id==='sound'));assert.ok(findSections('PIN').some(s=>s.id==='components'));
 assert.ok(findSections('font').some(s=>s.id==='fonts'));assert.ok(!findSections('font',['fonts']).some(s=>s.id==='fonts'));assert.equal(findSections('zzzzzz').length,0);
});
test('atomic map covers all five levels and every concrete page has a template',()=>{
 const before=JSON.stringify(registry),catalog=atomicCatalog(registry),ids=new Set(catalog.map(p=>p.id));
 for(const l of ATOMIC_LEVELS)assert.ok(catalog.some(p=>p.atomicLevel===l.id),l.id);
 assert.equal(catalog.filter(p=>p.atomicLevel==='page').length,registry.views.length);
 for(const p of catalog.filter(p=>p.atomicLevel==='page'))assert.ok(ids.has(p.template));
 assert.equal(catalog.find(p=>p.id==='container-player-form-card').atomicLevel,'organism');
 assert.equal(catalog.find(p=>p.id==='container-field-title').atomicLevel,'molecule');
 assert.equal(catalog.find(p=>p.id==='button-player-card').atomicLevel,'molecule');
 assert.equal(JSON.stringify(registry),before);
});
import {deferredWriter} from '../design-system/studio-state.mjs';
import {StudioTesting} from '../design-system/studio-testing.mjs';
test('rapid slider edits coalesce draft writes and flushing saves the newest state',()=>{
 let callback=null,writes=0,current=0,saved=null,cancelled=0;
 const writer=deferredWriter(()=>{writes++;saved=current;},{schedule:fn=>{callback=fn;return 1;},cancel:()=>cancelled++});
 for(let i=1;i<=100;i++){current=i;writer.request();}assert.equal(writes,0);callback();assert.equal(writes,1);assert.equal(saved,100);
 writer.flush();assert.equal(writes,1);current=101;writer.request();writer.flush();assert.equal(saved,101);assert.equal(writes,2);assert.equal(cancelled,2);
});
test('result scenarios retain distinct states and selection on panel re-entry',()=>{
 const old=globalThis.location;globalThis.location={origin:'https://example.test',href:'https://example.test/design-system/'};
 try{
  const workspace={addEventListener(){},innerHTML:''};const studio=new StudioTesting({workspace,registry});
  const rows=studio.groups().flatMap(g=>g.rows);assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
  const completed=rows.find(r=>r.label==='Ukończona kolekcja');studio.current=completed.id;studio.render();
  assert.ok(workspace.innerHTML.includes(`data-test-id="${completed.id.replaceAll('&','&amp;')}"`));assert.ok(workspace.innerHTML.includes('state=completed'));
  assert.ok(workspace.innerHTML.includes('Wyniki i suma'));
  studio.test={githubUrl:'https://github.com/example/test',report:{hidden:[]}};studio.testUrl='https://example.test/pwa';studio.status='Gotowe';studio.render();
  assert.ok(workspace.innerHTML.includes('href="https://example.test/pwa"'));assert.ok(workspace.innerHTML.includes('role=status>Gotowe'));
 }finally{globalThis.location=old;}
});
