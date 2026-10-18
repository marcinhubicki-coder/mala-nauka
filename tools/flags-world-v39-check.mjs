// Small deterministic release check; no browser or authoring masters required.
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {FLAGS} from '../data/flags.mjs';
import {ScenicTiles} from '../flagi/scenic-tiles.mjs';
import {readableAtlasFrames} from '../flagi/scenic-camera.mjs';
const atlas=JSON.parse(gunzipSync(fs.readFileSync(new URL('../assets/maps/atlas-world-v39.data',import.meta.url)))),index=JSON.parse(fs.readFileSync(new URL('../assets/maps/atlas-world-v39/manifest.json',import.meta.url)));
const byId=new Map(atlas.features.map(f=>[f.id,f]));
assert.equal(byId.size,atlas.features.length);assert.equal(FLAGS.length,195);assert.equal(byId.get('ru').neighbors.length,14);
globalThis.devicePixelRatio=2;
const tiles=new ScenicTiles(index);let peakPlan=0;
for(const record of FLAGS){
 const f=byId.get(record.id);assert(f?.path&&f.capital,'Missing geography/capital: '+record.id);
 assert(f.capital.point.every(Number.isFinite));assert(new Set(f.neighbors).size===f.neighbors.length);
 const region=record.id==='ru'?'eurasia':({'north-america':'northAmerica','south-america':'southAmerica'}[record.continent]||record.continent),bounds=atlas.continents[region];
 const frames=readableAtlasFrames(f.focusBox||f.box,350,300,78,bounds,record.id==='ru'?f.bounds:null);
 for(const frame of Object.values(frames)){assert(Object.values(frame).every(Number.isFinite));assert(Math.abs(frame.w/frame.h-350/300)<1e-8);assert(frame.x>=bounds.x-1e-6&&frame.y>=bounds.y-1e-6);assert(frame.x+frame.w<=bounds.x+bounds.w+1e-6&&frame.y+frame.h<=bounds.y+bounds.h+1e-6);}
 const plan=tiles.plan([frames.near,frames.full],350);assert.equal(plan.cap,4,'Native detail lost: '+record.id);assert(plan.bytes<=tiles.budget);assert(plan.tiles.size>0,'Empty land plan: '+record.id);peakPlan=Math.max(peakPlan,plan.bytes);
}
let bytes=0,count=0;
for(const level of index.levels){assert.equal(level.available.length,new Set(level.available).size);for(const key of level.available){const path=new URL('../assets/maps/atlas-world-v39/'+level.id+'/'+key+'.webp',import.meta.url),stat=fs.statSync(path);assert.equal(stat.size,index.files[level.id+'/'+key+'.webp'].bytes);bytes+=stat.size;count++;}}
assert.equal(bytes,index.totalBytes);assert.equal(count,index.totalTiles);
console.log(JSON.stringify({countries:FLAGS.length,uniqueGeographies:byId.size,tiles:count,compressedTileBytes:bytes,peakPlannedDecodedBytes:peakPlan,budget:tiles.budget,nativeCloseLevelForAllCountries:true}));
