const app = document.querySelector('#app');

const DURATIONS = [60, 120, 180, 300];
const TABLE_SIZE = 10;
const ANSWER_COUNT = 6;
const DEMO_DURATION = 2200;
const DURATION_KEY = 'malaNauka.math.duration';
const MODE_KEY = 'malaNauka.math.mode';

const categoryItems = [
  { key: 'add', symbol: '+', label: 'Dodawanie' },
  { key: 'subtract', symbol: '−', label: 'Odejmowanie' },
  { key: 'multiply', symbol: '×', label: 'Mnożenie' },
  { key: 'divide', symbol: '÷', label: 'Dzielenie' },
];

const labels = {
  add: 'Dodawanie',
  subtract: 'Odejmowanie',
  multiply: 'Tabliczka mnożenia',
  divide: 'Dzielenie',
};

const state = {
  screen: 'categories',
  selectedMode: readMode(),
  duration: readDuration(),
  question: null,
  locked: false,
  wrongAnswers: new Set(),
  hadMistake: false,
  lastWrongAnswer: null,
};

function readDuration() {
  try {
    const value = Number(localStorage.getItem(DURATION_KEY));
    if (DURATIONS.includes(value)) return value;
  } catch {}
  return 180;
}

function readMode() {
  try {
    const value = localStorage.getItem(MODE_KEY);
    if (categoryItems.some(item => item.key === value)) return value;
  } catch {}
  return 'multiply';
}

