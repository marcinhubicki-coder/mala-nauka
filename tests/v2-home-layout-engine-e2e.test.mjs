import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {planLayoutEdit,inspectHomeLayout} from '../tools/studio-engine.mjs';
test('Engine plans a single Home geometry edit with unchanged siblings',()=>{
 const base={layoutOverrides:{home:{}}};
 const planned=planLayoutEdit(base,{id:'home-mode-spelling',geometry:{x:34,w:255}});
 assert.deepEqual(planned.change.rect,[34,1140,255,215]);
 assert.deepEqual(inspectHomeLayout(planned.config,'home-mode-math').rect,[299.5,1140,254,215]);
 assert.deepEqual(base,{layoutOverrides:{home:{}}});
 assert.throws(()=>planLayoutEdit({}, {id:'home-mode-spelling',geometry:{h:2000}}),/outside/);
});
test('Headless Studio actually writes and resets a layout change using CLI',()=>{
 const dir=mkdtempSync(join(tmpdir(),'mn-studio-'));
 const file=join(dir,'config.json'),tool=new URL('../tools/studio-engine.mjs',import.meta.url).pathname;
 try{
  writeFileSync(file,JSON.stringify({layoutOverrides:{home:{}}}));
  const result=execFileSync(process.execPath,[tool,'set-layout','--config',file,'--id','home-mode-spelling','--x','34','--w','255','--apply'],{encoding:'utf8'});
  assert.match(result,/APPLIED/);
  assert.deepEqual(JSON.parse(readFileSync(file,'utf8')).layoutOverrides.home['home-mode-spelling'],{x:34,w:255});
  execFileSync(process.execPath,[tool,'set-layout','--config',file,'--id','home-mode-spelling','--reset','--apply']);
  assert.deepEqual(JSON.parse(readFileSync(file,'utf8')).layoutOverrides.home,{});
 }finally{rmSync(dir,{recursive:true,force:true});}
});
