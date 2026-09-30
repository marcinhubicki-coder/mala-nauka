import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Session, validateWords } from '../game.mjs';
import { validLearning } from '../spelling/learning.mjs';
import { exampleResult } from '../ortografia/result-example.mjs';

const words = (await Promise.all(Array.from({length: 8}, (_, index) =>
  readFile(new URL('../data/words-0' + (index + 1) + '.json', import.meta.url), 'utf8').then(JSON.parse)))).flat();

test('existing words remain valid and the five examples cover every learning category', () => {
  assert.equal(validateWords(words), words);
  const examples = words.filter(word => word.learning);
  assert.equal(examples.length, 5);
  assert.deepEqual(new Set(examples.map(word => word.learning.type)), new Set(['memory', 'exchange', 'exception', 'pattern']));
  assert.equal(validateWords(words.map(({learning, ...word}) => word)).length, words.length);
  assert.equal(validLearning({...examples[0].learning, type: 'unknown'}), false);
  assert.equal(validLearning({...examples[0].learning, examples: [null]}), false);
  assert.equal(validLearning({...examples[0].learning, sources: [{label: 'Bad', url: 'javascript:alert(1)'}]}), false);
});

test('a real session keeps an independent rule snapshot for both correct and wrong attempts', () => {
  const word = structuredClone(words.find(word => word.word === 'marzenie'));
  const session = new Session([{...word, kind: 'spelling'}], 180, () => 0);
  session.answer(word.answer);
  assert.equal(session.attempts[0].correct, true);
  assert.deepEqual(session.attempts[0].learning, word.learning);
  session.current.learning.relatedWords.push('zmieniony przykład');
  assert.ok(!session.attempts[0].learning.relatedWords.includes('zmieniony przykład'));
  session.skipFeedback();
  session.answer(session.current.options.find(option => option !== session.current.answer));
  assert.equal(session.attempts[1].correct, false);
  assert.equal(session.attempts[1].learning.type, 'memory');
});

test('preview counts come from attempts and use actual word records', () => {
  const sample = exampleResult(words);
  assert.equal(sample.correct, 2);
  assert.equal(sample.wrong, 5);
  assert.equal(sample.attempts[0].word, 'marzenie');
  assert.equal(sample.attempts[0].learning.forms.includes('marząc'), true);
  assert.equal(exampleResult(words, 'correct').correct, 7);
  assert.equal(exampleResult(words, 'review').wrong, 14);
  assert.equal(exampleResult(words, 'empty').attempts.length, 0);
  assert.equal(exampleResult(words, 'dyktando').dyktando, true);
});
