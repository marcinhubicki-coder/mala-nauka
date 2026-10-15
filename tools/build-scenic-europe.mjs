#!/usr/bin/env node
/** ONE antique Europe raster, derived from the canonical 680×500 SVG.
 * Texture and engraved shading are decorative; no geographic path is redrawn.
 * Every country border and runtime highlight use identical source coordinates.
 */
import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {FLAGS} from '../data/flags.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const original=await readFile(join(ROOT,'assets/maps/europe.svg'),'utf8');
const paper='data:image/webp;base64,'+(await readFile(join(ROOT,'assets/flags/adventure/scenic-paper-v10.webp'))).toString('base64');
const pigment='data:image/webp;base64,'+(await readFile(join(ROOT,'assets/maps/europe-pigment-v11.webp'))).toString('base64');
const server=createServer((req,res)=>res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>Antique Europe</title>'));
server.listen(0,'127.0.0.1');await once(server,'listening');let browser;
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:2040,height:1500}});await page.goto('http://127.0.0.1:'+server.address().port);
 const encoded=await page.evaluate(async({source,paper,pigment,records})=>{
  const doc=new DOMParser().parseFromString(source,'image/svg+xml'),svg=doc.documentElement,ns='http://www.w3.org/2000/svg';
  svg.setAttribute('width','2040');svg.setAttribute('height','1500');
  const defs=doc.createElementNS(ns,'defs');defs.innerHTML=`
   <linearGradient id="sea" x2=".7" y2="1"><stop stop-color="#e6d9b6"/><stop offset=".55" stop-color="#d7c79f"/><stop offset="1" stop-color="#c3b78c"/></linearGradient>
   <radialGradient id="land-wash"><stop stop-color="#eee2c1"/><stop offset=".65" stop-color="#e5d6b1"/><stop offset="1" stop-color="#d6c49e"/></radialGradient>
   <pattern id="sea-engraving" width="24" height="16" patternUnits="userSpaceOnUse"><path d="M2 6q4-1.4 8 0t8 0 M10 13q3-1 6 0" fill="none" stroke="#7e7054" stroke-width=".28" opacity=".25"/></pattern>
   <pattern id="etched-land" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><path d="M0 0v2M3 4v1" stroke="#7a5b35" stroke-width=".25" opacity=".12"/></pattern>
   <filter id="coast"><feDropShadow dx=".6" dy="1.3" stdDeviation="1.5" flood-color="#795e34" flood-opacity=".24"/></filter>
   <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="3" seed="14"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".17"/></feComponentTransfer></filter>
   <radialGradient id="stain"><stop stop-color="#806035" stop-opacity=".13"/><stop offset="1" stop-color="#806035" stop-opacity="0"/></radialGradient>`;
  svg.prepend(defs);
  const rect=(fill,attrs={})=>{const e=doc.createElementNS(ns,'rect');for(const [k,v] of Object.entries({x:0,y:0,width:680,height:500,fill,...attrs}))e.setAttribute(k,v);return e;};
  const countries=svg.querySelector('#countries'),paths=[...countries.querySelectorAll('path')];
  countries.before(rect('url(#sea)'),rect('url(#sea-engraving)'));
  countries.setAttribute('filter','url(#coast)');countries.removeAttribute('stroke');countries.removeAttribute('fill');
  for(const path of paths){
   path.setAttribute('fill','url(#land-wash)');path.setAttribute('stroke','#896b44');path.setAttribute('stroke-opacity','.7');path.setAttribute('stroke-width','.48');path.setAttribute('stroke-dasharray','1.4 .65');
  }
  const clip=doc.createElementNS(ns,'clipPath');clip.id='land';for(const p of paths){const c=p.cloneNode(true);c.removeAttribute('id');c.removeAttribute('stroke');clip.append(c);}defs.append(clip);
  const wash=doc.createElementNS(ns,'image');for(const [k,v] of Object.entries({href:pigment,x:0,y:0,width:680,height:500,'preserveAspectRatio':'none','clip-path':'url(#land)',style:'mix-blend-mode:multiply',opacity:'.40'}))wash.setAttribute(k,v);svg.append(wash);
  svg.append(rect('url(#etched-land)',{'clip-path':'url(#land)'}));
  const material=doc.createElementNS(ns,'image');for(const [k,v] of Object.entries({href:paper,x:-220,y:-180,width:1120,height:900,'preserveAspectRatio':'none','style':'mix-blend-mode:multiply',opacity:'.20'}))material.setAttribute(k,v);svg.append(material);
  // Small irregular sepia washes supply depth without introducing false relief.
  for(const [x,y,w,h] of [[155,340,90,120],[310,370,110,60],[420,190,120,75],[300,150,70,160],[525,350,90,110]]){
   const stain=doc.createElementNS(ns,'ellipse');for(const [k,v] of Object.entries({cx:x,cy:y,rx:w,ry:h,fill:'url(#stain)','clip-path':'url(#land)'}))stain.setAttribute(k,v);svg.append(stain);
  }
  svg.append(rect('#705635',{filter:'url(#grain)',opacity:'.48'}));
  // Names are baked once into this same raster. No extra country map assets.
  document.body.replaceChildren(document.importNode(svg,true));
  const mounted=document.querySelector('svg'),names=new Map(records.map(r=>[r.id,r.country])),taken=[];
  const sorted=[...mounted.querySelectorAll('path.country')].map(p=>({p,b:p.getBBox()})).sort((a,b)=>b.b.width*b.b.height-a.b.width*a.b.height);
  const fixed={ru:[505,160],no:[278,126],se:[315,162],fi:[382,113],gb:[152,251],fr:[203,348],it:[290,385],hr:[322,365],gr:[368,459],ua:[435,287]};
  for(const {p,b} of sorted){
   const id=p.dataset.country,text=names.get(id);if(!text)continue;
   let x=b.x+b.width/2,y=b.y+b.height/2;
   if(fixed[id]){[x,y]=fixed[id];}else if(!p.isPointInFill(new DOMPoint(x,y))){let best=Infinity;for(let ix=0;ix<9;ix++)for(let iy=0;iy<9;iy++){const nx=b.x+b.width*(ix+.5)/9,ny=b.y+b.height*(iy+.5)/9,d=(nx-x)**2+(ny-y)**2;if(d<best&&p.isPointInFill(new DOMPoint(nx,ny))){best=d;x=nx;y=ny;}}}
   const size=b.width>90?7:b.width>40?6:4.7;
   const node=document.createElementNS(ns,'text');for(const [k,v] of Object.entries({x,y,fill:'#634a2c','font-family':'Georgia,serif','font-size':size,'font-weight':'600','text-anchor':'middle','paint-order':'stroke',stroke:'#f1e4c5','stroke-width':'.8','stroke-linejoin':'round'}))node.setAttribute(k,v);node.textContent=text;mounted.append(node);
   taken.push(id);
  }
  for(const [id,points] of Object.entries({ru:[[438,222],[504,307]],se:[[315,210]]}))for(const [x,y] of points){
   const path=mounted.querySelector('[data-country="'+id+'"]');if(!path?.isPointInFill(new DOMPoint(x,y)))continue;
   const label=document.createElementNS(ns,'text');for(const [k,v] of Object.entries({x,y,fill:'#634a2c','font-family':'Georgia,serif','font-size':'6','font-weight':'600','text-anchor':'middle','paint-order':'stroke',stroke:'#f1e4c5','stroke-width':'.8'}))label.setAttribute(k,v);label.textContent=names.get(id);mounted.append(label);
  }
  const micros={ad:[176,397],li:[263,342],mc:[251,384],sm:[298,389],va:[290,407],mt:[303,488]};
  for(const [id,[x,y]] of Object.entries(micros)){
   const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.setAttribute('r','.85');dot.setAttribute('fill','#76512a');mounted.append(dot);
   if(taken.includes(id))continue;
   const text=document.createElementNS(ns,'text');for(const [k,v] of Object.entries({x:x+3,y:y+2,fill:'#725636','font-family':'Georgia,serif','font-size':'3.7','paint-order':'stroke',stroke:'#eee0bb','stroke-width':'.65'}))text.setAttribute(k,v);text.textContent=names.get(id);mounted.append(text);
  }
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(mounted)],{type:'image/svg+xml'}));
  try{const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas');c.width=2040;c.height=1500;c.getContext('2d').drawImage(img,0,0);return c.toDataURL('image/webp',.92);}finally{URL.revokeObjectURL(url);}
 },{source:original,paper,pigment,records:FLAGS});
 const bytes=Buffer.from(encoded.split(',')[1],'base64');await writeFile(join(ROOT,'assets/maps/europe-scenic.webp'),bytes);console.log('Antique Europe: '+bytes.length+' bytes, 2040×1500, exact 680×500 registration; baked country names.');
}finally{await browser?.close();await new Promise(done=>server.close(done));}
