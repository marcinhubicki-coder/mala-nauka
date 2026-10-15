#!/usr/bin/env node
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,readdir,unlink} from 'node:fs/promises';
import {dirname,extname,resolve,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {SCENIC} from '../flagi/scenic-config.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..'),OUT=process.env.SCENIC_QA_OUT||join(ROOT,'docs/flags-adventure/qa-scenic');
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
const canonicalEurope=await readFile(join(ROOT,'assets/maps/europe.svg'),'utf8');
async function state(page,value){await page.waitForFunction(s=>document.querySelector('#scenic-screen').dataset.state===s,value,{timeout:20000});}
async function capture(page,name){await page.screenshot({path:join(OUT,name+'.jpg'),type:'jpeg',quality:87});}
async function metrics(page){return page.evaluate(()=>{
 const rect=sel=>{const r=document.querySelector(sel)?.getBoundingClientRect();return r&&{x:r.x,y:r.y,w:r.width,h:r.height};};
 const app=document.querySelector('#scenic-screen'),svg=document.querySelector('.scenic-europe-map svg'),host=document.querySelector('.continent-map-host');
 return {state:app.dataset.state,country:app.dataset.country,score:document.querySelector('#scenic-score').textContent,task:document.querySelector('#scenic-task').textContent,
  viewport:{w:innerWidth,h:innerHeight},flag:rect('.flag-cloth'),paper:rect('.scenic-paper-row'),atlas:rect('.scenic-map-scroll'),
  answers:[...document.querySelectorAll('.scenic-answer')].map(n=>{const r=n.getBoundingClientRect();return {id:n.dataset.id,text:n.textContent,disabled:n.disabled,x:r.x,y:r.y,w:r.width,h:r.height,labelFits:n.querySelector('.scenic-answer-label').scrollWidth<=n.clientWidth&&n.querySelector('.scenic-answer-label').getBoundingClientRect().height<=n.clientHeight-8,lineCount:Math.round(n.querySelector('.scenic-answer-label').getBoundingClientRect().height/parseFloat(getComputedStyle(n.querySelector('.scenic-answer-label')).lineHeight)),icons:n.querySelectorAll('svg,img').length};}),
  raster:host?.dataset.mapImage,activeCount:svg?.querySelectorAll('.country').length||0,highlight:!!svg?.querySelector('.scenic-country-overlay'),
  neighbors:Number(svg?.dataset.visibleNeighbors),labels:Number(host?.dataset.labelCount),crop:svg?.getAttribute('viewBox'),microstate:host?.dataset.microstate,
  captionFits:(()=>{const inner=document.querySelector('.scenic-map-inner').getBoundingClientRect(),caption=document.querySelector('.scenic-map-caption').getBoundingClientRect(),title=document.querySelector('#scenic-country-name').getBoundingClientRect(),capital=document.querySelector('#scenic-country-capital').getBoundingClientRect();return title.top>=inner.top+3&&capital.bottom<=caption.bottom+1&&caption.right<=inner.right-10&&document.querySelector('#scenic-country-name').scrollWidth<=document.querySelector('#scenic-country-name').clientWidth+1;})(),
  capital:document.querySelector('#scenic-country-capital').textContent,swipeVisible:!document.querySelector('#scenic-swipe').hidden,
  overflowX:document.documentElement.scrollWidth>innerWidth,overflowY:document.documentElement.scrollHeight>innerHeight,
  animations:document.getAnimations().filter(a=>a.playState==='running').length,sand:app.dataset.sandPhase,qa:{enabled:app.dataset.qa,at:app.dataset.qaCaptureAt,captured:app.dataset.qaCaptured,progress:app.dataset.sandProgress},
  foldImages:document.querySelectorAll('.scenic-fold-leaf').length===4&&[...document.querySelectorAll('.scenic-fold-leaf')].every(n=>getComputedStyle(n).backgroundImage.includes('scenic-paper-v14.webp')),inkPhase:document.querySelector('#scenic-map-scroll').dataset.inkPhase,inkGrains:Number(document.querySelector('#scenic-map-scroll').dataset.inkGrains),inkOutside:Number(document.querySelector('#scenic-map-scroll').dataset.inkOutside),inkPaintP95:Number(document.querySelector('#scenic-map-scroll').dataset.inkPaintP95),inkFrames:Number(document.querySelector('#scenic-map-scroll').dataset.inkFrames),compass:rect('.scenic-compass')};
 });}
