import { DURATIONS, Session } from '../game.mjs';

const STORAGE_KEY = 'malaNauka.math.duration';
const SHARED_CONFIG_KEY = 'malaNauka.v1.configs';
const CLOCK_SOURCE = () => ({ options: ['_'], answer: '_', exposureMs: 0 });

let selectedDuration = readDuration();
let clock = null;
let correct = 0;
let wrong = 0;
let wasExplainer = false;
let wasHidden = false;

function readDuration() {
  try {
    const direct = Number(localStorage.getItem(STORAGE_KEY));
    if (DURATIONS.includes(direct)) return direct;
    const configs = JSON.parse(localStorage.getItem(SHARED_CONFIG_KEY) || '{}');
    const shared = Number(configs?.math?.duration);
    if (DURATIONS.includes(shared)) return shared;
  } catch {}
  return 180;
}

function saveDuration(duration) {
  if (!DURATIONS.includes(duration)) return;
  selectedDuration = duration;
  try {
    localStorage.setItem(STORAGE_KEY, String(duration));
    const configs = JSON.parse(localStorage.getItem(SHARED_CONFIG_KEY) || '{}');
    configs.math = { ...(configs.math || {}), duration };
    localStorage.setItem(SHARED_CONFIG_KEY, JSON.stringify(configs));
  } catch {}
}

const minutes = seconds => `${seconds / 60} min`;
function formatRemaining(milliseconds) {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function decorateSetup() {
  const grid = document.querySelector('.category-grid');
  if (!grid || document.querySelector('.quiz-screen')) return;

  const brand = document.querySelector('.topbar .brand');
  if (brand && !brand.querySelector('.math-home-link')) {
    brand.innerHTML = `<a class="math-home-link" href="../" aria-label="Wróć do Małej Nauki"><img src="../assets/icon-192.png" alt="" width="24" height="24"><span>Mała Nauka</span></a>`;
  }
  document.querySelector('.hero > p:not(.eyebrow)')?.remove();

  const multiply = grid.querySelector('[data-category="multiply"]');
  multiply?.classList.add('is-selected-mode', 'math-mode-display-only');

  if (!document.querySelector('.math-duration-setup')) {
    const panel = document.createElement('section');
    panel.className = 'math-duration-setup';
    panel.innerHTML = `<div class="math-duration-heading">Czas rozgrywki</div><div class="math-duration-choices" role="group" aria-label="Czas rundy">${DURATIONS.map(duration => `<button type="button" class="math-duration-choice ${duration === selectedDuration ? 'is-selected' : ''}" data-math-duration="${duration}">${minutes(duration)}</button>`).join('')}</div>`;
    grid.parentElement?.insertBefore(panel, grid);
  }

  if (!document.querySelector('.math-start-panel')) {
    const panel = document.createElement('div');
    panel.className = 'math-start-panel';
    panel.innerHTML = `<button type="button" class="math-start-button" data-math-start>Rozpocznij <span aria-hidden="true">→</span></button>`;
    grid.insertAdjacentElement('afterend', panel);
  }
}

function startClock() {
  clock = new Session(CLOCK_SOURCE, selectedDuration);
  correct = 0;
  wrong = 0;
  wasExplainer = false;
  wasHidden = false;
}

function ensureTimerUi() {
  const quiz = document.querySelector('.quiz-screen');
  if (!quiz || !clock) return;
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;
  topbar.classList.add('math-timed');
  const slot = topbar.lastElementChild;
  if (slot && !slot.querySelector('.math-round-time')) slot.innerHTML = '<div class="math-round-time" aria-label="Pozostały czas rundy"><span></span></div>';
  if (!document.querySelector('.math-round-progress')) {
    const progress = document.createElement('div');
    progress.className = 'math-round-progress';
    progress.innerHTML = '<span></span>';
    topbar.insertAdjacentElement('afterend', progress);
  }
}

function updateTimerUi() {
  if (!clock) return;
  const paused = clock.state === 'paused';
  const time = document.querySelector('.math-round-time');
  const text = time?.querySelector('span');
  const bar = document.querySelector('.math-round-progress > span');
  if (text) text.textContent = `${paused ? 'Ⅱ ' : ''}${formatRemaining(clock.remaining)}`;
  time?.classList.toggle('is-paused', paused);
  if (bar) bar.style.width = `${Math.max(0, Math.min(100, clock.remaining / (clock.duration * 1000) * 100))}%`;
}

function equationResult() {
  const values = [...document.querySelectorAll('.question-block .equation-number')].map(node => Number(node.textContent));
  return values.length >= 2 && values.every(Number.isFinite) ? values[0] * values[1] : null;
}

function endRound() {
  if (!clock || document.querySelector('.math-time-over')) return;
  clock.end();
  updateTimerUi();
  const overlay = document.createElement('div');
  overlay.className = 'math-time-over';
  overlay.innerHTML = `<section class="math-time-over-card" role="dialog" aria-modal="true"><span class="math-time-over-icon" aria-hidden="true">✦</span><h2>Koniec czasu</h2><p><strong>${correct}</strong> poprawnych · <strong>${wrong}</strong> błędnych</p><div class="math-time-over-actions"><button type="button" class="math-time-again">Jeszcze raz</button><button type="button" class="math-time-back">Wróć</button></div></section>`;
  document.body.append(overlay);
}

document.addEventListener('click', event => {
  const duration = event.target.closest?.('[data-math-duration]');
  if (duration) {
    const value = Number(duration.dataset.mathDuration);
    saveDuration(value);
    document.querySelectorAll('[data-math-duration]').forEach(button => button.classList.toggle('is-selected', Number(button.dataset.mathDuration) === value));
    return;
  }

  if (event.target.closest?.('[data-math-start]')) {
    const target = document.querySelector('[data-category="multiply"]');
    if (!target) return;
    startClock();
    target.click();
    return;
  }

  const answer = event.target.closest?.('[data-answer]');
  if (answer && clock && clock.state !== 'ended') {
    const expected = equationResult();
    const chosen = Number(answer.dataset.answer);
    if (Number.isFinite(expected) && Number.isFinite(chosen)) chosen === expected ? correct++ : wrong++;
    return;
  }

  if (event.target.closest?.('.math-time-again')) {
    document.querySelector('.math-time-over')?.remove();
    startClock();
    const target = document.querySelector('[data-category="multiply"]');
    if (target) target.click(); else location.reload();
    return;
  }

  if (event.target.closest?.('.math-time-back')) location.reload();
});

setInterval(() => {
  const quiz = document.querySelector('.quiz-screen');
  if (!quiz || !clock) {
    decorateSetup();
    return;
  }

  ensureTimerUi();
  const hasExplainer = Boolean(document.querySelector('.quiz-stage.has-explainer'));
  const hidden = document.hidden;
  const shouldPause = hasExplainer || hidden;

  if (shouldPause && clock.state !== 'paused' && clock.state !== 'ended') clock.pause();
  if (!shouldPause && clock.state === 'paused') clock.resume();

  wasExplainer = hasExplainer;
  wasHidden = hidden;
  clock.tick();
  updateTimerUi();
  if (clock.state === 'ended' || clock.remaining <= 0) endRound();
}, 50);

decorateSetup();
