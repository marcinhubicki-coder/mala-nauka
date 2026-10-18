// Europe is a camera on the continuous atlas, rather than a separate drawing.
import {FLAGS} from '../data/flags.mjs';
import {loadWorldAtlas} from './scenic-world.mjs?v=36';
import {clockwiseNeighbors} from './scenic-camera.mjs?v=36';
const records=new Map(FLAGS.map(r=>[r.id,r])),flags=new Map();
const ns='http://www.w3.org/2000/svg';
function flag(id){
 if(!records.has(id))return Promise.resolve(null);
 if(!flags.has(id))flags.set(id,new Promise(resolve=>{const img=new Image(),timer=setTimeout(()=>resolve(null),1600);img.onload=()=>{clearTimeout(timer);resolve(img)};img.onerror=()=>{clearTimeout(timer);resolve(null)};img.src=new URL(records.get(id).flagSvg,document.baseURI).href;}));
 return flags.get(id);
}
export const preloadScenicEurope=()=>loadWorldAtlas();
export async function mountScenicEurope(node,{record,language='pl'}={}){
 let atlas;try{atlas=await loadWorldAtlas()}catch{return {found:false,reason:'geometry-unavailable'}}
 if(!node.isConnected)return {found:false,reason:'detached'};
 const selected=atlas.features.find(f=>f.id===record.id);if(!selected)return {found:false,reason:'unsupported-country'};
 node.className='continent-map-host no-copy';node.dataset.countryId=record.id;node.dataset.mapImage='registered-world';node.setAttribute('aria-label',(language==='pl'?'Położenie kraju ':'Location of ')+(language==='pl'?record.country:record.countryEn));
 const host=document.createElement('div');host.className='continent-map-canvas';const svg=document.createElementNS(ns,'svg'),active=document.createElementNS(ns,'path');
 svg.setAttribute('viewBox','0 0 680 500');active.setAttribute('d',selected.path);active.setAttribute('class','country scenic-country-overlay');active.dataset.country=record.id;svg.append(active);host.append(svg);node.replaceChildren(host);
 const region=record.id==='ru'?'eurasia':({'north-america':'northAmerica','south-america':'southAmerica'}[record.continent]||record.continent);
 const bounds=atlas.continents[region]||atlas.continents.europe;
 const regional=selected.neighbors.filter(id=>{if(record.id==='ru')return true;const b=atlas.features.find(f=>f.id===id)?.bounds;return b&&b.x<bounds.x+bounds.w&&b.x+b.w>bounds.x&&b.y<bounds.y+bounds.h&&b.y+b.h>bounds.y;});
 const neighbors=clockwiseNeighbors({...selected,neighbors:regional},atlas.features,atlas.features),images=Object.fromEntries(await Promise.all(neighbors.map(async id=>[id,await flag(id)])));
 return {found:true,svg,active,focusBox:selected.focusBox||selected.box,wholeCountry:record.id==='ru'?selected.bounds:null,bounds,continents:atlas.continents,geometry:atlas.features,neighbors,worldNeighbors:selected.neighbors,capital:selected.capital,flags:images,labels:atlas.features.filter(f=>records.has(f.id)).map(f=>({id:f.id,name:language==='pl'?records.get(f.id).country:records.get(f.id).countryEn,point:{x:f.point[0],y:f.point[1]},box:f.box})),paintBase:atlas.paint,bitmap:true,microstate:selected.box.w*selected.box.h<5};
}
