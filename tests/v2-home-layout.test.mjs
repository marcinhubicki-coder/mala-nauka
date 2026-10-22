import test from 'node:test';
import assert from 'node:assert/strict';
import {HOME_RECTS,HOME_TILES,homeRect,homePosition,validateHomeLayout} from '../shared/home-layout.mjs';

test('Approved Home artboard geometry is canonically registered',()=>{
 assert.equal(Object.keys(HOME_RECTS).length,13);
 assert.deepEqual(HOME_TILES.spelling,[22,1140,254,215]);
 assert.deepEqual(homeRect({},'home-stats').rect,[22,905,809,150]);
 assert.ok(homePosition({},'home-mode-spelling').startsWith('left:0%'));
 assert.equal(validateHomeLayout({}),true);
});
test('Layout overrides move one card without modifying sibling geometry',()=>{
 const config={layoutOverrides:{home:{'home-mode-spelling':{x:34,w:255}}}};
 assert.equal(validateHomeLayout(config),true);
 assert.deepEqual(homeRect(config,'home-mode-spelling').rect,[34,1140,255,215]);
 assert.deepEqual(homeRect(config,'home-mode-math').rect,[299.5,1140,254,215]);
 assert.throws(()=>validateHomeLayout({layoutOverrides:{home:{'invented':{x:4}}}}),/Unknown/);
 assert.throws(()=>validateHomeLayout({layoutOverrides:{home:{'home-mode-spelling':{w:2000}}}}),/outside/);
});
