import { validLearning } from './spelling/learning.mjs?v=1';
import {spellingPool,wordKey,wordSlots} from './spelling/word-pools.mjs';
export const CATEGORIES = ['u/ó', 'rz/ż', 'ch/h', 'ć/ci', 'ś/si', 'ź/zi', 'ń/ni', 'dź/dzi'];
export const DURATIONS = [60, 120, 180, 300];
export const DEFAULT_SETTINGS = { duration: 180, sound: true, difficulty: true };
export const accuracy = (correct, wrong) => correct + wrong ? Math.round(100 * correct / (correct + wrong)) : 0;
export const modeName = category => category === 'all' ? 'Wszystkie słowa' : String(category).split(',').map(value=>value.replace('/', ' / ')).join(', ');
export const bestKey = (category, duration) => `${category}:${duration}`;
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function validateWords(words) {
  if (!Array.isArray(words) || words.length < 455 || new Set(words.map(w => w.word)).size !== words.length) throw Error('Niepełna baza słów.');
  for (const w of words) {
    const detected=[...new Set(wordSlots(w).map(r=>r.category))],enabled=w.practiceCategories??detected;
    if(!Array.isArray(enabled)||!enabled.length||new Set(enabled).size!==enabled.length||enabled.some(c=>!detected.includes(c))||JSON.stringify(enabled)!==JSON.stringify(detected.filter(c=>enabled.includes(c)))||!enabled.includes(w.category))throw Error('Nieprawidłowe dozwolone kategorie słowa.');
    if(w.categoryDifficulties){const keys=Object.keys(w.categoryDifficulties);if(keys.some(c=>!enabled.includes(c))||enabled.some(c=>![1,2].includes(w.categoryDifficulties[c]))||w.categoryDifficulties[w.category]!==w.difficulty)throw Error('Nieprawidłowe poziomy kategorii słowa.');}
    if (typeof w.word !== 'string' || typeof w.masked !== 'string' || w.masked.split('_').length !== 2 ||
      !CATEGORIES.includes(w.category) || !Array.isArray(w.options) || w.options.length !== 2 || new Set(w.options).size !== 2 ||
      !w.options.every(o => w.category.split('/').includes(o)) || !w.options.includes(w.answer) ||
      w.masked.replace('_', w.answer) !== w.word || ![1, 2].includes(w.difficulty) || !validLearning(w.learning)) throw Error('Nieprawidłowy rekord słowa.');
  }
  if (CATEGORIES.some(category => [1,2].some(level => !words.some(w => w.category === category && w.difficulty === level)))) throw Error('Niepełne kategorie lub pule trudności.');
  return words;
}
export function cleanSettings(value) {
  return { duration: DURATIONS.includes(value?.duration) ? value.duration : 180,
    sound: typeof value?.sound === 'boolean' ? value.sound : true,
    difficulty: typeof value?.difficulty === 'boolean' ? value.difficulty : true };
}
export function validResult(r) {
 const selected=r?.category==='all'?CATEGORIES:String(r?.category??'').split(',').filter(Boolean);
 const categoryValid=selected.length>0&&new Set(selected).size===selected.length&&selected.every(category=>CATEGORIES.includes(category));
 return r && categoryValid && DURATIONS.includes(r.duration) &&
    Number.isInteger(r.correct) && r.correct >= 0 && Number.isInteger(r.wrong) && r.wrong >= 0 &&
    typeof r.date === 'string' && Number.isFinite(Date.parse(r.date));
}

