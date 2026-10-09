import test from 'node:test';
import assert from 'node:assert/strict';
import {SoundPreviewEngine,normalizeSoundSettings,generateLayer,generateLogoSound,logoSoundEvents} from '../shared/sound-library.mjs';
import {logoConfig,logoTiming} from '../shared/logo-transition.mjs';
import {GameSoundController,gameSound,installGameSounds} from '../shared/sound-runtime.mjs';
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
 const lab=Object.create(StudioSound.prototype);lab.settings=normalizeSoundSettings({...config.sound,tempo:112,loopSeconds:120,mix:[12,0,0,0,75,0,0,0,48,20],cues:{tap:{duration:170,bell:60}},bindings:{home:{'action:settings':{cue:'bubble',volume:70}}}});
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

test('first answer waits for gesture unlock instead of silently dropping the cue',async()=>{
 const ctx=fakeContext();let resume;
 ctx.resume=()=>new Promise(resolve=>{resume=()=>{ctx.state='running';resolve();};});
 const engine=new SoundPreviewEngine({contextFactory:()=>ctx,workerFactory:null}),controller=new GameSoundController(engine);
 const unlocked=controller.unlock(),cue=controller.cue('correct');assert.equal(ctx.calls.sources.length,0);
 resume();await unlocked;await cue;assert.equal(ctx.calls.sources.length,1);
 await engine.close();
});
test('interrupted audio resumes and a closed context is recreated on the next click',async()=>{
 const first=fakeContext(),second=fakeContext();let contexts=0;
 const engine=new SoundPreviewEngine({contextFactory:()=>++contexts===1?first:second,workerFactory:null});
 first.state='interrupted';await engine.cue('tap',normalizeSoundSettings());assert.equal(first.state,'running');
 first.state='closed';await engine.cue('tap',normalizeSoundSettings());assert.equal(contexts,2);assert.equal(second.calls.sources.length,1);
 assert.equal(second.calls.buffers,1,'old-context buffers are discarded');await engine.close();
});
test('audio graph connections do not depend on the return value of connect',async()=>{
 const ctx=fakeContext(),gain=ctx.createGain,filter=ctx.createBiquadFilter,compressor=ctx.createDynamicsCompressor;
 for(const [key,create]of [['createGain',gain],['createBiquadFilter',filter],['createDynamicsCompressor',compressor]])ctx[key]=()=>{const node=create();node.connect=next=>{node.destination=next;};return node;};
 const engine=new SoundPreviewEngine({contextFactory:()=>ctx,workerFactory:null});
 await engine.cue('correct',normalizeSoundSettings());assert.equal(engine.limiter.destination,ctx.destination);assert.equal(engine.filter.destination,engine.limiter);assert.equal(engine.master.destination,engine.filter);await engine.close();
});
test('a failed background renderer falls back and still starts an audible bed',async()=>{
 const ctx=fakeContext();let worker;
 const engine=new SoundPreviewEngine({contextFactory:()=>ctx,workerFactory:()=>worker={postMessage(){queueMicrotask(()=>this.onerror());},terminate(){this.stopped=true;}}});
 await engine.start(normalizeSoundSettings({mix:[0,0,0,0,0,0,0,30,0,0]}));
 assert.equal(worker.stopped,true);assert.equal(engine.channels.size,1);assert.ok(engine.channels.get(7).gain.gain.value>0);assert.equal(engine.jobs.size,0);await engine.close();
});
test('muting while audio unlocks does not play a queued first answer',async()=>{
 const ctx=fakeContext();let resume;ctx.resume=()=>new Promise(resolve=>{resume=()=>{ctx.state='running';resolve();};});
 const engine=new SoundPreviewEngine({contextFactory:()=>ctx,workerFactory:null}),controller=new GameSoundController(engine);
 const unlocked=controller.unlock(),cue=controller.cue('correct');controller.setPreference(false);resume();await unlocked;await cue;assert.equal(ctx.calls.sources.length,0);await engine.close();
});
test('Sound Lab reports an intentional mute and its test tone ignores mixer levels without saving',async()=>{
 const lab=Object.create(StudioSound.prototype);lab.active=true;lab.settings=normalizeSoundSettings({volume:0,cueVolume:0,mix:Array(10).fill(0)});
 let played,status;lab.engine={async cue(id,settings){played={id,settings};}};lab.status=value=>{status=value;};lab.workspace={contains:()=>true};
 await lab.click({target:{closest:()=>({dataset:{soundCue:'correct'}})}});assert.match(status,/wyciszone/);assert.equal(played,undefined);
 await lab.click({target:{closest:()=>({dataset:{soundAction:'check'}})}});assert.equal(played.id,'correct');assert.ok(played.settings.volume>0);assert.equal(lab.settings.volume,0);assert.match(status,/niezależnie od miksera/);
});
test('mapped interactions play the selected mixed sound and respect local volume and silence',async()=>{
 const ctx=fakeContext(),engine=new SoundPreviewEngine({contextFactory:()=>ctx,workerFactory:null}),controller=new GameSoundController(engine);
 controller.configure({volume:50,cueVolume:50,ambientEnabled:false,cues:{bubble:{duration:200,volume:80}},bindings:{home:{'action:settings':{cue:'bubble',volume:40}},'spelling-initial':{'action:answer':{cue:'none',volume:100}},'flags-settings':{'event:roundStart':{cue:'trophy',volume:70}}}});
 await controller.unlock();await controller.interact({key:'action:settings',cue:'tap'},'home');
 const voice=[...engine.voices][0];assert.equal(voice.gain.gain.value,.5*.5*.8*.4);assert.ok(voice.source.buffer.duration>.5);
 await controller.interact({key:'action:answer',cue:'tap'},'spelling-initial');assert.equal(ctx.calls.sources.length,1);
 controller.setScene({view:'flags-initial',mode:'flags',playing:false});await controller.cue('roundStart');assert.ok(ctx.calls.sources[1].buffer.duration>.8,'event uses the setup-screen binding');
 await engine.close();
});
test('long ambient buffers have a byte budget as well as an entry limit',async()=>{
 const engine=new SoundPreviewEngine({contextFactory:fakeContext,workerFactory:null});await engine.ready();
 for(let i=0;i<8;i++)engine.buffer('long-'+i,()=>({length:4_000_000}));
 assert.ok(engine.cacheBytes<=64*1024*1024);assert.equal(engine.buffers.size,4);assert.equal(engine.bufferSizes.size,4);await engine.close();assert.equal(engine.cacheBytes,0);
});
test('document controls use the mapped source screen once, including a click followed by change',async()=>{
 const names=['document','window','location','localStorage','MutationObserver'],old=new Map(names.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)])),events=new Map(),ctx=fakeContext(),engine=new SoundPreviewEngine({contextFactory:()=>ctx,workerFactory:null}),previousEngine=gameSound.engine;
 const app={dataset:{view:'wizard',mode:'english'},classList:{contains:()=>false},addEventListener(){},querySelector:()=>null};
 const input={dataset:{},tagName:'INPUT',type:'radio',name:'difficulty',disabled:false,closest(selector){return selector==='label'||selector==='[inert]'?null:this;},matches:()=>true,getAttribute:()=>null};
 try{
  Object.assign(globalThis,{document:{hidden:false,addEventListener(type,fn){events.set(type,fn);},querySelector:()=>null},window:{addEventListener(){}},location:{search:'?studio=1'},localStorage:{getItem:()=>null},MutationObserver:class{observe(){}}});
  gameSound.engine=engine;gameSound.configure({ambientEnabled:false,bindings:{'english-settings':{'control:difficulty':{cue:'bubble',volume:60}}}});gameSound.unlocked=false;gameSound.setPreference(true);gameSound.setVisible(true);installGameSounds(app);
  events.get('click')({target:input,isTrusted:true});events.get('change')({target:input,isTrusted:true});await tick();
  assert.equal(ctx.calls.sources.length,1);assert.ok(ctx.calls.sources[0].buffer.duration>.2);assert.equal(gameSound.scene.view,'english-settings');
  events.get('click')({target:input,isTrusted:false});await tick();assert.equal(ctx.calls.sources.length,1);
 }finally{await engine.close();gameSound.engine=previousEngine;gameSound.unlocked=false;gameSound.setScene({playing:false,paused:false});for(const name of names){const desc=old.get(name);if(desc)Object.defineProperty(globalThis,name,desc);else delete globalThis[name];}}
});
