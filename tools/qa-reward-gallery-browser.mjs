// Real progress renderer, isolated fixture saves including a failed write.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.argv[2]||'http://127.0.0.1:8766',out='.design-qa/reward-gallery';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const checks=[];
try{
 for(const [device,width,height]of [['iphone',390,844],['desktop',1440,1000]]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const shot=async path=>{await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#app')).opacity)>.99&&getComputedStyle(document.querySelector('#app')).visibility==='visible');await page.screenshot({path});};
  await page.goto(base+'/?studio=1&mode=spelling&screen=history&state=achievements&viewId=trophies');
  await page.locator('.trophy-stage').waitFor();
  await page.evaluate(async()=>{
   const {renderProgressScreen}=await import('/progress-screen.mjs');const {exampleJourney}=await import('/shared/test-profiles.mjs');
   const words=(await Promise.all(Array.from({length:8},(_,i)=>fetch('/data/words-0'+(i+1)+'.json').then(r=>r.json())))).flat();
   const progress=exampleJourney(words,.9);window.galleryFixture={progress,saved:structuredClone(progress.journey),failNext:true,writes:0};
   renderProgressScreen(document.querySelector('#app'),{progress,words,initialScreen:'achievements',onSave:async next=>{if(window.galleryFixture.failNext){window.galleryFixture.failNext=false;throw Error('Próba błędu zapisu');}window.galleryFixture.writes++;window.galleryFixture.saved=structuredClone(next);}});
  });
  await page.locator('[data-progress=trophy-upgrade]').click();
  await page.locator('.trophy-upgrade-dialog[open]').waitFor();
  assert.equal(await page.locator('.trophy-upgrade-dialog .reward-sprite').count(),0);
  assert.equal(await page.locator('.trophy-gift').count(),2);
  await page.locator('[data-progress=trophy-choice][data-choice=b]').click();
  await page.locator('.trophy-dialog-feedback').filter({hasText:'Nie udało się'}).waitFor();
  assert.equal(await page.locator('.trophy-on-podium').getAttribute('data-trophy-path'),'a');
  assert.equal(await page.evaluate(()=>window.galleryFixture.saved.trophies['mastery-5'].path),'a');
  assert.equal(await page.locator('[data-progress=trophy-choice][data-choice=b]').isEnabled(),true);
  await page.locator('.trophy-later').click();await page.locator('.trophy-upgrade-dialog').waitFor({state:'detached'});
  await shot(out+'/'+device+'-podium.png');
  await page.locator('[data-progress=trophy-upgrade]').click();await shot(out+'/'+device+'-surprise.png');
  await page.locator('[data-progress=trophy-choice][data-choice=b]').click();
  await page.locator('.trophy-stage[data-revealing=true]').waitFor();
  assert.equal(await page.locator('.trophy-on-podium').getAttribute('data-trophy-path'),'a','Old artwork remains until animation');
  assert.equal(await page.evaluate(()=>window.galleryFixture.saved.trophies['mastery-5'].path),'ab','Permanent choice saved before reveal');
  await page.locator('.journey-feedback').filter({hasText:'zapisany'}).waitFor();
  assert.equal(await page.locator('.trophy-on-podium').getAttribute('data-trophy-path'),'ab');
  assert.equal(await page.evaluate(()=>window.galleryFixture.writes),1);
  assert.ok(await page.locator('.trophy-on-podium .reward-sprite').evaluate(e=>e.getBoundingClientRect().height)<=200);
  await page.locator('[data-progress=trophy-select][data-award=discover-all]').click();
  assert.equal(await page.locator('.trophy-evolution > h3').innerText(),'Wielki odkrywca');
  assert.equal(await page.locator('.trophy-on-podium .reward-sprite').count(),0);
  await page.locator('[data-progress=trophy-select]').last().click();
  assert.ok(await page.locator('.trophy-selector').evaluate(rail=>{const selected=rail.querySelector('[aria-pressed=true]'),r=rail.getBoundingClientRect(),s=selected.getBoundingClientRect();return s.right<=r.right+1&&s.left>=r.left-1;}),'Selected trophy remains visible in its horizontal rail');
  await page.locator('[data-progress=award-tab][data-kind=medals]').click();await page.locator('.medal-card').first().waitFor();
  await page.locator('.medal-card[data-ds-contract=v2]').first().waitFor();
  await shot(out+'/'+device+'-medals.png');
  await page.locator('[data-progress=dashboard]').click();await page.locator('.progress-achievements').waitFor();
  assert.equal(await page.locator('image[href*="trophies-v1"]').count(),0);
  await shot(out+'/'+device+'-dashboard.png');
  await page.locator('[data-progress=forge]').click();await page.locator('.forge-emblem').waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0));
  assert.equal(await page.locator('.forge-emblem').evaluate(i=>i.naturalWidth),1200);
  await shot(out+'/'+device+'-forge.png');
  assert.deepEqual(errors,[]);checks.push({device,saveFailure:true,cancel:true,sealedChoices:true,saveBeforeReveal:true,podiumSwitch:true,medalContract:true,artworkDecoded:true});
  await context.close();
 }
 await writeFile(out+'/report.json',JSON.stringify({ok:true,checks},null,2));console.log(JSON.stringify({ok:true,checks}));
}finally{await browser.close();}
