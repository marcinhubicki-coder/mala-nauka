import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectRecipe,planRecipeEdit} from '../tools/studio-engine.mjs';
import {PART_BY_ID} from '../shared/structure-model.mjs';
test('Shared BackButton is one editable source-level atom across screens',()=>{
 const initial={elementStyles:{},familyStyles:{}};
 const source=inspectRecipe(initial,'button-back');
 assert.equal(source.level,'atom');
 const {config,change}=planRecipeEdit(initial,{recipe:'button-back',property:'radius',value:24});
 assert.equal(change.path,'elementStyles.button-back.radius');
 assert.equal(config.elementStyles['button-back'].radius,24);
 assert.deepEqual(initial,{elementStyles:{},familyStyles:{}});
});
test('Registered recipes allow theme-specific edit with bounds and no invented atom',()=>{
 const initial={elementStyles:{},familyStyles:{}};
 const recipe=Object.keys(PART_BY_ID).find(key=>key==='control-jelly');
 assert.ok(recipe);
 const updated=planRecipeEdit(initial,{recipe,property:'height',value:52,mode:'spelling'});
 assert.equal(updated.config.familyStyles.spelling[recipe].height,52);
 assert.throws(()=>planRecipeEdit(initial,{recipe:'invented-back-arrow',property:'radius',value:20}),/Unknown registered/);
 assert.throws(()=>planRecipeEdit(initial,{recipe:'button-back',property:'radius',value:500}),/Bezpieczny/);
 assert.throws(()=>planRecipeEdit(initial,{recipe:'button-back',property:'radius',value:20,mode:'desktop'}),/Unknown mode/);
});
