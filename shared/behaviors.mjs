import {DEFAULT_EFFECTS,AMBIENT_PRESETS,AMBIENT_STYLES,EFFECT_STYLES,normalizeEffectsConfig} from '../spelling/effect-model.mjs';
import {SURFACE_EFFECTS,surfacePreset,surfaceStack} from './surface-effects.mjs';
import {DEFAULT_MOTION,transitionMotion} from './screen-motion.mjs';
import {DEFAULT_LOGO_TRANSITION} from './logo-transition.mjs';
import {EXIT_BLOB_CONFIG} from './screen-blob-transition.mjs';
import {PART_BY_ID,recipeLineage} from './structure-model.mjs';
import {DEFAULT_ENGLISH_WORD_FLIP} from './english-word-flip.mjs';

// Saved consumers contain references. Expansion is transient and never saved.
export const ANIMATION_NAMES={none:'Bez animacji',float:'Spokojne unoszenie',pulse:'Miękki puls',sway:'Kołysanie',enter:'Wejście z przesunięciem',fade:'Płynne pojawienie',bump:'Pojawienie i bump'};
export const ANIMATION_SLOTS=['animation','activeAnimation','idleAnimation','enterAnimation','exitAnimation'];
export const MOTION_TOKEN_KEYS={
 slider:['threshold'],
 jelly:['duration','stretch','recoil','bounce','inertia','magnet','squish','tilt','glow','shine','blur','saturation','contrast','inkDelay','inkDuration','inkBump','inkGlow','inkFade','inkBlur'],
 sliderWrong:['springDuration','springOvershoot','fillDuration','completionDelay','glowBlur','sparkDuration'],
 sliderResult:['springDuration','springOvershoot','fillDuration','completionDelay','glowBlur','doneDuration'],
 progress:['duration','easePower','stretch','bounce','wobble','startKick','flash','finishDuration'],
 resultText:['settlePercent','rollDuration','hundredPause','hundredStagger','hundredRevealDelay','kickDuration','handoffDelay'],
 englishWordFlip:Object.keys(DEFAULT_ENGLISH_WORD_FLIP),
};
export const EFFECT_RULE_KEYS=['enabled','correctStyle','randomize','comboEvery','comboBoost','particleBudget'];
export const BEHAVIOR_KINDS={effectRules:'Uruchamianie efektów gry',slider:'Próg ukończenia slidera',ambient:'Klimat gry',combo:'Efekt combo',wrong:'Efekt błędu',response:'Efekty odpowiedzi',surface:'Efekty powierzchni',animation:'Animacje elementów',state:'Zmiana rozmiaru',transition:'Przejścia ekranów',jelly:'Jelly',sliderWrong:'Slider po błędzie',sliderResult:'Slider nowej rundy',progress:'Pasek wyniku',resultText:'Liczby wyniku',englishWordFlip:'Zmiana słowa · angielski',logo:'Loader logo',exit:'Kolory i biały blob'};
export const isMotionToken=(group,key)=>MOTION_TOKEN_KEYS[group]?.includes(key)||false;
const copy=v=>structuredClone(v);
const pick=(value,keys)=>Object.fromEntries(keys.filter(k=>value?.[k]!==undefined).map(k=>[k,copy(value[k])]));
export function behaviorEntries(config,kind){return Object.entries(config?.behaviors?.definitions||{}).filter(([,d])=>!kind||d.kind===kind);}
export function behaviorDefinition(config,id,kind){const d=config?.behaviors?.definitions?.[id];return d&&(!kind||d.kind===kind)?d:undefined;}
export function duplicateBehavior(config,id,name){
 const next=copy(config.behaviors),source=next.definitions[id];if(!source)throw Error('Wybierz efekt do skopiowania.');
 const root=id.slice(0,88);let n=2,newId=root+'-copy-'+n;while(next.definitions[newId])newId=root+'-copy-'+(++n);
 next.definitions[newId]={...copy(source),name};return {behaviors:next,id:newId};
}
export function expandBehaviorStyle(config,row={}){
 if(!config?.behaviors)return row;
 const result={...row};
 if(row.surfaceEffects)result.surfaceEffects=row.surfaceEffects.map(r=>r.preset?copy(behaviorDefinition(config,r.preset,'surface')?.settings||{}):r);
 for(const slot of ANIMATION_SLOTS){const d=behaviorDefinition(config,row[slot],'animation');if(!d)continue;result[slot]=d.type;const prefix=slot==='animation'?'animation':slot.replace('Animation','');result[prefix+'Duration']=d.settings.duration;result[prefix+'Distance']=d.settings.distance;}
 const state=behaviorDefinition(config,row.statePreset,'state');if(state){result.stateDuration=state.settings.duration;result.stateDistance=state.settings.distance;}delete result.statePreset;
 return result;
}
function styleRows(config,visit){
 for(const [id,row]of Object.entries(config.elementStyles||{}))visit(row,'elementStyles.'+id,id);
 for(const [mode,rows]of Object.entries(config.familyStyles||{}))for(const [id,row]of Object.entries(rows))visit(row,`familyStyles.${mode}.${id}`,id);
 for(const [id,states]of Object.entries(config.recipeStates||{}))for(const [state,row]of Object.entries(states))visit(row,`recipeStates.${id}.${state}`,id);
 for(const [view,rows]of Object.entries(config.elementOverrides||{}))for(const [id,row]of Object.entries(rows))visit(row,`elementOverrides.${view}.${id}`,id);
 for(const [view,states]of Object.entries(config.elementStates||{}))for(const [state,rows]of Object.entries(states))for(const [id,row]of Object.entries(rows))visit(row,`elementStates.${view}.${state}.${id}`,id);
}
export function resolveBehaviorConfig(input){
 if(!input?.behaviors)return input;
 const c=copy(input),bindings=c.behaviors.bindings||{};
 const tokens=(target,refs)=>{for(const [group,id]of Object.entries(refs||{})){const d=behaviorDefinition(c,id,group);if(!d)continue;target[group]={...target[group],...copy(d.settings)};}};
 tokens(c.tokens,bindings.global);
 for(const [mode,refs]of Object.entries(bindings.families||{})){c.familyTokens||={};c.familyTokens[mode]||={};tokens(c.familyTokens[mode],refs);}
 for(const [view,refs]of Object.entries(bindings.views||{})){c.overrides||={};c.overrides[view]||={};tokens(c.overrides[view],refs);}
 styleRows(c,row=>{const expanded=expandBehaviorStyle(c,row);for(const k of Object.keys(row))delete row[k];Object.assign(row,expanded);});
 for(const [view,row]of Object.entries(c.screenEffects||{}))c.screenEffects[view]=expandBehaviorStyle(c,row);
 for(const target of ['logo','exit']){const d=behaviorDefinition(c,bindings[target],target);if(d)c[target==='logo'?'logoTransition':'exitTransition']=copy(d.settings);}
 c.effects=normalizeEffectsConfig(c.effects);const rules=behaviorDefinition(c,bindings.effectRules,'effectRules');if(rules)Object.assign(c.effects,copy(rules.settings));for(const [kind,key]of [['ambient','ambient'],['combo','comboGlobal'],['wrong','wrong']]){const d=behaviorDefinition(c,bindings[kind],kind);if(d)c.effects[key]=copy(d.settings);}
 for(const [key,id]of Object.entries(bindings.response||{})){const d=behaviorDefinition(c,id,'response');if(d)c.effects.presets[key]={...copy(d.settings),name:d.name};}
 if(c.motion){for(const [key,row]of Object.entries(c.motion.defaults||{}))if(row.preset)c.motion.defaults[key]=copy(behaviorDefinition(c,row.preset,'transition')?.settings||DEFAULT_MOTION);const d=behaviorDefinition(c,c.motion.defaultPreset,'transition');if(d)Object.assign(c.motion,copy(d.settings));delete c.motion.defaultPreset;for(const [key,row]of Object.entries(c.motion.transitions||{}))if(row.preset)c.motion.transitions[key]=copy(behaviorDefinition(c,row.preset,'transition')?.settings||DEFAULT_MOTION);}
 delete c.behaviors;return c;
}

