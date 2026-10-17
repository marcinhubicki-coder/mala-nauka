import test from 'node:test';
import assert from 'node:assert/strict';
import {staticViewInventory,compileViewMarkup,inheritedMode} from '../shared/view-contracts.mjs';
import {rawVisualValue,elementCSS} from '../shared/element-system.mjs';

test('Nested home components inherit their actual mode, not the last visited game',()=>{
 assert.equal(inheritedMode('home','home-spelling-name'),'spelling');
 assert.equal(inheritedMode('home','home-reading-badge-surface'),'reading');
 assert.equal(inheritedMode('home','home-hero'),'home');
 const card=staticViewInventory('home').find(row=>row.id==='home-spelling-name');
 assert.equal(card.mode,'spelling');
});
test('One Studio block style reaches PWA; a local exception affects exactly one instance',()=>{
 const config={elementStyles:{'block-button-home-card':{radius:32}},elementOverrides:{home:{'home-mode-spelling':{radius:20}}},familyStyles:{spelling:{'block-text-mode-name':{textColor:'#ff2288'}}}};
 const rows=staticViewInventory('home');
 const spelling=rows.find(x=>x.id==='home-mode-spelling');
 const reading=rows.find(x=>x.id==='home-mode-reading');
 assert.equal(rawVisualValue(config,'home',spelling).radius,20);
 assert.equal(rawVisualValue(config,'home',reading).radius,32);
 const nested=rows.find(x=>x.id==='home-spelling-name');
 assert.equal(rawVisualValue(config,'home',nested).textColor,'#ff2288');
 const css=elementCSS(config);
 assert.ok(css.includes('[data-ds-block="block-button-home-card"]'));
 assert.ok(css.includes('data-ds-element="home-mode-spelling"'));
 assert.ok(css.includes('data-ds-mode="spelling"'));
});
test('Compiled node inherits view-mode attributes with zero extra DOM inspection',()=>{
 const view='home';
 const nodes=staticViewInventory('home').filter(x=>x.id!=='layout-root');
 const input=nodes.map(x=>'<div data-ds-key="'+x.id+'" data-ds-recipe="'+x.recipe+'" data-ds-kind="'+x.kind+'"'+(x.action?' data-action="'+x.action+'"':'')+'></div>').join('');
 const markup=compileViewMarkup(view,input);
 assert.match(markup,/<div[^>]*data-ds-key="home-spelling-name"[^>]*data-ds-mode="spelling"/);
 assert.match(markup,/<div[^>]*data-ds-key="home-reading-name"[^>]*data-ds-mode="reading"/);
});
