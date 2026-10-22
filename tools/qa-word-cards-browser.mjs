// Real collection → word dialog, with the same production renderers and ledgers.
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:8787',out=process.env.V2_SCREENSHOT_DIR||'.design-qa/word-cards/flow';await mkdir(out,{recursive:true});
const engine=process.env.WORD_CARD_BROWSER==='webkit'?'webkit':'chromium';
const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const checks=[],errors=[];
try{
 for(const width of [320,390,1440]){
  const context=await browser.newContext({viewport:{width,height:width===1440?900:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(new URL('/index.html?studio=1&mode=spelling&screen=history&state=collection&viewId=collection',base).href);
  await page.locator('.collection-word').first().waitFor();await page.evaluate(()=>document.fonts.ready);
  const all=await page.locator('.collection-word').count();
  assert.equal(await page.locator('.collection-word .word-badge').count(),all*2);
  assert.equal(await page.locator('.collection-word>small').count(),0);
  assert.equal(await page.locator('.collection-word[data-word="żółw"]').count(),1);
  const corner=await page.locator('.collection-word').first().evaluate(e=>{const photo=e.querySelector('.collection-photo').getBoundingClientRect(),a=e.querySelector('.word-badge-mastery').getBoundingClientRect(),b=e.querySelector('.word-badge-star').getBoundingClientRect();return {photo:{x:photo.x,right:photo.right,width:photo.width,bottom:photo.bottom},mastery:{x:a.x,right:a.right,width:a.width,bottom:a.bottom},star:{x:b.x,right:b.right,width:b.width,bottom:b.bottom},gradient:getComputedStyle(e.querySelector('.collection-photo'),'::after').backgroundImage};});
  assert.equal(corner.star.width,16);assert.equal(corner.mastery.width,16);assert.ok(corner.mastery.x>corner.photo.x+corner.photo.width/2);assert.ok(corner.mastery.right<corner.star.x);assert.match(corner.gradient,/23, 18, 47/);
  for(const state of ['mastered','learning','review','all']){
   await page.locator('[data-filter="'+state+'"]').click();
   assert.equal(await page.locator('.collection-word>small').count(),0);
  }
  const turtle=page.locator('.collection-word[data-word="żółw"]');
  await turtle.scrollIntoViewIfNeeded();
  assert.equal(await turtle.locator('.word-spelling-mark').count(),2);
  assert.deepEqual(new Set(await turtle.locator('.word-family').allTextContents()),new Set(['u/ó','rz/ż']));
  if(width===390)await page.screenshot({path:out+'/iphone-collection.png'});
  await turtle.click();const dialog=page.locator('.result-rule-dialog[open]');await dialog.waitFor();
  assert.equal(await dialog.locator('.word-badge-count').count(),2);
  assert.equal(await dialog.locator('.word-spelling-mark').count(),2);
  assert.deepEqual(new Set(await dialog.locator('.word-families .word-family').allTextContents()),new Set(['u/ó','rz/ż']));
  assert.ok((await dialog.locator('.rule-explanation').count())>=2);
  await page.waitForFunction(()=>[...document.querySelectorAll('.result-rule-dialog img.word-badge-art')].every(i=>i.complete&&i.naturalWidth===1254));
  const geometry=await dialog.evaluate(e=>{
   const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width};};
   return {dialog:rect(e),bubble:rect(e.querySelector('.rule-visual')),left:rect(e.querySelector('.word-badge-mastery')),right:rect(e.querySelector('.word-badge-star')),counts:[...e.querySelectorAll('.word-badge-count')].map(rect),scroll:e.querySelector('.rule-dialog-scroll').clientHeight,overflow:e.scrollWidth>e.clientWidth};
  });
  assert.equal(geometry.overflow,false);assert.ok(geometry.scroll>=100);assert.ok(geometry.left.right<=geometry.bubble.x+1);assert.ok(geometry.bubble.right<=geometry.right.x+1);assert.ok(geometry.dialog.x>=0);assert.ok(geometry.dialog.right<=width);
  const center=r=>r.x+r.width/2;
  for(const r of geometry.counts)assert.ok(Math.abs(r.bottom-geometry.bubble.bottom)<1,'Counters align with the bottom of the picture');
  assert.ok(Math.abs(center(geometry.left)-(geometry.dialog.x+geometry.bubble.x)/2)<2);
  assert.ok(Math.abs(center(geometry.right)-(geometry.dialog.right+geometry.bubble.right)/2)<2);
  assert.ok(Math.abs(geometry.left.width-(width===320?46:52.9))<.1);
  await page.screenshot({path:out+'/'+width+'-turtle-dialog.png'});
  await page.waitForFunction(()=>document.querySelector('[data-ds-element="rule-star-art"]')&&document.documentElement.dataset.dsView==='collection');
  await page.evaluate(async()=>{const {applyDesign}=await import('/shared/design-runtime.mjs');window.__wordCardDesign=structuredClone(window.__MALA_NAUKA_DESIGN__);const draft=structuredClone(window.__wordCardDesign);draft.elementOverrides||={};draft.elementOverrides.collection||={};draft.elementOverrides.collection['rule-star-art']={opacity:.73};applyDesign(draft);});
  await page.waitForFunction(()=>Math.abs(Number(getComputedStyle(document.querySelector('[data-ds-element="rule-star-art"]')).opacity)-.73)<.01);
  await page.evaluate(async()=>{const {applyDesign}=await import('/shared/design-runtime.mjs');applyDesign(window.__wordCardDesign);});

  await dialog.locator('.rule-close').click();assert.equal(await page.locator('.result-rule-dialog').count(),0);assert.equal(await turtle.evaluate(e=>e===document.activeElement),true);
  await page.evaluate(async()=>{
   const {renderProgressScreen}=await import('/progress-screen.mjs');const {loadWords}=await import('/shared/asset-loader.mjs');const {cleanProgress}=await import('/progress.mjs');const {exampleJourney}=await import('/shared/test-profiles.mjs');
   const words=await loadWords(),word=words.find(w=>w.word==='żółw'),root=document.querySelector('#app'),progress=cleanProgress(null);
   progress.journey.cards[word.word]={firstSeenAt:'2026-10-01T12:00:00Z',correct:0};
   renderProgressScreen(root,{progress,words,initialScreen:'collection'});
  });
  const empty=page.locator('.collection-word[data-word="żółw"]');assert.equal(await empty.locator('.word-badge.is-empty').count(),2);assert.equal(await empty.locator('.has-word-award').count(),0);
  await empty.click();assert.deepEqual(await page.locator('.word-badge-count').allTextContents(),['0/6','0/5']);await page.screenshot({path:out+'/'+width+'-empty-dialog.png'});await page.locator('.rule-close').click();
  // Opening and reading a word never mutates its learning or reward data.
  const projection=await page.evaluate(async()=>{
   const {renderProgressScreen}=await import('/progress-screen.mjs');const {loadWords}=await import('/shared/asset-loader.mjs');const {exampleJourney}=await import('/shared/test-profiles.mjs');
   const words=await loadWords(),p=exampleJourney(words,.9);window.__wordCardQA={p,before:JSON.stringify(p)};
   renderProgressScreen(document.querySelector('#app'),{progress:p,words,initialScreen:'collection'});document.querySelector('[data-filter=mastered]').click();return {count:words.filter(w=>w.word==='żółw').length};
  });assert.equal(projection.count,1);
  await page.locator('.collection-word[data-word="żółw"]').click();assert.deepEqual(await page.locator('.word-badge-count').allTextContents(),['6/6','30/30']);assert.equal(await page.locator('.result-rule-dialog .word-badge.is-earned').count(),2);
  if(width===390)await page.screenshot({path:out+'/390-mastered-dialog.png'});
  await page.locator('.rule-close').click();assert.equal(await page.evaluate(()=>JSON.stringify(window.__wordCardQA.p)===window.__wordCardQA.before),true);
  checks.push({width,ok:true,collectionCards:all,geometry});await context.close();
 }
 for(const reducedMotion of ['no-preference','reduce']){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__awardMotion=[];const animate=Element.prototype.animate;Element.prototype.animate=function(frames,options){if(this.matches('.word-detail-hero>.word-badge'))window.__awardMotion.push({id:this.dataset.dsElement,state:this.dataset.dsRendererState,frames,options});return animate.call(this,frames,options);};});
  await page.goto(new URL('/index.html?studio=1&mode=spelling&screen=history&state=collection&viewId=collection',base).href);
  await page.locator('.collection-word[data-word="król"]').click();await page.locator('[data-ds-element="rule-mastery-badge"][data-ds-state="mastered"]').waitFor();
  const audit=await page.evaluate(()=>window.__awardMotion);
  if(reducedMotion==='reduce')assert.deepEqual(audit,[]);
  else{
   for(const id of ['rule-mastery-badge','rule-star-badge']){const entry=audit.find(a=>a.id===id&&a.frames.some(f=>Number(f.scale)>1.1));assert.ok(entry,id+' appears then bumps');assert.equal(entry.frames[0].opacity,0);assert.equal(entry.frames[1].opacity,1);assert.equal(entry.frames[1].scale,'1');assert.equal(entry.frames.at(-1).scale,'1');}
   const pulse=audit.filter(a=>a.options.iterations===Infinity);assert.equal(pulse.length,1);assert.equal(pulse[0].id,'rule-mastery-badge');
   await page.waitForFunction(()=>document.querySelector('[data-ds-element="rule-mastery-badge"]').getAnimations().some(a=>a.effect.getTiming().iterations===Infinity&&a.currentTime>250));
   await page.evaluate(async()=>{const {applyDesign}=await import('/shared/design-runtime.mjs');const c=structuredClone(window.__MALA_NAUKA_DESIGN__);c.recipeStates['group-word-award'].mastered.idleAnimation='none';applyDesign(c);});
   assert.equal(await page.locator('[data-ds-element="rule-mastery-badge"]').evaluate(e=>e.getAnimations().filter(a=>a.effect.getTiming().iterations===Infinity).length),0);
  }
  await page.locator('.rule-close').click();await page.evaluate(()=>{window.__awardMotion=[];});
  assert.equal(await page.locator('.collection-photo .word-badge').evaluateAll(nodes=>nodes.reduce((n,e)=>n+e.getAnimations().length,0)),0);
  await page.locator('.collection-word[data-word="kółko"]').click();await page.locator('[data-ds-element="rule-star-badge"][data-ds-state="empty"]').waitFor();
  const empty=await page.evaluate(()=>window.__awardMotion);
  if(reducedMotion==='reduce')assert.deepEqual(empty,[]);else{assert.equal(empty.length,2);assert.ok(empty.every(a=>a.frames.every(f=>!('scale' in f))&&a.options.iterations!==Infinity));}
  await page.locator('.rule-close').click();await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/report.json',JSON.stringify({ok:true,engine,motion:true,reducedMotion:true,checks,errors},null,2));console.log(JSON.stringify({ok:true,engine,motion:true,reducedMotion:true,widths:checks.map(c=>c.width),errors}));
}finally{await browser.close();}
