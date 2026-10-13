#!/usr/bin/env node
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,readdir,unlink} from 'node:fs/promises';
import {dirname,extname,resolve,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {SCENIC} from '../flagi/scenic-config.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..'),OUT=join(ROOT,'docs/flags-adventure/qa-scenic');
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json','.woff':'font/woff'};
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname,file=resolve(ROOT,'.'+path+(path.endsWith('/')?'index.html':''));
 if(!file.startsWith(ROOT+sep)){res.writeHead(403).end();return;}
 try{const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data);}
 catch{res.writeHead(404).end();}
});
await mkdir(OUT,{recursive:true});
// This folder is generated evidence: keep each run free of stale frames.
for(const file of await readdir(OUT))if(file.endsWith('.jpg')||file==='report.json')await unlink(join(OUT,file));
server.listen(0,'127.0.0.1');await once(server,'listening');
const base='http://127.0.0.1:'+server.address().port,reports=[],failures=[];
const phase=process.env.SCENIC_QA_PHASE||'full';
async function state(page,value){await page.waitForFunction(s=>document.querySelector('#scenic-screen').dataset.state===s,value,{timeout:20000});}
async function capture(page,name){await page.screenshot({path:join(OUT,name+'.jpg'),type:'jpeg',quality:87});}
async function metrics(page){return page.evaluate(()=>{
 const rect=sel=>{const r=document.querySelector(sel)?.getBoundingClientRect();return r&&{x:r.x,y:r.y,w:r.width,h:r.height};};
 const app=document.querySelector('#scenic-screen'),svg=document.querySelector('.scenic-europe-map svg'),host=document.querySelector('.continent-map-host');
 return {state:app.dataset.state,country:app.dataset.country,score:document.querySelector('#scenic-score').textContent,task:document.querySelector('#scenic-task').textContent,
  viewport:{w:innerWidth,h:innerHeight},flag:rect('.flag-cloth'),paper:rect('.scenic-paper-row'),atlas:rect('.scenic-map-scroll'),
  answers:[...document.querySelectorAll('.scenic-answer')].map(n=>{const r=n.getBoundingClientRect();return {id:n.dataset.id,text:n.textContent,disabled:n.disabled,x:r.x,y:r.y,w:r.width,h:r.height,labelFits:n.querySelector('.scenic-answer-label').scrollWidth<=n.clientWidth};}),
  raster:host?.dataset.mapImage,activeCount:svg?.querySelectorAll('.country').length||0,highlight:!!svg?.querySelector('.scenic-country-overlay'),
  neighbors:Number(svg?.dataset.visibleNeighbors),labels:Number(host?.dataset.labelCount),crop:svg?.getAttribute('viewBox'),microstate:host?.dataset.microstate,
  capital:document.querySelector('#scenic-country-capital').textContent,swipeVisible:!document.querySelector('#scenic-swipe').hidden,
  overflowX:document.documentElement.scrollWidth>innerWidth,overflowY:document.documentElement.scrollHeight>innerHeight,
  animations:document.getAnimations().filter(a=>a.playState==='running').length,sand:app.dataset.sandPhase,qa:{enabled:app.dataset.qa,at:app.dataset.qaCaptureAt,captured:app.dataset.qaCaptured,progress:app.dataset.sandProgress},
  foldImages:[...document.querySelectorAll('.scenic-fold-leaf')].every(n=>n.style.backgroundImage.includes('data:image/webp'))};
 });}
