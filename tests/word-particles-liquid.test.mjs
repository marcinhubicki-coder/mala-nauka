import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_EFFECTS,normalizeEffectsConfig,validateEffects} from '../spelling/effect-model.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('liquid bubble variants and particle word transition are optional',()=>{
 const normal=normalizeEffectsConfig(DEFAULT_EFFECTS);
 assert.equal(normal.bubble.liquid,'none');
 assert.equal(normal.wordTransition.style,'particles');
 for(const liquid of ['none','ripple','silk','jelly']){
  const config=normalizeEffectsConfig({...normal,bubble:{...normal.bubble,liquid}});
  assert.doesNotThrow(()=>validateEffects(config));
 }
 const visual=normalizeEffectsConfig({...normal,wordTransition:{style:'particles',dots:32,interactive:true}});
 assert.doesNotThrow(()=>validateEffects(visual));
 for(const invalid of ['ripple!','blur','particle-storm']){
  const broken=normalizeEffectsConfig({...normal,bubble:{...normal.bubble,liquid:invalid}});
  assert.throws(()=>validateEffects(broken));
 }
 assert.throws(()=>validateEffects(normalizeEffectsConfig({...normal,wordTransition:{style:'particles',dots:500,interactive:true}})));
});

test('particle word motion preserves the actual text and never animates by a JS frame loop',async()=>{
 const js=await read('spelling/word-particles.mjs');
 const art=await read('spelling/art.mjs');
 const css=await read('spelling/word-particles.css');
 const studio=await read('design-system/studio-play.mjs');
 assert.match(js,/MAX_WORD_PIECES=576/);
 assert.match(js,/piecesPerLetter:20/);
 assert.match(js,/createElement\('canvas'\)/);
 assert.match(js,/getImageData/);
 assert.doesNotMatch(js,/(requestAnimationFrame|setInterval|\.setInterval)\s*\(/);
 assert.match(art,/wordParticles=createWordParticles/);
 assert.match(art,/wordParticles\?\.play\(direction\)/);
 assert.match(art,/wordParticles\?\.destroy/);
 assert.match(studio,/wordPanel\(\)/);
 assert.match(css,/pointer-events:none/);
});
