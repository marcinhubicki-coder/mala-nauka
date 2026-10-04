import {validateRecipes,validateBlueprints,recipesCSS,ATOMS} from '../shared/component-recipes.mjs';
import {validateEffects} from '../spelling/effect-model.mjs';
import {validateScoring} from '../spelling/scoring.mjs';
import {validateMotion} from '../shared/screen-motion.mjs';
import {safeKeys,validateTokens,THEME_FIELDS,MODES} from './validation.mjs';
import {COMPONENT_IDS} from './preview-model.mjs';
// Shared, dependency-free contract. Studio, runtime and Git use this model.
export const SCHEMA_VERSION = 1;
export const clone = value => structuredClone(value);
export const get = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
export function set(object, path, value) {
  const keys = path.split('.');
  if(keys.some(key=>['__proto__','constructor','prototype'].includes(key)))throw Error('Nieprawidłowa ścieżka.');
  let cursor = object;
  for (const key of keys.slice(0, -1)) cursor = cursor[key] ||= {};
  cursor[keys.at(-1)] = value;
}
export function diff(before, after, path = '') {
  const rows = [];
  for (const key of new Set([...Object.keys(before || {}), ...Object.keys(after || {})])) {
    const a = before?.[key], b = after?.[key], next = path ? `${path}.${key}` : key;
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) rows.push(...diff(a, b, next));
    else if (JSON.stringify(a) !== JSON.stringify(b)) rows.push({path: next, before: a, after: b});
  }
  return rows;
}
export const FONT_IDS = ['nunito', 'dosis', 'dynapuff', 'fredoka'];
export const FONT_NAMES = {nunito:'MN Body',dosis:'MN UI',dynapuff:'MN Display',fredoka:'MN Flag'};
export const FONT_FILES = {nunito:'nunito-variable.woff',dosis:'dosis-variable.woff',dynapuff:'dynapuff-polish-700.woff',fredoka:'fredoka-polish-v1.woff'};
export function validateConfig(config) {
  if (config?.schemaVersion !== SCHEMA_VERSION) throw Error('Nieobsługiwana wersja design systemu.');
  safeKeys(config.typography);
  if(Object.keys(config.typography).some(role=>!['body','ui','display','flag'].includes(role)))throw Error('Nieznana rola fontu.');
  for (const role of ['body','ui','display','flag']) if (!FONT_IDS.includes(config.typography?.[role])) throw Error(`Nieprawidłowy font: ${role}.`);
  if(!Number.isInteger(config.revision)||config.revision<1)throw Error('Nieprawidłowa rewizja.');
  if(config.componentNames){
    safeKeys(config.componentNames);
    for(const [id,name] of Object.entries(config.componentNames))if(!COMPONENT_IDS.includes(id)||typeof name!=='string'||!name.trim()||name.length>60||/[<>\u0000-\u001f]/.test(name))throw Error('Nieprawidłowa nazwa elementu.');
  }
  if(config.motion)validateMotion(config.motion);
  if(config.effects)validateEffects(config.effects);if(config.scoring)validateScoring(config.scoring);
  if(config.recipes)validateRecipes(config.recipes);if(config.blueprints)validateBlueprints(config.blueprints);
  validateTokens(config.tokens);
  safeKeys(config.themes);
  for(const mode of MODES){const theme=config.themes[mode];safeKeys(theme);if(THEME_FIELDS.some(key=>!theme[key]))throw Error(`Niepełna paleta: ${mode}.`);for(const [key,value]of Object.entries(theme))if(!THEME_FIELDS.includes(key)||!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value))throw Error(`Nieprawidłowy kolor: ${mode}.${key}.`);}
  if(Object.keys(config.themes).some(mode=>!MODES.includes(mode)))throw Error('Nieznany tryb.');
  safeKeys(config.overrides||{});
  for(const [view,value]of Object.entries(config.overrides||{})){if(!/^[a-z0-9-]+$/.test(view))throw Error('Nieprawidłowy widok.');validateTokens(value,true);}
  return config;
}
const kebab = text => text.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
export function variables(node, prefix = '--ds') {
  let css = '';
  for (const [key, value] of Object.entries(node || {})) {
    const name = `${prefix}-${kebab(key)}`;
    css += value && typeof value === 'object' ? variables(value, name) : `${name}:${value};`;
  }
  return css;
}
export function configCSS(config) {
  validateConfig(config);
  let css = `:root{${variables(config.tokens)}`;
  for (const [role, font] of Object.entries(config.typography)) css += `--ds-font-${role}:"${FONT_NAMES[font]}",ui-rounded,system-ui,sans-serif;`;
  css += '}';
  for (const [mode, theme] of Object.entries(config.themes)) css += `#app[data-mode="${mode}"],.ds-component-stage[data-mode="${mode}"]{${variables(theme, '--ds-theme')}}`;
  for (const [view, overrides] of Object.entries(config.overrides || {})) {
    if (!/^[a-z0-9-]+$/.test(view)) throw Error('Nieprawidłowy identyfikator widoku.');
    css += `html[data-ds-view="${view}"]{${variables(overrides)}}`;
  }
  return css+recipesCSS(config.recipes);
}
export function changedViews(changes, registry) {
  return registry.views.filter(view => changes.some(change => {
    if (change.path.startsWith('overrides.')) return change.path.split('.')[1] === view.id;
    if (change.path.startsWith('themes.')) return change.path.split('.')[1] === view.mode;
    if (change.path.startsWith('motion')) return true;
    if(change.path.startsWith('effects.'))return view.mode==='spelling'&&['initial','correct','wrong','rule','hint'].some(state=>view.id.endsWith('-'+state));
    if(change.path.startsWith('scoring.'))return view.id==='spelling-results';
    if(change.path.startsWith('recipes.'))return ATOMS[change.path.split('.')[1]]?.parents.some(p=>view.components.includes(p))||false;
    if (change.path.startsWith('typography.')) return true;
    if (change.path.startsWith('componentNames.')) return view.components.includes(change.path.split('.')[1]);
    const component = change.path.split('.')[1];
    return view.components.some(id => registry.components.find(item => item.id === id)?.tokenGroup === component);
  }));
}

export function effectiveTokens(group){
 const config=globalThis.__MALA_NAUKA_DESIGN__;
 const view=globalThis.document?.documentElement?.dataset.dsView;
 return {...config?.tokens?.[group],...config?.overrides?.[view]?.[group]};
}

export function viewIdFor({view,mode='spelling',state='',hasPlayers=true,historyState='dashboard',popup=''}){
 if(popup&&mode==='spelling'&&['rule','hint','pause'].includes(popup))return `spelling-${popup}`;
 if(view==='wizard')return `${mode}-settings`;
 if(view==='game')return `${mode}-${state==='feedback-correct'?'correct':state==='feedback-wrong'?'wrong':'initial'}`;
 if(view==='results')return `${mode}-results`;
 if(view==='players')return hasPlayers?'players':'players-empty';
 if(view==='history')return ({dashboard:'progress',achievements:'trophies'})[historyState]||historyState;
 return ['home','settings','player-create','player-pin'].includes(view)?view:'';
}