async function check(name,browser,options,run){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,...options}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('Browser renderer crashed'));page.on('console',msg=>{if(msg.type()==='error'&&msg.text().startsWith('[scenic]'))errors.push(msg.text());});
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
   {id:'pl',mode:'wrong',w:390,h:844,name:'11-poland-mockup-wrong'},
   {id:'pl',mode:'correct',w:390,h:844,name:'12-poland-mockup-correct'},
   {id:'pl',mode:'correct',w:390,h:700,name:'04-poland-short'},
   {id:'ch',mode:'correct',w:430,h:932,name:'05-swiss-max'},
   {id:'li',mode:'correct',w:390,h:844,name:'07-liechtenstein'},
   {id:'va',mode:'wrong',w:390,h:844,name:'08-vatican'},
   {id:'ba',mode:'wrong',w:390,h:700,name:'09-long-country'},
   {id:'gb',mode:'correct',w:390,h:844,name:'13-two-word-title'},
   {id:'mk',mode:'wrong',w:390,h:700,name:'14-two-word-title-short'},
   {id:'li',mode:'question',w:390,h:844,name:'15-two-line-question'},
   {id:'pl',mode:'correct',w:390,h:844,safe:true,name:'10-pwa-safe-area'}
  ])await check(engine+'-'+sample.name,browser,{viewport:{width:sample.w,height:sample.h}},async page=>{
   await open(page,sample.id);if(sample.safe)await page.addStyleTag({content:'.scenic-screen{--safe-top:47px;--safe-bottom:34px}'});
   if(sample.mode!=='question'){await choose(page,sample.mode==='correct');await state(page,'feedback-'+sample.mode);}
   const m=await metrics(page);assert.equal(m.overflowX,false);assert.equal(m.overflowY,false);assert.equal(m.answers.length,4);assert(m.answers.every(b=>b.labelFits&&b.icons===0&&b.h>=40&&b.y+b.h<sample.h));
   assert(m.flag.y+m.flag.h<=m.paper.y+5,'Flag hits question paper');
   if(sample.mode!=='question'){
    assert.equal(m.raster,'ready');assert.equal(m.activeCount,1);
    assert(await page.locator('.scenic-europe-map svg').evaluate((svg,source)=>{const ref=new DOMParser().parseFromString(source,'image/svg+xml'),active=svg.querySelector('.country'),original=ref.querySelector('[data-country="'+active.dataset.country+'"]'),base=svg.querySelector('image');return base.getAttribute('x')==='0'&&base.getAttribute('y')==='0'&&base.getAttribute('width')==='680'&&base.getAttribute('height')==='500'&&(!original||original.getAttribute('d')===active.getAttribute('d'));},canonicalEurope),'Raster and selected SVG must use the canonical coordinates');assert(m.captionFits,'country and capital must fit within the protected cartouche');assert(m.highlight);assert(m.neighbors>=6&&m.neighbors<=11);assert(m.labels>=3);assert(m.foldImages);assert.equal(m.inkPhase,'complete');assert.equal(m.inkGrains,0);assert.equal(m.inkOutside,0);assert.equal(m.animations,0,'Steady atlas must not keep moving');
    assert.equal(m.swipeVisible,sample.mode==='wrong');assert(m.atlas.y+m.atlas.h<m.answers[0].y);
   }
   await capture(page,engine==='chromium'?sample.name:engine+'-'+sample.name);
  });
  if(phase!=='layout'){
   await check(engine+'-animation-frames',browser,{},async page=>{
    await open(page);const fixedBottom=await page.locator('.scenic-paper-bottom').boundingBox();await choose(page,false);
    await page.waitForFunction(()=>document.querySelector('#scenic-map-scroll').classList.contains('is-opening'));
    const compassSize=await page.locator('.scenic-compass').boundingBox();
    assert.equal(await page.locator('#scenic-hero').evaluate(n=>getComputedStyle(n).visibility),'visible','Opening paper must cover the flag progressively');
    // Pause and seek the actual Web Animations timeline. Screenshot overhead
    // cannot skip a fold; each frame has a precise fraction of the same opening.
    for(const [label,fraction] of [['start',.06],['middle',.47],['end',.92]]){
     await page.evaluate(({fraction,duration})=>{for(const a of document.getAnimations())if(a.effect?.target?.matches('.scenic-fold-leaf,.scenic-fold-shade,.scenic-fold-light,.scenic-paper-top,.scenic-compass,.scenic-prompt')){a.pause();a.currentTime=duration*fraction;}},{fraction,duration:SCENIC.openMs});
     const opacity=await page.locator('.scenic-fold-leaf').evaluateAll(nodes=>nodes.map(n=>Number(getComputedStyle(n).opacity)));
     const bottomNow=await page.locator('.scenic-paper-bottom').boundingBox();assert(Math.abs(bottomNow.y-fixedBottom.y)<.1&&Math.abs(bottomNow.height-fixedBottom.height)<.1,'Lower paper and engraving remain fixed');
     const compassNow=await page.locator('.scenic-compass').boundingBox();assert(Math.abs(compassSize.width-compassNow.width)<.1&&Math.abs(compassSize.height-compassNow.height)<.1,'Compass has a constant size throughout unfolding');
     assert.equal(await page.locator('#scenic-map-scroll').getAttribute('data-ink-phase'),null,'Ink must wait for the entire unfolding');assert(opacity.every(x=>x===0||x===1),'paper surfaces must stay opaque');
     await capture(page,engine+'-unroll-'+label);
    }
    await page.evaluate(()=>document.getAnimations().forEach(a=>a.play()));await state(page,'feedback-wrong');
    assert.equal(await page.locator('#scenic-hero').evaluate(n=>getComputedStyle(n).visibility),'visible','The flag stays underneath the paper without a visibility jump');
    await slide(page);await page.waitForFunction(()=>document.querySelector('#scenic-map-scroll').classList.contains('is-closing'));
    assert.equal(await page.locator('#scenic-map-scroll').getAttribute('data-ink-phase'),'empty','Map dissolves before paper folds');
    for(const [label,fraction] of [['start',.06],['middle',.47],['end',.92]]){
     await page.evaluate(({fraction,duration})=>{for(const a of document.getAnimations())if(a.effect?.target?.matches('.scenic-fold-leaf,.scenic-fold-shade,.scenic-fold-light,.scenic-paper-top,.scenic-compass,.scenic-prompt')){a.pause();a.currentTime=duration*fraction;}},{fraction,duration:SCENIC.closeMs});
     await capture(page,engine+'-rollup-'+label);
    }
    await page.evaluate(()=>document.getAnimations().forEach(a=>a.play()));await state(page,'playing');
    await page.locator('[data-action="restart"]').click();await state(page,'playing');await choose(page,false);await state(page,'feedback-wrong');
    const captures=[['falling',.10],['settled',.40],['forming',.84],['end',.93]];
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
  if(phase!=='layout')await check(engine+'-ink-passes-and-continuous-material',browser,{},async page=>{
   await open(page);const compass=await page.locator('.scenic-compass').boundingBox(),bottom=await page.locator('.scenic-paper-bottom').boundingBox();
   assert.equal(await page.locator('#scenic-score').isVisible(),false);assert.equal(await page.locator('#scenic-compass').evaluate(n=>n.parentElement.id),'scenic-stage','Compass sits outside the folding 3D context');
   const sign=await page.locator('#scenic-task').boundingBox(),bar=await page.locator('#scenic-progress').boundingBox();assert(sign.x>195);assert(sign.y<bar.y+bar.height&&sign.y+sign.height>bar.y+bar.height,'Task sign hangs across the timer bar');
   await page.evaluate(()=>document.querySelector('#scenic-screen').dataset.qaInkAt='0.12');await choose(page,false);
   for(const [index,fraction] of [.12,.43,.73,.97].entries()){
    await page.waitForFunction(f=>document.querySelector('#scenic-screen').dataset.qaInkCaptured===String(f),fraction);
    const m=await metrics(page);assert.equal(m.inkPhase,'drawing');assert.equal(m.inkGrains,0);assert.equal(m.inkOutside,0);assert(Math.abs(m.compass.w-compass.width)<.1&&Math.abs(m.compass.h-compass.height)<.1,'Compass must not scale');
    assert.equal(await page.locator('#scenic-map-scroll').evaluate(n=>n.classList.contains('is-open')),true);const now=await page.locator('.scenic-paper-bottom').boundingBox();assert(Math.abs(now.y-bottom.y)<.1,'Engraved bottom stays fixed');
    await capture(page,engine+'-ink-pass-'+(index+1));
    await page.evaluate(next=>{if(next!==null)document.querySelector('#scenic-screen').dataset.qaInkAt=String(next);window.dispatchEvent(new CustomEvent('scenic-qa-pause',{detail:false}));},[.43,.73,.97,null][index]);
   }
   await state(page,'feedback-wrong');await page.evaluate(()=>document.querySelector('#scenic-screen').dataset.qaInkAt='0.46');await slide(page);
   await page.waitForFunction(()=>document.querySelector('#scenic-screen').dataset.qaInkCaptured==='0.46');assert.equal(await page.locator('#scenic-map-scroll').getAttribute('data-ink-phase'),'erasing');assert.equal(await page.locator('#scenic-map-scroll').evaluate(n=>n.classList.contains('is-open')),true);await capture(page,engine+'-ink-erasing');
   await page.evaluate(()=>window.dispatchEvent(new CustomEvent('scenic-qa-pause',{detail:false})));await state(page,'playing');
  });
  if(phase==='full'){
   await check(engine+'-transparent-atlas-and-editorial-heading',browser,{},async page=>{
    await open(page);await choose(page,false);await state(page,'feedback-wrong');
    const atlas=await page.locator('.scenic-europe-map image').evaluate(async n=>{const im=new Image();im.src=n.getAttribute('href');await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const cx=c.getContext('2d');cx.drawImage(im,0,0);const px=cx.getImageData(0,0,c.width,c.height).data;let empty=0,partial=0;for(let i=3;i<px.length;i+=4){if(!px[i])empty++;else if(px[i]<245)partial++;}return {empty:empty/(px.length/4),partial:partial/(px.length/4),corner:px[3]};});
    assert.equal(atlas.corner,0,'The atlas has no sea rectangle');assert(atlas.empty>.3&&atlas.partial>.08,'Real transparent holes and dry wash must survive in the shared WebP');
    assert.equal(await page.locator('.scenic-europe-map').evaluate(n=>getComputedStyle(n).maskImage),'none','No blurred map vignette');
    assert.equal((await metrics(page)).inkGrains,0);assert(!(await page.locator('#scenic-country-capital').textContent()).includes('Stolica:'));assert.equal(await page.locator('.scenic-capital-icon').count(),1);
    assert(await page.locator('#scenic-feedback').evaluate(n=>getComputedStyle(n).clipPath==='inset(50%)'),'Answer feedback does not occupy atlas space');
   });
   await check(engine+'-pause-and-restart-during-ink',browser,{},async page=>{
    await open(page);await choose(page,false);await page.waitForFunction(()=>document.querySelector('#scenic-map-scroll').dataset.inkPhase==='drawing');
    await page.locator('[data-action="pause"]').click();const pixels=await page.locator('#scenic-map-ink').evaluate(n=>n.toDataURL());await page.waitForTimeout(650);assert.equal(await page.locator('#scenic-map-ink').evaluate(n=>n.toDataURL()),pixels,'Pause freezes every ink mask pixel');
    await page.locator('[data-action="pause"]').click();await state(page,'feedback-wrong');await slide(page);await page.waitForFunction(()=>document.querySelector('#scenic-map-scroll').dataset.inkPhase==='erasing');
    await page.locator('[data-action="pause"]').click();const erased=await page.locator('#scenic-map-ink').evaluate(n=>n.toDataURL());await page.waitForTimeout(450);assert.equal(await page.locator('#scenic-map-ink').evaluate(n=>n.toDataURL()),erased);
    await page.locator('[data-action="restart"]').click();await state(page,'playing');await page.waitForTimeout(SCENIC.inkDrawMs+SCENIC.openMs+200);const m=await metrics(page);assert.equal(m.task,'Zadanie 1');assert.equal(m.state,'playing');assert.equal(m.inkPhase,undefined);
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target?.id!=='scenic-progress-fill').length),0,'Only the game clock progress may animate after restart');
    assert(await page.locator('#scenic-map-ink').evaluate(n=>!n.getContext('2d').getImageData(0,0,n.width,n.height).data.some((v,i)=>i%4===3&&v!==0)),'Restart clears every ink pixel');
   });
   await check(engine+'-stable-scene-and-answer-geometry',browser,{},async page=>{
    await open(page);const before=await metrics(page);
    const scenery=()=>page.locator('#scenic-screen').evaluate(n=>({background:getComputedStyle(n).backgroundImage,foreground:getComputedStyle(n.querySelector('.scenic-foreground')).opacity,replacement:n.querySelectorAll('.scenic-feedback-scene').length,vectorCompass:n.querySelectorAll('.scenic-paper-row svg,.scenic-atlas-compass').length}));
    const first=await scenery();assert.equal(first.vectorCompass,0);assert.equal(first.replacement,0);assert.equal(first.foreground,'1');
    assert.equal(await page.locator('.flag-pole,.scenic-rock-base,.scenic-land-shadow').count(),0,'Mast and rocks belong to one scene image');
    assert(await page.locator('.scenic-foreground').evaluate(n=>getComputedStyle(n).backgroundImage===getComputedStyle(n.closest('main')).backgroundImage),'Hair overlap uses the very same scene');
    await choose(page,false);await page.waitForTimeout(180);await capture(page,engine+'-click-early');await state(page,'feedback-wrong');
    const after=await metrics(page);assert.deepEqual(await scenery(),first);
    for(let i=0;i<4;i++)for(const key of ['x','y','w','h'])assert(Math.abs(before.answers[i][key]-after.answers[i][key])<1,'Answer tiles must not move after an answer');
    await slide(page);await state(page,'playing');assert.deepEqual(await scenery(),first);
    const next=await metrics(page);for(let i=0;i<4;i++)for(const key of ['x','y','w','h'])assert(Math.abs(before.answers[i][key]-next.answers[i][key])<1,'Answer tiles must not move during the next question');
   });
   await check(engine+'-two-line-sand-and-production-slider',browser,{},async page=>{
    await open(page,'ba');const before=await metrics(page);assert(before.answers.some(b=>b.lineCount===2));assert(before.answers.every(b=>b.lineCount<=2&&b.labelFits));
    await choose(page,false);await state(page,'feedback-wrong');
    const clock=await page.locator('#scenic-clock').textContent();await page.locator('#scenic-swipe').click({position:{x:180,y:20}});await page.waitForTimeout(400);assert.equal((await metrics(page)).state,'feedback-wrong');
    const a=await page.locator('#scenic-swipe-knob').boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(a.x+a.width/2+60,a.y+a.height/2);await page.mouse.up();await page.waitForTimeout(550);assert.equal((await metrics(page)).state,'feedback-wrong');assert.equal(await page.locator('#scenic-swipe').getAttribute('aria-valuenow'),'0');
    assert.equal(await page.locator('#scenic-clock').textContent(),clock);assert.equal(await page.locator('#scenic-clock-caption').textContent(),'Czas zatrzymany');
    await page.evaluate(()=>document.querySelector('#scenic-screen').dataset.qaCaptureAt='.76');await slide(page);
    await page.waitForFunction(()=>document.querySelector('#scenic-screen').dataset.qaCaptured==='0.76');
    const moves=await page.locator('#scenic-sand-canvas').evaluate(n=>({up:Number(n.dataset.upward),down:Number(n.dataset.downward)}));assert(moves.up>0&&moves.down>0);
    await capture(page,engine+'-two-line-sand');await page.evaluate(()=>window.dispatchEvent(new CustomEvent('scenic-qa-pause',{detail:false})));await state(page,'playing');
   });
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
    await page.locator('#scenic-swipe').focus();await page.keyboard.press('Enter');assert.equal((await metrics(page)).task,'Zadanie 1');for(let i=0;i<11;i++)await page.keyboard.press('ArrowRight');await state(page,'playing');assert.equal((await metrics(page)).task,'Zadanie 2');assert.equal((await metrics(page)).animations,0);
   });
   await check(engine+'-image-fallback',browser,{},async page=>{
    await page.route('**/assets/maps/europe-scenic.webp',route=>route.abort());await page.route('**/assets/flags/cloth-prebaked/by.webp',route=>route.abort());
    await open(page);assert(await page.locator('.flag-cloth-fallback').evaluate(n=>n.complete&&n.naturalWidth>0));
    await choose(page,false);await state(page,'feedback-wrong');assert.equal((await metrics(page)).raster,'vector-fallback');assert((await metrics(page)).highlight);assert((await metrics(page)).activeCount>1);await capture(page,engine+'-image-fallback');
   });
   await check(engine+'-paper-image-fallback',browser,{},async page=>{
    await page.route('**/assets/flags/adventure/scenic-paper-v14.webp',route=>route.abort());
    await open(page);assert.equal(await page.locator('#scenic-screen').getAttribute('data-question-paper'),'fallback');
    assert.notEqual(await page.locator('.scenic-paper-bottom').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');
    await choose(page,false);await state(page,'feedback-wrong');assert.equal(await page.locator('#scenic-map-scroll').getAttribute('data-material-ready'),'false');
    assert.notEqual(await page.locator('.scenic-paper-bottom').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');
    assert((await metrics(page)).captionFits);await capture(page,engine+'-paper-image-fallback');await slide(page);await state(page,'playing');assert.equal((await metrics(page)).task,'Zadanie 2');
   });
   await check(engine+'-map-fetch-failure',browser,{},async page=>{
    await page.route('**/assets/maps/europe.svg',route=>route.abort());await open(page);await choose(page,false);await state(page,'feedback-wrong');assert((await page.locator('.scenic-map-unavailable').textContent()).includes('niedostępna'));
    await page.locator('#scenic-swipe').focus();for(let i=0;i<11;i++)await page.keyboard.press('ArrowRight');await state(page,'playing');assert.equal((await metrics(page)).task,'Zadanie 2');
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
