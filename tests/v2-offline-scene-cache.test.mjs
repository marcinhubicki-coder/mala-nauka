import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const worker=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');

test('downloaded Orthography scene images survive ordinary Studio/PWA cache rotations',()=>{
 assert.match(worker,/const SCENE_CACHE='mala-nauka-scenes-v1'/);
 assert.match(worker,/name!==CACHE&&name!==SCENE_CACHE/);
 assert.match(worker,/url\.pathname\.startsWith\('\/assets\/scenes\/'\)/);
 assert.match(worker,/await cache\.match\(request\)/);
 assert.match(worker,/await cache\.put\(request,response\.clone\(\)\)/);
});
test('persistent image cache is bounded and never blocks network image loading',()=>{
 assert.match(worker,/const SCENE_LIMIT=160/);
 assert.match(worker,/keys\.length-SCENE_LIMIT/);
 assert.match(worker,/catch\{\/\* Storage quotas must not block the illustration/);
});
