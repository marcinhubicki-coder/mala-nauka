import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Production home uses compiled contract instead of DOM structure scanner',()=>{
 const runtime=source('shared/design-runtime.mjs');
 assert.match(runtime,/if\(!studioRuntime&&hasViewContract\(view\)\)/);
 assert.match(runtime,/if\(declared===viewContract\(view\)\.length\)return applyCompiledView\(root,settings,view\)/);
 assert.match(runtime,/if\(declared>0\)throw Error\('Incomplete compiled screen:/);
 assert.match(runtime,/inspectorLoader\?\?=import\('\.\/element-system\.mjs'\)/);
 assert.ok(runtime.includes("updateView(app,config,document.documentElement.dataset.dsView)"));
 assert.ok(runtime.includes("updateView(document.getElementById('app'),value,document.documentElement.dataset.dsView)"));
});
test('Contract rendering is bounded to declared attributes and preserves the rich theme/effects runtime',()=>{
 const compiled=source('shared/compiled-runtime.mjs');
 assert.match(compiled,/querySelectorAll\('\[data-ds-contract="v2"\]'\)/);
 assert.ok(!compiled.includes('blockIdentity('));
 assert.ok(!compiled.includes('MutationObserver('));
 for(const fn of ['visualValue','syncElementMotion','syncElementSurface','rememberPresence','syncScreenSurface'])assert.ok(compiled.includes(fn+'('));
});
test('Consumers include the shared contract and lightweight compiled runtime',()=>{
 const build=source('tools/build-design.mjs');
 assert.ok(build.includes("'shared/compiled-runtime.mjs'"));
 assert.ok(build.includes("'shared/view-contracts.mjs'"));
});
