import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { validateWords } from '../game.mjs';
import { sceneFor } from '../spelling/scenes.mjs';

test('every offline precache request resolves to an existing file or entry directory', async () => {
  const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const core = JSON.parse(sw.match(/const CORE=(\[[\s\S]*?\]);/)[1]);
  assert.ok(core.length > 650);
  for (const request of core) {
    await access(new URL('../' + request.slice(2).split('?')[0], import.meta.url));
  }
  assert.ok(core.some(request => request.includes('wizard-retina.css?v=7-settings-meadow')));
  assert.ok(core.some(request => request.includes('result-motion.mjs?v=8-staggered-finish')));
});

test('all 455 spelling words have learning data and an available illustration', async () => {
  const parts = await Promise.all(Array.from({ length: 8 }, (_, i) => readFile(new URL(`../data/words-0${i + 1}.json`, import.meta.url), 'utf8').then(JSON.parse)));
  const words = validateWords(parts.flat());
  assert.equal(words.length, 455);
  for (const word of words) {
    assert.ok(word.learning, word.word);
    const scene = sceneFor(word.masked, word.word);
    assert.ok(scene, word.word);
    await access(new URL('../assets/scenes/' + scene.asset, import.meta.url));
  }
});
