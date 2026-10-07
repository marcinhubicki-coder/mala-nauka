import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('startup has five rotating balls, no logo, and an existing nine-color rainbow burst',async()=>{
 const html=await read('index.html'),css=await read('boot-loader.css');
 const loader=html.split('<div id="mn-preloader"')[1].split('<main id="app"')[0];
 assert.ok(loader);
 assert.doesNotMatch(loader,/<img|mn-boot-logo|mn-boot-dots|mn-boot-caption/);
 assert.equal((loader.match(/class="mn-boot-ball mn-boot-ball-/g)||[]).length,5);
 assert.equal((loader.match(/--fly-x:/g)||[]).length,9);
 assert.match(loader,/mn-boot-whiteout/);
 assert.match(css,/mn-boot-two-orbits/);
 assert.match(css,/rotate\(720deg\)/);
 assert.match(css,/1500ms linear both/);
});

test('white ring opens from its center 600ms after the outer disk begins',async()=>{
 const css=await read('boot-overlay.css'),js=await read('boot-ui.mjs');
 const outer=css.match(/mn-boot-outer-iris 1400ms[^;]+?180ms both/);
 const inner=css.match(/mn-boot-center-reveal 850ms[^;]+?780ms both/);
 assert.ok(outer,'outer white circle begins 180ms into burst');
 assert.ok(inner,'inner hole begins 780ms into burst, exactly 600ms later');
 assert.match(css,/@keyframes mn-boot-center-reveal/);
 assert.match(css, /clip-path:circle\(0px at 50% 50%\)/);
 assert.match(css, /clip-path:circle\(80vmax at 50% 50%\)/);
 assert.match(css, /#app\{\s*position:relative;z-index:2001/);
 assert.match(js,/INITIAL_TWO_TURNS_MS=1500/);
 assert.match(js,/EXIT_MS=reduced\?190:1890/);
});

test('startup waits for assets then uncovers the actual first screen and cleans up',async()=>{
 const js=await read('boot-ui.mjs'),css=await read('boot-overlay.css');
 assert.match(js,/firstScreenReady\(\)/);
 assert.match(js,/\.decode\(\)/);
 assert.match(js,/requestIdleCallback/);
 assert.match(js,/overlay\.classList\.add\('mn-boot-exit'\)/);
 assert.match(js,/observer\.disconnect\(\)/);
 assert.match(js,/overlay\.remove\(\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/mn-boot-rainbow-webkit/);
 assert.doesNotMatch(js,/setInterval\s*\(|location\.reload\(/);
 assert.doesNotMatch(css,/feTurbulence|feDisplacementMap|filter:\s*blur|backdrop-filter/);
});
