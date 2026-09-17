(() => {
  const CELL_GAP = 2;
  const CUT_EXTRA = 1;
  const HEADER_ROW = 13;
  const GRID_ROW_GAP = 3;
  const locked = new WeakSet();

  function number(value) {
    const parsed = Number(String(value ?? '').replace(/[^0-9-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
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
    const firstCell = array?.querySelector('.array-cell[data-row="1"][data-col="1"]');
    if (!explainer || !array || !rowLabels || !rowExpressions || !firstCell) return false;

    /* Rozmiar pionowych torów pochodzi z faktycznego kwadratu. Bazowy rytm
       pionowy jest identyczny z mnożeniem: 2 px między każdym rzędem. W
       dzieleniu separator dostaje tylko 1 dodatkowy piksel toru, więc przy
       cięciu całkowita szczelina wynosi 3 px. */
    const cellRect = firstCell.getBoundingClientRect();
    const cellSize = cellRect.width;
    if (!(cellSize > 0)) return false;

    const isDivision = stage.dataset.operation === 'divide';
    const divisor = isDivision ? number(stage.querySelector('.equation-right')?.textContent) : 0;
    const cutCount = isDivision && divisor ? Math.max(0, Math.min(9, divisor - 1)) : 0;
    const tableHeight = (cellSize * 10) + (CELL_GAP * 9) + (isDivision ? cutCount * CUT_EXTRA : 0);
    const tracks = Array.from({ length: 10 }, (_, index) => {
      const row = index + 1;
      const hasCutAfter = isDivision && divisor && row < divisor;
      return `${cellSize + (hasCutAfter ? CUT_EXTRA : 0)}px`;
    }).join(' ');

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

    if (isDivision) {
      const cutGap = CELL_GAP + CUT_EXTRA;
      const overhang = cellSize / 3;
      explainer.style.setProperty('--division-cell-size', `${cellSize}px`);
      explainer.style.setProperty('--division-cut-pad', `${cutGap}px`);
      explainer.style.setProperty('--division-cut-half-pad', `${cutGap / 2}px`);
      explainer.style.setProperty('--division-cut-overhang', `${overhang}px`);
      explainer.style.setProperty('--division-cut-left', `${-overhang}px`);
      explainer.style.setProperty('--division-cut-extra', `${overhang * 2}px`);
    }

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
