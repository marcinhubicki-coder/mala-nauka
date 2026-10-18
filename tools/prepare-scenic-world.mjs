// One world geometry supplies every continent, painted boundary and highlight.
// Inputs are the public Natural Earth files also used by the previous atlas.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {FLAGS} from '../data/flags.mjs';
const input=resolve(process.argv[2]||'..');
const names=['countries-50m','places','regions','rivers','lakes'];
const raw=Object.fromEntries(await Promise.all(names.map(async n=>[n,await readFile(resolve(input,'natural-earth-'+n+'.geojson'))])));
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(raw[n])]));
const records=new Map(FLAGS.map(r=>[r.id,r]));
const pacific=new Set(data['countries-50m'].features.filter(f=>f.properties.CONTINENT==='Oceania').map(f=>f.properties.ISO_A2_EH.toLowerCase()));
const project=([lon,lat],id)=>[(((id==='ru'||id==='pacific'||pacific.has(id))&&lon<0?lon+360:lon)+28)*680/94,(74-lat)*500/44];
const polygons=g=>g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2);
const boxOf=rings=>{const p=rings.flat(),xs=p.map(p=>p[0]),ys=p.map(p=>p[1]);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};};
const pathOf=(rings,closed=true)=>rings.map(r=>'M'+r.map(p=>p.map(n=>+n.toFixed(2)).join(',')).join('L')+(closed?'Z':'')).join('');
const inside=(ring,x,y)=>{let odd=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])odd=!odd;}return odd;};
const features=[],segments=new Map();
for(const f of data['countries-50m'].features){
 const p=f.properties,id=(p.ISO_A2_EH==='-99'?p.ADM0_A3:p.ISO_A2_EH).toLowerCase();
 const source=polygons(f.geometry),rings=source.flatMap(poly=>poly.map(r=>r.map(p=>project(p,id)))).filter(r=>r.length>2);
 if(!rings.length)continue;
 const main=rings.reduce((a,b)=>area(a)>area(b)?a:b),box=boxOf([main]),bounds=boxOf(rings);
 let point=[box.x+box.w/2,box.y+box.h/2],score=Infinity;
 for(let ix=0;ix<15;ix++)for(let iy=0;iy<15;iy++){const q=[box.x+box.w*(ix+.5)/15,box.y+box.h*(iy+.5)/15],d=(q[0]-box.x-box.w/2)**2+(q[1]-box.y-box.h/2)**2;if(d<score&&inside(main,...q)){point=q;score=d;}}
 const place=data.places.features.filter(f=>f.properties.iso_a2?.toLowerCase()===id&&f.properties.adm0cap===1).sort((a,b)=>(b.properties.pop_max||0)-(a.properties.pop_max||0))[0];
 const capital=place&&{point:project(place.geometry.coordinates,id),lonLat:place.geometry.coordinates,name:records.get(id)?.capital||place.properties.name};
 let focusBox=box;
 if(id==='ru'){
  // Keep Moscow and European Russia in the close view; the overview includes
  // all of Russia, with Chukotka unwrapped across the date line.
  const limit=project([60,0])[0],europe=main.filter(p=>p[0]<=limit);
  focusBox=boxOf([europe]);focusBox.w=limit-focusBox.x;
 }
 features.push({id,name:records.get(id)?.country||p.NAME_PL||p.ADMIN,path:pathOf(rings),point,box,focusBox,bounds,capital,neighbors:[]});
 for(const poly of source)for(const ring of poly)for(let i=1;i<ring.length;i++){
  const key=[ring[i-1],ring[i]].map(p=>p.map(n=>n.toFixed(3)).join(',')).sort().join('|');
  if(!segments.has(key))segments.set(key,new Set());segments.get(key).add(id);
 }
}
const byId=new Map(features.map(f=>[f.id,f]));
for(const ids of segments.values())if(ids.size>1)for(const a of ids)for(const b of ids)if(a!==b&&!byId.get(a).neighbors.includes(b))byId.get(a).neighbors.push(b);
for(const f of features)f.neighbors.sort();
const regions=data.regions.features.filter(f=>/Range\/mtn|Desert/i.test(f.properties.FEATURECLA)).map(f=>{
 const rings=polygons(f.geometry).flatMap(poly=>poly.map(r=>r.map(p=>project(p,f.properties.REGION==='Oceania'?'pacific':undefined))));
 return {name:f.properties.NAME,kind:/Desert/i.test(f.properties.FEATURECLA)?'desert':'mountain',path:pathOf(rings),box:boxOf(rings)};
});
const rivers=data.rivers.features.filter(f=>(f.properties.scalerank??f.properties.SCALERANK??10)<=6).map(f=>{const lines=(f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.coordinates).map(r=>r.map(p=>project(p)));return {rank:f.properties.scalerank??f.properties.SCALERANK,path:pathOf(lines,false),box:boxOf(lines)};});
const lakes=data.lakes.features.map(f=>{const rings=polygons(f.geometry).flatMap(poly=>poly.map(r=>r.map(p=>project(p))));return {path:pathOf(rings),box:boxOf(rings)};});
const rect=(west,south,east,north)=>{const [x,y]=project([west,north]),[r,b]=project([east,south]);return {x,y,w:r-x,h:b-y};};
const continents={europe:rect(-40,15,80,88),eurasia:rect(-40,-20,205,88),asia:rect(10,-15,205,88),africa:rect(-30,-40,65,45),northAmerica:rect(-180,0,-10,88),southAmerica:rect(-100,-60,-25,20),oceania:rect(95,-60,240,25)};
const atlas={version:36,projection:{type:'equirectangular',reference:{lon:[-28,66],lat:[30,74],width:680,height:500}},continents,features,regions,rivers,lakes};
await writeFile('assets/maps/atlas-world-v36.data',gzipSync(JSON.stringify(atlas),{level:9}));
await writeFile('assets/maps/atlas-world-v36-source.json',JSON.stringify({source:'Natural Earth',license:'Public domain',countryScale:'1:50m',relief:'Named physical region footprints, illustrative stamps; not an elevation model',inputs:Object.fromEntries(names.map(n=>[n,createHash('sha256').update(raw[n]).digest('hex')])),geometrySha256:createHash('sha256').update(features.map(f=>f.id+':'+f.path).join('\n')).digest('hex'),countries:features.length,continents:Object.keys(continents),mountains:regions.filter(r=>r.kind==='mountain').map(r=>r.name)},null,2)+'\n');
console.log(JSON.stringify({countries:features.length,mountains:regions.filter(r=>r.kind==='mountain').length,russiaNeighbors:byId.get('ru').neighbors,bytes:JSON.stringify(atlas).length}));
