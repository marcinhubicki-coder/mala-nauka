// End-to-end settings -> gameplay and all eight Orthography Studio fixtures.
// No production writes: fresh browser context uses ephemeral localStorage.
import assert from 'node:assert/strict';
const {chromium}=await import('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[],broken=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,reducedMotion:'reduce'});
 // A gameplay request for the Studio DOM classifier is an architecture
 // regression: all Orthography screens have first-class declarative contracts.
 const inspectorRequests=[];
 page.on('request',request=>{
  if(!/\/shared\/element-system\.mjs(?:\?|$)/.test(request.url()))return;
  let frameUrl='unknown';
  try{frameUrl=request.frame().url();}catch{}
  inspectorRequests.push({resource:request.url(),frame:frameUrl});
 });
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))broken.push({url:r.url(),status:r.status()});});
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-action="guest-player"]').click();
 await page.locator('#app[data-view="home"]').waitFor();
 await page.locator('[data-action="choose-mode"][data-mode="spelling"]').click();
 const gameFrame=page.frameLocator('iframe[data-mode-host="spelling"]');
 await gameFrame.locator('#app[data-view="wizard"][data-mode="spelling"]').waitFor({timeout:11000});
 await gameFrame.locator('#app [data-spelling-wizard-v2="true"]').waitFor({timeout:9000}).catch(async error=>{
  const diagnostic=await gameFrame.locator('#app').evaluate(el=>({view:el.dataset.view,mode:el.dataset.mode,pending:el.dataset.dsContractPending,html:el.innerHTML.slice(0,500)})).catch(()=>({missingApp:true}));
  throw new Error('Hosted Ortografia wizard did not hydrate: '+JSON.stringify({diagnostic,errors})+'; '+error.message.slice(0,80));
 });
 assert.equal(await gameFrame.locator('#app [data-ds-contract="v2"]').count(),29,'Wizard has an incomplete component contract');
 const before=await gameFrame.locator('[data-ds-element="spelling-level-jelly"]').elementHandle();
 assert.ok(before);
 await gameFrame.locator('[data-ds-element="spelling-scope-categories"]').click();
 await gameFrame.locator('[data-ds-element="spelling-level-1"]').click();
 await gameFrame.locator('[data-ds-element="spelling-limit-count"]').click();
 await gameFrame.locator('[data-ds-element="spelling-word-limit-10"]').click();
 await page.waitForTimeout(100);
 assert.equal(await gameFrame.locator('#app [data-ds-contract="v2"]').count(),29,'Changing spelling options lost component identity');
 assert.equal(await gameFrame.locator('#app').evaluate((app,prior)=>prior.isConnected&&app.querySelector('[data-ds-element="spelling-level-jelly"]')===prior,before),true);
 assert.equal(await gameFrame.locator('input[name="wordLimit"]:checked').inputValue(),'10');
 await gameFrame.locator('#setup-form .start-button').click();
 await gameFrame.locator('#app[data-view="game"][data-mode="spelling"]').waitFor({timeout:13000});
 assert.equal(await gameFrame.locator('#app .answers .answer').count(),2);
 assert.equal(await gameFrame.locator('#app [data-ds-contract="v2"]').count(),17,'Gameplay must render exactly 17 contract pieces');
 assert.equal(await gameFrame.locator('#app .spelling-question-card').count(),1);
 await gameFrame.locator('#app .answers .answer').first().click();
 await gameFrame.locator('#app[data-state^="feedback"]').waitFor({timeout:10000});
 const state=await gameFrame.locator('#app').getAttribute('data-state');
 assert.ok(['feedback-correct','feedback-wrong'].includes(state),state);
 assert.equal(await gameFrame.locator('#app [data-ds-contract="v2"]').count(),17,'Answer feedback replaced the game component tree');

 // Complete the actual hosted round instead of only checking isolated previews.
 await gameFrame.locator('#app [data-action="exit"]').click();
 await gameFrame.locator('#modal[open]').waitFor({timeout:10000});
 assert.equal(await gameFrame.locator('#modal [data-ds-subcontract="spelling-pause"]').count(),4,'Exit confirmation must retain four declared children plus root');
 await gameFrame.locator('#modal [data-action="exit-confirm"]').click();
 await gameFrame.locator('#app[data-view="results"]').waitFor({timeout:18000});
 assert.equal(await gameFrame.locator('#app [data-ds-contract="v2"]').count(),18,'Results must compile all 18 declared parts');
 assert.equal(await gameFrame.locator('#app [data-ds-element="spelling-result-repeat"]').count(),1);
 assert.equal(await gameFrame.locator('#app [data-ds-element="spelling-result-history"][data-action="history"]').count(),1);
 assert.equal(await gameFrame.locator('#app .learning-stats-two [data-action="toggle-result"]').count(),2);
 const retainedRows=await gameFrame.locator('#result-detail-retained .result-word-row').count();
 if(retainedRows)await gameFrame.locator('[data-ds-element="spelling-result-retained"]').click();
 const openPanel=retainedRows?'#result-detail-retained':'#result-detail-review';
 const detailAction=gameFrame.locator(openPanel+' [data-action="show-result-rule"]').first();
 if(await detailAction.count()){
  await detailAction.click();
  await gameFrame.locator('dialog.result-rule-dialog[open]').waitFor({timeout:9000});
  assert.equal(await gameFrame.locator('[data-ds-subcontract="spelling-rule"]').count(),10);
  await gameFrame.locator('dialog.result-rule-dialog .rule-close').click();
  assert.equal(await gameFrame.locator('#app [data-ds-contract="v2"]').count(),18,'Closing rule lost results identity');
 }
 // Check the strict budget while still on the compiled results screen.
 // History is a different, not-yet-migrated module and may legitimately
 // lazy-load the legacy inspector after the history action is dispatched.
 const spellingInspector=inspectorRequests.filter(request=>new URL(request.frame,base).pathname.startsWith('/ortografia/'));
 assert.deepEqual(spellingInspector,[],'Orthography settings/game/results loaded the Studio DOM classifier: '+JSON.stringify(inspectorRequests));
 await gameFrame.locator('[data-ds-element="spelling-result-history"]').click();
 await gameFrame.locator('#app[data-view="history"]').waitFor({timeout:13000});
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
  if(['spelling-initial','spelling-correct','spelling-wrong','spelling-hint','spelling-pause'].includes(viewId))assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),17,'Incomplete gameplay contract: '+viewId);
  if(viewId==='spelling-initial')assert.equal(await page.locator('.answers .answer').count(),2);
  if(['spelling-results','spelling-rule'].includes(viewId))assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),18,'Results family incomplete: '+viewId);
  if(viewId==='spelling-results')assert.equal(await page.locator('.learning-stats-two .result-stat').count(),2);
  if(viewId==='spelling-rule'){
   await page.locator('.result-rule-dialog').waitFor({timeout:10000});
   assert.equal(await page.locator('[data-ds-subcontract="spelling-rule"]').count(),10,'Educational rule must declare all 10 semantic parts');
   await page.locator('.result-rule-dialog .rule-close').click();
   assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),18,'Closing a rule must preserve the results family');
  }
  if(viewId==='spelling-hint'){
   await page.locator('.spelling-hint-sheet').waitFor({timeout:10000});
   assert.equal(await page.locator('[data-ds-subcontract="spelling-hint"]').count(),5,'Hint dialog must declare all five parts');
   await page.locator('.spelling-hint-sheet .hint-dismiss').click();
   assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),17,'Closing a hint must preserve the gameplay family');
  }
  if(viewId==='spelling-pause'){
   await page.locator('#modal[open]').waitFor({timeout:10000});
   assert.equal(await page.locator('[data-ds-subcontract="spelling-pause"]').count(),5,'Pause dialog must declare all five parts');
   await page.locator('#modal [data-action=resume]').click();
   assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),17,'Resuming must preserve gameplay');
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);
 assert.deepEqual(broken,[]);
 console.log(JSON.stringify({ok:true,stages:8,wizardBlocks:29,answerState:state,jsErrors:0,failedLocalRequests:0}));
}finally{await browser.close();}
