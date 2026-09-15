import { SCENES } from './scenes.mjs';

const params = new URLSearchParams(globalThis.location?.search || '');
const normalize = value => String(value || '').trim().toLocaleLowerCase('pl-PL');
const STORAGE_KEY='malaNauka.spelling.assetsOnly';

function storedAssetsOnly(){
  try{return localStorage.getItem(STORAGE_KEY)==='1';}catch{return false;}
}

function assetsOnlyEnabled(){
  const override=params.get('assets');
  if(override==='1')return true;
  if(override==='0')return false;
  if(storedAssetsOnly())return true;
  // Preview branch default: keep review focused on words that already have artwork.
  return true;
}

export const SPELLING_PREVIEW = Object.freeze({
  get assetsOnly(){return assetsOnlyEnabled();},
  word: normalize(params.get('word')),
  scene: normalize(params.get('scene')),
  layout: 'bubble',
});

const availableMasks = new Set(
  [...SCENES.entries()]
    .filter(([,scene]) => Boolean(scene?.asset))
    .map(([masked]) => masked)
);

export function filterSpellingPreview(words){
  let pool = Array.isArray(words) ? words : [];

  if(assetsOnlyEnabled()){
    pool = pool.filter(word => availableMasks.has(word.masked));
  }

  if(SPELLING_PREVIEW.word){
    pool = pool.filter(word => normalize(word.word) === SPELLING_PREVIEW.word);
  }

  if(SPELLING_PREVIEW.scene){
    pool = pool.filter(word => normalize(SCENES.get(word.masked)?.key) === SPELLING_PREVIEW.scene);
  }

  return pool;
}

export function previewSummary(){
  return {
    assetsOnly:assetsOnlyEnabled(),
    word:SPELLING_PREVIEW.word,
    scene:SPELLING_PREVIEW.scene,
    layout:SPELLING_PREVIEW.layout,
    availableScenes:[...availableMasks],
    active:true,
  };
}
