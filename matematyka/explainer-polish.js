(() => {
  const states = new WeakMap();
  const normalized = new WeakSet();
  const WAVE_DELAY = 72;

  function stageFor(node) {
    return node?.closest?.('.quiz-stage.has-explainer');
  }

  function dimensions(stage) {
    const cells = [...stage.querySelectorAll('.array-cell.in-problem[data-row][data-col]')];
    return {
      rows: Math.max(0, ...cells.map(cell => Number(cell.dataset.row) || 0)),
      columns: Math.max(0, ...cells.map(cell => Number(cell.dataset.col) || 0)),
    };
  }

  function normalizeExpressions(stage) {
    if (normalized.has(stage)) return;
    stage.querySelectorAll('.row-expression').forEach(button => {
      const raw = button.textContent.trim();
      if (!raw.includes('+') || !raw.includes('=')) return;
      const values = raw.match(/\d+/g)?.map(Number) || [];
      const total = values.at(-1);
      if (total === 100) {
        button.textContent = raw.replace(/\s+/g, '');
        button.classList.add('expression-100');
      } else {
        button.textContent = raw
          .replace(/\s*\+\s*/g, '\u2009+\u2009')
          .replace(/\s*=\s*/g, '\u2009=\u2009');
      }
    });
    normalized.add(stage);
  }

  function clearDifference(stage) {
    stage.querySelectorAll('.difference-cell, .difference-target, .difference-soft, .difference-missing, .difference-extra').forEach(cell => {
      cell.classList.remove('difference-cell', 'difference-target', 'difference-soft', 'difference-missing', 'difference-extra');
    });
    stage.querySelectorAll('.difference-number[data-difference-number]').forEach(number => number.remove());
  }

  function updateLabels(stage, count, rows, columns) {
    const currentRow = count > 0 ? Math.ceil(count / columns) : 0;
    const currentColumn = count > 0 ? ((count - 1) % columns) + 1 : 0;

    stage.querySelectorAll('[data-row-label]').forEach(label => {
      const row = Number(label.dataset.rowLabel);
      label.classList.toggle('is-active', count > 0 && row <= currentRow && row <= rows);
    });

    stage.querySelectorAll('[data-col-label]').forEach(label => {
      const col = Number(label.dataset.colLabel);
      const activeThrough = currentRow > 1 ? columns : currentColumn;
      label.classList.toggle('is-active', count > 0 && col <= activeThrough && col <= columns);
    });
  }

  function paintStep(stage, step, rows, columns, animateRow = false) {
    const count = step > 0 ? Math.min(step, rows) * columns : 0;
    const previousActive = new Set([...stage.querySelectorAll('.array-cell.is-active')]);

    stage.querySelectorAll('.array-cell[data-count]').forEach(cell => {
      const cellCount = Number(cell.dataset.count);
      const counted = cellCount > 0 && cellCount <= count;
      cell.classList.toggle('is-active', counted);
      cell.classList.toggle('show-number', counted);

      if (animateRow && counted && !previousActive.has(cell)) {
        cell.classList.remove('wave-enter');
        void cell.offsetWidth;
        cell.classList.add('wave-enter');
        window.setTimeout(() => cell.classList.remove('wave-enter'), 380);
      }
    });

    updateLabels(stage, count, rows, columns);
    stage.querySelectorAll('.row-expression').forEach(button => {
      const buttonStep = Number(button.dataset.explainStep);
      const active = buttonStep === step;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function readyStage(stage) {
    normalizeExpressions(stage);
    const buttons = [...stage.querySelectorAll('.row-expression')];
    if (!buttons.length || buttons.some(button => button.disabled)) return;

    if (!states.has(stage)) {
      const { rows, columns } = dimensions(stage);
      const pressed = Number(stage.querySelector('.row-expression[aria-pressed="true"]')?.dataset.explainStep);
      states.set(stage, {
        rows,
        columns,
        currentStep: Number.isFinite(pressed) && pressed > 0 ? pressed : rows,
        visualStep: Number.isFinite(pressed) && pressed > 0 ? pressed : rows,
        timers: [],
      });
    }
    stage.classList.add('wave-ready');
  }

  function clearTimers(state) {
    state.timers.forEach(window.clearTimeout);
    state.timers = [];
  }

  function animateTo(stage, targetStep) {
    const state = states.get(stage);
    if (!state) return;
    clearTimers(state);

    const from = state.visualStep;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || from === targetStep) {
      paintStep(stage, targetStep, state.rows, state.columns, false);
      state.currentStep = targetStep;
      state.visualStep = targetStep;
      return;
    }

    const direction = targetStep > from ? 1 : -1;
    const sequence = [];
    for (let step = from + direction; direction > 0 ? step <= targetStep : step >= targetStep; step += direction) {
      sequence.push(step);
    }

    sequence.forEach((step, index) => {
      const timer = window.setTimeout(() => {
        if (!stage.isConnected) return;
        paintStep(stage, step, state.rows, state.columns, direction > 0);
        state.visualStep = step;
        if (index === sequence.length - 1) state.currentStep = targetStep;
      }, index * WAVE_DELAY);
      state.timers.push(timer);
    });
  }

  function scan() {
    document.querySelectorAll('.quiz-stage.has-explainer').forEach(readyStage);
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled'],
  });

  ['pointerenter', 'pointerleave', 'focus', 'blur'].forEach(type => {
    document.addEventListener(type, event => {
      const button = event.target.closest?.('.row-expression');
      const stage = stageFor(button);
      if (!button || !stage?.classList.contains('wave-ready')) return;
      event.stopImmediatePropagation();
    }, true);
  });

  document.addEventListener('click', event => {
    const button = event.target.closest?.('.row-expression');
    const stage = stageFor(button);
    if (!button || !stage?.classList.contains('wave-ready') || button.disabled) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    clearDifference(stage);

    const state = states.get(stage);
    if (!state) return;
    const step = Number(button.dataset.explainStep);
    if (!Number.isFinite(step)) return;
    const target = state.currentStep === step ? 0 : step;
    animateTo(stage, target);
  }, true);

  scan();
})();