function saveSetup() {
  try {
    localStorage.setItem(DURATION_KEY, String(state.duration));
    localStorage.setItem(MODE_KEY, state.selectedMode);
    const configs = JSON.parse(localStorage.getItem('malaNauka.v1.configs') || '{}');
    configs.math = { ...(configs.math || {}), duration: state.duration, category: state.selectedMode };
    localStorage.setItem('malaNauka.v1.configs', JSON.stringify(configs));
  } catch {}
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeAnswers(correct, pool = [], min = 0, max = 100) {
  const values = new Set([correct]);
  const candidates = [...new Set(pool)].filter(value => Number.isInteger(value) && value >= min && value <= max && value !== correct);
  while (values.size < ANSWER_COUNT && candidates.length) {
    const index = randomInt(0, candidates.length - 1);
    values.add(candidates.splice(index, 1)[0]);
  }
  while (values.size < ANSWER_COUNT) {
    const spread = Math.max(6, Math.min(20, Math.ceil(Math.abs(correct) * .35)));
    values.add(randomInt(Math.max(min, correct - spread), Math.min(max, correct + spread)));
  }
  return [...values].sort((a, b) => a - b);
}

function makeQuestion(mode) {
  if (mode === 'add') {
    let a = randomInt(2, 60);
    let b = randomInt(2, 60);
    while (a + b > 100) b = randomInt(2, 100 - a);
    const correct = a + b;
    return {
      mode, a, b, symbol: '+', correct,
      answers: makeAnswers(correct, [correct - 10, correct + 10, correct - 5, correct + 5, correct - 2, correct + 2, correct - 1, correct + 1], 0, 100),
    };
  }

  if (mode === 'subtract') {
    const a = randomInt(12, 100);
    const b = randomInt(2, Math.max(2, a - 1));
    const correct = a - b;
    return {
      mode, a, b, symbol: '−', correct,
      answers: makeAnswers(correct, [correct - 10, correct + 10, correct - 5, correct + 5, correct - 2, correct + 2, correct - 1, correct + 1], 0, 100),
    };
  }

  if (mode === 'divide') {
    const divisor = randomInt(2, 10);
    const quotient = randomInt(2, 10);
    const dividend = divisor * quotient;
    return {
      mode, a: dividend, b: divisor, symbol: '÷', correct: quotient,
      rows: divisor, columns: quotient,
      answers: makeAnswers(quotient, [quotient - 3, quotient + 3, quotient - 2, quotient + 2, quotient - 1, quotient + 1, divisor], 1, 10),
    };
  }

  const a = randomInt(2, 10);
  const b = randomInt(2, 10);
  const correct = a * b;
  return {
    mode: 'multiply', a, b, symbol: '×', correct, rows: a, columns: b,
    answers: makeAnswers(correct, [correct - a, correct + a, correct - b, correct + b, correct - 10, correct + 10, correct - 2, correct + 2, correct - 1, correct + 1, correct - a - b, correct + a + b], 1, 100),
  };
}

function setupTopbar() {
  return `
    <header class="topbar">
      <div></div>
      <div class="brand">
        <a class="math-home-link" href="../" aria-label="Wróć do Małej Nauki">
          <img src="../assets/icon-192.png" alt="" width="24" height="24">
          <span>Mała Nauka</span>
        </a>
      </div>
      <div></div>
    </header>
  `;
}

function gameTopbar() {
  return `
    <header class="topbar">
      <button class="icon-button" id="back" type="button" aria-label="Wróć">‹</button>
      <div class="brand">${labels[state.screen] || 'Matematyka'}</div>
      <div></div>
    </header>
  `;
}

function resetAttemptState() {
  state.locked = false;
  state.wrongAnswers = new Set();
  state.hadMistake = false;
  state.lastWrongAnswer = null;
}

function renderCategories() {
  state.screen = 'categories';
  state.question = null;
  resetAttemptState();

  app.innerHTML = `
    ${setupTopbar()}
    <section class="screen math-setup-screen">
      <div class="hero">
        <p class="eyebrow">Matematyka</p>
        <h1>Co dziś ćwiczymy?</h1>
      </div>

      <section class="math-duration-setup" aria-label="Czas rozgrywki">
        <div class="math-duration-heading">Czas rozgrywki</div>
        <div class="math-duration-choices" role="group" aria-label="Wybierz czas rundy">
          ${DURATIONS.map(duration => `
            <button type="button" class="math-duration-choice ${duration === state.duration ? 'is-selected' : ''}" data-duration="${duration}">
              ${duration / 60} min
            </button>
          `).join('')}
        </div>
      </section>

      <div class="category-grid" aria-label="Kategorie matematyki">
        ${categoryItems.map(item => `
          <button class="category-card ${state.selectedMode === item.key ? 'active is-selected-mode' : ''}" type="button" data-category="${item.key}">
            <span class="category-symbol" aria-hidden="true">${item.symbol}</span>
            <span class="category-name">${item.label}</span>
          </button>
        `).join('')}
      </div>

      <div class="math-start-panel">
        <button type="button" class="math-start-button" data-start>
          Rozpocznij <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  `;

  app.querySelectorAll('[data-duration]').forEach(button => {
    button.addEventListener('click', () => {
      state.duration = Number(button.dataset.duration);
      saveSetup();
      renderCategories();
    });
  });

  app.querySelectorAll('[data-category]').forEach(button => {
    button.addEventListener('click', () => {
      state.selectedMode = button.dataset.category;
      saveSetup();
      app.querySelectorAll('[data-category]').forEach(card => card.classList.toggle('active', card === button));
      app.querySelectorAll('[data-category]').forEach(card => card.classList.toggle('is-selected-mode', card === button));
    });
  });

  app.querySelector('[data-start]')?.addEventListener('click', startSelectedGame);
}

function startSelectedGame() {
  saveSetup();
  state.screen = state.selectedMode;
  resetAttemptState();
  state.question = makeQuestion(state.screen);
  window.dispatchEvent(new CustomEvent('math-round-start', { detail: { mode: state.screen, duration: state.duration } }));
  renderGame();
}

function nextQuestion() {
  if (state.screen === 'categories') return;
  state.question = makeQuestion(state.screen);
  resetAttemptState();
  renderGame();
}

function answerGrid(q) {
  return `
    <div class="answer-grid" aria-label="Wybierz wynik. Odpowiedzi są ułożone rosnąco.">
      ${q.answers.map(answer => {
        const classes = ['answer'];
        if (state.locked && answer === q.correct) classes.push('correct');
        if (state.wrongAnswers.has(answer)) classes.push('wrong');
        return `
          <button class="${classes.join(' ')}" type="button" data-answer="${answer}" ${state.locked ? 'disabled' : ''}>
            ${answer}
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function equationMarkup(q, animate = false) {
  const spoken = q.mode === 'add' ? 'plus' : q.mode === 'subtract' ? 'minus' : q.mode === 'divide' ? 'podzielić przez' : 'razy';
  return `
    <p class="equation ${animate ? 'equation-build' : ''}" aria-label="${q.a} ${spoken} ${q.b}">
      <span class="equation-number equation-left">${q.a}</span>
      <span class="equation-sign" aria-hidden="true">${q.symbol}</span>
      <span class="equation-number equation-right">${q.b}</span>
    </p>
  `;
}

function wrongNotice() {
  return `<p class="wrong-answer-note" role="status" aria-live="polite">Wynik tego działania to nie <strong>${state.lastWrongAnswer}</strong>.</p>`;
}

function explainerActions() {
  return `
    <div class="explainer-actions-panel" data-explainer-actions>
      <button class="explainer-action retry-action" type="button" data-retry><span aria-hidden="true">↺</span> Spróbuj ponownie</button>
      <button class="explainer-action next-action" type="button" data-next-question>Dalej <span aria-hidden="true">→</span></button>
    </div>
  `;
}

function hasVisualExplainer() {
  return ['multiply', 'divide'].includes(state.screen) && state.hadMistake;
}

function renderGame({ feedback = '', feedbackType = '' } = {}) {
  const q = state.question;
  if (!q) return;
  const showExplainer = hasVisualExplainer();
  const animateEquation = !showExplainer && feedbackType !== 'good';

  app.innerHTML = `
    ${gameTopbar()}
    <section class="screen quiz-screen" data-math-quiz data-operation="${q.mode}" data-correct-answer="${q.correct}">
      <div class="quiz-stage ${showExplainer ? 'has-explainer' : ''}" data-operation="${q.mode}" data-correct-answer="${q.correct}">
        <div class="question-block">
          <p class="question-label">Ile to jest?</p>
          ${equationMarkup(q, animateEquation)}
          ${showExplainer ? wrongNotice() : ''}
        </div>

        ${showExplainer ? `
          <div class="explainer-reveal" data-explainer-reveal>
            <div class="explainer-reveal-inner">${gridExplainer(q)}</div>
          </div>
          ${explainerActions()}
        ` : `
          ${answerGrid(q)}
          <p class="feedback ${feedbackType}" role="status">${feedback}</p>
        `}
      </div>
    </section>
  `;

  app.querySelector('#back')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('math-round-cancel'));
    renderCategories();
  });

  app.querySelectorAll('[data-answer]').forEach(button => {
    button.addEventListener('click', () => chooseAnswer(Number(button.dataset.answer)));
  });
  app.querySelector('[data-retry]')?.addEventListener('click', retryQuestion);
  app.querySelector('[data-next-question]')?.addEventListener('click', nextQuestion);

  const explainerController = showExplainer ? bindExplainerInteractions(q.rows, q.columns) : null;
  if (showExplainer) {
    const reveal = app.querySelector('[data-explainer-reveal]');
    const actions = app.querySelector('[data-explainer-actions]');
    window.setTimeout(() => {
      if (!state.hadMistake || state.question !== q) return;
      reveal?.classList.add('is-open');
      window.setTimeout(() => {
        if (!state.hadMistake || state.question !== q) return;
        explainerController?.startDemo();
      }, 520);
      window.setTimeout(() => actions?.classList.add('is-visible'), 320);
    }, 520);
  }
}

