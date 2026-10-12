const {webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {createServer} from 'node:http';import {readFile,writeFile,mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';
const server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://localhost').pathname;if(p.endsWith('/'))p+='index.html';res.setHeader('content-type',/\.(mjs|js)$/.test(p)?'application/javascript':p.endsWith('.html')?'text/html':p.endsWith('.css')?'text/css':'application/json');res.end(await readFile(new URL('../dist'+p,import.meta.url)));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await webkit.launch({headless:true,...(process.env.WEBKIT_EXECUTABLE?{executablePath:process.env.WEBKIT_EXECUTABLE}:{})}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const base='http://127.0.0.1:'+server.address().port;


const registry=JSON.parse(await readFile(new URL('../design-system/registry.json',import.meta.url))),reports=[];
try{
 for(const view of registry.views){
  const url=new URL(view.route,base);url.search=new URLSearchParams({studio:'1',mode:view.mode||'spelling',screen:view.screen,state:view.state||'default',viewId:view.id});
  await page.goto(url.href);await page.locator('#app').waitFor();await page.waitForFunction(()=>document.querySelector('#app')?.querySelector('button,input')&&!document.querySelector('#app .loading'),{timeout:15000});
  if(view.mode==='spelling'&&view.screen==='game')await page.locator('.word').waitFor({state:'attached',timeout:15000});
  await page.evaluate(async()=>{await import('/shared/screen-readiness.mjs').then(m=>m.screenReady(document.querySelector('#app')));await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  const items=await page.evaluate(async()=>{const {annotateElements}=await import('/shared/element-system.mjs');return annotateElements(document.querySelector('#app'),window.__MALA_NAUKA_DESIGN__,document.documentElement.dataset.dsView).map(({node,...i})=>{const r=node.getBoundingClientRect();return {...i,w:Math.round(r.width),h:Math.round(r.height),top:Math.round(r.top),left:Math.round(r.left),bottom:Math.round(r.bottom),right:Math.round(r.right),tag:node.tagName,cls:node.className?.baseVal??node.className};});});
  const ids=new Set(items.map(n=>n.id)),obsolete=new Set(['container-result-actions','container-player-actions','family-player-shell','family-math-settings','family-game-settings','container-spelling-question','container-spelling-question-body','button-result-back']);for(const item of items){assert.ok(item.parent==='layout-root'||ids.has(item.parent),view.id+': orphan '+item.id);assert.ok(!obsolete.has(item.recipe),view.id+': obsolete '+item.recipe);}
  if(view.id.endsWith('-results'))for(const recipe of ['button-back','container-result-continue-rail','button-main'])assert.ok(items.some(n=>n.recipe===recipe&&n.parent==='layout-root'),view.id+': standalone '+recipe);
  const back=await page.locator('.navigation-back').evaluateAll(ns=>ns.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height,radius:getComputedStyle(n).borderRadius,recipe:n.dataset.dsRecipe,path:n.querySelector('path')?.getAttribute('d'),parts:n.querySelectorAll('[data-ds-element]').length})));for(const b of back){assert.equal(b.recipe,'button-back');assert.equal(b.w,44);assert.equal(b.h,44);assert.equal(b.radius,'22px');assert.equal(b.path,'M20 12H4m7-7-7 7 7 7');assert.equal(b.parts,0);}
  await mkdir('.design-qa/views-after',{recursive:true});await page.screenshot({path:'.design-qa/views-after/'+view.id+'.png'});
  reports.push({view:view.id,items,back});console.log(view.id,items.length,'parts',items.filter(n=>n.kind==='container'&&n.h>300).map(n=>n.recipe+':'+n.h).join(','));
 }
 await writeFile(new URL('../.design-qa/view-structure-'+(process.argv[2]||'before')+'.json',import.meta.url),JSON.stringify(reports,null,2));assert.deepEqual(errors,[]);console.log('PASS 41 views: no orphan/obsolete containers, standalone result actions, one navigation atom');
}finally{await browser.close();server.close();}