export function migrateBehaviors(input){
 const c=copy(input);if(c.behaviors)return c;
 const library={schemaVersion:1,definitions:{},bindings:{global:{},families:{},views:{}}};c.behaviors=library;
 const add=(kind,type,settings,label)=>{const found=Object.entries(library.definitions).find(([,d])=>d.kind===kind&&d.type===type&&JSON.stringify(d.settings)===JSON.stringify(settings));if(found)return found[0];const root=(kind+'-'+(type||'default')).toLowerCase();let id=root,n=1;while(library.definitions[id])id=root+'-'+(++n);library.definitions[id]={kind,...(type?{type}:{}),name:label+(n>1?' · wariant '+n:''),settings:copy(settings)};return id;};
 for(const [type,name]of Object.entries(SURFACE_EFFECTS))add('surface',type,surfacePreset(type),name);
 for(const [type,name]of Object.entries(ANIMATION_NAMES))add('animation',type,{duration:1600,distance:6},name);
 add('state','',{duration:260,distance:6},'Płynna zmiana rozmiaru');
 for(const [type,name]of Object.entries({none:'Bez animacji',fade:'Łagodne pojawienie',blur:'Przejście przez blur',blob:'Kolory → Biały blob → Wejście'}))add('transition',type,{...DEFAULT_MOTION,style:type},name);
 const migrateSurface=row=>{if(!row.surfaceEffects&&!Object.keys(row).some(k=>k.startsWith('effect')))return;row.surfaceEffects=surfaceStack(row).map(settings=>({preset:add('surface',settings.effect,settings,SURFACE_EFFECTS[settings.effect])}));for(const key of Object.keys(row))if(key.startsWith('effect'))delete row[key];};
 // Migrate complete, effective definitions before removing local numeric tuning.
 const originals=copy(input.elementStyles||{});
 styleRows(c,(row,path,id)=>{
  const parts=path.split('.'),mode=parts[0]==='familyStyles'?parts[1]:['elementOverrides','elementStates'].includes(parts[0])?parts[1].split('-')[0]:undefined,state=parts[0]==='recipeStates'?parts[2]:parts[0]==='elementStates'?parts[2]:'default',lineage=recipeLineage(id);
  const inherited={...originals[PART_BY_ID[id]?.kind],...Object.assign({},...lineage.map(recipe=>({...originals[recipe],...input.familyStyles?.[mode]?.[recipe]}))),...originals[id],...Object.assign({},...lineage.map(recipe=>input.recipeStates?.[recipe]?.[state])),...row};
  const hasTune=Object.keys(row).some(k=>/^(animation|active|idle|enter|exit|state)(Duration|Distance)$/.test(k));
  for(const slot of ANIMATION_SLOTS){const type=row[slot]??(hasTune?inherited[slot]:undefined),prefix=slot==='animation'?'animation':slot.replace('Animation','');if(type!==undefined)row[slot]=add('animation',type,{duration:inherited[prefix+'Duration']??(['enter','exit'].includes(prefix)?(inherited.stateDuration??260):(inherited.animationDuration??1600)),distance:inherited[prefix+'Distance']??(['enter','exit'].includes(prefix)?(inherited.stateDistance??6):(inherited.animationDistance??6))},ANIMATION_NAMES[type]||type);}
  if(row.stateDuration!==undefined||row.stateDistance!==undefined)row.statePreset=add('state','',{duration:inherited.stateDuration??260,distance:inherited.stateDistance??6},'Płynna zmiana rozmiaru');
  for(const key of Object.keys(row))if(/^(animation|active|idle|enter|exit|state)(Duration|Distance)$/.test(key))delete row[key];migrateSurface(row);
 });
 for(const row of Object.values(c.screenEffects||{}))migrateSurface(row);
 for(const [group,keys]of Object.entries(MOTION_TOKEN_KEYS)){
  const settings=pick(group==='englishWordFlip'?{...DEFAULT_ENGLISH_WORD_FLIP,...c.tokens?.[group]}:c.tokens?.[group],keys);if(!Object.keys(settings).length)continue;
  library.bindings.global[group]=add(group,'',settings,BEHAVIOR_KINDS[group]);
  for(const k of keys)if(c.tokens?.[group])delete c.tokens[group][k];
  for(const [mode,rows]of Object.entries(c.familyTokens||{}))if(keys.some(k=>rows[group]?.[k]!==undefined)){library.bindings.families[mode]||={};library.bindings.families[mode][group]=add(group,'',{...settings,...pick(rows[group],keys)},BEHAVIOR_KINDS[group]+' · '+mode);for(const k of keys)delete rows[group][k];}
  for(const [view,rows]of Object.entries(c.overrides||{}))if(keys.some(k=>rows[group]?.[k]!==undefined)){library.bindings.views[view]||={};const family=library.definitions[library.bindings.families[view.split('-')[0]]?.[group]]?.settings;library.bindings.views[view][group]=add(group,'',{...settings,...family,...pick(rows[group],keys)},BEHAVIOR_KINDS[group]+' · '+view);for(const k of keys)delete rows[group][k];}
 }
 for(const [target,settings]of [['logo',{...DEFAULT_LOGO_TRANSITION,...c.logoTransition}],['exit',{...EXIT_BLOB_CONFIG,...c.exitTransition}]])library.bindings[target]=add(target,'',settings,BEHAVIOR_KINDS[target]);
 const effects=normalizeEffectsConfig(c.effects);library.bindings.effectRules=add('effectRules','',pick(effects,EFFECT_RULE_KEYS),BEHAVIOR_KINDS.effectRules);
 library.bindings.response={};for(const [id,p]of Object.entries(effects.presets))library.bindings.response[id]=add('response',p.style,p,p.name);
 for(const [id,p]of Object.entries(DEFAULT_EFFECTS.presets))add('response',p.style,p,p.name);
 for(const [style,name]of Object.entries(AMBIENT_STYLES))add('ambient',style,{...effects.ambient,style},name);
 for(const [style,name]of Object.entries(EFFECT_STYLES))add('wrong',style,{...effects.wrong,style},name+' · błąd');
 for(const p of Object.values(AMBIENT_PRESETS))add('ambient',p.style,{...effects.ambient,...Object.fromEntries(Object.entries(p).filter(([k])=>k!=='name'))},p.name);
 for(const style of ['cycle','watercolor','tri-wave','noise','still-fire','liquid-flame','fun-flames'])add('combo',style,{...effects.comboGlobal,style},'Combo · '+style);
 for(const [kind,key,label]of [['ambient','ambient','Klimat gry'],['combo','comboGlobal','Combo w grze'],['wrong','wrong','Reakcja po błędzie']])library.bindings[kind]=add(kind,effects[key].style,effects[key],label);
 const motion=c.motion||DEFAULT_MOTION;c.motion={...motion,defaultPreset:add('transition',motion.style,pick({...DEFAULT_MOTION,...motion},Object.keys(DEFAULT_MOTION)),'Domyślne przejście'),transitions:copy(motion.transitions||{})};
 c.motion.defaults={normal:{preset:c.motion.defaultPreset},game:{preset:add('transition','blur',{...DEFAULT_MOTION,...pick(motion,Object.keys(DEFAULT_MOTION)),style:'blur',duration:1500},'Przejście do gry i wyniku')},blob:{preset:add('transition','blob',{...DEFAULT_MOTION,...pick(motion,Object.keys(DEFAULT_MOTION)),style:'blob'},'Przejście przez kolory')}};
 for(const [key,row]of Object.entries(c.motion.transitions)){if(row.inheritReverse)continue;const [from,to]=key.split('--'),settings=transitionMotion(motion,from,to);c.motion.transitions[key]={preset:add('transition',settings.style,settings,({none:'Bez animacji',fade:'Łagodne pojawienie',blur:'Przejście przez blur',blob:'Kolory → Biały blob → Wejście'})[settings.style]||settings.style)};}
 return c;
}

