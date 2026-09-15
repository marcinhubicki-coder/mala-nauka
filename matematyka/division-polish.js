(() => {
  const processed = new WeakSet();
  const CUT_PAD = 4;

  function number(node) {
    const value = Number(String(node?.textContent || '').replace(/[^0-9-]/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  function rowShift(row, divisor) {
    const cutsBefore = Math.min(Math.max(row - 1, 0), Math.max(divisor - 1, 0));
    return cutsBefore * CUT_PAD;
  }

  function polish(stage) {
    if (!stage || processed.has(stage)) return;
    const explainer = stage.querySelector('.explainer');
    const array = stage.querySelector('.array');
    const title = stage.querySelector('.explainer-title');
    if (!explainer || !array || !title) return;

    const values = [...stage.querySelectorAll('.question-block .equation-number')].map(number);
    if (values.length < 2 || values.some(value => value == null)) return;

    const dividend = values[0];
    const divisor = values[1];
    const quotient = Number(stage.dataset.correctAnswer);
    if (!Number.isFinite(quotient)) return;

    title.textContent = `${dividend} podzielone na ${divisor} równych części to ${quotient}`;
    explainer.classList.add('division-polished');
    explainer.style.setProperty('--division-total-shift', `${Math.max(0, divisor - 1) * CUT_PAD}px`);

    array.querySelectorAll('.array-cell').forEach(cell => {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      const active = row >= 1 && row <= divisor && col >= 1 && col <= quotient;

      cell.style.setProperty('--division-row-shift', `${rowShift(row, divisor)}px`);
      cell.classList.toggle('division-result-column', active && col === quotient);
      cell.classList.toggle('division-cut-segment', active && row < divisor);
      cell.classList.toggle('division-cut-last', active && row < divisor && col === quotient);
    });

    stage.querySelectorAll('[data-row-label]').forEach(label => {
      const row = Number(label.dataset.rowLabel);
      label.style.setProperty('--division-row-shift', `${rowShift(row, divisor)}px`);
    });

    stage.querySelectorAll('.row-expressions > *').forEach((item, index) => {
      item.style.setProperty('--division-row-shift', `${rowShift(index + 1, divisor)}px`);
    });

    stage.querySelectorAll('[data-col-label]').forEach(label => {
      label.classList.toggle('division-result-label', Number(label.dataset.colLabel) === quotient);
    });

    processed.add(stage);
  }

  function scan() {
    document.querySelectorAll('.quiz-stage[data-operation="divide"]').forEach(polish);
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
