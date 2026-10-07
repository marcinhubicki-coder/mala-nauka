import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateConfig} from '../design-system/model.mjs';
import {projectContract} from '../design-system/project-model.mjs';
import {optimizedTestConfig} from '../design-system/pwa-test-build.mjs';
import {DEFAULT_SURFACE,SURFACE_EFFECTS,validateSurface} from '../shared/surface-effects.mjs';
import {DEFAULT_EFFECTS} from '../spelling/effect-model.mjs';
const base=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url),'utf8'));
test('per-screen decorations and element effects use the Git/PWA design contract without leaking views',()=>{
 const c=structuredClone(base);c.screenEffects={home:{...DEFAULT_SURFACE,effect:'bokeh'},'math-settings':{...DEFAULT_SURFACE,effect:'neon'}};c.elementOverrides||={};c.elementOverrides['spelling-settings']={'setup-form':{effect:'noise',effectIntensity:.2,effectTrigger:'tap'}};c.studioPreferences={panelWidth:320,compact:true,hiddenSections:[],hiddenInspectorGroups:['geometry','shared']};validateConfig(c);const saved=projectContract(c,base),exported=optimizedTestConfig(saved).config;for(const value of [saved,exported]){assert.deepEqual(value.screenEffects,c.screenEffects);assert.deepEqual(value.elementOverrides,c.elementOverrides);assert.deepEqual(value.studioPreferences,c.studioPreferences);assert.equal(value.screenEffects['english-settings'],undefined);}
});
test('surface effects reject invalid triggers, unlimited counts and injected colors',()=>{
 for(const effect of Object.keys(SURFACE_EFFECTS))validateSurface({...DEFAULT_SURFACE,effect});
 for(const patch of [{effectDensity:33},{effectDensity:2.5},{effectIntensity:2},{effectColor:'red;display:none'},{effectTrigger:'mousemove'},{effect:'unknown'},{effectSpeed:Infinity}])assert.throws(()=>validateSurface(patch));
 const c=structuredClone(base);c.elementOverrides={'spelling-settings':{'setup-form':{effectDensity:1.5}}};assert.throws(()=>validateConfig(c));
});
test('production bubble and confetti defaults stay classic, with optional geometry transformation',()=>{
 assert.equal(DEFAULT_EFFECTS.bubble.renderer,'classic');assert.equal(DEFAULT_EFFECTS.bubble.look,'classic');assert.equal(DEFAULT_EFFECTS.bubble.transforms,false);assert.equal(DEFAULT_EFFECTS.correctStyle,'production');assert.equal(DEFAULT_EFFECTS.comboGlobal.enabled,false);assert.deepEqual(Object.entries(DEFAULT_EFFECTS.presets).filter(([,p])=>p.enabled).map(([id])=>id),['confetti']);
 const c=structuredClone(base);c.effects.bubble={...c.effects.bubble,look:'custom',transforms:true};validateConfig(c);assert.equal(c.effects.bubble.look,'custom');assert.equal(c.effects.bubble.transforms,true);
});
