(() => {
  const STYLE_ID = 'flags-feedback-transition-styles';
  const SCRAMBLE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #app[data-mode="flags"] .question-card:is(.correct,.wrong) .question-content {
        position: relative;
      }

      #app[data-mode="flags"] .question-card:is(.correct,.wrong) .question-content .flag {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        margin: 0;
      }

      #app[data-mode="flags"] .question-card:is(.correct,.wrong) .flag-name {
        position: absolute;
        left: 50%;
        top: calc(50% + clamp(78px, 20vw, 86px));
        width: min(92%, 360px);
        transform: translateX(-50%);
        margin: 0;
        white-space: normal;
        line-height: 1.08;
      }

      #app[data-mode="flags"] .flag-letter-in {
        display: inline-block;
        transform-origin: center;
        animation-duration: .44s;
        animation-timing-function: cubic-bezier(.2,.8,.25,1);
        animation-fill-mode: both;
        animation-delay: calc(var(--letter-distance, 0) * 18ms);
      }

      #app[data-mode="flags"] .flag-letter-in.from-right {
        animation-name: flag-letter-from-right;
      }

      #app[data-mode="flags"] .flag-letter-in.from-left {
        animation-name: flag-letter-from-left;
      }

      #app[data-mode="flags"] .flag-letter-slot {
        display: inline-block;
        min-width: .56em;
        text-align: center;
        transform-origin: center;
      }

      #app[data-mode="flags"] .flag-letter-slot.is-cycling {
        animation: flag-letter-cycle .11s ease both;
      }

      #app[data-mode="flags"] .flag-letter-slot.is-settled {
        animation: flag-letter-settle .22s cubic-bezier(.2,.8,.25,1) both;
      }

      #app[data-mode="flags"] .flag-letter-space {
        display: inline-block;
        width: .28em;
      }

      @keyframes flag-letter-from-right {
        from { opacity: 0; transform: translateX(.34em) scale(.92); }
        to { opacity: 1; transform: translateX(0) scale(1); }
      }

      @keyframes flag-letter-from-left {
        from { opacity: 0; transform: translateX(-.34em) scale(.92); }
        to { opacity: 1; transform: translateX(0) scale(1); }
      }

      @keyframes flag-letter-cycle {
        0% { opacity: .68; transform: translateY(2px) scale(.96); filter: blur(.25px); }
        55% { opacity: 1; transform: translateY(-1px) scale(1.035); filter: blur(0); }
        100% { opacity: .88; transform: translateY(0) scale(1); filter: blur(0); }
      }

      @keyframes flag-letter-settle {
        0% { opacity: .78; transform: translateY(2px) scale(.96); }
        70% { opacity: 1; transform: translateY(-1px) scale(1.035); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }

      @media (prefers-reduced-motion: reduce) {
        #app[data-mode="flags"] .flag-letter-in,
        #app[data-mode="flags"] .flag-letter-slot {
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

  function animateCorrectFlagFeedback(card, app) {
    app.querySelector('.feedback [data-action="next"]')?.remove();

    const name = card.querySelector('.flag-name');
    if (!name || name.dataset.flagAnimated === 'true') return;
    name.dataset.flagAnimated = 'true';

    const text = name.textContent || '';
    const characters = Array.from(text);
    const midpoint = (characters.length - 1) / 2;
    name.setAttribute('aria-label', text);
    name.innerHTML = characters.map((character, index) => {
      if (/\s/.test(character)) return '<span class="flag-letter-space" aria-hidden="true"> </span>';
      const side = index <= midpoint ? 'from-right' : 'from-left';
      const distance = Math.round(Math.abs(index - midpoint));
      return `<span class="flag-letter-in ${side}" style="--letter-distance:${distance}" aria-hidden="true">${safe(character)}</span>`;
    }).join('');
  }

  async function animateWrongFlagFeedback(card) {
    const name = card.querySelector('.flag-name');
    if (!name || name.dataset.flagAnimated === 'true') return;
    name.dataset.flagAnimated = 'true';

    const text = name.textContent || '';
    const characters = Array.from(text);
    name.setAttribute('aria-label', text);
    name.innerHTML = characters.map(character => {
      if (/\s/.test(character)) return '<span class="flag-letter-space" aria-hidden="true"> </span>';
      return `<span class="flag-letter-slot is-cycling" aria-hidden="true">${safe(randomLetter(character))}</span>`;
    }).join('');

    const slots = [...name.querySelectorAll('.flag-letter-slot')];
    const targetLetters = characters.filter(character => !/\s/.test(character));

    for (let frame = 0; frame < 4; frame += 1) {
      slots.forEach((slot, index) => {
        slot.classList.remove('is-cycling');
        void slot.offsetWidth;
        slot.textContent = randomLetter(targetLetters[index]);
        slot.classList.add('is-cycling');
      });
      await wait(78);
    }

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

  function animateFlagFeedback() {
    const app = document.querySelector('#app');
    if (!app || app.dataset.mode !== 'flags' || app.dataset.view !== 'game') return;

    const correctCard = app.querySelector('.question-card.correct');
    if (correctCard) {
      animateCorrectFlagFeedback(correctCard, app);
      return;
    }

    const wrongCard = app.querySelector('.question-card.wrong');
    if (wrongCard) animateWrongFlagFeedback(wrongCard);
  }

  const observer = new MutationObserver(() => {
    requestAnimationFrame(animateFlagFeedback);
  });

  const start = () => {
    const app = document.querySelector('#app');
    if (!app) return;
    observer.observe(app, { childList: true, subtree: true });
    animateFlagFeedback();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
