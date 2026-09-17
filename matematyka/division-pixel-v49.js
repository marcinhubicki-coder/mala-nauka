(() => {
  const GAP = 2;
  const LINE = 1;
  let raf = 0;

  function number(text) {
    const value = Number(String(text || '').replace(/[^0-9-]/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  function exactDivisionGeometry(stage) {
    if (!stage?.isConnected || stage.dataset.operation !== 'divide' || !stage.classList.contains('has-explainer')) return;

    const explainer = stage.querySelector('.explainer');
    const array = stage.querySelector('.array');
    const columnLabels = stage.querySelector('.column-labels');
    const rowLabels = stage.querySelector('.row-labels');
    const rowExpressions = stage.querySelector('.row-expressions');
    if (!explainer || !array || !columnLabels || !rowLabels || !rowExpressions) return;

    const width = array.getBoundingClientRect().width;
    if (!(width > GAP * 9)) return;

    /* One source of truth: 10 equal square tracks + nine identical 2px gaps.
       No separator is allowed to add height to a row. */
    const cell = (width - GAP * 9) / 10;
    const template = `repeat(10, ${cell}px)`;
    const tableHeight = (cell * 10) + (GAP * 9);

    array.style.setProperty('grid-template-columns', template, 'important');
    array.style.setProperty('grid-template-rows', template, 'important');
    array.style.setProperty('column-gap', `${GAP}px`, 'important');
    array.style.setProperty('row-gap', `${GAP}px`, 'important');
    array.style.setProperty('height', `${tableHeight}px`, 'important');
    array.style.setProperty('min-height', `${tableHeight}px`, 'important');
    array.style.setProperty('max-height', `${tableHeight}px`, 'important');

    columnLabels.style.setProperty('grid-template-columns', template, 'important');
    columnLabels.style.setProperty('column-gap', `${GAP}px`, 'important');

    [rowLabels, rowExpressions].forEach(grid => {
      grid.style.setProperty('grid-template-rows', template, 'important');
      grid.style.setProperty('row-gap', `${GAP}px`, 'important');
      grid.style.setProperty('height', `${tableHeight}px`, 'important');
      grid.style.setProperty('min-height', `${tableHeight}px`, 'important');
      grid.style.setProperty('max-height', `${tableHeight}px`, 'important');
    });

    array.querySelectorAll('.array-cell').forEach(cellNode => {
      cellNode.style.setProperty('width', `${cell}px`, 'important');
      cellNode.style.setProperty('height', `${cell}px`, 'important');
    });

    stage.dataset.geometryLocked = '1';
    explainer.style.setProperty('--stable-cell-size', `${cell}px`);
    explainer.style.setProperty('--reserved-table-height', `${tableHeight}px`);

    /* Replace every older separator with a line centred in the existing 2px gap.
       This leaves 0.5px above and 0.5px below the 1px line. */
    array.querySelectorAll('.division-cut-overlay').forEach(node => node.remove());

    const divisor = number(stage.querySelector('.equation-right')?.textContent);
    const quotient = number(stage.dataset.correctAnswer);
    if (!divisor || !quotient || divisor < 2 || quotient < 1) return;

    for (let row = 1; row < Math.min(divisor, 10); row += 1) {
      const first = array.querySelector(`.array-cell[data-row="${row}"][data-col="1"]`);
      const last = array.querySelector(`.array-cell[data-row="${row}"][data-col="${Math.min(quotient, 10)}"]`);
      const next = array.querySelector(`.array-cell[data-row="${row + 1}"][data-col="1"]`);
      if (!first || !last || !next) continue;

      const overhang = first.offsetWidth / 3;
      const left = first.offsetLeft - overhang;
      const right = last.offsetLeft + last.offsetWidth + (quotient >= 10 ? 0 : overhang);
      const cellBottom = first.offsetTop + first.offsetHeight;
      const nextTop = next.offsetTop;
      const gap = Math.max(GAP, nextTop - cellBottom);
      const top = cellBottom + ((gap - LINE) / 2);

      const line = document.createElement('span');
      line.className = 'division-cut-overlay';
      line.setAttribute('aria-hidden', 'true');
      line.style.left = `${left}px`;
      line.style.top = `${top}px`;
      line.style.width = `${Math.max(0, right - left)}px`;
      array.appendChild(line);
    }
  }

  function scan() {
    raf = 0;
    document.querySelectorAll('.quiz-stage.has-explainer[data-operation="divide"]').forEach(exactDivisionGeometry);
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
        .some(node => node.nodeType === 1 && !node.classList?.contains('division-cut-overlay')));
      if (relevant) schedule();
    });
    observer.observe(app, { childList: true, subtree: true });
    window.addEventListener('resize', schedule, { passive: true });
    schedule();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
