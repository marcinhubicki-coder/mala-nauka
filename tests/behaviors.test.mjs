import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {migrateBehaviors,resolveBehaviorConfig,duplicateBehavior,behaviorEntries,MOTION_TOKEN_KEYS} from '../shared/behaviors.mjs';
import {visualValue} from '../shared/element-system.mjs';
import {familyTokens} from '../shared/building-blocks.mjs';
import {transitionMotion} from '../shared/screen-motion.mjs';
import {validateConfig,configCSS,changedViews} from '../design-system/model.mjs';
import {projectContract} from '../design-system/project-model.mjs';
import {optimizedTestConfig} from '../design-system/pwa-test-build.mjs';
import {StudioPreview} from '../design-system/studio-preview.mjs';
import {surfaceEditor} from '../design-system/surface-editor.mjs';
import {behaviorOptions} from '../design-system/behavior-picker.mjs';
import {AMBIENT_STYLES,EFFECT_STYLES} from '../spelling/effect-model.mjs';

const original=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url)));
const registry=JSON.parse(await readFile(new URL('../design-system/registry.json',import.meta.url)));

test('migration is immutable, idempotent and preserves current runtime values',()=>{
 const before=structuredClone(original),saved=migrateBehaviors(original),runtime=resolveBehaviorConfig(saved);
 assert.deepEqual(original,before);assert.deepEqual(migrateBehaviors(saved),saved);
 validateConfig(saved);configCSS(saved);
 for(const [group,keys]of Object.entries(MOTION_TOKEN_KEYS))for(const key of keys){
  if(original.tokens[group]?.[key]!==undefined)assert.equal(runtime.tokens[group][key],original.tokens[group][key],group+'.'+key);
  assert.equal(saved.tokens[group]?.[key],undefined);
 }
 for(const v of registry.views)for(const to of registry.views)assert.deepEqual(transitionMotion(runtime.motion,v.id,to.id),transitionMotion(original.motion,v.id,to.id));
 for(const [kind,row]of Object.entries(original.elementStyles||{})){
  const prior=visualValue(original,'home',{id:kind,kind,recipe:kind}),next=visualValue(saved,'home',{id:kind,kind,recipe:kind});
  for(const key of ['animation','activeAnimation','idleAnimation','enterAnimation','exitAnimation','animationDuration','animationDistance','stateDuration','stateDistance'])if(prior[key]!==undefined)assert.equal(next[key],prior[key],kind+'.'+key);
 }
 assert.deepEqual(runtime.effects,original.effects);for(const target of ['logoTransition','exitTransition'])for(const [key,value]of Object.entries(original[target]||{}))assert.deepEqual(runtime[target][key],value);
});

test('a shared Bokeh edit reaches multiple screens and elements; copies remain independent',()=>{
 const c=migrateBehaviors(original),copy=duplicateBehavior(c,'surface-bokeh','Bokeh · małe światła');c.behaviors=copy.behaviors;
 c.screenEffects={home:{surfaceEffects:[{preset:copy.id}]},'spelling-initial':{surfaceEffects:[{preset:copy.id}]}};
 c.elementOverrides={home:{first:{surfaceEffects:[{preset:copy.id}]}},'english-initial':{second:{surfaceEffects:[{preset:copy.id}]}}};
 c.behaviors.definitions[copy.id].settings.effectSpeed=.8;
 const resolved=resolveBehaviorConfig(c);
 for(const v of ['home','spelling-initial'])assert.equal(resolved.screenEffects[v].surfaceEffects[0].effectSpeed,.8);
 for(const [v,id]of [['home','first'],['english-initial','second']])assert.equal(visualValue(c,v,{id,kind:'button'}).surfaceEffects[0].effectSpeed,.8);
 assert.equal(c.behaviors.definitions['surface-bokeh'].settings.effectSpeed,.5);
 assert.match(surfaceEditor(c.screenEffects.home,0,c),/Bokeh · małe światła/);
 assert.deepEqual(c.screenEffects.home.surfaceEffects,[{preset:copy.id}]);validateConfig(c);
});

test('one named animation controls active, idle, entry and exit timing independently',()=>{
 const c=migrateBehaviors(original),copy=duplicateBehavior(c,'animation-pulse','Szybki puls');c.behaviors=copy.behaviors;
 c.behaviors.definitions[copy.id].settings={duration:460,distance:12};
 c.elementStyles.sample={activeAnimation:copy.id,idleAnimation:'animation-float',enterAnimation:copy.id,exitAnimation:copy.id};
 const style=visualValue(c,'home',{id:'sample',kind:'sample'});
 assert.equal(style.activeAnimation,'pulse');assert.equal(style.activeDuration,460);assert.equal(style.enterDuration,460);assert.equal(style.exitDuration,460);assert.equal(style.idleDuration,1600);assert.equal(style.activeDistance,12);
 for(const prefix of ['animation','active','idle','enter','exit'])assert.equal(c.elementStyles.sample[prefix+'Duration'],undefined);
 assert.match(behaviorOptions(c,'animation',copy.id),/Szybki puls/);validateConfig(c);
});

