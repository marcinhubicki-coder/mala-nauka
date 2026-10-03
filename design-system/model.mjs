// Shared, dependency-free contract. Studio, runtime and Git use this model.
export const SCHEMA_VERSION = 1;
export const clone = value => structuredClone(value);
export const get = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
export function set(object, path, value) {
  const keys = path.split('.');
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
  for (const role of ['body','ui','display','flag']) if (!FONT_IDS.includes(config.typography?.[role])) throw Error(`Nieprawidłowy font: ${role}.`);
  const visit = (node, path = '') => {
    for (const [key, value] of Object.entries(node || {})) {
      if (value && typeof value === 'object') visit(value, `${path}.${key}`);
      else if (typeof value === 'number' && (!Number.isFinite(value) || value < 0 || value > 4000)) throw Error(`Nieprawidłowa wartość: ${path}.${key}.`);
      else if (typeof value === 'string' && /[{};<>]|url\s*\(|expression\s*\(/i.test(value)) throw Error(`Niedozwolona wartość: ${path}.${key}.`);
    }
  };
  visit(config.tokens); visit(config.themes); visit(config.overrides);
  if (!(config.tokens?.jelly?.height >= 28 && config.tokens.jelly.height <= 96)) throw Error('Wysokość jelly musi mieścić się w zakresie 28–96 px.');
  if (!(config.tokens?.layout?.canvasWidth >= 320 && config.tokens.layout.canvasWidth <= 480)) throw Error('Szerokość płótna: 320–480 px.');
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
  return css;
}
export function changedViews(changes, registry) {
  return registry.views.filter(view => changes.some(change => {
    if (change.path.startsWith('overrides.')) return change.path.split('.')[1] === view.id;
    if (change.path.startsWith('themes.')) return change.path.split('.')[1] === view.mode;
    if (change.path.startsWith('typography.')) return true;
    const component = change.path.split('.')[1];
    return view.components.some(id => registry.components.find(item => item.id === id)?.tokenGroup === component);
  }));
}
