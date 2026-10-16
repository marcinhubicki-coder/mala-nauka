import {canonicalWords} from '../spelling/word-pools.mjs';
import {resolveRules,configureRules,ruleLibrary} from './rules-library.mjs';
import {validateAssets} from '../design-system/validation.mjs';
const projectRoot = new URL('../', import.meta.url);
let manifest = {assets:[], aliases:{}, words:{}, revision:'unloaded'}, origin = projectRoot.href;
let index = new Map(), previewURLs={}, libraryOrigin=null;
// Kept separate from the word/content origin. After a Studio save that origin
// points at an app commit which deliberately contains no new image bytes.
export function configureAssetLibrary(base=null){libraryOrigin=base?new URL(base,projectRoot).href:null;}
export function configureAssets(value, base = projectRoot.href) {
  validateAssets(value);
  manifest = value; origin = base.endsWith('/') ? base : `${base}/`;
  index = new Map(value.assets.map(asset => [asset.path, asset]));
}
export function assetUrl(path) {
  if (!path) return '';
  const clean = String(path).replace(/^.*?\/assets\//, 'assets/').replace(/^\.\.\//,'').replace(/^\//,'').split('?')[0];
  const canonical = manifest.aliases[clean] || clean;
  const base=libraryOrigin&&/^assets\/.+\.(?:png|jpe?g|webp|avif|svg)$/i.test(canonical)?libraryOrigin:origin;
  return previewURLs[canonical] || new URL(canonical, base).href;
}
export function wordAsset(word, fallback = '') { return assetUrl(manifest.words[word]?.path || fallback); }
export function assetInfo(path) { return index.get(manifest.aliases[path] || path); }
export function assetManifest() { return manifest; }
export function rewriteAssetNodes(root = document) {
  const nodes = [...(root.matches?.('img,image,link,source,video') ? [root] : []), ...root.querySelectorAll?.('img,image,link[rel="preload"][as="image"],source,video') || []];
  for (const node of nodes) {
    for (const attr of ['src','href','poster']) {
      const value = node.getAttribute(attr);
      if (!value || !/(^|\/)assets\//.test(value) || /^blob:|^data:/.test(value)) continue;
      const next = assetUrl(value);
      if (new URL(value, document.baseURI).href !== next) node.setAttribute(attr, next);
    }
  }
}
let observed = false;
export function observeAssets() {
  if (observed) return;
  observed = true; rewriteAssetNodes();
  const queue = new Set(); let pending = false;
  new MutationObserver(records => {
    for (const record of records) if (record.type === 'attributes') queue.add(record.target); else for (const node of record.addedNodes) if (node.nodeType === 1) queue.add(node);
    if (!pending) {pending = true; queueMicrotask(() => {pending = false; for (const node of queue) rewriteAssetNodes(node); queue.clear();});}
  }).observe(document.documentElement, {childList:true,subtree:true,attributes:true,attributeFilter:['src','href','poster']});
}
export async function preloadAssets(paths) {
  return Promise.allSettled(paths.map(path => new Promise((resolve,reject) => {
    const picture = new Image(); picture.onload = resolve; picture.onerror = reject; picture.src = assetUrl(path);
  })));
}
export function playableWords(rows,catalog=manifest){
  const paths=new Set(catalog.assets.map(asset=>asset.path));
  return rows.filter(row=>paths.has(catalog.words[row.word]?.path));
}
export async function loadWords({raw=false}={}) {
  const base = window.__DS_CONTENT_ORIGIN__ || projectRoot.href;
  const parts = await Promise.all(Array.from({length:8}, async (_, index) => {
    const response = await fetch(new URL(`data/words-0${index+1}.json`, base));
    if (!response.ok) throw Error('Nie udało się wczytać wspólnej bazy słów.');
    return response.json();
  }));
  if(!ruleLibrary()){const response=await fetch(new URL('design-system/rules.json',base),{cache:'no-cache'});if(!response.ok)throw Error('Nie udało się wczytać wspólnej biblioteki zasad.');configureRules(await response.json());}
  if(raw)return parts.flat();
  if(manifest.revision==='unloaded'){const response=await fetch(new URL('design-system/assets.json',base),{cache:'no-cache'});if(!response.ok)throw Error('Nie udało się wczytać wspólnej bazy ilustracji.');configureAssets(await response.json(),base);}
  return resolveRules(playableWords(canonicalWords(parts.flat())));
}

export function previewAssets(urls={}){previewURLs=urls;}

// A deferred library deliberately does not install the entire photo bank.
// Offline rounds use illustrations already fetched by this PWA.
export async function offlinePlayableWords(rows,{online=globalThis.navigator?.onLine!==false,cacheStorage=globalThis.caches}={}){
 if(online)return rows;if(!cacheStorage)return [];
 const cached=await cachedGraphicPaths(cacheStorage);
 return rows.filter(row=>{const path=wordAsset(row.word);return path&&cached.has(new URL(path,projectRoot).pathname);});
}
export async function cachedGraphicPaths(cacheStorage=globalThis.caches){
 const cached=new Set();if(!cacheStorage)return cached;
 for(const name of await cacheStorage.keys()){
  const cache=await cacheStorage.open(name);
  for(const request of await cache.keys())cached.add(new URL(request.url,projectRoot).pathname);
 }
 return cached;
}
