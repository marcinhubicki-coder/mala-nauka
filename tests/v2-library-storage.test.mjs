import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildAssetLibrary} from '../tools/build-asset-library.mjs';
import {readPublishedCatalog} from '../design-system/library-publish.mjs';
import {mergePublishedImages} from '../design-system/library-index.mjs';
import {configureAssets,configureAssetLibrary,assetUrl,previewAssets} from '../shared/asset-loader.mjs';

test('library build hashes actual bytes, preserves dimensions, and never publishes application code',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mn-library-'));
 try{
  const bytes=Buffer.from('isolated library builder fixture'),sha=createHash('sha256').update(bytes).digest('hex'),path='assets/managed/'+sha+'.webp';
  await mkdir(join(root,'assets/managed'),{recursive:true});await writeFile(join(root,path),bytes);
  await writeFile(join(root,'app.js'),'must never be published');
  await writeFile(join(root,'asset-catalog.json'),JSON.stringify({schemaVersion:1,files:[{path,sha256:sha,size:bytes.length,width:128,height:128}]}));
  const catalog=await buildAssetLibrary(root,join(root,'dist'),'a'.repeat(40));
  assert.deepEqual(await readdir(join(root,'dist')),['asset-catalog.json','assets']);
  assert.deepEqual(catalog.files,[{path,sha256:sha,size:bytes.length,width:128,height:128}]);
  assert.deepEqual(await readFile(join(root,'dist',path)),bytes);
  await writeFile(join(root,path),'corrupt image');
  await assert.rejects(buildAssetLibrary(root),/Niezgodny hash/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('a login redirect or HTML response can never stand in for a public library index',async()=>{
 await assert.rejects(readPublishedCatalog(async()=>new Response('<html>Login</html>',{headers:{'content-type':'text/html'}})),/stronę zamiast JSON/);
});
test('library-only graphics become selectable without downloading images or changing word assignments',()=>{
 const sha='1'.repeat(64),path='assets/managed/'+sha+'.png',catalog={schemaVersion:1,assets:[],aliases:{},words:{},revision:1};
 const next=mergePublishedImages(catalog,{schemaVersion:1,files:[{path,sha256:sha,size:32,width:128,height:128}]});
 assert.equal(next.assets[0].width,128);assert.equal(next.assets[0].path,path);assert.deepEqual(next.words,{});assert.equal(catalog.assets.length,0);
});
test('Studio keeps library URLs after moving content origin to a metadata-only app commit',()=>{
 const sha='2'.repeat(64),path='assets/managed/'+sha+'.png';
 try{
  configureAssetLibrary('https://pwa.example/');
  configureAssets({schemaVersion:1,assets:[{path,sha,size:32}],aliases:{},words:{}},'https://raw.githubusercontent.com/owner/app/'+'a'.repeat(40)+'/');
  assert.equal(assetUrl(path),'https://pwa.example/'+path);
  previewAssets({[path]:'blob:local-draft'});assert.equal(assetUrl(path),'blob:local-draft');
 }finally{configureAssetLibrary();previewAssets();}
});
