import test from 'node:test';
import assert from 'node:assert/strict';
import {SoundPreviewEngine,normalizeSoundSettings,generateLayer,generateLogoSound,logoSoundEvents} from '../shared/sound-library.mjs';
import {logoConfig,logoTiming} from '../shared/logo-transition.mjs';
import {GameSoundController} from '../shared/sound-runtime.mjs';
import {StudioSound} from '../design-system/studio-sound.mjs';

const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
function fakeContext(){
 const calls={sources:[],buffers:0};
 const param=()=>({value:1,setTargetAtTime(value){this.value=value;},cancelScheduledValues(){}});
 const node=()=>({gain:param(),frequency:param(),Q:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(next){return next;},disconnect(){this.disconnected=true;}});
 return {calls,currentTime:0,state:'suspended',destination:{},async resume(){this.state='running';},async close(){this.state='closed';},createGain:node,createBiquadFilter:node,createDynamicsCompressor:node,
  createBuffer(channels,length,rate){calls.buffers++;return {duration:length/rate,copyToChannel(){}};},
  createBufferSource(){const source={...node(),start(time,offset){this.startTime=time;this.offset=offset;},stop(){this.stopped=true;this.onended?.();}};calls.sources.push(source);return source;}
 };
}
test('game and mixer share the saved levels; Save forwards the complete design',()=>{
 let config={sound:normalizeSoundSettings()},saved=0,message;
 const lab=Object.create(StudioSound.prototype);lab.settings=normalizeSoundSettings({...config.sound,tempo:112,mix:[12,0,0,0,75,0,0,0,48,20]});
 lab.getSettings=()=>config.sound;lab.save=value=>{config.sound=value;saved++;};lab.getDesign=()=>({config,assets:{revision:7}});
 lab.gameFrame=()=>({contentWindow:{postMessage:value=>message=value}});
 const oldLocation=globalThis.location;globalThis.location={origin:'https://studio.test'};
 try{lab.persist();lab.persist();assert.equal(saved,1);assert.deepEqual(message.config.sound,lab.settings);assert.equal(message.assets.revision,7);}finally{globalThis.location=oldLocation;}
});
test('audio starts only after a gesture, respects pause and player mute, and live levels reuse sources',async()=>{
 const ctx=fakeContext(),engine=new SoundPreviewEngine({contextFactory:()=>ctx,workerFactory:null}),controller=new GameSoundController(engine);
 controller.configure(normalizeSoundSettings({mix:[0,0,0,0,0,0,0,45,0,0]}));controller.setScene({playing:true,paused:false});assert.equal(engine.ctx,null);
 await controller.unlock();await tick();assert.equal(engine.channels.size,1);
 const sources=ctx.calls.sources.length;
 controller.configure({...controller.settings,ambientVolume:20});await tick();assert.equal(ctx.calls.sources.length,sources);
 controller.cue('correct');await tick();assert.equal(engine.voices.size,1);assert.ok(engine.ambientBus.gain.value<1);
 controller.setScene({playing:true,paused:true});assert.equal(engine.channels.size,0);assert.equal(engine.voices.size,1,'pause bed without truncating answer');
 controller.setScene({playing:true,paused:false});await tick();assert.equal(engine.channels.size,1);
 controller.setPreference(false);assert.equal(engine.channels.size,0);assert.equal(engine.voices.size,0);
 controller.cue('correct');await tick();assert.equal(engine.voices.size,0);await engine.close();
});
test('stop cancels pending rendering and rapid cues keep a bounded number of voices',async()=>{
 const ctx=fakeContext(),engine=new SoundPreviewEngine({contextFactory:()=>ctx,workerFactory:null});
 const start=engine.start(normalizeSoundSettings());engine.stop();await start;assert.equal(engine.channels.size,0);
 for(let i=0;i<20;i++)await engine.cue('tap',normalizeSoundSettings());assert.ok(engine.voices.size<=8);
 assert.equal(ctx.calls.buffers,1,'cue samples reused');engine.stop();assert.equal(engine.voices.size,0);await engine.close();
});
test('logo audio follows edited orbit, splash and reveal timing, including neutral loading',()=>{
 const config=logoConfig({turns:3,turnDuration:1200,whiteDuration:950}),timing=logoTiming(config),events=logoSoundEvents(config,timing);
 assert.equal(events.filter(event=>event.id==='orbit').length,15);
 assert.equal(events.find(event=>event.id==='splash').time,timing.orbit/1000);
 assert.equal(events.find(event=>event.id==='white').time,timing.white/1000);
 assert.equal(events.find(event=>event.id==='reveal').time,timing.reveal/1000);
 const data=generateLogoSound(config,timing);assert.ok(data.some(v=>Math.abs(v)>.01));assert.ok(data.every(v=>Number.isFinite(v)&&Math.abs(v)<1));
 const neutral={...config,neutral:true};assert.equal(logoSoundEvents(neutral,logoTiming(neutral)).filter(event=>event.id==='splash').length,0);
});
test('nature variation changes the actual waveform and music energy changes the timbre',()=>{
 const a=generateLayer('birds',3,8000,{variation:5}),b=generateLayer('birds',3,8000,{variation:95});assert.notDeepEqual(a,b);
 const calm=generateLayer('chimes',3,8000,{energy:0}),bright=generateLayer('chimes',3,8000,{energy:100});assert.notDeepEqual(calm,bright);
});
