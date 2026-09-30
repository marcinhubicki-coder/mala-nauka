(() => {
  function initScoreBadge() {
    let correctCount = 0;
    let lastRenderedCount = 0;
    let hasRevealed = false;
    let syncQueued = false;
    let persistentCard = null;
    let needsRebuildOnReturn = false;

    const symbols = {
      add: '+',
      subtract: '−',
      multiply: '×',
      divide: '÷',
    };

    const app = document.querySelector('#app');
    if (!app) return;

    function restartClass(node, className, timeout = 840) {
      if (!node) return;
      node.classList.remove(className);
      void node.offsetWidth;
      node.classList.add(className);
      window.setTimeout(() => node.classList.remove(className), timeout);
    }

    function ensureModeCard(label, stage) {
      let card = label.querySelector(':scope > .mode-icon-card');
      let created = false;
      let reattached = false;

      if (!card && persistentCard) {
        card = persistentCard;
        reattached = true;
        if (card.parentNode !== label) label.appendChild(card);
      }

      if (!card) {
        created = true;
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

      persistentCard = card;

      const symbol = card.querySelector('.mode-icon-symbol');
      const badge = card.querySelector('.mode-score-badge');
      const value = card.querySelector('.mode-score-value');
      const nextSymbol = symbols[stage?.dataset.operation] || '';
      if (symbol && symbol.textContent !== nextSymbol) symbol.textContent = nextSymbol;
      return { badge, value, created, reattached };
    }

    function setScaleVars(badge, previous, current) {
      const previousDecade = Math.floor(Math.max(0, previous) / 10);
      const currentDecade = Math.floor(Math.max(0, current) / 10);
      const previousScale = 1 + (previousDecade * 0.03);
      const restScale = 1 + (currentDecade * 0.03);
      const bumpPeak = restScale + 0.12;
      const chargePeak = restScale + 0.10;
      const settleDip = Math.max(1, restScale - 0.015);

      badge.style.setProperty('--score-previous-scale', previousScale.toFixed(3));
      badge.style.setProperty('--score-rest-scale', restScale.toFixed(3));
      badge.style.setProperty('--score-bump-peak', bumpPeak.toFixed(3));
      badge.style.setProperty('--score-charge-peak', chargePeak.toFixed(3));
      badge.style.setProperty('--score-settle-dip', settleDip.toFixed(3));

      return { previousDecade, currentDecade };
    }

    function syncBadge({ animateChange = false } = {}) {
      const label = app.querySelector('.quiz-stage:not(.has-explainer) .question-label');
      const stage = label?.closest('.quiz-stage');

      if (!label || !stage) {
        if (correctCount > 0 && hasRevealed) needsRebuildOnReturn = true;
        return;
      }

      const { badge, value, reattached } = ensureModeCard(label, stage);
      if (!badge || !value) return;

      const previous = lastRenderedCount;
      const changed = correctCount !== previous;
      const { previousDecade, currentDecade } = setScaleVars(badge, previous, correctCount);
      const crossedDecade = currentDecade > previousDecade && currentDecade > 0;
      const nextValue = String(correctCount);
      if (value.textContent !== nextValue) value.textContent = nextValue;

      badge.classList.toggle('is-visible', correctCount > 0);
      badge.classList.toggle('is-wide', correctCount >= 10);
      badge.classList.toggle('is-hundred', correctCount >= 100);

      if (correctCount > 0 && !hasRevealed) {
        hasRevealed = true;
        restartClass(badge, 'is-entering');
      } else if (reattached && needsRebuildOnReturn && correctCount > 0) {
        needsRebuildOnReturn = false;
        restartClass(badge, 'is-rebuilding');
      } else if (animateChange && changed && correctCount > 0) {
        value.classList.remove('is-counting');
        badge.classList.remove('is-bump', 'is-growing');
        void badge.offsetWidth;

        if (crossedDecade) {
          badge.classList.add('is-growing');
        } else {
          badge.classList.add('is-bump');
        }
        value.classList.add('is-counting');

        window.setTimeout(() => {
          badge.classList.remove('is-bump', 'is-growing');
          value.classList.remove('is-counting');
        }, crossedDecade ? 1160 : 620);
      }

      lastRenderedCount = correctCount;
    }

    function scheduleSync() {
      if (syncQueued) return;
      syncQueued = true;
      queueMicrotask(() => {
        syncQueued = false;
        syncBadge();
      });
    }

    function resetScore() {
      correctCount = 0;
      lastRenderedCount = 0;
      hasRevealed = false;
      needsRebuildOnReturn = false;
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
      syncBadge({ animateChange: correctCount > 1 });
    }, true);

    const observer = new MutationObserver(scheduleSync);
    observer.observe(app, { childList: true, subtree: true });
    scheduleSync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScoreBadge, { once: true });
  } else {
    initScoreBadge();
  }
})();
