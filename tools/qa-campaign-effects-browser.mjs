import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.argv[2]||'http://127.0.0.1:8874',out='.design-qa/v50';await mkdir(out,{recursive:true});
const report={checks:[],errors:[],metrics:{}};
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width:1800,height:1200},serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(name+': '+e.message));
 try{
  await page.goto(base+'/design-system/?v=50-qa#campaign-lab');const frame=page.locator('#adventure-campaign-frame').contentFrame();
  const map=frame.locator('.campaign-map[data-reveal-index="0"]');await map.waitFor();
  const geometry=await frame.locator('.campaign-screen').evaluate(s=>({scene:s.getBoundingClientRect().toJSON(),canvas:s.querySelector('canvas').getBoundingClientRect().toJSON()}));
  assert(Math.abs(geometry.canvas.y-geometry.scene.y)<1);assert(Math.abs(geometry.canvas.height-geometry.scene.height)<1);assert(Math.abs(geometry.canvas.width-390)<1);
  await page.locator('[data-lab-ambient]').click();await frame.locator('.campaign-live-piece').first().waitFor();
  const pieces=await frame.locator('.campaign-live-piece').evaluateAll(nodes=>nodes.map(n=>({reveal:Number(n.dataset.reveal),state:n.getAnimations()[0]?.playState})));assert(pieces.length>1&&pieces.length<=12);assert(pieces.every(p=>p.reveal<.5));
  await frame.locator('.campaign-screen').screenshot({path:out+'/'+name+'-map-live.png'});
  await frame.locator('.campaign-puzzle-motion:empty').waitFor();const area=await frame.locator('.campaign-screen').boundingBox();await page.mouse.move(area.x+30,area.y+25);await frame.locator('.campaign-live-piece').first().waitFor();
  const metrics=await frame.locator('.campaign-map').evaluate(async n=>{const samples=[],start=performance.now(),paints=n.dataset.puzzlePaints;let frames=0;await new Promise(resolve=>{const tick=now=>{frames++;if(now-start>=12000)return resolve();requestAnimationFrame(tick);};requestAnimationFrame(tick);});return {frames,seconds:(performance.now()-start)/1000,paintBefore:paints,paintAfter:n.dataset.puzzlePaints,runs:Number(n.dataset.ambientRuns),paintMs:Number(n.dataset.paintMs),cells:Number(n.dataset.puzzleCells)};});
  assert.equal(metrics.paintBefore,metrics.paintAfter);assert(metrics.runs>=2);assert(metrics.frames>160,JSON.stringify(metrics));report.metrics[name]=metrics;
  await page.locator('[data-lab-progress="5"]').first().click();await frame.locator('.campaign-map[data-teleport=complete][data-reveal-index="5"]').waitFor();
  await page.locator('[data-lab-ambient]').click();await frame.locator('.campaign-live-piece').first().waitFor();assert((await frame.locator('.campaign-live-piece').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.reveal)))).every(v=>v<.5));
  await frame.locator('.campaign-screen').screenshot({path:out+'/'+name+'-map-step5.png'});
  report.checks.push(name+': full-height grid, bounded hidden-cell chain, static underlying canvas, teleport then ambient resume');

  await page.locator('[data-adventure-tab=effects]').click();const preview=page.locator('.effect-lab-screen');await preview.waitFor();await page.locator('[data-effect-replay]').click();await page.locator('.power-card[data-card-charged=true]').waitFor();
  assert.equal(await preview.locator('.power-card').count(),1);assert.equal(await preview.evaluate(n=>n.getBoundingClientRect().width),390);
  for(const [level,effect]of [[1,'sparks'],[2,'bubbles'],[3,'fireflies']]){await page.locator('#effect-level').selectOption(String(level));await preview.locator(`[data-card-effect="${effect}"]`).waitFor();assert.equal(await preview.locator('.reward-card-magic i').count(),7);}
  await page.locator('#effect-level').selectOption('1');
  for(const effect of ['sparks','bubbles','fireflies','electric','diamonds','waves','wind','aurora']){await page.locator('[data-reward-effect="level-0"]').selectOption(effect);await preview.locator(`[data-card-effect="${effect}"]`).waitFor();}
  await page.locator('[data-effect-reset]').click();
  await page.locator('#effect-level').selectOption('2');await preview.locator('.power-card[data-card-charged=true]').waitFor();await preview.screenshot({path:out+'/'+name+'-forge-card.png'});
  await page.locator('#effect-ready').uncheck();assert.equal(await preview.locator('.reward-card-magic').evaluate(n=>getComputedStyle(n).opacity),'0');
  await preview.locator('.reward-criteria').last().scrollIntoViewIfNeeded();
  await page.locator('[data-effect-replay]').click();await preview.locator('.reward-criteria').last().scrollIntoViewIfNeeded();
  const observed=await preview.locator('.reward-criteria').last().evaluate(async group=>{const nodes=[...group.querySelectorAll('[data-progress-count]')],hist=nodes.map(()=>new Set()),started=nodes.map(()=>null),origin=performance.now();await new Promise(resolve=>{const tick=now=>{nodes.forEach((n,i)=>{const v=Number(n.textContent);hist[i].add(v);if(v>0&&started[i]===null)started[i]=now-origin;});if(now-origin>1900)return resolve();requestAnimationFrame(tick);};requestAnimationFrame(tick);});return {hist:hist.map(v=>[...v]),started,final:nodes.map(n=>Number(n.textContent))};});
  assert.deepEqual(observed.final,[5,7,2]);assert(observed.hist[0].includes(1)&&observed.hist[0].includes(5));assert(observed.started[1]>observed.started[0]+120);assert(observed.started[2]>observed.started[1]+120);report.metrics[name].counters=observed;
  report.checks.push(name+': eight presets; four level recipes; actual 390px card; ready-state effect; staggered whole-number counters');

  await page.locator('#effect-ready').check();await page.locator('#effect-target').selectOption('reward');await page.locator('#effect-recipe').selectOption('spelling-constellation');await page.locator('#effect-level').selectOption('4');await preview.locator('[data-card-effect=electric]').waitFor();await page.locator('#effect-recipe').selectOption('spelling-explorer');await page.locator('#effect-level').selectOption('2');
  await preview.locator('.adventure-reward-card').click();const dialog=page.locator('.adventure-reward-dialog');await dialog.waitFor();await dialog.locator('.reward-criterion[data-progress-complete=true]').first().waitFor();assert.equal(await dialog.locator('.adventure-chest').count(),0);
  const slider=dialog.locator('input[type=range]');await slider.focus();await slider.press('End');await dialog.locator('.reward-upgrade-light').waitFor();await dialog.locator('.revealed-award').waitFor();await dialog.screenshot({path:out+'/'+name+'-reward-upgrade.png'});await dialog.locator('.reward-status').filter({hasText:'Zapisano'}).waitFor();assert.equal(await dialog.locator('.reward-upgrade-light').count(),0);await dialog.getByRole('button',{name:'Zamknij',exact:true}).click();
  await page.locator('#effect-target').selectOption('cup');assert.equal(await preview.locator('.knowledge-gems').count(),0);assert(!await preview.locator('.knowledge-award').innerText());
  report.checks.push(name+': real reward slider, existing award evolves without a chest, finite blackout and staggered beams cleaned up, no floating text diamonds on cup');

  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-effect-replay]').click();await preview.locator('.reward-criterion[data-progress-complete=true]').last().waitFor();
  assert.equal(await preview.locator('.reward-card-magic i').first().evaluate(n=>getComputedStyle(n).animationName),'none');
  await page.locator('[data-adventure-tab=lab]').click();await frame.locator('.campaign-map[data-reveal-index]').waitFor();await page.locator('[data-lab-ambient]').click();assert.equal(await frame.locator('.campaign-live-piece').count(),0);report.checks.push(name+': reduced-motion retains readable final values and disables optical movement');
 }catch(error){await page.screenshot({path:out+'/'+name+'-failure.png',fullPage:true});throw error;}
 finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
}
// Coarse-pointer devices receive autonomous light pulses without pointer events.
const mobileBrowser=await webkit.launch(),mobile=await mobileBrowser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),phone=await mobile.newPage();
try{await phone.goto(base+'/?studio=1&viewId=campaign&screen=campaign');await phone.locator('.campaign-map[data-reveal-index]').waitFor();assert.equal(await phone.evaluate(()=>matchMedia('(hover:hover) and (pointer:fine)').matches),false);await phone.locator('.campaign-live-piece').first().waitFor({timeout:15000});assert(await phone.locator('.campaign-live-piece').count()<=12);await phone.screenshot({path:out+'/mobile-map-autonomous.png'});report.checks.push('webkit touch: autonomous mobile illumination without hover');}finally{await mobileBrowser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
