#!/usr/bin/env node
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,extname,resolve,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const OUT=join(ROOT,'docs/flags-adventure/qa-scenic');
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 const file=resolve(ROOT,'.'+path+(path.endsWith('/')?'index.html':''));
 if(!file.startsWith(ROOT+sep)){res.writeHead(403).end();return;}
 try{const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data);}
 catch{res.writeHead(404).end();}
});
await mkdir(OUT,{recursive:true});
server.listen(0,'127.0.0.1');await once(server,'listening');
const base='http://127.0.0.1:'+server.address().port;
let browser;
const reports=[];
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const samples=[
  {country:'by',state:'question',width:390,height:844,name:'01-belarus-question'},
  {country:'by',state:'correct',width:390,height:844,name:'02-belarus-correct'},
  {country:'by',state:'wrong',width:390,height:844,name:'03-belarus-wrong'},
  {country:'pl',state:'correct',width:390,height:700,name:'04-poland-short'},
  {country:'ch',state:'correct',width:430,height:932,name:'05-swiss-max'},
  {country:'by',state:'next',width:390,height:844,name:'06-sand-next'}
 ];
 for(const sample of samples){
  const ctx=await browser.newContext({viewport:{width:sample.width,height:sample.height},deviceScaleFactor:2});
  const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=base+'/flagi/scenic-preview.html?country='+sample.country+'&freeze=1';
  try{
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForSelector('.scenic-answer',{timeout:15000});
   await page.waitForFunction(()=>document.querySelector('.scenic-flag-host .flag-cloth.is-prebaked'),{timeout:15000});
   if(sample.state!=='question'){
    if(sample.state==='correct'||sample.state==='next')await page.locator('.scenic-answer[data-id="'+sample.country+'"]').click();
    else await page.locator('.scenic-answer[data-id="pl"]').click();
    if(sample.name==='02-belarus-correct'){
      // The clickable atlas should look like a folded object, not just a
      // wipe mask. Capture three moments before the map is fully readable.
      for(const [name,ms] of [['a-first',145],['b-crease',265],['c-flat',325]]){
        await page.waitForTimeout(ms);
        await page.screenshot({path:join(OUT,'unroll-'+name+'.jpg'),type:'jpeg',quality:83,fullPage:true});
      }
    }
    await page.waitForFunction(()=>document.querySelector('.scenic-map-scroll')?.classList.contains('is-open'),{timeout:15000});
    if(sample.state==='next'){
      const button=page.locator('.scenic-swipe-knob'); // correct has no manual button; use wrong case.
      await page.locator('[data-action="restart"]').click();
      await page.locator('.scenic-answer[data-id="pl"]').click();
      await page.waitForFunction(()=>!document.querySelector('.scenic-swipe').hidden,{timeout:15000});
      const knob=page.locator('.scenic-swipe-knob'),track=page.locator('.scenic-swipe');
      const a=await knob.boundingBox(),b=await track.boundingBox();
      await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
      await page.mouse.down();
      await page.mouse.move(b.x+b.width-18,a.y+a.height/2,{steps:12});
      await page.mouse.up();
      await page.waitForTimeout(300);
      await page.screenshot({path:join(OUT,'rollup-in-flight.jpg'),type:'jpeg',quality:83,fullPage:true});
      await page.waitForFunction(()=>document.querySelector('#scenic-task')?.textContent==='Zadanie 2',{timeout:15000});
    }
   }
   const metrics=await page.evaluate(()=>{
    const rect=sel=>{
      const r=document.querySelector(sel)?.getBoundingClientRect();
      return r&&{x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)};
    };
    const svg=document.querySelector('.scenic-europe-map svg');
    return {flag:rect('.scenic-flag-host .flag-cloth'),paper:rect('.scenic-paper-row'),
      atlas:rect('.scenic-map-scroll'),options:[...document.querySelectorAll('.scenic-answer')].map(node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}}),
      bitmap:document.querySelector('.scenic-europe-map .continent-map-host')?.dataset.mapImage||null,
      pathCount:svg?.querySelectorAll('.country')?.length||0,
      highlighted:!!svg?.querySelector('.scenic-country-overlay'),
      mapReady:document.querySelector('.scenic-map-scroll')?.classList.contains('is-open'),
      country:document.querySelector('#scenic-country-name')?.textContent,
      overflowX:document.documentElement.scrollWidth>innerWidth+2,
      score:document.querySelector('#scenic-score')?.textContent,
      task:document.querySelector('#scenic-task')?.textContent};
   });
   const row={...sample,...metrics,errors};reports.push(row);
   await page.screenshot({path:join(OUT,sample.name+'.jpg'),type:'jpeg',quality:85,fullPage:true});
   console.log(JSON.stringify(row));
  }catch(e){
   reports.push({...sample,error:String(e),errors});console.error(sample.name,String(e));
   await page.screenshot({path:join(OUT,sample.name+'-error.jpg'),type:'jpeg',quality:75}).catch(()=>{});
  }finally{await ctx.close();}
 }
 await writeFile(join(OUT,'report.json'),JSON.stringify(reports,null,2)+'\n');
 for(const r of reports){
  if(r.error||r.errors?.length||r.overflowX||r.options?.length!==4)throw Error('Layout/JS failure: '+r.name);
  if(r.state==='correct'||r.state==='wrong'){
   if(!r.mapReady||!r.highlighted||r.bitmap!=='ready'||r.pathCount!==1)
    throw Error('Europe raster-country alignment not ready: '+r.name);
  }
  if(r.state==='next'&&r.task!=='Zadanie 2')throw Error('Sand slider transition did not advance');
 }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
