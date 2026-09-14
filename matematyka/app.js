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

  app.innerHTML = `
    ${topbar({ back: true })}
    <section class="screen quiz-screen">
      <div class="quiz-stage ${showExplainer ? 'has-explainer' : ''}">
        <div class="question-block">
          <p class="question-label">Ile to jest?</p>
          <p class="equation" aria-label="${q.a} razy ${q.b}">${q.a} × ${q.b}</p>
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
  bindExplainerInteractions(q.a, q.b);

  if (showExplainer) {
    const reveal = app.querySelector('[data-explainer-reveal]');
    const actions = app.querySelector('[data-explainer-actions]');
    window.setTimeout(() => {
      if (state.screen !== 'multiply' || !state.hadMistake || state.question !== q) return;
      reveal?.classList.add('is-open');
      window.setTimeout(() => actions?.classList.add('is-visible'), 280);
    }, 520);
  }
}

function chooseAnswer(answer) {
  if (state.locked) return;
  const q = state.question;

  if (answer === q.correct) {
    state.locked = true;
    renderMultiply({ feedback: 'Dobrze!', feedbackType: 'good' });

    // Poprawna odpowiedź prowadzi automatycznie dalej — bez przycisku „Dalej”.
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
      const delay = inProblem ? Math.min(count - 1, 32) * 12 : 0;
      cells.push(`
        <span
          class="array-cell ${inProblem ? 'in-problem' : 'outside-problem'}"
          data-row="${row}"
          data-col="${col}"
          data-count="${count}"
          style="--cell-delay:${delay}ms"
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
        <div class="array" aria-hidden="true">${cells.join('')}</div>
        <div class="row-expressions" aria-label="Kolejne dodawanie">${expressions}</div>
      </div>

      <p class="grid-caption">Dotknij wyniku po prawej, żeby policzyć podświetlone pola.</p>
    </section>
  `;
}

function bindExplainerInteractions(rows, columns) {
  const buttons = [...app.querySelectorAll('[data-explain-step]')];
  if (!buttons.length) return;

  let selectedStep = 0;

  const paint = (step) => {
    app.querySelectorAll('.array-cell').forEach((cell) => {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      const isCounted = step > 0 && row <= step && row <= rows && col <= columns;
      cell.classList.toggle('is-active', isCounted);
      cell.classList.toggle('show-number', isCounted);
    });

    app.querySelectorAll('[data-row-label]').forEach((label) => {
      const row = Number(label.dataset.rowLabel);
      label.classList.toggle('is-active', step > 0 && row <= step && row <= rows);
    });

    app.querySelectorAll('[data-col-label]').forEach((label) => {
      const col = Number(label.dataset.colLabel);
      label.classList.toggle('is-active', step > 0 && col <= columns);
    });

    buttons.forEach((button) => {
      const buttonStep = Number(button.dataset.explainStep);
      const isSelected = buttonStep === selectedStep;
      const isPreview = buttonStep === step;
      button.classList.toggle('is-active', isPreview);
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  };

  const restoreSelected = () => paint(selectedStep);

  buttons.forEach((button) => {
    const step = Number(button.dataset.explainStep);

    button.addEventListener('pointerenter', () => paint(step));
    button.addEventListener('pointerleave', restoreSelected);
    button.addEventListener('focus', () => paint(step));
    button.addEventListener('blur', restoreSelected);
    button.addEventListener('click', () => {
      selectedStep = selectedStep === step ? 0 : step;
      paint(selectedStep);
    });
  });

  paint(0);
}

renderCategories();
