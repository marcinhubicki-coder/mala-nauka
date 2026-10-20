// Isolated guest profiles: real campaign rounds, persistence and current renderers.
import {chromium,webkit} from 'playwright';import assert from 'node:assert/strict';import {writeFile,mkdir} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:8873',report=[],output=process.env.V2_SCREENSHOT_DIR||'.design-qa/campaign-games';await mkdir(output,{recursive:true});
for(const[name,engine]of[['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});page.setDefaultTimeout(30000);
 try{
 await page.goto(base+'/');await page.evaluate(async()=>{const{playerService}=await import('/player-service.mjs');await playerService.init();playerService.beginGuestSession();const{cleanProgress}=await import('/progress.mjs');const p=cleanProgress(null),{adventure}=await fetch('/design-system/config.json').then(r=>r.json());p.journey.adventure.campaign.completed=[adventure.steps[0].id];p.journey.adventure.campaign.started=true;await playerService.saveProgress('guest',p);});
 await page.reload();await page.locator('.home-campaign-cta').click();await page.locator('[data-campaign-start="city-0-math"]').click();const math=page.frameLocator('iframe[data-mode-host=math]');await math.locator('[data-math-quiz]').waitFor();
 assert.equal(await math.locator('[data-answer]').count(),6);assert.equal(await math.locator('.math-round-time span').textContent(),'1/10');assert.equal(await math.locator('[data-math-pause]').textContent(),'Ⅱ');await math.locator('[data-math-pause]').click();await math.locator('.math-pause-dialog button').click();assert.equal(await math.locator('#app').getAttribute('data-campaign-mode'),'math');await page.screenshot({path:output+'/'+name+'-campaign-math.png'});
 for(let i=0;i<10;i++){
  const quiz=math.locator('[data-math-quiz]'),id=await quiz.getAttribute('data-question-id'),correct=Number(await quiz.getAttribute('data-correct-answer'));assert(correct<=10);await math.locator('[data-answer="'+correct+'"]').click();
  if(i<9)await math.locator('[data-math-quiz]:not([data-question-id="'+id+'"])').waitFor();
 }
 await math.locator('.campaign-return').waitFor();assert.match(await math.locator('.campaign-return').textContent(),/Dalej/);
 const progress=await page.evaluate(async()=>JSON.parse(sessionStorage.getItem('malaNauka.guestProgress.v1')));assert(progress.journey.adventure.campaign.completed.includes('city-0-math'));assert.equal(progress.history[0].campaignStepId,'city-0-math');assert.equal(progress.history[0].correct,10);assert.equal(progress.history[0].attempts.length,10);assert.equal(progress.history[0].limitMode,'count');
 await math.locator('.campaign-return').click();await page.locator('[data-campaign-start="city-0-english"]').waitFor();await page.locator('iframe[data-mode-host=math]').waitFor({state:'detached'});report.push(name+': campaign uses current math, six answers, add≤10, 10 tasks, saved completion and return');
 // Unlock the first flags step only in this isolated test profile.
 await page.evaluate(async()=>{const{playerService}=await import('/player-service.mjs');const p=await playerService.getProgress('guest');p.journey.adventure.campaign.completed.push('city-0-english');await playerService.saveProgress('guest',p);});await page.reload();await page.locator('.home-campaign-cta').click();await page.locator('[data-campaign-start="city-0-flags"]').click();
 const flags=page.frameLocator('iframe[data-mode-host=flags]');await flags.locator('#scenic-screen[data-ready=true]').waitFor();await flags.locator('.scenic-answer:not([disabled])').first().waitFor();assert.equal(await flags.locator('.scenic-answer').count(),4);
 const correct=await flags.locator('#scenic-screen').evaluate(()=>window.frameElement.scenicSession.current.countryId);const answers=flags.locator('.scenic-answer');let wrong;
 for(let i=0;i<4;i++){if((await answers.nth(i).getAttribute('data-id'))!==correct){wrong=answers.nth(i);break;}}await wrong.click();await flags.locator('#scenic-map-scroll[aria-hidden=false]').waitFor();await flags.locator('#scenic-swipe:not([hidden])').waitFor();await flags.locator('[data-map-view=europe]').click();await page.waitForTimeout(700);await page.screenshot({path:output+'/'+name+'-flags-map.png'});assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);report.push(name+': campaign flags ready, four answers, feedback, atlas and zoom out without failed assets');
 }catch(error){await page.screenshot({path:output+'/'+name+'-failure.png'});console.error(JSON.stringify({errors,failed}));throw error;}
 finally{await writeFile(output+'/games-report.json',JSON.stringify({report,errors,failed},null,2));await browser.close();}
}console.log(JSON.stringify(report,null,2));
