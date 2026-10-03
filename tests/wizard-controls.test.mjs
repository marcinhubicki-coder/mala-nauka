import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('flags and spelling production and preview entries use one control skin', async () => {
  for (const path of ['flagi/index.html', 'flagi/preview-frame.html', 'ortografia/index.html', 'ortografia/wizard-preview-frame.html']) {
    const html = await read(path);
    assert.match(html, /shared\/wizard-controls\.css\?v=/);
    assert.ok(html.indexOf('shared/wizard-controls.css') > html.indexOf('retina.css'));
  }
  const shared = await read('shared/wizard-controls.css');
  assert.match(shared, /122 \* var\(--wizard-u\)/);
  assert.match(shared, /\.spelling-limit-mode,\.flag-language-options/);
  assert.match(shared, /background:var\(--wizard-jelly-fill\)!important/);
  assert.doesNotMatch(shared, /color:[^;}]+!important/);
  const flags = await read('flagi/setup-retina.css');
  assert.match(flags, /--jelly-active-ink:#fff/);
  assert.match(flags, /--flag-segment-height:calc\(54 \* var\(--wizard-u\)\)/);
});

test('language is an icon-free keyboard-accessible Jelly toggle in the first section', async () => {
  const language = await read('flagi/language-toggle.mjs');
  assert.match(language, /querySelector\('\.flag-v2-game'\)/);
  assert.match(language, /createJellyV4/);
  assert.match(language, /languageJelly\.setupDrag/);
  assert.match(language, /role="radiogroup" aria-label="Język nazw krajów"/);
  assert.match(language, /type="radio" name="flagLanguage" value="pl"/);
  assert.match(language, /type="radio" name="flagLanguage" value="en"/);
  assert.doesNotMatch(language, /<img/);
  assert.match(language, /event\.target\?\.name === 'flagLanguage'/);
  assert.ok(language.indexOf("if (event.target.matches?.('input[name=\"flagLanguage\"]')) return;") < language.indexOf('event.preventDefault()'));
  assert.match(language, /localStorage\.setItem\(STORAGE_KEY, language\)/);
  assert.match(await read('flagi/adaptive-difficulty.mjs'), /Co ćwiczymy\?/);
});
