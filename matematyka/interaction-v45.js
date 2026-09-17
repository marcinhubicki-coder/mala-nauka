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

  /* v50: separator geometry is owned exclusively by division-pixel-v49.js.
     The legacy renderer that used to live here was the second independent
     source of .division-cut-overlay nodes and caused race-condition offsets
     and bright fragments where a line met the active-cell border. */
})();
