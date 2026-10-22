import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const layoutOnly=process.env.MN_QA_LAYOUT_ONLY==='1';
const base=process.argv[2]||'http://127.0.0.1:8874',out='.design-qa/v58',report={checks:[],errors:[]};await mkdir(out,{recursive:true});
for(const [name,engine]of[['chromium',chromium],['webkit',webkit]]){
 const b=await engine.launch(),p=await b.newPage({viewport:{width:1500,height:1000},serviceWorkers:'block',reducedMotion:'no-preference'});p.on('pageerror',e=>report.errors.push(name+': '+e.message));
 try{
  if(!layoutOnly){
  await p.goto(base+'/?studio=1&screen=history&state=achievements&viewId=trophies');await p.getByRole('button',{name:'Medale',exact:true}).click();
  const card=p.locator('[data-adventure-reward="spelling-explorer"]'),dialog=p.locator('.adventure-reward-dialog');await card.click();
  const original=await dialog.elementHandle();await dialog.getByRole('slider').press('End');await dialog.locator('.reward-status').filter({hasText:'Zapisano!'}).waitFor();
  assert(await original.evaluate(n=>n.isConnected&&n.matches(':modal')&&n.parentElement.id==='app'),'discovery must preserve connected modal');assert.match(await card.innerText(),/Brąz/);
  await dialog.getByRole('button',{name:'Zamknij',exact:true}).click();await dialog.waitFor({state:'detached'});await card.click();await dialog.getByRole('slider').press('End');
  await p.locator('.adventure-reward-dialog[data-hologram-phase=charging]').waitFor();assert.notEqual(await dialog.evaluate(n=>getComputedStyle(n).transform),'none');await p.screenshot({path:out+'/'+name+'-hologram.png'});
  await dialog.locator('.reward-status').filter({hasText:'Zapisano!'}).waitFor();assert(await dialog.evaluate(n=>n.matches(':modal')&&n.parentElement.id==='app'));assert.equal(await p.locator('.reward-hologram').count(),0);assert.match(await card.innerText(),/Srebro/);
  await dialog.getByRole('button',{name:'Zamknij',exact:true}).click();await dialog.waitFor({state:'detached'});
  const locked=p.locator('[data-adventure-reward="campaign-stargazer"]');await locked.click();await dialog.waitFor();assert(await dialog.evaluate(n=>n.matches(':modal')));await dialog.getByRole('button',{name:'Zamknij',exact:true}).click();await dialog.waitFor({state:'detached'});
  await card.click();await dialog.evaluate(n=>document.body.append(n));assert(await dialog.evaluate(n=>n.open&&!n.matches(':modal')));await locked.click();assert(await dialog.evaluate(n=>n.matches(':modal')&&n.parentElement.id==='app'));await dialog.getByRole('button',{name:'Zamknij',exact:true}).click();await dialog.waitFor({state:'detached'});
  report.checks.push(name+': PWA discovery and medal upgrade keep the same modal owner; hologram tilts/charges/returns; earned and locked cards reopen; legacy stranded modal recovers.');
  await p.goto(base+'/design-system/?adventureTab=effects#adventure');await p.locator('[data-border-view=focus]').click();assert.equal(await p.locator('.border-gallery.is-focused [inert]').count(),0);await p.locator('.power-card [data-adventure-power]').click();await p.locator('.power-card[data-hologram-phase=charging]').waitFor();await p.waitForFunction(()=>document.querySelector('.power-card>strong').textContent.includes('Poziom 1/3'));await p.locator('.reward-hologram').waitFor({state:'detached'});report.checks.push(name+': Studio card 1:1 accepts clicks and plays hologram with the new power level during charging.');
  }
  if(layoutOnly||name==='chromium'){
   await p.goto(base+'/design-system/?adventureTab=cast#adventure');const f=p.locator('#adventure-campaign-frame').contentFrame();await f.locator('.campaign-map').waitFor();await p.locator('[data-story-step="1"]').first().click();await f.locator('.campaign-map[data-reveal-index="1"]').waitFor();await p.locator('#lab-guide-entrance').selectOption('peek-right');
   for(const device of['iphone','desktop']){
    await p.locator('#studio-preview-device input[value='+device+']').check();await p.locator('[data-story-play]').click();await f.locator('.campaign-narrator[data-ready=true]').waitFor();await p.waitForTimeout(700);
    const geometry=await f.locator('.iskierka-bubble').evaluate(n=>({r:n.getBoundingClientRect().toJSON(),w:innerWidth,h:innerHeight,scene:document.querySelector('.campaign-screen').getBoundingClientRect().toJSON(),stage:document.querySelector('.iskierka-stage').getBoundingClientRect().toJSON(),shadow:getComputedStyle(document.querySelector('.iskierka-stage'),':before').maskImage,lip:getComputedStyle(document.querySelector('.iskierka-stage'),':after').backgroundImage}));assert(geometry.r.width/geometry.scene.width>.85,JSON.stringify(geometry));assert(geometry.r.left>=geometry.scene.left+10&&geometry.r.right<=geometry.scene.right-10&&geometry.r.top>=0&&geometry.r.bottom<=geometry.h,JSON.stringify(geometry));assert(geometry.shadow.includes('url(')&&geometry.lip.includes('gradient'));
    await f.locator('.campaign-screen').screenshot({path:out+'/dialog-'+device+(name==='chromium'?'':'-'+name)+'.png'});await f.locator('[data-campaign-story-accept]').click();await f.locator('.campaign-narrator').waitFor({state:'detached'});
   }
   report.checks.push(name+': Phone and desktop: broad text bubble inside viewport, edge-aligned peeking pose, alpha silhouette shadow and shaded seam.');
  }
 }catch(e){report.errors.push(name+': '+e.message);await p.screenshot({path:out+'/'+name+'-failure.png'});throw e;}finally{await b.close();await writeFile(out+(layoutOnly?'/layout-report.json':'/report.json'),JSON.stringify(report,null,2));}
}
assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
