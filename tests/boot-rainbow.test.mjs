import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('startup keeps the original logo and adds one rainbow burst before a white reveal',async()=>{
 const html=await read('index.html');
 const css=await read('boot-overlay.css');
 assert.match(html,/id="mn-preloader"/);
 assert.match(html,/assets\/brand\/player-logo\.svg/);
 assert.equal((html.match(/--fly-x:/g)||[]).length,9);
 assert.equal((html.match(/mn-boot-blob mn-boot-/g)||[]).length,5);
 assert.match(html,/mn-boot-whiteout/);
 assert.match(css,/mn-boot-rainbow-launch/);
 assert.match(css,/mn-boot-white-arrival/);
 assert.match(css,/mn-first-screen-appear/);
 assert.match(css,/prefers-reduced-motion/);
});

test('rainbow loader does not recreate dynamic SVG filtering or per-frame JavaScript',async()=>{
 const js=await read('boot-ui.mjs');
 const loader=await read('boot-loader.css');
 const exit=await read('boot-overlay.css');
 assert.doesNotMatch(js,/setInterval\s*\(|getImageData|MutationObserver\(.+requestAnimationFrame/);
 assert.doesNotMatch(loader+exit,/feTurbulence|feDisplacementMap|filter:\s*blur|backdrop-filter/);
 assert.match(js,/firstScreenReady\(\)/);
 assert.match(js,/\.decode\(\)/);
 assert.match(js,/requestIdleCallback/);
 assert.match(js,/overlay\.classList\.add\('mn-boot-exit'\)/);
 assert.match(js,/INITIAL_MORPH_MS=520/);
 assert.doesNotMatch(js,/location\.reload\(/);
});

test('rainbow exit exposes the first interactive screen and cleans up',async()=>{
 const js=await read('boot-ui.mjs');
 const css=await read('boot-overlay.css');
 assert.match(js,/observer\.disconnect\(\)/);
 assert.match(js,/overlay\.remove\(\)/);
 assert.match(css,/body:has\(#mn-preloader:not\(\.mn-boot-exit\)\) #app\{opacity:0\}/);
 assert.match(css,/\@media\(prefers-reduced-motion:reduce\)/);
});
