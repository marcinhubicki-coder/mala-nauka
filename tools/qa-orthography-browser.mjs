// End-to-end settings -> gameplay and all eight Orthography Studio fixtures.
// No production writes: fresh browser context uses ephemeral localStorage.
import assert from 'node:assert/strict';
const {chromium}=await import('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[],broken=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))broken.push({url:r.url(),status:r.status()});});
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-action="guest-player"]').click();
 await page.locator('#app[data-view="home"]').waitFor();
 await page.locator('[data-action="choose-mode"][data-mode="spelling"]').click();
 await page.locator('#app[data-view="wizard"][data-mode="spelling"]').waitFor();
 await page.waitForFunction(()=>document.querySelector('#app [data-spelling-wizard-v2="true"]')!==null,{timeout:10000});
 assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),29,'Wizard has an incomplete component contract');
 const before=await page.locator('[data-ds-element="spelling-level-jelly"]').elementHandle();
 assert.ok(before);
 await page.locator('[data-ds-element="spelling-scope-categories"]').click();
 await page.locator('[data-ds-element="spelling-level-1"]').click();
 await page.locator('[data-ds-element="spelling-limit-count"]').click();
 await page.locator('[data-ds-element="spelling-word-limit-10"]').click();
 await page.waitForTimeout(90);
 assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),29,'Changing spelling options lost component identity');
 assert.equal(await page.evaluate(node=>node.isConnected&&document.querySelector('[data-ds-element="spelling-level-jelly"]')===node,before),true);
 assert.equal(await page.locator('input[name="wordLimit"]:checked').inputValue(),'10');
 await page.locator('#setup-form .start-button').click();
 await page.locator('#app[data-view="game"][data-mode="spelling"]').waitFor({timeout:13000});
 assert.equal(await page.locator('#app .answers .answer').count(),2);
 assert.equal(await page.locator('#app .spelling-question-card').count(),1);
 await page.locator('#app .answers .answer').first().click();
 await page.waitForFunction(()=>/feedback/.test(document.querySelector('#app')?.dataset.state||''),{timeout:10000});
 const state=await page.locator('#app').getAttribute('data-state');
 assert.ok(['feedback-correct','feedback-wrong'].includes(state),state);
 await page.close();

 const views=[
  ['spelling-settings','wizard','initial'],
  ['spelling-initial','game','initial'],
  ['spelling-correct','game','correct'],
  ['spelling-wrong','game','wrong'],
  ['spelling-results','results','mixed'],
  ['spelling-rule','results','rule'],
  ['spelling-hint','game','hint'],
  ['spelling-pause','game','pause']
 ];
 for(const [viewId,screen,state] of views){
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(viewId+': '+e.message));
  await page.goto(base+'/ortografia/?'+new URLSearchParams({studio:'1',mode:'spelling',screen,state,viewId}),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#app')?.dataset.view,{timeout:12000});
  await page.waitForTimeout(450);
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.dsView),viewId);
  if(viewId==='spelling-settings')assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),29);
  if(viewId==='spelling-initial')assert.equal(await page.locator('.answers .answer').count(),2);
  if(viewId==='spelling-results')assert.equal(await page.locator('.learning-stats-two .result-stat').count(),2);
  if(viewId==='spelling-rule')assert.ok(await page.locator('.rule-dialog-head').count());
  await page.close();
 }
 assert.deepEqual(errors,[]);
 assert.deepEqual(broken,[]);
 console.log(JSON.stringify({ok:true,stages:8,wizardBlocks:29,answerState:state,jsErrors:0,failedLocalRequests:0}));
}finally{await browser.close();}
