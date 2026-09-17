(() => {
  const bypassWrongPreview = new WeakSet();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Wrong answer gets 0.5 s of feedback on a fixed clone. Because the clone is
     attached to <body>, answer-grid paint containment and the app-shell's
     overflow rules cannot clip the shake or halo. */
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-answer]');
    if (!button || button.disabled) return;

    if (bypassWrongPreview.has(button)) {
      bypassWrongPreview.delete(button);
      return;
    }

    const stage = button.closest('.quiz-stage');
    if (!stage || stage.classList.contains('wrong-preview-running')) return;

    const selected = Number(button.dataset.answer);
    const correct = Number(stage.dataset.correctAnswer);
    if (!Number.isFinite(selected) || !Number.isFinite(correct) || selected === correct) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const rect = button.getBoundingClientRect();
    const ghost = button.cloneNode(true);
    ghost.removeAttribute('data-answer');
    ghost.removeAttribute('id');
    ghost.disabled = true;
    ghost.classList.remove('wrong', 'correct');
    ghost.classList.add('wrong-preview-ghost');
    Object.assign(ghost.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });

    stage.classList.add('wrong-preview-running');
    button.classList.add('wrong-preview-source');
    document.body.appendChild(ghost);

    const delay = reducedMotion.matches ? 140 : 500;
    window.setTimeout(() => {
      ghost.remove();
      if (!button.isConnected || !stage.isConnected) return;
      button.classList.remove('wrong-preview-source');
      stage.classList.remove('wrong-preview-running');
      bypassWrongPreview.add(button);
      button.click();
    }, delay);
  }, true);

  /* Separatory dzielenia są niezależną warstwą. Pozycję Y liczymy z faktycznej
     szczeliny pomiędzy obrysem bieżącego kwadratu a początkiem następnego rzędu.
     Przy docelowej szczelinie 3 px kreska siedzi dokładnie pośrodku: 1 px luzu,
     1 px kreski, 1 px luzu. */
  let separatorFrame = 0;
  const observedArrays = new WeakSet();

  function drawDivisionSeparators(stage) {
    if (!stage?.isConnected || stage.dataset.operation !== 'divide' || !stage.classList.contains('has-explainer')) return;

    const array = stage.querySelector('.array');
    if (!array) return;

    array.querySelectorAll('.division-cut-overlay').forEach(node => node.remove());

    const divisor = Number(stage.querySelector('.equation-right')?.textContent);
    const quotient = Number(stage.dataset.correctAnswer);
    if (!Number.isFinite(divisor) || !Number.isFinite(quotient) || divisor < 2 || quotient < 1) return;

    for (let row = 1; row < divisor; row += 1) {
      const first = array.querySelector(`.array-cell[data-row="${row}"][data-col="1"]`);
      const last = array.querySelector(`.array-cell[data-row="${row}"][data-col="${quotient}"]`);
      const next = array.querySelector(`.array-cell[data-row="${row + 1}"][data-col="1"]`);
      if (!first || !last || !next) continue;

      const overhang = first.offsetWidth / 3;
      const left = first.offsetLeft - overhang;
      const rightOverhang = quotient >= 10 ? 0 : overhang;
      const right = last.offsetLeft + last.offsetWidth + rightOverhang;

      const cellBottom = first.offsetTop + first.offsetHeight;
      const nextTop = next.offsetTop;
      const measuredGap = Math.max(1, nextTop - cellBottom);
      const top = cellBottom + Math.max(0, Math.floor((measuredGap - 1) / 2));

      const line = document.createElement('span');
      line.className = 'division-cut-overlay';
      line.setAttribute('aria-hidden', 'true');
      line.style.left = `${left}px`;
      line.style.top = `${top}px`;
      line.style.width = `${Math.max(0, right - left)}px`;
      array.appendChild(line);
    }

    if ('ResizeObserver' in window && !observedArrays.has(array)) {
      observedArrays.add(array);
      const observer = new ResizeObserver(scheduleSeparators);
      observer.observe(array);
    }
  }

  function scanSeparators() {
    separatorFrame = 0;
    document.querySelectorAll('.quiz-stage.has-explainer[data-operation="divide"]').forEach(drawDivisionSeparators);
  }

  function scheduleSeparators() {
    if (separatorFrame) return;
    separatorFrame = requestAnimationFrame(() => {
      separatorFrame = requestAnimationFrame(scanSeparators);
    });
  }

  const domObserver = new MutationObserver(records => {
    const relevant = records.some(record => {
      const nodes = [...record.addedNodes, ...record.removedNodes].filter(node => node.nodeType === 1);
      return nodes.some(node => !node.classList?.contains('division-cut-overlay'));
    });
    if (relevant) scheduleSeparators();
  });

  const start = () => {
    const app = document.querySelector('#app');
    if (app) domObserver.observe(app, { childList: true, subtree: true });
    scheduleSeparators();
  };

  window.addEventListener('resize', scheduleSeparators, { passive: true });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
