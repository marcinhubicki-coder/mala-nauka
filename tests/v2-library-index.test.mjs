import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {libraryIndexReport,fetchLibraryIndexes} from '../design-system/library-index.mjs';
import {validateAssets} from '../design-system/validation.mjs';
const current=JSON.parse(readFileSync(new URL('../design-system/assets.json',import.meta.url),'utf8'));
test('library index is unique by content, not just path',()=>{
 assert.equal(validateAssets(current),current);
 const duplicate=structuredClone(current);
 duplicate.assets.push({...duplicate.assets[0],path:'assets/managed/copy-test.webp'});
 assert.throws(()=>validateAssets(duplicate),/Zduplikowana zawartość SHA-256/);
});
test('remote scene manifest detects missing and altered published content',()=>{
 const same=structuredClone(current);
 assert.deepEqual(libraryIndexReport(current,same,current).issues,[]);
 const scene=same.assets.find(a=>a.group==='scenes');scene.sha='0'.repeat(64);
 assert.match(libraryIndexReport(current,same,current).issues.join('\n'),/Inna wersja sceny/);
 same.assets=same.assets.filter(a=>a.path!==scene.path);
 assert.match(libraryIndexReport(current,same,current).issues.join('\n'),/Scena niedostępna/);
});
test('published and current index are read independently without copying images',async()=>{
 const calls=[],fetcher=async (url,options)=>{
  calls.push({url,cache:options.cache});
  return {ok:true,json:async()=>structuredClone(current)};
 };
 const result=await fetchLibraryIndexes(fetcher);
 assert.deepEqual(libraryIndexReport(result.current,result.archive,current).issues,[]);
 assert.equal(calls.length,2);assert.ok(calls.every(r=>r.cache==='no-store'));
 assert.ok(calls.some(r=>r.url.includes('assets/library-v1/')));
 assert.ok(calls.some(r=>r.url.includes('refactor/v2-parity-first/')));
});
