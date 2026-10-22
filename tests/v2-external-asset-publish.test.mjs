import {resolveBehaviorConfig} from '../shared/behaviors.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
globalThis.__DS_STUDIO_BRANCH__='refactor/v2-parity-first';
const {GitClient,ASSET_BRANCH,BRANCH}=await import('../design-system/git-client.mjs?archive-transaction-tests');
const base=resolveBehaviorConfig(JSON.parse(readFileSync(new URL('../design-system/config.json',import.meta.url),'utf8')));
const current=JSON.parse(readFileSync(new URL('../design-system/assets.json',import.meta.url),'utf8'));
const bytes=new TextEncoder().encode('Mała Nauka — isolated asset publishing test');
const digest=await crypto.subtle.digest('SHA-256',bytes);
const sha=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
const path='assets/managed/'+sha+'.webp';
const gitSha=(await import('node:crypto')).createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const row={id:sha.slice(0,16),sha,path,size:bytes.length,width:1254,height:1254,type:'webp',group:'managed',references:[]};
const appHead='a'.repeat(40),libHead='b'.repeat(40),libCommit='c'.repeat(40),appCommit='d'.repeat(40),treeSha='e'.repeat(40);
const BASE_PATH='https://api.github.com/repos/marcinhubicki-coder/mala-nauka';
function mock({already=false,served=true,corruptImage=false,missingImage=false,conflict=false,brokenPath=false,appConflict=false}={}){
 const calls=[];
 let released=already,conflicted=false,appReads=0;
 const fetcher=async(url,options={})=>{
  const api=url===BASE_PATH||url.startsWith(BASE_PATH+'/'),route=api?url.slice(BASE_PATH.length).replace(/^\//,''):url,method=options.method||'GET',data=options.body?JSON.parse(options.body):null;
  calls.push({route,method,data});
  if(!api){
   if(url.includes('asset-catalog.json'))return new Response(JSON.stringify({schemaVersion:1,sourceCommit:libCommit,files:released&&served?[{path,sha256:sha,size:bytes.length}]:[]}),{headers:{'content-type':'application/json'}});
   return new Response(corruptImage?'incorrect bytes':bytes,{status:missingImage?404:200});
  }
  let answer;
  if(route==='')answer={permissions:{push:true}};
  else if(route==='git/ref/heads/'+BRANCH)answer={object:{sha:appConflict&&++appReads>2?appCommit:appHead}};
  else if(route==='git/ref/heads/'+ASSET_BRANCH)answer={object:{sha:libHead}};
  else if(route.startsWith('contents/design-system/config.json?ref='))answer={content:Buffer.from(JSON.stringify(base)).toString('base64')};
  else if(route.startsWith('contents/asset-catalog.json?ref='))answer={content:Buffer.from(JSON.stringify({schemaVersion:1,files:already?[{path,sha256:sha,size:bytes.length,width:row.width,height:row.height}]:[]})).toString('base64')};
  else if(route==='git/trees/'+libHead+'?recursive=1')answer={truncated:false,tree:[{path:'asset-catalog.json',type:'blob',sha:treeSha},...(already?[{path,type:'blob',sha:brokenPath?treeSha:gitSha}]:[])]};
  else if(route==='git/commits/'+libHead||route==='git/commits/'+appHead)answer={tree:{sha:treeSha}};
  else if(route==='git/blobs'&&method==='POST')answer={sha:'f'.repeat(40)};
  else if(route==='git/trees'&&method==='POST')answer={sha:treeSha};
  else if(route==='git/commits'&&method==='POST')answer={sha:data.parents[0]===libHead?libCommit:appCommit};
  else if(route==='git/refs/heads/'+ASSET_BRANCH&&method==='PATCH'){
   if(conflict&&!conflicted){conflicted=true;return {ok:false,status:422,json:async()=>({message:'Update is not a fast forward'})};}
   released=true;answer={};
  }
  else if(route==='git/refs/heads/'+BRANCH&&method==='PATCH')answer={};
  else throw Error('Unknown mock route: '+method+' '+route);
  return {ok:true,status:200,json:async()=>answer};
 };
 return {fetcher,calls};
}
async function connect(client){await client.connect('fake-test-token',base);}
const assigned=()=>{const assets=structuredClone(current);assets.assets.push(row);return assets;};
test('new asset is committed to archive, verified from CDN, then referenced by app commit with no binary',async()=>{
 const {fetcher,calls}=mock(),git=new GitClient(fetcher,{catalogAttempts:1,catalogDelay:0});await connect(git);
 const assets=assigned();
 const result=await git.save({config:base,assets,uploads:[{path,bytes}],message:'Test centralizacji zdjęć'});
 assert.equal(result.sha,appCommit);
 const archiveRef=calls.findIndex(x=>x.route==='git/refs/heads/'+ASSET_BRANCH&&x.method==='PATCH');
 const appRef=calls.findIndex(x=>x.route==='git/refs/heads/'+BRANCH&&x.method==='PATCH');
 const cdn=calls.findIndex((x,i)=>i>archiveRef&&x.route.startsWith('https://mala-nauka-assets.vercel.app/asset-catalog.json'));
 const image=calls.findIndex(x=>x.route==='https://mala-nauka-assets.vercel.app/'+path);
 assert.ok(archiveRef>=0&&cdn>archiveRef&&appRef>cdn,'Must publish bytes before app metadata');
 assert.ok(image>cdn&&appRef>image,'Must check image bytes before app metadata');
 const trees=calls.filter(x=>x.route==='git/trees'&&x.method==='POST');
 assert.equal(trees.length,2);
 assert.ok(trees[0].data.tree.some(x=>x.path===path),'archive tree lacks image bytes');
 const sourceIndex=JSON.parse(trees[0].data.tree.find(x=>x.path==='asset-catalog.json').content);
 assert.ok(sourceIndex.files.some(file=>file.path===path&&file.sha256===sha&&file.width===1254),'Binary metadata must be committed atomically with image');
 assert.ok(trees[1].data.tree.every(x=>x.path!==path),'app tree must not include image bytes');
 assert.ok(trees[1].data.tree.some(x=>x.path==='design-system/assets.json'));
 assert.ok(!JSON.stringify(calls).includes('fake-test-token'));
});
test('repeat upload uses existing library file and never creates new binary blob',async()=>{
 const {fetcher,calls}=mock({already:true}),git=new GitClient(fetcher,{catalogAttempts:1,catalogDelay:0});await connect(git);
 await git.save({config:base,assets:assigned(),uploads:[{path,bytes}]});
 assert.equal(calls.filter(x=>x.route==='git/blobs').length,0);
 assert.equal(calls.filter(x=>x.route==='git/refs/heads/'+ASSET_BRANCH&&x.method==='PATCH').length,0);
 assert.equal(calls.filter(x=>x.route==='git/refs/heads/'+BRANCH&&x.method==='PATCH').length,1);
});
test('unavailable CDN stops app commit even if GitHub already holds image',async()=>{
 const {fetcher,calls}=mock({already:true,served:false}),git=new GitClient(fetcher,{catalogAttempts:1,catalogDelay:0});await connect(git);
 await assert.rejects(git.save({config:base,assets:assigned(),uploads:[{path,bytes}]}),/nie jest jeszcze dostępny na CDN/);
 assert.ok(!calls.some(x=>x.route==='git/refs/heads/'+BRANCH&&x.method==='PATCH'));
});
test('false SHA in filename is rejected before sending image bytes',async()=>{
 const {fetcher,calls}=mock(),git=new GitClient(fetcher,{catalogAttempts:1,catalogDelay:0});await connect(git);
 await assert.rejects(git.publishLibraryUploads([{path:'assets/managed/'+'0'.repeat(64)+'.webp',bytes}]),/SHA-256/);
 assert.ok(!calls.some(x=>x.route==='git/blobs'));
});
test('a valid manifest cannot hide a missing or corrupt public image',async()=>{
 for(const options of [{already:true,corruptImage:true},{already:true,missingImage:true}]){
  const {fetcher,calls}=mock(options),git=new GitClient(fetcher,{catalogAttempts:1});await connect(git);
  await assert.rejects(git.save({config:base,assets:assigned(),uploads:[{path,bytes}]}),/nie jest jeszcze dostępny na CDN/);
  assert.ok(!calls.some(x=>x.route==='git/refs/heads/'+BRANCH&&x.method==='PATCH'));
 }
});
test('parallel archive writes merge by retrying without another binary blob',async()=>{
 const {fetcher,calls}=mock({conflict:true}),git=new GitClient(fetcher,{catalogAttempts:1});await connect(git);
 await git.save({config:base,assets:assigned(),uploads:[{path,bytes}]});
 assert.equal(calls.filter(x=>x.route==='git/blobs').length,1);
 assert.equal(calls.filter(x=>x.route==='git/refs/heads/'+ASSET_BRANCH&&x.method==='PATCH').length,2);
});
test('an occupied hash path with different bytes is never overwritten',async()=>{
 const {fetcher,calls}=mock({already:true,brokenPath:true}),git=new GitClient(fetcher,{catalogAttempts:1});await connect(git);
 await assert.rejects(git.save({config:base,assets:assigned(),uploads:[{path,bytes}]}),/Naruszona niezmienna ścieżka/);
 assert.ok(!calls.some(x=>x.method==='POST'));
});
test('the whole upload batch is validated before any binary is sent',async()=>{
 const {fetcher,calls}=mock(),git=new GitClient(fetcher);await connect(git);
 await assert.rejects(git.publishLibraryUploads([{path,bytes},{path:'assets/managed/'+'0'.repeat(64)+'.png',bytes}]),/SHA-256/);
 assert.ok(!calls.some(x=>x.method==='POST'));
});
test('app changes during library publication preserve the draft instead of overwriting',async()=>{
 const {fetcher,calls}=mock({appConflict:true}),git=new GitClient(fetcher,{catalogAttempts:1});await connect(git);
 await assert.rejects(git.save({config:base,assets:assigned(),uploads:[{path,bytes}]}),/zmieniła się gałąź V2/);
 assert.ok(!calls.some(x=>x.route==='git/refs/heads/'+BRANCH&&x.method==='PATCH'));
 assert.equal(git.head,appHead);
});
