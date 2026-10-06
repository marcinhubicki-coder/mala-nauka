import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {COMBO_GLOBAL_STYLES,COMBO_GLOBAL_DEFAULTS,nextComboStyle} from '../spelling/combo-global.mjs';

test('global combo cycles three distinct looks instead of repeating particle showers',()=>{
 let index=-1;
 const results=[];
 for(let i=0;i<9;i++){const result=nextComboStyle(index);index=result.index;results.push(result.style);}
 assert.deepEqual(results,[...COMBO_GLOBAL_STYLES,...COMBO_GLOBAL_STYLES,...COMBO_GLOBAL_STYLES]);
 assert.equal(nextComboStyle(index,'tri-wave').style,'tri-wave');
 assert.equal(COMBO_GLOBAL_DEFAULTS.enabled,true);
});
test('global combo animates only opacity/transform; not SVG filter or clip-path',async()=>{
 const css=await readFile(new URL('../spelling/combo-global.css',import.meta.url),'utf8');
 const source=await readFile(new URL('../spelling/combo-global.mjs',import.meta.url),'utf8');
 const art=await readFile(new URL('../spelling/art.mjs',import.meta.url),'utf8');
 const chunks=css.match(/@keyframes [^{]+\{(?:[^{}]*\{[^{}]*\})+\}/g)||[];
 assert.ok(chunks.length>=4);
 for(const keyframes of chunks)assert.doesNotMatch(keyframes,/(?:filter|clip-path|border-radius|box-shadow|background)\s*:/);
 assert.doesNotMatch(source,/\b(?:requestAnimationFrame|setInterval|MutationObserver)\s*\(/);
 assert.match(art,/createComboGlobalEffects/);
 assert.match(art,/stopComboGlobal/);
});
