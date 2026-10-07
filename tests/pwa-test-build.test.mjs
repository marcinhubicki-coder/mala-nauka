import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {optimizedTestConfig,optimizeBubbleSource,optimizeIndexHTML,optimizeRuntimeSource,assertVisibilityReadyForProduction,TEST_PWA_BRANCH} from '../design-system/pwa-test-build.mjs';
import {elementCSS} from '../shared/element-system.mjs';
const fixture=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url),'utf8'));

test('Test PWA honors draft visibility in mobile build',()=>{
 const base=structuredClone(fixture);
 base.project||={};
 base.project.designDraft={...base.project.designDraft,elementOverrides:{'spelling-settings':{'demo-element':{visibility:'hidden'},'demo-remove':{visibility:'removed'}}},elementStyles:{'button-main':{visibility:'removed'}}};
 const {config,report}=optimizedTestConfig(base);
 assert.equal(config.elementOverrides['spelling-settings']['demo-element'].visibility,'hidden');
 assert.equal(config.elementOverrides['spelling-settings']['demo-remove'].visibility,'removed');
 assert.equal(config.elementStyles['button-main'].visibility,'removed');
 const css=elementCSS(config);
 assert.match(css,/data-ds-element="demo-element"\]\{visibility:hidden!important;/);
 assert.match(css,/data-ds-element="demo-remove"\]\{display:none!important;/);
 assert.equal(report.hidden.length,3);
 assert.equal(config.effects.bubble.frameRate,base.effects.bubble.frameRate);
 assert.equal(config.effects.bubble.transitionBlur,base.effects.bubble.transitionBlur);
 assert.equal(config.effects.particleBudget,base.effects.particleBudget);
 assert.equal(report.optimization,'mobile-v2-full-effects');
 assert.equal(TEST_PWA_BRANCH,'studio/pwa-test');
});
test('Test PWA drops no-op optical filters',async()=>{
 const source=await readFile(new URL('../spelling/bubble.mjs',import.meta.url),'utf8');
 const optimized=optimizeBubbleSource(source);
 assert.match(optimized,/opticalFiltersEnabled/);
 assert.doesNotMatch(optimized,/\{opacity:1,filter:'blur\(0px\) hue-rotate\(0deg\)'/);
 assert.match(optimizeIndexHTML('<head></head>'),/pwa-optimized\.css/);
 assert.equal(optimized,source,'Studio and exported PWA must share the production renderer');
 assert.equal(optimizeBubbleSource(optimized),optimized,'Transformation must be idempotent');
 const check=spawnSync(process.execPath,['--check','--input-type=module'],{input:optimized,encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);

});

test('release refuses to lose visibility edits not approved in active design',()=>{
 const config=structuredClone(fixture);
 config.project||={};
 config.project.designDraft={elementOverrides:{home:{'hidden-in-editor':{visibility:'removed'}}}};
 assert.throws(()=>assertVisibilityReadyForProduction(config),/Publikacja zablokowana/);
 config.elementOverrides={home:{'hidden-in-editor':{visibility:'removed'}}};
 assert.equal(assertVisibilityReadyForProduction(config),1);
});
test('runtime optimization leaves canonical config available for Studio',async()=>{
 const runtime=await readFile(new URL('../shared/design-runtime.mjs',import.meta.url),'utf8');
 const result=optimizeRuntimeSource(runtime);
 assert.match(result,/pwa-runtime-config\.json/);
 assert.match(result,/design-system\/config\.json/);
 assert.match(result,/mn-pwa-build/);
});
