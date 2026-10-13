import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const get = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const pilot = ['pl','gb','ch','np','jp','cf'];

test('six pilot flag cloth assets use WebP and retain the SVG + Canvas fallback',async()=>{
  const source=await get('flagi/flag-on-pole.mjs');
  for(const id of pilot)assert.match(source,new RegExp("['\"]"+id+"['\"]"));
  assert.match(source,/cloth-prebaked\/.*\.webp/);
  assert.match(source,/renderFlagCloth\(canvas\)/);
  assert.match(source,/prewarmFlagCloth/);
  assert.match(source,/record\.flagSvg/);
  assert.match(source,/is-prebaked/);
});

test('both gameplay and isolated preview load the static cloth layer',async()=>{
  for(const filename of ['flagi/index.html','flagi/preview-frame.html']){
    const html=await get(filename);
    assert.match(html,/flagi\/cloth-prebaked\.css\?v=1/);
    assert.match(html,/flagi\/adventure-game\.mjs\?v=17-prebaked/);
  }
  const style=await get('flagi/cloth-prebaked.css');
  assert.match(style,/object-fit:contain/);
  assert.match(style,/\.is-prebaked/);
});

test('generator shares original material math and enforces six-file 150KiB pilot',async()=>{
  const source=await get('tools/build-flag-cloth-assets.mjs');
  assert.match(source,/import\('\/flagi\/flag-cloth\.mjs\?v=8'\)/);
  assert.match(source,/MAX_BYTES = 150 \* 1024/);
  assert.match(source,/canvas\.toDataURL\('image\/webp'/);
  for(const id of pilot)assert.match(source,new RegExp("['\"]"+id+"['\"]"));
  assert.match(source,/FLAGS\.map\(flag => flag\.id\)/);
});

test('service worker invalidates old flag modules without precaching absent binaries',async()=>{
  const worker=await get('sw.js');
  assert.match(worker,/mala-nauka-v133-flags-prebaked-pilot/);
  assert.match(worker,/flag-on-pole\.mjs\?v=12-prebaked/);
  assert.match(worker,/cloth-prebaked\.css\?v=1/);
  assert.doesNotMatch(worker,/assets\/flags\/cloth-prebaked\/(?:pl|gb|ch|np|jp|cf)\.webp/);
});
