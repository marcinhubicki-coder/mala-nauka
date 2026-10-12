import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPELLING_SETTINGS_CONTRACT,spellingAttrs,validateSpellingSettingsContract} from '../shared/spelling-settings-contract.mjs';
test('Spelling Jelly has 24 stable group/atom identities',()=>{
 assert.equal(validateSpellingSettingsContract(),true);
 const ids=Object.keys(SPELLING_SETTINGS_CONTRACT);
 assert.equal(ids.length,24);
 assert.equal(new Set(ids).size,24);
 for(const group of ['scope-section','level-section','round-section'])assert.equal(SPELLING_SETTINGS_CONTRACT['spelling-'+group].level,'group');
 for(const key of ['scope-all','scope-dictation','level-2','duration-180','word-limit-40'])assert.match(spellingAttrs(key),/data-ds-element="spelling-/);
});
test('Spelling renderer uses contract keys and only watches direct screen changes',()=>{
 const src=readFileSync(new URL('../ortografia/wizard-v2.mjs',import.meta.url),'utf8');
 for(const part of ['scope-section','scope-jelly','level-section','level-jelly','round-section','limit-jelly','time-jelly','count-jelly'])assert.ok(src.includes("spellingAttrs('"+part+"')"));
 assert.match(src,/observer\.observe\(root,\{childList:true,subtree:false\}\)/);
});
