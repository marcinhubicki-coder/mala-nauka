/* Scenic Europe proof of concept: one prebaked map, one highlighted SVG country.
   All coordinates are registered to Natural Earth's 680 × 500 viewBox. */
const EUROPE_IMAGE=new URL('assets/maps/europe-scenic.webp',document.baseURI).href;
let imagePromise;
function loadImage(){
 if(!imagePromise){
  imagePromise=new Promise((resolve,reject)=>{
   const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=EUROPE_IMAGE;
  }).catch(error=>{imagePromise=null;throw error});
 }
 return imagePromise;
}
const boxOf=element=>{try{const b=element.getBBox();return {x:b.x,y:b.y,w:b.width,h:b.height,cx:b.x+b.width/2,cy:b.y+b.height/2}}catch{return null}};
const intersect=(a,b)=>a.x < b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
function cropNear(svg,selected,mapWidth,mapHeight){
 const original=svg.viewBox.baseVal,box=boxOf(selected);
 if(!box)return null;
 const base={x:original.x,y:original.y,w:original.width,h:original.height};
 const ratio=Math.max(.82,Math.min(1.65,(mapWidth||320)/(mapHeight||300)));
 const peers=[...svg.querySelectorAll('.country')].filter(x=>x!==selected).map(boxOf).filter(Boolean);
 const centerX=box.cx,centerY=box.cy;
 let chosen=null,best=Infinity;
 for(let width=142;width<=440;width+=6){
  width=Math.max(width,box.w*1.66,box.h*ratio*1.6);
  const height=width/ratio;
  if(width>base.w||height>base.h)break;
  const x=Math.max(base.x,Math.min(base.x+base.w-width,centerX-width/2));
  const y=Math.max(base.y,Math.min(base.y+base.h-height,centerY-height/2));
  const frame={x,y,w:width,h:height};
  const visible=peers.filter(p=>intersect(frame,p)).length;
  // Smallest sensible crop containing roughly six to ten neighbours.
  const missing=Math.max(0,6-visible),extra=Math.max(0,visible-11);
  const score=missing*14+extra*9+Math.abs(visible-9)*1.6+width*.016;
  if(score<best){best=score;chosen={...frame,visible};}
  if(visible>=9&&visible<=11)break;
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
 const crop=cropNear(svg,active,node.clientWidth,node.clientHeight);
 if(crop){
  svg.setAttribute('viewBox',[crop.x,crop.y,crop.w,crop.h].map(x=>+x.toFixed(2)).join(' '));
  svg.dataset.scenicZoom='true';
  svg.dataset.visibleNeighbors=String(crop.visible);
 }
 try{
  await loadImage();
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
  const halo=active.cloneNode(true);
  halo.removeAttribute('id');
  halo.removeAttribute('data-country');
  halo.setAttribute('aria-hidden','true');
  halo.setAttribute('class','scenic-country-halo');
  active.before(halo);
  active.classList.add('scenic-country-overlay');
  node.dataset.mapImage='ready';
 }catch(e){
  // Still usable offline before raster has been installed: native vector atlas.
  node.dataset.mapImage='vector-fallback';
 }
 node.dataset.countryId=record.id;
 return {found:true,svg,active,crop,bitmap:node.dataset.mapImage==='ready'};
}
