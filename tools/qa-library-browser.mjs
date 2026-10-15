// Isolated browser integration, with an explicit GitHub API fixture.
// This is NOT proof of a live GitHub/Vercel publication; keep that gate separate.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,mkdir,cp,readFile,writeFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {buildAssetLibrary} from './build-asset-library.mjs';

const root=process.cwd(),scratch=await mkdtemp(join(tmpdir(),'mn-library-browser-'));
const libraryRoot=join(scratch,'library'),libraryOut=join(scratch,'public'),branch='refactor/v2-parity-first',assetBranch='assets/library-v1';
const json=path=>readFile(join(root,path),'utf8').then(JSON.parse);
const hash=value=>createHash('sha1').update(value).digest('hex');
const blobHash=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const appFiles=new Map(await Promise.all(['design-system/config.json','design-system/assets.json','design-system/rules.json','design-system/word-batches.json',...Array.from({length:8},(_,i)=>`data/words-0${i+1}.json`)].map(async path=>[path,await json(path)])));
let appHead='a'.repeat(40),libraryHead='b'.repeat(40),catalog,sourceIndex,failIndex=false;
const libraryFiles=new Map(),blobs=new Map(),trees=new Map(),commits=new Map(),calls=[];
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.avif':'image/avif','.woff':'font/woff','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
let browser,appServer,libraryServer;
async function serve(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port;}
async function sendFile(response,file){try{const bytes=await readFile(file);response.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','access-control-allow-origin':'*'});response.end(bytes);}catch{response.writeHead(404);response.end('Not found');}}
async function api(url,method,data){
 const route=url.replace('https://api.github.com/repos/marcinhubicki-coder/mala-nauka','').replace(/^\//,'');calls.push({route,method,data});
 if(route==='')return {permissions:{push:true}};
 if(route==='git/ref/heads/'+branch)return {object:{sha:appHead}};
 if(route==='git/ref/heads/'+assetBranch)return {object:{sha:libraryHead}};
 if(route.startsWith('contents/')){
  const path=route.slice(9).split('?')[0],value=path==='asset-catalog.json'?sourceIndex:appFiles.get(path);
  if(!value)throw Error('Unknown fixture contents: '+path);
  return {content:Buffer.from(JSON.stringify(value)).toString('base64')};
 }
 if(route.startsWith('git/trees/')&&method==='GET')return {truncated:false,tree:route.includes(libraryHead)?[...libraryFiles].map(([path,sha])=>({path,sha,type:'blob'})):[]};
 if(route.startsWith('git/commits/')&&method==='GET')return {tree:{sha:route.slice(12)}};
 if(route==='git/blobs'){
  const bytes=Buffer.from(data.content,'base64'),sha=blobHash(bytes);blobs.set(sha,bytes);return {sha};
 }
 if(route==='git/trees'){
  const sha=hash(JSON.stringify(data));trees.set(sha,data.tree);return {sha};
 }
 if(route==='git/commits'){
  const sha=hash(JSON.stringify(data));commits.set(sha,data);return {sha};
 }
 if(route.startsWith('git/refs/heads/')&&method==='PATCH'){
  assert.equal(data.force,false);
  const commit=commits.get(data.sha),entries=trees.get(commit.tree);
  if(route==='git/refs/heads/'+assetBranch){
   for(const entry of entries){
    const bytes=entry.content!==undefined?Buffer.from(entry.content):blobs.get(entry.sha);
    if(entry.path==='asset-catalog.json')sourceIndex=JSON.parse(bytes);
    else{assert.match(entry.path,/^assets\/managed\/[a-f0-9]{64}\.(png|webp|jpg|avif)$/);await mkdir(join(libraryRoot,'assets/managed'),{recursive:true});}
    await writeFile(join(libraryRoot,entry.path),bytes);libraryFiles.set(entry.path,blobHash(bytes));
   }
   libraryHead=data.sha;catalog=await buildAssetLibrary(libraryRoot,libraryOut,libraryHead);
  }else{
   assert.equal(route,'git/refs/heads/'+branch);
   assert.ok(entries.every(entry=>!entry.path.startsWith('assets/')),'app commit copied binary');
   entries.forEach(entry=>appFiles.set(entry.path,JSON.parse(entry.content)));appHead=data.sha;
  }
  return {};
 }
 throw Error('Unknown fixture API: '+method+' '+route);
}
try{
 await mkdir(libraryRoot);await cp(join(root,'assets'),join(libraryRoot,'assets'),{recursive:true});
 catalog=await buildAssetLibrary(libraryRoot,libraryOut,libraryHead);sourceIndex=catalog;
 await writeFile(join(libraryRoot,'asset-catalog.json'),JSON.stringify(sourceIndex));
 libraryFiles.set('asset-catalog.json',blobHash(Buffer.from(JSON.stringify(sourceIndex))));
 // Only new uploads need individual Git object checks in this fixture.
 libraryServer=createServer((req,res)=>{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);
  if(failIndex&&path==='asset-catalog.json'){res.writeHead(503);res.end('Publication unavailable');return;}
  void sendFile(res,join(libraryOut,path));
 });
 const libraryURL=await serve(libraryServer);
 appServer=createServer((req,res)=>{
  let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);
  if(!path||path.endsWith('/'))path+='index.html';
  if(appFiles.has(path)){res.writeHead(200,{'content-type':'application/json','cache-control':'no-cache'});res.end(JSON.stringify(appFiles.get(path)));return;}
  if(/^assets\/(managed|scenes|flags)\//.test(path)){
   void fetch(libraryURL+'/'+path).then(async response=>{res.writeHead(response.status,{'content-type':response.headers.get('content-type')||'application/octet-stream'});res.end(Buffer.from(await response.arrayBuffer()));});return;
  }
  if(resolve(root,'dist',path).startsWith(join(root,'dist')+'/'))void sendFile(res,join(root,'dist',path));else{res.writeHead(400);res.end();}
 });
 const base=await serve(appServer);
 browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 const context=await browser.newContext({viewport:{width:1300,height:1000},serviceWorkers:'allow'});
 const errors=[];context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
 await context.route('https://api.github.com/repos/marcinhubicki-coder/mala-nauka**',async route=>{
  const request=route.request();
  try{await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(await api(request.url(),request.method(),request.postDataJSON()))});}
  catch(error){await route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({message:error.message})});}
 });
 await context.route('https://mala-nauka-assets.vercel.app/**',async route=>{
  const url=new URL(route.request().url());const response=await route.fetch({url:libraryURL+url.pathname+url.search});await route.fulfill({response});
 });
 await context.route('https://raw.githubusercontent.com/marcinhubicki-coder/mala-nauka/**',async route=>{
  const url=new URL(route.request().url()),marker='/design-system/',path=url.pathname.includes(marker)?'design-system/'+url.pathname.split(marker)[1]:null;
  if(path&&appFiles.has(path))await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(appFiles.get(path))});else await route.abort();
 });
 const page=await context.newPage();await page.goto(base+'/design-system/#assets');
 await page.locator('#upload-asset').waitFor();
 await page.locator('#connect-git').click();await page.locator('#git-token').fill('isolated-fixture-session');await page.locator('#git-form [type=submit]').click();
 await page.waitForFunction(()=>document.querySelector('#connect-git')?.textContent==='GitHub połączony',null,{timeout:20000});
 await page.locator('#upload-asset').click();
 const bytes=await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#167c43';ctx.fillRect(0,0,128,128);ctx.fillStyle='#e9ff72';ctx.beginPath();ctx.arc(64,64,39,0,Math.PI*2);ctx.fill();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));return [...new Uint8Array(await blob.arrayBuffer())];
 });
 const buffer=Buffer.from(bytes),sha=createHash('sha256').update(buffer).digest('hex'),path='assets/managed/'+sha+'.png';
 failIndex=true;
 await page.locator('#asset-file').setInputFiles({name:'zaba-e2e.png',mimeType:'image/png',buffer});
 await page.locator('#upload-preview img').waitFor();await page.locator('#upload-word').fill('żaba');await page.locator('#upload-form [type=submit]').click();
 await page.waitForFunction(()=>!document.querySelector('#studio-modal')?.open);
 failIndex=false;
 await page.reload();await page.locator('#upload-asset').waitFor();
 // Reload proves the actual image bytes survived IndexedDB draft recovery.
 await page.locator('#connect-git').click();await page.locator('#git-token').fill('isolated-fixture-session');await page.locator('#git-form [type=submit]').click();
 await page.waitForFunction(()=>document.querySelector('#connect-git')?.textContent==='GitHub połączony',null,{timeout:20000});
 await page.locator('#save-git').click();await page.locator('#confirm-save').click();
 await page.waitForFunction(()=>!document.querySelector('#studio-modal')?.open,null,{timeout:30000});
 assert.equal(appFiles.get('design-system/assets.json').words['żaba'].path,path);
 assert.equal(catalog.files.find(file=>file.path===path)?.sha256,sha);
 assert.equal(catalog.files.find(file=>file.path===path)?.width,128);
 await assert.rejects(access(join(root,'dist',path)),'image unexpectedly copied into app build');
 assert.deepEqual(await readFile(join(libraryOut,path)),buffer);
 // Studio now uses content from an app SHA with no image at that SHA.
 const studioURL=await page.evaluate(async path=>{const m=await import('/shared/asset-loader.mjs');return m.assetUrl(path);},path);
 assert.equal(studioURL,base+'/'+path);
 const game=await context.newPage();await game.goto(base+'/ortografia/?studio=1&mode=spelling&screen=game&state=initial&word=%C5%BCaba');
 await game.locator('[data-image-state=ready]').waitFor({timeout:25000});
 const imageURL=await game.evaluate(async()=>{const m=await import('/shared/asset-loader.mjs');return m.wordAsset('żaba');});
 assert.equal(imageURL,base+'/'+path);
 const loaded=await game.evaluate(async url=>{const image=new Image();image.src=url;await image.decode();return [image.naturalWidth,image.naturalHeight];},imageURL);
 assert.deepEqual(loaded,[128,128]);
 await game.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;});
 await game.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:30000});
 await game.evaluate(url=>fetch(url),imageURL);
 await game.waitForFunction(async url=>Boolean(await (await caches.open('mala-nauka-scenes-v1')).match(url)),imageURL);
 await context.setOffline(true);
 assert.equal(await game.evaluate(async url=>(await fetch(url)).ok,imageURL),true);
 await context.setOffline(false);
 assert.deepEqual(errors,[]);
 const output=process.env.V2_SCREENSHOT_DIR;
 if(output){await mkdir(output,{recursive:true});await game.screenshot({path:join(output,'library-image-in-pwa.png')});}
 console.log(JSON.stringify({ok:true,scope:'isolated-browser-with-github-fixture',upload:true,offlineDraft:true,indexedDBRecovery:true,atomicLibraryIndex:true,metadataOnlyAppCommit:true,pwaImageDecoded:loaded,offlineImage:true,liveE2E:false,sha256:sha}));
}finally{
 await browser?.close();await Promise.all([appServer,libraryServer].filter(Boolean).map(server=>new Promise(resolve=>server.close(resolve))));
 await rm(scratch,{recursive:true,force:true});
}
