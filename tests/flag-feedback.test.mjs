import test from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../game.mjs';
const question=id=>({kind:'flags',countryId:id,answer:id,options:[id,'other']});
test('flag feedback reserves one next question and gives four seconds without spending round time',()=>{
 let time=0,generated=0;
 const session=new Session(()=>question(String(++generated)),180,()=>time,()=>.4);
 session.mode='flags';session.feedbackMs=4000;
 time=1000;session.answer('1');
 const remaining=session.remaining,current=session.current;
 assert.equal(session.prepareNext().countryId,'2');
 assert.equal(session.prepareNext().countryId,'2');
 assert.equal(generated,2);assert.equal(session.current,current);assert.equal(session.question,1);
 time=4999;session.tick();assert.equal(session.state,'feedback-correct');assert.equal(session.remaining,remaining);
 time=5000;session.tick();assert.equal(session.state,'playing');assert.equal(session.current.countryId,'2');
 assert.equal(session.question,2);assert.equal(generated,2);assert.equal(session.remaining,remaining);
 time=6000;session.tick();assert.equal(session.remaining,remaining-1000);
});
test('wrong flag feedback and optional continue consume the reserved question exactly once',()=>{
 let time=0,generated=0;
 const session=new Session(()=>question(String(++generated)),180,()=>time,()=>.4);
 session.mode='flags';session.answer('other');session.prepareNext();
 time=10000;session.tick();assert.equal(session.remaining,180000);
 session.skipFeedback();assert.equal(session.current.countryId,'2');assert.equal(generated,2);
 assert.equal(session.prepareNext(),null);
});
test('flag confirmation survives pause and keeps the existing timing of other game modes',()=>{
 let time=0;
 const session=new Session(()=>question('pl'),180,()=>time,()=>.4);
 session.mode='flags';session.feedbackMs=4000;session.answer('pl');
 time=1000;session.pause();time=11000;session.resume();session.tick();
 assert.equal(session.feedbackRemaining,3000);assert.equal(session.remaining,180000);
 const other=new Session(()=>question('pl'),180,()=>time,()=>.4);other.mode='math';other.answer('pl');
 time+=700;other.tick();assert.equal(other.question,2);assert.equal(other.remaining,179300);
});

test('capital questions also leave the full four seconds to absorb the result',()=>{
 const session=new Session(()=>({...question('pl'),kind:'flag-capital',feedbackMs:2000}),180,()=>0,()=>.4);
 session.mode='flags';session.answer('pl');assert.equal(session.feedbackRemaining,4000);
});
