(() => {
  const STYLE_ID = 'english-feedback-transition-styles';

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #app[data-mode="english"] .question-content.english-feedback-transition {
        position: relative;
      }

      #app[data-mode="english"] .question-content.english-feedback-transition .question-text.english {
        position: absolute;
        left: 50%;
        top: 50%;
        width: max-content;
        max-width: 100%;
        transform: translate(-50%, -50%);
        white-space: nowrap;
      }

      #app[data-mode="english"] .question-content.english-feedback-transition .translation {
        position: absolute;
        left: 50%;
        top: calc(50% + clamp(34px, 8vw, 42px));
        width: min(92%, 360px);
        transform: translateX(-50%);
        animation: english-translation-in .34s .12s ease both;
      }

      #app[data-mode="english"] .english-letter-in {
        display: inline-block;
        transform-origin: center;
        animation-duration: .44s;
        animation-timing-function: cubic-bezier(.2,.8,.25,1);
        animation-fill-mode: both;
        animation-delay: calc(var(--letter-distance, 0) * 18ms);
      }

      #app[data-mode="english"] .english-letter-in.from-right {
        animation-name: english-letter-from-right;
      }

      #app[data-mode="english"] .english-letter-in.from-left {
        animation-name: english-letter-from-left;
      }

      #app[data-mode="english"] .english-letter-space {
        display: inline-block;
        width: .28em;
      }

      @keyframes english-letter-from-right {
        from { opacity: 0; transform: translateX(.34em) scale(.92); }
        to { opacity: 1; transform: translateX(0) scale(1); }
      }

      @keyframes english-letter-from-left {
        from { opacity: 0; transform: translateX(-.34em) scale(.92); }
        to { opacity: 1; transform: translateX(0) scale(1); }
      }

      @keyframes english-translation-in {
        from { opacity: 0; transform: translate(-50%, 4px) scale(.98); }
        to { opacity: 1; transform: translate(-50%, 0) scale(1); }
      }

      @media (prefers-reduced-motion: reduce) {
        #app[data-mode="english"] .english-letter-in,
        #app[data-mode="english"] .question-content.english-feedback-transition .translation {
          animation: none !important;
        }
      }
    `;
    document.head.append(style);
  }

  function animateCorrectEnglishFeedback() {
    const app = document.querySelector('#app');
    if (!app || app.dataset.mode !== 'english' || app.dataset.view !== 'game') return;

    const card = app.querySelector('.question-card.correct');
    if (!card) return;

    // Poprawna odpowiedź przechodzi dalej automatycznie po czasie,
    // więc nie pokazujemy dodatkowego przycisku „Dalej”.
    app.querySelector('.feedback [data-action="next"]')?.remove();

    const word = card.querySelector('.question-text.english');
    const translation = card.querySelector('.translation');
    const content = word?.closest('.question-content');
    if (!word || !translation || !content || word.dataset.englishAnimated === 'true') return;

    content.classList.add('english-feedback-transition');
    word.dataset.englishAnimated = 'true';

    const text = word.textContent || '';
    const characters = Array.from(text);
    const midpoint = (characters.length - 1) / 2;
    word.setAttribute('aria-label', text);
    word.innerHTML = characters.map((character, index) => {
      if (/\s/.test(character)) return '<span class="english-letter-space" aria-hidden="true"> </span>';
      const side = index <= midpoint ? 'from-right' : 'from-left';
      const distance = Math.round(Math.abs(index - midpoint));
      const safeCharacter = character
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      return `<span class="english-letter-in ${side}" style="--letter-distance:${distance}" aria-hidden="true">${safeCharacter}</span>`;
    }).join('');
  }

  const observer = new MutationObserver(() => {
    requestAnimationFrame(animateCorrectEnglishFeedback);
  });

  const start = () => {
    const app = document.querySelector('#app');
    if (!app) return;
    observer.observe(app, { childList: true, subtree: true });
    animateCorrectEnglishFeedback();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
