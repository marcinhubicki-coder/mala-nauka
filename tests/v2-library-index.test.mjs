import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {libraryIndexReport,fetchLibraryIndexes,validatePublishedCatalog} from '../design-system/library-index.mjs';
import {validateAssets} from '../design-system/validation.mjs';
const current=JSON.parse(readFileSync(new URL('../design-system/assets.json',import.meta.url),'utf8'));
const published=index=>({schemaVersion:1,sourceCommit:'e'.repeat(40),files:index.assets.map(a=>({path:a.path,size:a.size,sha256:a.sha}))});
test('asset manifest rejects duplicated canonical hashes',()=>{
 assert.equal(validateAssets(current),current);
 const duplicate=structuredClone(current);duplicate.assets.push({...duplicate.assets[0],path:'assets/managed/copy-test.webp'});
 assert.throws(()=>validateAssets(duplicate),/Zduplikowana zawartość SHA-256/);
});
test('published catalog identifies missing and changed CDN images',()=>{
 const archive=published(current);assert.deepEqual(libraryIndexReport(current,archive,current).issues,[]);
 const record=archive.files.find(a=>a.path.startsWith('assets/scenes/'));
 record.sha256='0'.repeat(64);
 assert.match(libraryIndexReport(current,archive,current).issues.join('\n'),/Niezgodna zawartość na CDN/);
 archive.files=archive.files.filter(a=>a.path!==record.path);
 assert.match(libraryIndexReport(current,archive,current).issues.join('\n'),/Brak opublikowanego pliku/);
});
test('remote index uses CDN bytes manifest, no image downloads',async()=>{
 const calls=[],fetcher=async(url,options)=>{
  calls.push(url);return {ok:true,json:async()=>url.includes('asset-catalog')?published(current):structuredClone(current)};
 };
 const result=await fetchLibraryIndexes(fetcher);
 assert.deepEqual(libraryIndexReport(result.current,result.archive,current).issues,[]);
 assert.equal(calls.length,2);
 assert.ok(calls.some(u=>u.includes('mala-nauka-assets.vercel.app/asset-catalog.json')));
 assert.ok(calls.some(u=>u.includes('refactor/v2-parity-first/')));
 assert.equal(validatePublishedCatalog(result.archive),result.archive);
});
