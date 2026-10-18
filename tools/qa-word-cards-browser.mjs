// Real collection → word dialog, with the same production renderers and ledgers.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:8787',out=process.env.V2_SCREENSHOT_DIR||'.design-qa/word-cards/flow';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
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
   return {dialog:rect(e),bubble:rect(e.querySelector('.rule-visual')),left:rect(e.querySelector('.word-badge-mastery')),right:rect(e.querySelector('.word-badge-star')),scroll:e.querySelector('.rule-dialog-scroll').clientHeight,overflow:e.scrollWidth>e.clientWidth};
  });
  assert.equal(geometry.overflow,false);assert.ok(geometry.scroll>=100);assert.ok(geometry.left.right<=geometry.bubble.x+1);assert.ok(geometry.bubble.right<=geometry.right.x+1);assert.ok(geometry.dialog.x>=0);assert.ok(geometry.dialog.right<=width);
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
  await page.locator('.rule-close').click();assert.equal(await page.evaluate(()=>JSON.stringify(window.__wordCardQA.p)===window.__wordCardQA.before),true);
  checks.push({width,ok:true,collectionCards:all,geometry});await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/report.json',JSON.stringify({ok:true,checks,errors},null,2));console.log(JSON.stringify({ok:true,widths:checks.map(c=>c.width),errors}));
}finally{await browser.close();}
