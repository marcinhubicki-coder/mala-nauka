import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visualValue as directStyle,elementCSS as directCSS} from '../shared/element-styles.mjs';
import {visualValue as legacyStyle,elementCSS as legacyCSS} from '../shared/element-system.mjs';

test('Studio and compiled PWA resolve the exact same styles and selectors',()=>{
 const config={elementStyles:{'block-button-home-card':{radius:31}},elementOverrides:{home:{'home-mode-spelling':{radius:20}}}};
 const item={id:'home-mode-spelling',kind:'button',recipe:'button-home-card',blockId:'block-button-home-card',mode:'spelling'};
 assert.deepEqual(directStyle(config,'home',item),legacyStyle(config,'home',item));
 assert.equal(directCSS(config),legacyCSS(config));
});
test('Style module has no scanner, DOM inventory or DOM mutation observer',()=>{
 const src=readFileSync(new URL('../shared/element-styles.mjs',import.meta.url),'utf8');
 for(const forbidden of ['annotateElements(','blockIdentity(','MutationObserver(','runtimeCatalog(','querySelectorAll('])assert.ok(!src.includes(forbidden),forbidden);
 const game=readFileSync(new URL('../shared/compiled-runtime.mjs',import.meta.url),'utf8');
 assert.ok(game.includes("from './element-styles.mjs'"));
});
