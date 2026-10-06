import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_EFFECTS,normalizeEffectsConfig,validateEffects} from '../spelling/effect-model.mjs';

const source=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('metallic rim is optional and independent of the bubble skin',()=>{
 const base=normalizeEffectsConfig(DEFAULT_EFFECTS);
 assert.equal(base.bubble.rim,'classic');
 for(const rim of ['classic','silver','gold','iridescent']){
  const config=normalizeEffectsConfig({...base,bubble:{...base.bubble,skin:'ocean',rim}});
  assert.equal(config.bubble.skin,'ocean');
  assert.equal(config.bubble.rim,rim);
  assert.doesNotThrow(()=>validateEffects(config));
 }
 const broken=normalizeEffectsConfig({...base,bubble:{...base.bubble,rim:'unknown'}});
 assert.throws(()=>validateEffects(broken));
});

test('WebKit bubble renderer uses static metal ring with no animated SVG',async()=>{
 const js=await source('spelling/bubble-html.mjs');
 const css=await source('spelling/bubble-html.css');
 const studio=await source('design-system/studio-play.mjs');
 assert.match(js,/root.dataset.rim=b.rim/);
 for(const rim of ['silver','gold','iridescent'])assert.match(css,new RegExp('data-rim="'+rim+'"'));
 assert.match(css,/conic-gradient/);
 assert.doesNotMatch(css.slice(css.indexOf('Metallic rims')),/requestAnimationFrame|@keyframes/);
 assert.match(studio,/Obrzeże bańki/);
});

test('Math neon loader does not delay the real app',async()=>{
 const html=await source('matematyka/index.html');
 const math=await source('matematyka/app.js');
 const css=await source('matematyka/neon-effects.css');
 assert.match(html,/neon-effects\.css/);
 assert.equal((html.match(/--digit-index:/g)||[]).length,9);
 assert.match(html,/math-neon-loading/);
 assert.match(math,/math-neon-wordmark/);
 assert.match(math,/app.innerHTML/);
 assert.doesNotMatch(css,/backdrop-filter|feGaussianBlur|filter:\s*blur/);
 const animations=css.match(/@keyframes\s+[^{}]+\{(?:[^{}]*\{[^{}]*\})+\}/g)||[];
 assert.equal(animations.length,3);
 for(const anim of animations)assert.doesNotMatch(anim,/(?:filter|box-shadow|text-shadow|background)\s*:/);
});
