import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_MOTION,motionFrames,validateMotion,animateScreen,PlaybackClock} from '../shared/screen-motion.mjs';
import {changedViews,validateConfig} from '../design-system/model.mjs';
import {continueMotion,sliderJellyTransform} from '../spelling/continue-drag.mjs';
import {jellyTransform} from '../shared/jelly-v4.mjs';
import {resultMotionSettings} from '../ortografia/result-motion.mjs';
import {CONTROL_MOTION_PRESETS,activeControlMotionPreset,applyControlMotionPreset,controlMotionEntries} from '../design-system/control-motion-presets.mjs';
import {StudioMotion} from '../design-system/studio-motion.mjs';
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

test('control motion tokens reach the two sliders, progress bar and animated result text',async()=>{
 const config=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url))),registry=JSON.parse(await readFile(new URL('../design-system/registry.json',import.meta.url)));
 globalThis.__MALA_NAUKA_DESIGN__=config;
 assert.equal(continueMotion('wrong').completionDelay,240);
 assert.equal(continueMotion('result').completionDelay,350);
 assert.equal(resultMotionSettings().progress.finishDuration,950);
 assert.equal(resultMotionSettings().text.settleStart,.76);
 assert.deepEqual(changedViews([{path:'tokens.sliderWrong.springDuration'}],registry).map(view=>view.id),['spelling-wrong']);
 assert.deepEqual(changedViews([{path:'tokens.resultText.rollDuration'}],registry).map(view=>view.id),['spelling-results']);
 assert.deepEqual(changedViews([{path:'tokens.progress.finishDuration'}],registry).map(view=>view.id),['spelling-results']);
 delete globalThis.__MALA_NAUKA_DESIGN__;
});

test('drag sliders use the same jelly deformation as segmented controls',async()=>{
 const config=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url))),jelly=config.tokens.jelly;
 const shared=jellyTransform(1,1,jelly),slider=sliderJellyTransform(48,1,1,jelly),reverse=sliderJellyTransform(24,.5,-1,jelly);
 assert.equal(slider,`translate3d(48px,0,0) ${shared}`);
 assert.match(slider,/scale\(1\.0675,0\.8500\) rotate\(1\.30deg\)$/);
 assert.match(reverse,/translate3d\(24px,0,0\).*rotate\(-0\.65deg\)$/);
 assert.equal(sliderJellyTransform(0,0,1,jelly),'translate3d(0px,0,0) scale(1.0000,1.0000) rotate(0.00deg)');
});

test('motion presets keep component geometry and preserve the unique slider effects',async()=>{
 const config=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url))),height=config.tokens.jelly.height,threshold=config.tokens.slider.threshold;
 assert.equal(activeControlMotionPreset(config.tokens),'spring');
 const organic=applyControlMotionPreset(config.tokens,'organic');
 assert.equal(activeControlMotionPreset(organic),'organic');
 assert.equal(organic.jelly.height,height);assert.equal(organic.slider.threshold,threshold);
 assert.ok(organic.sliderWrong.sparkDuration);assert.equal(organic.sliderWrong.doneDuration,undefined);
 assert.ok(organic.sliderResult.doneDuration);assert.equal(organic.sliderResult.sparkDuration,undefined);
 assert.ok(organic.sliderWrong.springDuration>config.tokens.sliderWrong.springDuration);
 const candidate=structuredClone(config);candidate.tokens=organic;assert.doesNotThrow(()=>validateConfig(candidate));
 assert.equal(new Set(controlMotionEntries('subtle').map(([path])=>path)).size,controlMotionEntries('subtle').length);
 assert.throws(()=>applyControlMotionPreset(config.tokens,'unknown'));
 assert.deepEqual(Object.keys(CONTROL_MOTION_PRESETS),['subtle','spring','organic']);
});

test('two complete editing journeys keep saved comparison stable and fine tuning becomes custom',async()=>{
 const config=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url))),saved=structuredClone(config),design={config};
 const organic=applyControlMotionPreset(config.tokens,'organic');
 assert.ok(controlMotionEntries('organic').filter(([path,value])=>path.split('.').slice(1).reduce((node,key)=>node[key],config.tokens)!==value).length>30);
 const comparison={getDesign:()=>({config:{...config,tokens:organic},marker:'draft'}),getBase:()=>saved};
 assert.equal(StudioMotion.prototype.designFor.call(comparison,{dataset:{designSource:'saved'}}).config.tokens.jelly.duration,900);
 assert.equal(StudioMotion.prototype.designFor.call(comparison,{dataset:{designSource:'draft'}}).config.tokens.jelly.duration,1080);
 const subtle=applyControlMotionPreset(config.tokens,'subtle');subtle.sliderWrong.springDuration=333;
 assert.equal(activeControlMotionPreset(subtle),'');
 assert.equal(subtle.sliderResult.springDuration,CONTROL_MOTION_PRESETS.subtle.tokens.sliderResult.springDuration);
 assert.equal(design.config.tokens.sliderWrong.springDuration,405);
});

test('mobile animation choice exposes its child groups instead of leaving an empty pane',async()=>{
 const [motion,mobile,styles]=await Promise.all([
  readFile(new URL('../design-system/studio-motion.mjs',import.meta.url),'utf8'),
  readFile(new URL('../design-system/studio-mobile.mjs',import.meta.url),'utf8'),
  readFile(new URL('../design-system/studio-motion.css',import.meta.url),'utf8'),
 ]);
 assert.match(motion,/class='motion-mobile-choice mobile-only'/);
 assert.match(motion,/data-control-group=\$\{index\}/);
 assert.match(motion,/data-mobile-pane-target=preview/);
 assert.match(mobile,/button\.dataset\.controlGroup!==undefined/);
 assert.match(mobile,/setPane\('edit'\)/);
 assert.match(styles,/\.motion-mobile-choice\.mobile-only\{display:grid/);
 assert.match(styles,/body\.mobile-editor:not\(\[data-mobile-pane=choose\]\) \.motion-mobile-choice\{display:none\}/);
});

test('the default clock resolves elapsed time and cancellation through its real timer adapter',async()=>{
 const clock=new PlaybackClock(),generation=clock.start();
 assert.equal(await clock.pause(2,generation),true);
 const pending=clock.pause(100,generation);clock.cancel();assert.equal(await pending,false);
});
