import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('Consumer build brings the versioned snapshot of real Studio screens',()=>{
 const src=readFileSync(new URL('../tools/build-design.mjs',import.meta.url),'utf8');
 assert.ok(src.includes("'design-system/view-inventory-snapshots.mjs'"));
 const target=readFileSync(new URL('../design-system/view-inventory-snapshots.mjs',import.meta.url),'utf8');
 assert.match(target,/VIEW_SNAPSHOT_IDS/);
});
