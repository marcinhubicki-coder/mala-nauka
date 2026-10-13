import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceAspect,referenceProfiles,referenceViewForFile,referenceStorageKey} from '../design-system/reference-calibration.mjs';
test('five approved production screenshots match 390x844 canvas',()=>{
 assert.equal(referenceAspect(946,2048).compatible,true);
 assert.equal(referenceAspect(1170,2532).compatible,true);
 assert.equal(referenceAspect(1008,958).compatible,false);
});
test('Studio keeps separate references for game and results states',()=>{
 for(const v of ['home','spelling-settings','spelling-initial','spelling-wrong','spelling-results'])assert.ok(referenceProfiles[v]);
});

test('batch import maps the five production screenshots, not the cropped V1 detail',()=>{
 const names={IMG_2946:'home',IMG_2947:'spelling-settings',IMG_2948:'spelling-wrong',IMG_2949:'spelling-wrong-complete',IMG_2950:'spelling-results'};
 for(const [filename,view] of Object.entries(names))assert.equal(referenceViewForFile(filename+'.png'),view);
 assert.equal(referenceViewForFile('IMG_2950.PNG'),'spelling-results');
 assert.equal(referenceViewForFile('image(20261013-071221).png'),null);
 assert.equal(referenceViewForFile('IMG_2949.png')==='spelling-initial',false);
 assert.equal(referenceStorageKey('spelling-wrong'),'spelling-wrong');
 assert.equal(referenceStorageKey('spelling-wrong','complete'),'spelling-wrong-complete');
});
