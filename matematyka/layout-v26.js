(() => {
  const processedExpressions = new WeakSet();
  const observedExplainers = new WeakSet();
  const CELL_GAP = 2;
  const CUT_PAD = 6;
  const REFERENCE_EXPRESSION = '90\u2009+\u20099\u2009=\u200999';

  function number(text) {
    const value = Number(String(text || '').replace(/[^0-9-]/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  function wrapExpressions(stage) {
    if (processedExpressions.has(stage)) return;

    stage.querySelectorAll('.row-expression').forEach(button => {
      const raw = button.textContent.trim();
      const values = raw.match(/\d+/g)?.map(Number) || [];
      const total = values.at(-1);
      let normalized = raw;

      if (raw.includes('+') && raw.includes('=')) {
        if (total === 100) {
          normalized = raw.replace(/\s+/g, '');
          button.classList.add('expression-100');
        } else {
          normalized = raw
            .replace(/\s*\+\s*/g, '\u2009+\u2009')
            .replace(/\s*=\s*/g, '\u2009=\u2009');
        }
      }

      button.textContent = '';
      const span = document.createElement('span');
      span.className = 'expression-text';
      span.textContent = normalized;
      button.appendChild(span);
    });

    processedExpressions.add(stage);
  }

  function measureReference(button) {
    const computed = getComputedStyle(button);
    const probe = document.createElement('span');
    probe.textContent = REFERENCE_EXPRESSION;
    Object.assign(probe.style, {
      position: 'fixed',
      left: '-9999px',
      top: '-9999px',
      visibility: 'hidden',
      whiteSpace: 'nowrap',
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      fontStyle: computed.fontStyle,
      letterSpacing: computed.letterSpacing,
      lineHeight: computed.lineHeight,
    });
    document.body.appendChild(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  }

  function fitExpressionColumn(stage) {
    const explainer = stage.querySelector('.explainer');
    const buttons = [...stage.querySelectorAll('.row-expression')];
    if (!explainer || !buttons.length) return;

    const sample = buttons.find(button => button.textContent.includes('+')) || buttons[0];
    const computed = getComputedStyle(sample);
    const pad = parseFloat(computed.paddingLeft) + parseFloat(computed.paddingRight);
    const referenceWidth = measureReference(sample);
    const desired = Math.ceil(referenceWidth + pad + 1);
    const width = Math.max(46, Math.min(56, desired));
    explainer.style.setProperty('--expression-width', `${width}px`);

    requestAnimationFrame(() => {
      buttons.forEach(button => {
        const span = button.querySelector('.expression-text');
        if (!span) return;
        span.style.transform = 'scaleX(1)';

        const style = getComputedStyle(button);
        const available = Math.max(1, button.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
        const natural = span.scrollWidth || span.getBoundingClientRect().width;
        const scale = natural > available ? Math.max(.72, available / natural) : 1;
        span.style.transform = `scaleX(${scale})`;
      });
    });
  }

  function fitRowLabels(stage) {
    const explainer = stage.querySelector('.explainer');
    const label = stage.querySelector('[data-row-label="10"]');
    if (!explainer || !label) return;

    const style = getComputedStyle(label);
    const probe = document.createElement('span');
    probe.textContent = '10';
    Object.assign(probe.style, {
      position: 'fixed',
      left: '-9999px',
      visibility: 'hidden',
      whiteSpace: 'nowrap',
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      letterSpacing: '-.10em',
      transform: 'scaleX(.86)',
    });
    document.body.appendChild(probe);
    const measured = probe.getBoundingClientRect().width;
    probe.remove();

    explainer.style.setProperty('--row-label-width', `${Math.max(10, Math.min(13, Math.ceil(measured + 2)))}px`);
  }

  function setStableTracks(stage) {
    const explainer = stage.querySelector('.explainer');
    const array = stage.querySelector('.array');
    const rowLabels = stage.querySelector('.row-labels');
    const rowExpressions = stage.querySelector('.row-expressions');
    const firstCell = array?.querySelector('.array-cell[data-row="1"][data-col="1"]');
    if (!explainer || !array || !rowLabels || !rowExpressions || !firstCell) return;

    const cellSize = firstCell.getBoundingClientRect().width;
    if (!cellSize) return;

    const isDivision = stage.dataset.operation === 'divide';
    const divisor = isDivision ? number(stage.querySelector('.equation-right')?.textContent) : 0;
    const tracks = Array.from({ length: 10 }, (_, index) => {
      const row = index + 1;
      const hasCutAfter = isDivision && divisor && row < divisor;
      return `${cellSize + (hasCutAfter ? CUT_PAD : 0)}px`;
    }).join(' ');

    [array, rowLabels, rowExpressions].forEach(grid => {
      grid.style.gridTemplateRows = tracks;
      grid.style.rowGap = isDivision ? '0px' : `${CELL_GAP}px`;
    });

    explainer.style.setProperty('--stable-cell-size', `${cellSize}px`);

    if (isDivision) {
      const overhang = cellSize / 3;
      explainer.style.setProperty('--division-cell-size', `${cellSize}px`);
      explainer.style.setProperty('--division-cut-pad', `${CUT_PAD}px`);
      explainer.style.setProperty('--division-cut-half-pad', `${CUT_PAD / 2}px`);
      explainer.style.setProperty('--division-cut-overhang', `${overhang}px`);
      explainer.style.setProperty('--division-cut-left', `${-overhang}px`);
      explainer.style.setProperty('--division-cut-extra', `${overhang * 2}px`);
    }
  }

  function layoutStage(stage) {
    if (!stage?.isConnected || !stage.classList.contains('has-explainer')) return;
    if (stage.dataset.geometryLocked === '1') return;

    wrapExpressions(stage);
    fitRowLabels(stage);
    fitExpressionColumn(stage);
    setStableTracks(stage);

    const explainer = stage.querySelector('.explainer');
    if (explainer && !observedExplainers.has(explainer) && 'ResizeObserver' in window) {
      observedExplainers.add(explainer);
      const resizeObserver = new ResizeObserver(() => {
        if (!stage.isConnected || stage.dataset.geometryLocked === '1') return;
        requestAnimationFrame(() => layoutStage(stage));
      });
      resizeObserver.observe(explainer);
    }
  }

  function scan() {
    document.querySelectorAll('.quiz-stage.has-explainer').forEach(stage => {
      if (stage.dataset.geometryLocked !== '1') layoutStage(stage);
    });
  }

  let raf = 0;
  function scheduleScan() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => requestAnimationFrame(scan));
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('resize', scheduleScan, { passive: true });
  scheduleScan();
})();
