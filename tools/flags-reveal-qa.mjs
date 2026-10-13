#!/usr/bin/env node
// Visual QA for the actual interactive flag preview. Run in GitHub Actions.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, extname, resolve, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const OUT=join(ROOT,'docs/flags-adventure/qa-reveal-v2');
const TYPES={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css',
 '.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg',
 '.woff':'font/woff','.woff2':'font/woff2','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
  let path;
  try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}
  catch{res.writeHead(400).end();return;}
  const file=resolve(ROOT,'.'+path+(path.endsWith('/')?'index.html':''));
  if(!file.startsWith(ROOT+sep)){res.writeHead(403).end();return;}
  try{
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':TYPES[extname(file)]||'application/octet-stream'});
    res.end(body);
  }catch{res.writeHead(404).end();}
});
await mkdir(OUT,{recursive:true});
server.listen(0,'127.0.0.1');
await once(server,'listening');
const origin='http://127.0.0.1:'+server.address().port;
const scenes=[
  {name:'01-pl-question',id:'pl',state:'question',width:390,height:844},
  {name:'02-pl-correct',id:'pl',state:'correct',width:390,height:844},
  {name:'03-pl-wrong',id:'pl',state:'wrong',width:390,height:844},
  {name:'04-np-correct',id:'np',state:'correct',width:390,height:844},
  {name:'05-ch-wrong',id:'ch',state:'wrong',width:390,height:844},
  {name:'06-cf-correct',id:'cf',state:'correct',width:390,height:844},
  {name:'07-pl-short',id:'pl',state:'wrong',width:390,height:700},
  {name:'08-ch-large',id:'ch',state:'correct',width:430,height:932}
];
let browser;
const metrics=[];
try{
  browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  for(const scene of scenes){
    const context=await browser.newContext({viewport:{width:scene.width,height:scene.height},deviceScaleFactor:2});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const url=origin+'/flagi/preview-frame.html?country='+scene.id+'&safe=1'+(scene.state==='question'?'':'&state='+scene.state);
    try{
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForSelector('.question-card[data-adventure-ready="true"]',{timeout:20000});
      if(scene.name==='02-pl-correct'){
        await page.waitForFunction(()=>document.querySelector('.question-card')?.classList.contains('is-revealed'),{timeout:20000});
        for(const [step,delay] of [['a-early',110],['b-mid',160],['c-late',170]]){
          await page.waitForTimeout(delay);
          await page.screenshot({path:join(OUT,'timeline-'+step+'.jpg'),type:'jpeg',quality:83,fullPage:true});
        }
      }
      if(scene.state!=='question'){
        await page.waitForFunction(()=>document.querySelector('.question-card')?.dataset.flagScenePhase==='revealed',{timeout:20000});
      }
      await page.waitForFunction(()=>!!document.querySelector('.flag-cloth.is-prebaked'),{timeout:20000});
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForTimeout(250);
      const info=await page.evaluate(()=>{
        const q=s=>document.querySelector(s);
        const rect=node=>{
          if(!node)return null;
          const {x,y,width,height}=node.getBoundingClientRect();
          return {x:+x.toFixed(1),y:+y.toFixed(1),width:+width.toFixed(1),height:+height.toFixed(1)};
        };
        const card=q('.question-card'),flag=q('.flag-cloth');
        const map=q('.flag-adventure-map');
        const title=q('.flag-adventure-name');
        return {
          card:rect(card),answers:[...document.querySelectorAll('.answers .answer')].map(rect),
          flag:rect(flag),poleOpacity:q('.flag-pole')?+getComputedStyle(q('.flag-pole')).opacity:null,
          map:rect(map),mapOpacity:map?+getComputedStyle(map).opacity:null,
          selected:!!q('.continent-map-host .country.is-highlighted'),
          zoomed:!!q('.continent-map-canvas svg[data-focused-country="true"]'),
          imageReady:!!q('.flag-cloth.is-prebaked'),
          title:title?.textContent?.trim()||null,
          overflowX:document.documentElement.scrollWidth>innerWidth+2,
          phase:card?.dataset.flagScenePhase||'question'
        };
      });
      const report={...scene,...info,errors};
      metrics.push(report);
      await page.screenshot({path:join(OUT,scene.name+'.jpg'),type:'jpeg',quality:85,fullPage:true});
      console.log(scene.name,JSON.stringify(report));
    }catch(error){
      metrics.push({...scene,error:String(error),errors});
      // Keep a failed-screen capture to diagnose broken UI.
      await page.screenshot({path:join(OUT,scene.name+'.jpg'),type:'jpeg',quality:75}).catch(()=>{});
      console.error('QA error',scene.name,error);
    }finally{await context.close();}
  }
  await writeFile(join(OUT,'metrics.json'),JSON.stringify(metrics,null,2)+'\n');
  const baseline=metrics.filter(x=>x.id==='pl'&&x.height===844).slice(0,3);
  if(baseline.length===3&&baseline.every(x=>x.card&&x.answers.length===4)){
    const first=baseline[0];
    for(const item of baseline){
      const drift=Math.abs(item.card.y-first.card.y)+Math.abs(item.card.height-first.card.height);
      if(drift>2.1)throw Error('Flag card position changed across answer states: '+drift);
      for(let k=0;k<4;k++){
        const a=item.answers[k],b=first.answers[k];
        if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+Math.abs(a.width-b.width)>2.1)
          throw Error('Answer hitbox shifted after answer: '+item.state+' #'+k);
      }
    }
  }
  if(metrics.some(x=>x.error||x.overflowX||!x.imageReady))throw Error('Incomplete atlas QA; check metrics.json');
  for(const item of metrics.filter(x=>x.state!=='question')){
    if(!item.selected||!item.map||item.poleOpacity>.05||item.mapOpacity<.95)
      throw Error('Atlas transition incomplete for '+item.name);
  }
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
