(() => {
  const STYLE_ID = 'english-feedback-transition-styles';
  const SCRAMBLE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

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

      #app[data-mode="english"] .question-content.english-wrong-transition .translation {
        animation-delay: .42s;
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

      #app[data-mode="english"] .english-letter-slot {
        display: inline-block;
        min-width: .56em;
        text-align: center;
        transform-origin: center;
      }

      #app[data-mode="english"] .english-letter-slot.is-cycling {
        animation: english-letter-cycle .11s ease both;
      }

      #app[data-mode="english"] .english-letter-slot.is-settled {
        animation: english-letter-settle .22s cubic-bezier(.2,.8,.25,1) both;
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

      @keyframes english-letter-cycle {
        0% { opacity: .68; transform: translateY(2px) scale(.96); filter: blur(.25px); }
        55% { opacity: 1; transform: translateY(-1px) scale(1.035); filter: blur(0); }
        100% { opacity: .88; transform: translateY(0) scale(1); filter: blur(0); }
      }

      @keyframes english-letter-settle {
        0% { opacity: .78; transform: translateY(2px) scale(.96); }
        70% { opacity: 1; transform: translateY(-1px) scale(1.035); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }

      @media (prefers-reduced-motion: reduce) {
        #app[data-mode="english"] .english-letter-in,
        #app[data-mode="english"] .english-letter-slot,
        #app[data-mode="english"] .question-content.english-feedback-transition .translation {
          animation: none !important;
        }
      }
    `;
    document.head.append(style);
  }

  const safe = character => character
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  function randomLetter(target = '') {
    let next = SCRAMBLE_ALPHABET[Math.floor(Math.random() * SCRAMBLE_ALPHABET.length)];
    if (next === target.toLowerCase()) {
      next = SCRAMBLE_ALPHABET[(SCRAMBLE_ALPHABET.indexOf(next) + 7) % SCRAMBLE_ALPHABET.length];
    }
    return next;
  }

  function animateCorrectEnglishFeedback(card, app) {
    // Zachowanie poprawnej odpowiedzi pozostaje bez zmian.
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
      return `<span class="english-letter-in ${side}" style="--letter-distance:${distance}" aria-hidden="true">${safe(character)}</span>`;
    }).join('');
  }

  async function animateWrongEnglishFeedback(card) {
    const word = card.querySelector('.question-text.english');
    const translation = card.querySelector('.translation');
    const content = word?.closest('.question-content');
    if (!word || !translation || !content || word.dataset.englishAnimated === 'true') return;

    content.classList.add('english-feedback-transition', 'english-wrong-transition');
    word.dataset.englishAnimated = 'true';

    const text = word.textContent || '';
    const characters = Array.from(text);
    word.setAttribute('aria-label', text);

    word.innerHTML = characters.map(character => {
      if (/\s/.test(character)) return '<span class="english-letter-space" aria-hidden="true"> </span>';
      return `<span class="english-letter-slot is-cycling" aria-hidden="true">${safe(randomLetter(character))}</span>`;
    }).join('');

    const slots = [...word.querySelectorAll('.english-letter-slot')];
    const targetLetters = characters.filter(character => !/\s/.test(character));

    // Kilka szybkich stanów pośrednich — efekt podobny do odliczania cyfr.
    for (let frame = 0; frame < 4; frame += 1) {
      slots.forEach((slot, index) => {
        slot.classList.remove('is-cycling');
        void slot.offsetWidth;
        slot.textContent = randomLetter(targetLetters[index]);
        slot.classList.add('is-cycling');
      });
      await wait(78);
    }

    // Poprawne litery dochodzą kolejno od środka na zewnątrz,
    // bez zmiany położenia całego słowa.
    const midpoint = (slots.length - 1) / 2;
    const order = slots
      .map((_, index) => index)
      .sort((a, b) => Math.abs(a - midpoint) - Math.abs(b - midpoint));

    for (const index of order) {
      const slot = slots[index];
      slot.classList.remove('is-cycling');
      slot.textContent = targetLetters[index];
      slot.classList.add('is-settled');
      await wait(28);
    }
  }

  function animateEnglishFeedback() {
    const app = document.querySelector('#app');
    if (!app || app.dataset.mode !== 'english' || app.dataset.view !== 'game') return;

    const correctCard = app.querySelector('.question-card.correct');
    if (correctCard) {
      animateCorrectEnglishFeedback(correctCard, app);
      return;
    }

    const wrongCard = app.querySelector('.question-card.wrong');
    if (wrongCard) animateWrongEnglishFeedback(wrongCard);
  }

  const observer = new MutationObserver(() => {
    requestAnimationFrame(animateEnglishFeedback);
  });

  const start = () => {
    const app = document.querySelector('#app');
    if (!app) return;
    observer.observe(app, { childList: true, subtree: true });
    animateEnglishFeedback();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
