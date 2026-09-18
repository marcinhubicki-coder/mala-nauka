(() => {
  const BASE_GAP = 2;
  const CUT_SPACER = 7; // 3px + 1px line + 3px
  const LINE_TOP = 3;
  let raf = 0;

  function number(text) {
    const value = Number(String(text || '').replace(/[^0-9-]/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  function applyDivisionGrid(stage) {
    if (!stage?.isConnected || stage.dataset.operation !== 'divide' || !stage.classList.contains('has-explainer')) return;

    const explainer = stage.querySelector('.explainer');
    const reveal = stage.querySelector('[data-explainer-reveal]');
    const inner = reveal?.querySelector('.explainer-reveal-inner');
    const explainGrid = stage.querySelector('.explain-grid');
    const array = stage.querySelector('.array');
    const columnLabels = stage.querySelector('.column-labels');
    const rowLabels = stage.querySelector('.row-labels');
    const rowExpressions = stage.querySelector('.row-expressions');
    const firstCell = array?.querySelector('.array-cell[data-row="1"][data-col="1"]');
    if (!explainer || !array || !columnLabels || !rowLabels || !rowExpressions || !firstCell) return;

    const divisorRaw = number(stage.querySelector('.equation-right')?.textContent);
    const quotientRaw = number(stage.dataset.correctAnswer);
    const divisor = Math.max(1, Math.min(10, divisorRaw || 1));
    const quotient = Math.max(1, Math.min(10, quotientRaw || 1));

    const width = array.getBoundingClientRect().width;
    if (!(width > BASE_GAP * 9)) return;

    /* Start from the exact multiplication geometry: ten equal square columns
       with 2px horizontal gaps. Vertical spacing is represented only inside
       row tracks, so there is no second row-gap mechanism that can interfere. */
    const cell = (width - BASE_GAP * 9) / 10;
    const columnTemplate = `repeat(10, ${cell}px)`;
    const rowGaps = Array.from({ length: 10 }, (_, index) => {
      const row = index + 1;
      if (row === 10) return 0;
      return row < divisor ? CUT_SPACER : BASE_GAP;
    });
    const rowTemplate = rowGaps.map(gap => `${cell + gap}px`).join(' ');
    const tableHeight = (cell * 10) + rowGaps.reduce((sum, gap) => sum + gap, 0);

    array.style.setProperty('grid-template-columns', columnTemplate, 'important');
    array.style.setProperty('grid-template-rows', rowTemplate, 'important');
    array.style.setProperty('column-gap', `${BASE_GAP}px`, 'important');
    array.style.setProperty('row-gap', '0px', 'important');
    array.style.setProperty('height', `${tableHeight}px`, 'important');
    array.style.setProperty('min-height', `${tableHeight}px`, 'important');
    array.style.setProperty('max-height', `${tableHeight}px`, 'important');
    array.style.setProperty('position', 'relative', 'important');
    array.style.setProperty('overflow', 'visible', 'important');

    columnLabels.style.setProperty('grid-template-columns', columnTemplate, 'important');
    columnLabels.style.setProperty('column-gap', `${BASE_GAP}px`, 'important');

    [rowLabels, rowExpressions].forEach(grid => {
      grid.style.setProperty('grid-template-rows', rowTemplate, 'important');
      grid.style.setProperty('row-gap', '0px', 'important');
      grid.style.setProperty('height', `${tableHeight}px`, 'important');
      grid.style.setProperty('min-height', `${tableHeight}px`, 'important');
      grid.style.setProperty('max-height', `${tableHeight}px`, 'important');
    });

    array.querySelectorAll('.array-cell').forEach(cellNode => {
      cellNode.style.setProperty('width', `${cell}px`, 'important');
      cellNode.style.setProperty('height', `${cell}px`, 'important');
      cellNode.style.setProperty('align-self', 'start', 'important');
      cellNode.style.setProperty('box-sizing', 'border-box', 'important');
    });

    rowLabels.querySelectorAll(':scope > *').forEach(item => {
      item.style.setProperty('height', `${cell}px`, 'important');
      item.style.setProperty('min-height', `${cell}px`, 'important');
      item.style.setProperty('align-self', 'start', 'important');
    });

    rowExpressions.querySelectorAll(':scope > *').forEach(item => {
      item.style.setProperty('height', `${cell}px`, 'important');
      item.style.setProperty('min-height', `${cell}px`, 'important');
      item.style.setProperty('align-self', 'start', 'important');
    });

    stage.dataset.geometryLocked = '1';
    stage.dataset.divisionGridOwner = 'v51';
    explainer.style.setProperty('--stable-cell-size', `${cell}px`);
    explainer.style.setProperty('--reserved-table-height', `${tableHeight}px`);

    const headerHeight = columnLabels.getBoundingClientRect().height || 18;
    const gridGap = explainGrid ? (parseFloat(getComputedStyle(explainGrid).rowGap) || 4) : 4;
    explainer.style.setProperty('--reserved-grid-height', `${headerHeight + gridGap + tableHeight}px`);

    /* Remove every legacy line, then render exactly one separator in each 7px
       spacer. The line is always at 3px: 3px above, 1px line, 3px below. */
    array.querySelectorAll('.division-cut-overlay, .division-separator-v51').forEach(node => node.remove());

    for (let row = 1; row < divisor; row += 1) {
      const first = array.querySelector(`.array-cell[data-row="${row}"][data-col="1"]`);
      const last = array.querySelector(`.array-cell[data-row="${row}"][data-col="${quotient}"]`);
      if (!first || !last) continue;

      const overhang = first.offsetWidth / 3;
      const left = first.offsetLeft - overhang;
      const right = last.offsetLeft + last.offsetWidth + (quotient >= 10 ? 0 : overhang);
      const top = first.offsetTop + first.offsetHeight + LINE_TOP;

      const line = document.createElement('span');
      line.className = 'division-separator-v51';
      line.setAttribute('aria-hidden', 'true');
      line.style.left = `${left}px`;
      line.style.top = `${top}px`;
      line.style.width = `${Math.max(0, right - left)}px`;
      array.appendChild(line);
    }

    /* The explainer reserve is recalculated after the final geometry, so the
       action buttons keep the same external spacing as multiplication. */
    if (reveal && inner) {
      reveal.style.height = 'auto';
      reveal.style.minHeight = '0';
      reveal.style.maxHeight = 'none';
      requestAnimationFrame(() => {
        if (!reveal.isConnected || !inner.isConnected) return;
        const finalHeight = Math.ceil(inner.getBoundingClientRect().height || inner.scrollHeight || 0);
        if (finalHeight > 0) {
          reveal.style.height = `${finalHeight}px`;
          reveal.style.minHeight = `${finalHeight}px`;
          reveal.style.maxHeight = `${finalHeight}px`;
        }
      });
    }
  }

  function scan() {
    raf = 0;
    document.querySelectorAll('.quiz-stage.has-explainer[data-operation="divide"]').forEach(applyDivisionGrid);
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => requestAnimationFrame(scan));
  }

  const start = () => {
    const app = document.querySelector('#app');
    if (!app) return;

    const observer = new MutationObserver(records => {
      const relevant = records.some(record => [...record.addedNodes, ...record.removedNodes]
        .some(node => node.nodeType === 1 && !node.classList?.contains('division-separator-v51')));
      if (relevant) schedule();
    });
    observer.observe(app, { childList: true, subtree: true });

    window.addEventListener('resize', schedule, { passive: true });
    schedule();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
