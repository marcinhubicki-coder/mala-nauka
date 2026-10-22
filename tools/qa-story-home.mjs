// Focused smoke: the new home, its real destinations and the unchanged chrome.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
import {storyHomeModel} from '../shared/story-home.mjs';
import {adventureConfig} from '../shared/adventure-model.mjs';
const config=adventureConfig(),output='outputs/v61',base=process.argv[2]||'http://127.0.0.1:8874';await mkdir(output,{recursive:true});
for(const [count,host]of [[0,'guide'],[4,'mira'],[7,'bor'],[8,'bor'],[11,'bor']]){
 const progress={journey:{sparks:220900000,adventure:{campaign:{completed:config.steps.slice(0,count).map(s=>s.id)}}}},before=JSON.stringify(progress),model=storyHomeModel(progress,config,{avatarId:'c'});
 assert.equal(model.npc,host);assert.equal(model.sparks,220);assert.equal(JSON.stringify(progress),before);
}
const checks=[];
for(const [engine,type]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error(engine,e.message);});page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.error(engine,m.text());}});
  await page.goto(base+'/?studio=1&screen=home&state=story&viewId=home-story');
  await page.waitForFunction(()=>document.querySelector('#app')?.dataset.dsContractReady==='home-story');
  await page.evaluate(async()=>{await document.querySelector('#app').mnScreenReady;await document.querySelector('#app').mnEntrance;await document.fonts.ready;window.homeProof={logo:document.querySelector('.home-logo-art'),settings:document.querySelector('.home-settings-button'),switch:document.querySelector('.home-style-jelly'),rects:[...document.querySelectorAll('.home-logo-art,.home-settings-button')].map(e=>JSON.stringify(e.getBoundingClientRect().toJSON()))};});
  assert.deepEqual(await page.locator('.story-home-stage').getAttribute('data-host'),'bor');
  const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,images:[...document.querySelectorAll('#app img')].filter(e=>!e.complete||!e.naturalWidth).map(e=>e.src),labels:[...document.querySelectorAll('.story-home-tools .story-home-shortcut>span:last-child')].map(e=>e.getBoundingClientRect().y),switchBottom:document.querySelector('.home-play-style').getBoundingClientRect().bottom,gaps:(()=>{const settings=document.querySelector('.home-settings-button').getBoundingClientRect(),card=document.querySelector('.story-home-landscape').getBoundingClientRect(),jelly=document.querySelector('.home-style-jelly').getBoundingClientRect();return {upper:card.top-settings.bottom,lower:jelly.top-card.bottom};})()}));
  assert.equal(geometry.overflow,false);assert.deepEqual(geometry.images,[]);assert.ok(Math.max(...geometry.labels)-Math.min(...geometry.labels)<1,'shortcut labels align');assert.ok(geometry.switchBottom<=844);assert.ok(Math.abs(geometry.gaps.upper-geometry.gaps.lower)<2,JSON.stringify(geometry.gaps));
  await page.screenshot({path:output+'/home-story-'+engine+'.png'});
  await page.getByText('Swobodny',{exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#app')?.dataset.dsContractReady==='home');await page.evaluate(()=>document.querySelector('#app').mnScreenReady);
  assert.equal(await page.locator('.home-game-button').count(),5);
  assert.equal(await page.evaluate(()=>window.homeProof.logo===document.querySelector('.home-logo-art')&&window.homeProof.settings===document.querySelector('.home-settings-button')&&window.homeProof.switch===document.querySelector('.home-style-jelly')&&JSON.stringify(window.homeProof.rects)===JSON.stringify([...document.querySelectorAll('.home-logo-art,.home-settings-button')].map(e=>JSON.stringify(e.getBoundingClientRect().toJSON())))),true,'preserved chrome and Jelly nodes/positions');
  await page.screenshot({path:output+'/home-free-'+engine+'.png'});
  await page.getByText('Fabularny',{exact:true}).click();await page.waitForFunction(()=>document.querySelector('#app')?.dataset.dsContractReady==='home-story');await page.evaluate(()=>document.querySelector('#app').mnScreenReady);
  // Native radio keyboard navigation and the shared Jelly drag both change the same content state.
  await page.locator('input[name=homePlayStyle][value=story]').focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('#app')?.dataset.dsContractReady==='home');await page.evaluate(()=>document.querySelector('#app').mnScreenReady);
  await page.keyboard.press('ArrowLeft');await page.waitForFunction(()=>document.querySelector('#app')?.dataset.dsContractReady==='home-story');await page.evaluate(()=>document.querySelector('#app').mnScreenReady);
  const box=await page.locator('.home-style-jelly').boundingBox();await page.mouse.move(box.x+box.width*.25,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.75,box.y+box.height*.5,{steps:12});await page.mouse.up();await page.waitForFunction(()=>document.querySelector('#app')?.dataset.dsContractReady==='home');await page.evaluate(()=>document.querySelector('#app').mnScreenReady);
  await page.getByText('Fabularny',{exact:true}).click();await page.waitForFunction(()=>document.querySelector('#app')?.dataset.dsContractReady==='home-story');await page.evaluate(()=>document.querySelector('#app').mnScreenReady);
  for(const [action,target]of [['home-forge','forge'],['home-awards','trophies'],['home-book','campaign-book'],['home-artifact','campaign-book']]){
   console.log(engine,action);await page.locator('[data-action="'+action+'"]').click();await page.waitForFunction(id=>document.querySelector('#app')?.dataset.dsContractReady===id,target);await page.evaluate(()=>document.querySelector('#app').mnScreenReady);
   if(action==='home-artifact')assert.equal(await page.locator('.campaign-book').getAttribute('data-current-page'),'key');
   await page.getByRole('button',{name:'Wróć',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#app')?.dataset.dsContractReady==='home-story');
  }
  await page.locator('.story-home-continue').click();await page.waitForFunction(()=>document.querySelector('#app')?.dataset.dsContractReady==='campaign');
  assert.deepEqual(errors,[]);checks.push({engine,viewport:[390,844],geometry,errors,flows:['story → free → story, stable chrome and Jelly, keyboard and drag','forge → home','awards → home','book → home','artifact page → home','continue → campaign']});
 }finally{await browser.close();}
}
await writeFile(output+'/smoke.json',JSON.stringify({ok:true,model:'NPC discovery and integer sparks, no progress mutation',checks},null,2));console.log(JSON.stringify({ok:true,engines:checks.map(c=>c.engine),flows:checks[0].flows}));
