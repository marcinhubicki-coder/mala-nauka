import { DURATIONS, Session, validateWords, cleanSettings, accuracy } from './game.mjs?v=26-generated-scenes';
import { MODES, modeIds, cleanConfig, createSource, levelLabel, categoryLabel } from './modes.mjs?v=26-generated-scenes';
import { cleanProgress, migrateProgress, recordResult, localDay } from './progress.mjs';
import { createSpellingArt } from './spelling/art.mjs?v=30-organic-wave';
const root=document.querySelector('#app'), modal=document.querySelector('#modal');
const spellingArt=createSpellingArt(root);
const prefix='malaNauka.v1.';
function read(key,fallback=null) {try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}