import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {AMBIENT_PRESETS,DEFAULT_EFFECTS,validateEffects} from '../spelling/effect-model.mjs';

const readSource=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [studio,css,response,artCss]=await Promise.all([
 readSource('design-system/studio-play.mjs'),readSource('design-system/studio-play.css'),
 readSource('spelling/response-effects.mjs'),readSource('spelling-art.css'),
]);

test('effects lab shares Jelly controls and keeps preview below its compact toolbar',()=>{
 assert.match(studio,/mountJellies/);
 assert.match(studio,/dataset\.effectChoice/);
 assert.match(studio,/id=wide-effects/);
 assert.match(studio,/class="motion-stage effect-stage"/);
 assert.doesNotMatch(studio,/id=effect-event><option/);
 assert.doesNotMatch(studio,/id=effect-random><option/);
 assert.match(css,/\.effect-workspace>\.effect-main\{[\s\S]*grid-template-rows:[\s\S]*minmax\(270px,1fr\)/);
 assert.match(css,/\.effect-stage\{grid-row:-2\/-1/);
 assert.match(css,/\.effect-stage \.effect-phone\{top:50%;left:50%/);
 assert.match(css,/\.effect-workspace>\.effect-inspector\{[\s\S]*grid-column:2;grid-row:1/);
});

test('screen atmosphere is bounded, click-through and validated',()=>{
 validateEffects(DEFAULT_EFFECTS);
 assert.equal(DEFAULT_EFFECTS.ambient.style,'dust');
 assert.equal(Object.keys(AMBIENT_PRESETS).length,5);
 for(const preset of Object.values(AMBIENT_PRESETS))validateEffects({...structuredClone(DEFAULT_EFFECTS),ambient:{...DEFAULT_EFFECTS.ambient,...preset}});
 for(const mutate of [a=>a.style='storm',a=>a.filter='blur-all',a=>a.intensity=2,a=>a.softness=3,a=>a.density=-1,a=>a.bloom=2,a=>a.touchStrength=2,a=>a.responsive='yes']){
  const value=structuredClone(DEFAULT_EFFECTS);mutate(value.ambient);assert.throws(()=>validateEffects(value));
 }
 assert.match(response,/createScreenAtmosphere/);
 assert.match(response,/Math\.min\(10,4\+Math\.round/);
 assert.match(artCss,/\.screen-atmosphere\{[^}]*pointer-events:none/);
 assert.match(artCss,/ambient-bokeh/);
 assert.match(artCss,/backdrop-filter:blur\(var\(--ambient-softness/);
 assert.match(studio,/Ciepły film/);
 assert.match(studio,/effects\.ambient\.flare/);
});

test('wrong response keeps shake but no lingering red ring',()=>{
 assert.match(response,/event==='wrong'[\s\S]*settings\.shake/);
 assert.doesNotMatch(response,/const ring=/);
});
