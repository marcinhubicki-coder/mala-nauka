import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_WORD_TRANSITION,localPieceRoute,MAX_WORD_PIECES} from '../spelling/word-particles.mjs';
import {normalizeEffectsConfig,validateEffects,DEFAULT_EFFECTS} from '../spelling/effect-model.mjs';
test('organic local routes stay bounded by the selected spread',()=>{const a={x:10,y:20},b={x:50,y:80},c={...DEFAULT_WORD_TRANSITION,spread:40,randomness:.8};for(const r of [0,.3,.7,1]){const p=localPieceRoute(a,b,c,()=>r);assert.ok(Math.hypot(p.x-30,p.y-50)<=32.0001);}assert.equal(DEFAULT_WORD_TRANSITION.piecesPerLetter,20);assert.equal(MAX_WORD_PIECES,576);});
test('word tile settings validate tuning and bounded piece density',()=>{validateEffects(normalizeEffectsConfig({...DEFAULT_EFFECTS,wordTransition:{piecesPerLetter:48,duration:1800,chromatic:4,jitter:3,spread:0,drift:1200}}));for(const patch of [{piecesPerLetter:49},{chromatic:5},{jitter:4},{drift:1201}])assert.throws(()=>validateEffects(normalizeEffectsConfig({...DEFAULT_EFFECTS,wordTransition:patch})));});

test('enabled neutral shape activates a visible cycle without changing saved configuration',()=>{const value={...DEFAULT_EFFECTS,bubble:{...DEFAULT_EFFECTS.bubble,transforms:true,shape:'bubble'}};assert.equal(normalizeEffectsConfig(value).bubble.shape,'cycle');assert.equal(value.bubble.shape,'bubble');assert.equal(normalizeEffectsConfig(DEFAULT_EFFECTS).bubble.shape,'bubble');});
