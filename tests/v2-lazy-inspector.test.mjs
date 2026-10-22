import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Home runtime never statically imports the DOM scanner',()=>{
 for(const path of ['shared/design-runtime.mjs','shared/state-motion.mjs','shared/component-recipes.mjs','design-system/model.mjs','shared/compiled-runtime.mjs']){
  const module=source(path);
  assert.doesNotMatch(module,/^import .*from ['"](?:\.\.\/)?(?:shared\/)?element-system\.mjs['"]/m,path);
 }
 const runtime=source('shared/design-runtime.mjs');
 assert.match(runtime,/inspectorLoader\?\?=import\('\.\/element-system\.mjs'\)/);
 assert.match(runtime,/hasViewContract\(view\)\)/);
 assert.match(runtime,/declared===viewContract\(view\)\.length/);
});
test('Legacy view adapter checks for stale revision before attaching inspector effects',()=>{
 const src=source('shared/design-runtime.mjs');
 assert.ok(src.includes('config!==settings'));
 assert.ok(src.includes('document.documentElement.dataset.dsView!==view'));
});
