import test from 'node:test';
import assert from 'node:assert/strict';
import {acquireInputLock,inputLockCount} from '../shared/input-lock.mjs';
test('nested input locks remain active until the last owner releases',()=>{
 const node={inert:false};
 const logo=acquireInputLock(node,'logo');
 const round=acquireInputLock(node,'round');
 assert.equal(inputLockCount(node),2);
 round();assert.equal(node.inert,true);
 logo();assert.equal(node.inert,false);
 assert.equal(inputLockCount(node),0);
});
test('reverse release order, idempotence and preexisting locks are safe',()=>{
 const node={inert:false};
 const a=acquireInputLock(node,'a'),b=acquireInputLock(node,'b');
 a();assert.equal(node.inert,true);
 b();b();a();assert.equal(node.inert,false);
 const blocked={inert:true};
 const lock=acquireInputLock(blocked,'external');
 lock();assert.equal(blocked.inert,true);
});
test('boot UI never creates a second full-screen transition when changing views',()=>{
 const {readFileSync}=await import('node:fs');
 const src=readFileSync(new URL('../boot-ui.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/new MutationObserver\(\(\)=>\{const next=app\.dataset\.view/);
});
