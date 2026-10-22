// End-to-end settings -> gameplay and all eight Orthography Studio fixtures.
// No production writes: fresh browser context uses ephemeral localStorage.
import assert from 'node:assert/strict';
import {SPELLING_OVERLAYS} from '../shared/spelling-overlays.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const {chromium}=await import('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const errors=[],broken=[];
const visualDirectory=process.env.V2_SCREENSHOT_DIR||'';
const screenshots=[];
if(visualDirectory)await mkdir(visualDirectory,{recursive:true});
// Capture the actual PWA viewport at iPhone 13 Pro DPR 3. These diagnostic
// PNGs are uploaded as short-lived CI artifacts, never bundled by Vercel.
async function capture(page,viewId,reference){
 if(!visualDirectory)return;
 // Compare a fully revealed result, not a frame from the 3-second counter,
 // because an intermediate reveal can look faded or artificially dark.
 if(viewId.includes('results'))for(const frame of page.frames()){
  if(!/\/ortografia\//.test(frame.url()))continue;
  await frame.waitForFunction(()=>{
   const result=document.querySelector('#app[data-view="results"] .result-v4');
   return Boolean(result&&!result.classList.contains('result-entering'));
  },null,{timeout:12000});
 }
 await page.evaluate(()=>document.fonts.ready);
 const file=viewId+'.png';
 await page.screenshot({path:join(visualDirectory,file),animations:'disabled',timeout:20000});
 const frames=[];
 for(const frame of page.frames()){
  if(!/\/ortografia\/|\/index\.html$/.test(frame.url()))continue;
  const geometry=await frame.evaluate(()=>{
   const selectors={
    sheet:'.result-sheet',heading:'.result-heading',title:'.result-title-wrap h1',
    intro:'.result-heading > p',summary:'.round-summary',score:'.round-summary-line',
    progress:'.round-progress',stats:'.learning-stats-two',
    details:'.result-details',panel:'.result-detail:not([hidden])',
    rows:'.result-word-viewport',lastRow:'.result-word-row:last-child',
    actions:'.result-actions',again:'.result-again',collection:'.result-collection'
   };
   const round=n=>Math.round(n*10)/10;
   return Object.fromEntries(Object.entries(selectors).map(([key,sel])=>{
    const node=document.querySelector('#app '+sel);if(!node)return [key,null];
    const r=node.getBoundingClientRect(),css=getComputedStyle(node);
    return [key,{x:round(r.left),y:round(r.top),w:round(r.width),h:round(r.height),display:css.display,overflow:css.overflow}];
   }));
  }).catch(()=>null);
  if(geometry?.sheet){
   const paint=await frame.evaluate(()=>{
    const node=document.querySelector('#app .result-again'),sheet=document.querySelector('#app .result-v4');
    if(!node)return null;
    const styles=getComputedStyle(node),pseudo=getComputedStyle(node,'::before');
    return {opacity:styles.opacity,filter:styles.filter,background:styles.backgroundImage,
      backgroundColor:styles.backgroundColor,disabled:node.hasAttribute('disabled'),
      entering:sheet?.classList.contains('result-entering'),fillOpacity:pseudo.opacity};
   }).catch(()=>null);
   if(viewId.includes('results')){
    assert.ok(paint?.background?.includes('gradient'),
      'Results CTA lost approved pink glass gradient to the generic .primary rule: '+JSON.stringify(paint));
    assert.notEqual(paint?.backgroundColor,'rgb(182, 84, 115)',
      'Deprecated .primary background leaked into Ortografia results');
   }
   frames.push({frame:frame.url(),geometry,paint});
  }
 }
 screenshots.push({view:viewId,approvedReference:reference,file,viewport:'390x844',dpr:3,frames});
}

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
 await capture(page,'home','IMG_2946.png');
 await page.locator('[data-action="choose-mode"][data-mode="spelling"]').click();
 const gameFrame=page.frameLocator('iframe[data-mode-host="spelling"]');
 await gameFrame.locator('#app[data-view="wizard"][data-mode="spelling"]').waitFor({timeout:11000});
 await gameFrame.locator('#app [data-spelling-wizard-v2="true"]').waitFor({timeout:9000}).catch(async error=>{
  const diagnostic=await gameFrame.locator('#app').evaluate(el=>({view:el.dataset.view,mode:el.dataset.mode,pending:el.dataset.dsContractPending,html:el.innerHTML.slice(0,500)})).catch(()=>({missingApp:true}));
  throw new Error('Hosted Ortografia wizard did not hydrate: '+JSON.stringify({diagnostic,errors})+'; '+error.message.slice(0,80));
 });
 assert.equal(await gameFrame.locator('#app [data-ds-contract="v2"]').count(),29,'Wizard has an incomplete component contract');
 // Production IMG_2947.png measures the white setup sheet at about
 // x=14, y=223, width=362 in the 390x844 iPhone artboard.
 const setupBounds=await gameFrame.locator('.setup-card.spelling-wizard-v2').evaluate(node=>{
  const rect=node.getBoundingClientRect();return {x:rect.left,y:rect.top,width:rect.width};
 });
 assert.ok(Math.abs(setupBounds.x-14)<9,'Wizard sheet changed its horizontal reference position: '+JSON.stringify(setupBounds));
 assert.ok(Math.abs(setupBounds.y-223)<12,'Wizard sheet changed its vertical reference position: '+JSON.stringify(setupBounds));
 assert.ok(Math.abs(setupBounds.width-362)<14,'Wizard sheet no longer matches the approved side margins: '+JSON.stringify(setupBounds));
 // Approved production design has a visible educational line between the
 // options card and pink CTA. Check it in the *hosted PWA*, not just Studio.
 const wizardFooter=await gameFrame.locator('#setup-form').evaluate(form=>{
  const get=sel=>{const el=form.querySelector(sel),r=el?.getBoundingClientRect(),css=el?getComputedStyle(el):null;return el?{text:el.textContent.trim(),top:r.top,bottom:r.bottom,height:r.height,width:r.width,display:css.display,visibility:css.visibility,opacity:css.opacity,color:css.color}:null;};
  return {card:get('.setup-card'),note:get('.wizard-note'),button:get('.start-button')};
 });
 assert.ok(wizardFooter.note?.text.length>12,'Missing educational note: '+JSON.stringify(wizardFooter));
 assert.match(wizardFooter.note.text,/10 losowych słów/,'First round must explain the tutorial');
 assert.ok(wizardFooter.note.height>=12&&wizardFooter.note.display!=='none'&&wizardFooter.note.visibility!=='hidden','Wizard note is invisible: '+JSON.stringify(wizardFooter));
 assert.ok(wizardFooter.note.top>=wizardFooter.card.bottom+8&&wizardFooter.note.bottom<wizardFooter.button.top,
  'Wizard note/CTA spacing does not match production: '+JSON.stringify(wizardFooter));
 // IMG_2947.png reference CTA begins at approximately y=629 CSS px. The
 // global atom offset belongs to other modules; this exception is spelling-only.
 assert.ok(Math.abs(wizardFooter.button.top-630)<=12,'Approved CTA offset drifted: '+JSON.stringify(wizardFooter));
 await capture(page,'spelling-settings-live','IMG_2947.png');
 const before=await gameFrame.locator('[data-ds-element="spelling-level-jelly"]').elementHandle();
 assert.ok(before);




 await page.waitForTimeout(100);
 assert.equal(await gameFrame.locator('#app [data-ds-contract="v2"]').count(),29,'Changing spelling options lost component identity');
 assert.equal(await gameFrame.locator('#app').evaluate((app,prior)=>prior.isConnected&&app.querySelector('[data-ds-element="spelling-level-jelly"]')===prior,before),true);
 assert.equal(await gameFrame.locator('input[name="wordLimit"]:checked').inputValue(),'10');
 await gameFrame.locator('#setup-form .start-button').click();
 await gameFrame.locator('#app[data-view="game"][data-mode="spelling"]').waitFor({timeout:13000});
 assert.equal(await gameFrame.locator('#app .answers .answer').count(),2);
 assert.ok(await gameFrame.locator('#app [data-ds-contract="v2"]').count()>=17,'Gameplay retains all core parts and reward companions');
 await capture(page,'spelling-game-live',null);
 assert.equal(await gameFrame.locator('#app .spelling-question-card').count(),1);
 await gameFrame.locator('#app .answers .answer').first().click();
 await gameFrame.locator('#app[data-state^="feedback"]').waitFor({timeout:10000});
 const state=await gameFrame.locator('#app').getAttribute('data-state');
 assert.ok(['feedback-correct','feedback-wrong'].includes(state),state);
 assert.ok(await gameFrame.locator('#app [data-ds-contract="v2"]').count()>=17,'Answer feedback replaced the game component tree');

 // Complete the actual hosted round instead of only checking isolated previews.
 await gameFrame.locator('#app [data-action="exit"]').click();
 await gameFrame.locator('#modal[open]').waitFor({timeout:10000});
 assert.equal(await gameFrame.locator('#modal [data-ds-subcontract="spelling-pause"]').count(),4,'Exit confirmation must retain four declared children plus root');
 await gameFrame.locator('#modal [data-action="exit-confirm"]').click();
 await gameFrame.locator('#app[data-view="results"]').waitFor({timeout:18000});
 assert.ok(await gameFrame.locator('#app [data-ds-contract="v2"]').count()>=18,'Results retain core parts and reward companions');
 await capture(page,'spelling-results-live','IMG_2950.png');
 assert.equal(await gameFrame.locator('#app [data-ds-element="spelling-result-repeat"]').count(),1);
 assert.equal(await gameFrame.locator('#app [data-ds-element="spelling-result-history"][data-action="forge"]').count(),1);
 assert.equal(await gameFrame.locator('#app .learning-stats-two [data-action="toggle-result"]').count(),2);
 // The approved results background is one canonical image, not an invisible duplicate DOM picture.
 const background=await gameFrame.locator('#app[data-view=results][data-mode=spelling]').evaluate(async root=>{
  const value=getComputedStyle(root).backgroundImage;
  const at=value.indexOf('url(');
  const url=at<0?'':value.slice(at+4).split(')')[0].trim().replaceAll('"','').replaceAll("'",'');
  const response=url?await fetch(url):null;
  return {value,status:response?.status||0};
 });
 assert.ok(background.value.includes('result-background-v6.webp'),'Wrong results background: '+JSON.stringify(background));
 assert.equal(background.status,200,'Approved bunny and meadow asset could not be loaded');
 const pointsBounds=await gameFrame.locator('#app .result-points-bubble').evaluate(node=>{
  const rect=node.getBoundingClientRect();return {width:rect.width,height:rect.height};
 });
 assert.ok(Math.abs(pointsBounds.width-pointsBounds.height)<3,'Points pearl is distorted into an oval: '+JSON.stringify(pointsBounds));
 const retainedRows=await gameFrame.locator('#result-detail-retained .result-word-row').count();
 if(retainedRows)await gameFrame.locator('[data-ds-element="spelling-result-retained"]').click();
 const openPanel=retainedRows?'#result-detail-retained':'#result-detail-review';
 const detailAction=gameFrame.locator(openPanel+' [data-action="show-result-rule"]').first();
 if(await detailAction.count()){
  await detailAction.click();
  await gameFrame.locator('dialog.result-rule-dialog[open]').waitFor({timeout:9000});
  assert.equal(await gameFrame.locator('[data-ds-subcontract="spelling-rule"]').count(),SPELLING_OVERLAYS.rule.length);
  await gameFrame.locator('dialog.result-rule-dialog .rule-close').click();
  assert.ok(await gameFrame.locator('#app [data-ds-contract="v2"]').count()>=18,'Closing rule lost results identity');
 }
 // Check the strict budget while still on the compiled results screen.
 // History is a different, not-yet-migrated module and may legitimately
 // lazy-load the legacy inspector after the history action is dispatched.
 const spellingInspector=inspectorRequests.filter(request=>new URL(request.frame,base).pathname.startsWith('/ortografia/'));
 assert.deepEqual(spellingInspector,[],'Orthography settings/game/results loaded the Studio DOM classifier: '+JSON.stringify(inspectorRequests));
 await gameFrame.locator('[data-ds-element="spelling-result-history"]').click();
 await gameFrame.locator('#app[data-view="history"]').waitFor({timeout:13000});
 await page.close();

 // Approved IMG_2949 vs IMG_2948: answering must not reflow the scene.
 let approvedGameGeometry=null;
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
  if(['spelling-initial','spelling-correct','spelling-wrong','spelling-results'].includes(viewId))
   await capture(page,viewId,{ 'spelling-initial':null,'spelling-correct':null,'spelling-wrong':null,'spelling-results':'IMG_2950.png' }[viewId]);
  if(viewId==='spelling-settings')assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),29);
  if(['spelling-initial','spelling-correct','spelling-wrong','spelling-hint','spelling-pause'].includes(viewId))assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),17,'Incomplete gameplay contract: '+viewId);
  if(viewId==='spelling-initial')assert.equal(await page.locator('.answers .answer').count(),2);
  if(['spelling-initial','spelling-correct','spelling-wrong'].includes(viewId)){
   const geometry=await page.locator('#app').evaluate(root=>{
    const selectors={header:'.game-bar',title:'.spelling-title',visual:'.spelling-visual',question:'.spelling-question-card',choices:'.answers',actions:'.spelling-action-row'};
    return Object.fromEntries(Object.entries(selectors).map(([key,selector])=>{
     const node=root.querySelector(selector);if(!node)throw Error('Missing '+selector);
     const r=node.getBoundingClientRect();return [key,{x:r.x,y:r.y,w:r.width,h:r.height}];
    }));
   });
   assert.ok(geometry.title.y>90&&geometry.title.y<230,'Title left the approved upper third: '+JSON.stringify(geometry.title));
   assert.ok(geometry.visual.y>150&&geometry.visual.y<265,'Storybook picture shifted: '+JSON.stringify(geometry.visual));
   assert.ok(geometry.choices.y>520&&geometry.choices.y<690,'Answer cards shifted: '+JSON.stringify(geometry.choices));
   if(approvedGameGeometry){
    const differences=Object.entries(geometry).flatMap(([part,rect])=>Object.entries(rect)
     .filter(([axis,value])=>Math.abs(value-approvedGameGeometry[part][axis])>3)
     .map(([axis,value])=>({part,axis,delta:Math.round((value-approvedGameGeometry[part][axis])*10)/10})));
    assert.deepEqual(differences,[],'Gameplay layout changed between approved question states: '+viewId);
   }else approvedGameGeometry=geometry;
   if(viewId==='spelling-wrong'){
    const rail=page.locator('.spelling-continue-rail'),handle=rail.locator('.continue-handle');
    const [r,h]=await Promise.all([rail.boundingBox(),handle.boundingBox()]);
    assert.ok(r&&h,'Wrong answer lacks a slider or handle');
    assert.ok(Math.abs(h.width-h.height)<2,'Slider pearl is not circular: '+JSON.stringify(h));
    assert.ok(r.y>=geometry.choices.y+geometry.choices.h-8,'Slider overlaps answer buttons');
    const initialHandle=await handle.boundingBox();
    await rail.focus();
    for(let step=0;step<5;step++)await rail.press('ArrowRight');
    assert.equal(await rail.getAttribute('aria-valuenow'),'50','Half drag must be 50%');
    const paintedFill=await rail.evaluate(el=>getComputedStyle(el,'::before').opacity);
    assert.ok(Number(paintedFill)>.95,'Slider gradient must be visible with keyboard input, got '+paintedFill);
    const halfHandle=await handle.boundingBox();
    assert.ok(halfHandle.x>initialHandle.x+40,'Half drag did not move the bubble');
    await capture(page,'spelling-wrong-half','IMG_2948.png');
    for(let step=0;step<4;step++)await rail.press('ArrowRight');
    assert.equal(await rail.getAttribute('aria-valuenow'),'90','Near-end drag must be 90%');
    assert.equal(await rail.evaluate(el=>el.classList.contains('is-near-end')),true,'Near-end slider must hide instructional copy');
    const endHandle=await handle.boundingBox();
    assert.ok(endHandle.x>halfHandle.x+35,'Near-end drag did not progress');
    await capture(page,'spelling-wrong-near-end',null);
    const after=await page.locator('#app').evaluate(root=>{
     return Object.fromEntries(['.game-bar','.spelling-title','.spelling-visual','.answers'].map(selector=>{
      const node=root.querySelector(selector),r=node.getBoundingClientRect();
      return [selector,{x:r.x,y:r.y,w:r.width,h:r.height}];
     }));
    });
    for(const [selector,baseline] of Object.entries({'.game-bar':geometry.header,'.spelling-title':geometry.title,'.spelling-visual':geometry.visual,'.answers':geometry.choices}))
     for(const [key,current] of Object.entries(after[selector]))
      assert.ok(Math.abs(current-baseline[key])<3,'Dragging slider reflowed '+selector+' '+key);
   }
   console.log('[game-parity-'+viewId+'] '+JSON.stringify(geometry));
  }

  if(['spelling-results','spelling-rule'].includes(viewId))assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),18,'Results family incomplete: '+viewId);
  if(viewId==='spelling-results')assert.equal(await page.locator('.learning-stats-two .result-stat').count(),2);
  if(viewId==='spelling-results'){
   const spacing=await page.locator('#app').evaluate(root=>{
    const bounds=selector=>{const r=root.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom};};
    return {subtitle:bounds('.result-heading>p'),score:bounds('.round-summary-line'),
      progress:bounds('.round-progress'),stats:bounds('.learning-stats-two'),
      details:bounds('.result-details'),actions:bounds('.result-actions')};
   });
   assert.ok(spacing.subtitle.bottom+10<spacing.score.top,'Subtitle overlaps round score: '+JSON.stringify(spacing));
   assert.ok(spacing.progress.bottom<spacing.stats.top,'Progress bar overlaps counters: '+JSON.stringify(spacing));
   assert.ok(spacing.details.bottom<=spacing.actions.top+2,'Review panel is hidden behind results actions: '+JSON.stringify(spacing));
  }
  if(viewId==='spelling-rule'){
   await page.locator('.result-rule-dialog').waitFor({timeout:10000});
   assert.equal(await page.locator('[data-ds-subcontract="spelling-rule"]').count(),SPELLING_OVERLAYS.rule.length,'Educational rule must declare every current semantic part');
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
 if(visualDirectory)await writeFile(join(visualDirectory,'manifest.json'),
  JSON.stringify({revision:process.env.GITHUB_SHA||null,branch:'refactor/v2-parity-first',capturedAt:new Date().toISOString(),screenshots},null,2)+'\n');
 assert.deepEqual(errors,[]);
 assert.deepEqual(broken,[]);
 console.log(JSON.stringify({ok:true,stages:8,wizardBlocks:29,answerState:state,jsErrors:0,failedLocalRequests:0}));
}finally{await browser.close();}
