// Real scenic renderer: layout, viewport repaint and shared editor rollback.
import{chromium,webkit}from'playwright';import assert from'node:assert/strict';import{writeFile,mkdir}from'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:8873',out=process.env.V2_SCREENSHOT_DIR||'.design-qa/scenic-layout';await mkdir(out,{recursive:true});const checks=[];
for(const[name,engine]of[['chromium',chromium],['webkit',webkit]]){
 const b=await engine.launch(),c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  for(const variant of['flags','countries','capitals']){
   await p.goto(base+'/flagi/scenic-preview.html?view=game&qa=1&freeze=1&country=pl&variant='+variant,{waitUntil:'domcontentloaded'});await p.locator('#scenic-screen[data-ready=true][data-state=playing]').waitFor();
   const measure=()=>p.evaluate(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height}};return{answers:r('#scenic-answers'),paper:r('#scenic-map-scroll'),boy:r('.scenic-boy'),stage:r('.scenic-stage'),controls:r('.scenic-controls'),progress:r('#scenic-progress')}});
   const initial=await measure();assert(Math.abs(initial.answers.y-844*.62)<1);assert(Math.abs(initial.controls.y-787.9)<1);assert(initial.paper.y>initial.progress.y+initial.progress.h+35);
   // Positions must stay still while the renderer animates paper, ink and ribbons.
   await p.evaluate(()=>{window.mnLayoutSamples=[];window.mnSampleLayout=true;function tick(){if(!window.mnSampleLayout)return;const selectors=['#scenic-answers','#scenic-map-scroll','.scenic-boy'];window.mnLayoutSamples.push(selectors.map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[r.x,r.y,r.width,r.height]}));requestAnimationFrame(tick)}requestAnimationFrame(tick)});
   await p.locator('.scenic-answer:not([data-id=pl])').first().click();await p.locator('#scenic-screen[data-state=feedback-wrong]').waitFor({timeout:20000});
   const samples=await p.evaluate(()=>{window.mnSampleLayout=false;return window.mnLayoutSamples});for(const row of samples)for(const[i,key]of['answers','paper','boy'].entries())for(const[j,prop]of['x','y','w','h'].entries())assert(Math.abs(row[i][j]-initial[key][prop])<.6,name+'/'+variant+' '+key+' moved during feedback');
   await p.locator('[data-map-view=europe]').click();await p.locator('[data-neighbor=de]').click();
   // Resize an already painted map: match the backing canvas to the new sheet,
   // retaining the selected camera and neighbor rather than stretching old ink.
   await p.setViewportSize({width:390,height:800});await p.waitForFunction(()=>{const s=document.querySelector('#scenic-map-scroll'),canvas=document.querySelector('#scenic-map-ink'),dpr=Math.min(devicePixelRatio,2);return Math.abs(canvas.height/dpr-s.clientHeight)<1&&s.dataset.view==='europe'&&JSON.parse(s.dataset.highlightedNeighbors||'[]').includes('de')});
   await p.setViewportSize({width:390,height:844});await p.waitForFunction(y=>{const s=document.querySelector('#scenic-map-scroll');return Math.abs(document.querySelector('#scenic-map-ink').height/Math.min(devicePixelRatio,2)-s.clientHeight)<1&&Math.abs(document.querySelector('#scenic-answers').getBoundingClientRect().y-y)<.6},initial.answers.y);
   const restored=await measure();assert(Math.abs(restored.answers.y-initial.answers.y)<.6);assert.equal(await p.locator('[data-neighbor=de]').getAttribute('aria-pressed'),'true');
   await p.screenshot({path:out+'/'+name+'-'+variant+'-wrong.png'});
   await p.locator('#scenic-swipe').focus();for(let i=0;i<10;i++)await p.locator('#scenic-swipe').press('ArrowRight');
   await p.waitForFunction(()=>document.querySelector('#scenic-screen')?.dataset.state==='playing'&&document.querySelector('#scenic-screen')?.dataset.country!=='pl',null,{timeout:20000});
   const next=await p.locator('#scenic-screen').getAttribute('data-country');await p.locator('.scenic-answer[data-id="'+next+'"]').click();await p.locator('#scenic-screen[data-state=feedback-correct]').waitFor({timeout:20000});
   // qa+freeze keeps the correct feedback inspectable; normal PWA advances itself.
   checks.push(name+'/'+variant+': stable feedback, viewport repaint, zoom/neighbor retention, slider, next round and correct answer');
  }
  const geometry=await p.evaluate(async()=>{const{applyResponsiveGeometry}=await import('/shared/responsive-geometry.mjs'),root=document.querySelector('#app'),node=document.querySelector('#scenic-compass'),view=document.documentElement.dataset.dsView,id=node.dataset.dsElement;const snapshot=()=>({width:node.style.width,height:node.style.height,aspect:node.style.aspectRatio,minHeight:node.style.minHeight,translate:node.style.translate}),before=snapshot();applyResponsiveGeometry({responsiveGeometry:{views:{[view]:{[id]:{x:.05,y:.02,width:.3,aspect:1}}}}},root,view);const resized=snapshot();applyResponsiveGeometry({responsiveGeometry:{views:{[view]:{[id]:{x:.01,y:.03}}}}},root,view);const moved=snapshot();applyResponsiveGeometry({},root,view);return{before,resized,moved,after:snapshot()}});
  assert.equal(geometry.resized.width,'30%');for(const key of['width','height','aspect','minHeight'])assert.equal(geometry.moved[key],geometry.before[key]);assert.deepEqual(geometry.after,geometry.before);checks.push(name+': partial geometry rollback restores renderer size, then full rollback restores position');
  assert.deepEqual(errors,[]);
 }catch(error){await p.screenshot({path:out+'/'+name+'-failure.png'});console.error(errors);throw error;}
 finally{await writeFile(out+'/report.json',JSON.stringify({checks,errors},null,2));await b.close();}
}console.log(JSON.stringify(checks,null,2));
