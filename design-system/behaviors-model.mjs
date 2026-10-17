import {DEFAULT_EFFECTS,normalizeEffectsConfig,validateEffects} from '../spelling/effect-model.mjs';
import {BEHAVIOR_KINDS,EFFECT_RULE_KEYS,ANIMATION_NAMES,ANIMATION_SLOTS,MOTION_TOKEN_KEYS,behaviorReferences,behaviorDefinition} from '../shared/behaviors.mjs';
import {validateSurface} from '../shared/surface-effects.mjs';
import {validateMotion} from '../shared/screen-motion.mjs';
import {validateLogoTransition} from '../shared/logo-transition.mjs';
import {safeKeys,validateTokens} from './validation.mjs';
export function validateBehaviors(config){
 const b=config.behaviors;if(!b)return;
 if(b.schemaVersion!==1||!b.definitions||Array.isArray(b.definitions)||Object.keys(b.definitions).length>500)throw Error('Nieprawidłowa biblioteka zachowań.');
 safeKeys(b);safeKeys(b.definitions);safeKeys(b.bindings||{});const names=new Set();
 for(const [id,d]of Object.entries(b.definitions)){
  if(!/^[a-z][a-z0-9-]{0,100}$/.test(id)||!d||!Object.hasOwn(BEHAVIOR_KINDS,d.kind)||typeof d.name!=='string'||!d.name.trim()||d.name.length>80||/[<>\u0000-\u001f]/.test(d.name)||!d.settings||Array.isArray(d.settings))throw Error('Sprawdź nazwę i ustawienia zachowania.');safeKeys(d);safeKeys(d.settings);
  const name=d.kind+':'+d.name.trim().toLocaleLowerCase('pl');if(names.has(name))throw Error('Ta nazwa jest już używana w tej grupie.');names.add(name);
  if(d.kind==='surface'){validateSurface(d.settings);if(d.type!==d.settings.effect||Object.keys(d.settings).some(k=>!k.startsWith('effect')))throw Error('Nieprawidłowy przepis powierzchni.');}
  else if(d.kind==='transition'){validateMotion(d.settings);if(d.type!==d.settings.style)throw Error('Nieprawidłowy typ przejścia.');}
  else if(['animation','state'].includes(d.kind)){if(d.kind==='animation'&&!Object.hasOwn(ANIMATION_NAMES,d.type)||Object.keys(d.settings).some(k=>!['duration','distance'].includes(k))||!Number.isFinite(d.settings.duration)||d.settings.duration<0||d.settings.duration>(d.kind==='state'?2000:6000)||!Number.isFinite(d.settings.distance)||d.settings.distance<0||d.settings.distance>60)throw Error('Sprawdź czas i siłę animacji.');}
  else if(d.kind==='effectRules'){if(Object.keys(d.settings).some(k=>!EFFECT_RULE_KEYS.includes(k)))throw Error('Nieznana zasada efektów gry.');validateEffects({...normalizeEffectsConfig(DEFAULT_EFFECTS),...d.settings});}
  else if(['logo','exit'].includes(d.kind))validateLogoTransition(d.settings);
  else if(['ambient','combo','wrong','response'].includes(d.kind)){const e=normalizeEffectsConfig(DEFAULT_EFFECTS);e.presets.spark.enabled=true;if(d.kind==='response')e.presets.confetti={...d.settings,name:d.name};else e[d.kind==='combo'?'comboGlobal':d.kind]=d.settings;if(d.type!==d.settings.style)throw Error('Nieprawidłowy typ efektu gry.');validateEffects(e);}
  else {if(Object.keys(d.settings).some(k=>!MOTION_TOKEN_KEYS[d.kind].includes(k)))throw Error('Nieznany parametr zachowania.');validateTokens({[d.kind]:d.settings},true);}
 }
 const checkStyle=row=>{if(Object.keys(row).some(k=>/^(animation|active|idle|enter|exit|state)(Duration|Distance)$/.test(k)||k.startsWith('effect')))throw Error('Parametry ruchu i powierzchni edytuj w bibliotece Zachowania.');for(const slot of ANIMATION_SLOTS)if(row[slot]!==undefined&&!behaviorDefinition(config,row[slot],'animation'))throw Error('Wybierz nazwany przepis animacji.');for(const r of row.surfaceEffects||[])if(Object.keys(r).length!==1||!behaviorDefinition(config,r.preset,'surface'))throw Error('Wybierz nazwany przepis powierzchni.');};
 for(const row of Object.values(config.elementStyles||{}))checkStyle(row);for(const rows of Object.values(config.familyStyles||{}))for(const row of Object.values(rows))checkStyle(row);for(const states of Object.values(config.recipeStates||{}))for(const row of Object.values(states))checkStyle(row);for(const rows of Object.values(config.elementOverrides||{}))for(const row of Object.values(rows))checkStyle(row);for(const states of Object.values(config.elementStates||{}))for(const rows of Object.values(states))for(const row of Object.values(rows))checkStyle(row);for(const row of Object.values(config.screenEffects||{}))checkStyle(row);
 for(const r of behaviorReferences(config))if(!behaviorDefinition(config,r.id,r.kind))throw Error('Nieprawidłowe przypisanie zachowania: '+r.path);
 const bnd=b.bindings||{};for(const scope of ['families','views']){safeKeys(bnd[scope]||{});for(const [owner,rows]of Object.entries(bnd[scope]||{})){if(!/^[a-z0-9-]+$/.test(owner))throw Error('Nieprawidłowy odbiorca zachowania.');safeKeys(rows);}}
}
