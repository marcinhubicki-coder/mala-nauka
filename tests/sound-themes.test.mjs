import test from 'node:test';
import assert from 'node:assert/strict';
import {SOUND_ZONES,SOUND_COLLECTIONS,DEFAULT_AMBIENCE,soundZone} from '../shared/sound-themes.mjs';
import {normalizeSoundSettings,validateSoundSettings,ambienceForZone,ambienceKey,generateLayer,SoundPreviewEngine} from '../shared/sound-library.mjs';
import {designFields} from '../design-system/project-model.mjs';
import {readFile} from 'node:fs/promises';
const tick=()=>new Promise(r=>setTimeout(r,10));
function context(){
 const calls={sources:[],curves:[]},param=()=>({value:1,cancelScheduledValues(){},setTargetAtTime(v){this.value=v;},setValueCurveAtTime(curve,time,duration){calls.curves.push({curve,time,duration});this.value=curve.at(-1);}}),node=()=>({gain:param(),frequency:param(),Q:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(){},disconnect(){}});
 return {calls,state:'running',currentTime:12,destination:{},createGain:node,createBiquadFilter:node,createDynamicsCompressor:node,createBuffer:(_,length,rate)=>({duration:length/rate,copyToChannel(){}}),createBufferSource(){const s={...node(),playbackRate:param(),start(time,offset){this.time=time;this.offset=offset;},stop(){this.stopped=true;this.onended?.();}};calls.sources.push(s);return s;},async close(){this.state='closed';}};
}
const isolated=(zone,overrides={})=>normalizeSoundSettings({...ambienceForZone(normalizeSoundSettings(),zone),mix:[0,0,0,0,0,0,0,0,40,0],loopSeconds:24,...overrides});

test('seven zones cover setup, loading, game, results and collection with stable themes',()=>{
 assert.equal(Object.keys(SOUND_ZONES).length,7);assert.equal(Object.keys(SOUND_COLLECTIONS).length,3);
 for(const mode of ['spelling','math','english','flags','reading'])for(const view of [mode+'-settings',mode+'-initial',mode+'-pause','loading'])assert.equal(soundZone({view,mode}),mode);
 for(const view of ['players','players-empty','player-create','player-pin','home'])assert.equal(soundZone({view}),'home');
 for(const view of ['progress','collection','sessions','rules','spelling-results','math-results'])assert.equal(soundZone({view}),'results');
});
test('zone settings survive Studio/PWA export and changes stay within their zone',async()=>{
 const config=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url))),settings=normalizeSoundSettings(config.sound),before=structuredClone(settings.ambience.home);
 settings.ambience.english.soundscape='forest';settings.ambience.english.mix[1]=39;settings.ambience.english.volume=73;
 validateSoundSettings(settings);config.sound=settings;assert.deepEqual(designFields(config).sound,settings);assert.deepEqual(settings.ambience.home,before);
 const selected=ambienceForZone(settings,'english');assert.equal(selected.mix[1],39);assert.equal(selected.soundscape,'forest');assert.equal(selected.volume,settings.volume);
 assert.equal(selected.ambientVolume,settings.ambientVolume*.73);
 const bad=structuredClone(settings);bad.ambience.english.mix[0]=101;assert.throws(()=>validateSoundSettings(bad));
 assert.doesNotThrow(()=>normalizeSoundSettings(null));
});
test('five mode melodies are distinct and three collections change the rendered timbre',()=>{
 const fingerprints=Object.keys(DEFAULT_AMBIENCE).map(zone=>Buffer.from(generateLayer('chimes',8,4000,ambienceForZone({},zone)).buffer).toString('base64'));
 assert.equal(new Set(fingerprints).size,7);
 for(const id of ['stream','leaves','birds','chimes']){
  const waves=Object.keys(SOUND_COLLECTIONS).map(soundscape=>generateLayer(id,3,8000,{soundscape}));
  for(let i=1;i<waves.length;i++)assert.notDeepEqual(waves[0],waves[i],id);
 }
 const waves=['wind','stream','leaves','waves'].map(id=>generateLayer(id,4,8000));
 for(let i=0;i<waves.length;i++)for(let j=i+1;j<waves.length;j++){
  let dot=0,a=0,b=0;for(let k=0;k<waves[i].length;k++){dot+=waves[i][k]*waves[j][k];a+=waves[i][k]**2;b+=waves[j][k]**2;}
  assert.ok(Math.abs(dot/Math.sqrt(a*b))<.35,'nature layers have different signals');
 }
});
test('crossfade keeps the outgoing theme until the complete incoming theme is ready',async()=>{
 const ctx=context(),engine=new SoundPreviewEngine({contextFactory:()=>ctx,workerFactory:null});
 await engine.start(isolated('home'));const old=engine.theme,source=engine.channels.get(8).source;let complete;
 engine.layerBuffer=()=>new Promise(r=>{complete=r;});
 const change=engine.adjust(isolated('english'));await tick();assert.equal(engine.theme,old);assert.equal(source.stopped,undefined);
 complete(ctx.createBuffer(1,16000,16000));await change;
 assert.equal(engine.theme.key,ambienceKey(isolated('english')));assert.notEqual(engine.channels.get(8).source,source);assert.equal(source.stopped,undefined);
 assert.ok(engine.retiring.has(old));assert.ok(ctx.calls.curves.some(c=>c.curve[0]===1&&c.curve.at(-1)<.001));
 assert.ok(ctx.calls.curves.every(c=>Math.abs(c.duration-2.6)<.001));
 engine.stop();assert.equal(source.stopped,true);assert.equal(engine.channels.size,0);assert.equal(engine.retiring.size,0);await engine.close();
});
test('rapid return cancels the pending theme without restarting or stopping the current music',async()=>{
 const ctx=context(),engine=new SoundPreviewEngine({contextFactory:()=>ctx,workerFactory:null});await engine.start(isolated('home'));
 const old=engine.theme,sources=ctx.calls.sources.length;let complete;engine.layerBuffer=()=>new Promise(r=>complete=r);
 const change=engine.adjust(isolated('flags'));await tick();await engine.adjust(isolated('home'));complete(ctx.createBuffer(1,16000,16000));await change;
 assert.equal(engine.theme,old);assert.equal(ctx.calls.sources.length,sources);assert.ok([...engine.channels.values()].every(v=>!v.source.stopped));await engine.close();
});
