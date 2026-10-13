// Optional real-renderer gate: npm run build, serve dist and install Playwright.
// Does not bundle Playwright into the PWA.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {chromium}=await import('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765';
const views=JSON.parse(readFileSync(new URL('../design-system/registry.json',import.meta.url),'utf8')).views;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[],errors=[];
let index=0;
async function inspect(){
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 while(index<views.length){
  const view=views[index++],jsErrors=[];
  page.removeAllListeners('pageerror');
  page.on('pageerror',error=>jsErrors.push(error.message));
  try{
   const params=new URLSearchParams({studio:'1',mode:view.mode,screen:view.screen,state:view.state,viewId:view.id});
   await page.goto(base+view.route+'?'+params,{waitUntil:'domcontentloaded',timeout:18000});
   await page.waitForFunction(()=>document.querySelector('#app')?.dataset?.view,{timeout:10000});
   await page.waitForTimeout(450);
   const info=await page.evaluate(()=>({name:document.documentElement.dataset.dsView,elements:document.querySelectorAll('[data-ds-element]').length,view:document.querySelector('#app')?.dataset.view}));
   assert.equal(info.name,view.id);
   assert.ok(info.elements>=2,'No declared or annotated components');
   assert.deepEqual(jsErrors,[]);
   results.push({id:view.id,...info});
  }catch(error){errors.push({id:view.id,message:error.message.slice(0,280),jsErrors});}
 }
 await page.close();
}
try{
 await Promise.all(Array.from({length:4},inspect));
 assert.equal(results.length,views.length,JSON.stringify(errors));
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({ok:true,views:results.length,elements:results.reduce((sum,row)=>sum+row.elements,0),min:Math.min(...results.map(r=>r.elements)),max:Math.max(...results.map(r=>r.elements))}));
}finally{await browser.close();}
