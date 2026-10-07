import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('../spelling/bubble-html.mjs',import.meta.url),'utf8');
const css=await readFile(new URL('../spelling/bubble-html.css',import.meta.url),'utf8');
const art=await readFile(new URL('../spelling/art.mjs',import.meta.url),'utf8');
const build=await readFile(new URL('../tools/build-design.mjs',import.meta.url),'utf8');

test('all spelling previews use the selected shared photograph renderer',()=>{
 assert.match(art,/createConfiguredBubble/);
 assert.doesNotMatch(art,/svgBubble|useHtml/);
 assert.doesNotMatch(html,/clipPath:|clip-path.*animate/);
});
test('ambient soap motion never repaints border or clip-path each frame',()=>{
 const motion=css.slice(css.indexOf('@keyframes mn-soap-sway'),css.indexOf('@keyframes mn-soap-glint'));
 assert.match(motion,/transform:/);
 assert.doesNotMatch(motion,/border-radius|clip-path|filter:|background|box-shadow/);
 assert.doesNotMatch(html,/requestAnimationFrame|setInterval/);
});
test('WebKit renderer retains image preloading, bounded cache and explicit pause',()=>{
 assert.match(html,/CACHE_LIMIT=6/);
 assert.match(html,/preloadScene/);
 assert.match(html,/transitionToScene/);
 assert.match(html,/root\.getAnimations\(\{subtree:true\}\)/);
 assert.match(html,/link\.href=new URL\('\.\/bubble-html\.css'/);
});
test('consumer builds copy both the module and its CSS from the canonical design',()=>{
 assert.match(build,/'spelling\/bubble-html\.mjs'/);
 assert.match(build,/'spelling\/bubble-html\.css'/);
});


test('production optics keep original SVG paint without an idle contour loop',async()=>{const svg=await readFile(new URL('../spelling/bubble.mjs',import.meta.url),'utf8');assert.match(svg,/!composited && options.motion/);assert.match(svg,/motionRoot.animate/);assert.match(svg,/soap-rainbow-inner/);assert.match(svg,/soap-satellite/);assert.match(svg,/opticalFiltersEnabled=!composited/);});

test('game and word dialogs share the saved bubble selection',async()=>{const factory=await readFile(new URL('../spelling/bubble-renderer.mjs',import.meta.url),'utf8'),dialog=await readFile(new URL('../ortografia/result-rules.mjs',import.meta.url),'utf8');assert.match(factory,/renderer==='classic'\?createBubble/);assert.match(dialog,/active.bubble = createConfiguredBubble/);assert.match(build,/'spelling\/bubble-renderer\.mjs'/);assert.match(build,/'ortografia\/result-rules\.mjs'/);});

test('production photograph remains a stable editable child in the component hierarchy',async()=>{const svg=await readFile(new URL('../spelling/bubble.mjs',import.meta.url),'utf8'),elements=await readFile(new URL('../shared/element-system.mjs',import.meta.url),'utf8');assert.match(svg,/class="mn-production-photo" data-ds-key="mn-soap-picture"/);assert.match(elements,/node.matches\('\.mn-production-photo'\)\?'image-mn-soap-picture'/);});
