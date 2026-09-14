const app = document.querySelector('#app');

const state = {
  screen: 'categories',
  question: null,
  locked: false,
  wrongAnswers: new Set(),
  hadMistake: false,
  lastWrongAnswer: null,
};

const categoryItems = [
  { key: 'add', symbol: '+', label: 'Dodawanie', enabled: false },
  { key: 'subtract', symbol: '−', label: 'Odejmowanie', enabled: false },
  { key: 'multiply', symbol: '×', label: 'Mnożenie', enabled: true },
  { key: 'divide', symbol: '÷', label: 'Dzielenie', enabled: false },
];

const TABLE_SIZE = 10;
const ANSWER_COUNT = 6;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion() {
  const a = randomInt(2, 10);
  const b = randomInt(2, 10);
  const correct = a * b;
  const candidates = new Set([correct]);

  const distractorPool = [...new Set([
    correct - a,
    correct + a,
    correct - b,
    correct + b,
    correct - 10,
    correct + 10,
    correct - 2,
    correct + 2,
    correct - 1,
    correct + 1,
    correct - a - b,
    correct + a + b,
  ])].filter((value) => value >= 1 && value <= 100 && value !== correct);

  while (candidates.size < ANSWER_COUNT && distractorPool.length) {
    const index = randomInt(0, distractorPool.length - 1);
    candidates.add(distractorPool.splice(index, 1)[0]);
  }

  while (candidates.size < ANSWER_COUNT) {
    candidates.add(randomInt(Math.max(1, correct - 18), Math.min(100, correct + 18)));
  }

  const answers = [...candidates]
    .sort((left, right) => left - right)
    .slice(0, ANSWER_COUNT);

  return { a, b, correct, answers };
}

