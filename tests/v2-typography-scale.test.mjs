import {resolveBehaviorConfig} from '../shared/behaviors.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TYPE_STYLE_IDS,TYPE_STYLES,validateTypeScale,resolvedTypeScale,typeScaleCSS,typeStyleDeclaration} from '../shared/type-system.mjs';
import {elementCSS,validateElementStyles,rawVisualValue} from '../shared/element-styles.mjs';
import {validateConfig,configCSS,changedViews} from '../design-system/model.mjs';
import {planStyleEdit,planTypeScaleEdit,planDesignBatch} from '../tools/studio-engine.mjs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const original=resolveBehaviorConfig(JSON.parse(source('design-system/config.json')));

test('Text has precisely H1-H9 and Body visual tokens, not extra HTML tags',()=>{
 assert.deepEqual(TYPE_STYLE_IDS,['h1','h2','h3','h4','h5','h6','h7','h8','h9','body']);
 assert.equal(new Set(TYPE_STYLE_IDS).size,10);
 assert.ok(TYPE_STYLE_IDS.every(id=>TYPE_STYLES[id].size>=10&&TYPE_STYLES[id].lineHeight>1));
 assert.ok(TYPE_STYLES.h1.size>TYPE_STYLES.h9.size);
 assert.equal(validateTypeScale({}),true);
});
test('Existing config stays valid and produces only opt-in type selectors',()=>{
 assert.equal(validateConfig(original)?.revision,original.revision);
 const css=configCSS(original);
 assert.match(css,/--ds-type-h1-size:44px/);
 assert.match(css,/--ds-type-body-size:16px/);
 assert.ok(!elementCSS(original).includes('--ds-type-h1-size'));
 assert.deepEqual(resolveBehaviorConfig(JSON.parse(source('design-system/config.json'))).typography,original.typography);
});
test('A single H2 token changes every H2 assignment but no other text instance',()=>{
 const initial=structuredClone(original);
 const headline=planStyleEdit(initial,{view:'home',id:'home-headline',property:'typeStyle',value:'h2'});
 const other=planStyleEdit(headline.config,{view:'home',id:'home-adventure-title',property:'typeStyle',value:'h2'});
 const changed=planTypeScaleEdit(other.config,{style:'h2',property:'size',value:40});
 const css=configCSS(changed.config);
 assert.match(css,/--ds-type-h2-size:40px/);
 assert.match(css,/data-ds-element="home-headline"[^}]*var\(--ds-type-h2-size\)/);
 assert.match(css,/data-ds-element="home-adventure-title"[^}]*var\(--ds-type-h2-size\)/);
 assert.ok(!css.includes('data-ds-element="home-greeting"][^}]*var(--ds-type-h2-size)'));
 assert.equal(rawVisualValue(changed.config,'home',{id:'home-headline',recipe:'text-home-headline',kind:'text'}).typeStyle,'h2');
 assert.equal(rawVisualValue(changed.config,'home',{id:'home-greeting',recipe:'text-home-greeting',kind:'text'}).typeStyle,undefined);
 assert.equal(initial.elementOverrides?.home?.['home-headline']?.typeStyle,undefined);
});
test('Invalid type properties and assignments are rejected before saving',()=>{
 assert.throws(()=>validateTypeScale({typeScale:{h10:{size:16}}}),/Nieznany/);
 assert.throws(()=>validateTypeScale({typeScale:{h1:{size:900}}}),/Nieprawidłowy/);
 assert.throws(()=>validateElementStyles({elementStyles:{text:{typeStyle:'h10'}}}),/Nieznany styl typografii/);
 assert.throws(()=>planTypeScaleEdit({}, {style:'h3',property:'fontRole',value:'comic'}),/Nieprawidłowa rola/);
 assert.throws(()=>planTypeScaleEdit({}, {style:'body',property:'tracking',value:30}),/Nieprawidłowy/);
 assert.throws(()=>planDesignBatch({},[{type:'typography',style:'h2',property:'size',value:34},{type:'typography',style:'h2',property:'size',value:500}]),/step 2 rejected/);
});
test('Studio and headless engine share the type tokens, no extra Text implementations',()=>{
 const studio=source('design-system/studio.mjs'),library=source('design-system/studio-blocks-v2.mjs');
 assert.ok(studio.includes('data-type-scale-role'));
 assert.ok(library.includes('data-block-field=typeStyle'));
 const batch=planDesignBatch({elementStyles:{},elementOverrides:{}},[
 {type:'typography',style:'h4',property:'size',value:31},
 {type:'style',view:'home',id:'home-headline',property:'typeStyle',value:'h4'}
 ]);
 assert.equal(batch.config.typeScale.h4.size,31);
 assert.equal(batch.config.elementOverrides.home['home-headline'].typeStyle,'h4');
 assert.ok(typeStyleDeclaration('h4').includes('--ds-type-h4-family'));
 assert.equal(resolvedTypeScale(batch.config).h4.size,31);
 assert.ok(typeScaleCSS(batch.config).includes('--ds-type-h4-size:31px'));
});
test('Type scale edits mark the views dirty while preserving previously approved layout',()=>{
 const changed=changedViews([{path:'typeScale.h3.size',before:34,after:33}],{views:[{id:'home',mode:'spelling',components:[]},{id:'spelling-settings',mode:'spelling',components:[]}]});
 assert.equal(changed.length,2);
 assert.ok(source('shared/home-layout.mjs').includes('HOME_TILES'));
});
