import {calibratedFrames,effectiveMapOverrides} from '../shared/map-overrides.mjs';
// Europe is a camera on the continuous atlas, rather than a separate drawing.
import {FLAGS} from '../data/flags.mjs';
import {loadWorldAtlas} from './scenic-world-v39.mjs?v=39';
import {clockwiseNeighbors,readableAtlasFrames} from './scenic-camera.mjs?v=39';
const records=new Map(FLAGS.map(r=>[r.id,r])),flags=new Map();
const ns='http://www.w3.org/2000/svg';
function flag(id){
 if(!records.has(id))return Promise.resolve(null);
 if(!flags.has(id))flags.set(id,(async()=>{const img=new Image();img.src=new URL(records.get(id).flagSvg,document.baseURI).href;await img.decode();const c=document.createElement('canvas');c.width=32;c.height=Math.max(12,Math.round(32*img.naturalHeight/img.naturalWidth));c.getContext('2d').drawImage(img,0,0,c.width,c.height);const image=await createImageBitmap(c);return {image,naturalWidth:image.width,naturalHeight:image.height};})());
 const job=flags.get(id);flags.delete(id);flags.set(id,job);
 while(flags.size>32){const [key,old]=flags.entries().next().value;flags.delete(key);old.then(f=>f.image.close(),()=>{});}
 job.catch(()=>{if(flags.get(id)===job)flags.delete(id)});return job;
}
function context(atlas,record){
 const selected=atlas.features.find(f=>f.id===record.id);if(!selected)throw Error('Country missing from atlas: '+record.id);
 const region=record.id==='ru'?'eurasia':({'north-america':'northAmerica','south-america':'southAmerica'}[record.continent]||record.continent),bounds=atlas.continents[region]||atlas.continents.europe;
 return {selected,bounds,region};
}
function neighborIds(atlas,record,selected,bounds){
 const regional=selected.neighbors.filter(id=>{if(record.id==='ru')return true;const b=atlas.features.find(f=>f.id===id)?.bounds;return b&&b.x<bounds.x+bounds.w&&b.x+b.w>bounds.x&&b.y<bounds.y+bounds.h&&b.y+b.h>bounds.y;});
 return clockwiseNeighbors({...selected,neighbors:regional},atlas.features,atlas.features).filter(id=>records.has(id));
}
export async function scenicNeighborIds(record){const atlas=await loadWorldAtlas(),{selected,bounds}=context(atlas,record);return neighborIds(atlas,record,selected,bounds);}
export async function preloadScenicEurope(record,{width=330,height=300,headerTop=85,prefetch=false}={}){
 const atlas=await loadWorldAtlas();if(!record)return atlas;
 const {selected,bounds}=context(atlas,record),automatic=readableAtlasFrames(selected.focusBox||selected.box,width,height,Math.min(height*.45,100),bounds,record.id==='ru'?selected.bounds:null),frames=calibratedFrames(automatic,record.id,bounds,effectiveMapOverrides(globalThis.__MALA_NAUKA_DESIGN__));
 await Promise.all([atlas.tiles[prefetch?'prefetch':'prepare']([frames.near,frames.full],width),...selected.neighbors.filter(id=>records.has(id)).map(flag)]);
 return atlas.tiles.stats();
}
export async function mountScenicEurope(node,{record,language='pl'}={}){
 let atlas;try{atlas=await loadWorldAtlas()}catch{return {found:false,reason:'geometry-unavailable'}}
 if(!node.isConnected)return {found:false,reason:'detached'};
 const {selected,bounds,region}=context(atlas,record);
 node.className='continent-map-host no-copy';node.dataset.countryId=record.id;node.dataset.mapImage='registered-world';node.setAttribute('aria-label',(language==='pl'?'Położenie kraju ':'Location of ')+(language==='pl'?record.country:record.countryEn));
 const host=document.createElement('div');host.className='continent-map-canvas';const svg=document.createElementNS(ns,'svg'),active=document.createElementNS(ns,'path');
 svg.setAttribute('viewBox','0 0 680 500');active.setAttribute('d',selected.path);active.setAttribute('class','country scenic-country-overlay');active.dataset.country=record.id;svg.append(active);host.append(svg);node.replaceChildren(host);
 const neighbors=neighborIds(atlas,record,selected,bounds),images=Object.fromEntries(await Promise.all([record.id,...neighbors].map(async id=>[id,await flag(id)])));
 return {found:true,svg,active,continent:record.continent,focusBox:selected.focusBox||selected.box,wholeCountry:record.id==='ru'?selected.bounds:null,bounds,continents:atlas.continents,geometry:atlas.shapes,neighbors,worldNeighbors:selected.neighbors,capital:selected.capital,flags:images,labels:atlas.features.filter(f=>records.has(f.id)).map(f=>({id:f.id,continent:records.get(f.id).continent,name:language==='pl'?records.get(f.id).country:records.get(f.id).countryEn,point:{x:f.point[0],y:f.point[1]},box:f.box})),paintBase:atlas.paint,prepareFrames:(frames,width)=>atlas.tiles.prepare(frames,width),tileStats:()=>atlas.tiles.stats(),tilePlan:(frames,width)=>atlas.tiles.plan(frames,width),atlasManifest:atlas.tiles.manifest,bitmap:true,microstate:selected.box.w*selected.box.h<5};
}
