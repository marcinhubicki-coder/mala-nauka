#!/usr/bin/env node
/**
 * Generate ONE geographically registered Europe artwork.
 * We rasterize the existing Natural Earth SVG; borders stay perfectly aligned
 * to the single selected country path at runtime. No map per country.
 */
import {chromium} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {dirname,resolve,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const DEST=join(ROOT,'assets/maps/europe-scenic.webp');
const original=await readFile(join(ROOT,'assets/maps/europe.svg'),'utf8');
const server=createServer(async(req,res)=>{
 const p=new URL(req.url,'http://localhost').pathname;
 if(p==='/__render__'){res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>Europe raster</title>');return;}
 const path=resolve(ROOT,'.'+p);
 if(!path.startsWith(ROOT+sep)){res.writeHead(403).end();return;}
 try{const b=await readFile(path);res.writeHead(200,{'Content-Type':p.endsWith('.svg')?'image/svg+xml':'text/plain'}).end(b);}
 catch{res.writeHead(404).end();}
});
server.listen(0,'127.0.0.1');await once(server,'listening');
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1360,height:1000},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:'+server.address().port+'/__render__');
 const encoded=await page.evaluate(async source=>{
   const doc=new DOMParser().parseFromString(source,'image/svg+xml');
   const svg=doc.documentElement;
   if(!svg||svg.nodeName==='parsererror')throw Error('Invalid Natural Earth SVG');
   svg.setAttribute('width','1360');svg.setAttribute('height','1000');
   const ns='http://www.w3.org/2000/svg';
   const defs=doc.createElementNS(ns,'defs');
   defs.innerHTML=String.raw\`
    <linearGradient id="sea" x2=".92" y2="1"><stop stop-color="#b1e6e5"/><stop offset=".47" stop-color="#85cfe0"/><stop offset="1" stop-color="#61b7d7"/></linearGradient>
    <linearGradient id="ground" x2=".72" y2="1"><stop stop-color="#c7dd91"/><stop offset=".45" stop-color="#a9c98b"/><stop offset="1" stop-color="#89b98b"/></linearGradient>
    <radialGradient id="sunlight"><stop stop-color="#fffbe1" stop-opacity=".85"/><stop offset="1" stop-color="#fffbe1" stop-opacity="0"/></radialGradient>
    <pattern id="waves" width="43" height="33" patternUnits="userSpaceOnUse"><path d="M2 12q9-5 18 0t18 0" fill="none" stroke="#f1ffff" stroke-width=".9" opacity=".32"/></pattern>
    <filter id="noise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".055" numOctaves="3" seed="14" stitchTiles="stitch" result="grain"/><feColorMatrix in="grain" type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".1"/></feComponentTransfer></filter>
   \`;
   svg.insertBefore(defs,svg.firstChild);
   const rect=(fill,attrs={})=>{const e=doc.createElementNS(ns,'rect');for(const [k,v] of Object.entries({x:'0',y:'0',width:'680',height:'500',fill,...attrs}))e.setAttribute(k,v);return e;};
   const countries=svg.querySelector('#countries');
   svg.insertBefore(rect('url(#sea)'),countries);
   svg.insertBefore(rect('url(#waves)'),countries);
   const ids=[...svg.querySelectorAll('path.country')];
   for(const p of ids){
     let hash=0;for(const c of p.dataset.country||'xx')hash=(hash*33+c.charCodeAt(0))|0;
     const shades=['#b3cc8a','#b9d69c','#94c78a','#c7d3a0','#9fc58d','#d4d4a1','#b8d2a1'];
     p.setAttribute('fill',shades[Math.abs(hash)%shades.length]);
     p.setAttribute('stroke','#f7f3d5');
     p.setAttribute('stroke-width','1.6');
     p.setAttribute('stroke-linejoin','round');
     p.removeAttribute('class');
     p.removeAttribute('id');
     p.removeAttribute('data-country');
   }
   countries.removeAttribute('fill');
   countries.removeAttribute('stroke');
   countries.removeAttribute('stroke-width');
   const top=rect('url(#sunlight)',{x:'0',y:'-30',width:'680',height:'500',style:'mix-blend-mode:soft-light;pointer-events:none'});
   svg.append(top);
   svg.append(rect('#ffffff',{filter:'url(#noise)',opacity:'.45'}));
   document.body.replaceChildren(document.importNode(svg,true));
   const loaded=new XMLSerializer().serializeToString(document.querySelector('svg'));
   const image=new Image();
   const blob=new Blob([loaded],{type:'image/svg+xml'});
   const url=URL.createObjectURL(blob);
   try{
     await new Promise((ok,no)=>{image.onload=ok;image.onerror=no;image.src=url;});
     const canvas=document.createElement('canvas');
     canvas.width=1360;canvas.height=1000;
     canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
     let data=canvas.toDataURL('image/webp',.88);
     if(!data.startsWith('data:image/webp;base64,'))throw Error('WebP unsupported');
     return data;
   }finally{URL.revokeObjectURL(url);}
 },original);
 const bytes=Buffer.from(encoded.split(',')[1],'base64');
 await mkdir(dirname(DEST),{recursive:true});
 await writeFile(DEST,bytes);
 console.log('Europe atlas artwork:',bytes.length,'bytes,1360x1000, viewport 680x500');
}finally{await browser?.close();await new Promise(done=>server.close(done));}
