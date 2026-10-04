import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {componentName,effectiveValue,savedMarker,compareSelection} from '../design-system/preview-model.mjs';
import {validateConfig,changedViews} from '../design-system/model.mjs';

const config=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url)));
const registry=JSON.parse(await readFile(new URL('../design-system/registry.json',import.meta.url)));

test('comparison keeps only unique related views and never loses its final screen',()=>{
  assert.deepEqual(compareSelection(registry,'jelly',['spelling-settings','spelling-settings','english-initial'],'spelling-settings'),['spelling-settings']);
  assert.deepEqual(compareSelection(registry,'jelly',[],'spelling-settings'),['spelling-settings']);
});
test('saved slider values follow the saved view override, not the current global draft',()=>{
  const saved=structuredClone(config),draft=structuredClone(config);
  saved.overrides['english-settings']={jelly:{height:58}};
  draft.tokens.jelly.height=62;
  assert.equal(effectiveValue(saved,'english-settings','jelly','height','view'),58);
  assert.equal(effectiveValue(draft,'english-settings','jelly','height','view'),62);
  assert.equal(savedMarker(54,28,96),26/68*100);
  assert.equal(savedMarker(200,28,96),100);
});
test('renaming preserves component identity and only marks its actual related views',()=>{
  const draft=structuredClone(config);draft.componentNames={jelly:'Przełącznik opcji'};
  validateConfig(draft);
  assert.equal(componentName(registry.components.find(row=>row.id==='jelly'),draft),'Przełącznik opcji');
  assert.deepEqual(changedViews([{path:'componentNames.jelly'}],registry).map(view=>view.id),registry.views.filter(view=>view.components.includes('jelly')).map(view=>view.id));
  draft.componentNames.jelly='<script>';assert.throws(()=>validateConfig(draft));
  draft.componentNames={unknown:'Nazwa'};assert.throws(()=>validateConfig(draft));
});