// One clock/state machine for all five modes. No timers are owned by questions.
export class Session {
  constructor(source, duration, now = () => performance.now(), random = Math.random) {
    if ((!Array.isArray(source) || !source.length) && typeof source !== 'function') throw Error('Brak zadań dla tego wyboru.');
    if (!DURATIONS.includes(duration)) throw Error('Nieprawidłowy czas gry.');
    Object.assign(this, { source, pool: Array.isArray(source) ? source : [], duration, now, random,
      remaining: duration * 1000, lastTime: now(), correct: 0, wrong: 0, question: 0,
      state: 'playing', queue: [], feedbackRemaining: 0, exposureRemaining: 0,
      questionElapsed: 0, lastResponseMs: 0, recentAnswers: [], attempts: [],
      untimed: false, questionLimit: 0, usedWords:new Set(),streak:0,bestStreak:0,
      noRepeatWords:Array.isArray(source)&&source.every(row=>row.word&&row.masked) });
    this.next();
  }
  tick() {
    if (this.presentationHeld || ['paused', 'ended', 'feedback-wrong'].includes(this.state)) return;
    const previousState = this.state;
    const time = this.now(), elapsed = Math.max(0, time - this.lastTime);
    this.lastTime = time;
    if (previousState === 'playing') this.questionElapsed += elapsed;
    if (!this.untimed && !(this.mode === 'flags' && previousState === 'feedback-correct')) {
      this.remaining = Math.max(0, this.remaining - elapsed);
      if (this.remaining === 0) { this.state = 'ended'; return; }
    }
    if (this.state === 'exposing') {
      this.exposureRemaining = Math.max(0, this.exposureRemaining - elapsed);
      if (!this.exposureRemaining) this.state = 'playing';
    } else if (this.state === 'feedback-correct') {
      this.feedbackRemaining -= elapsed;
      if (this.feedbackRemaining <= 0) this.next();
    }
  }
  next() {
    if (this.state === 'paused' || this.state === 'ended') return;
    if (this.questionLimit && this.question >= this.questionLimit) { this.poolExhausted=this.noRepeatWords&&this.usedWords.size>=new Set(this.pool.map(row=>wordKey(row.word))).size; this.current = null; this.state = 'ended'; return; }
    if (typeof this.source === 'function') {
      this.current = this.preparedQuestion || this.source(this);
      this.preparedQuestion = null;
    }
    else {
      if (!this.queue.length) {
        this.queue = shuffle(this.noRepeatWords?this.pool.filter(row=>!this.usedWords.has(wordKey(row.word))):this.pool, this.random);
        if (this.queue.length > 1 && this.queue[0] === this.current) [this.queue[0], this.queue[1]] = [this.queue[1], this.queue[0]];
      }
      if(this.noRepeatWords)this.queue=this.queue.filter(row=>!this.usedWords.has(wordKey(row.word)));
      this.current = this.queue.shift();
      if(!this.current){this.poolExhausted=true;this.state='ended';return;}
      if(this.noRepeatWords)this.usedWords.add(wordKey(this.current.word));
    }
    this.options = shuffle(this.current.options, this.random);
    this.question++;
    this.exposureRemaining = this.current.exposureMs || 0;
    this.state = this.exposureRemaining ? 'exposing' : 'playing';
    this.selected = null;
    this.hintUsed = false;
    this.questionElapsed = 0;
    this.lastTime = this.now();
  }
  answer(option) {
    if (this.presentationHeld || this.state !== 'playing') return false;
    this.tick();
    if (this.state !== 'playing' || (!['memory','reading-phrase'].includes(this.current?.kind) && !this.options.includes(option))) return false;
    this.selected = option;
    const correct = option === this.current.answer;
    this.streak=correct&&!this.hintUsed?this.streak+1:0;this.bestStreak=Math.max(this.bestStreak,this.streak);
    if(this.current.kind==='spelling')this.attempts.push({kind:'spelling',at:new Date().toISOString(),hintUsed:this.hintUsed===true,word:this.current.word,masked:this.current.masked,answer:String(this.current.answer),selected:String(option),correct,category:this.current.category,difficulty:this.current.difficulty,...(this.current.learning?{learning:JSON.parse(JSON.stringify(this.current.learning))}:{})});
    this.lastResponseMs = Math.max(0, this.questionElapsed);
    this.recentAnswers.push({
      correct,
      difficulty: Number(this.current?.difficulty) || 1,
      responseMs: this.lastResponseMs,
      question: this.question
    });
    if (this.recentAnswers.length > 12) this.recentAnswers.shift();
    this[correct ? 'correct' : 'wrong']++;
    this.state = correct ? 'feedback-correct' : 'feedback-wrong';
    const feedbackMs=Number(this.current?.feedbackMs)||Number(this.feedbackMs)||700;
    this.feedbackRemaining = correct ? (this.mode==='flags'?Math.max(4000,feedbackMs):feedbackMs) : 0;
    return true;
  }
  // Reserve exactly the question that next() will consume; do not advance
  // the round or its clock while artwork is being prepared.
  prepareNext() {
    if (this.mode !== 'flags' || !this.state.startsWith('feedback') ||
        typeof this.source !== 'function' || (this.questionLimit && this.question >= this.questionLimit)) return null;
    return this.preparedQuestion ||= this.source(this);
  }
  skipFeedback() {
    if (this.presentationHeld) return;
    if (!this.state.startsWith('feedback')) return;
    const question = this.question;
    this.tick();
    if (this.state !== 'ended' && this.question === question) this.next();
  }
  questionsRemaining() {
    if (!this.questionLimit) return null;
    const effectiveState = this.state === 'paused' ? this.resumeState : this.state;
    const currentPending = ['playing','exposing'].includes(effectiveState) ? 1 : 0;
    return Math.max(0, this.questionLimit - this.question + currentPending);
  }
  pause() {
    if (this.state === 'paused' || this.state === 'ended') return;
    this.tick();
    if (this.state === 'ended') return;
    this.resumeState = this.state;
    this.state = 'paused';
  }
  // Decorative transitions do not consume answer time.
  setPresentationHold(held) {
    this.presentationHeld = held;
    this.lastTime = this.now();
  }
  resume() {
    if (this.state !== 'paused') return;
    this.state = this.resumeState;
    this.lastTime = this.now();
  }
  end() { this.tick(); this.state = 'ended'; }
}
// Keep the original spelling API and its approved dataset validation.
export class Game extends Session {
  constructor(words, category, duration, now, random) {
    const selected=category==='all'?null:String(category).split(',');
    super(spellingPool(words,{category},random), duration, now, random);
    this.category = category;
  }
}
