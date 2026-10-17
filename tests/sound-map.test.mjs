import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SOUND_COLUMNS,soundSlots,soundInteraction,soundBinding,soundSceneView} from '../shared/sound-map.mjs';
import {normalizeSoundSettings,validateSoundSettings,generateCue,cueSettings,layerSeconds,generateLayer} from '../shared/sound-library.mjs';
import {designFields,projectSnapshot,discoveryProject,editableProjectConfig} from '../design-system/project-model.mjs';
import {StudioSoundMap} from '../design-system/studio-sound-map.mjs';
const element=(dataset={},props={})=>({dataset,tagName:'BUTTON',type:'button',getAttribute:()=>null,matches:()=>false,...props});

test('map includes startup, every mode and results, with editable defaults before visiting previews',()=>{
 const ids=SOUND_COLUMNS.flatMap(([,ids])=>ids);
 for(const mode of ['spelling','english','reading','flags','math'])for(const state of ['settings','initial','results'])assert.ok(ids.includes(mode+'-'+state));
 for(const id of ids){const slots=soundSlots(id);assert.equal(new Set(slots.map(s=>s.key)).size,slots.length);for(const slot of slots)assert.doesNotThrow(()=>validateSoundSettings(normalizeSoundSettings({bindings:{[id]:{[slot.key]:{cue:slot.cue,volume:80}}}})));}
 assert.ok(soundSlots('player-pin').some(s=>s.key==='control:profilePinMode'));
 assert.ok(soundSlots('player-create').some(s=>s.key==='field:nickname'));
 assert.ok(soundSlots('spelling-correct').some(s=>s.key==='event:correct'));
});
test('exact local assignment wins over global; unknown controls inherit an editable fallback',()=>{
 const settings=normalizeSoundSettings({bindings:{'*':{'action:answer':{cue:'bubble',volume:65},control:{cue:'hint',volume:75}},'spelling-initial':{'action:answer':{cue:'none',volume:0}},'english-settings':{control:{cue:'next',volume:40}}}});
 assert.deepEqual(soundBinding(settings,'spelling-wrong',{key:'action:answer'}),{cue:'none',volume:0});
 assert.deepEqual(soundBinding(settings,'english-initial',{key:'action:answer'}),{cue:'bubble',volume:65});
 assert.deepEqual(soundBinding(settings,'flags-settings',{key:'control:newOption'}),{cue:'hint',volume:75});
 assert.deepEqual(soundBinding(settings,'english-settings',{key:'control:newOption'}),{cue:'next',volume:40});
 assert.deepEqual(soundBinding(settings,'home',soundInteraction(element({action:'choose-mode',mode:'math'}))),{cue:'next',volume:100});
});
test('real buttons, PIN labels, native selects, maths controls and form submits use map keys',()=>{
 const samples=[
  [element({action:'choose-player'}),'action:choose-player'],[element({action:'pin-digit'}),'action:pin-digit'],
  [element({}, {tagName:'INPUT',name:'profilePinMode',type:'radio'}),'control:profilePinMode'],
  [element({}, {tagName:'INPUT',name:'nickname',type:'text'}),'field:nickname'],
  [element({}, {tagName:'SELECT',name:'category'}),'control:category'],
  [element({category:'addition'}),'math:category'],[element({duration:'60'}),'math:duration'],
  [element({answer:'5'}),'action:answer'],[element({}, {type:'submit',form:{id:'setup-form'}}),'submit:setup-form'],
  [element({progress:'filter'}),'progress:filter'],[element({}, {tagName:'SUMMARY'}),'summary'],
  [element({}, {matches:s=>s.includes('.hint-dismiss')}),'hint-close'],
 ];
 const all=new Set(SOUND_COLUMNS.flatMap(([,ids])=>ids.flatMap(id=>soundSlots(id).map(s=>s.key))));
 for(const [node,key]of samples){assert.equal(soundInteraction(node).key,key);assert.ok(all.has(key),key);}
});
test('live scene is derived from current screen, including history state and PIN unlock',()=>{
 const app=dataset=>({dataset,querySelector:()=>null});
 assert.equal(soundSceneView(app({view:'game',mode:'flags',state:'feedback-correct'})),'flags-initial');
 assert.equal(soundSceneView(app({view:'results',mode:'math'})),'math-results');
 assert.equal(soundSceneView(app({view:'history',historyState:'collection'})),'collection');
 assert.equal(soundSceneView(app({view:'history',historyState:'achievements'})),'trophies');
 assert.equal(soundSceneView(app({view:'player-pin',pinPurpose:'unlock'})),'player-unlock');
 assert.equal(soundSceneView(app({view:'players'})),'players-empty');
});
test('map edits keep screen-specific bindings separate from shared bindings',()=>{
 const map=Object.create(StudioSoundMap.prototype),settings=normalizeSoundSettings();map.getSettings=()=>settings;map.selected='player-pin';map.scope='local';
 map.edit('control:profilePinMode',{cue:'bubble',volume:42});
 assert.equal(settings.bindings['player-pin']['control:profilePinMode'].cue,'bubble');assert.equal(settings.bindings['*'],undefined);
 map.scope='all';map.edit('control:profilePinMode',{cue:'toggle',volume:90});
 assert.equal(settings.bindings['*']['control:profilePinMode'].volume,90);
 assert.equal(soundBinding(settings,'player-pin',{key:'control:profilePinMode'}).volume,42);
 assert.doesNotThrow(()=>validateSoundSettings(settings));
 map.renderInspector=()=>{};map.change({target:{dataset:{soundBindingScope:''},value:'local'}});assert.equal(map.scope,'local');
});
test('sound map and cue mixers survive editable drafts and release snapshots',async()=>{
 const config=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url))),sound=normalizeSoundSettings({loopSeconds:120,cues:{tap:{bell:40,duration:180}},bindings:{home:{'action:settings':{cue:'bubble',volume:45}}}});
 config.sound=sound;assert.deepEqual(designFields(config).sound,sound);
 assert.deepEqual(projectSnapshot(discoveryProject(),config).design.sound,sound);
 assert.deepEqual(editableProjectConfig({...config,project:{designDraft:{sound}}}).sound,sound);
});
test('short sound mixer changes timbre, pitch, attack and duration without altering other cues',()=>{
 const source=generateCue('tap',8000),settings=normalizeSoundSettings({cues:{tap:{wood:0,bell:80,pop:50,air:20,duration:200,pitch:7,attack:50}}});
 const mixed=generateCue('tap',8000,settings);assert.equal(mixed.length,source.length*2);assert.notDeepEqual(mixed.subarray(0,source.length),source);assert.ok(mixed.every(v=>Number.isFinite(v)&&Math.abs(v)<1));
 assert.deepEqual(generateCue('correct',8000,settings),generateCue('correct',8000));
 for(const key of ['wood','bell','pop','air','pitch','attack'])assert.notDeepEqual(generateCue('toggle',8000,{cues:{toggle:{[key]:key==='pitch'?7:key==='attack'?50:50}}}),generateCue('toggle',8000),key);
 assert.equal(cueSettings('tap').duration,100);
});
test('longer musical loops preserve full phrases and nature cycles do not coincide',()=>{
 const period=layerSeconds('chimes'),bar=16*60/84;assert.ok(period>60);assert.ok(Math.abs(period/bar-Math.round(period/bar))<1e-10);
 assert.equal(new Set(['rain','birds','wind','waves'].map(id=>layerSeconds(id))).size,4);
 assert.ok(layerSeconds('chimes',{loopSeconds:150})>period);
 const notes=generateLayer('chimes',period,2000),phrase=Math.round(bar*2000);
 assert.notDeepEqual(notes.slice(0,phrase),notes.slice(phrase,phrase*2),'later phrases vary before the complete bed repeats');
 let delta=0;for(let i=1;i<notes.length;i++)delta=Math.max(delta,Math.abs(notes[i]-notes[i-1]));assert.ok(Math.abs(notes[0]-notes.at(-1))<=delta+.001);
});
test('nested sound settings reject invalid cues, malformed bindings and out-of-range loop durations',()=>{
 for(const patch of [{loopSeconds:200},{cues:{tap:{duration:0}}},{cues:{bad:{volume:50}}},{bindings:{home:{'action:settings':{cue:'unknown',volume:50}}}},{bindings:{home:{'action:settings':{cue:'tap',volume:151}}}}])assert.throws(()=>validateSoundSettings({...normalizeSoundSettings(),...patch}));
});