function topbar({ back = false } = {}) {
  return `
    <header class="topbar">
      <button class="icon-button" id="back" type="button" aria-label="Wróć" ${back ? '' : 'hidden'}>‹</button>
      <div class="brand">Tabliczka mnożenia</div>
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
  resetAttemptState();

  app.innerHTML = `
    ${topbar()}
    <section class="screen">
      <div class="hero">
        <p class="eyebrow">Matematyka</p>
        <h1>Co dziś ćwiczymy?</h1>
        <p>Każdy rodzaj działania ma własny tryb. W tej pierwszej wersji sprawdzamy mnożenie i sposób tłumaczenia błędów.</p>
      </div>
      <div class="category-grid" aria-label="Kategorie matematyki">
        ${categoryItems.map((item) => `
          <button
            class="category-card ${item.enabled ? 'active' : ''}"
            type="button"
            data-category="${item.key}"
            ${item.enabled ? '' : 'disabled aria-disabled="true"'}
          >
            <span class="category-symbol" aria-hidden="true">${item.symbol}</span>
            <span class="category-name">${item.label}</span>
          </button>
        `).join('')}
      </div>
    </section>
  `;

  app.querySelector('[data-category="multiply"]')?.addEventListener('click', () => {
    state.screen = 'multiply';
    nextQuestion();
  });
}

function nextQuestion() {
  state.question = makeQuestion();
  resetAttemptState();
  renderMultiply();
}

function answerGrid(q) {
  return `
    <div class="answer-grid" aria-label="Wybierz wynik. Odpowiedzi są ułożone rosnąco.">
      ${q.answers.map((answer) => {
        const isCorrectState = state.locked && answer === q.correct;
        const classes = ['answer'];
        if (isCorrectState) classes.push('correct');
        return `
          <button
            class="${classes.join(' ')}"
            type="button"
            data-answer="${answer}"
            ${state.locked ? 'disabled' : ''}
          >${answer}</button>
        `;
      }).join('')}
    </div>
  `;
}

function equationMarkup(q, animate = false) {
  return `
    <p class="equation ${animate ? 'equation-build' : ''}" aria-label="${q.a} razy ${q.b}">
      <span class="equation-number equation-left">${q.a}</span>
      <span class="equation-sign" aria-hidden="true">×</span>
      <span class="equation-number equation-right">${q.b}</span>
    </p>
  `;
}

function wrongNotice() {
  return `
    <p class="wrong-answer-note" role="status" aria-live="polite">
      Wynik tego działania to nie <strong>${state.lastWrongAnswer}</strong>.
    </p>
  `;
}

function explainerActions() {
  return `
    <div class="explainer-actions-panel" data-explainer-actions>
      <button class="explainer-action retry-action" type="button" data-retry>
        <span aria-hidden="true">↺</span> Spróbuj ponownie
      </button>
      <button class="explainer-action next-action" type="button" data-next-question>
        Dalej <span aria-hidden="true">→</span>
      </button>
    </div>
  `;
}

function renderMultiply({ feedback = '', feedbackType = '' } = {}) {
  const q = state.question;
  const showExplainer = state.hadMistake;
  const animateEquation = !showExplainer;

  app.innerHTML = `
    ${topbar({ back: true })}
    <section class="screen quiz-screen">
      <div class="quiz-stage ${showExplainer ? 'has-explainer' : ''}">
        <div class="question-block">
          <p class="question-label">Ile to jest?</p>
          ${equationMarkup(q, animateEquation)}
          ${showExplainer ? wrongNotice() : ''}
        </div>

        ${showExplainer ? `
          <div class="explainer-reveal" data-explainer-reveal>
            <div class="explainer-reveal-inner">
              ${multiplicationExplainer(q.a, q.b)}
            </div>
          </div>
          ${explainerActions()}
        ` : `
          ${answerGrid(q)}
          <p class="feedback ${feedbackType}" role="status">${feedback}</p>
        `}
      </div>
    </section>
  `;

  app.querySelector('#back')?.addEventListener('click', renderCategories);

  app.querySelectorAll('[data-answer]').forEach((button) => {
    button.addEventListener('click', () => chooseAnswer(Number(button.dataset.answer)));
  });

  app.querySelector('[data-retry]')?.addEventListener('click', retryQuestion);
  app.querySelector('[data-next-question]')?.addEventListener('click', nextQuestion);
  const explainerController = bindExplainerInteractions(q.a, q.b);

  if (showExplainer) {
    const reveal = app.querySelector('[data-explainer-reveal]');
    const actions = app.querySelector('[data-explainer-actions]');
    window.setTimeout(() => {
      if (state.screen !== 'multiply' || !state.hadMistake || state.question !== q) return;
      reveal?.classList.add('is-open');
      window.setTimeout(() => {
        if (state.screen !== 'multiply' || !state.hadMistake || state.question !== q) return;
        explainerController?.startDemo();
      }, 520);
      window.setTimeout(() => actions?.classList.add('is-visible'), 320);
    }, 520);
  }
}

function chooseAnswer(answer) {
  if (state.locked) return;
  const q = state.question;

  if (answer === q.correct) {
    state.locked = true;
    renderMultiply({ feedback: 'Dobrze!', feedbackType: 'good' });

    window.setTimeout(() => {
      if (state.screen === 'multiply') nextQuestion();
    }, 720);
    return;
  }

  state.wrongAnswers.add(answer);
  state.hadMistake = true;
  state.lastWrongAnswer = answer;
  renderMultiply();
}

function retryQuestion() {
  resetAttemptState();
  renderMultiply();
}

function multiplicationExplainer(rows, columns) {
  const cells = [];

  for (let row = 1; row <= TABLE_SIZE; row += 1) {
    for (let col = 1; col <= TABLE_SIZE; col += 1) {
      const inProblem = row <= rows && col <= columns;
      const count = inProblem ? ((row - 1) * columns) + col : '';
      cells.push(`
        <span
          class="array-cell ${inProblem ? 'in-problem' : 'outside-problem'}"
          data-row="${row}"
          data-col="${col}"
          data-count="${count}"
          aria-hidden="true"
        >${inProblem ? `<span class="cell-number">${count}</span>` : ''}</span>
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
    return `
      <button
        class="row-expression"
        type="button"
        data-explain-step="${step}"
        aria-pressed="false"
        aria-label="Pokaż ${total} pól: ${expression}"
      >${expression}</button>
    `;
  }).join('');

  return `
    <section class="explainer" aria-label="Wyjaśnienie mnożenia: ${rows} rzędów po ${columns}">
      <div class="explainer-copy">
        <span class="explainer-title">${rows} rzędów po ${columns}</span>
      </div>

      <div class="explain-grid">
        <div class="column-labels" aria-label="Numery kolumn">${columnLabels}</div>
        <div class="row-labels" aria-label="Numery rzędów">${rowLabels}</div>
        <div class="array" aria-hidden="true">
          ${cells.join('')}
          <span class="demo-finger" data-demo-finger aria-hidden="true">
            <svg viewBox="0 0 28 28" focusable="false" aria-hidden="true">
              <path d="M14 24V6M7.5 12.5 14 6l6.5 6.5" />
            </svg>
          </span>
        </div>
        <div class="row-expressions" aria-label="Kolejne dodawanie">${expressions}</div>
      </div>

      <p class="grid-caption">Dotknij wyniku po prawej, żeby policzyć podświetlone pola.</p>
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

  const setButtonsEnabled = (enabled) => {
    buttons.forEach((button) => {
      button.disabled = !enabled;
      button.classList.toggle('demo-locked', !enabled);
    });
  };

  const updateLabels = (count) => {
    const currentRow = count > 0 ? Math.ceil(count / columns) : 0;
    const currentColumn = count > 0 ? ((count - 1) % columns) + 1 : 0;

    app.querySelectorAll('[data-row-label]').forEach((label) => {
      const row = Number(label.dataset.rowLabel);
      label.classList.toggle('is-active', count > 0 && row <= currentRow && row <= rows);
    });

    app.querySelectorAll('[data-col-label]').forEach((label) => {
      const col = Number(label.dataset.colLabel);
      const activeThrough = currentRow > 1 ? columns : currentColumn;
      label.classList.toggle('is-active', count > 0 && col <= activeThrough && col <= columns);
    });
  };

  const paintCount = (count) => {
    app.querySelectorAll('.array-cell[data-count]').forEach((cell) => {
      const cellCount = Number(cell.dataset.count);
      const isCounted = cellCount > 0 && cellCount <= count;
      cell.classList.toggle('is-active', isCounted);
      cell.classList.toggle('show-number', isCounted);
    });

    updateLabels(count);

    const completedStep = count > 0 ? Math.floor(count / columns) : 0;
    buttons.forEach((button) => {
      const buttonStep = Number(button.dataset.explainStep);
      const isCurrent = count > 0 && count % columns === 0 && buttonStep === completedStep;
      button.classList.toggle('is-active', isCurrent);
      button.setAttribute('aria-pressed', 'false');
    });
  };

  const paintStep = (step) => {
    const count = step > 0 ? Math.min(step, rows) * columns : 0;
    paintCount(count);
    buttons.forEach((button) => {
      const buttonStep = Number(button.dataset.explainStep);
      const isSelected = buttonStep === selectedStep;
      const isPreview = buttonStep === step;
      button.classList.toggle('is-active', isPreview);
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  };

  const moveFingerToCell = (row, col, speed = 110) => {
    if (!finger) return;
    const cell = array.querySelector(`.array-cell[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    const x = cell.offsetLeft + cell.offsetWidth / 2;
    const y = cell.offsetTop + cell.offsetHeight * 1.66;
    finger.style.setProperty('--finger-speed', `${speed}ms`);
    finger.style.setProperty('--finger-x', `${x}px`);
    finger.style.setProperty('--finger-y', `${y}px`);
  };

  const pulseFinger = () => {
    if (!finger) return;
    finger.classList.remove('is-tapping');
    void finger.offsetWidth;
    finger.classList.add('is-tapping');
  };

  const finishDemo = () => {
    demoRunning = false;
    selectedStep = rows;
    paintStep(rows);
    finger?.classList.add('is-leaving');
    window.setTimeout(() => {
      finger?.classList.remove('is-visible', 'is-leaving', 'is-tapping');
      manualEnabled = true;
      setButtonsEnabled(true);
    }, 300);
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

    const stops = [];
    for (let col = 1; col <= columns; col += 1) {
      stops.push({ row: 1, col, count: col, delay: col === 1 ? 180 : 118, speed: 102 });
    }
    for (let row = 2; row <= rows; row += 1) {
      stops.push({ row, col: columns, count: row * columns, delay: 285, speed: 230 });
    }

    let index = 0;
    demoRunning = true;
    setButtonsEnabled(false);
    paintCount(0);
    moveFingerToCell(1, 1, 0);
    finger?.classList.add('is-visible');

    const advance = () => {
      if (!array.isConnected || state.screen !== 'multiply' || !state.hadMistake) return;
      const stop = stops[index];
      moveFingerToCell(stop.row, stop.col, stop.speed);
      paintCount(stop.count);
      pulseFinger();

      if (index >= stops.length - 1) {
        window.setTimeout(finishDemo, 340);
        return;
      }

      index += 1;
      window.setTimeout(advance, stops[index].delay);
    };

    window.setTimeout(advance, 190);
  };

  const restoreSelected = () => {
    if (manualEnabled) paintStep(selectedStep);
  };

  buttons.forEach((button) => {
    const step = Number(button.dataset.explainStep);

    button.addEventListener('pointerenter', () => {
      if (manualEnabled) paintStep(step);
    });
    button.addEventListener('pointerleave', restoreSelected);
    button.addEventListener('focus', () => {
      if (manualEnabled) paintStep(step);
    });
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

renderCategories();
