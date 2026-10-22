import test from 'node:test';
import assert from 'node:assert/strict';
import {HOME_RECTS,HOME_TILES,homePosition} from '../shared/home-layout.mjs';
import {readFileSync} from 'node:fs';
test('Home geometry originates from one approved source and reaches the renderer',()=>{
 const renderer=readFileSync(new URL('../home-screen.mjs',import.meta.url),'utf8');
 const runtime=readFileSync(new URL('../shared/design-runtime.mjs',import.meta.url),'utf8');
 assert.deepEqual(HOME_TILES.spelling,[22,1140,254,215]);
 assert.deepEqual(HOME_RECTS['home-stats'].rect,[22,905,809,150]);
 assert.ok(homePosition({},'home-mode-reading').includes('width:'));
 assert.match(renderer,/homePosition\(layout\(\),'home-modes'\)/);
 assert.match(renderer,/homePosition\(layout\(\),'home-stats'\)/);
 assert.match(renderer,/compileViewMarkup\('home'/);
 assert.match(runtime,/applyHomeGeometry\(root,settings\)/);
});
