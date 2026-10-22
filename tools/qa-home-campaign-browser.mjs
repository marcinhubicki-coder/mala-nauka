// Local browser regression: the campaign action and back control survive Studio Undo.
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:8872',output=process.env.V2_SCREENSHOT_DIR||'.design-qa/home-campaign';
await mkdir(output,{recursive:true});
const report={checks:[],errors:[]};
for(const[name,engine]of[['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(name+': '+e.message));
 try{
  await page.goto(base+'/?studio=1&viewId=home&screen=home');await page.locator('#app[data-ds-contract-ready=home]').waitFor();
  const homeMeasure=()=>page.locator('.home-welcome').evaluate(n=>{const rect=s=>n.querySelector(s).getBoundingClientRect().toJSON(),button=n.querySelector('.home-campaign-cta');return {welcome:n.getBoundingClientRect().toJSON(),button:rect('.home-campaign-cta'),subtitle:rect('.home-hero-copy'),stats:rect('.home-stats'),animations:getComputedStyle(button).animationName,sparks:button.querySelectorAll('.home-campaign-sparks i').length};});
  // Freeze finite phases to measure the largest visible pulse as well as the rest state.
  for(const time of[0,2300,4600]){await page.locator('.home-campaign-cta').evaluate((n,t)=>n.getAnimations().forEach(a=>{a.pause();a.currentTime=t;}),time);const m=await homeMeasure();assert(m.button.width<=m.welcome.width*.45);assert(m.button.top>=m.subtitle.bottom+5);assert(m.button.bottom<m.stats.top-10);assert.equal(m.sparks,10);assert.match(m.animations,/breathe/);}
  await page.screenshot({path:output+'/'+name+'-home.png'});
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.home-campaign-cta').evaluate(n=>getComputedStyle(n).animationName),'none');
  for(const viewport of[{width:320,height:568},{width:768,height:1024},{width:1440,height:900},{width:390,height:844}]){await page.setViewportSize(viewport);const m=await homeMeasure();assert(m.button.width<=m.welcome.width*.45+.5);assert(m.button.top>m.subtitle.bottom);assert(m.button.bottom<m.stats.top);assert(await page.locator('.home-campaign-label').evaluate(n=>{const a=n.getBoundingClientRect(),b=n.closest('button').getBoundingClientRect();return a.top>b.top&&a.bottom<b.bottom&&a.left>b.left&&a.right<b.right;}));}
  report.checks.push(name+': bubble pulse, sparkles, reduced motion and responsive spacing');
  await page.locator('.home-campaign-cta').click();await page.locator('.campaign-map').waitFor();
  const campaignMeasure=()=>page.locator('.campaign-screen').evaluate(n=>{const token=n.querySelector('.campaign-token'),tile=n.querySelector('.campaign-tile.is-selected'),back=n.querySelector('.navigation-back'),svg=back.querySelector('svg');return {back:back.getBoundingClientRect().toJSON(),arrow:svg.getBoundingClientRect().toJSON(),token:Number(getComputedStyle(token).zIndex),tile:Math.max(Number(getComputedStyle(tile).zIndex),Number(getComputedStyle(n.querySelector('.campaign-leader')).zIndex)),sharedPlane:token.parentElement===n.querySelector('.campaign-leader').parentElement,corners:tile.style.clipPath.split(',').length,translate:getComputedStyle(tile).translate};});
  let m=await campaignMeasure();assert.equal(m.back.width,44);assert.equal(m.arrow.width,24);assert(m.token>m.tile);assert(m.sharedPlane);assert.equal(m.corners,4);assert.equal(m.translate,'none');await page.screenshot({path:output+'/'+name+'-campaign.png'});
  await page.getByRole('button',{name:'Wróć',exact:true}).click();await page.locator('.home-campaign-cta').waitFor();
  report.checks.push(name+': Home ↔ Campaign; shared back arrow, four-corner field and character above selection');

  await page.setViewportSize({width:1700,height:1100});await page.goto(base+'/design-system/#components');await page.locator('[data-open-view=campaign]').click();
  const frame=page.locator('#device-frame').contentFrame(),back=frame.locator('.campaign-header .navigation-back');await back.waitFor();
  const id=await back.getAttribute('data-ds-element'),select=()=>page.locator('[data-tree-select="'+id+'"]').first().click();assert(id);
  await page.locator('#component-search').fill('Wróć');await select();await page.locator('#free-layout').check();await select();await frame.locator('.ds-selected-outline [data-resize-handle]').waitFor();
  const before=await back.boundingBox(),outline=await frame.locator('.ds-selected-outline').boundingBox();
  await page.mouse.move(outline.x+outline.width/2,outline.y+outline.height/2);await page.mouse.down();await page.mouse.move(outline.x+outline.width/2+18,outline.y+outline.height/2+12,{steps:6});await page.mouse.up();await page.locator('#geometry-undo:enabled').waitFor();
  await page.locator('#geometry-undo').click();await page.waitForTimeout(120);const restored=await back.boundingBox();assert(Math.abs(restored.x-before.x)<1);assert(Math.abs(restored.y-before.y)<1);
  await page.locator('#geometry-redo').click();await page.locator('#geometry-accept').click();await page.locator('#undo-toolbar:enabled').waitFor();await page.locator('#undo-toolbar').click();await page.waitForTimeout(150);
  const after=await back.evaluate(n=>({b:n.getBoundingClientRect().toJSON(),a:n.querySelector('svg').getBoundingClientRect().toJSON()}));assert.equal(after.b.width,44);assert.equal(after.a.width,24);assert.equal(after.a.height,24);assert(Math.abs(after.a.x+12-after.b.x-22)<1);assert(Math.abs(after.a.y+12-after.b.y-22)<1);
  await page.screenshot({path:output+'/'+name+'-undo.png',fullPage:true});
  await back.click();await frame.locator('.home-campaign-cta').waitFor();await page.waitForFunction(()=>document.querySelector('#view-select')?.value==='home');
  await frame.locator('.home-campaign-cta').click();await back.waitFor();
  report.checks.push(name+': temporary Undo / Redo, Accept then global Undo preserve the back control and its navigation');
 }catch(error){await page.screenshot({path:output+'/'+name+'-failure.png',fullPage:true});throw error;}
 finally{await writeFile(output+'/report.json',JSON.stringify(report,null,2));await browser.close();}
}
assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