async function check(name,browser,options,run){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,...options}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error'&&msg.text().startsWith('[scenic]'))errors.push(msg.text());});
 try{await run(page);const result={name,...await metrics(page),errors};reports.push(result);assert.equal(errors.length,0,'JS errors');console.log(JSON.stringify({name,status:'PASS',state:result.state}));}
 catch(error){const result={name,...await metrics(page).catch(()=>({})),error:String(error),errors};reports.push(result);failures.push(result);await capture(page,name+'-failure').catch(()=>{});console.error(name,error.stack||String(error));}
 finally{await context.close();}
}
async function open(page,country='by',freeze=true){await page.goto(base+'/flagi/scenic-preview.html?qa=1&country='+country+(freeze?'&freeze=1':''),{waitUntil:'domcontentloaded'});await state(page,'playing');}
async function choose(page,correct=true){const id=await page.locator('#scenic-screen').getAttribute('data-country');const button=correct?page.locator(`.scenic-answer[data-id="${id}"]`):page.locator(`.scenic-answer:not([data-id="${id}"])`).first();await button.click();}
async function slide(page){
 const a=await page.locator('#scenic-swipe-knob').boundingBox(),b=await page.locator('#scenic-swipe').boundingBox();
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width-20,a.y+a.height/2,{steps:15});await page.mouse.up();
}
let browser;
try{
 for(const [engine,launcher] of [['chromium',chromium],...(phase==='full'?[['webkit',webkit]]:[])]){
  browser=await launcher.launch({headless:true,...(engine==='chromium'?{args:['--disable-dev-shm-usage']}:{} )});
  for(const sample of [
   {id:'by',mode:'question',w:390,h:844,name:'01-belarus-question'},
   {id:'by',mode:'correct',w:390,h:844,name:'02-belarus-correct'},
   {id:'by',mode:'wrong',w:390,h:844,name:'03-belarus-wrong'},
   {id:'pl',mode:'correct',w:390,h:700,name:'04-poland-short'},
   {id:'ch',mode:'correct',w:430,h:932,name:'05-swiss-max'},
   {id:'li',mode:'correct',w:390,h:844,name:'07-liechtenstein'},
   {id:'va',mode:'wrong',w:390,h:844,name:'08-vatican'},
   {id:'ba',mode:'wrong',w:390,h:700,name:'09-long-country'},
   {id:'pl',mode:'correct',w:390,h:844,safe:true,name:'10-pwa-safe-area'}
  ])await check(engine+'-'+sample.name,browser,{viewport:{width:sample.w,height:sample.h}},async page=>{
   await open(page,sample.id);if(sample.safe)await page.addStyleTag({content:'.scenic-screen{--safe-top:47px;--safe-bottom:34px}'});
   if(sample.mode!=='question'){await choose(page,sample.mode==='correct');await state(page,'feedback-'+sample.mode);}
   const m=await metrics(page);assert.equal(m.overflowX,false);assert.equal(m.overflowY,false);assert.equal(m.answers.length,4);assert(m.answers.every(b=>b.labelFits&&b.h>=40&&b.y+b.h<sample.h));
   assert(m.flag.y+m.flag.h<=m.paper.y+5,'Flag hits question paper');
   if(sample.mode!=='question'){
    assert.equal(m.raster,'ready');assert.equal(m.activeCount,1);assert(m.highlight);assert(m.neighbors>=6&&m.neighbors<=11);assert(m.labels>=3);assert(m.foldImages);assert.equal(m.animations,0,'Steady atlas must not keep moving');
    assert.equal(m.swipeVisible,sample.mode==='wrong');assert(m.atlas.y+m.atlas.h<m.answers[0].y);
   }
   await capture(page,engine==='chromium'?sample.name:engine+'-'+sample.name);
  });
  if(phase!=='layout'){
   await check(engine+'-animation-frames',browser,{},async page=>{
    await open(page);await choose(page,false);
    await page.waitForFunction(()=>document.querySelector('#scenic-map-scroll').classList.contains('is-opening'));
    // Pause and seek the actual Web Animations timeline. Screenshot overhead
    // cannot skip a fold; each frame has a precise fraction of the same opening.
    for(const [label,fraction] of [['start',.06],['middle',.47],['end',.92]]){
     await page.evaluate(({fraction,duration})=>{for(const a of document.getAnimations())if(a.effect?.target?.classList.contains('scenic-fold-leaf')){a.pause();a.currentTime=duration*fraction;}},{fraction,duration:SCENIC.openMs});
     await capture(page,engine+'-unroll-'+label);
    }
    await page.evaluate(()=>document.getAnimations().forEach(a=>a.play()));await state(page,'feedback-wrong');
    await slide(page);await page.waitForFunction(()=>document.querySelector('#scenic-screen').dataset.state==='transition');
    for(const [label,fraction] of [['start',.06],['middle',.47],['end',.92]]){
     await page.evaluate(({fraction,duration})=>{for(const a of document.getAnimations())if(a.effect?.target?.classList.contains('scenic-fold-leaf')){a.pause();a.currentTime=duration*fraction;}},{fraction,duration:SCENIC.closeMs});
     await capture(page,engine+'-rollup-'+label);
    }
    await page.evaluate(()=>document.getAnimations().forEach(a=>a.play()));await state(page,'playing');
    await page.locator('[data-action="restart"]').click();await state(page,'playing');await choose(page,false);await state(page,'feedback-wrong');
    const captures=[['falling',.10],['settled',.40],['forming',.76],['end',.93]];
    await page.evaluate(f=>document.querySelector('#scenic-screen').dataset.qaCaptureAt=String(f),captures[0][1]);
    await slide(page);
    for(let index=0;index<captures.length;index++){
     const [label,fraction]=captures[index];
     await page.waitForFunction(f=>document.querySelector('#scenic-screen').dataset.qaCaptured===String(f),fraction);
     await capture(page,engine+'-sand-'+label);
     await page.evaluate(next=>{
      if(next!==null)document.querySelector('#scenic-screen').dataset.qaCaptureAt=String(next);
      window.dispatchEvent(new CustomEvent('scenic-qa-pause',{detail:false}));
     },captures[index+1]?.[1]??null);
    }
    await state(page,'playing');assert.equal(await page.locator('#scenic-task').textContent(),'Zadanie 2');await capture(page,'06-sand-next-'+engine);
   });
  }
  if(phase==='full'){
   await check(engine+'-correct-auto-and-pause',browser,{},async page=>{
    await open(page,'by',false);await choose(page);await state(page,'feedback-correct');await page.waitForTimeout(900);
    await page.locator('[data-action="pause"]').click();const before=await metrics(page);await page.waitForTimeout(SCENIC.memoryMs+400);
    assert.equal((await metrics(page)).task,before.task);assert.equal((await metrics(page)).state,'feedback-correct');
    await page.locator('[data-action="pause"]').click();await page.waitForTimeout(1200);assert.equal((await metrics(page)).task,'Zadanie 1');
    await state(page,'playing');assert.equal((await metrics(page)).task,'Zadanie 2');assert.equal((await metrics(page)).score,'1 pkt');assert.equal((await metrics(page)).country,'pl');
   });
   await check(engine+'-wrong-pause-slider-and-several-rounds',browser,{},async page=>{
    await open(page);await choose(page,false);await state(page,'feedback-wrong');await page.waitForTimeout(4200);assert.equal((await metrics(page)).task,'Zadanie 1');
    for(let i=0;i<3;i++){
     await slide(page);await page.waitForFunction(()=>document.querySelector('#scenic-screen').dataset.state==='transition');
     await page.locator('[data-action="pause"]').click();const task=(await metrics(page)).task;await page.waitForTimeout(1800);assert.equal((await metrics(page)).task,task);
     await page.locator('[data-action="pause"]').click();await state(page,'playing');assert.equal((await metrics(page)).task,'Zadanie '+(i+2));
     await choose(page,false);await state(page,'feedback-wrong');
    }
   });
   await check(engine+'-restart-at-boundaries',browser,{},async page=>{
    await open(page);
    for(const boundary of ['showing-map','feedback-wrong','transition']){
     await choose(page,false);if(boundary==='feedback-wrong'||boundary==='transition')await state(page,'feedback-wrong');
     if(boundary==='transition'){await slide(page);await page.waitForFunction(()=>document.querySelector('#scenic-screen').dataset.state==='transition');}
     await page.locator('[data-action="pause"]').click();await page.locator('[data-action="restart"]').click();await state(page,'playing');await page.waitForTimeout(1800);
     const m=await metrics(page);assert.equal(m.task,'Zadanie 1');assert.equal(m.score,'0 pkt');assert.equal(m.state,'playing');assert(m.answers.every(b=>!b.disabled));assert.equal(await page.locator('#scenic-screen').evaluate(n=>n.classList.contains('is-paused')),false);
    }
   });
   await check(engine+'-reduced-motion-and-keyboard',browser,{reducedMotion:'reduce'},async page=>{
    await open(page,'ba');await choose(page,false);await state(page,'feedback-wrong');await capture(page,engine+'-reduced-motion');
    await page.locator('#scenic-swipe-knob').focus();await page.keyboard.press('ArrowRight');await state(page,'playing');assert.equal((await metrics(page)).task,'Zadanie 2');assert.equal((await metrics(page)).animations,0);
   });
   await check(engine+'-image-fallback',browser,{},async page=>{
    await page.route('**/assets/maps/europe-scenic.webp',route=>route.abort());await page.route('**/assets/flags/cloth-prebaked/by.webp',route=>route.abort());
    await open(page);assert(await page.locator('.flag-cloth-fallback').evaluate(n=>n.complete&&n.naturalWidth>0));
    await choose(page,false);await state(page,'feedback-wrong');assert.equal((await metrics(page)).raster,'vector-fallback');assert((await metrics(page)).highlight);assert((await metrics(page)).activeCount>1);await capture(page,engine+'-image-fallback');
   });
   await check(engine+'-map-fetch-failure',browser,{},async page=>{
    await page.route('**/assets/maps/europe.svg',route=>route.abort());await open(page);await choose(page,false);await state(page,'feedback-wrong');assert((await page.locator('.scenic-map-unavailable').textContent()).includes('niedostępna'));
    await page.locator('#scenic-swipe-knob').press('Enter');await state(page,'playing');assert.equal((await metrics(page)).task,'Zadanie 2');
   });
   await check(engine+'-memory-starts-after-slow-bitmap',browser,{},async page=>{
    await page.route('**/assets/maps/europe-scenic.webp',async route=>{await new Promise(done=>setTimeout(done,1800));await route.continue();});
    await open(page,'by',false);await choose(page);await state(page,'feedback-correct');const started=Date.now();
    await page.waitForFunction(()=>document.querySelector('#scenic-screen').dataset.state==='transition');assert(Date.now()-started>=SCENIC.memoryMs-150);
   });
  }
  await browser.close();browser=null;
 }
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
 await writeFile(join(OUT,'report.json'),JSON.stringify({phase,passed:reports.length-failures.length,total:reports.length,reports},null,2)+'\n');
}
if(failures.length)throw Error(failures.length+' QA scenarios failed');
console.log('PASS '+reports.length+'/'+reports.length+' scenic scenarios ('+phase+')');
