import { Session } from '../game.mjs';

const CLOCK_SOURCE = () => ({ options: ['_'], answer: '_', exposureMs: 0 });
const labels = { add: 'Dodawanie', subtract: 'Odejmowanie', multiply: 'Mnożenie', divide: 'Dzielenie' };

let clock = null;
let currentMode = 'multiply';
let currentDuration = 180;
let correct = 0;
let wrong = 0;
let cancelled = false;

function formatRemaining(milliseconds) {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function syncTimerSnapshot() {
  if (!clock) {
    window.__mathTimerSnapshot = { active: false, text: '', percent: 0, paused: false };
    return window.__mathTimerSnapshot;
  }

  const paused = clock.state === 'paused';
  const percent = Math.max(0, Math.min(100, clock.remaining / (clock.duration * 1000) * 100));
  window.__mathTimerSnapshot = {
    active: true,
    paused,
    remaining: clock.remaining,
    duration: clock.duration,
    percent,
    text: `${paused ? 'Ⅱ ' : ''}${formatRemaining(clock.remaining)}`,
  };
  return window.__mathTimerSnapshot;
}

window.__mathTimerSnapshot = { active: false, text: '', percent: 0, paused: false };
window.__getMathTimerSnapshot = () => ({ ...window.__mathTimerSnapshot });

function startClock(mode, duration) {
  currentMode = mode;
  currentDuration = duration;
  clock = new Session(CLOCK_SOURCE, duration);
  correct = 0;
  wrong = 0;
  cancelled = false;
  syncTimerSnapshot();
}

function ensureTimerUi() {
  const quiz = document.querySelector('[data-math-quiz]');
  if (!quiz || !clock) return;
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  const snapshot = syncTimerSnapshot();
  topbar.classList.add('math-timed');
  const slot = topbar.lastElementChild;
  if (slot && !slot.querySelector('.math-round-time')) {
    slot.innerHTML = `<div class="math-round-time ${snapshot.paused ? 'is-paused' : ''}" aria-label="Pozostały czas rundy"><span>${snapshot.text}</span></div>`;
  }
  if (!document.querySelector('.math-round-progress')) {
    const progress = document.createElement('div');
    progress.className = 'math-round-progress';
    progress.innerHTML = `<span style="width:${snapshot.percent}%"></span>`;
    topbar.insertAdjacentElement('afterend', progress);
  }
}

function updateTimerUi() {
  if (!clock) return;
  const snapshot = syncTimerSnapshot();
  const time = document.querySelector('.math-round-time');
  const text = time?.querySelector('span');
  const bar = document.querySelector('.math-round-progress > span');
  if (text && text.textContent !== snapshot.text) text.textContent = snapshot.text;
  time?.classList.toggle('is-paused', snapshot.paused);
  if (bar) bar.style.width = `${snapshot.percent}%`;
}

function accuracy() {
  return correct + wrong ? Math.round(correct * 100 / (correct + wrong)) : 0;
}

function endRound() {
  if (!clock || cancelled || document.querySelector('.math-result-screen')) return;
  if (document.querySelector('.feedback.good') || document.querySelector('.correct-transition-out')) return;

  clock.end();
  syncTimerSnapshot();
  const app = document.querySelector('#app');
  if (!app) return;
  const total = correct + wrong;
  app.innerHTML = `
    <section class="math-result-screen" aria-label="Podsumowanie rundy">
      <div class="math-result-star" aria-hidden="true">✦</div>
      <p class="math-result-eyebrow">Przygoda ukończona</p>
      <h1>Dobra robota!</h1>
      <p class="math-result-subtitle">Mały trening, kolejny krok do przodu.</p>
      <div class="math-result-badge">${labels[currentMode]} · ${currentDuration / 60} min</div>

      <div class="math-result-stats">
        <div class="math-result-stat"><strong>${correct}</strong><span>Poprawne</span></div>
        <div class="math-result-stat"><strong>${wrong}</strong><span>Do powtórki</span></div>
        <div class="math-result-stat"><strong>${total}</strong><span>Razem</span></div>
      </div>

      <p class="math-result-accuracy"><strong>${accuracy()}%</strong> poprawnych odpowiedzi</p>

      <div class="math-result-actions">
        <button type="button" class="math-result-again" data-math-result-again>Jeszcze jedna runda →</button>
        <button type="button" class="math-result-back" data-math-result-back>Wybierz inne działanie</button>
      </div>
    </section>
  `;
  clock = null;
  syncTimerSnapshot();
}

window.addEventListener('math-round-start', event => {
  startClock(event.detail?.mode || 'multiply', Number(event.detail?.duration) || 180);
});

window.addEventListener('math-round-cancel', () => {
  cancelled = true;
  clock = null;
  syncTimerSnapshot();
});

document.addEventListener('click', event => {
  const answer = event.target.closest?.('[data-answer]');
  if (answer && clock && clock.state !== 'ended') {
    const quiz = answer.closest('[data-math-quiz]');
    const expected = Number(quiz?.dataset.correctAnswer);
    const chosen = Number(answer.dataset.answer);
    if (Number.isFinite(expected) && Number.isFinite(chosen)) {
      if (chosen === expected) correct += 1;
      else wrong += 1;
    }
    return;
  }

  if (event.target.closest?.('[data-math-result-again]')) {
    window.dispatchEvent(new CustomEvent('math-restart', { detail: { mode: currentMode, duration: currentDuration } }));
    return;
  }

  if (event.target.closest?.('[data-math-result-back]')) {
    window.dispatchEvent(new CustomEvent('math-back-to-setup'));
  }
}, true);

document.addEventListener('visibilitychange', () => {
  if (!clock) return;
  if (document.hidden && clock.state !== 'paused' && clock.state !== 'ended') clock.pause();
  if (!document.hidden && clock.state === 'paused' && !document.querySelector('.quiz-stage.has-explainer')) clock.resume();
  syncTimerSnapshot();
});

setInterval(() => {
  if (!clock) return;
  const quiz = document.querySelector('[data-math-quiz]');
  if (!quiz) return;

  ensureTimerUi();
  const hasExplainer = Boolean(document.querySelector('.quiz-stage.has-explainer'));
  const shouldPause = hasExplainer || document.hidden;

  if (shouldPause && clock.state !== 'paused' && clock.state !== 'ended') clock.pause();
  if (!shouldPause && clock.state === 'paused') clock.resume();

  clock.tick();
  updateTimerUi();
  if (clock.state === 'ended' || clock.remaining <= 0) endRound();
}, 50);
