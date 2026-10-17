#!/usr/bin/env node
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,readdir,unlink} from 'node:fs/promises';
import {dirname,extname,resolve,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {SCENIC} from '../flagi/scenic-config.mjs';
import {FLAGS} from '../data/flags.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..'),OUT=process.env.SCENIC_QA_OUT||join(ROOT,'docs/flags-adventure/qa-scenic');
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json','.woff':'font/woff','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname,file=resolve(ROOT,'.'+path+(path.endsWith('/')?'index.html':''));
 if(!file.startsWith(ROOT+sep)){res.writeHead(403).end();return;}
 try{const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data);}
 catch{res.writeHead(404).end();}
});
await mkdir(OUT,{recursive:true});
// This folder is generated evidence: keep each run free of stale frames.
for(const file of await readdir(OUT))if(file.endsWith('.jpg')||file==='report.json')await unlink(join(OUT,file));
server.listen(0,'127.0.0.1');await once(server,'listening');
const base='http://127.0.0.1:'+server.address().port,reports=[],failures=[];
const phase=process.env.SCENIC_QA_PHASE||'full';
const canonicalEurope=await readFile(join(ROOT,'assets/maps/europe-atlas-v26.svg'),'utf8');
async function state(page,value){await page.waitForFunction(s=>document.querySelector('#scenic-screen').dataset.state===s,value,{timeout:20000});}
async function capture(page,name){await page.screenshot({path:join(OUT,name+'.jpg'),type:'jpeg',quality:87});}
async function metrics(page){return page.evaluate(()=>{
 const rect=sel=>{const r=document.querySelector(sel)?.getBoundingClientRect();return r&&{x:r.x,y:r.y,w:r.width,h:r.height};};
 const app=document.querySelector('#scenic-screen'),svg=document.querySelector('.scenic-europe-map svg'),host=document.querySelector('.continent-map-host');
 return {state:app.dataset.state,country:app.dataset.country,score:document.querySelector('#scenic-score').textContent,task:document.querySelector('#scenic-task').textContent,
  viewport:{w:innerWidth,h:innerHeight},flag:rect('.flag-cloth'),paper:rect('.scenic-paper-row'),atlas:rect('.scenic-map-scroll'),
  answers:[...document.querySelectorAll('.scenic-answer')].map(n=>{const r=n.getBoundingClientRect();return {id:n.dataset.id,text:n.textContent,disabled:n.disabled,x:r.x,y:r.y,w:r.width,h:r.height,labelFits:n.querySelector('.scenic-answer-label').scrollWidth<=n.clientWidth&&n.querySelector('.scenic-answer-label').getBoundingClientRect().height<=n.clientHeight-8,lineCount:Math.round(n.querySelector('.scenic-answer-label').getBoundingClientRect().height/parseFloat(getComputedStyle(n.querySelector('.scenic-answer-label')).lineHeight)),icons:n.querySelectorAll('svg,img').length};}),
  raster:host?.dataset.mapImage,activeCount:svg?.querySelectorAll('.country').length||0,highlight:!!svg?.querySelector('.scenic-country-overlay'),
  neighbors:Number(svg?.dataset.visibleNeighbors),labels:document.querySelector('#scenic-map-scroll').dataset.drawnLabels?JSON.parse(document.querySelector('#scenic-map-scroll').dataset.drawnLabels).length:Number(host?.dataset.labelCount),crop:svg?.getAttribute('viewBox'),microstate:host?.dataset.microstate,
  captionFits:(()=>{const inner=document.querySelector('.scenic-map-inner').getBoundingClientRect(),caption=document.querySelector('.scenic-map-caption').getBoundingClientRect(),title=document.querySelector('#scenic-country-name').getBoundingClientRect(),capital=document.querySelector('#scenic-country-capital').getBoundingClientRect();return title.top>=inner.top+3&&capital.bottom<=caption.bottom+1&&caption.right<=inner.right-10&&document.querySelector('#scenic-country-name').scrollWidth<=document.querySelector('#scenic-country-name').clientWidth+1;})(),
  registrationAudit:document.querySelector('#scenic-map-scroll').dataset.registrationAudit?JSON.parse(document.querySelector('#scenic-map-scroll').dataset.registrationAudit):undefined,capital:document.querySelector('#scenic-country-capital').textContent,swipeVisible:!document.querySelector('#scenic-swipe').hidden,
  overflowX:document.documentElement.scrollWidth>innerWidth,overflowY:document.documentElement.scrollHeight>innerHeight,
  animations:document.getAnimations().filter(a=>a.playState==='running').length,sand:app.dataset.sandPhase,qa:{enabled:app.dataset.qa,at:app.dataset.qaCaptureAt,captured:app.dataset.qaCaptured,progress:app.dataset.sandProgress},
  foldImages:document.querySelectorAll('.scenic-fold-leaf').length===4&&[...document.querySelectorAll('.scenic-fold-leaf')].every(n=>getComputedStyle(n).backgroundImage.includes('scenic-paper-v14.webp')),inkPhase:document.querySelector('#scenic-map-scroll').dataset.inkPhase,inkGrains:Number(document.querySelector('#scenic-map-scroll').dataset.inkGrains),inkOutside:Number(document.querySelector('#scenic-map-scroll').dataset.inkOutside),inkPaintP95:Number(document.querySelector('#scenic-map-scroll').dataset.inkPaintP95),inkFrames:Number(document.querySelector('#scenic-map-scroll').dataset.inkFrames),compass:rect('.scenic-compass')};
 });}
