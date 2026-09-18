import numbers from './english/numbers.mjs';
import colors from './english/colors.mjs';
import family from './english/family.mjs';
import people from './english/people.mjs';
import body from './english/body.mjs';
import home from './english/home.mjs';
import objects from './english/objects.mjs';
import school from './english/school.mjs';
import food from './english/food.mjs';
import animals from './english/animals.mjs';
import nature from './english/nature.mjs';
import places from './english/places.mjs';
import transport from './english/transport.mjs';
import clothes from './english/clothes.mjs';
import jobs from './english/jobs.mjs';
import verbs from './english/verbs.mjs';
import adjectives from './english/adjectives.mjs';
import time from './english/time.mjs';

// The vocabulary is split by category so future edits stay simple.
// Every catalog row uses exactly this format:
// english word|Polish meaning|category|difficulty 1-3|wrong 1;wrong 2;wrong 3
const catalogs = [
  numbers, colors, family, people, body, home, objects, school, food,
  animals, nature, places, transport, clothes, jobs, verbs, adjectives, time,
];

const lines = catalogs
  .flatMap(catalog => catalog.trim().split('\n'))
  .map(line => line.trim())
  .filter(Boolean);

export const ENGLISH = lines.map((line, index) => {
  const [word, meaning, category, difficultyRaw, mistakesRaw] = line.split('|');
  const difficulty = Number(difficultyRaw);
  const mistakes = String(mistakesRaw || '')
    .split(';')
    .map(value => value.trim())
    .filter(Boolean);

  if (!word || !meaning || !category || ![1, 2, 3].includes(difficulty) || mistakes.length !== 3) {
    throw new Error(`Invalid English vocabulary row ${index + 1}: ${line}`);
  }

  return { word, meaning, category, difficulty, mistakes };
});

const uniqueWords = new Set(ENGLISH.map(entry => entry.word));
if (ENGLISH.length !== 500 || uniqueWords.size !== ENGLISH.length) {
  throw new Error(`English vocabulary catalog must contain 500 unique words; got ${ENGLISH.length}/${uniqueWords.size}.`);
}
