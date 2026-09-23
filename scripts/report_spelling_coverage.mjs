// Run before choosing the next illustration batch. Reads the actual game registry.
// node scripts/report_spelling_coverage.mjs          -> current JSON report
// node scripts/report_spelling_coverage.mjs --check  -> verify committed report
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { sceneFor } from '../spelling/scenes.mjs';
import { validateWords } from '../game.mjs';

const root = new URL('../', import.meta.url);
const words = validateWords(Array.from({ length: 8 }, (_, i) =>
  JSON.parse(readFileSync(new URL(`data/words-0${i + 1}.json`, root), 'utf8'))).flat());
const assets = new Set();
const missing = [];
for (const word of words) {
  const scene = sceneFor(word.masked, word.word);
  if (scene?.asset) {
    assert.ok(existsSync(new URL(`assets/scenes/${scene.asset}`, root)), `Missing file: ${scene.asset}`);
    assets.add(scene.asset);
  } else {
    missing.push({ word: word.word, masked: word.masked, category: word.category, difficulty: word.difficulty });
  }
}
const report = {
  source: 'data/words-*.json + spelling/scenes.mjs (actual runtime mappings)',
  totalWords: words.length, assignedWords: words.length - missing.length,
  uniqueImages: assets.size, missingWords: missing.length,
  missingByCategory: Object.fromEntries([...new Set(words.map(w => w.category))]
    .map(category => [category, missing.filter(w => w.category === category).length])),
  missing,
};
if (process.argv.includes('--check')) {
  assert.deepEqual(JSON.parse(readFileSync(new URL('ortografia/missing-scenes.json', root), 'utf8')), report,
    'Coverage report is stale; regenerate before selecting another image batch.');
  console.log(`OK: ${report.assignedWords}/${report.totalWords} assigned; ${report.missingWords} missing.`);
} else {
  console.log(JSON.stringify(report, null, 2));
}
