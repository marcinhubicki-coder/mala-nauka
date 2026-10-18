#!/usr/bin/env node
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve,join,sep} from 'node:path';
import {once} from 'node:events';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..'),out=process.env.SCENIC_LAYOUT_OUT||join(root,'docs/flags-adventure/qa-layout-v32');
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+path);
 if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end();}
});
await mkdir(out,{recursive:true});server.listen(0,'127.0.0.1');await once(server,'listening');
const base='http://127.0.0.1:'+server.address().port,results=[];
async function metrics(frame){return frame.evaluate(()=>{
 const r=s=>{const q=document.querySelector(s).getBoundingClientRect();return {x:q.x,y:q.y,w:q.width,h:q.height,right:q.right,bottom:q.bottom};};
 const heading=r('.scenic-map-caption'),paper=r('#scenic-map-scroll'),flag=r('.scenic-map-flag'),map=r('.scenic-europe-map'),boy=r('.scenic-boy');
 const scenery=getComputedStyle(document.querySelector('.scenic-scenery')),matrix=new DOMMatrix(scenery.transform);
 const main=document.querySelector('main');
 return {viewport:[innerWidth,innerHeight],state:main.dataset.state,country:main.dataset.country,scroll:{scene:main.scrollTop,x:scrollX,y:scrollY},overflow:getComputedStyle(main).overflow,heading,paper,flag,map,boy,answers:r('#scenic-answers'),background:{fit:scenery.objectFit,scaleX:matrix.a,scaleY:matrix.d},title:r('#scenic-country-name'),capital:r('#scenic-country-capital'),headingMetrics:JSON.parse(document.querySelector('#scenic-map-scroll').dataset.headingMetrics),camera:JSON.parse(document.querySelector('#scenic-map-scroll').dataset.atlasFrame)};
});}
try{
 for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await launcher.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:2,reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'/flagi/scenic-preview.html?country=fr&qa=1&freeze=1');
   const frame=await (await page.locator('iframe[name="scenic-game"]').elementHandle()).contentFrame();
   await frame.waitForFunction(()=>document.querySelector('main')?.dataset.state==='playing');
   await frame.locator('.scenic-answer[data-id="es"]').click();
   await frame.waitForFunction(()=>document.querySelector('main')?.dataset.state==='feedback-wrong');
   const first=await metrics(frame),samples=[];
   assert.equal(first.overflow,'clip');assert.equal(first.scroll.scene,0);
   const neighbor=frame.locator('#scenic-neighbors button[data-neighbor="es"]');
   await neighbor.click();assert.deepEqual(await metrics(frame),first,'Clicking the last neighbor cannot scroll the scene');await neighbor.click();
   assert.deepEqual(first.viewport,[390,844]);assert.equal(first.background.fit,'cover');assert.equal(first.background.scaleX,first.background.scaleY);
   assert(Math.abs(first.heading.x-first.paper.x-48)<.1);assert(Math.abs(first.paper.right-first.heading.right-48)<.1);
   assert(Math.abs(first.heading.y-first.paper.y-22)<.1);assert(first.headingMetrics.gap>=6);
   assert(Math.abs(first.boy.w/first.boy.h-1000/1028)<.001);
   for(const viewport of [{width:1280,height:600},{width:960,height:734},{width:520,height:1000},{width:1440,height:1200},{width:390,height:700}]){
    await page.setViewportSize(viewport);
    await page.waitForFunction(()=>{const r=document.querySelector('.scenic-browser-frame').getBoundingClientRect(),f=document.querySelector('iframe').getBoundingClientRect(),expected=Math.min(innerWidth/390,innerHeight/844,480/390);return Math.abs(r.height-844*expected)<.1&&Math.abs(f.width-390*expected)<.1;});
    const actual=await metrics(frame);assert.deepEqual(actual,first,'Window resize must leave the live game geometry and camera unchanged');
    const bounds=await page.locator('iframe').boundingBox();assert(bounds.x>=-.1&&bounds.y>=-.1&&bounds.x+bounds.width<=viewport.width+.1&&bounds.y+bounds.height<=viewport.height+.1);assert(Math.abs(bounds.width/bounds.height-390/844)<.0001);
    samples.push({viewport,bounds});
    if(viewport.width===960)await page.screenshot({path:join(out,engine+'-desktop-960x734.png')});
   }
   // Inputs cross the scaled iframe correctly; resizing preserves the round.
   const task=await frame.locator('#scenic-task').textContent();await frame.locator('#scenic-language').click();
   await frame.waitForFunction(()=>!document.querySelector('#scenic-language').disabled);
   assert.equal(await frame.locator('#scenic-country-name').getAttribute('aria-label'),'France');assert.equal(await frame.locator('#scenic-task').textContent(),task.replace('Zadanie','Task'));
   assert.equal((await metrics(frame)).heading.x,first.heading.x);
   const knob=await frame.locator('#scenic-swipe-knob').boundingBox(),rail=await frame.locator('#scenic-swipe').boundingBox();
   await page.mouse.move(knob.x+knob.width/2,knob.y+knob.height/2);await page.mouse.down();await page.mouse.move(rail.x+rail.width-8,knob.y+knob.height/2,{steps:16});await page.mouse.up();
   await frame.waitForFunction(()=>document.querySelector('main').dataset.state==='playing'&&document.querySelector('main').dataset.country==='pl');
   assert.equal(errors.length,0);results.push({engine,status:'PASS',samples,initial:first,errors});console.log(engine+' PASS — fixed portrait geometry, proportional resize, margins, language and slider');
  }finally{await page.close();}
  // iOS may report a CSS viewport shorter than its physical standalone screen.
  // Orthography's shared helper must keep the photograph and scene full height.
  const installed=await browser.newPage({viewport:{width:390,height:797},screen:{width:390,height:844},deviceScaleFactor:3,reducedMotion:'reduce'});
  try{
   await installed.addInitScript(()=>{
    Object.defineProperty(navigator,'standalone',{get:()=>true});
    // Playwright otherwise resizes screen with the window; a phone's physical
    // screen stays the same while WebKit's reported viewport changes.
    Object.defineProperty(screen,'width',{get:()=>390});Object.defineProperty(screen,'height',{get:()=>844});
   });
   await installed.goto(base+'/flagi/scenic-preview.html?country=fr&qa=1&freeze=1');
   await installed.waitForFunction(()=>document.querySelector('main')?.dataset.state==='playing');
   await installed.addStyleTag({content:'.scenic-screen{--safe-top:47px;--safe-bottom:34px}'});
   await installed.locator('.scenic-answer[data-id="es"]').click();
   await installed.waitForFunction(()=>document.querySelector('main')?.dataset.state==='feedback-wrong');
   const installedMetrics=()=>installed.evaluate(()=>{
    const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
    const photo=document.querySelector('.scenic-scenery'),style=getComputedStyle(photo),matrix=new DOMMatrix(style.transform);
    return {screen:[screen.width,screen.height],height:getComputedStyle(document.documentElement).getPropertyValue('--app-viewport-height'),standalone:document.documentElement.classList.contains('scenic-standalone'),frames:document.querySelectorAll('iframe').length,photo:{parent:photo.parentElement.tagName,position:style.position,fit:style.objectFit,layoutHeight:photo.offsetHeight,scale:[matrix.a,matrix.d]},boxes:Object.fromEntries(['html','body','main','#scenic-stage','#scenic-map-scroll','#scenic-answers','#scenic-neighbors','#scenic-controls'].map(s=>[s,rect(s)]))};
   });
   const first=await installedMetrics();
   assert.equal(first.standalone,true);assert.equal(first.frames,0);assert.equal(first.height,'844px');
   assert.deepEqual(first.photo,{parent:'BODY',position:'fixed',fit:'cover',layoutHeight:844,scale:[1.12,1.12]});
   for(const selector of ['html','body','main'])assert.equal(first.boxes[selector].h,844);
   for(const height of [844,797,810]){
    await installed.setViewportSize({width:390,height});
    await installed.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--app-viewport-height')==='844px');
    assert.deepEqual(await installedMetrics(),first,'Standalone geometry must follow the screen, including when CSS viewport units are 47px shorter');
   }
   await installed.screenshot({path:join(out,engine+'-standalone-screen-height.png')});
   results.push({engine,mode:'standalone-screen-height',status:'PASS',initial:first});console.log(engine+' PASS — standalone screen height survives a shorter CSS viewport');
  }finally{await installed.close();await browser.close();}
 }
}finally{await writeFile(join(out,'report.json'),JSON.stringify({passed:results.length,total:4,results},null,2)+'\n');server.close();}
