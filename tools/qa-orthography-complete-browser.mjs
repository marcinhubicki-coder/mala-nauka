// Gameplay completion gate: use every question in a ten-word round, including
// an incorrect-answer drag, and verify a naturally concluded results screen.
import assert from 'node:assert/strict';
const {chromium}=await import('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let page;
const errors=[];
try{
 page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-action="guest-player"]').click();
 await page.locator('#app[data-view=home]').waitFor();
 await page.locator('[data-action="choose-mode"][data-mode=spelling]').click();
 const frame=page.frameLocator('iframe[data-mode-host=spelling]');
 await frame.locator('#app [data-spelling-wizard-v2=true]').waitFor({timeout:12000});
 await frame.locator('[data-ds-element=spelling-limit-count]').click();
 await frame.locator('[data-ds-element=spelling-word-limit-10]').click();
 assert.equal(await frame.locator('input[name=wordLimit]:checked').inputValue(),'10');
 await frame.locator('#setup-form .start-button').click();
 await frame.locator('#app[data-view=game]').waitFor({timeout:15000});
 assert.equal(await frame.locator('#app [data-ds-contract=v2]').count(),17);
 let wrong=0,correct=0;
 for(let question=1;question<=10;question++){
  await frame.locator('.time-block .timer').filter({hasText:String(question)+'/10'}).waitFor({timeout:13000});
  await frame.locator('.answers .answer:not([disabled])').first().waitFor({timeout:13000});
  await frame.locator('.answers .answer').first().click();
  await frame.locator('#app[data-state^=feedback]').waitFor({timeout:12000});
  const response=await frame.locator('#app').getAttribute('data-state');
  assert.ok(['feedback-correct','feedback-wrong'].includes(response),'Unexpected feedback at '+question+': '+response);
  assert.equal(await frame.locator('#app [data-ds-contract=v2]').count(),17);
  if(response==='feedback-wrong'){
   wrong++;
   const rail=frame.locator('.spelling-continue-rail');
   await rail.focus();
   for(let i=0;i<10;i++)await rail.press('ArrowRight');
  }else correct++;
  if(question<10){
   await frame.locator('.time-block .timer').filter({hasText:String(question+1)+'/10'}).waitFor({timeout:13000});
  }
 }
 await frame.locator('#app[data-view=results]').waitFor({timeout:22000});
 assert.equal(await frame.locator('#app [data-ds-contract=v2]').count(),18);
 assert.equal(await frame.locator('#app .result-actions [data-ds-element=spelling-result-repeat]').count(),1);
 assert.equal(await frame.locator('#app .result-actions [data-ds-element=spelling-result-history]').count(),1);
 const scores=await frame.locator('.round-summary-line').innerText();
 assert.match(scores,/10/);
 assert.equal(correct+wrong,10);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({ok:true,completed:10,correct,wrong,results:true,jsErrors:0,summary:scores.slice(0,120)}));
}finally{await page?.close();await browser.close();}