function chooseAnswer(answer) {
  if (state.locked) return;
  const q = state.question;
  if (!q) return;

  if (answer === q.correct) {
    state.locked = true;
    renderGame({ feedback: 'Dobrze!', feedbackType: 'good' });
    window.setTimeout(() => {
      if (state.screen !== 'categories' && state.question === q) nextQuestion();
    }, 720);
    return;
  }

  state.wrongAnswers.add(answer);
  state.lastWrongAnswer = answer;

  if (['multiply', 'divide'].includes(state.screen)) {
    state.hadMistake = true;
    renderGame();
  } else {
    renderGame({ feedback: 'Spróbuj jeszcze raz.', feedbackType: 'bad' });
  }
}

function retryQuestion() {
  resetAttemptState();
  renderGame();
}

function gridExplainer(q) {
  const rows = q.rows;
  const columns = q.columns;
  const isDivision = q.mode === 'divide';
  const cells = [];

  for (let row = 1; row <= TABLE_SIZE; row += 1) {
    for (let col = 1; col <= TABLE_SIZE; col += 1) {
      const inProblem = row <= rows && col <= columns;
      const count = inProblem ? ((row - 1) * columns) + col : '';
      const separator = isDivision && inProblem && row < rows ? 'division-row-separator' : '';
      cells.push(`
        <span class="array-cell ${inProblem ? 'in-problem' : 'outside-problem'} ${separator}" data-row="${row}" data-col="${col}" data-count="${count}" aria-hidden="true">
          ${inProblem ? `<span class="cell-number">${count}</span>` : ''}
        </span>
      `);
    }
  }

  const columnLabels = Array.from({ length: TABLE_SIZE }, (_, index) => {
    const col = index + 1;
    return `<span class="axis-label col-label ${col <= columns ? 'in-problem-axis' : ''}" data-col-label="${col}">${col}</span>`;
  }).join('');

  const rowLabels = Array.from({ length: TABLE_SIZE }, (_, index) => {
    const row = index + 1;
    return `<span class="axis-label row-label ${row <= rows ? 'in-problem-axis' : ''}" data-row-label="${row}">${row}</span>`;
  }).join('');

  const expressions = Array.from({ length: TABLE_SIZE }, (_, index) => {
    const step = index + 1;
    if (step > rows) return '<span class="row-expression-spacer" aria-hidden="true"></span>';
    const total = step * columns;
    const previous = (step - 1) * columns;
    const expression = step === 1 ? `${columns}` : `${previous} + ${columns} = ${total}`;
    return `<button class="row-expression" type="button" data-explain-step="${step}" aria-pressed="false" aria-label="Pokaż ${total} pól: ${expression}">${expression}</button>`;
  }).join('');

  const title = isDivision ? `${q.a} podzielone na ${q.b} części` : `${rows} rzędów po ${columns}`;
  const caption = isDivision
    ? `Każdy z ${q.b} rzędów ma po ${q.correct} pól. Dotknij wyniku po prawej, żeby zobaczyć kolejne równe części.`
    : 'Dotknij wyniku po prawej, żeby policzyć podświetlone pola.';

  return `
    <section class="explainer" aria-label="${isDivision ? 'Wyjaśnienie dzielenia' : 'Wyjaśnienie mnożenia'}">
      <div class="explainer-copy"><span class="explainer-title">${title}</span></div>
      <div class="explain-grid">
        <div class="column-labels" aria-label="Numery kolumn">${columnLabels}</div>
        <div class="row-labels" aria-label="Numery rzędów">${rowLabels}</div>
        <div class="array" aria-hidden="true">
          ${cells.join('')}
          <span class="demo-finger" data-demo-finger aria-hidden="true">
            <svg viewBox="0 0 46 46" focusable="false" aria-hidden="true">
              <g class="pointer-rays" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M8 8 4.5 4.5"/><path d="M15 5V1.5"/><path d="M5 15H1.5"/></g>
              <path class="pointer-shape" d="M9.5 8.5 37 23.2c2.1 1.1 1.8 4.2-.4 4.9l-10.1 3.2-4 9.7c-.9 2.2-4 2.2-4.9.1L6.1 12.2c-.9-2.4 1.1-5 3.4-3.7Z"/>
            </svg>
          </span>
        </div>
        <div class="row-expressions" aria-label="Kolejne dodawanie">${expressions}</div>
      </div>
      <p class="grid-caption">${caption}</p>
    </section>
  `;
}

