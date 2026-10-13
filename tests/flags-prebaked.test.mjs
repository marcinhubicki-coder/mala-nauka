import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { FLAGS } from '../data/flags.mjs';

const get=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const pilot=['pl','gb','ch','np','jp','cf'];

test('all 195 countries prefer prebaked WebP and retain original Canvas fallback',async()=>{
  assert.equal(FLAGS.length,195);
  const source=await get('flagi/flag-on-pole.mjs');
  assert.match(source,/cloth-prebaked\/.*\.webp/);
  assert.match(source,/renderFlagCloth\(canvas\)/);
  assert.match(source,/prewarmFlagCloth/);
  assert.match(source,/record\.flagSvg/);
  assert.match(source,/is-prebaked/);
  assert.doesNotMatch(source,/PREBAKED_PILOT/);
});

test('game and preview both load the all-WebP renderer',async()=>{
  for(const filename of ['flagi/index.html','flagi/preview-frame.html']){
    const html=await get(filename);
    assert.match(html,/flagi\/cloth-prebaked\.css\?v=1/);
    assert.match(html,/flagi\/adventure-game\.mjs\?v=18-all-webp/);
  }
  const game=await get('flagi/adventure-game.mjs');
  assert.match(game,/flag-on-pole\.mjs\?v=13-all-webp/);
  const style=await get('flagi/cloth-prebaked.css');
  assert.match(style,/object-fit:contain/);
  assert.match(style,/\.is-prebaked/);
});

test('generator uses original lighting and bounds WebP output size',async()=>{
  const source=await get('tools/build-flag-cloth-assets.mjs');
  assert.match(source,/import\('\/flagi\/flag-cloth\.mjs\?v=8'\)/);
  assert.match(source,/MAX_BYTES = 150 \* 1024/);
  assert.match(source,/toDataURL\('image\/webp'/);
  assert.match(source,/FLAGS\.map\(flag => flag\.id\)/);
  assert.match(source,/ids\.length !== 195/);
});

test('generated assets match offline manifest and service worker cache',async()=>{
  const manifest=JSON.parse(await get('assets/flags/cloth-prebaked/manifest.json'));
  const ids=Object.keys(manifest.flags).sort();
  assert.ok(ids.length===6 || ids.length===195);
  if(ids.length===6)assert.deepEqual(ids,[...pilot].sort());
  else assert.deepEqual(ids,FLAGS.map(f=>f.id).sort());
  const worker=await get('sw.js');
  assert.match(worker,/flags-(?:prebaked-pilot|195-webp)/);
  assert.match(worker,/flag-on-pole\.mjs\?v=13-all-webp/);
  assert.match(worker,/adventure-game\.mjs\?v=18-all-webp/);
  assert.match(worker,/cloth-prebaked\.css\?v=1/);
  for(const id of ids){
    const meta=manifest.flags[id];
    assert.equal(meta.file,id+'.webp');
    assert.ok(meta.bytes<=150*1024,'Too large: '+id);
    assert.ok(worker.includes('./assets/flags/cloth-prebaked/'+id+'.webp'),'Missing precache: '+id);
    const file=new URL('../assets/flags/cloth-prebaked/'+id+'.webp',import.meta.url);
    const bytes=(await stat(file)).size;
    assert.equal(bytes,meta.bytes,'Byte mismatch: '+id);
  }
});
