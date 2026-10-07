import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('../spelling/bubble-html.mjs',import.meta.url),'utf8');
const css=await readFile(new URL('../spelling/bubble-html.css',import.meta.url),'utf8');
const art=await readFile(new URL('../spelling/art.mjs',import.meta.url),'utf8');
const build=await readFile(new URL('../tools/build-design.mjs',import.meta.url),'utf8');

test('all spelling previews use the same composited photograph renderer',()=>{
 assert.match(art,/createHTMLBubble/);
 assert.match(art,/bubble=createHTMLBubble/);
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

