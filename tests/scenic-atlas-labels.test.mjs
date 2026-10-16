import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FLAGS} from '../data/flags.mjs';
import {layoutAtlasLabels} from '../flagi/scenic-atlas-labels.mjs';

test('crowded country names remain readable and small states keep their true anchor',()=>{
 const items=[{key:'capital',id:'ch',name:'Berno',ax:150,ay:90,capital:true},...['Liechtenstein','Austria','Francja','Niemcy','Włochy'].map((name,i)=>({key:name,id:name,name,ax:155+i*9,ay:125+i*4,small:true,flag:true}))];
 const labels=layoutAtlasLabels(items,{width:330,height:216,measure:s=>s.length*5,near:true});
 assert(labels.some(x=>x.capital));assert(labels.some(x=>x.id==='Liechtenstein'&&x.leader));
 for(const label of labels){assert(label.box.x>=0&&label.box.y>=0);assert(label.box.x+label.box.w<=330&&label.box.y+label.box.h<=216);assert.equal(label.ax,items.find(x=>x.id===label.id).ax);}
 for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
  const a=labels[i].box,b=labels[j].box;assert(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,'Country names and flags must not overlap');
 }
});

test('labels can move beyond local offsets to remain inside an irregular paint edge',()=>{
 const [label]=layoutAtlasLabels([{key:'edge',id:'nl',name:'Holandia',ax:160,ay:15,flag:true}],{width:330,height:216,measure:s=>s.length*5,allowed:b=>b.x>=40&&b.x+b.w<=270&&b.y>=90&&b.y+b.h<=170});
 assert(label);assert(label.leader);assert(label.box.y>=90&&label.box.y+label.box.h<=170);assert.equal(label.ax,160);assert.equal(label.ay,15);
});

test('all playable European countries have registered geometry, source capitals and land neighbours',async()=>{
 const data=JSON.parse(await readFile(new URL('../assets/maps/europe-atlas-v26.json',import.meta.url))),byId=new Map(data.features.map(f=>[f.id,f]));
 const svg=await readFile(new URL('../assets/maps/europe-atlas-v26.svg',import.meta.url),'utf8');
 for(const record of FLAGS.filter(r=>r.continent==='europe')){
  const f=byId.get(record.id);assert(f,record.id);assert(svg.includes('data-country="'+record.id+'"'));assert(f.capital?.lonLat?.length===2);
  const [lon,lat]=f.capital.lonLat;assert.equal(f.capital.name,record.capital);assert(Math.abs(f.capital.point[0]-(lon+28)*680/94)<.001);assert(Math.abs(f.capital.point[1]-(74-lat)*500/44)<.001);
  for(const neighbor of f.neighbors)assert(byId.get(neighbor).neighbors.includes(f.id),'Shared boundary must be reciprocal');
 }
 assert.deepEqual(byId.get('pl').neighbors,['by','cz','de','lt','ru','sk','ua']);assert.deepEqual(byId.get('li').neighbors,['at','ch']);assert.deepEqual(byId.get('is').neighbors,[]);
 assert(data.features.some(f=>f.id==='kz')&&data.features.some(f=>f.id==='ir'),'Asia continues through the east of the atlas');
});
