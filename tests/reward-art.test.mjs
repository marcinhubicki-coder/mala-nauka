import test from 'node:test';
import assert from 'node:assert/strict';
import {rewardArt,cupOrnaments,CUP_ORNAMENTS} from '../shared/reward-art.mjs';

test('medal metals keep exactly the same ribbon, source and coordinates',()=>{
 const stages=[1,2,3].map(level=>rewardArt({medal:true,level}));
 const geometry=html=>[...html.matchAll(/<image[^>]+>/g)].map(m=>m[0]);
 for(const html of stages){assert.match(html,/viewBox="0 0 512 512"/);assert.match(html,/data-reward-baseline="460"/);assert.deepEqual(geometry(html),geometry(stages[0]));}
 assert.equal(new Set(stages).size,3);
});
test('all ten knowledge stages retain the base; choice order converges to the same final art',()=>{
 const order=[8,3,6,1,7,2,5,0,4];let previous=[];
 const base=html=>html.match(/<g data-reward-part="cup-base"[^>]*>.*?<\/g>/)[0];
 for(let level=1;level<=10;level++){
  const choices=order.slice(0,level-1),parts=cupOrnaments(level,choices,{knowledge:true});assert.equal(parts.length,level-1);assert(previous.every(p=>parts.includes(p)));previous=parts;
  assert.equal(base(rewardArt({level,choices,knowledge:true})),base(rewardArt()));
 }
 assert.deepEqual(new Set(previous),new Set(CUP_ORNAMENTS));
 assert.equal(rewardArt({level:10,knowledge:true,choices:order}),rewardArt({level:10,knowledge:true,choices:[...order].reverse()}));
});
test('binary trophy choices add parts without removing previous upgrades on any branch',()=>{
 for(let level=1;level<4;level++)for(let choice=0;choice<2**(level-1);choice++){
  const before=cupOrnaments(level,[],{choice});
  for(const bit of [0,1]){const after=cupOrnaments(level+1,[],{choice:choice*2+bit});assert(before.every(p=>after.includes(p)));assert.equal(after.length,before.length+3);}
 }
});
