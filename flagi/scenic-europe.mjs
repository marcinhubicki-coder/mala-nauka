/* Scenic Europe proof of concept: one prebaked map, one highlighted SVG country.
   All coordinates are registered to Natural Earth's 680 × 500 viewBox. */
const EUROPE_IMAGE=new URL('assets/maps/europe-scenic.webp',document.baseURI).href;
import {FLAGS} from '../data/flags.mjs';
import {SCENIC} from './scenic-config.mjs';
const records=new Map(FLAGS.map(r=>[r.id,r]));
let imagePromise;
function loadImage(){
 if(!imagePromise){
  imagePromise=new Promise((resolve,reject)=>{
   const image=new Image(),timer=setTimeout(()=>{image.src='';reject(new Error('Map bitmap timeout'));},SCENIC.mapTimeoutMs);
   image.onload=()=>{clearTimeout(timer);resolve(image)};image.onerror=()=>{clearTimeout(timer);reject(new Error('Map bitmap unavailable'))};image.src=EUROPE_IMAGE;
  }).catch(error=>{imagePromise=null;throw error});
 }
 return imagePromise;
}
export function preloadScenicEurope(){return Promise.all([loadImage(),window.MalaNaukaContinentMap?.preload('europe')]);}
const boxOf=element=>{try{const b=element.getBBox();return {x:b.x,y:b.y,w:b.width,h:b.height,cx:b.x+b.width/2,cy:b.y+b.height/2}}catch{return null}};
// Count genuinely visible neighbours, not countries grazing a crop's edge.
const visibleFraction=(a,b)=>{
 const w=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
 const h=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 return a.w>0&&a.h>0?Math.min(1,(w*h)/(b.w*b.h)):0;
};
const neighboring=(frame,country)=>visibleFraction(frame,country)>.22 ||
 (country.cx>frame.x&&country.cx<frame.x+frame.w&&country.cy>frame.y&&country.cy<frame.y+frame.h);