async function check(name,browser,options,run){
 if(process.env.SCENIC_QA_FILTER&&!process.env.SCENIC_QA_FILTER.split(',').some(filter=>name.includes(filter)))return;
 // A fresh WebKit process per scenario bounds the runner's cross-context GPU cache.
 // Multi-round scenarios still keep one page and one game alive throughout.
 const isolated=name.startsWith('webkit-')?await webkit.launch({headless:true}):process.env.SCENIC_CHROMIUM_PATH?await chromium.launch(chromeOptions):null;
 const context=await (isolated||browser).newContext({viewport:{width:390,height:844},deviceScaleFactor:2,...options}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{await run(page);const result={name,...await metrics(page),errors};reports.push(result);assert.equal(errors.length,0,'JS errors');console.log(JSON.stringify({name,status:'PASS',state:result.state}));}
 catch(error){const result={name,...await metrics(page).catch(()=>({})),error:String(error),errors};reports.push(result);failures.push(result);await capture(page,name+'-failure').catch(()=>{});console.error(name,error.stack||String(error));}
 finally{await context.close();await isolated?.close();}
}
async function open(page,country='by',freeze=true){await page.goto(base+'/flagi/scenic-preview.html?qa=1&country='+country+(freeze?'&freeze=1':''),{waitUntil:'domcontentloaded'});await state(page,'playing');}
async function choose(page,correct=true){const id=await page.locator('#scenic-screen').getAttribute('data-country');const button=correct?page.locator(`.scenic-answer[data-id="${id}"]`):page.locator(`.scenic-answer:not([data-id="${id}"])`).first();await button.click();}
async function freezeFold(page,opening){
 // Freeze in the same browser task that starts the fold. Remote screenshot
 // calls can otherwise arrive after a short animation on a busy CI machine.
 await page.evaluate(opening=>{
  const sheet=document.querySelector('#scenic-map-scroll'),phase=opening?'is-opening':'is-closing';
  const observer=new MutationObserver(()=>{if(!sheet.classList.contains(phase))return;observer.disconnect();window.dispatchEvent(new CustomEvent('scenic-qa-pause',{detail:true}));});
  observer.observe(sheet,{attributes:true,attributeFilter:['class']});
 },opening);
}
async function slide(page){
 const a=await page.locator('#scenic-swipe-knob').boundingBox(),b=await page.locator('#scenic-swipe').boundingBox();
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width-20,a.y+a.height/2,{steps:15});await page.mouse.up();
}
const localBrowser=process.env.SCENIC_CHROMIUM_PATH;
const chromeOptions={headless:true,...(localBrowser?{executablePath:localBrowser,ignoreDefaultArgs:['--enable-unsafe-swiftshader'],args:['--no-sandbox','--no-zygote','--disable-gpu','--disable-software-rasterizer','--in-process-gpu','--single-process','--disable-dev-shm-usage','--use-gl=disabled']}: {args:['--disable-dev-shm-usage']})};
let browser;
try{
 for(const [engine,launcher] of [['chromium',chromium],...(phase==='full'||process.env.SCENIC_QA_ENGINE==='webkit'?[['webkit',webkit]]:[])]){
  if(process.env.SCENIC_QA_ENGINE&&engine!==process.env.SCENIC_QA_ENGINE)continue;
  browser=engine==='chromium'?await launcher.launch(chromeOptions):null;
  for(const sample of [
   {id:'by',mode:'question',w:390,h:844,name:'01-belarus-question'},
   {id:'by',mode:'correct',w:390,h:844,name:'02-belarus-correct'},
   {id:'by',mode:'wrong',w:390,h:844,name:'03-belarus-wrong'},
   {id:'pl',mode:'wrong',w:390,h:844,name:'11-poland-mockup-wrong'},
   {id:'pl',mode:'correct',w:390,h:844,name:'12-poland-mockup-correct'},
   {id:'pl',mode:'correct',w:390,h:700,name:'04-poland-short'},
   {id:'ch',mode:'correct',w:430,h:932,name:'05-swiss-max'},
   {id:'li',mode:'correct',w:390,h:844,name:'07-liechtenstein'},
   {id:'ba',mode:'wrong',w:390,h:844,name:'19-bosnia-title'},
   {id:'mk',mode:'wrong',w:390,h:844,name:'20-macedonia-title'},
   {id:'ch',mode:'correct',w:390,h:844,name:'21-swiss-title'},
   {id:'va',mode:'wrong',w:390,h:844,name:'08-vatican'},
   {id:'ba',mode:'wrong',w:390,h:700,name:'09-long-country'},
   {id:'gb',mode:'correct',w:390,h:844,name:'13-two-word-title'},
   {id:'mk',mode:'wrong',w:390,h:700,name:'14-two-word-title-short'},
   {id:'li',mode:'question',w:390,h:844,name:'15-two-line-question'},
   {id:'fi',mode:'correct',w:390,h:844,name:'16-finland-north'},
   {id:'no',mode:'wrong',w:390,h:700,name:'17-norway-north'},
   {id:'ru',mode:'correct',w:390,h:844,name:'18-russia-wide'},
   {id:'pl',mode:'correct',w:390,h:844,safe:true,name:'10-pwa-safe-area'}
  ])await check(engine+'-'+sample.name,browser,{viewport:{width:sample.w,height:sample.h}},async page=>{
   await open(page,sample.id);if(sample.safe)await page.addStyleTag({content:'.scenic-screen{--safe-top:47px;--safe-bottom:34px}'});
   if(sample.mode!=='question'){await choose(page,sample.mode==='correct');await state(page,'feedback-'+sample.mode);}
   const m=await metrics(page);assert.equal(m.overflowX,false);assert.equal(m.overflowY,false);assert.equal(m.answers.length,4);assert(m.answers.every(b=>b.labelFits&&b.icons===0&&b.h>=40&&b.y+b.h<sample.h));
   assert(m.flag.y+m.flag.h<=m.paper.y+5,'Flag hits question paper');
   if(sample.mode==='question'){
    const bottom=await page.locator('.scenic-paper-bottom').boundingBox(),top=await page.locator('.scenic-paper-top').boundingBox(),compass=await page.locator('.scenic-compass').boundingBox();assert(Math.abs(bottom.y+bottom.height-m.paper.y-m.paper.h)<2,'Closed paper must be placed before answers unlock');assert(Math.abs(top.y-m.paper.y)<2,'Top edge starts at the question banner');assert(compass.y>m.paper.y-35&&compass.y<m.paper.y,'Compass starts beside the question, never near HUD');
   }
   if(sample.mode!=='question'){
    assert.equal(m.raster,'ready');assert.equal(m.activeCount,1);
    assert(await page.locator('.scenic-europe-map svg').evaluate((svg,source)=>{const ref=new DOMParser().parseFromString(source,'image/svg+xml'),active=svg.querySelector('.country'),original=ref.querySelector('[data-country="'+active.dataset.country+'"]'),base=svg.querySelector('image');return base.getAttribute('x')==='0'&&base.getAttribute('y')==='0'&&base.getAttribute('width')==='680'&&base.getAttribute('height')==='500'&&(!original||original.getAttribute('d')===active.getAttribute('d'));},canonicalEurope),'Raster and selected SVG must use the canonical coordinates');assert(m.captionFits,'country and capital must fit within the fixed heading');
    const typography=await page.locator('#scenic-country-name').evaluate(n=>({family:getComputedStyle(n).fontFamily,size:parseFloat(getComputedStyle(n).fontSize),lines:n.children.length,slot:n.clientHeight,fit:[...n.children].every(x=>x.scrollWidth<=n.clientWidth+1)}));
    assert(typography.family.includes('ScenicAtlas'));assert([18,20,22,24,26,28,30].includes(typography.size));assert(typography.lines<=2);assert.equal(typography.slot,sample.h<760?40:44);assert(typography.fit,'Country title fits the bundled Polish font');

    assert(Number(JSON.parse(await page.locator('#scenic-map-scroll').getAttribute('data-heading-metrics')).gap)>=6,'Country descenders leave space above the capital');assert(m.highlight);assert(m.neighbors>=0&&m.neighbors<=75,'Geographic camera density is bounded');assert(m.labels>=1&&m.labels<=8,'Visible labels have bounded density');assert(m.foldImages);assert.equal(m.inkPhase,'complete');assert.equal(m.inkGrains,0);assert.equal(m.inkOutside,0);assert.equal(m.animations,0,'Steady atlas must not keep moving');
    assert.equal(m.swipeVisible,sample.mode==='wrong');assert(m.atlas.y+m.atlas.h<m.answers[0].y);
   }
   await capture(page,engine==='chromium'?sample.name:engine+'-'+sample.name);
  });
  if(phase==='full')await check(engine+'-all-europe-title-layout',browser,{reducedMotion:'reduce'},async page=>{
   let first;
   for(const record of FLAGS.filter(x=>x.continent==='europe')){
    await open(page,record.id);await choose(page,false);await state(page,'feedback-wrong');
    const title=await page.locator('#scenic-country-name').evaluate(n=>({name:n.getAttribute('aria-label'),size:parseFloat(getComputedStyle(n).fontSize),lines:n.children.length,fit:[...n.children].every(x=>x.scrollWidth<=n.clientWidth+1)}));
    assert(Number(JSON.parse(await page.locator('#scenic-map-scroll').getAttribute('data-heading-metrics')).gap)>=6,record.country+' descenders meet the capital');assert(title.fit,record.country+' title overflows');assert(title.lines<=2);assert([18,20,22,24,26,28,30].includes(title.size));assert.equal(title.name,record.country);
    const viewport=await page.locator('.scenic-europe-map').boundingBox();if(first)assert.deepEqual(viewport,first,'All European names share the same map viewport');else first=viewport;
   }
  });
  await check(engine+'-v28-slow-neighbor-image',browser,{},async page=>{
   await page.route('**/assets/flags/svg/de.svg',async route=>{await new Promise(resolve=>setTimeout(resolve,4200));await route.continue().catch(()=>{});});
   await open(page,'pl');await choose(page,false);await state(page,'feedback-wrong');
   assert.equal((await metrics(page)).raster,'ready');assert.equal(await page.locator('.scenic-map-unavailable').count(),0,'A delayed neighbor SVG must not remove the whole atlas');assert.equal(await page.locator('#scenic-neighbors [data-neighbor]').count(),7);await capture(page,engine+'-v28-slow-neighbor-map');
  });
  await check(engine+'-v28-spain-coastline-registration',browser,{reducedMotion:'reduce'},async page=>{
   await open(page,'es');await choose(page,false);await state(page,'feedback-wrong');
   const audit=await page.evaluate(async()=>{
    const {registerAtlasImage}=await import('./flagi/scenic-registration.mjs');
    const spec=await fetch('assets/maps/europe-iberia-registration-v28.json').then(r=>r.json());
    const image=new Image();image.src='assets/maps/europe-painted-v27.webp';await image.decode();const corrected=registerAtlasImage(image,spec);
    function coast(bitmap){const c=document.createElement('canvas');c.width=1360;c.height=1000;const ctx=c.getContext('2d');ctx.drawImage(bitmap,0,0,c.width,c.height);const px=ctx.getImageData(0,0,c.width,c.height).data,land=new Uint8Array(c.width*c.height);for(let i=0;i<land.length;i++){const r=px[i*4],g=px[i*4+1],b=px[i*4+2];land[i]=b>r*.95&&b>g*.84?0:1;}const points=[];for(let y=644;y<892;y++)for(let x=236;x<488;x++){const i=y*c.width+x;if(land[i]&&[i-1,i+1,i-c.width,i+c.width].some(j=>!land[j]))points.push([x/2,y/2]);}return points;}
    const before=coast(image),after=coast(corrected),moving=spec.pairs.filter(p=>Math.hypot(p.to[0]-p.from[0],p.to[1]-p.from[1])>.5);
    const distance=(points,p)=>Math.min(...points.map(q=>Math.hypot(q[0]-p[0],q[1]-p[1])));
    const error=points=>moving.reduce((s,p)=>s+distance(points,p.to),0)/moving.length;
    const result={before:error(before),after:error(after),landmarks:moving.length,width:corrected.width,height:corrected.height};corrected.width=corrected.height=1;return result;
   });
   assert(audit.landmarks>50);assert(audit.width>=3500&&audit.height>=2600,'Keep the high resolution atlas');assert(audit.after<audit.before*.85,'Registered painted coast follows the true coast: '+JSON.stringify(audit));
   await page.locator('#scenic-map-scroll').evaluate((n,audit)=>n.dataset.registrationAudit=JSON.stringify(audit),audit);
  });
  await check(engine+'-v30-iphone-pwa-question-and-layout',browser,{viewport:{width:390,height:844},reducedMotion:'reduce',isMobile:true},async page=>{
   await open(page,'pl');await page.addStyleTag({content:'.scenic-screen{--safe-top:47px;--safe-bottom:34px;height:calc(100dvh - 47px);min-height:100lvh}'});
   await page.waitForFunction(()=>document.querySelector('#scenic-screen').getBoundingClientRect().height>=843.9);
   await page.waitForFunction(()=>{const a=document.querySelector('#scenic-answers').getBoundingClientRect(),b=document.querySelector('.scenic-boy').getBoundingClientRect();return Math.abs(a.bottom-b.top-10)<1;});
   const initial=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect(),main=r('main'),paper=r('#scenic-paper-row'),prompt=r('.scenic-prompt'),answers=r('#scenic-answers'),boy=r('.scenic-boy');return {height:main.height,promptFits:prompt.top>=paper.top+5&&prompt.bottom<=paper.bottom-5,overlap:answers.bottom-boy.top,boyBottom:boy.bottom-main.bottom,shadow:[getComputedStyle(document.querySelector('#scenic-clock')).textShadow,getComputedStyle(document.querySelector('#scenic-clock-caption')).textShadow],language:r('#scenic-language').width};});
   assert(Math.abs(initial.height-844)<.1,'Fill the iPhone layout viewport, allowing subpixel rounding');assert(initial.promptFits);assert(Math.abs(initial.overlap-10)<1);assert(initial.boyBottom>=10&&initial.boyBottom<=14,'Boy continues into the bottom edge');assert.deepEqual(initial.shadow,['none','none']);assert(initial.language<=33);await capture(page,engine+'-v30-pwa-question');
   await choose(page,false);await state(page,'feedback-wrong');
   const layout=await page.evaluate(()=>{const a=document.querySelector('#scenic-answers').getBoundingClientRect(),rows=[...document.querySelectorAll('.scenic-neighbor-row')].map(n=>n.getBoundingClientRect());return {right:rows.every(r=>Math.abs(r.right-a.right)<1),gap:rows.map((r,i)=>i?r.top-rows[i-1].bottom:r.top-a.bottom),answerGap:parseFloat(getComputedStyle(document.querySelector('#scenic-answers')).rowGap)};});
   assert(layout.right);assert(layout.gap.every(g=>Math.abs(g-layout.answerGap)<1));await capture(page,engine+'-v30-pwa-map');
  });
  for(const sample of [{name:'pwa-france',id:'fr',height:844,safe:true},{name:'pwa-russia',id:'ru',height:844,safe:true},{name:'short-germany',id:'de',height:700},{name:'short-russia',id:'ru',height:700}])await check(engine+'-v31-'+sample.name,browser,{viewport:{width:390,height:sample.height},reducedMotion:'reduce',isMobile:true},async page=>{
   await open(page,sample.id);
   if(sample.safe){
    // Exercise the standalone CSS branch, not an emulation of native iOS chrome.
    // Desktop engines cannot reproduce its status-bar containing-block bug.
    await page.evaluate(()=>{for(const sheet of document.styleSheets)for(const rule of sheet.cssRules)if(rule.conditionText?.includes('display-mode:'))rule.conditionText='all';});
    await page.addStyleTag({content:'.scenic-screen{--safe-top:47px;--safe-bottom:34px}'});
   }
   await page.waitForFunction(()=>{const a=document.querySelector('#scenic-answers').getBoundingClientRect(),b=document.querySelector('.scenic-boy').getBoundingClientRect();return Math.abs(a.bottom-b.top-10)<1;});
   const choices=await page.locator('#scenic-answers').boundingBox(),closedBottom=await page.locator('#scenic-paper-row').evaluate(n=>n.getBoundingClientRect().bottom);
   await choose(page,false);await state(page,'feedback-wrong');
   async function audit(){return page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect(),main=r('main'),paper=r('#scenic-map-scroll'),answers=r('#scenic-answers'),nav=r('#scenic-neighbors'),controls=r('#scenic-controls'),knob=r('#scenic-swipe-knob'),rows=[...document.querySelectorAll('.scenic-neighbor-row')].map(n=>n.getBoundingClientRect());return {root:document.documentElement.clientHeight,body:document.body.clientHeight,main:main.height,viewport:innerHeight,paperTop:paper.top,chromeBottom:Math.max(r('#scenic-language').bottom,r('#scenic-task').bottom),paperBottom:paper.bottom,answerTop:answers.top,navBottom:nav.bottom,railTop:Math.min(controls.top,knob.top),rows:rows.length,count:document.querySelectorAll('[data-neighbor]').length,right:rows.every(x=>Math.abs(x.right-answers.right)<1),gaps:rows.map((x,i)=>x.top-(i?rows[i-1].bottom:answers.bottom)),height:rows.map(x=>x.height)};});}
   for(const lang of ['pl','en']){
    if(lang==='en'){await page.locator('#scenic-language').click();await page.waitForFunction(()=>!document.querySelector('#scenic-language').disabled);}
    const a=await audit();assert(Math.abs(a.root-a.viewport)<1&&Math.abs(a.body-a.viewport)<1&&Math.abs(a.main-a.viewport)<1,'Root, body and scene fill the viewport: '+JSON.stringify(a));
    assert(a.paperTop>=a.chromeBottom+5.8,'Expanded paper clears language and task');assert(Math.abs(a.paperBottom-closedBottom)<1,'Closed and open paper have the same bottom');assert(a.answerTop-a.paperBottom>=9.8);assert(a.navBottom+5.8<=a.railTop,'Every neighbor ribbon stays above the slider: '+JSON.stringify(a));assert(a.right&&a.gaps.every(x=>Math.abs(x-6)<1));assert(a.height.every(x=>x>=32.9));assert.equal(a.count,sample.id==='fr'?8:sample.id==='de'?9:11);
    const last=page.locator('#scenic-neighbors [data-neighbor]').last(),pressed=await last.getAttribute('aria-pressed');await last.click();assert.equal(await last.getAttribute('aria-pressed'),String(pressed!=='true'));
    assert.deepEqual(await page.locator('#scenic-answers').boundingBox(),choices,'Choices stay fixed while revealing and translating the map');await capture(page,engine+'-v31-'+sample.name+'-'+lang);
   }
   if(sample.safe){await page.setViewportSize({width:390,height:797});await page.waitForFunction(()=>Math.abs(document.querySelector('main').getBoundingClientRect().height-797)<1);await page.waitForFunction(()=>document.querySelector('#scenic-neighbors').getBoundingClientRect().bottom+5.8<=document.querySelector('#scenic-controls').getBoundingClientRect().top);const a=await audit();assert.equal(a.root,797);assert(a.navBottom+5.8<=a.railTop);await capture(page,engine+'-v31-pwa-short-viewport');}
  });
  await check(engine+'-v30-wash-long-answer-and-language',browser,{reducedMotion:'reduce'},async page=>{
   await open(page,'ch');await page.locator('.scenic-answer[data-id="ba"]').click();await state(page,'feedback-wrong');
   const wash=await page.evaluate(()=>{const sheet=document.querySelector('#scenic-map-scroll'),canvas=document.querySelector('#scenic-map-ink'),r=canvas.getBoundingClientRect(),map=document.querySelector('.scenic-europe-map').getBoundingClientRect(),caption=document.querySelector('.scenic-map-caption').getBoundingClientRect(),d=canvas.width/r.width,p=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let high=0,low=0;for(let y=Math.ceil((map.top-r.top)*d);y<(caption.bottom-r.top)*d;y++)for(let x=Math.ceil((map.left-r.left)*d);x<(map.right-r.left)*d;x++)high=Math.max(high,p[(y*canvas.width+x)*4+3]);for(let i=3;i<p.length;i+=4)low=Math.max(low,p[i]);const button=document.querySelector('.scenic-answer[data-id="ba"]'),b=button.getBoundingClientRect(),mark=button.querySelector('.scenic-answer-mark').getBoundingClientRect(),label=button.querySelector('.scenic-answer-label').getBoundingClientRect();return {high,low,gap:JSON.parse(sheet.dataset.headingMetrics).gap,markGap:b.right-mark.right,labelTop:label.top-b.top,labelBottom:b.bottom-label.bottom,mask:getComputedStyle(button,'::after').webkitMaskBoxImageSource,mapTop:map.top-r.top};});
   assert(wash.high>0&&wash.high<=58,'Header keeps a pale first wash');assert(wash.low>=250);assert(wash.gap>=6);assert(wash.markGap>=12);assert(wash.labelTop>=8&&wash.labelBottom>=8);assert(wash.mask.includes('scenic-answer-border-v29.webp'));assert(wash.mapTop<=17);await capture(page,engine+'-v30-swiss-bosnia');
   await page.locator('[data-neighbor="de"]').click();await page.getByRole('button',{name:'Cała Europa',exact:true}).click();
   const task=await page.locator('#scenic-task').textContent();await page.locator('#scenic-language').click();await page.waitForFunction(()=>!document.querySelector('#scenic-language').disabled);
   assert.equal(await page.locator('#scenic-country-name').getAttribute('aria-label'),'Switzerland');assert.equal(await page.locator('#scenic-country-capital').textContent(),'Bern');assert.equal(await page.locator('#scenic-map-scroll').getAttribute('data-view'),'europe');assert.deepEqual(JSON.parse(await page.locator('#scenic-map-scroll').getAttribute('data-highlighted-neighbors')),['de']);assert.equal(await page.locator('[data-neighbor="de"]').textContent(),'Germany');assert.equal(await page.locator('#scenic-task').textContent(),task.replace('Zadanie','Task'));await capture(page,engine+'-v30-english');
   await page.locator('#scenic-language').click();await page.waitForFunction(()=>!document.querySelector('#scenic-language').disabled);assert.equal(await page.locator('#scenic-country-capital').textContent(),'Berno');
  });
  await check(engine+'-v29-materials-character-and-capital',browser,{},async page=>{
   await open(page,'pl');await choose(page,false);await state(page,'feedback-wrong');
   const material=await page.evaluate(async()=>{
    const boy=document.querySelector('.scenic-boy');await boy.decode();const c=document.createElement('canvas');c.width=boy.naturalWidth;c.height=boy.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(boy,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;let empty=0,soft=0;for(let i=3;i<pixels.length;i+=4){if(!pixels[i])empty++;else if(pixels[i]<250)soft++;}
    const rect=boy.getBoundingClientRect(),face={right:rect.left+rect.width*.88,top:rect.top+rect.height*.25,bottom:rect.top+rect.height*.65};
    const rows=[...document.querySelectorAll('.scenic-neighbor-row')].map(n=>n.getBoundingClientRect());
    return {alpha:empty/(pixels.length/4),soft,clip:getComputedStyle(boy).clipPath,clearFace:rows.every(r=>r.right<rect.left||r.left>=face.right||r.bottom<=face.top||r.top>=face.bottom),borders:['.scenic-answer','.scenic-neighbor-row','.scenic-swipe'].map(sel=>getComputedStyle(document.querySelector(sel),sel==='.scenic-swipe'?null:'::before').borderImageRepeat),rope:[getComputedStyle(document.querySelector('.scenic-task-back')).zIndex,getComputedStyle(document.querySelector('#scenic-progress')).zIndex,getComputedStyle(document.querySelector('.scenic-meta')).zIndex].map(Number),backMask:getComputedStyle(document.querySelector('.scenic-task-back')).maskImage,frontMask:getComputedStyle(document.querySelector('#scenic-task'),'::before').maskImage,heading:JSON.parse(document.querySelector('#scenic-map-scroll').dataset.headingMetrics),flagHeight:document.querySelector('.scenic-map-flag').clientHeight};
   });
   assert(material.alpha>.25&&material.soft>100,'Boy retains native alpha and antialiased hair');assert.equal(material.clip,'none');assert(material.clearFace,'Neighbor papers do not cover the boy’s face');assert(material.borders.every(x=>x==='repeat'),'Paper edges repeat without stretching');assert(material.rope[0]<material.rope[1]&&material.rope[1]<material.rope[2],'Rear rope is behind the bar and front rope above it');assert(material.backMask!=='none'&&material.frontMask!=='none');assert.equal(material.heading.height,material.heading.iconHeight);assert.equal(material.heading.baseline,material.heading.iconBottom);assert(material.flagHeight<=44);await capture(page,engine+'-v29-materials');
  });
  await check(engine+'-v28-mobile-ribbons-and-cameras',browser,{reducedMotion:'reduce'},async page=>{
   await open(page,'pl');await choose(page,false);await state(page,'feedback-wrong');
   assert.equal(await page.locator('.scenic-ios-status').count(),0,'No fake phone status bar');
   const controls=await page.locator('.scenic-atlas-tools [aria-pressed="true"]').evaluate(n=>getComputedStyle(n).backgroundColor);assert.equal(controls,'rgb(114, 80, 45)');
   const order=await page.locator('#scenic-neighbors [data-neighbor]').evaluateAll(nodes=>nodes.map(n=>n.dataset.neighbor));assert.deepEqual(order,['ru','lt','by','ua','sk','cz','de'],'Neighbors follow compass order, including Kaliningrad');
   const map=await page.locator('.scenic-europe-map').boundingBox(),answers=await page.locator('#scenic-answers').boundingBox();const edges=await page.locator('.scenic-neighbor-row').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().right));assert(edges.every(x=>Math.abs(x-answers.x-answers.width)<2),'Every ribbon ends at the answer buttons’ right edge');
   const rows=await page.locator('.scenic-neighbor-row').evaluateAll(nodes=>nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height,n:n.querySelectorAll('button').length})));assert(rows.length>=2);assert(rows[1].w<rows[0].w);assert(rows[1].n>1);const ribbons=await page.locator('#scenic-neighbors').boundingBox();assert(ribbons.x>80,'Ribbons leave the boy’s face free on the left');assert(rows.every(r=>r.h>=33),'Parchment has vertical breathing room');
   const neighbor=page.locator('[data-neighbor="lt"]');await neighbor.click();assert.equal(await neighbor.getAttribute('aria-pressed'),'true');assert.deepEqual(JSON.parse(await page.locator('#scenic-map-scroll').getAttribute('data-highlighted-neighbors')),['lt']);await neighbor.click();assert.equal(await neighbor.getAttribute('aria-pressed'),'false');
   const before=JSON.parse(await page.locator('#scenic-map-scroll').getAttribute('data-atlas-frame')),metadata=await page.evaluate(async()=>fetch('assets/maps/europe-atlas-v26.json').then(r=>r.json()));const box=metadata.features.find(f=>f.id==='pl').box;
   assert(Math.abs(before.x+before.w/2-box.x-box.w/2)<.01&&Math.abs(before.y+before.h/2-box.y-box.h/2)<.01,'Near camera centers the target');assert(Math.max(box.w/before.w,box.h/before.h)>.59,'Country fills the near frame');
   await capture(page,engine+'-v28-poland');
   await page.getByRole('button',{name:'Cała Europa',exact:true}).click();const full=JSON.parse(await page.locator('#scenic-map-scroll').getAttribute('data-atlas-frame'));assert(full.w<=600&&full.h<=443.01);assert(Math.abs(full.w/full.h-map.width/map.height)<.001,'Overview fills the viewport without distortion');
   await capture(page,engine+'-v28-overview');
   await open(page,'es');await choose(page,false);await state(page,'feedback-wrong');await capture(page,engine+'-v28-spain');
  });
  await check(engine+'-missing-watercolor-mask',browser,{},async page=>{
   await page.route('**/europe-edge-v22.webp',route=>route.abort());
   await open(page,'pl');await choose(page,false);await state(page,'feedback-wrong');
   assert.equal(await page.locator('#scenic-map-scroll').getAttribute('data-ink-phase'),'complete');
   await page.getByRole('button',{name:'Cała Europa',exact:true}).click();await page.waitForTimeout(SCENIC.atlas.viewMs+80);
   await capture(page,engine+'-mask-fallback');
  });
  await check(engine+'-atlas-neighbors-flags-capital-and-callouts',browser,{},async page=>{
   await open(page,'pl');await choose(page,false);await state(page,'feedback-wrong');
   let labels=JSON.parse(await page.locator('#scenic-map-scroll').getAttribute('data-atlas-labels'));
   for(const id of ['de','cz','sk','ua','by','lt','ru'])assert(labels.some(x=>x.id===id&&x.flag),'Poland has a readable label and flag for '+id);
   const capital=JSON.parse(await page.locator('#scenic-map-scroll').getAttribute('data-capital-pin'));
   assert.equal(capital.name,'Warszawa');assert(Math.abs(capital.lonLat[0]-21.005347)<.001&&Math.abs(capital.lonLat[1]-52.230872)<.001,'Capital pin uses the source coordinate, not country centroid');
   assert(labels.some(x=>x.capital&&x.name==='Warszawa'));assert.equal(await page.locator('#scenic-neighbors').isVisible(),true,'Neighbor ribbons are available on the phone');
   await capture(page,engine+'-v26-poland-neighbors');
   await open(page,'ch');await choose(page,false);await state(page,'feedback-wrong');
   labels=JSON.parse(await page.locator('#scenic-map-scroll').getAttribute('data-atlas-labels'));
   assert(labels.some(x=>x.id==='li'&&x.flag),'Tiny Liechtenstein has a readable name and its flag');
   await capture(page,engine+'-v26-swiss-callouts');
  });
  await check(engine+'-desktop-land-neighbors',browser,{viewport:{width:1200,height:900}},async page=>{
   await open(page,'pl');await choose(page,false);await state(page,'feedback-wrong');
   assert.equal(await page.locator('.scenic-atlas-desktop').isVisible(),true);
   assert.equal(await page.locator('#scenic-desktop-neighbors li').count(),7);
   assert((await page.locator('#scenic-desktop-neighbors').innerText()).includes('Litwa'));assert((await page.locator('#scenic-desktop-neighbors').innerText()).includes('Rosja'));
   const panel=await page.locator('.scenic-atlas-desktop').boundingBox();assert(panel.x+panel.width<=1200);
   await capture(page,engine+'-v26-desktop-neighbors');
  });
  await check(engine+'-labels-inside-watercolor-edge',browser,{reducedMotion:'reduce'},async page=>{
   for(const {id} of FLAGS.filter(record=>record.continent==='europe')){
    await open(page,id);await choose(page,false);await state(page,'feedback-wrong');
    const ribbons=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect(),boy=r('.scenic-boy'),face={left:boy.left,right:boy.left+boy.width*.88,top:boy.top+boy.height*.25,bottom:boy.top+boy.height*.65};return {bottom:r('#scenic-neighbors').bottom,rail:Math.min(r('#scenic-controls').top,r('#scenic-swipe-knob').top),faceClear:[...document.querySelectorAll('.scenic-neighbor-row')].every(n=>{const x=n.getBoundingClientRect();return x.left>=face.right||x.right<=face.left||x.bottom<=face.top||x.top>=face.bottom;})};});
    assert(ribbons.bottom+5.8<=ribbons.rail,'Neighbors remain above the slider for '+id+': '+JSON.stringify(ribbons));assert(ribbons.faceClear,'Neighbors leave the boy’s face clear for '+id);
    for(const view of ['near','europe']){
     if(view==='europe')await page.getByRole('button',{name:'Cała Europa',exact:true}).click();
     if(view==='near')assert(await page.locator('#scenic-map-scroll').evaluate(n=>JSON.parse(n.dataset.atlasLabels).some(label=>label.capital)),'Capital label remains visible for '+id);
     const clipped=await page.evaluate(async()=>{
      const labels=JSON.parse(document.querySelector('#scenic-map-scroll').dataset.atlasLabels),r=document.querySelector('.scenic-europe-map').getBoundingClientRect(),d=Math.min(devicePixelRatio,2),mask=new Image();mask.src=new URL('assets/maps/europe-edge-v22.webp',document.baseURI).href;await mask.decode();
      const c=document.createElement('canvas');c.width=Math.round(r.width*d);c.height=Math.round(r.height*d);const ctx=c.getContext('2d');ctx.drawImage(mask,0,0,c.width,c.height);const frame=JSON.parse(document.querySelector('#scenic-map-scroll').dataset.atlasFrame);ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,-frame.x/frame.w*c.width,-frame.y/frame.h*c.height,680/frame.w*c.width,500/frame.h*c.height);ctx.globalCompositeOperation='source-over';const pixels=ctx.getImageData(0,0,c.width,c.height).data;ctx.font='850 10px ScenicBody';
      const clipped=labels.filter(label=>{const b=label.box||{x:label.x-ctx.measureText(label.name).width/2-4,y:label.y-2,w:ctx.measureText(label.name).width+8,h:label.flag?27:15};let bad=0,total=0;
       for(let y=Math.ceil(b.y*d);y<Math.floor((b.y+b.h)*d);y++)for(let x=Math.ceil(b.x*d);x<Math.floor((b.x+b.w)*d);x++){total++;if(x<0||x>=c.width||y<0||y>=c.height||pixels[(y*c.width+x)*4+3]<220)bad++;}
       return !total||bad/total>.005;
      }).map(label=>'edge: '+label.name);
      for(const label of labels.filter(label=>label.leader&&label.anchor)){
       const dx=label.x-label.anchor.x,dy=label.y+5-label.anchor.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));
       for(const other of labels){if(other===label||!other.box)continue;const b=other.box;
        for(let i=0;i<=steps;i++){const x=label.anchor.x+dx*i/steps,y=label.anchor.y+dy*i/steps;if(x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h){clipped.push('leader: '+label.name+' crosses '+other.name);break;}}
       }
      }
      return clipped;
     });
     assert.deepEqual(clipped,[],id+'/'+view+': text and flags stay inside the alpha edge and leaders avoid other labels');
     if(id==='li'&&view==='near')await capture(page,engine+'-v26-edge-safe-labels');
    }
   }
  });
  await check(engine+'-atlas-view-switch',browser,{},async page=>{
   await open(page,'pl');await choose(page,false);await state(page,'feedback-wrong');
   const initial=await page.locator('.scenic-europe-map').boundingBox();
   await page.getByRole('button',{name:'Cała Europa',exact:true}).click();await page.waitForTimeout(SCENIC.atlas.viewMs+80);
   assert.equal(await page.locator('#scenic-map-scroll').getAttribute('data-view'),'europe');
   const labels=JSON.parse(await page.locator('#scenic-map-scroll').getAttribute('data-drawn-labels'));assert(labels.length>=4&&labels.some(x=>['Francja','Hiszpania'].includes(x)),'Full Europe labels are anchored globally, not limited to the previous near crop');
   await capture(page,engine+'-atlas-full-europe');
   await page.getByRole('button',{name:'Kraj i jego otoczenie',exact:true}).click();await page.waitForTimeout(SCENIC.atlas.viewMs+80);
   assert.equal(await page.locator('#scenic-map-scroll').getAttribute('data-view'),'near');
   assert.deepEqual(await page.locator('.scenic-europe-map').boundingBox(),initial,'Changing camera never changes the map component geometry');
   assert.equal(await page.locator('#scenic-screen').getAttribute('data-state'),'feedback-wrong');
   await capture(page,engine+'-atlas-near');
  });
  if(phase!=='layout'){
   await check(engine+'-animation-frames',browser,{},async page=>{
    await open(page);const closedTop=await page.locator('.scenic-paper-top').boundingBox(),closedCompass=await page.locator('.scenic-compass').boundingBox(),fixedBottom=await page.locator('.scenic-paper-bottom').boundingBox();await freezeFold(page,true);await choose(page,false);
    await page.waitForFunction(()=>document.querySelector('#scenic-map-scroll').classList.contains('is-opening'));
    const compassSize=await page.locator('.scenic-compass').boundingBox();
    assert.equal(await page.locator('#scenic-hero').evaluate(n=>getComputedStyle(n).visibility),'visible','Opening paper must cover the flag progressively');
    // Pause and seek the actual Web Animations timeline. Screenshot overhead
    // cannot skip a fold; each frame has a precise fraction of the same opening.
    for(const [label,fraction] of [['start',.06],['middle',.47],['end',.92]]){
     await page.evaluate(({fraction,duration})=>{for(const a of document.getAnimations())if(a.effect?.target?.matches('.scenic-fold-leaf,.scenic-fold-shade,.scenic-fold-light,.scenic-paper-top,.scenic-compass,.scenic-prompt')){a.pause();a.currentTime=duration*fraction;}},{fraction,duration:SCENIC.openMs});
     const opacity=await page.locator('.scenic-fold-leaf').evaluateAll(nodes=>nodes.map(n=>Number(getComputedStyle(n).opacity)));
     const bottomNow=await page.locator('.scenic-paper-bottom').boundingBox();assert(Math.abs(bottomNow.y-fixedBottom.y)<.1&&Math.abs(bottomNow.height-fixedBottom.height)<.1,'Lower paper and engraving remain fixed');
     const compassNow=await page.locator('.scenic-compass').boundingBox();assert(Math.abs(compassSize.width-compassNow.width)<.1&&Math.abs(compassSize.height-compassNow.height)<.1,'Compass has a constant size throughout unfolding');
     assert.equal(await page.locator('#scenic-map-scroll').getAttribute('data-ink-phase'),null,'Ink must wait for the entire unfolding');assert(opacity.every(x=>x===0||x===1),'paper surfaces must stay opaque');
     await capture(page,engine+'-unroll-'+label);
    }
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('scenic-qa-pause',{detail:false})));await state(page,'feedback-wrong');
    assert.equal(await page.locator('#scenic-hero').evaluate(n=>getComputedStyle(n).visibility),'visible','The flag stays underneath the paper without a visibility jump');
    await freezeFold(page,false);await slide(page);await page.waitForFunction(()=>document.querySelector('#scenic-map-scroll').classList.contains('is-closing'));
    assert.equal(await page.locator('#scenic-map-scroll').getAttribute('data-ink-phase'),'empty','Map dissolves before paper folds');
    for(const [label,fraction] of [['start',.06],['middle',.47],['end',.92]]){
     await page.evaluate(({fraction,duration})=>{for(const a of document.getAnimations())if(a.effect?.target?.matches('.scenic-fold-leaf,.scenic-fold-shade,.scenic-fold-light,.scenic-paper-top,.scenic-compass,.scenic-prompt')){a.pause();a.currentTime=duration*fraction;}},{fraction,duration:SCENIC.closeMs});
     await capture(page,engine+'-rollup-'+label);
    }
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('scenic-qa-pause',{detail:false})));await state(page,'playing');
    for(const [selector,before] of [['.scenic-paper-top',closedTop],['.scenic-compass',closedCompass]]){const after=await page.locator(selector).boundingBox();for(const key of ['x','y','width','height'])assert(Math.abs(after[key]-before[key])<.2,'The fold endpoint must exactly match the initial question material');}
    await page.locator('[data-action="restart"]').click();await state(page,'playing');await choose(page,false);await state(page,'feedback-wrong');
    const captures=[['falling',.10],['settled',.40],['forming',.84],['end',.93]];
    await page.evaluate(f=>document.querySelector('#scenic-screen').dataset.qaCaptureAt=String(f),captures[0][1]);
    await slide(page);
    for(let index=0;index<captures.length;index++){
     const [label,fraction]=captures[index];
     await page.waitForFunction(f=>document.querySelector('#scenic-screen').dataset.qaCaptured===String(f),fraction);
     await capture(page,engine+'-sand-'+label);
     await page.evaluate(next=>{
      if(next!==null)document.querySelector('#scenic-screen').dataset.qaCaptureAt=String(next);
      window.dispatchEvent(new CustomEvent('scenic-qa-pause',{detail:false}));
     },captures[index+1]?.[1]??null);
    }
    await state(page,'playing');assert.equal(await page.locator('#scenic-task').textContent(),'Zadanie 2');await capture(page,'06-sand-next-'+engine);
   });
  }
  if(phase!=='layout')await check(engine+'-ink-passes-and-continuous-material',browser,{},async page=>{
   await open(page);const compass=await page.locator('.scenic-compass').boundingBox(),bottom=await page.locator('.scenic-paper-bottom').boundingBox();
   assert.equal(await page.locator('#scenic-score').isVisible(),false);assert.equal(await page.locator('#scenic-compass').evaluate(n=>n.parentElement.id),'scenic-stage','Compass sits outside the folding 3D context');
   const sign=await page.locator('#scenic-task').boundingBox(),bar=await page.locator('#scenic-progress').boundingBox();assert(sign.x>195);assert(sign.y<bar.y+bar.height&&sign.y+sign.height>bar.y+bar.height,'Task sign hangs across the timer bar');
   await page.evaluate(()=>document.querySelector('#scenic-screen').dataset.qaInkAt='0.12');await choose(page,false);
   for(const [index,fraction] of [.12,.43,.73,.97].entries()){
    await page.waitForFunction(f=>document.querySelector('#scenic-screen').dataset.qaInkCaptured===String(f),fraction);
    const m=await metrics(page);assert.equal(m.inkPhase,'drawing');assert.equal(m.inkGrains,0);assert.equal(m.inkOutside,0);assert(Math.abs(m.compass.w-compass.width)<.1&&Math.abs(m.compass.h-compass.height)<.1,'Compass must not scale');
    assert.equal(await page.locator('#scenic-map-scroll').evaluate(n=>n.classList.contains('is-open')),true);const now=await page.locator('.scenic-paper-bottom').boundingBox();assert(Math.abs(now.y-bottom.y)<.1,'Engraved bottom stays fixed');
    await capture(page,engine+'-ink-pass-'+(index+1));
    await page.evaluate(next=>{if(next!==null)document.querySelector('#scenic-screen').dataset.qaInkAt=String(next);window.dispatchEvent(new CustomEvent('scenic-qa-pause',{detail:false}));},[.43,.73,.97,null][index]);
   }
   await state(page,'feedback-wrong');await page.evaluate(()=>document.querySelector('#scenic-screen').dataset.qaInkAt='0.46');await slide(page);
   await page.waitForFunction(()=>document.querySelector('#scenic-screen').dataset.qaInkCaptured==='0.46');assert.equal(await page.locator('#scenic-map-scroll').getAttribute('data-ink-phase'),'erasing');assert.equal(await page.locator('#scenic-map-scroll').evaluate(n=>n.classList.contains('is-open')),true);await capture(page,engine+'-ink-erasing');
   await page.evaluate(()=>window.dispatchEvent(new CustomEvent('scenic-qa-pause',{detail:false})));await state(page,'playing');
  });
  if(phase==='full'){
   await check(engine+'-transparent-atlas-and-editorial-heading',browser,{},async page=>{
    await open(page);await choose(page,false);await state(page,'feedback-wrong');
    const atlas=await page.locator('#scenic-map-ink').evaluate(canvas=>{const origin=canvas.getBoundingClientRect(),r=document.querySelector('.scenic-europe-map').getBoundingClientRect(),d=canvas.width/origin.width;const px=canvas.getContext('2d').getImageData(Math.round((r.left-origin.left)*d),Math.round((r.top-origin.top)*d),Math.floor(r.width*d),Math.floor(r.height*d)).data;let empty=0,partial=0;for(let i=3;i<px.length;i+=4){if(!px[i])empty++;else if(px[i]<245)partial++;}return {empty:empty/(px.length/4),partial:partial/(px.length/4),corner:px[3]};});
    assert.equal(await page.locator('#scenic-map-ink').evaluate(n=>getComputedStyle(n).mixBlendMode),'multiply','Atlas pigment blends with the parchment');assert.equal(atlas.corner,0,'The painted map has a genuinely transparent corner');assert(atlas.empty>.08&&atlas.partial>.01,'The final Canvas preserves chipped alpha edges, without an opaque image rectangle');
    assert.equal(await page.locator('.scenic-europe-map').evaluate(n=>getComputedStyle(n).maskImage),'none','No blurred map vignette');
    assert.equal((await metrics(page)).inkGrains,0);assert(!(await page.locator('#scenic-country-capital').textContent()).includes('Stolica:'));assert.equal(await page.locator('.scenic-capital-icon').count(),1);
    assert(await page.locator('#scenic-feedback').evaluate(n=>getComputedStyle(n).clipPath==='inset(50%)'),'Answer feedback does not occupy atlas space');
   });
   await check(engine+'-pause-and-restart-during-ink',browser,{},async page=>{
    await open(page);await choose(page,false);await page.waitForFunction(()=>document.querySelector('#scenic-map-scroll').dataset.inkPhase==='drawing');
    await page.locator('[data-action="pause"]').click();const pixels=await page.locator('#scenic-map-ink').evaluate(n=>n.toDataURL());await page.waitForTimeout(650);assert.equal(await page.locator('#scenic-map-ink').evaluate(n=>n.toDataURL()),pixels,'Pause freezes every ink mask pixel');
    await page.locator('[data-action="pause"]').click();await state(page,'feedback-wrong');await slide(page);await page.waitForFunction(()=>document.querySelector('#scenic-map-scroll').dataset.inkPhase==='erasing');
    await page.locator('[data-action="pause"]').click();const erased=await page.locator('#scenic-map-ink').evaluate(n=>n.toDataURL());await page.waitForTimeout(450);assert.equal(await page.locator('#scenic-map-ink').evaluate(n=>n.toDataURL()),erased);
    await page.locator('[data-action="restart"]').click();await state(page,'playing');await page.waitForTimeout(SCENIC.inkDrawMs+SCENIC.openMs+200);const m=await metrics(page);assert.equal(m.task,'Zadanie 1');assert.equal(m.state,'playing');assert.equal(m.inkPhase,undefined);
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target?.id!=='scenic-progress-fill').length),0,'Only the game clock progress may animate after restart');
    assert(await page.locator('#scenic-map-ink').evaluate(n=>!n.getContext('2d').getImageData(0,0,n.width,n.height).data.some((v,i)=>i%4===3&&v!==0)),'Restart clears every ink pixel');
   });
   await check(engine+'-stable-scene-and-answer-geometry',browser,{},async page=>{
    await open(page);const before=await metrics(page);
    const scenery=()=>page.locator('#scenic-screen').evaluate(n=>({background:getComputedStyle(n).backgroundImage,foreground:n.querySelector('.scenic-boy').getAttribute('src'),replacement:n.querySelectorAll('.scenic-feedback-scene').length,vectorCompass:n.querySelectorAll('.scenic-paper-row svg,.scenic-atlas-compass').length}));
    const first=await scenery();assert.equal(first.vectorCompass,0);assert.equal(first.replacement,0);assert(first.foreground.endsWith('scenic-boy-v29.webp'));
    assert.equal(await page.locator('.flag-pole,.scenic-rock-base,.scenic-land-shadow').count(),0,'Mast and rocks belong to one scene image');
    assert.equal(await page.locator('.scenic-boy').evaluate(n=>getComputedStyle(n).clipPath),'none','Boy uses the generated asset alpha, with no polygon cutout');
    await choose(page,false);await page.waitForTimeout(180);await capture(page,engine+'-click-early');await state(page,'feedback-wrong');
    const after=await metrics(page);assert.deepEqual(await scenery(),first);
    for(let i=0;i<4;i++)for(const key of ['x','y','w','h'])assert(Math.abs(before.answers[i][key]-after.answers[i][key])<1,'Answer tiles must not move after an answer');
    await slide(page);await state(page,'playing');assert.deepEqual(await scenery(),first);
    const next=await metrics(page);for(let i=0;i<4;i++)for(const key of ['x','y','w','h'])assert(Math.abs(before.answers[i][key]-next.answers[i][key])<1,'Answer tiles must not move during the next question');
   });
   await check(engine+'-two-line-sand-and-production-slider',browser,{},async page=>{
    await open(page,'ba');const before=await metrics(page);assert(before.answers.some(b=>b.lineCount===2));assert(before.answers.every(b=>b.lineCount<=2&&b.labelFits));
    await choose(page,false);await state(page,'feedback-wrong');
    const clock=await page.locator('#scenic-clock').textContent();await page.locator('#scenic-swipe').click({position:{x:180,y:20}});await page.waitForTimeout(400);assert.equal((await metrics(page)).state,'feedback-wrong');
    const a=await page.locator('#scenic-swipe-knob').boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(a.x+a.width/2+60,a.y+a.height/2);await page.mouse.up();await page.waitForTimeout(550);assert.equal((await metrics(page)).state,'feedback-wrong');assert.equal(await page.locator('#scenic-swipe').getAttribute('aria-valuenow'),'0');
    assert.equal(await page.locator('#scenic-clock').textContent(),clock);assert.equal(await page.locator('#scenic-clock-caption').textContent(),'Czas zatrzymany');
    await page.evaluate(()=>document.querySelector('#scenic-screen').dataset.qaCaptureAt='.76');await slide(page);
    await page.waitForFunction(()=>document.querySelector('#scenic-screen').dataset.qaCaptured==='0.76');
    const moves=await page.locator('#scenic-sand-canvas').evaluate(n=>({up:Number(n.dataset.upward),down:Number(n.dataset.downward)}));assert(moves.up>0&&moves.down>0);
    await capture(page,engine+'-two-line-sand');await page.evaluate(()=>window.dispatchEvent(new CustomEvent('scenic-qa-pause',{detail:false})));await state(page,'playing');
   });
   await check(engine+'-correct-auto-and-pause',browser,{},async page=>{
    await open(page,'by',false);await choose(page);await state(page,'feedback-correct');await page.waitForTimeout(900);
    await page.locator('[data-action="pause"]').click();const before=await metrics(page);await page.waitForTimeout(SCENIC.memoryMs+400);
    assert.equal((await metrics(page)).task,before.task);assert.equal((await metrics(page)).state,'feedback-correct');
    await page.locator('[data-action="pause"]').click();await page.waitForTimeout(1200);assert.equal((await metrics(page)).task,'Zadanie 1');
    await state(page,'playing');assert.equal((await metrics(page)).task,'Zadanie 2');assert.equal((await metrics(page)).score,'1 pkt');assert.equal((await metrics(page)).country,'pl');
   });
   await check(engine+'-wrong-pause-slider-and-several-rounds',browser,{},async page=>{
    await open(page);await choose(page,false);await state(page,'feedback-wrong');await page.waitForTimeout(4200);assert.equal((await metrics(page)).task,'Zadanie 1');
    for(let i=0;i<Number(process.env.SCENIC_QA_ROUNDS||5);i++){
     console.log(JSON.stringify({name:engine+'-stress',round:i+1,phase:'before-erase'}));
     await slide(page);await page.waitForFunction(()=>document.querySelector('#scenic-screen').dataset.state==='transition');
     console.log(JSON.stringify({name:engine+'-stress',round:i+1,phase:'folding'}));
     await page.locator('[data-action="pause"]').click();const task=(await metrics(page)).task;await page.waitForTimeout(1800);assert.equal((await metrics(page)).task,task);
     await page.locator('[data-action="pause"]').click();await state(page,'playing');assert.equal((await metrics(page)).task,'Zadanie '+(i+2));
     assert(await page.locator('#scenic-map-ink').evaluate(n=>n.width===1&&n.height===1),'Inactive ink releases its backing buffer');assert(await page.locator('#scenic-sand-canvas').evaluate(n=>n.width===1&&n.height===1),'Inactive sand releases its backing buffer');
     console.log(JSON.stringify({name:engine+'-stress',round:i+1,phase:'next-question'}));
     await choose(page,false);await state(page,'feedback-wrong');
     console.log(JSON.stringify({name:engine+'-stress',round:i+1,phase:'ink-complete'}));
    }
   });
   await check(engine+'-restart-at-boundaries',browser,{},async page=>{
    await open(page);
    for(const boundary of ['showing-map','feedback-wrong','transition']){
     await choose(page,false);if(boundary==='feedback-wrong'||boundary==='transition')await state(page,'feedback-wrong');
     if(boundary==='transition'){await slide(page);await page.waitForFunction(()=>document.querySelector('#scenic-screen').dataset.state==='transition');}
     await page.locator('[data-action="pause"]').click();await page.locator('[data-action="restart"]').click();await state(page,'playing');await page.waitForTimeout(1800);
     const m=await metrics(page);assert.equal(m.task,'Zadanie 1');assert.equal(m.score,'0 pkt');assert.equal(m.state,'playing');assert(m.answers.every(b=>!b.disabled));assert.equal(await page.locator('#scenic-screen').evaluate(n=>n.classList.contains('is-paused')),false);
    }
   });
   await check(engine+'-reduced-motion-and-keyboard',browser,{reducedMotion:'reduce'},async page=>{
    await open(page,'ba');await choose(page,false);await state(page,'feedback-wrong');await capture(page,engine+'-reduced-motion');
    await page.locator('#scenic-swipe').focus();await page.keyboard.press('Enter');assert.equal((await metrics(page)).task,'Zadanie 1');for(let i=0;i<11;i++)await page.keyboard.press('ArrowRight');await state(page,'playing');assert.equal((await metrics(page)).task,'Zadanie 2');assert.equal((await metrics(page)).animations,0);
   });
   await check(engine+'-image-fallback',browser,{},async page=>{
    await page.route('**/assets/maps/europe-painted-v27.webp',route=>route.abort());await page.route('**/assets/flags/cloth-prebaked/by.webp',route=>route.abort());
    await open(page);assert(await page.locator('.flag-cloth-fallback').evaluate(n=>n.complete&&n.naturalWidth>0));
    await choose(page,false);await state(page,'feedback-wrong');assert.equal((await metrics(page)).raster,'vector-fallback');assert((await metrics(page)).highlight);assert((await metrics(page)).activeCount>1);await capture(page,engine+'-image-fallback');
   });
   await check(engine+'-paper-image-fallback',browser,{},async page=>{
    await page.route('**/assets/flags/adventure/scenic-paper-v14.webp',route=>route.abort());
    await open(page);assert.equal(await page.locator('#scenic-screen').getAttribute('data-question-paper'),'fallback');
    assert.notEqual(await page.locator('.scenic-paper-bottom').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');
    await choose(page,false);await state(page,'feedback-wrong');assert.equal(await page.locator('#scenic-map-scroll').getAttribute('data-material-ready'),'false');
    assert.notEqual(await page.locator('.scenic-paper-bottom').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');
    assert((await metrics(page)).captionFits);await capture(page,engine+'-paper-image-fallback');await slide(page);await state(page,'playing');assert.equal((await metrics(page)).task,'Zadanie 2');
   });
   await check(engine+'-map-fetch-failure',browser,{},async page=>{
    await page.route('**/assets/maps/europe-atlas-v26.svg',route=>route.abort());await open(page);await choose(page,false);await state(page,'feedback-wrong');assert((await page.locator('.scenic-map-unavailable').textContent()).includes('niedostępna'));
    await page.locator('#scenic-swipe').focus();for(let i=0;i<11;i++)await page.keyboard.press('ArrowRight');await state(page,'playing');assert.equal((await metrics(page)).task,'Zadanie 2');
   });
   await check(engine+'-memory-starts-after-slow-bitmap',browser,{},async page=>{
    await page.route('**/assets/maps/europe-painted-v27.webp',async route=>{await new Promise(done=>setTimeout(done,1800));await route.continue();});
    await open(page,'by',false);await choose(page);await state(page,'feedback-correct');const started=Date.now();
    await page.waitForFunction(()=>document.querySelector('#scenic-screen').dataset.state==='transition');assert(Date.now()-started>=SCENIC.memoryMs-150);
   });
  }
  await browser?.close();browser=null;
 }
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
 await writeFile(join(OUT,'report.json'),JSON.stringify({phase,passed:reports.length-failures.length,total:reports.length,reports},null,2)+'\n');
}
if(!reports.length)throw Error('No QA scenarios matched; an empty run is not verification.');
if(failures.length)throw Error(failures.length+' QA scenarios failed');
console.log('PASS '+reports.length+'/'+reports.length+' scenic scenarios ('+phase+')');
