import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {planDesignBatch} from '../tools/studio-engine.mjs';
const steps=[
 {type:'recipe',recipe:'button-back',property:'radius',value:23},
 {type:'style',view:'spelling-results',id:'navigation-back-result-back',property:'radius',value:18},
 {type:'style',view:'english-settings',id:'navigation-back-home',property:'radius',value:20},
 {type:'layout',id:'home-mode-spelling',geometry:{x:34}},
 {type:'route',from:'players',action:'enter-player',to:'progress'}
];
test('Batch can change five independent controls in one plan',()=>{
 const initial={elementStyles:{},elementOverrides:{},layoutOverrides:{home:{}},navigation:{routes:{}}};
 const x=planDesignBatch(initial,steps);
 assert.equal(x.changes.length,5);assert.equal(x.config.elementStyles['button-back'].radius,23);
 assert.equal(x.config.elementOverrides['spelling-results']['navigation-back-result-back'].radius,18);
 assert.equal(x.config.elementOverrides['english-settings']['navigation-back-home'].radius,20);
 assert.equal(x.config.layoutOverrides.home['home-mode-spelling'].x,34);
 assert.equal(x.config.navigation.routes['players--enter-player'],'progress');
 assert.deepEqual(initial.elementOverrides,{});
});
test('Bad final batch operation rejects all earlier edits without mutating input',()=>{
 const initial={elementStyles:{},elementOverrides:{},layoutOverrides:{home:{}}};
 assert.throws(()=>planDesignBatch(initial,[...steps.slice(0,3),{type:'recipe',recipe:'unknown',property:'radius',value:20}]),/step 4 rejected/);
 assert.deepEqual(initial.elementStyles,{});
});
test('CLI preview, write and rollback on rejected batch work against actual files',()=>{
 const dir=mkdtempSync(join(tmpdir(),'mn-batch-')),file=join(dir,'config.json'),changes=join(dir,'changes.json');
 const exe=new URL('../tools/studio-engine.mjs',import.meta.url).pathname;
 const run=(...extra)=>execFileSync(process.execPath,[exe,'batch','--config',file,'--changes',changes,...extra],{encoding:'utf8'});
 try{
  const original={elementStyles:{},elementOverrides:{},layoutOverrides:{home:{}},navigation:{routes:{}}};
  writeFileSync(file,JSON.stringify(original));writeFileSync(changes,JSON.stringify(steps));
  assert.match(run(),/DRY RUN/);assert.deepEqual(JSON.parse(readFileSync(file,'utf8')),original);
  assert.match(run('--apply'),/APPLIED/);const saved=JSON.parse(readFileSync(file,'utf8'));
  writeFileSync(changes,JSON.stringify([...steps,{type:'recipe',recipe:'nonexistent',property:'radius',value:12}]));
  assert.throws(()=>run('--apply'),/step 6 rejected/);
  assert.deepEqual(JSON.parse(readFileSync(file,'utf8')),saved);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
