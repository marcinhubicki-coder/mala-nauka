import test from 'node:test';
import assert from 'node:assert/strict';
import { clothPoint, clothLight } from '../flagi/flag-cloth.mjs';

test('cloth remains inside its Retina canvas and its mesh never folds over',()=>{
  const epsilon=.0001;
  for(let row=0;row<=80;row++)for(let column=0;column<=80;column++){
    const u=column/80,v=row/80,p=clothPoint(u,v),pu=clothPoint(u+epsilon,v),pv=clothPoint(u,v+epsilon);
    assert.ok(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1,'surface must not clip');
    const determinant=(pu.x-p.x)*(pv.y-p.y)-(pv.x-p.x)*(pu.y-p.y);
    assert.ok(determinant>0,'emblems must not invert or cross themselves');
    assert.ok(Number.isFinite(clothLight(u,v)),'light must stay finite');
  }
});

test('the hoist is straight and the free top edge drapes down from it',()=>{
  const anchor=clothPoint(0,0);
  for(let row=0;row<=20;row++)assert.equal(clothPoint(0,row/20).x,anchor.x);
  assert.ok(clothPoint(1,0).y-anchor.y>.15,'cloth should visibly drape');
});


test('all breeze phases keep the mast pinned and country emblems uninverted',()=>{
 const epsilon=.0001;
 for(let phase=0;phase<Math.PI*2;phase+=Math.PI/8){
  for(let row=0;row<=40;row++)for(let column=0;column<=40;column++){
   const u=column/40,v=row/40,p=clothPoint(u,v,undefined,phase),pu=clothPoint(u+epsilon,v,undefined,phase),pv=clothPoint(u,v+epsilon,undefined,phase);
   assert.ok(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1,'moving cloth stays inside its canvas');
   assert.ok((pu.x-p.x)*(pv.y-p.y)-(pv.x-p.x)*(pu.y-p.y)>0,'moving surface never crosses itself');
   if(!column)assert.deepEqual(p,clothPoint(u,v),'hoist remains fixed');
  }
 }
 assert.deepEqual(clothPoint(.7,.5,undefined,0),clothPoint(.7,.5,undefined,Math.PI*2),'breeze loop closes without a jump');
});
