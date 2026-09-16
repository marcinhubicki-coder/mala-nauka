(() => {
  let correctCount = 0;
  let lastRenderedCount = 0;
  let frame = 0;

  const app = document.querySelector('#app');
  if (!app) return;

  function scheduleSync() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(syncBadge);
  }

  function syncBadge() {
    const label = app.querySelector('.quiz-stage:not(.has-explainer) .question-label');
    if (!label) return;

    let badge = label.querySelector('.mode-score-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'mode-score-badge';
      badge.setAttribute('aria-label', 'Poprawne odpowiedzi');
      badge.setAttribute('aria-live', 'polite');
      label.appendChild(badge);
    }

    const changed = correctCount !== lastRenderedCount;
    badge.textContent = String(correctCount);
    badge.classList.toggle('is-visible', correctCount > 0);
    badge.classList.toggle('is-wide', correctCount >= 10);
    badge.classList.toggle('is-hundred', correctCount >= 100);

    if (changed && correctCount > 0) {
      badge.classList.remove('is-bump');
      void badge.offsetWidth;
      badge.classList.add('is-bump');
      window.setTimeout(() => badge.classList.remove('is-bump'), 380);
    }

    lastRenderedCount = correctCount;
  }

  function resetScore() {
    correctCount = 0;
    lastRenderedCount = 0;
    scheduleSync();
  }

  window.addEventListener('math-round-start', resetScore);
  window.addEventListener('math-round-cancel', resetScore);
  window.addEventListener('math-back-to-setup', resetScore);

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-answer]');
    if (!button || button.disabled) return;

    const stage = button.closest('.quiz-stage');
    if (!stage) return;

    const selected = Number(button.dataset.answer);
    const correct = Number(stage.dataset.correctAnswer);
    if (!Number.isFinite(selected) || !Number.isFinite(correct) || selected !== correct) return;

    correctCount += 1;
    scheduleSync();
  }, true);

  const observer = new MutationObserver(scheduleSync);
  observer.observe(app, { childList: true, subtree: true });
  scheduleSync();
})();
