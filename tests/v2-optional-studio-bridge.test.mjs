import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Game bridge has no eager inspector dependencies and keeps visual editor optional',()=>{
 const bootstrap=source('design-system/bridge.mjs');
 assert.ok(bootstrap.length<500);
 assert.match(bootstrap,/has\('studio'\)/);
 assert.match(bootstrap,/import\('\.\/studio-bridge\.mjs'\)/);
 assert.doesNotMatch(bootstrap,/^import .*from/m);
 const inspector=source('design-system/studio-bridge.mjs');
 assert.match(inspector,/annotateElements/);
 assert.match(inspector,/inventory-request/);
 assert.match(inspector,/channel:'mala-nauka-studio'/);
});
test('Consumer release also knows the optional inspector entrypoint',()=>{
 const build=source('tools/build-design.mjs');
 assert.ok(build.includes("'design-system/studio-bridge.mjs'"));
});
