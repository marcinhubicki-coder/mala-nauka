import {configCSS} from '../design-system/model.mjs';
import {configureAssets, observeAssets, assetUrl} from './asset-loader.mjs';
const base = new URL('../', import.meta.url);
let config;
export function applyDesign(value) {
  const css = configCSS(value);
  let style = document.getElementById('ds-tokens');
  if (!style) {style = document.createElement('style'); style.id = 'ds-tokens'; document.head.append(style);}
  style.textContent = css; config = value;
  window.__MALA_NAUKA_DESIGN__ = value;
  document.documentElement.dataset.dsRevision = String(value.revision);
  document.dispatchEvent(new CustomEvent('mala-nauka:design', {detail:value}));
}
export const currentDesign = () => config;
export async function initDesign() {
  const [settings, catalog] = await Promise.all(['design-system/config.json','design-system/assets.json'].map(async path => {
    const response = await fetch(new URL(path, base));
    if (!response.ok) throw Error(`Brak wspólnego pliku: ${path}`);
    return response.json();
  }));
  configureAssets(catalog, window.__DS_ASSET_ORIGIN__ || base.href);
  let fonts = document.getElementById('ds-font-faces');
  if (!fonts) {fonts = document.createElement('style'); fonts.id = 'ds-font-faces'; document.head.append(fonts);}
  const faces = [['MN Body','nunito-variable.woff','200 1000'],['MN UI','dosis-variable.woff','200 800'],['MN Display','dynapuff-polish-700.woff','700'],['MN Flag','fredoka-polish-v1.woff','300 700']];
  fonts.textContent = faces.map(([name,file,weight]) => `@font-face{font-family:"${name}";src:url("${assetUrl('assets/fonts/'+file)}") format("woff");font-style:normal;font-weight:${weight};font-display:swap}`).join('');
  applyDesign(settings); observeAssets();
  const app = document.getElementById('app');
  const annotate = () => {
    if (!app) return;
    app.dataset.ds = '1';
    for (const node of app.querySelectorAll('.jelly-v4-container,.spelling-segmented,.english-segmented,.reading-segmented,.flag-segmented')) node.classList.add('ds-jelly');
  };
  if (app) new MutationObserver(annotate).observe(app, {childList:true,subtree:true});
  annotate();
  return settings;
}
export const designReady = initDesign().catch(error => {
  console.error('[design-system]', error.message);
  document.documentElement.dataset.dsError = error.message;
  throw error;
});