export function behaviorReferences(config){
 const refs=[];const push=(id,kind,path)=>refs.push({id,kind,path});
 styleRows(config,(row,path)=>{for(const slot of ANIMATION_SLOTS)if(row[slot]&&!ANIMATION_NAMES[row[slot]])push(row[slot],'animation',path+'.'+slot);if(row.statePreset)push(row.statePreset,'state',path+'.statePreset');for(const [i,r]of (row.surfaceEffects||[]).entries())if(r.preset)push(r.preset,'surface',path+'.surfaceEffects.'+i);});
 for(const [view,row]of Object.entries(config.screenEffects||{}))for(const [i,r]of (row.surfaceEffects||[]).entries())if(r.preset)push(r.preset,'surface',`screenEffects.${view}.surfaceEffects.${i}`);
 for(const [key,row]of Object.entries(config.motion?.defaults||{}))if(row.preset)push(row.preset,'transition','motion.defaults.'+key);
 if(config.motion?.defaultPreset)push(config.motion.defaultPreset,'transition','motion.defaultPreset');for(const [key,row]of Object.entries(config.motion?.transitions||{}))if(row.preset)push(row.preset,'transition','motion.transitions.'+key);
 const b=config.behaviors?.bindings||{};for(const [group,id]of Object.entries(b.global||{}))push(id,group,'behaviors.bindings.global.'+group);for(const scope of ['families','views'])for(const [owner,rows]of Object.entries(b[scope]||{}))for(const [group,id]of Object.entries(rows))push(id,group,`behaviors.bindings.${scope}.${owner}.${group}`);for(const [key,id]of Object.entries(b.response||{}))push(id,'response','behaviors.bindings.response.'+key);for(const k of ['logo','exit','ambient','combo','wrong','effectRules'])if(b[k])push(b[k],k,'behaviors.bindings.'+k);
 return refs;
}
