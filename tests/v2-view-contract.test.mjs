import test from 'node:test';
import assert from 'node:assert/strict';
import {viewContract,staticViewInventory,validateViewContract,compileViewMarkup} from '../shared/view-contracts.mjs';
test('Home has a stable, acyclic, declared component tree',()=>{
 assert.ok(validateViewContract('home'));
 const items=staticViewInventory('home');
 assert.ok(items.length>=65);
 assert.equal(new Set(items.map(i=>i.id)).size,items.length);
 const names=items.filter(i=>i.action==='choose-mode').map(i=>i.mode).sort();
 assert.deepEqual(names,['english','flags','math','reading','spelling']);
 for(const row of items.filter(i=>i.recipe==='button-home-card'))assert.equal(row.parent,'home-modes');
});
test('Compiler adds stable attrs without layout or content changes',()=>{
 const original='<button data-ds-key="home-settings" data-ds-recipe="button-home-settings" data-ds-kind="button" data-action="settings">Wróć</button>';
 assert.throws(()=>compileViewMarkup('home',original),/omitted/);
 const skeleton=viewContract('home').map(item=>'<span data-ds-key="'+item.id+'" data-ds-recipe="'+item.recipe+'" data-ds-kind="'+item.kind+'"'+(item.action?' data-action="'+item.action+'"':'')+'></span>').join('');
 const generated=compileViewMarkup('home',skeleton);
 assert.equal((generated.match(/data-ds-contract="v2"/g)||[]).length,viewContract('home').length);
 const clean=generated.replace(/ data-ds-contract="v2" data-ds-element="[^"]+" data-ds-block="[^"]+" data-ds-state="default"(?: data-ds-mode="[^"]+")?(?: data-ds-atomic="true")?/g,'');
 assert.equal(clean,skeleton);
 assert.throws(()=>compileViewMarkup('home',skeleton+'<i data-ds-key="home-welcome" data-ds-recipe="family-home-welcome" data-ds-kind="container"></i>'),/duplicate/);
});
test('No hash or renderer scanning is needed to build the home inventory',()=>{
 const inventory=staticViewInventory('home');
 assert.ok(inventory.every(item=>!item.blockId?.includes('undefined')));
 assert.equal(inventory.find(item=>item.id==='home-headline').blockId,'block-text-home-headline');
});
