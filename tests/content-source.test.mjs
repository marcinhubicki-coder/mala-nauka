import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {pinnedContentSource} from '../tools/content-source.mjs';
import {discoverImages} from '../design-system/catalog-refresh.mjs';
import {GitClient,mergeCatalog} from '../design-system/git-client.mjs';
import {configureAssets} from '../shared/asset-loader.mjs';
import {sceneFor,sceneUrl} from '../spelling/scenes.mjs';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const assets=await read('design-system/assets.json');
test('scene assignments come only from the manifest, including intentional removal',()=>{
 const catalog=structuredClone(assets),word=Object.keys(catalog.words)[0],path=catalog.words[word].path;
 configureAssets(catalog,'https://example.test/commit-a/');assert.equal(sceneFor('',word).asset,path);assert.equal(sceneUrl(sceneFor('',word)),`https://example.test/commit-a/${path}`);
 delete catalog.words[word];configureAssets(catalog);assert.equal(sceneFor('_óra',word),null);
});
test('approved ten images are indexed with existing files, without inventing word records',async()=>{
 for(const name of ['czesc','dzis','garsc','gasienica','gdzies','kisc','lesniczy','lisc','osniezony','pasnik']){
  const path=`assets/scenes/${name}.jpg`;assert.ok(assets.assets.some(a=>a.path===path));await access(new URL('../'+path,import.meta.url));
 }
});
test('folder refresh discovers new files and merges an independent local assignment',async()=>{
 const path='assets/scenes/new.jpg',bytes=new TextEncoder().encode('new picture'),tree={tree:[{path,type:'blob'}]},remote=await discoverImages(assets,tree,async()=>bytes);
 assert.equal(remote.assets.length,assets.assets.length+1);assert.deepEqual(remote.words,assets.words);
 const local=structuredClone(assets),word=Object.keys(local.words)[0];local.words[word].manual=true;
 const merged=mergeCatalog(assets,local,remote);assert.ok(merged.assets.some(a=>a.path===path));assert.equal(merged.words[word].manual,true);
 await assert.rejects(()=>discoverImages(assets,{...tree,truncated:true},async()=>bytes),/niepełny/);
 await assert.rejects(()=>discoverImages(assets,tree,async()=>{throw Error('offline');}),/offline/);assert.ok(!assets.assets.some(a=>a.path===path));
});
test('consumer source resolves a moving branch once and rejects mutable overrides',async()=>{
 let head='a'.repeat(40),calls=0;const fetcher=async()=>({ok:true,json:async()=>{calls++;return {sha:head};}});
 const frozen=await pinnedContentSource({fetcher});head='b'.repeat(40);
 assert.ok(frozen.includes('a'.repeat(40)));assert.ok((await pinnedContentSource({fetcher})).includes(head));assert.equal(calls,2);
 await assert.rejects(()=>pinnedContentSource({sourceURL:'https://raw.githubusercontent.com/marcinhubicki-coder/mala-nauka/design/system-v1/'}),/SHA/);
 assert.equal(await pinnedContentSource({sourceURL:frozen}),frozen);
});
test('Git refresh reads config, words, manifest and tree from one captured commit',async()=>{
 const head='a'.repeat(40),calls=[];
 const client=new GitClient(async url=>{calls.push(url);let value;
  if(url.includes('git/ref/heads/'))value={object:{sha:head}};
  else if(url.includes('contents/')){assert.ok(url.endsWith(`ref=${head}`));const path=url.split('contents/')[1].split('?')[0];value={content:Buffer.from(JSON.stringify(await read(path))).toString('base64')};}
  else if(url.includes(`git/trees/${head}`))value={tree:[]};
  else throw Error(url);
  return {ok:true,json:async()=>value};
 });
 const latest=await client.latest();assert.equal(latest.head,head);assert.equal(Object.keys(latest.wordPacks).length,8);assert.deepEqual(latest.catalog.words,assets.words);assert.equal(calls.filter(u=>u.includes('git/ref/')).length,1);
});
test('saved Preview resolves the deployment for its SHA and rejects an alias serving another commit',async()=>{
 const sha='c'.repeat(40);let served=sha;
 const client=new GitClient(async url=>{const u=String(url);const value=u.includes('deployments?')?[{sha,id:12}]:u.endsWith('/statuses')?[{state:'success',environment_url:'https://immutable.example/'}]:{sha:served};return {ok:true,json:async()=>value};});
 assert.equal(await client.previewURL(sha),'https://immutable.example/');served='d'.repeat(40);await assert.rejects(()=>client.previewURL(sha),/zweryfikowanego/);
});
