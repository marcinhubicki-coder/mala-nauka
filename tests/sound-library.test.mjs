import test from 'node:test';
import assert from 'node:assert/strict';
import {SOUND_CUES,SOUND_LAYERS,SOUND_PRESETS,DEFAULT_SOUND_SETTINGS,normalizeSoundSettings,validateSoundSettings,generateCue,generateLayer,mixAmbience,wavBlob,zipBlob} from '../shared/sound-library.mjs';

test('12 cues and 10 independently adjustable ambient layers exist',()=>{
 assert.equal(SOUND_CUES.length,12);
 assert.equal(SOUND_LAYERS.length,10);
 assert.equal(new Set(SOUND_CUES.map(x=>x[0])).size,12);
 assert.equal(new Set(SOUND_LAYERS.map(x=>x[0])).size,10);
});
test('every cue is finite, bounded and non-silent',()=>{
 for(const [id] of SOUND_CUES){
  const samples=generateCue(id);
  assert.ok(samples.length>400);
  assert.ok(samples.every(x=>Number.isFinite(x)&&Math.abs(x)<=.66),id);
  assert.ok(samples.some(x=>Math.abs(x)>.01),id);
 }
});
test('ambient layers do not click at loop boundaries',()=>{
 for(const [id] of SOUND_LAYERS){
  const samples=generateLayer(id,1,16000);
  assert.equal(samples.length,16000);
  assert.ok(samples.every(Number.isFinite),id);
  assert.ok(Math.abs(samples[0])<.01,id);
  assert.ok(Math.abs(samples.at(-1))<.01,id);
 }
});
test('presets cover ten channels and silence really is silent',()=>{
 for(const p of Object.values(SOUND_PRESETS)){assert.equal(p.mix.length,10);assert.ok(p.mix.every(x=>x>=0&&x<=100));}
 assert.ok(mixAmbience(SOUND_PRESETS.silence.mix,1).every(x=>x===0));
});
test('settings clamp values and validate strictly',()=>{
 const settings=normalizeSoundSettings({...DEFAULT_SOUND_SETTINGS,volume:999,mix:[-4,101]});
 assert.equal(settings.volume,100);assert.equal(settings.mix[0],0);assert.equal(settings.mix[1],100);
 assert.doesNotThrow(()=>validateSoundSettings(settings));
 assert.throws(()=>validateSoundSettings({...settings,mix:[20]}));
});
test('PCM WAV and ZIP download signatures are standard',async()=>{
 const wav=new Uint8Array(await wavBlob(generateCue('correct')).arrayBuffer());
 assert.equal(new TextDecoder().decode(wav.subarray(0,4)),'RIFF');
 assert.equal(new TextDecoder().decode(wav.subarray(8,12)),'WAVE');
 const zip=new Uint8Array(await zipBlob([['test.wav',wav]]).arrayBuffer());
 assert.equal(new DataView(zip.buffer).getUint32(0,true),0x04034b50);
 assert.equal(new DataView(zip.buffer).getUint32(zip.length-22,true),0x06054b50);
});
