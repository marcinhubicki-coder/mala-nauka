/* Scenic Europe proof of concept: one prebaked map, one highlighted SVG country.
   All coordinates are registered to Natural Earth's 680 × 500 viewBox. */
const EUROPE_IMAGE=new URL('assets/maps/europe-painted-v27.webp',document.baseURI).href;
import {registerAtlasImage} from './scenic-registration.mjs?v=31';
import {FLAGS} from '../data/flags.mjs';
import {SCENIC} from './scenic-config.mjs?v=31';
import {nearAtlasFrame,fullAtlasFrame,clockwiseNeighbors} from './scenic-camera.mjs?v=31';
const records=new Map(FLAGS.map(r=>[r.id,r]));
let imagePromise;
let geographyPromise;
const flagImages=new Map();
async function loadGeography(){
 if(!geographyPromise)geographyPromise=Promise.all(['json','svg'].map(async ext=>{const response=await fetch(new URL('assets/maps/europe-atlas-v26.'+ext,document.baseURI));if(!response.ok)throw Error('Atlas geometry unavailable');return ext==='json'?response.json():response.text();})).catch(error=>{geographyPromise=null;throw error});
 return geographyPromise;
}
function loadFlag(id){
 if(!records.has(id))return Promise.resolve(null);
 if(!flagImages.has(id))flagImages.set(id,new Promise(resolve=>{
  const img=new Image();let finished=false;
  const done=value=>{if(finished)return;finished=true;clearTimeout(timer);img.onload=img.onerror=null;if(!value)flagImages.delete(id);resolve(value);};
  const timer=setTimeout(()=>done(null),1600);
  img.onload=()=>done(img);img.onerror=()=>done(null);img.src=new URL(records.get(id).flagSvg,document.baseURI).href;
 }));
 return flagImages.get(id);
}
function loadImage(){
 if(!imagePromise){
  imagePromise=new Promise((resolve,reject)=>{
   const image=new Image(),timer=setTimeout(()=>{image.src='';reject(new Error('Map bitmap timeout'));},SCENIC.mapTimeoutMs);
   image.onload=()=>{clearTimeout(timer);resolve(image)};image.onerror=()=>{clearTimeout(timer);reject(new Error('Map bitmap unavailable'))};image.src=EUROPE_IMAGE;
  }).then(async image=>{try{const response=await fetch(new URL('assets/maps/europe-iberia-registration-v28.json',document.baseURI));if(!response.ok)throw Error('registration');return registerAtlasImage(image,await response.json());}catch{return image;}}).catch(error=>{imagePromise=null;throw error});
 }
 return imagePromise;
}
export function preloadScenicEurope(){return Promise.all([loadImage(),loadGeography()]);}
const boxOf=element=>{try{const b=element.getBBox();return {x:b.x,y:b.y,w:b.width,h:b.height,cx:b.x+b.width/2,cy:b.y+b.height/2}}catch{return null}};
// Count genuinely visible neighbours, not countries grazing a crop's edge.
const visibleFraction=(a,b)=>{
 const w=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
 const h=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 return a.w>0&&a.h>0?Math.min(1,(w*h)/(b.w*b.h)):0;
};
const neighboring=(frame,country)=>visibleFraction(frame,country)>.22 ||
 (country.cx>frame.x&&country.cx<frame.x+frame.w&&country.cy>frame.y&&country.cy<frame.y+frame.h);
