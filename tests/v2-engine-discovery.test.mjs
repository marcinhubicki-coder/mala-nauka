import test from 'node:test';
import assert from 'node:assert/strict';
import {listEditableBlocks,findEditableBlock} from '../tools/studio-engine.mjs';
test('Search discovers actual registered BackButton instances across screens',()=>{
 const rows=listEditableBlocks({query:'powrot',kind:'button',limit:100});
 assert.ok(rows.length>5);
 assert.ok(rows.some(row=>row.view==='spelling-results'&&row.recipe==='button-back'));
 for(const row of rows)assert.ok(findEditableBlock(row.view,row.id));
});
test('Listing shows both migrated and legacy view scopes',()=>{
 const home=listEditableBlocks({view:'home',limit:200});
 assert.ok(home.some(row=>row.id==='home-mode-spelling'&&!row.legacyAdapter));
 const result=listEditableBlocks({view:'spelling-results',query:'button-back',limit:30});
 assert.ok(result.some(row=>row.legacyAdapter&&row.recipe==='button-back'));
 assert.throws(()=>listEditableBlocks({view:'invented'}),/Unknown/);
 assert.throws(()=>listEditableBlocks({limit:2000}),/Limit/);
});
