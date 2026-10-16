/** Prepare the single registered atlas guide and runtime geography from public
 * Natural Earth inputs. Usage: node tools/prepare-scenic-atlas.mjs <input-dir>.
 * This is authoring tooling; the game only loads the compact derived assets. */
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {FLAGS} from '../data/flags.mjs';
const input=resolve(process.argv[2]||'..'),out=resolve('assets/maps');
const read=async name=>JSON.parse(await fs.readFile(resolve(input,name),'utf8'));
const countries=await read('natural-earth-countries-50m.geojson'),places=await read('natural-earth-places.geojson'),regions=await read('natural-earth-regions.geojson');
const project=([lon,lat])=>[(lon+28)*680/94,(74-lat)*500/44];
const bounds=[0,0,680,500],recordById=new Map(FLAGS.map(x=>[x.id,x]));
const polys=geometry=>geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];
function clip(ring){
 let points=ring.map(project);
 for(const [axis,edge,sign] of [[0,0,1],[0,680,-1],[1,0,1],[1,500,-1]]){
  const next=[];
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length],ai=sign*(a[axis]-edge)>=0,bi=sign*(b[axis]-edge)>=0;
   if(ai)next.push(a);
   if(ai!==bi){const t=(edge-a[axis])/(b[axis]-a[axis]);next.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
  }
  points=next;
 }
 return points.length>=3?points:[];
}
const area=ring=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1]},0)/2);
const inside=(ring,x,y)=>{let odd=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])odd=!odd;}return odd;};
const pathOf=rings=>rings.map(r=>'M'+r.map(p=>p.map(n=>+n.toFixed(2)).join(',')).join('L')+'Z').join('');
const features=[];
for(const feature of countries.features){
 const p=feature.properties,id=p.ISO_A2_EH.toLowerCase(),rings=polys(feature.geometry).flatMap(poly=>poly.map(clip)).filter(r=>r.length&&area(r)>.005);
 if(!rings.length)continue;
 const main=rings.reduce((a,b)=>area(a)>area(b)?a:b),xs=main.map(p=>p[0]),ys=main.map(p=>p[1]);
 const box={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
 let point=[box.x+box.w/2,box.y+box.h/2],best=Infinity;
 for(let x=0;x<21;x++)for(let y=0;y<21;y++){const p=[box.x+box.w*(x+.5)/21,box.y+box.h*(y+.5)/21],d=(p[0]-point[0])**2+(p[1]-point[1])**2;if(d<best&&inside(main,...p)){best=d;box.point=p;}}
 point=box.point||point;delete box.point;
 const capitals=places.features.filter(f=>f.properties.iso_a2?.toLowerCase()===id&&f.properties.adm0cap===1).sort((a,b)=>(b.properties.pop_max||0)-(a.properties.pop_max||0));
 const capital=capitals[0]&&{point:project(capitals[0].geometry.coordinates),lonLat:capitals[0].geometry.coordinates,name:recordById.get(id)?.capital||capitals[0].properties.name};
 features.push({id,name:recordById.get(id)?.country||p.NAME_PL||p.ADMIN,path:pathOf(rings),point,box,capital,neighbors:[],geometry:feature.geometry});
}
// Shared source boundary segments distinguish land neighbours from countries
// which merely happen to be close in the viewport.
const segments=new Map();
for(const f of features)for(const poly of polys(f.geometry))for(const ring of poly)for(let i=1;i<ring.length;i++){
 const key=[ring[i-1],ring[i]].map(p=>p.map(n=>n.toFixed(3)).join(',')).sort().join('|');
 if(!segments.has(key))segments.set(key,new Set());segments.get(key).add(f.id);
}
const byId=new Map(features.map(f=>[f.id,f]));
for(const ids of segments.values())if(ids.size>1)for(const a of ids)for(const b of ids)if(a!==b&&!byId.get(a).neighbors.includes(b))byId.get(a).neighbors.push(b);
for(const f of features){f.neighbors.sort();delete f.geometry;}
const absent=FLAGS.filter(r=>r.continent==='europe'&&!byId.get(r.id)?.capital);if(absent.length)throw Error('Missing geography/capital: '+absent.map(x=>x.id));
const metadata={version:26,viewBox:bounds,projection:{type:'equirectangular',lon:[-28,66],lat:[30,74]},source:'Natural Earth 1:50m Admin 0 + 1:10m populated places',features:features.map(({path,...item})=>item)};
await fs.writeFile(resolve(out,'europe-atlas-v26.json'),JSON.stringify(metadata));
const sourceSVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 500"><g id="countries" fill="#dfe7ef" stroke="#fff" fill-rule="evenodd">'+features.map(f=>`<path class="country" data-country="${f.id}" d="${f.path}"/>`).join('')+'</g></svg>';
await fs.writeFile(resolve(out,'europe-atlas-v26.svg'),sourceSVG);
let guide='<svg xmlns="http://www.w3.org/2000/svg" width="2040" height="1500" viewBox="0 0 680 500"><rect width="680" height="500" fill="#73c8d6"/>';
guide+=features.map(f=>`<path d="${f.path}" fill="#c7d899" stroke="#eef0c2" stroke-width=".65" fill-rule="evenodd"/>`).join('');
// Position the mountain guidance from Natural Earth's physiographic regions,
// so generated art follows actual ranges instead of repeating random hills.
const wanted=/alps|pyrenees|carpath|apenn|dinar|balkan|scandinav|ural|caucasus|pindus|cantabr/i;
const names=[];
for(const f of regions.features){const p=f.properties,name=p.name||p.NAME||'';if(!wanted.test(name))continue;const rings=polys(f.geometry).flatMap(poly=>poly.map(clip)).filter(r=>r.length);if(!rings.length)continue;names.push(name);guide+=`<path d="${pathOf(rings)}" fill="#a69362" opacity=".6"/>`;}
guide+='</svg>';
await sharp(Buffer.from(guide)).png().toFile(resolve(input,'europe-geography-guide-v26.png'));
const provenance={sources:['https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson','https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_populated_places_simple.geojson','https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_geography_regions_polys.geojson'],license:'https://www.naturalearthdata.com/about/terms-of-use/',sha256:{},mountainGuides:names};
for(const file of ['natural-earth-countries-50m.geojson','natural-earth-places.geojson','natural-earth-regions.geojson'])provenance.sha256[file]=createHash('sha256').update(await fs.readFile(resolve(input,file))).digest('hex');
await fs.writeFile(resolve(out,'europe-atlas-v26-source.json'),JSON.stringify(provenance,null,2)+'\n');
console.log(JSON.stringify({countries:features.length,polandNeighbors:byId.get('pl').neighbors,capitals:features.filter(f=>f.capital).length,mountainGuides:names}));
