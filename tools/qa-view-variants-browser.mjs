// Exercise data-dependent contracts through their actual renderers.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.argv[2]||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const checks=[];
async function fixture(params,config={}){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
 await context.addInitScript(value=>localStorage.setItem('malaNauka.v1.configs',JSON.stringify(value)),config);
 await context.route('**/design-system/bridge.mjs',route=>route.fulfill({contentType:'text/javascript',body:''}));
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 const view=params.viewId;console.log('Checking '+view+'/'+params.state+' '+JSON.stringify(config));
 const folder=({english:'angielski',reading:'czytanie',flags:'flagi',math:'matematyka'})[params.mode];
 await page.goto(base+(folder?'/'+folder+'/':'/')+'?'+new URLSearchParams({studio:'1',mode:'spelling',...params}),{waitUntil:'domcontentloaded'});
 await page.waitForFunction(id=>document.querySelector('#app')?.dataset.dsContractReady===id&&!document.querySelector('#app')?.dataset.scenarioPending,view).catch(async error=>{throw Error(JSON.stringify({params,errors,app:await page.locator('#app').evaluate(n=>({data:{...n.dataset},text:n.innerText.slice(0,400)}))})+'; '+error.message);});
 return {context,page,errors};
}
try{
 for(const count of ['one','two','three']){
  const {context,page,errors}=await fixture({screen:'players',state:count,viewId:'players'});
  const expected={one:1,two:2,three:3}[count];assert.equal(await page.locator('.player-card').count(),expected);
  const before=await page.locator('.player-card').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.dataset.player,n.dataset.dsElement])));
  // Reordering real records must not remap their instance overrides.
  await page.locator('.player-grid').evaluate(n=>n.append(...[...n.children].reverse()));
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  assert.deepEqual(await page.locator('.player-card').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.dataset.player,n.dataset.dsElement]))),before);
  assert.deepEqual(errors,[]);checks.push('players-'+count);await context.close();
 }
 for(const [name,config]of [['memory',{category:'memory',difficulty:1}],['phrase',{category:'reading',difficulty:2}],['sentence',{category:'reading',difficulty:3}]]){
  for(const state of ['initial','correct','wrong']){
   const {context,page,errors}=await fixture({mode:'reading',screen:'game',state,viewId:'reading-'+state},{reading:config});
   const nodes=await page.locator('#app [data-ds-element]').evaluateAll(nodes=>nodes.map(n=>n.dataset.dsElement));
   assert.equal(new Set(nodes).size,nodes.length);assert.deepEqual(errors,[]);
   checks.push('reading-'+name+'-'+state);await context.close();
  }
 }
 // The same data-independent family must handle an empty result.
 for(const state of ['empty','correct','review','dyktando']){
  const {context,page,errors}=await fixture({screen:'results',state,viewId:'spelling-results'});
  assert.equal(await page.locator('[data-ds-element="spelling-result-history"]').count(),1);
  assert.deepEqual(errors,[]);checks.push('result-'+state);await context.close();
 }
 const {context,page,errors}=await fixture({mode:'english',screen:'wizard',state:'initial',viewId:'english-settings'});
 const original=await page.locator('[data-ds-element="mission"]').evaluate(n=>[...n.parentElement.children].map(e=>e.dataset.dsElement));
 const ordered=await page.evaluate(async()=>{
  const {applyDesign,currentDesign}=await import('/shared/design-runtime.mjs');
  const config=structuredClone(currentDesign());
  config.elementOrder={...config.elementOrder,'english-settings':{'layout-root':['setup-form','mission']}};
  config.elementOverrides={...config.elementOverrides,'english-settings':{'mission-illustration':{visibility:'hidden'},'setup-start':{radius:29}}};
  applyDesign(config);
  return {order:[...document.querySelector('[data-ds-element="mission"]').parentElement.children].map(e=>e.dataset.dsElement),visibility:getComputedStyle(document.querySelector('[data-ds-element="mission-illustration"]')).visibility,radius:getComputedStyle(document.querySelector('[data-ds-element="setup-start"]')).borderRadius};
 });
 assert.ok(ordered.order.indexOf('setup-form')<ordered.order.indexOf('mission'));assert.equal(ordered.visibility,'hidden');assert.equal(ordered.radius,'29px');
 await page.evaluate(async()=>{const {applyDesign,currentDesign}=await import('/shared/design-runtime.mjs');const config=structuredClone(currentDesign());delete config.elementOrder['english-settings'];delete config.elementOverrides['english-settings'];applyDesign(config);});
 assert.deepEqual(await page.locator('[data-ds-element="mission"]').evaluate(n=>[...n.parentElement.children].map(e=>e.dataset.dsElement)),original);
 assert.equal(await page.locator('[data-ds-element="mission-illustration"]').evaluate(n=>getComputedStyle(n).visibility),'visible');
 assert.deepEqual(errors,[]);checks.push('order-visibility-style-reset');await context.close();
 console.log(JSON.stringify({ok:true,checks}));
}finally{await browser.close();}
