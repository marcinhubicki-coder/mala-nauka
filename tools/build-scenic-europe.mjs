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
const pigment='data:image/webp;base64,'+(await readFile(join(ROOT,'assets/maps/europe-pigment-v11.webp'))).toString('base64');
const server=createServer((req,res)=>res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>Antique Europe</title>'));
server.listen(0,'127.0.0.1');await once(server,'listening');let browser;
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:2040,height:1500}});await page.goto('http://127.0.0.1:'+server.address().port);
 const encoded=await page.evaluate(async({source,pigment,records})=>{
  const doc=new DOMParser().parseFromString(source,'image/svg+xml'),svg=doc.documentElement,ns='http://www.w3.org/2000/svg';
  svg.setAttribute('width','2040');svg.setAttribute('height','1500');
  const defs=doc.createElementNS(ns,'defs');defs.innerHTML=`
   <pattern id="etched-land" width="9" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(32)"><path d="M0 0v3M3 5v1.5M7 8v2" stroke="#715532" stroke-width=".3" opacity=".22"/></pattern>`;
  svg.prepend(defs);
  const rect=(fill,attrs={})=>{const e=doc.createElementNS(ns,'rect');for(const [k,v] of Object.entries({x:0,y:0,width:680,height:500,fill,...attrs}))e.setAttribute(k,v);return e;};
  const countries=svg.querySelector('#countries'),paths=[...countries.querySelectorAll('path')];
  countries.removeAttribute('stroke');countries.removeAttribute('fill');
  const palette=['#b9b88d','#cdb487','#b7bd9c','#d4b69d','#c2ba97','#c5c19b','#d2bd8d'];
  for(const [i,path] of paths.entries()){
   const wash=doc.createElementNS(ns,'radialGradient');wash.id='country-wash-'+i;wash.setAttribute('cx','.38');wash.setAttribute('cy','.32');wash.setAttribute('r','.8');wash.innerHTML=`<stop stop-color="${palette[i%palette.length]}" stop-opacity=".26"/><stop offset=".68" stop-color="${palette[i%palette.length]}" stop-opacity=".48"/><stop offset="1" stop-color="#947644" stop-opacity=".63"/>`;defs.append(wash);
   path.setAttribute('fill','url(#country-wash-'+i+')');path.setAttribute('stroke','#82633d');path.setAttribute('stroke-opacity','.78');path.setAttribute('stroke-width','.52');path.setAttribute('stroke-dasharray','1.5 .55');
  }
  const clip=doc.createElementNS(ns,'clipPath');clip.id='land';for(const p of paths){const c=p.cloneNode(true);c.removeAttribute('id');c.removeAttribute('stroke');clip.append(c);}defs.append(clip);
  const wash=doc.createElementNS(ns,'image');for(const [k,v] of Object.entries({href:pigment,x:0,y:0,width:680,height:500,'preserveAspectRatio':'none','clip-path':'url(#land)',style:'mix-blend-mode:multiply',opacity:'.30'}))wash.setAttribute(k,v);svg.append(wash);
  svg.append(rect('url(#etched-land)',{'clip-path':'url(#land)'}));
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
  try{const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas');c.width=2040;c.height=1500;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const frame=ctx.getImageData(0,0,c.width,c.height),px=frame.data;
    const hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n>>>0)/4294967295;};
    const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);return (hash(ix,iy)*(1-sx)+hash(ix+1,iy)*sx)*(1-sy)+(hash(ix,iy+1)*(1-sx)+hash(ix+1,iy+1)*sx)*sy;};
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
     const k=(y*c.width+x)*4,luma=px[k]*.3+px[k+1]*.59+px[k+2]*.11;
     // Keep engraved borders and lettering. The light wash has real paper holes.
     if(luma<145)continue;
     const grain=noise(x*.055,y*.17)*.65+noise(x*.22+73,y*.31+29)*.35;
     if(grain>.62&&luma>178)px[k+3]=0;
     else px[k+3]=Math.round(px[k+3]*(.40+(1-grain)*.65));
    }
    ctx.putImageData(frame,0,0);return c.toDataURL('image/webp',.94);}finally{URL.revokeObjectURL(url);}
 },{source:original,pigment,records:FLAGS});
 const bytes=Buffer.from(encoded.split(',')[1],'base64');await writeFile(join(ROOT,'assets/maps/europe-scenic.webp'),bytes);console.log('Antique Europe: '+bytes.length+' bytes, 2040×1500, transparent sea and dry ink wash; exact 680×500 registration; baked country names.');
}finally{await browser?.close();await new Promise(done=>server.close(done));}
