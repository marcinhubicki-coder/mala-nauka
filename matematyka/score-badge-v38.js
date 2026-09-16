(() => {
  function initScoreBadge() {
    let correctCount = 0;
    let lastRenderedCount = 0;
    let hasRevealed = false;
    let syncing = false;

    const symbols = {
      add: '+',
      subtract: '−',
      multiply: '×',
      divide: '÷',
    };

    const app = document.querySelector('#app');
    if (!app) return;

    function ensureModeCard(label, stage) {
      let card = label.querySelector(':scope > .mode-icon-card');
      const created = !card;

      if (!card) {
        card = document.createElement('span');
        card.className = 'mode-icon-card';
        card.setAttribute('aria-hidden', 'true');

        const symbol = document.createElement('span');
        symbol.className = 'mode-icon-symbol';

        const badge = document.createElement('span');
        badge.className = 'mode-score-badge';
        badge.setAttribute('aria-label', 'Poprawne odpowiedzi');
        badge.setAttribute('aria-live', 'polite');

        const value = document.createElement('span');
        value.className = 'mode-score-value';
        badge.appendChild(value);

        card.append(symbol, badge);
        label.appendChild(card);
      }

      const symbol = card.querySelector('.mode-icon-symbol');
      const badge = card.querySelector('.mode-score-badge');
      const value = card.querySelector('.mode-score-value');
      if (symbol) symbol.textContent = symbols[stage?.dataset.operation] || '';
      return { badge, value, created };
    }

    function syncBadge({ animateChange = false } = {}) {
      if (syncing) return;
      const label = app.querySelector('.quiz-stage:not(.has-explainer) .question-label');
      const stage = label?.closest('.quiz-stage');
      if (!label || !stage) return;

      syncing = true;
      try {
        const { badge, value, created } = ensureModeCard(label, stage);
        if (!badge || !value) return;

        const changed = correctCount !== lastRenderedCount;
        value.textContent = String(correctCount);
        badge.classList.toggle('is-visible', correctCount > 0);
        badge.classList.toggle('is-wide', correctCount >= 10);
        badge.classList.toggle('is-hundred', correctCount >= 100);

        if (created && correctCount > 0 && hasRevealed) {
          badge.classList.add('is-restored');
          requestAnimationFrame(() => badge.classList.remove('is-restored'));
        }

        if (correctCount > 0 && !hasRevealed) {
          hasRevealed = true;
        } else if (animateChange && changed && correctCount > 0) {
          badge.classList.remove('is-bump');
          value.classList.remove('is-counting');
          void badge.offsetWidth;
          badge.classList.add('is-bump');
          value.classList.add('is-counting');
          window.setTimeout(() => {
            badge.classList.remove('is-bump');
            value.classList.remove('is-counting');
          }, 360);
        }

        lastRenderedCount = correctCount;
      } finally {
        syncing = false;
      }
    }

    function resetScore() {
      correctCount = 0;
      lastRenderedCount = 0;
      hasRevealed = false;
      syncBadge();
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
      syncBadge({ animateChange: correctCount > 1 });
    }, true);

    const observer = new MutationObserver(() => syncBadge());
    observer.observe(app, { childList: true, subtree: true });
    syncBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScoreBadge, { once: true });
  } else {
    initScoreBadge();
  }
})();
