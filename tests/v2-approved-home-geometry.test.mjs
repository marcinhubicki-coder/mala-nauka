import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const renderer=readFileSync(new URL('../home-screen.mjs',import.meta.url),'utf8');
test('Home geometry retains approved product reference, not editor recreation numbers',()=>{
 const expected=[
 'STATS=[10,940,833,210]',
 'HOME_MODES_BOUNDS=[26,1240,801,521]',
 'HOME_WELCOME_BOUNDS=[10,220,833,930]',
 'spelling:[26,1240,269,260]',
 'math:[295,1240,266,260]',
 'english:[560,1240,267,260]',
 'flags:[26,1499,398,262]',
 'reading:[428,1499,399,262]'
 ];
 for(const term of expected)assert.ok(renderer.includes(term),term);
 assert.match(renderer,/compileViewMarkup\('home'/);
});
