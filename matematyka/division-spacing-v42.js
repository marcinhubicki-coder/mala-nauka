(() => {
  const CUT_EXTRA = 5;
  let frame = 0;

  function number(node) {
    const value = Number(String(node?.textContent || '').replace(/[^0-9-]/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  function rowShift(row, divisor) {
    const cutsBefore = Math.min(Math.max(row - 1, 0), Math.max(divisor - 1, 0));
    return cutsBefore * CUT_EXTRA;
  }

  function apply(stage) {
    const explainer = stage.querySelector('.explainer.division-polished');
    const array = stage.querySelector('.array');
    if (!explainer || !array) return;

    const values = [...stage.querySelectorAll('.question-block .equation-number')].map(number);
    if (values.length < 2 || values.some(value => value == null)) return;

    const divisor = values[1];
    if (!Number.isFinite(divisor)) return;

    explainer.style.setProperty('--division-total-shift', `${Math.max(0, divisor - 1) * CUT_EXTRA}px`);

    array.querySelectorAll('.array-cell').forEach(cell => {
      const row = Number(cell.dataset.row);
      if (!Number.isFinite(row)) return;
      cell.style.setProperty('--division-row-shift', `${rowShift(row, divisor)}px`);
    });

    stage.querySelectorAll('[data-row-label]').forEach(label => {
      const row = Number(label.dataset.rowLabel);
      if (!Number.isFinite(row)) return;
      label.style.setProperty('--division-row-shift', `${rowShift(row, divisor)}px`);
    });

    stage.querySelectorAll('.row-expressions > *').forEach((item, index) => {
      item.style.setProperty('--division-row-shift', `${rowShift(index + 1, divisor)}px`);
    });
  }

  function scan() {
    frame = 0;
    document.querySelectorAll('.quiz-stage[data-operation="divide"]').forEach(apply);
  }

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(scan);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  schedule();
})();
