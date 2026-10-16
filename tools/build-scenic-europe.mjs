#!/usr/bin/env node
/** One illustrated Europe WebP. Geography is exclusively canonical SVG data;
 * imagegen supplies a decorative land material, never country boundaries. */
import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {FLAGS} from '../data/flags.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=await readFile(join(ROOT,'assets/maps/europe.svg'),'utf8');
const terrain='data:image/webp;base64,'+(await readFile(join(ROOT,'assets/maps/europe-terrain-v22.webp'))).toString('base64');
const local=process.env.SCENIC_CHROMIUM_PATH;
const browser=await chromium.launch({headless:true,...(local?{executablePath:local,ignoreDefaultArgs:['--enable-unsafe-swiftshader'],args:['--no-sandbox','--no-zygote','--disable-gpu','--disable-software-rasterizer','--in-process-gpu','--single-process','--disable-dev-shm-usage','--use-gl=disabled']}: {args:['--disable-dev-shm-usage']})});
try{
 const page=await browser.newPage();
 const result=await page.evaluate(async({source,terrain,records})=>{
  const W=2040,H=1500,scale=3,doc=new DOMParser().parseFromString(source,'image/svg+xml');
  document.body.append(document.importNode(doc.documentElement,true));
  const paths=[...document.querySelectorAll('path.country')],canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
  const image=new Image();image.src=terrain;await image.decode();ctx.drawImage(image,0,0,W,H);
  const pixels=ctx.getImageData(0,0,W,H),data=pixels.data;
  for(let i=0;i<data.length;i+=4){const shade=(data[i]*.3+data[i+1]*.59+data[i+2]*.11)/255;data[i]=32+shade*40;data[i+1]=146+shade*55;data[i+2]=184+shade*48;data[i+3]=255;}ctx.putImageData(pixels,0,0);
  ctx.scale(scale,scale);
  // Small painted wave marks belong to the common raster, not animated DOM.
  ctx.lineWidth=.75;ctx.strokeStyle='#ebfff37a';for(let y=9;y<500;y+=13)for(let x=7+(Math.floor(y/13)%2)*13;x<680;x+=31){ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+3,y+2,x+7,y);ctx.quadraticCurveTo(x+10,y-1,x+13,y);ctx.stroke();}
  const land=new Path2D();for(const path of paths)land.addPath(new Path2D(path.getAttribute('d')));
  ctx.save();ctx.clip(land);for(let y=0;y<500;y+=250)for(let x=0;x<680;x+=340)ctx.drawImage(image,x,y,340,250);ctx.restore();
  ctx.lineJoin='round';ctx.strokeStyle='#fff4cd';ctx.lineWidth=.9;ctx.stroke(land);
  // Labels are drawn at a constant readable CSS size by the one Canvas camera.
  for(const [id,[x,y]]of Object.entries({ad:[176,397],li:[263,342],mc:[251,384],sm:[298,389],va:[290,407],mt:[303,488]})){ctx.fillStyle='#fff1bd';ctx.beginPath();ctx.arc(x,y,1.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#45643a';ctx.beginPath();ctx.arc(x,y,.6,0,Math.PI*2);ctx.fill();}
  return canvas.toDataURL('image/webp',.92).split(',')[1];
 },{source,terrain,records:FLAGS});
 const bytes=Buffer.from(result,'base64');await writeFile(join(ROOT,'assets/maps/europe-scenic.webp'),bytes);console.log(`Illustrated Europe: ${bytes.length} bytes; 2040×1500; canonical 680×500 geometry.`);
}finally{await browser.close();}
