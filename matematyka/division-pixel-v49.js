(() => {
  const BASE_GAP = 2;
  const CUT_EXTRA = 3;
  const CUT_GAP = BASE_GAP + CUT_EXTRA; // 5 px total between cut rows
  const LINE = 1;
  const LINE_TOP_PAD = 3;
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

    const divisor = number(stage.querySelector('.equation-right')?.textContent);
    const quotient = number(stage.dataset.correctAnswer);
    const safeDivisor = Number.isFinite(divisor) ? Math.max(1, Math.min(10, divisor)) : 1;
    const cutCount = Math.max(0, safeDivisor - 1);

    const width = array.getBoundingClientRect().width;
    if (!(width > BASE_GAP * 9)) return;

    /* One horizontal source of truth: ten equal square columns separated by 2px.
       Vertically, ordinary rows use the same 2px rhythm. A division cut only
       adds 3px to that row's track, producing a 5px gap: 3px above the line,
       1px line, 1px below. The separator itself never changes cell dimensions. */
    const cell = (width - BASE_GAP * 9) / 10;
    const columnTemplate = `repeat(10, ${cell}px)`;
    const rowTemplate = Array.from({ length: 10 }, (_, index) => {
      const row = index + 1;
      const hasCutAfter = row < safeDivisor;
      return `${cell + (hasCutAfter ? CUT_EXTRA : 0)}px`;
    }).join(' ');
    const tableHeight = (cell * 10) + (BASE_GAP * 9) + (CUT_EXTRA * cutCount);

    array.style.setProperty('grid-template-columns', columnTemplate, 'important');
    array.style.setProperty('grid-template-rows', rowTemplate, 'important');
    array.style.setProperty('column-gap', `${BASE_GAP}px`, 'important');
    array.style.setProperty('row-gap', `${BASE_GAP}px`, 'important');
    array.style.setProperty('height', `${tableHeight}px`, 'important');
    array.style.setProperty('min-height', `${tableHeight}px`, 'important');
    array.style.setProperty('max-height', `${tableHeight}px`, 'important');

    columnLabels.style.setProperty('grid-template-columns', columnTemplate, 'important');
    columnLabels.style.setProperty('column-gap', `${BASE_GAP}px`, 'important');

    [rowLabels, rowExpressions].forEach(grid => {
      grid.style.setProperty('grid-template-rows', rowTemplate, 'important');
      grid.style.setProperty('row-gap', `${BASE_GAP}px`, 'important');
      grid.style.setProperty('height', `${tableHeight}px`, 'important');
      grid.style.setProperty('min-height', `${tableHeight}px`, 'important');
      grid.style.setProperty('max-height', `${tableHeight}px`, 'important');
    });

    array.querySelectorAll('.array-cell').forEach(cellNode => {
      cellNode.style.setProperty('width', `${cell}px`, 'important');
      cellNode.style.setProperty('height', `${cell}px`, 'important');
      cellNode.style.setProperty('align-self', 'start', 'important');
    });

    stage.dataset.geometryLocked = '1';
    explainer.style.setProperty('--stable-cell-size', `${cell}px`);
    explainer.style.setProperty('--reserved-table-height', `${tableHeight}px`);

    /* This is now the ONLY separator renderer. Remove anything left by older
       cached code, then draw one line in each 5px cut gap. Integer positioning
       avoids half-pixel antialiasing against the rounded active-cell border. */
    array.querySelectorAll('.division-cut-overlay').forEach(node => node.remove());

    if (!divisor || !quotient || divisor < 2 || quotient < 1) return;

    for (let row = 1; row < safeDivisor; row += 1) {
      const first = array.querySelector(`.array-cell[data-row="${row}"][data-col="1"]`);
      const last = array.querySelector(`.array-cell[data-row="${row}"][data-col="${Math.min(quotient, 10)}"]`);
      const next = array.querySelector(`.array-cell[data-row="${row + 1}"][data-col="1"]`);
      if (!first || !last || !next) continue;

      const overhang = first.offsetWidth / 3;
      const left = first.offsetLeft - overhang;
      const right = last.offsetLeft + last.offsetWidth + (quotient >= 10 ? 0 : overhang);
      const cellBottom = first.offsetTop + first.offsetHeight;
      const nextTop = next.offsetTop;
      const measuredGap = Math.max(CUT_GAP, nextTop - cellBottom);
      const topPad = Math.min(LINE_TOP_PAD, Math.max(0, measuredGap - LINE));
      const top = Math.round(cellBottom + topPad);

      const line = document.createElement('span');
      line.className = 'division-cut-overlay division-cut-overlay-v50';
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
