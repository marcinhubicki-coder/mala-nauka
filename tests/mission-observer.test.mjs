import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMission} from '../shared/mission-parts.mjs';

test('repeated mission normalization settles without class mutations or duplicate illustrations',()=>{
 const classes=new Set(),removed=[];let classMutations=0,illustrations=0;
 const intro={dataset:{},classList:{contains:c=>classes.has(c),add:c=>{classes.add(c);classMutations++;}},
  querySelectorAll:()=>removed.length?[]:[{remove:()=>removed.push('old')}],
  querySelector:()=>illustrations?{}:null,insertAdjacentHTML:()=>illustrations++};
 const root={querySelector:()=>intro};
 normalizeMission(root,'spelling');const initial=classMutations;
 for(let i=0;i<20;i++)normalizeMission(root,'spelling');
 assert.equal(classMutations,initial,'observer-driven normalization must settle');
 assert.equal(illustrations,1);assert.deepEqual(removed,['old']);
 assert.equal(intro.dataset.dsRecipe,'container-mission');
});
