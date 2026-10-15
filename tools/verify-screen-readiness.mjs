const {webkit,chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const kind=process.argv[2]||'webkit';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';const data=await readFile(new URL('../dist'+path,import.meta.url));res.setHeader('content-type',path.endsWith('.mjs')||path.endsWith('.js')?'application/javascript':path.endsWith('.html')?'text/html':path.endsWith('.css')?'text/css':path.endsWith('.json')?'application/json':'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}});
if(!process.argv[3])await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.argv[3]||'http://127.0.0.1:'+server.address().port;
const browser=await (kind==='webkit'?webkit:chromium).launch({headless:true,...((kind==='webkit'?process.env.WEBKIT_EXECUTABLE:process.env.CHROME_PATH)?{executablePath:kind==='webkit'?process.env.WEBKIT_EXECUTABLE:process.env.CHROME_PATH}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1000},hasTouch:true,serviceWorkers:'block'});
const page=await context.newPage(),errors=[],missing=[];
page.on('response',r=>{if(r.status()>=400)missing.push(new URL(r.url()).pathname);});
page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.stack||e.message);});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});
await context.addInitScript(()=>{
 window.__audioQA=[];window.__audioContexts=new Set();const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
 const create=A.prototype.createBufferSource;
 A.prototype.createBufferSource=function(){window.__audioContexts.add(this);const source=create.call(this),start=source.start;source.start=function(...args){const data=this.buffer?.getChannelData(0);let peak=0;if(data)for(let i=0;i<data.length;i+=31)peak=Math.max(peak,Math.abs(data[i]));window.__audioQA.push({loop:this.loop,duration:this.buffer?.duration,offset:args[1]||0,peak});return start.apply(this,args);};return source;};
});
try{
 await page.goto(base+'/design-system/#components');
 await page.locator('#preview-toolbar').waitFor({timeout:20000});
 for(const mode of (process.env.V2_MODES||'spelling,english,flags,reading,math').split(',')){
  await page.locator('[data-studio-nav=mode][value='+mode+']').locator('..').click();
  await page.locator('[data-studio-nav=view][value='+mode+'-settings]').locator('..').click();
  const frame=page.frameLocator('#device-frame');
  await frame.locator('#app[data-ds-contract-ready="'+mode+'-settings"]').waitFor({timeout:15000});
  await frame.locator('#app[data-view="wizard"] .mission-illustration').waitFor({state:'attached',timeout:15000});
  assert.ok(await frame.locator('.mission-illustration').evaluate(n=>n.getBoundingClientRect().width)>300);
  const app=frame.locator('#app');assert.ok(await app.locator('[data-ds-element]').count()>10);
  console.log('PASS Studio settings '+mode);
 }
 await page.screenshot({path:'.design-qa/studio-webkit.png'});
 await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/');
 await page.locator('[data-action="guest-player"]').click({timeout:20000});
 await page.locator('.home-canvas').waitFor({timeout:15000});
 await page.waitForFunction(()=>window.__MALA_NAUKA_AUDIO_HOST__?.unlocked&&window.__MALA_NAUKA_AUDIO_HOST__?.engine.theme?.key.startsWith('home:'),{timeout:15000});
 for(const mode of (process.env.V2_MODES||'spelling,english,flags,reading,math').split(',')){
  await page.locator('[data-action="choose-mode"][data-mode="'+mode+'"]').tap();
  const holder=await page.locator('[data-mode-host]').elementHandle(),gameFrame=await holder.contentFrame();
  const game=page.frameLocator('[data-mode-host]');
  try{await game.locator('.mission-illustration').waitFor({timeout:8000});}catch(e){console.log('HOST FAILURE',mode,await gameFrame.locator('body').innerText(),await gameFrame.evaluate(()=>({url:location.href,view:document.querySelector('#app')?.dataset.view,session:sessionStorage.getItem('malaNauka.sessionPlayerId')})));throw e;}
  await game.locator(mode==='math'?'[data-start]':'.start-button').tap();
  await game.locator(mode==='math'?'[data-answer]':'#app[data-view="game"] button.answer:not(:disabled)').first().waitFor({timeout:15000});
  await gameFrame.waitForFunction(()=>!document.querySelector('#app').inert,{timeout:15000});
  assert.equal(await gameFrame.evaluate(async()=>{const {gameSound}=await import('/shared/sound-runtime.mjs');return gameSound===parent.__MALA_NAUKA_AUDIO_HOST__;}),true);
  assert.equal(await gameFrame.evaluate(()=>window.__audioContexts.size),0,'mode document does not create a second audio context');
  await page.waitForFunction(mode=>window.__MALA_NAUKA_AUDIO_HOST__?.engine.theme?.key.startsWith(mode+':'),mode,{timeout:15000});
  await game.locator(mode==='math'?'[data-answer]':'.answer').first().tap({force:true});
  console.log('PASS PWA start/answer '+mode);
  await game.locator(mode==='math'?'#back':'[data-action="exit"]').tap();
  await game.locator(mode==='math'?'[data-math-exit]':'[data-action="exit-confirm"]').tap();
  await game.locator('#app[data-view="results"] h1').waitFor({timeout:15000});
  await gameFrame.waitForFunction(()=>{const root=document.querySelector('#app');return root.dataset.dsContractReady===root.dataset.mode+'-results'&&document.documentElement.dataset.dsView===root.dataset.dsContractReady;},{timeout:15000});
  assert.deepEqual(await gameFrame.evaluate(async()=>{
   const {mountedViewContract}=await import('/shared/view-contract-mount.mjs'),root=document.querySelector('#app');
   return mountedViewContract(root,document.documentElement.dataset.dsView).filter(item=>!root.contains(item.node)&&!item.node.closest('dialog[open]')).map(item=>item.id);
  }),[],'Closed dialogs must not leak components into the next screen');
  await game.locator('[data-action="history"]').tap();
  await game.locator('#app[data-view="history"]').waitFor({timeout:15000});
  if(await game.locator('[data-progress="collection"]').count())await game.locator('[data-progress="collection"]').first().tap();
  await game.locator('[data-progress="dashboard"]').tap();
  await game.locator('[data-action="return-results"]').tap();
  await game.locator('[data-action="result-back"]').tap();
  await game.locator('[data-action="home"]').tap();
  await page.locator('.home-canvas').waitFor({timeout:15000});
  await page.waitForFunction(()=>!document.querySelector('#app').inert,{timeout:15000});
  await page.waitForFunction(()=>window.__MALA_NAUKA_AUDIO_HOST__?.engine.theme?.key.startsWith('home:'),{timeout:15000});
  console.log('PASS PWA results/collection/return '+mode);
 }
 assert.equal(await page.evaluate(()=>window.__audioContexts.size),1);
 assert.ok(await page.evaluate(()=>window.__audioQA.some(s=>s.loop&&s.peak>.001)&&window.__audioQA.some(s=>!s.loop&&s.duration>1&&s.offset>0&&s.peak>.001)));
 console.log('PASS continuous owner, audible loop buffers and blob buffers');
 console.log('AUDIO',JSON.stringify(await page.evaluate(()=>({loops:window.__audioQA.filter(s=>s.loop).length,cues:window.__audioQA.filter(s=>!s.loop&&s.duration<1).length,blobs:window.__audioQA.filter(s=>!s.loop&&s.duration>1&&s.offset>0).length,ctx:window.__MALA_NAUKA_AUDIO_HOST__?.engine.ctx?.state,unlocked:window.__MALA_NAUKA_AUDIO_HOST__?.unlocked,error:window.__MALA_NAUKA_AUDIO_HOST__?.lastError,theme:window.__MALA_NAUKA_AUDIO_HOST__?.engine.theme?.key}))));
 console.log('MISSING',JSON.stringify([...new Set(missing)]));assert.deepEqual(errors,[]);
 console.log('PASS runtime errors: 0');
}finally{await browser.close();server.close();}
