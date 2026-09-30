(() => {
  const CELL_GAP = 2;
  const HEADER_ROW = 13;
  const GRID_ROW_GAP = 3;
  const locked = new WeakSet();

  function lockGeometry(stage, force = false) {
    if (!stage?.isConnected || !stage.classList.contains('has-explainer')) return false;

    /* Dzielenie od v51 nie korzysta z tej warstwy. Dzięki temu nie ma już
       drugiego niezależnego mechanizmu dodającego lub odejmującego piksele. */
    if (stage.dataset.operation === 'divide') return false;
    if (!force && locked.has(stage)) return true;

    const explainer = stage.querySelector('.explainer');
    const reveal = stage.querySelector('[data-explainer-reveal]');
    const inner = reveal?.querySelector('.explainer-reveal-inner');
    const array = stage.querySelector('.array');
    const rowLabels = stage.querySelector('.row-labels');
    const rowExpressions = stage.querySelector('.row-expressions');
    const firstCell = array?.querySelector('.array-cell[data-row="1"][data-col="1"]');
    if (!explainer || !array || !rowLabels || !rowExpressions || !firstCell) return false;

    const cellRect = firstCell.getBoundingClientRect();
    const cellSize = cellRect.width;
    if (!(cellSize > 0)) return false;

    const tableHeight = (cellSize * 10) + (CELL_GAP * 9);
    const tracks = `repeat(10, ${cellSize}px)`;

    [array, rowLabels, rowExpressions].forEach(grid => {
      grid.style.gridTemplateRows = tracks;
      grid.style.rowGap = `${CELL_GAP}px`;
      grid.style.height = `${tableHeight}px`;
      grid.style.minHeight = `${tableHeight}px`;
      grid.style.maxHeight = `${tableHeight}px`;
    });

    explainer.style.setProperty('--stable-cell-size', `${cellSize}px`);
    explainer.style.setProperty('--reserved-table-height', `${tableHeight}px`);
    explainer.style.setProperty('--reserved-grid-height', `${HEADER_ROW + GRID_ROW_GAP + tableHeight}px`);
    stage.dataset.geometryLocked = '1';

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

  const observer = new MutationObserver(() => lockAll(false));
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('resize', () => {
    requestAnimationFrame(() => lockAll(true));
  }, { passive: true });

  window.__mathLockExplainerGeometry = lockGeometry;
  lockAll(false);
})();
