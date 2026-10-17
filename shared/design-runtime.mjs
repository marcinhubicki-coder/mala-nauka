import {resolveBehaviorConfig} from './behaviors.mjs';
import {migrateAtomicConfig} from './atomic-config.mjs';
import {normalizeMission} from './mission-parts.mjs';
import {playScreenBlob} from './screen-blob-transition.mjs';
import {gameSound,installGameSounds} from './sound-runtime.mjs';
import {animatePresence} from './state-motion.mjs';
import {triggerSurfaceEffects} from './surface-effects.mjs';
import {animateScreen,DEFAULT_MOTION,transitionMotion} from './screen-motion.mjs';
import {configureRules} from './rules-library.mjs';
import {configCSS,viewIdFor} from '../design-system/model.mjs';
import {configureAssets, configureAssetLibrary, observeAssets, assetUrl} from './asset-loader.mjs';
import {configureScreenCopy,applyScreenCopy} from './screen-copy.mjs';
import {syncElementMotion} from './element-motion.mjs';
import {visualValue} from './element-styles.mjs';
import {hasViewContract,viewContract} from './view-contracts.mjs';
import {BOUND_VIEW_CONTRACTS} from './view-bindings.mjs';
import {applyCompiledView} from './compiled-runtime.mjs';
import {applyHomeGeometry} from './home-layout.mjs';
const base = new URL('../', import.meta.url);
let config,designSignature,pendingOutgoing;
let inspectorLoader;
function currentViewId(app){
 const popup=document.querySelector('.result-rule-dialog[open]')?'rule':document.querySelector('.spelling-hint-sheet[open]')?'hint':app.classList.contains('paused')?'pause':'';
 const state=app.dataset.state|| (app.querySelector('.answer.wrong')?'feedback-wrong':app.querySelector('.answer.correct')?'feedback-correct':'');
 const trophyDialog=app.querySelector('.trophy-upgrade-dialog[open]');if(trophyDialog)return trophyDialog.dataset.trophyDialog;
 if(app.querySelector('.learning-rule-dialog[open]'))return 'rule-details';
 return viewIdFor({view:app.dataset.view,mode:app.dataset.mode||'spelling',state,hasPlayers:Boolean(app.querySelector('.player-card')),pinPurpose:app.dataset.pinPurpose,historyState:app.dataset.historyState|| (app.querySelector('.progress-achievement-list')?'achievements':app.querySelector('.progress-category-list')?'categories':app.querySelector('.rules-views')?'rules':app.querySelector('.collection-word-grid')?'collection':'dashboard'),popup});
}
const updateView=(root,settings,view)=>{
 if(!root||!view||currentViewId(root)!==view)return;
 if(view==='home')applyHomeGeometry(root,settings);
 // Stateful setup renderers publish only after completing their mount.
 // Every registered view uses its explicit contract in Studio and the PWA.
 // The persistent audio owner delegates the entire screen to its mode iframe.
 // That document mounts and validates its own contract.
 if(root.querySelector(':scope > iframe[data-mode-host]'))return;
 if(root.dataset.scenarioPending||root.dataset.dsContractPending||root.querySelector('.loading')||!root.children.length)return;
 if(BOUND_VIEW_CONTRACTS[view])return applyCompiledView(root,settings,view);
 if(hasViewContract(view)){
  const declared=root.querySelectorAll('[data-ds-contract="v2"]').length;
  if(declared===viewContract(view).length)return applyCompiledView(root,settings,view);
  throw Error('Incomplete compiled screen: '+view+' ('+declared+'/'+viewContract(view).length+')');
 }
 // Only routes outside the 41-view registry may use the historical adapter.
 // A missing or malformed registered contract always fails above.
 inspectorLoader??=import('./element-system.mjs').then(module=>module.annotateElements);
 void inspectorLoader.then(annotate=>{
  // Navigations may occur while import is in flight; never annotate a stale
  // screen or overwrite a newer design revision.
  if(root!==document.getElementById('app')||document.documentElement.dataset.dsView!==view||config!==settings)return;
  annotate(root,settings,view);
 }).catch(error=>console.error('[design-inspector]',error));
};
export function prepareScreenChange(app,nextView){
 if(!app||app.dataset.view===nextView||!config)return;
 const to=nextView==='history'?'progress':nextView==='wizard'?(app.dataset.mode||'spelling')+'-settings':nextView;
 const motion=transitionMotion(config.motion||DEFAULT_MOTION,document.documentElement.dataset.dsView,to);
 if(motion.style!=='blob'||motion.speed===0)return;
 pendingOutgoing={from:document.documentElement.dataset.dsView,node:app.cloneNode(true),background:getComputedStyle(document.body).background};
}
export function applyDesign(value) {
  value=resolveBehaviorConfig(migrateAtomicConfig(value));
  const nextSignature=JSON.stringify(value);if(nextSignature===designSignature)return;designSignature=nextSignature;
  const css = configCSS(value);
  let style = document.getElementById('ds-tokens');
  if (!style) {style = document.createElement('style'); style.id = 'ds-tokens'; document.head.append(style);}
  style.textContent = css; config = value;
  gameSound.configure(value.sound);
  window.__MALA_NAUKA_DESIGN__ = value;
  document.documentElement.dataset.dsRevision = String(value.revision);
  configureScreenCopy(value.copyOverrides||[]);
  updateView(document.getElementById('app'),value,document.documentElement.dataset.dsView);
  document.dispatchEvent(new CustomEvent('mala-nauka:design', {detail:value}));
}
export const currentDesign = () => config;
export async function initDesign() {
  const [settings, catalog, rules] = await Promise.all(['design-system/config.json','design-system/assets.json','design-system/rules.json'].map(async path => {
    const response = await fetch(new URL(path, window.__DS_CONTENT_ORIGIN__ || base),{cache:'no-cache'});
    if (!response.ok) throw Error(`Brak wspólnego pliku: ${path}`);
    return response.json();
  }));
  configureRules(rules);
  configureAssetLibrary(settings.branch?.startsWith('refactor/v2-')?base.href:null);
  configureAssets(catalog, window.__DS_ASSET_ORIGIN__ || base.href);
  let fonts = document.getElementById('ds-font-faces');
  if (!fonts) {fonts = document.createElement('style'); fonts.id = 'ds-font-faces'; document.head.append(fonts);}
  const faces = [['MN Body','nunito-variable.woff','200 1000'],['MN UI','dosis-variable.woff','200 800'],['MN Display','dynapuff-polish-700.woff','700'],['MN Flag','fredoka-polish-v1.woff','300 700']];
  fonts.textContent = faces.map(([name,file,weight]) => `@font-face{font-family:"${name}";src:url("${assetUrl('assets/fonts/'+file)}") format("woff");font-style:normal;font-weight:${weight};font-display:swap}`).join('');
  applyDesign(settings); observeAssets();
  const app = document.getElementById('app');
  installGameSounds(app);
  let previousScreen,screenAnimation;
  const annotate = () => {
    if (!app) return;
    if(app.dataset.ds!=='1')app.dataset.ds='1';
    if(location.pathname.includes('/matematyka/')){
      if(app.dataset.mode!=='math')app.dataset.mode='math';
      const mathView=app.querySelector('.math-round-summary,.math-result-screen')?'results':app.querySelector('[data-math-quiz],.quiz-screen')?'game':app.querySelector('.category-grid')?'wizard':'';
      if(mathView&&app.dataset.view!==mathView)app.dataset.view=mathView;
    }
    if(app.dataset.view){
      const id=currentViewId(app);
      if(document.documentElement.dataset.dsView!==id)document.documentElement.dataset.dsView=id;
    }
    for (const node of app.querySelectorAll('.jelly-v4-container,.spelling-segmented,.english-segmented,.reading-segmented,.flag-segmented')) if(!node.classList.contains('ds-jelly'))node.classList.add('ds-jelly');
    if(app.dataset.view==='wizard')normalizeMission(app,app.dataset.mode,assetUrl);
    applyScreenCopy(app);
    const screen=document.documentElement.dataset.dsView;if(screen&&previousScreen&&screen!==previousScreen&&(app.dataset.view!=='game'||!/-initial$|-correct$|-wrong$/.test(previousScreen))){screenAnimation?.cancel();const motion=transitionMotion(config.motion||DEFAULT_MOTION,previousScreen,screen);if(!document.documentElement.classList.contains('result-transition')&&!window.__MALA_NAUKA_EXTERNAL_TRANSITION__){if(motion.style==='blob'&&pendingOutgoing?.from===previousScreen&&!matchMedia('(prefers-reduced-motion: reduce)').matches){screenAnimation=playScreenBlob({incoming:app,outgoing:pendingOutgoing.node,background:pendingOutgoing.background,config:config.exitTransition,speed:motion.speed});}else screenAnimation=animateScreen(app,motion);}pendingOutgoing=null;}if(screen)previousScreen=screen;
    updateView(app,config,document.documentElement.dataset.dsView);
  };
  let annotationFrame=0,presenceRecords=[];
  if (app) new MutationObserver(records=>{
    const meaningful=records.some(record=>{
      if(record.target.closest?.('[data-mn-decoration]'))return false;
      if(record.type==='childList')return true;
      if(record.attributeName!=='class')return true;
      if(record.oldValue===record.target.getAttribute('class'))return false;
      // Choosing a maths setup option only changes visual selection classes.
      // Re-annotating the whole design tree here causes an unnecessary WebKit
      // repaint of the hero and makes attached particles appear to jump.
      if(record.target.matches?.('.category-card,.math-duration-choice')){
        const node=record.target;syncElementMotion(node,visualValue(config,document.documentElement.dataset.dsView,{id:node.dataset.dsElement,recipe:node.dataset.dsRecipe,kind:node.dataset.dsKind}));return false;
      }
      return true;
    });
    if(meaningful){
      presenceRecords.push(...records);
      if(!annotationFrame)annotationFrame=requestAnimationFrame(()=>{
        annotationFrame=0;const batch=presenceRecords;presenceRecords=[];
        annotate();animatePresence(batch);
      });
    }
  }).observe(document.body, {childList:true,subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['class','data-view','data-mode','data-state','data-history-state','data-scenario-pending','open']});
  if(app)app.addEventListener('change',event=>{const label=event.target.closest?.('label');if(!label)return;for(const node of label.parentElement.children)if(node.dataset.dsElement)syncElementMotion(node,visualValue(config,document.documentElement.dataset.dsView,{id:node.dataset.dsElement,recipe:node.dataset.dsRecipe,kind:node.dataset.dsKind}));});
  if(app)app.addEventListener('click',event=>{if(event.target.closest('[data-action=answer],.math-answer,.answer'))queueMicrotask(()=>triggerSurfaceEffects(app,'answer'));});
  annotate();
  return settings;
}
export const designReady = initDesign().catch(error => {
  console.error('[design-system]', error.message);
  document.documentElement.dataset.dsError = error.message;
  throw error;
});
