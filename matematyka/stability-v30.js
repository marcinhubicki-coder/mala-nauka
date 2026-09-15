(() => {
  const CELL_GAP = 2;
  const CUT_PAD = 6;
  const HEADER_ROW = 13;
  const GRID_ROW_GAP = 3;
  const TWEEN_MS = 560;
  const locked = new WeakSet();
  let pendingCounter = null;

  function number(value) {
    const parsed = Number(String(value ?? '').replace(/[^0-9-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function currentQuestion() {
    const stage = document.querySelector('.quiz-stage[data-correct-answer][data-operation]');
    if (!stage) return null;
    const correct = Number(stage.dataset.correctAnswer);
    if (!Number.isFinite(correct)) return null;
    return {
      stage,
      correct,
      equation: [...stage.querySelectorAll('.equation-number')].map(node => number(node.textContent)),
      answers: [...stage.querySelectorAll('.answer[data-answer]')].map(node => number(node.dataset.answer)),
    };
  }

  function lockGeometry(stage, force = false) {
    if (!stage?.isConnected || !stage.classList.contains('has-explainer')) return false;
    if (!force && locked.has(stage)) return true;

    const explainer = stage.querySelector('.explainer');
    const reveal = stage.querySelector('[data-explainer-reveal]');
    const inner = reveal?.querySelector('.explainer-reveal-inner');
    const array = stage.querySelector('.array');
    const rowLabels = stage.querySelector('.row-labels');
    const rowExpressions = stage.querySelector('.row-expressions');
    if (!explainer || !array || !rowLabels || !rowExpressions) return false;

    const width = array.getBoundingClientRect().width;
    if (!(width > 0)) return false;

    const cellSize = (width - (CELL_GAP * 9)) / 10;
    if (!(cellSize > 0)) return false;

    const isDivision = stage.dataset.operation === 'divide';
    const divisor = isDivision ? number(stage.querySelector('.equation-right')?.textContent) : 0;
    const cutCount = isDivision && divisor ? Math.max(0, Math.min(9, divisor - 1)) : 0;
    const tableHeight = (cellSize * 10) + (isDivision ? cutCount * CUT_PAD : CELL_GAP * 9);
    const tracks = Array.from({ length: 10 }, (_, index) => {
      const row = index + 1;
      const hasCutAfter = isDivision && divisor && row < divisor;
      return `${cellSize + (hasCutAfter ? CUT_PAD : 0)}px`;
    }).join(' ');

    [array, rowLabels, rowExpressions].forEach(grid => {
      grid.style.gridTemplateRows = tracks;
      grid.style.rowGap = isDivision ? '0px' : `${CELL_GAP}px`;
      grid.style.height = `${tableHeight}px`;
      grid.style.minHeight = `${tableHeight}px`;
      grid.style.maxHeight = `${tableHeight}px`;
    });

    explainer.style.setProperty('--stable-cell-size', `${cellSize}px`);
    explainer.style.setProperty('--reserved-table-height', `${tableHeight}px`);
    explainer.style.setProperty('--reserved-grid-height', `${HEADER_ROW + GRID_ROW_GAP + tableHeight}px`);

    if (isDivision) {
      const overhang = cellSize / 3;
      explainer.style.setProperty('--division-cell-size', `${cellSize}px`);
      explainer.style.setProperty('--division-cut-pad', `${CUT_PAD}px`);
      explainer.style.setProperty('--division-cut-half-pad', `${CUT_PAD / 2}px`);
      explainer.style.setProperty('--division-cut-overhang', `${overhang}px`);
      explainer.style.setProperty('--division-cut-left', `${-overhang}px`);
      explainer.style.setProperty('--division-cut-extra', `${overhang * 2}px`);
    }

    stage.dataset.geometryLocked = '1';

    /* Zamrażamy także zewnętrzną wysokość reveal po policzeniu pełnej tabeli.
       Późniejsze opacity/visibility nie mogą już przesuwać żadnego elementu. */
    if (reveal && inner) {
      reveal.style.height = 'auto';
      const finalHeight = Math.ceil(inner.getBoundingClientRect().height || inner.scrollHeight || 0);
      if (finalHeight > 0) {
        reveal.style.height = `${finalHeight}px`;
        reveal.style.minHeight = `${finalHeight}px`;
        reveal.style.maxHeight = `${finalHeight}px`;
      }
    }

    locked.add(stage);
    return true;
  }

  function lockAll(force = false) {
    document.querySelectorAll('.quiz-stage.has-explainer').forEach(stage => lockGeometry(stage, force));
  }

  function prepareCounterTween(element, from, to) {
    if (!element || !Number.isFinite(from) || !Number.isFinite(to) || from === to) return null;
    const color = getComputedStyle(element).color;
    element.style.setProperty('--counter-color', color);
    element.style.setProperty('--counter-value', String(Math.round(from)));
    element.classList.add('counter-tween');
    getComputedStyle(element).getPropertyValue('--counter-value');
    return { element, to: Math.round(to) };
  }

  function animateCounters(stage, snapshot) {
    if (!stage?.isConnected || !snapshot) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tweens = [];
    [...stage.querySelectorAll('.equation-number')].forEach((element, index) => {
      const item = prepareCounterTween(element, snapshot.equation[index], number(element.textContent));
      if (item) tweens.push(item);
    });

    [...stage.querySelectorAll('.answer[data-answer]')].forEach((element, index) => {
      const item = prepareCounterTween(element, snapshot.answers[index], number(element.dataset.answer));
      if (item) tweens.push(item);
    });

    if (!tweens.length) return;

    requestAnimationFrame(() => {
      tweens.forEach(({ element, to }) => {
        if (element.isConnected) element.style.setProperty('--counter-value', String(to));
      });
    });

    window.setTimeout(() => {
      tweens.forEach(({ element }) => {
        if (!element.isConnected) return;
        element.classList.remove('counter-tween');
        element.style.removeProperty('--counter-value');
        element.style.removeProperty('--counter-color');
      });
    }, TWEEN_MS + 60);
  }

  document.addEventListener('click', event => {
    const answer = event.target.closest?.('.answer[data-answer]');
    if (!answer) return;
    const question = currentQuestion();
    if (!question) return;
    if (number(answer.dataset.answer) !== question.correct) return;

    pendingCounter = {
      fromStage: question.stage,
      feedbackStage: null,
      equation: question.equation,
      answers: question.answers,
      startedAt: performance.now(),
    };
  }, true);

  function processCounterTransition() {
    if (!pendingCounter) return;
    if (performance.now() - pendingCounter.startedAt > 2200) {
      pendingCounter = null;
      return;
    }

    const question = currentQuestion();
    if (!question || question.stage === pendingCounter.fromStage) return;

    if (!pendingCounter.feedbackStage) {
      pendingCounter.feedbackStage = question.stage;
      return;
    }
    if (question.stage === pendingCounter.feedbackStage) return;

    const snapshot = pendingCounter;
    pendingCounter = null;
    animateCounters(question.stage, snapshot);
  }

  const observer = new MutationObserver(() => {
    /* Callback MutationObserver jest przed paintem. Najpierw zamrażamy pełną
       geometrię tabeli, dopiero potem jakiekolwiek późniejsze klasy ją odsłaniają. */
    lockAll(false);
    processCounterTransition();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('resize', () => {
    requestAnimationFrame(() => lockAll(true));
  }, { passive: true });

  window.__mathLockExplainerGeometry = lockGeometry;
  lockAll(false);
})();
