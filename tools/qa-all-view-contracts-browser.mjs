// Real renderers with stopped fixture clocks; no alternate screen markup.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const registry=JSON.parse(await readFile(new URL('../design-system/registry.json',import.meta.url)));
const base=process.argv[2]||'http://127.0.0.1:8765',baseline=process.argv.includes('--baseline');
const output=process.env.V2_SCREENSHOT_DIR||'.design-qa/all41';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const results=[];let writes=Promise.resolve();
const persist=()=>writes=writes.then(()=>writeFile(output+'/'+(baseline?'baseline':'verified')+'.json',JSON.stringify(results,null,2)));
const devices=baseline?[{id:'iphone',width:390,height:844}]:[{id:'iphone',width:390,height:844},{id:'desktop',width:1440,height:900}];
try{
 for(const device of devices){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},serviceWorkers:'block',reducedMotion:'reduce'});
  // Only the fixture loader uses ?studio=1. Disable the optional editor bridge
  // so coverage cannot be satisfied by its former DOM classifier.
  if(!baseline)await context.route('**/design-system/bridge.mjs',route=>route.fulfill({contentType:'text/javascript',body:'// Production-runtime contract verification.'}));
  const pending=registry.views.filter(v=>!process.env.V2_VIEWS||process.env.V2_VIEWS.split(',').includes(v.id));
  async function worker(){while(pending.length){
   const view=pending.shift(),page=await context.newPage(),errors=[],requests=[];
   page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(20000);
   page.on('pageerror',e=>errors.push(e.stack||e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   page.on('request',r=>requests.push(new URL(r.url()).pathname));
   const url=new URL(view.route,base);url.search=new URLSearchParams({studio:'1',mode:view.mode,screen:view.screen,state:view.state,viewId:view.id});
   try{
    await page.goto(url.href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#app')?.dataset.view&&!document.querySelector('#app .loading'));
    await page.waitForFunction(()=>document.fonts.status==='loaded');
    if(!baseline)await page.waitForFunction(id=>document.querySelector('#app')?.dataset.dsContractReady===id,view.id);
    await page.waitForFunction(()=>document.querySelectorAll('#app [data-ds-element]').length>2);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const row=await page.evaluate(()=>({view:document.documentElement.dataset.dsView,screen:document.querySelector('#app').dataset.view,
     nodes:[...document.querySelectorAll('#app [data-ds-element],body>dialog[data-ds-subcontract],body>dialog [data-ds-element]')].map(e=>({id:e.dataset.dsElement,recipe:e.dataset.dsRecipe,kind:e.dataset.dsKind,level:e.dataset.dsLevel,key:e.dataset.dsKey,label:e.dataset.dsLabel||e.getAttribute('aria-label')||e.getAttribute('alt')||(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,55)||e.dataset.dsElement,tag:e.localName,classes:e.getAttribute('class'),action:e.dataset.action||e.dataset.progress||'',parent:e.dataset.dsParent||e.parentElement?.dataset.dsElement,html:e.outerHTML.slice(0,300)})),
     geometry:[...document.querySelectorAll('#app h1,#app .navigation-back,#app .mission-illustration,#app .start-button,#app .question-card,#app .result-points-bubble')].map(e=>({selector:e.localName+'.'+(e.classList[0]||''),rect:[e.getBoundingClientRect().x,e.getBoundingClientRect().y,e.getBoundingClientRect().width,e.getBoundingClientRect().height]}))}));
    if(!baseline){
     assert.equal(row.view,view.id);
     assert.equal(new Set(row.nodes.map(n=>n.id)).size,row.nodes.length,'Unique mounted identities');
     const ids=new Set(['layout-root',...row.nodes.map(n=>n.id)]);
     for(const node of row.nodes)assert.ok(ids.has(node.parent),view.id+'/'+node.id+' missing '+node.parent);
     assert.ok(!requests.some(path=>/element-system\.mjs|studio-bridge\.mjs|view-inventory-snapshots\.mjs/.test(path)),'Production renderer must not load classifier or cached editor fixtures');
     const button=row.nodes.find(n=>n.kind==='button');assert.ok(button,view.id+' editable action');
     await page.evaluate(async({view,id})=>{
      const {applyDesign}=await import('/shared/design-runtime.mjs');
      const config=structuredClone(window.__MALA_NAUKA_DESIGN__);config.elementOverrides||={};config.elementOverrides[view]||={};config.elementOverrides[view][id]={...config.elementOverrides[view][id],radius:27};applyDesign(config);
     },{view:view.id,id:button.id});
     await page.waitForFunction(id=>{const e=[...document.querySelectorAll('[data-ds-element]')].find(e=>e.dataset.dsElement===id);return e&&parseFloat(getComputedStyle(e).borderRadius)===27;},button.id);
     assert.deepEqual(errors,[]);
     if(['players','english-settings','flags-initial','reading-wrong','math-correct','progress','spelling-results'].includes(view.id))await page.screenshot({path:output+'/'+device.id+'-'+view.id+'.png'});
    }
    results.push({id:view.id,device:device.id,...row,errors});console.log(device.id+'/'+view.id+': '+row.nodes.length+' components, '+errors.length+' errors');
   }catch(e){results.push({id:view.id,device:device.id,error:e.message,errors});console.error(device.id+'/'+view.id+': '+e.message);}
   await page.close();await persist();
  }}
  await Promise.all(Array.from({length:3},()=>worker()));await context.close();
 }
 await writes;
 const failed=results.filter(r=>r.error||r.errors.length).map(r=>r.device+'/'+r.id);
 console.log(JSON.stringify({ok:failed.length===0,views:registry.views.length,checks:results.length,devices:devices.map(d=>d.id),failed}));
 assert.deepEqual(failed,[]);
}finally{await browser.close();}
