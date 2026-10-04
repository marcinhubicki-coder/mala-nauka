import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_MOTION,motionFrames,validateMotion,animateScreen,PlaybackClock} from '../shared/screen-motion.mjs';
import {changedViews,validateConfig} from '../design-system/model.mjs';
import {readFile} from 'node:fs/promises';
test('transition settings drive real animation frames and honor reduced motion',()=>{
 const motion={...DEFAULT_MOTION,style:'slide',distance:24,duration:600},calls=[];
 const node={animate:(frames,options)=>{calls.push({frames,options});return 'animation';}};
 assert.equal(animateScreen(node,motion,{reduced:true}),null);assert.equal(calls.length,0);
 assert.equal(animateScreen(node,motion,{reduced:false}),'animation');assert.equal(calls[0].frames[0].transform,'translateX(24px)');assert.equal(calls[0].options.duration,600);
 assert.deepEqual(motionFrames({...motion,style:'none'}),[]);
 for(const value of [{...motion,duration:2001},{...motion,style:'bad'},{...motion,distance:Infinity},{...motion,easing:'url(...)'}])assert.throws(()=>validateMotion(value));
});
test('stop and a new play invalidate delayed steps instead of leaving a loop alive',async()=>{
 const queued=new Map();let sequence=0;
 const clock=new PlaybackClock({setTimer:fn=>{queued.set(++sequence,fn);return sequence;},clearTimer:id=>queued.delete(id)});
 const first=clock.start(),pending=clock.pause(800,first);assert.equal(queued.size,1);
 clock.cancel();assert.equal(await pending,false);assert.equal(queued.size,0);assert.equal(clock.valid(first),false);
 const second=clock.start(),next=clock.pause(900,second);queued.values().next().value();assert.equal(await next,true);
 const stale=clock.pause(900,first);assert.equal(await stale,false);
});
test('saved animation settings remain valid and their impact includes every registered screen',async()=>{
 const config=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url))),registry=JSON.parse(await readFile(new URL('../design-system/registry.json',import.meta.url)));
 validateConfig(config);assert.equal(changedViews([{path:'motion.duration'}],registry).length,registry.views.length);
 config.motion.duration=-1;assert.throws(()=>validateConfig(config));
});

test('the default clock resolves elapsed time and cancellation through its real timer adapter',async()=>{
 const clock=new PlaybackClock(),generation=clock.start();
 assert.equal(await clock.pause(2,generation),true);
 const pending=clock.pause(100,generation);clock.cancel();assert.equal(await pending,false);
});
