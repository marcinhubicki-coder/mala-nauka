import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_LOGO_TRANSITION,logoTiming,logoFrame,validateLogoTransition} from '../shared/logo-transition.mjs';
import {readFile} from 'node:fs/promises';
test('five logo shapes finish two complete rotations at 4 seconds before splash',()=>{
 const timing=logoTiming(DEFAULT_LOGO_TRANSITION);assert.equal(timing.orbit,4000);assert.equal(logoFrame({},390,844,3999).stage,'Obrót');assert.equal(logoFrame({},390,844,4001).stage,'Kolorowe bloby');assert.equal(logoFrame({},390,844,3000).shapes.length,5);
});
test('every aspect ratio produces finite paths, complete color coverage and a finite reveal',()=>{
 for(const [w,h]of [[390,844],[844,390],[1440,900]]){const t=logoTiming({},w,h);for(const ms of [0,2000,4000,4500,t.white,t.reveal,t.total]){const frame=logoFrame({},w,h,ms);assert.equal(frame.shapes.length,5);assert.ok(frame.shapes.every(s=>!s.d.includes('NaN')));if(ms>=t.white)assert.equal(frame.covered,true);if(ms===t.total)assert.equal(frame.reveal,1);}}
});
test('animation config rejects unbounded values and malformed colors',()=>{
 assert.throws(()=>validateLogoTransition({turnDuration:Infinity}));assert.throws(()=>validateLogoTransition({colors:['red']}));assert.throws(()=>validateLogoTransition({revealAt:.2}));assert.deepEqual(validateLogoTransition({}),DEFAULT_LOGO_TRANSITION);
});
test('all real entry screens share the finite runtime and no separate logo asset',async()=>{
 for(const name of ['index.html','ortografia/index.html','angielski/index.html','flagi/index.html','czytanie/index.html','matematyka/index.html']){const s=await readFile(new URL('../'+name,import.meta.url),'utf8');assert.match(s,/boot-ui.mjs/);assert.match(s,/<div id="mn-preloader"[^>]+><\/div>/);}
});
