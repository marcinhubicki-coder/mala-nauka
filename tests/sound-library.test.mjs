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
test('loop seam is no sharper than the signal and continuous beds never fade to silence',()=>{
 for(const [id] of SOUND_LAYERS){
  const samples=generateLayer(id,3,16000);
  assert.equal(samples.length,48000);
  assert.ok(samples.every(Number.isFinite),id);
  let maxDifference=0;for(let i=1;i<samples.length;i++)maxDifference=Math.max(maxDifference,Math.abs(samples[i]-samples[i-1]));
  assert.ok(Math.abs(samples[0]-samples.at(-1))<=maxDifference*1.05+.001,id);
  if(['rain','stream','wind','leaves','waves','warmNoise','pad'].includes(id)){
   const rms=a=>Math.sqrt(a.reduce((n,x)=>n+x*x,0)/a.length);
   const seam=[...samples.slice(-1600),...samples.slice(0,1600)];
   assert.ok(rms(seam)>rms(samples)*.45,id+' has no silent seam');
  }
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
 assert.doesNotThrow(()=>validateSoundSettings({enabled:false,volume:35,cueVolume:55,ambientVolume:35,ambientEnabled:false,quietMode:true,ambientPreset:'focus',mix:[18,0,0,0,0,0,0,24,0,10]}));
 assert.throws(()=>validateSoundSettings({...settings,tempo:12}));
});
test('PCM WAV and ZIP download signatures are standard',async()=>{
 const wav=new Uint8Array(await wavBlob(generateCue('correct')).arrayBuffer());
 assert.equal(new TextDecoder().decode(wav.subarray(0,4)),'RIFF');
 assert.equal(new TextDecoder().decode(wav.subarray(8,12)),'WAVE');
 const zip=new Uint8Array(await zipBlob([['test.wav',wav]]).arrayBuffer());
 assert.equal(new DataView(zip.buffer).getUint32(0,true),0x04034b50);
 assert.equal(new DataView(zip.buffer).getUint32(zip.length-22,true),0x06054b50);
});
