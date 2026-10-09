import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PARTS,PART_BY_ID,ATOMS,recipeLineage,structureCatalog,viewParts,selectionStack} from '../shared/structure-model.mjs';
import {visualValue,elementCSS} from '../shared/element-system.mjs';
import {viewIdFor,validateConfig} from '../design-system/model.mjs';
import {STARTUP_LINKS,startupLinks,resolveRoute,validateNavigation,playerSelectionSettings} from '../shared/navigation.mjs';
import {designFields} from '../design-system/project-model.mjs';
const registry=JSON.parse(await readFile(new URL('../design-system/registry.json',import.meta.url)));
const config=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url)));
test('every declared block has a unique identity, children, selector and acyclic inheritance',()=>{
 assert.equal(new Set(PARTS.map(p=>p.id)).size,PARTS.length);
 for(const p of PARTS){assert.ok(p.selector);assert.ok(['atom','group'].includes(p.level));for(const id of p.children)assert.ok(PART_BY_ID[id],`${p.id} → ${id}`);const chain=recipeLineage(p.id);assert.equal(new Set(chain).size,chain.length);if(p.inherits)assert.ok(PART_BY_ID[p.inherits]);}
 assert.deepEqual(recipeLineage('control-pin'),['control-jelly','control-pin']);
 assert.deepEqual(recipeLineage('control-pin-key'),['button-main','control-pin-key']);
});
test('startup families include real logo, separate illustrations, name input, PIN and keyboard',()=>{
 const catalog=structureCatalog(registry),ids=new Set(catalog.map(p=>p.id));
 for(const id of ['image-player-brand-art','image-player-empty-art','image-player-avatar-art','input-player-name','control-pin','container-pin-keypad','control-pin-key','icon-step-dot','container-field-title','view:players-empty','view:player-unlock'])assert.ok(ids.has(id),id);
 for(const id of Object.keys(ATOMS))assert.ok(ids.has('text-role-'+id));
 for(const v of registry.views)assert.ok(ids.has('view:'+v.id));
 assert.ok(catalog.find(p=>p.id==='control-pin').uses.some(u=>u.view==='player-pin'));
 assert.ok(catalog.find(p=>p.id==='image-mn-soap-picture').uses.some(u=>u.view==='spelling-initial'));
});
test('the runtime hierarchy replaces descriptions, retaining hidden and previously unknown parts',()=>{
 const v=registry.views.find(v=>v.id==='player-pin'),items=[{id:'layout-root'}, {id:'pin-card',parent:'layout-root',recipe:'container-pin-card',kind:'container',label:'PIN'}, {id:'custom',parent:'pin-card',recipe:'container-new-group',kind:'container',label:'Nowa grupa'}, {id:'custom-image',parent:'custom',recipe:'image-new-photo',kind:'image',label:'Zdjęcie',visible:false}];
 const before=JSON.stringify(PARTS),inventory=new Map([[v.id,{items}]]),parts=viewParts(v,{items}),catalog=structureCatalog(registry,inventory);
 assert.equal(parts[0].children[0].children[0].kind,'image');
 assert.equal(catalog.find(p=>p.id==='image-new-photo').level,'atom');
 assert.equal(catalog.find(p=>p.id==='container-new-group').level,'group');
 assert.equal(catalog.find(p=>p.id==='image-new-photo').uses[0].selector,'[data-ds-element="custom-image"]');
 assert.deepEqual(selectionStack(v,items.at(-1),items).map(p=>p.level),['family','group','group','atom']);
 assert.equal(JSON.stringify(PARTS),before,'reading inventories must not mutate definitions');
});
test('PIN inherits jelly, then palette, variant, instance and visible-state exceptions',()=>{
 const c={elementStyles:{toggle:{opacity:.8},'control-jelly':{radius:24,padding:5,enterAnimation:'fade'},'control-pin':{radius:20}},familyStyles:{spelling:{'control-jelly':{background:'#aabbcc'}}},elementOverrides:{'player-pin':{'pin-mode':{padding:7}}},elementStates:{'player-pin':{'no-pin':{'pin-mode':{height:52}}}}};
 const style=visualValue(c,'player-pin',{kind:'toggle',id:'pin-mode',recipe:'control-pin',mode:'spelling',state:'no-pin'});
 assert.deepEqual(style,{opacity:.8,radius:20,padding:7,enterAnimation:'fade',background:'#aabbcc',height:52});
 const css=elementCSS(c);assert.match(css,/data-ds-recipe="control-pin"[^}]*radius:20px/);
 assert.match(css,/html\[data-ds-view="player-pin"\] :is\(#app,body\) \[data-ds-element\]\[data-ds-element="pin-mode"\]/);
 assert.ok(css.indexOf('data-ds-component-state="no-pin"')>css.indexOf('data-mode="spelling"'));
});
test('all profile routes have explicit conditions and preserve protected intermediate steps',()=>{
 assert.equal(startupLinks('players-empty').length,startupLinks('players').length);
 for(const edge of STARTUP_LINKS)assert.ok(edge.fixed||edge.targets?.includes(edge.to));
 assert.equal(resolveRoute({},'players','enter-player','spelling'),'home');
 assert.equal(resolveRoute({},'player-create','submit-name','spelling'),'player-pin');
 assert.equal(resolveRoute({},'player-unlock','unlock-player','spelling'),'home');
 assert.throws(()=>validateNavigation({routes:{'players--choose-pin':'home'}}));
 assert.throws(()=>validateNavigation({routes:{'player-create--submit-name':'home'}}));
 assert.throws(()=>validateNavigation({routes:{'player-unlock--unlock-player':'players'}}));
 assert.equal(viewIdFor({view:'player-pin',pinPurpose:'unlock'}),'player-unlock');
 assert.equal(viewIdFor({view:'player-pin',pinPurpose:'create'}),'player-pin');
});
test('player fade settings and edited routes survive Studio snapshots and reject invalid ranges',()=>{
 const c=structuredClone(config);c.navigation={routes:{'player-pin--submit-pin':'progress'},playerSelection:{autoContinue:false,delay:500,fadeDuration:350,otherOpacity:.2}};
 validateConfig(c);assert.deepEqual(designFields(c).navigation,c.navigation);
 assert.equal(resolveRoute(c,'player-pin','submit-pin','spelling'),'progress');
 assert.equal(playerSelectionSettings({}).autoContinue,true);
 for(const entry of [{delay:2001},{fadeDuration:-1},{otherOpacity:1.1},{autoContinue:'yes'},{unknown:1}])assert.throws(()=>validateNavigation({routes:{},playerSelection:entry}));
});
