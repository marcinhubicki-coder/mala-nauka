import test from 'node:test';
import assert from 'node:assert/strict';
import {listEditableBlocks} from '../tools/studio-engine.mjs';
import {ATOM_TYPE_IDS} from '../shared/atom-vocabulary.mjs';
import {readFileSync} from 'node:fs';

test('Headless engine searches 41 real screens using canonical atom responsibilities',()=>{
 assert.equal(ATOM_TYPE_IDS.length,13);
 const buttons=listEditableBlocks({atom:'button',limit:1000});
 const texts=listEditableBlocks({atom:'text',limit:1000});
 assert.ok(buttons.length>40);
 assert.ok(texts.length>100);
 assert.ok(buttons.every(item=>item.atomType==='button'));
 assert.ok(texts.every(item=>item.atomType==='text'));
 assert.ok(buttons.some(x=>x.view==='spelling-results'&&x.recipe==='button-back'));
 assert.throws(()=>listEditableBlocks({atom:'invented'}),/Unknown atom type/);
});
test('Studio and headless CLI expose one atom taxonomy',()=>{
 const src=readFileSync(new URL('../design-system/studio-blocks-v2.mjs',import.meta.url),'utf8');
 assert.match(src,/data-block-atom/);
 assert.match(src,/atomTypeFor\(r\)/);
});
