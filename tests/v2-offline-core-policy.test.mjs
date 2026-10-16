import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectOfflineCore} from '../tools/offline-core-policy.mjs';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Core policy follows static imports without loading Studio iframe inspectors',()=>{
 const paths=['index.html','app.js','shared/design-runtime.mjs','design-system/bridge.mjs','design-system/studio-bridge.mjs','design-system/studio.mjs','design-system/model.mjs','design-system/config.json','design-system/assets.json','design-system/rules.json','design-system/studio.css'];
 const source={ 'app.js':"import { foo } from './shared/design-runtime.mjs';",
 'shared/design-runtime.mjs':"import {x} from '../design-system/model.mjs';",
 'design-system/bridge.mjs':"if(new URLSearchParams(location.search).has('studio')) import('./studio-bridge.mjs');"
 };
 const list=selectOfflineCore(paths,p=>source[p]||'');
 for(const path of ['index.html','app.js','shared/design-runtime.mjs','design-system/model.mjs','design-system/bridge.mjs','design-system/config.json'])assert.ok(list.includes(path),path);
 for(const path of ['design-system/studio.mjs','design-system/studio-bridge.mjs','design-system/studio.css'])assert.ok(!list.includes(path),path);
});

test('Build pre-cache runtime excludes editor UI while keeping all needed data files',()=>{
 const sw=src('dist/sw.js');
 const core=JSON.parse(sw.match(/const CORE=(\[[\s\S]*?\]);/)[1]);
 assert.ok(core.includes('/shared/design-runtime.mjs'));
 assert.ok(core.includes('/design-system/model.mjs'));
 assert.ok(core.includes('/design-system/config.json'));
 assert.ok(core.includes('/design-system/bridge.mjs'));
 assert.ok(!core.includes('/design-system/studio.mjs'));
 assert.ok(!core.includes('/design-system/studio-bridge.mjs'));
 assert.ok(!core.includes('/design-system/studio.css'));
});