test('family and screen motion variants migrate to shared references and samples resolve them',()=>{
 const legacy=structuredClone(original);legacy.familyTokens={...legacy.familyTokens,english:{jelly:{duration:1200,bounce:.7}}};legacy.overrides={...legacy.overrides,'english-settings':{jelly:{duration:1300}}};
 const saved=migrateBehaviors(legacy),runtime=resolveBehaviorConfig(saved),group=saved.behaviors.bindings.families.english.jelly;
 assert.equal(saved.familyTokens.english.jelly.duration,undefined);assert.equal(saved.overrides['english-settings'].jelly.duration,undefined);
 assert.equal(familyTokens(saved,'english','jelly').duration,1200);
 assert.equal(runtime.overrides['english-settings'].jelly.duration,1300);assert.equal(runtime.overrides['english-settings'].jelly.bounce,.7);
 saved.behaviors.definitions[group].settings.duration=1500;assert.equal(familyTokens(saved,'english','jelly').duration,1500);
});

test('all original game effect choices exist in the library',()=>{
 const c=migrateBehaviors(original);
 for(const [kind,types]of [['ambient',AMBIENT_STYLES],['wrong',EFFECT_STYLES],['response',EFFECT_STYLES]])for(const type of Object.keys(types))assert.ok(behaviorEntries(c,kind).some(([,d])=>d.type===type),kind+':'+type);
});

test('Git and Test PWA preserve references and resolve the same library settings',()=>{
 const c=migrateBehaviors(original),copy=duplicateBehavior(c,'transition-blur','Delikatny blur');c.behaviors=copy.behaviors;c.behaviors.definitions[copy.id].settings.duration=880;c.motion.transitions['home--spelling-settings']={preset:copy.id};
 const contract=JSON.parse(JSON.stringify(projectContract(c,original))),pwa=optimizedTestConfig(contract).config;
 assert.deepEqual(contract.behaviors,c.behaviors);assert.deepEqual(pwa.behaviors,c.behaviors);
 assert.equal(pwa.motion.transitions['home--spelling-settings'].preset,copy.id);assert.equal(transitionMotion(resolveBehaviorConfig(pwa).motion,'home','spelling-settings').duration,880);
 assert.equal(changedViews([{path:'behaviors.definitions.'+copy.id+'.settings.duration'}],registry).length,registry.views.length);
});

test('effect policy settings stay global and preserve the separate bubble and words',()=>{const c=migrateBehaviors(original),id=c.behaviors.bindings.effectRules;c.behaviors.definitions[id].settings.particleBudget=12;const runtime=resolveBehaviorConfig(c);assert.equal(runtime.effects.particleBudget,12);assert.deepEqual(runtime.effects.bubble,original.effects.bubble);assert.deepEqual(runtime.effects.wordTransition,original.effects.wordTransition);validateConfig(c);});

test('invalid references, duplicate names and unsafe settings cannot be saved',()=>{
 for(const mutate of [c=>{c.screenEffects={home:{surfaceEffects:[{preset:'missing'}]}};},c=>{c.elementStyles.sample={animation:'animation-float',animationDuration:600};},c=>{c.screenEffects={home:{surfaceEffects:[{preset:'surface-bokeh',effectSpeed:.2}]}};},c=>{c.elementStyles.sample={animation:'surface-bokeh'};},c=>{c.behaviors.definitions['surface-bokeh'].name='Bez efektu';},c=>{c.behaviors.definitions['animation-float'].settings.duration=-10;},c=>{c.behaviors.definitions['surface-bokeh'].settings.effectSpeed=Infinity;}]){const c=migrateBehaviors(original);mutate(c);assert.throws(()=>validateConfig(c));}
 const c=migrateBehaviors(original),copy=duplicateBehavior(c,'response-confetti','A'.repeat(80));c.behaviors=copy.behaviors;assert.doesNotThrow(()=>validateConfig(c));
});

test('choosing a surface for a whole screen never creates an invalid recipe state',()=>{
 const c=migrateBehaviors(original),paths=[];
 const preview={viewId:'home',scope:'global',activeSelection:()=>({id:'layout-root',kind:'container',recipe:'layout',state:'initial'}),edit:(path,value)=>{paths.push(path);const keys=path.split('.');let node=c;for(const key of keys.slice(0,-1))node=node[key]||=( {} );node[keys.at(-1)]=value;}};
 StudioPreview.prototype.writeVisual.call(preview,'surfaceEffects',[{preset:'surface-bokeh'}]);assert.equal(paths[0],'elementStyles.layout.surfaceEffects');validateConfig(c);
 preview.scope='view';StudioPreview.prototype.writeVisual.call(preview,'surfaceEffects',[{preset:'surface-bokeh'}]);assert.equal(paths[1],'elementOverrides.home.layout-root.surfaceEffects');validateConfig(c);
});

test('award entry and idle tuning survives Studio behavior migration independently',()=>{
 const saved=migrateBehaviors(original);validateConfig(saved);
 for(const state of ['empty','earned','mastered']){
  const a=visualValue(original,'spelling-rule',{id:'rule-mastery-badge',kind:'container',recipe:'group-word-award',state}),b=visualValue(saved,'spelling-rule',{id:'rule-mastery-badge',kind:'container',recipe:'group-word-award',state});
  for(const key of ['enterAnimation','enterDuration','enterDistance','idleAnimation','idleDuration','idleDistance'])if(a[key]!==undefined)assert.equal(b[key],a[key],state+'.'+key);
 }
});