function cropNear(svg,selected,mapWidth,mapHeight){
 const original=svg.viewBox.baseVal,box=boxOf(selected);
 if(!box)return null;
 const base={x:original.x,y:original.y,w:original.width,h:original.height};
 const ratio=Math.max(.65,(mapWidth||320)/(mapHeight||300));
 const peers=[...svg.querySelectorAll('.country')].filter(x=>x!==selected).map(boxOf).filter(Boolean);
 const centerX=box.cx,centerY=box.cy;
 let chosen=null,best=Infinity;
 const minimum=Math.max(160,box.w*1.8,box.h*ratio*1.2);
 for(let width=minimum;width<=460;width+=6){
  const height=width/ratio;
  if(width>base.w||height>base.h)break;
  for(const dx of [0,-.09,.09,-.18,.18])for(const dy of [0,-.12,.12]){
   const x=Math.max(base.x,Math.min(base.x+base.w-width,centerX-width/2+dx*width));
   const y=Math.max(base.y,Math.min(base.y+base.h-height,centerY-height/2+dy*height));
   // Keep the complete country and breathing room. Slightly shifting the
   // camera can avoid a crowded Balkan/Benelux corner without excessive zoom.
   if(box.x<x+width*.08||box.x+box.w>x+width*.92||box.y<y+height*.08||box.y+box.h>y+height*.92)continue;
   const frame={x,y,w:width,h:height},visible=peers.filter(p=>neighboring(frame,p)).length;
   const missing=Math.max(0,6-visible),extra=Math.max(0,visible-10);
   const score=missing*14+extra*9+Math.abs(visible-8)*1.6+width*.016+(Math.abs(dx)+Math.abs(dy))*4;
   if(score<best){best=score;chosen={...frame,visible};}
  }
  if(chosen?.visible>=7&&chosen.visible<=10)break;
 }
 if(!chosen){
  const w=Math.min(base.w,Math.max(200,box.w*2.2)),h=Math.min(base.h,w/ratio);
  chosen={x:Math.max(base.x,Math.min(base.x+base.w-w,centerX-w/2)),y:Math.max(base.y,Math.min(base.y+base.h-h,centerY-h/2)),w,h,visible:0};
 }
 return chosen;
}
const n='http://www.w3.org/2000/svg';
export async function mountScenicEurope(node,{record,language='pl'}={}){
 if(!node||!record)return {found:false,reason:'missing'};
 const map=window.MalaNaukaContinentMap;
 const countryName=language==='en'?record.countryEn:record.country;
 const result=await map?.mount(node,{countryId:record.id,continent:'europe',countryName,language,interactive:false,showCopy:false});
 if(!result?.found||!result.svg||!result.active)return {found:false,reason:'unsupported-country'};
 const {svg,active}=result;
 if(result.fallbackMarker){active.setAttribute('r','2.1');node.dataset.microstate='marker';}
 const crop=cropNear(svg,active,node.clientWidth,node.clientHeight);
 const labels=[...svg.querySelectorAll('.country')].map(country=>({id:country.dataset.country,box:boxOf(country),shape:country})).filter(p=>p.box&&records.has(p.id));
 if(crop)for(const item of labels){
  const b=item.box,inside=(x,y)=>{try{return item.shape.isPointInFill(new DOMPoint(x,y));}catch{return true;}};
  if(b.cx>crop.x&&b.cx<crop.x+crop.w&&b.cy>crop.y&&b.cy<crop.y+crop.h&&inside(b.cx,b.cy)){item.point={x:b.cx,y:b.cy};continue;}
  const left=Math.max(crop.x,b.x),top=Math.max(crop.y,b.y),w=Math.min(crop.x+crop.w,b.x+b.w)-left,h=Math.min(crop.y+crop.h,b.y+b.h)-top;
  let distance=Infinity;
  if(w>0&&h>0)for(let ix=0;ix<7;ix++)for(let iy=0;iy<7;iy++){
   const x=left+w*(ix+.5)/7,y=top+h*(iy+.5)/7,d=(x-left-w/2)**2+(y-top-h/2)**2;
   if(d<distance&&inside(x,y)){distance=d;item.point={x,y};}
  }
 }
 if(crop){
  svg.setAttribute('viewBox',[crop.x,crop.y,crop.w,crop.h].map(x=>+x.toFixed(2)).join(' '));
  svg.dataset.scenicZoom='true';
  svg.dataset.visibleNeighbors=String(crop.visible);
  svg.setAttribute('preserveAspectRatio','none');
 }
 const halo=active.cloneNode(true);
 halo.removeAttribute('id');halo.removeAttribute('data-country');halo.setAttribute('aria-hidden','true');halo.setAttribute('class','scenic-country-halo');
 active.before(halo);active.classList.add('scenic-country-overlay');
 let decodedImage;
 try{
  decodedImage=await loadImage();
  if(!node.isConnected)return {found:false,reason:'detached'};
  const image=document.createElementNS(n,'image');
  image.setAttribute('href',EUROPE_IMAGE);
  image.setAttribute('x','0');image.setAttribute('y','0');
  image.setAttribute('width','680');image.setAttribute('height','500');
  image.setAttribute('preserveAspectRatio','none');
  image.classList.add('scenic-europe-raster');
  const group=svg.querySelector('#countries')||active.parentNode;
  svg.insertBefore(image,group);
  // Keep ONLY the active SVG country, so 190+ static borders are supplied by WebP.
  for(const country of [...svg.querySelectorAll('.country')]){
   if(country!==active)country.remove();
  }

  node.dataset.mapImage='ready';
 }catch(e){
  // Still usable offline before raster has been installed: native vector atlas.
  node.dataset.mapImage='vector-fallback';
 }
 node.dataset.countryId=record.id;
 if(crop){
  const layer=document.createElement('div');layer.className='scenic-map-labels';
  if(decodedImage)layer.hidden=true; // Country names are already engraved in the shared bitmap.
  const accepted=[];
  const candidates=labels.filter(p=>p.id===record.id||neighboring(crop,p.box)).sort((a,b)=>Number(b.id===record.id)-Number(a.id===record.id)||b.box.w*b.box.h-a.box.w*a.box.h);
  for(const item of candidates){
   if(!item.point)continue;
   const x=(item.point.x-crop.x)/crop.w*node.clientWidth,y=(item.point.y-crop.y)/crop.h*node.clientHeight+(result.fallbackMarker&&item.id===record.id?13:0);
   const text=language==='en'?records.get(item.id).countryEn:records.get(item.id).country;
   const half=Math.min(47,text.length*2.8);
   if(x<half+3||x>node.clientWidth-half-3||y<10||y>node.clientHeight-10)continue;
   if(accepted.some(p=>Math.abs(p.x-x)<p.half+half+4&&Math.abs(p.y-y)<15))continue;
   const label=document.createElement('span');label.className='scenic-map-label'+(item.id===record.id?' is-selected':'');label.textContent=text;
   label.style.left=(x/node.clientWidth*100)+'%';label.style.top=(y/node.clientHeight*100)+'%';layer.append(label);
   accepted.push({x,y,half});if(accepted.length>=9)break;
  }
  node.append(layer);node.dataset.labelCount=String(accepted.length);
 }
 return {found:true,svg,active,crop,image:decodedImage,bitmap:node.dataset.mapImage==='ready',microstate:!!result.fallbackMarker};
}