function bindExplainerInteractions(rows, columns) {
  const buttons = [...app.querySelectorAll('[data-explain-step]')];
  const array = app.querySelector('.array');
  const finger = app.querySelector('[data-demo-finger]');
  if (!buttons.length || !array) return null;

  let selectedStep = 0;
  let manualEnabled = false;
  let demoRunning = false;
  let demoAnimation = null;
  const demoTimers = [];

  const setButtonsEnabled = enabled => {
    buttons.forEach(button => {
      button.disabled = !enabled;
      button.classList.toggle('demo-locked', !enabled);
    });
  };

  const updateLabels = count => {
    const currentRow = count > 0 ? Math.ceil(count / columns) : 0;
    const currentColumn = count > 0 ? ((count - 1) % columns) + 1 : 0;
    app.querySelectorAll('[data-row-label]').forEach(label => {
      const row = Number(label.dataset.rowLabel);
      label.classList.toggle('is-active', count > 0 && row <= currentRow && row <= rows);
    });
    app.querySelectorAll('[data-col-label]').forEach(label => {
      const col = Number(label.dataset.colLabel);
      const activeThrough = currentRow > 1 ? columns : currentColumn;
      label.classList.toggle('is-active', count > 0 && col <= activeThrough && col <= columns);
    });
  };

  const paintCount = count => {
    app.querySelectorAll('.array-cell[data-count]').forEach(cell => {
      const cellCount = Number(cell.dataset.count);
      const counted = cellCount > 0 && cellCount <= count;
      cell.classList.toggle('is-active', counted);
      cell.classList.toggle('show-number', counted);
    });
    updateLabels(count);
    const completedStep = count > 0 ? Math.floor(count / columns) : 0;
    buttons.forEach(button => {
      const step = Number(button.dataset.explainStep);
      button.classList.toggle('is-active', count > 0 && count % columns === 0 && step === completedStep);
      button.setAttribute('aria-pressed', 'false');
    });
  };

  const paintStep = step => {
    const count = step > 0 ? Math.min(step, rows) * columns : 0;
    paintCount(count);
    buttons.forEach(button => {
      const buttonStep = Number(button.dataset.explainStep);
      button.classList.toggle('is-active', buttonStep === step);
      button.setAttribute('aria-pressed', buttonStep === selectedStep ? 'true' : 'false');
    });
  };

  const cellPoint = count => {
    const cell = array.querySelector(`.array-cell[data-count="${count}"]`);
    return cell ? { x: cell.offsetLeft + cell.offsetWidth / 2, y: cell.offsetTop + cell.offsetHeight / 2 } : null;
  };

  const schedule = (callback, delay) => {
    const timer = window.setTimeout(() => {
      if (!array.isConnected || !state.hadMistake) return;
      callback();
    }, delay);
    demoTimers.push(timer);
  };

  const finishDemo = () => {
    demoRunning = false;
    selectedStep = rows;
    paintStep(rows);
    manualEnabled = true;
    setButtonsEnabled(true);
    finger?.classList.remove('is-clicking');
  };

  const startDemo = () => {
    if (demoRunning || manualEnabled || !array.isConnected) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      selectedStep = rows;
      paintStep(rows);
      manualEnabled = true;
      setButtonsEnabled(true);
      return;
    }

    const total = rows * columns;
    const first = cellPoint(1);
    const firstRowEnd = cellPoint(columns);
    const final = cellPoint(total);
    if (!first || !firstRowEnd || !final || !finger) return;

    demoRunning = true;
    setButtonsEnabled(false);
    paintCount(0);
    const transformAt = (point, scale = 1) => `translate(${point.x - 8}px, ${point.y + 7}px) scale(${scale})`;
    finger.classList.add('is-visible', 'is-clicking');
    paintCount(1);

    demoAnimation?.cancel();
    demoAnimation = finger.animate([
      { offset: 0, opacity: 0, transform: transformAt(first, .72) },
      { offset: .055, opacity: 1, transform: transformAt(first, 1.08) },
      { offset: .12, opacity: 1, transform: transformAt(first, .96) },
      { offset: .43, opacity: 1, transform: transformAt(firstRowEnd, 1) },
      { offset: .88, opacity: 1, transform: transformAt(final, 1) },
      { offset: 1, opacity: 0, transform: transformAt(final, .88) },
    ], { duration: DEMO_DURATION, easing: 'cubic-bezier(.45, 0, .18, 1)', fill: 'forwards' });

    schedule(() => finger.classList.remove('is-clicking'), 250);
    if (columns > 1) {
      for (let col = 2; col <= columns; col += 1) {
        const ratio = (col - 1) / (columns - 1);
        schedule(() => paintCount(col), 250 + ratio * 690);
      }
    }
    if (rows > 1) {
      for (let row = 2; row <= rows; row += 1) {
        const ratio = (row - 1) / (rows - 1);
        schedule(() => paintCount(row * columns), 940 + ratio * 990);
      }
    }
    schedule(finishDemo, DEMO_DURATION);
  };

  const restoreSelected = () => { if (manualEnabled) paintStep(selectedStep); };
  buttons.forEach(button => {
    const step = Number(button.dataset.explainStep);
    button.addEventListener('pointerenter', () => { if (manualEnabled) paintStep(step); });
    button.addEventListener('pointerleave', restoreSelected);
    button.addEventListener('focus', () => { if (manualEnabled) paintStep(step); });
    button.addEventListener('blur', restoreSelected);
    button.addEventListener('click', () => {
      if (!manualEnabled) return;
      selectedStep = selectedStep === step ? 0 : step;
      paintStep(selectedStep);
    });
  });

  setButtonsEnabled(false);
  paintStep(0);
  return { startDemo };
}

window.addEventListener('math-restart', event => {
  const mode = event.detail?.mode;
  const duration = Number(event.detail?.duration);
  if (categoryItems.some(item => item.key === mode)) state.selectedMode = mode;
  if (DURATIONS.includes(duration)) state.duration = duration;
  startSelectedGame();
});

window.addEventListener('math-back-to-setup', renderCategories);

renderCategories();
