import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {viewContract,viewAttrs,validateViewContract,compileViewMarkup,staticViewInventory} from '../shared/view-contracts.mjs';
import {PART_BY_ID} from '../shared/structure-model.mjs';

test('First-player screen is one declared family of reusable atoms and groups',()=>{
 const items=viewContract('players-empty');
 assert.equal(items.length,11);
 assert.equal(validateViewContract('players-empty'),true);
 assert.equal(items.filter(item=>item.level==='family').length,1);
 assert.equal(items.filter(item=>item.kind==='button').length,2);
 for(const item of items)assert.ok(PART_BY_ID[item.recipe],item.recipe);
 assert.deepEqual(items.filter(item=>item.kind==='button').map(item=>item.action),['add-player','guest-player']);
 const inventory=staticViewInventory('players-empty');
 assert.equal(inventory.length,12);
 assert.equal(inventory.filter(row=>row.kind==='button').length,2);
});
test('Both independent buttons must exist in a compiled player screen',()=>{
 const elements=viewContract('players-empty').map(item=>'<div '+viewAttrs('players-empty',item.id)+(item.action?' data-action="'+item.action+'"':'')+'></div>').join('');
 const compiled=compileViewMarkup('players-empty',elements);
 assert.equal((compiled.match(/data-ds-contract="v2"/g)||[]).length,11);
 assert.match(compiled,/data-ds-element="player-add"/);
 assert.match(compiled,/data-ds-element="player-guest"/);
 assert.throws(()=>compileViewMarkup('players-empty',elements.replace(/<div [^>]*data-ds-key="player-guest"[^>]*><\/div>/,'')),/omitted/);
});
test('Player renderer uses compilation only when creating the first profile',()=>{
 const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(source,/root\.innerHTML=hasPlayers\?markup:compileViewMarkup\('players-empty',markup\)/);
 assert.match(source,/emptyAttrs\('player-add'\)/);
 assert.match(source,/emptyAttrs\('player-guest'\)/);
});