const n='http://www.w3.org/2000/svg';
export async function mountScenicEurope(node,{record,language='pl'}={}){
 if(!node||!record)return {found:false,reason:'missing'};
 const countryName=language==='en'?record.countryEn:record.country;
 let metadata,source;
 try{[metadata,source]=await loadGeography();}catch{return {found:false,reason:'geometry-unavailable'};}
 if(!node.isConnected)return {found:false,reason:'detached'};
 node.className='continent-map-host no-copy';node.setAttribute('aria-label','Położenie kraju '+countryName+' na mapie Europy');
 const host=document.createElement('div');host.className='continent-map-canvas';host.innerHTML=source;node.replaceChildren(host);
 const svg=host.querySelector('svg'),active=svg.querySelector('[data-country="'+record.id+'"]');
 if(!active)return {found:false,reason:'unsupported-country'};
 const featureById=new Map(metadata.features.map(f=>[f.id,f])),selectedFeature=featureById.get(record.id);
 const geometry=[...svg.querySelectorAll('.country')].map(n=>({id:n.dataset.country,path:n.getAttribute('d'),box:boxOf(n)}));
 const result={svg,active,fallbackMarker:selectedFeature.box.w*selectedFeature.box.h<5};
 if(result.fallbackMarker)node.dataset.microstate='marker';
 const mapRect=node.getBoundingClientRect();
 const crop=nearAtlasFrame(selectedFeature.box,node.clientWidth,node.clientHeight);
 crop.visible=geometry.filter(p=>p.id!==record.id&&neighboring(crop,p.box)).length;
 const labels=[...svg.querySelectorAll('.country')].map(country=>({id:country.dataset.country,box:boxOf(country),shape:country,feature:featureById.get(country.dataset.country)})).filter(p=>p.box&&records.has(p.id));
 const hit=document.createElement('canvas').getContext('2d');
 if(crop)for(const item of labels){
  const path=item.shape.getAttribute('d'),shape=path?new Path2D(path):null;
  const b=item.box,inside=(x,y)=>shape?hit.isPointInPath(shape,x,y):true;
  const anchor=item.feature.point;
  if(anchor&&inside(...anchor)){item.point={x:anchor[0],y:anchor[1]};continue;}
  if(inside(b.cx,b.cy)){item.point={x:b.cx,y:b.cy};continue;}
  const left=b.x,top=b.y,w=b.w,h=b.h;
  let distance=Infinity;
  if(w>0&&h>0)for(let ix=0;ix<7;ix++)for(let iy=0;iy<7;iy++){
   const x=left+w*(ix+.5)/7,y=top+h*(iy+.5)/7,d=(x-left-w/2)**2+(y-top-h/2)**2;
   if(d<distance&&inside(x,y)){distance=d;item.point={x,y};}
  }
 }
 // Store a second truthful anchor inside the near frame's readable area.
 // Big countries otherwise keep their global center outside a low phone crop.
 hit.font='800 11px ScenicBody';
 if(crop)for(const item of labels){
  const half=hit.measureText(records.get(item.id).country).width/2;
  const left=Math.max(item.box.x,crop.x+(half+22)/mapRect.width*crop.w),right=Math.min(item.box.x+item.box.w,crop.x+crop.w-(half+22)/mapRect.width*crop.w);
  const top=Math.max(item.box.y,crop.y+24/mapRect.height*crop.h),bottom=Math.min(item.box.y+item.box.h,crop.y+crop.h-26/mapRect.height*crop.h);
  const path=item.shape.getAttribute('d');if(!path||right<=left||bottom<=top)continue;const shape=new Path2D(path);let best=Infinity;
  for(let ix=0;ix<11;ix++)for(let iy=0;iy<11;iy++){const x=left+(right-left)*(ix+.5)/11,y=top+(bottom-top)*(iy+.5)/11,d=(x-(left+right)/2)**2+(y-(top+bottom)/2)**2;if(d<best&&hit.isPointInPath(shape,x,y)){best=d;item.nearPoint={x,y};}}
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
  // Canvas retains the complete canonical geometry for every border; only the
  // active SVG country remains in the DOM for the selected-country contract.
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
  if(decodedImage)layer.hidden=true; // The Canvas camera paints bounded, readable labels.
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

 const visibleLabels=labels.filter(item=>selectedFeature.neighbors.length?selectedFeature.neighbors.includes(item.id):neighboring(crop,item.box));
 const flags=Object.fromEntries(await Promise.all(visibleLabels.map(async item=>[item.id,await loadFlag(item.id)])));
 return {found:true,svg,active,crop,fullCrop:fullAtlasFrame(mapRect.width,mapRect.height,selectedFeature.box),geometry,neighbors:clockwiseNeighbors(selectedFeature,metadata.features,geometry),capital:selectedFeature.capital,flags,labels:labels.map(item=>({id:item.id,name:language==='en'?records.get(item.id).countryEn:records.get(item.id).country,point:item.point,nearPoint:item.nearPoint,box:item.box})),image:decodedImage,bitmap:node.dataset.mapImage==='ready',microstate:!!result.fallbackMarker};
}
