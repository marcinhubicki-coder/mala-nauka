import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {viewContract,viewAttrs,validateViewContract,compileViewMarkup,staticViewInventory} from '../shared/view-contracts.mjs';
import {PART_BY_ID} from '../shared/structure-model.mjs';
import {profileAvatar} from '../shared/profile-parts.mjs';
const blocks=viewContract('player-create');
test('New-player screen is 25 declared blocks: one family, twelve avatar choices and separate submit action',()=>{
 assert.equal(validateViewContract('player-create'),true);
 assert.equal(blocks.length,25);
 assert.equal(blocks.filter(x=>x.level==='family').length,1);
 assert.deepEqual(blocks.filter(x=>x.action==='choose-avatar').map(x=>x.id),'abcdefghijkl'.split('').map(x=>'create-avatar-'+x));
 assert.equal(blocks.find(x=>x.id==='create-submit')?.action,'submit-player-form');
 assert.equal(blocks.find(x=>x.id==='create-back')?.action,'players');
 assert.equal(staticViewInventory('player-create').length,26);
 for(const row of blocks)assert.ok(PART_BY_ID[row.recipe],row.recipe);
});
test('Contract compiler requires every avatar button as an independent action',()=>{
 const html=blocks.map(b=>'<div '+viewAttrs('player-create',b.id)+(b.action?' data-action="'+b.action+'"':'')+'></div>').join('');
 assert.equal((compileViewMarkup('player-create',html).match(/data-ds-contract="v2"/g)||[]).length,25);
 assert.throws(()=>compileViewMarkup('player-create',html.replace('data-ds-key="create-avatar-l"','data-ds-key="create-avatar-X"')),/undeclared/i);
 assert.throws(()=>compileViewMarkup('player-create',html.replace('data-action="submit-player-form"','data-action="not-submit"')),/Action mismatch/i);
});
test('Shared avatar atom can receive trusted instance identity without duplicating renderer',()=>{
 const markup=profileAvatar({avatarId:'k'},'player-avatar-large',undefined,viewAttrs('player-create','create-preview'));
 assert.match(markup,/data-ds-key="create-preview"/);
 assert.match(markup,/src="\/assets\/brand\/avatars\/k\.webp"/);
 assert.match(markup,/class="player-avatar-image"/);
});
test('Existing edit flow retains its separate back destination and form submission',()=>{
 const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(source,/const editing=editingProfile&&activePlayer/);
 assert.match(source,/const attrs=id=>editing\?'':viewAttrs\('player-create',id\)/);
 assert.match(source,/root\.innerHTML=editing\?markup:compileViewMarkup\('player-create',markup\)/);
 assert.match(source,/const navigation=editing\?pageHead\(title,back\)/);
 assert.match(source,/data-action="submit-player-form"/);
 assert.match(source,/root\.addEventListener\('submit',async e=>/);
});
