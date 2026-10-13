#!/usr/bin/env node
// Run only after generator success. Synchronise precisely the files that exist.
// Pilot remains supported; --all exports and caches the complete 195-country set.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FLAGS } from '../data/flags.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out=join(root,'assets/flags/cloth-prebaked');
const manifest=JSON.parse(await readFile(join(out,'manifest.json'),'utf8'));
const ids=Object.keys(manifest.flags||{}).sort();
if (ids.length!==6 && ids.length!==FLAGS.length)
  throw new Error('Incomplete or unexpected manifest: '+ids.length+' entries');
if(ids.length===FLAGS.length){
  const expected=new Set(FLAGS.map(x=>x.id));
  for(const id of ids)if(!expected.delete(id))throw new Error('Unknown flag: '+id);
  if(expected.size)throw new Error('Missing flags: '+[...expected].join(','));
}
let totalBytes=0;
for(const id of ids){
  const row=manifest.flags[id];
  if(row.file!==id+'.webp')throw new Error('Mismatched filename for '+id);
  const image=await readFile(join(out,id+'.webp'));
  if(image.length>150*1024)throw new Error('Oversized image: '+id);
  if(image.length!==row.bytes)throw new Error('Manifest byte mismatch: '+id);
  if(image.toString('ascii',0,4)!=='RIFF'||image.toString('ascii',8,12)!=='WEBP')
    throw new Error('Invalid WebP: '+id);
  if(!Number.isInteger(row.width)||row.width<450||
     !Number.isInteger(row.height)||row.height<300)throw new Error('Invalid dimensions: '+id);
  totalBytes+=image.length;
}
const workerPath=join(root,'sw.js');
let sw=await readFile(workerPath,'utf8');
const marker='  "./flagi/cloth-prebaked.css?v=1",';
if(!sw.includes(marker))throw new Error('SW marker missing');
sw=sw.replace(/^  "\.\/assets\/flags\/cloth-prebaked\/[a-z]{2}\.webp",\r?\n/gm,'');
const additions=ids.map(id=>'  "./assets/flags/cloth-prebaked/'+id+'.webp",');
sw=sw.replace(marker,marker+'\n'+additions.join('\n'));
sw=sw.replace(/const CACHE='mala-nauka-v\d+[^']*';/,
  ids.length===FLAGS.length
    ? "const CACHE='mala-nauka-v135-flags-195-webp-20261013';"
    : "const CACHE='mala-nauka-v134-flags-prebaked-pilot-20261013';");
sw=sw.replaceAll('flagi/flag-on-pole.mjs?v=12-prebaked','flagi/flag-on-pole.mjs?v=13-all-webp');
sw=sw.replaceAll('flagi/adventure-game.mjs?v=17-prebaked','flagi/adventure-game.mjs?v=18-all-webp');
await writeFile(workerPath,sw);
console.log('Validated '+ids.length+' WebP files ('+(totalBytes/1048576).toFixed(2)+' MiB); offline cache synced');
