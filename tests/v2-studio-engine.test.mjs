import test from 'node:test';
import assert from 'node:assert/strict';
import {findEditableBlock,planStyleEdit,inspectEditableBlock} from '../tools/studio-engine.mjs';

test('Headless and visual Studio target the same global block and local override',()=>{
 const initial={elementStyles:{},elementOverrides:{},familyStyles:{}};
 const global=planStyleEdit(initial,{view:'home',id:'home-mode-spelling',property:'radius',value:28,scope:'shared'});
 assert.equal(global.change.path,'elementStyles.block-button-home-card.radius');
 assert.equal(global.config.elementStyles['block-button-home-card'].radius,28);
 const local=planStyleEdit(global.config,{view:'home',id:'home-mode-spelling',property:'radius',value:15,scope:'view'});
 assert.equal(local.change.path,'elementOverrides.home.home-mode-spelling.radius');
 assert.equal(inspectEditableBlock(local.config,{view:'home',id:'home-mode-spelling'}).style.radius,15);
 assert.equal(inspectEditableBlock(local.config,{view:'home',id:'home-mode-reading'}).style.radius,28);
 assert.deepEqual(initial,{elementStyles:{},elementOverrides:{},familyStyles:{}});
});
test('Headless edits honor inherited game theme and reject unknown/invalid mutations',()=>{
 const initial={elementStyles:{},elementOverrides:{},familyStyles:{}};
 const themed=planStyleEdit(initial,{view:'home',id:'home-spelling-name',property:'textColor',value:'#ff2277',scope:'theme'});
 assert.equal(themed.change.path,'familyStyles.spelling.block-text-mode-name.textColor');
 assert.equal(inspectEditableBlock(themed.config,{view:'home',id:'home-spelling-name'}).style.textColor,'#ff2277');
 assert.equal(inspectEditableBlock(themed.config,{view:'home',id:'home-reading-name'}).style.textColor,undefined);
 assert.throws(()=>planStyleEdit(initial,{view:'home',id:'invented-button',property:'radius',value:20}),/Unknown or unported/);
 assert.throws(()=>planStyleEdit(initial,{view:'home',id:'home-settings',property:'radius',value:999}),/Safe|Bezpieczny/);
 assert.throws(()=>planStyleEdit(initial,{view:'home',id:'home-settings',property:'fake',value:10}),/Unsupported/);
});
test('The same engine can edit real Ortografia settings blocks',()=>{
 const initial={elementStyles:{},elementOverrides:{}};
 const changed=planStyleEdit(initial,{view:'spelling-settings',id:'spelling-level-jelly',scope:'view',property:'radius',value:26});
 assert.equal(changed.change.path,'elementOverrides.spelling-settings.spelling-level-jelly.radius');
 assert.equal(inspectEditableBlock(changed.config,{view:'spelling-settings',id:'spelling-level-jelly'}).style.radius,26);
});
