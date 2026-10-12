import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { validateWords } from '../game.mjs';
import { sceneFor } from '../spelling/scenes.mjs';
import {configureAssets,playableWords} from '../shared/asset-loader.mjs';

test('every offline precache request resolves to an existing file or entry directory', async () => {
  const sw = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
  const core = JSON.parse(sw.match(/const CORE=(\[[\s\S]*?\]);/)[1]);
  const assets=JSON.parse(sw.match(/const ASSETS=(\[[\s\S]*?\]);/)[1]);
  const deployment=JSON.parse(await readFile(new URL('../dist/design-system/deployment.json',import.meta.url),'utf8'));
  const catalog=JSON.parse(await readFile(new URL('../dist/design-system/assets.json',import.meta.url),'utf8'));
  const remotePaths=new Set([...catalog.assets.map(row=>row.path),'design-system/rules.json','design-system/config.json','design-system/assets.json',...Array.from({length:8},(_,i)=>`data/words-0${i+1}.json`)]);
  if(deployment.consumer)assert.match(deployment.contentSource,/^https:\/\/raw\.githubusercontent\.com\/marcinhubicki-coder\/mala-nauka\/[0-9a-f]{40}\/$/);
  assert.ok(core.length+assets.length > 650);
  for (const request of [...core,...assets]) {
    if(/^https?:/.test(request)){
      assert.ok(deployment.consumer,'Remote precache only belongs to a consumer build');
      assert.ok(request.startsWith(deployment.contentSource),'Remote precache must use the pinned content source');
      assert.ok(remotePaths.has(request.slice(deployment.contentSource.length)),'Remote precache must exist in the pinned asset/word catalog');
      continue;
    }
    await access(new URL('../dist/' + request.replace(/^\//,'').split('?')[0], import.meta.url));
  }
  assert.ok(core.includes('/shared/design-runtime.mjs'));
  assert.ok(core.includes('/design-system/config.json'));
  assert.ok(core.some(request => request.includes('result-motion.mjs')));
});

test('all words retain learning data while only illustrated words enter the game', async () => {
  const parts = await Promise.all(Array.from({ length: 8 }, (_, i) => readFile(new URL(`../data/words-0${i + 1}.json`, import.meta.url), 'utf8').then(JSON.parse)));
  const words = validateWords(parts.flat());
  const assets=JSON.parse(await readFile(new URL('../design-system/assets.json',import.meta.url),'utf8'));configureAssets(assets);
  assert.equal(words.length, new Set(words.map(row=>row.word)).size);
  for(const word of words)assert.ok(word.learning,word.word);
  const ready=playableWords(words);assert.equal(ready.length,Object.keys(assets.words).length);
  for (const word of ready) {
    const scene = sceneFor(word.masked, word.word);
    assert.ok(scene, word.word);
    await access(new URL('../'+(scene.asset.startsWith('assets/')?scene.asset:'assets/scenes/'+scene.asset), import.meta.url));
  }
});
