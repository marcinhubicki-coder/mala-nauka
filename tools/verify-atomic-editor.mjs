const {webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://localhost').pathname;if(p.endsWith('/'))p+='index.html';res.setHeader('content-type',/\.(mjs|js)$/.test(p)?'application/javascript':p.endsWith('.html')?'text/html':p.endsWith('.css')?'text/css':'application/json');res.end(await readFile(new URL('../dist'+p,import.meta.url)));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await webkit.launch({headless:true,...(process.env.WEBKIT_EXECUTABLE?{executablePath:process.env.WEBKIT_EXECUTABLE}:{})}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const base='http://127.0.0.1:'+server.address().port;

const selectHome=async()=>{await page.locator('#view-select').selectOption('home');await page.frameLocator('#device-frame').locator('.home-canvas').waitFor();};
const selectPart=async(id,level)=>{await page.locator('[data-studio-nav=library-level][value='+level+']').locator('..').click();await page.locator('.recipe-library-row[data-live-part="'+id+'"]').evaluate(n=>n.closest('details').open=true);await page.locator('.recipe-library-row[data-live-part="'+id+'"]').click();await page.locator('#live-sample [data-ds-recipe="'+id+'"]').first().waitFor();};
try{
 await page.goto(base+'/design-system/#components');await page.locator('#preview-toolbar').waitFor();await selectHome();
 const frame=page.frameLocator('#device-frame');
 await frame.locator('.home-canvas').evaluate(async()=>{await document.fonts.ready;});
 const geometry=await frame.locator('.home-canvas').evaluate(root=>{
  const rect=selector=>{const r=root.querySelector(selector).getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const cards=[...root.querySelectorAll('.home-game-button')].map(n=>n.getBoundingClientRect()),group=rect('.home-game-buttons'),range=document.createRange(),h=root.querySelector('.home-headline');range.selectNodeContents(h.firstChild);
  const img=root.querySelector('.home-logo-art'),canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
  return {group,union:{left:Math.min(...cards.map(r=>r.left)),top:Math.min(...cards.map(r=>r.top)),right:Math.max(...cards.map(r=>r.right)),bottom:Math.max(...cards.map(r=>r.bottom))},canvas:rect('.home-welcome'),stats:rect('.home-stats'),plate:rect('.home-stats-outer'),headlineLines:range.getClientRects().length,headline:rect('.home-headline'),subtitle:rect('.home-hero-copy'),logo:img.src,alpha:ctx.getImageData(0,0,1,1).data[3]};
 });
 for(const key of ['left','top','right','bottom'])assert.ok(Math.abs(geometry.group[key]-geometry.union[key])<1,key+' encloses exactly five cards');
 assert.equal(geometry.headlineLines,1);assert.ok(geometry.headline.bottom<=geometry.subtitle.top);assert.equal(geometry.stats.width,geometry.plate.width);assert.match(geometry.logo,/home-mark\.png$/);assert.equal(geometry.alpha,0);
 console.log('PASS Home: five-card bounds, unclipped text, full plate, transparent PNG');
 for(const id of ['home-settings','home-modes']){
  await page.locator('[data-tree-select="'+id+'"]').last().click();await page.waitForFunction(id=>document.querySelector('#selected-element [data-open-recipe]')?.dataset.openRecipe===(id==='home-settings'?'button-home-settings':'family-home-modes'),id);
  assert.equal(await page.locator('.selection-status[data-status=missing]').count(),0);
 }
 for(const width of [1440,1024]){
  await page.setViewportSize({width,height:1000});
  for(const group of ['geometry','animation'])await page.locator('[data-inspector-group='+group+']').evaluate(n=>n.open=true);
  assert.equal(await page.locator('.visual-properties details[data-inspector-group]').evaluateAll(ns=>ns.filter(n=>['geometry','animation'].includes(n.dataset.inspectorGroup)).flatMap(n=>{const r=n.getBoundingClientRect();return [...n.querySelectorAll('.control,.range-wrap,input,select')].filter(c=>{const b=c.getBoundingClientRect();return b.width&&(b.left<r.left-1||b.right>r.right+1);});}).length),0,'inspector overflow at '+width);
 }
 await page.setViewportSize({width:1440,height:1000});
 const scale=page.locator('input[type=number][data-visual-number=scale]');await scale.fill('0.95');await scale.dispatchEvent('input');
 await frame.locator('.home-game-buttons').evaluate(n=>new Promise(resolve=>{const poll=()=>getComputedStyle(n).scale==='0.95'?resolve():requestAnimationFrame(poll);poll();}));
 await page.locator('[data-inspector-group=selection]').evaluate(n=>n.open=true);await page.locator('#selected-element [data-open-recipe]').click();await page.locator('#live-sample .home-game-buttons').waitFor();
 assert.equal(await page.locator('#live-sample .home-game-buttons').evaluate(n=>getComputedStyle(n).scale),'0.95');assert.equal(await page.locator('[data-live-field=family]').count(),0);assert.equal(await page.locator('[data-live-field=sampleState]').count(),0);
 console.log('PASS shared scale: editor change updates the actual family and its library sample');
 for(const [id,level]of [['button-home-settings','atom'],['container-home-stat','group'],['text-spelling-word','atom']]){
  await selectPart(id,level);assert.equal(await page.locator('[data-live-field=family]').count(),0);assert.equal(await page.locator('[data-live-field=sampleState]').count(),0);
  if(id==='container-home-stat'){assert.equal(await page.locator('#live-sample .home-stat-value').innerText(),'0');assert.equal(await page.locator('#live-sample .home-stat-label').innerText(),'Dziś rozwiązane');}
  if(id==='text-spelling-word'){assert.equal(await page.locator('#live-sample img,#live-sample image').count(),0);assert.equal(await page.locator('#live-sample [data-ds-recipe=text-spelling-word]').count(),1);}
 }
 console.log('PASS library: singleton choices hidden, correct today values, text-only question');
 await page.locator('#navigation [data-page=components]').click();await page.locator('#view-select').selectOption('spelling-initial');
 await frame.locator('[data-ds-recipe=text-spelling-word]').waitFor();
 assert.equal(await frame.locator('[data-ds-recipe=text-spelling-word] img,[data-ds-recipe=text-spelling-word] image').count(),0);assert.equal(await frame.locator('[data-ds-recipe=text-spelling-word]').count(),1);
 assert.equal(await frame.locator('[data-ds-recipe=text-spelling-word]').evaluate(n=>n.dataset.dsKind),'text');assert.ok(await frame.locator('[data-ds-recipe=text-spelling-word]').evaluate(n=>!!n.dataset.dsElement));
 assert.equal(await frame.locator('[data-ds-recipe=text-spelling-word] [data-ds-element]').count(),0,'word internals do not become accidental groups');
 console.log('PASS real spelling editor: one text atom matches the library');assert.deepEqual(errors,[]);console.log('PASS runtime errors: 0');
}finally{await browser.close();server.close();}
