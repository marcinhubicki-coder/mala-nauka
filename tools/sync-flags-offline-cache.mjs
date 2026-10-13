#!/usr/bin/env node
// Called only after successful offline generation. Never precache missing files.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pilot=['pl','gb','ch','np','jp','cf'];
const out=join(root,'assets/flags/cloth-prebaked');
const manifest=JSON.parse(await readFile(join(out,'manifest.json'),'utf8'));
for(const id of pilot){
  if(!manifest.flags?.[id])throw new Error('Missing generated image: '+id);
  const image=await readFile(join(out,id+'.webp'));
  if(image.length>150*1024)throw new Error('Oversized pilot: '+id);
  if(image.toString('ascii',0,4)!=='RIFF'||image.toString('ascii',8,12)!=='WEBP'){
    throw new Error('Invalid WebP: '+id);
  }
}
const workerPath=join(root,'sw.js');
let sw=await readFile(workerPath,'utf8');
const marker='  "./flagi/cloth-prebaked.css?v=1",';
if(!sw.includes(marker))throw new Error('SW stylesheet marker missing');
const additions=pilot.filter(id=>!sw.includes('"./assets/flags/cloth-prebaked/'+id+'.webp"'))
  .map(id=>'  "./assets/flags/cloth-prebaked/'+id+'.webp",');
if(additions.length)sw=sw.replace(marker,marker+'\n'+additions.join('\n'));
sw=sw.replace(/const CACHE='mala-nauka-v\d+[^']*';/,
  "const CACHE='mala-nauka-v134-flags-prebaked-pilot-20261013';");
await writeFile(workerPath,sw);
console.log('Verified six WebP files and synchronized offline precache');
