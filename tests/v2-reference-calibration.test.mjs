import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceAspect,referenceProfiles} from '../design-system/reference-calibration.mjs';
test('five approved production screenshots match 390x844 canvas',()=>{
 assert.equal(referenceAspect(946,2048).compatible,true);
 assert.equal(referenceAspect(1170,2532).compatible,true);
 assert.equal(referenceAspect(1008,958).compatible,false);
});
test('Studio keeps separate references for game and results states',()=>{
 for(const v of ['home','spelling-settings','spelling-initial','spelling-wrong','spelling-results'])assert.ok(referenceProfiles[v]);
});
