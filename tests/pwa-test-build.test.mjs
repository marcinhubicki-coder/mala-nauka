import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {optimizedTestConfig,optimizeBubbleSource,optimizeIndexHTML,TEST_PWA_BRANCH} from '../design-system/pwa-test-build.mjs';
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
 assert.equal(config.effects.bubble.frameRate,15);
 assert.equal(config.effects.bubble.transitionBlur,0);
 assert.equal(TEST_PWA_BRANCH,'studio/pwa-test');
});
test('Test PWA drops no-op optical filters',async()=>{
 const source=await readFile(new URL('../spelling/bubble.mjs',import.meta.url),'utf8');
 const optimized=optimizeBubbleSource(source);
 assert.match(optimized,/opticalFiltersEnabled/);
 assert.doesNotMatch(optimized,/\{opacity:1,filter:'blur\(0px\) hue-rotate\(0deg\)'/);
 assert.match(optimizeIndexHTML('<head></head>'),/pwa-optimized\.css/);
});
