(() => {
  const STYLE_ID = 'flags-feedback-transition-styles';
  const SCRAMBLE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #app[data-mode="flags"] .question-card:is(.correct,.wrong) .question-content {
        position: static;
      }

      #app[data-mode="flags"] .question-card:is(.correct,.wrong) .question-content .flag {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) scale(1);
        transform-origin: center;
        margin: 0;
        transition:
          left .52s cubic-bezier(.2,.8,.25,1),
          top .52s cubic-bezier(.2,.8,.25,1),
          transform .52s cubic-bezier(.2,.8,.25,1),
          filter .35s ease;
        z-index: 3;
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
        transition:
          left .48s cubic-bezier(.2,.8,.25,1),
          top .48s cubic-bezier(.2,.8,.25,1),
          width .48s cubic-bezier(.2,.8,.25,1),
          transform .48s cubic-bezier(.2,.8,.25,1),
          font-size .36s ease,
          text-align .01s linear;
        z-index: 3;
      }

      #app[data-mode="flags"] .question-card.wrong {
        transition:
          min-height .55s cubic-bezier(.2,.8,.25,1),
          background .15s,
          border-color .15s;
      }

      #app[data-mode="flags"] .question-card.wrong .badges {
        transition: opacity .24s ease, transform .34s ease;
      }

      #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 {
        min-height: clamp(500px, 62dvh, 620px);
      }

      #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 .badges {
        opacity: 0;
        transform: translateY(-5px);
        pointer-events: none;
      }

      #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 .question-content .flag {
        left: calc(100% - 16px);
        top: 16px;
        transform: translate(-100%, 0) scale(.38);
        transform-origin: top right;
        filter: drop-shadow(0 5px 8px rgba(32,55,91,.12));
      }

      #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 .flag-name {
        left: 18px;
        top: 22px;
        width: calc(100% - 138px);
        transform: none;
        text-align: left;
        font-size: clamp(20px, 6vw, 25px);
      }

      #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 .question-content {
        justify-content: flex-start;
        padding-top: 72px;
        padding-bottom: 14px;
        min-height: inherit;
      }

      #app[data-mode="flags"] .flag-card-map {
        width: min(100%, 540px);
        min-height: 0;
        margin: 8px auto 0;
        opacity: 0;
        transform: translateY(13px) scale(.965);
        transition:
          opacity .34s ease .12s,
          transform .5s cubic-bezier(.2,.8,.25,1) .08s;
      }

      #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 .flag-card-map {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      #app[data-mode="flags"] .flag-card-map .continent-map-host {
        min-height: clamp(330px, 43dvh, 430px);
        grid-template-rows: 1fr;
        gap: 0;
      }

      #app[data-mode="flags"] .flag-card-map .continent-map-copy {
        display: none;
      }

      #app[data-mode="flags"] .flag-card-map .continent-map-canvas {
        width: min(100%, 520px);
      }

      #app[data-mode="flags"] .flag-card-map .continent-map-canvas svg {
        height: clamp(330px, 43dvh, 430px);
      }

      #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 + .prompt,
      #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 + .prompt + .answers {
        display: none;
      }

      #app[data-mode="flags"]:has(.question-card.wrong.map-feedback-stage-2) .feedback {
        margin-top: 20px;
      }

      #app[data-mode="flags"] .flag-letter-in {
        display: inline-block;
        transform-origin: center;
        animation-duration: .44s;
        animation-timing-function: cubic-bezier(.2,.8,.25,1);
        animation-fill-mode: both;
        animation-delay: calc(var(--letter-distance, 0) * 18ms);
      }

      #app[data-mode="flags"] .flag-letter-in.from-right { animation-name: flag-letter-from-right; }
      #app[data-mode="flags"] .flag-letter-in.from-left { animation-name: flag-letter-from-left; }
      #app[data-mode="flags"] .flag-letter-slot {
        display: inline-block;
        min-width: .56em;
        text-align: center;
        transform-origin: center;
      }
      #app[data-mode="flags"] .flag-letter-slot.is-cycling { animation: flag-letter-cycle .11s ease both; }
      #app[data-mode="flags"] .flag-letter-slot.is-settled { animation: flag-letter-settle .22s cubic-bezier(.2,.8,.25,1) both; }
      #app[data-mode="flags"] .flag-letter-space { display: inline-block; width: .28em; }

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

      @media (max-height: 760px) {
        #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 {
          min-height: 455px;
        }
        #app[data-mode="flags"] .flag-card-map .continent-map-host,
        #app[data-mode="flags"] .flag-card-map .continent-map-canvas svg {
          min-height: 0;
          height: 300px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #app[data-mode="flags"] .flag-letter-in,
        #app[data-mode="flags"] .flag-letter-slot,
        #app[data-mode="flags"] .question-card.wrong,
        #app[data-mode="flags"] .question-card:is(.correct,.wrong) .question-content .flag,
        #app[data-mode="flags"] .question-card:is(.correct,.wrong) .flag-name,
        #app[data-mode="flags"] .flag-card-map {
          animation: none !important;
          transition: none !important;
        }
      }
    `;
    document.head.append(style);
  }

  const safe = character => character
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  function randomLetter(target = '') {
    let next = SCRAMBLE_ALPHABET[Math.floor(Math.random() * SCRAMBLE_ALPHABET.length)];
    if (next === target.toLowerCase()) {
      next = SCRAMBLE_ALPHABET[(SCRAMBLE_ALPHABET.indexOf(next) + 7) % SCRAMBLE_ALPHABET.length];
    }
    return next;
  }

  function countryIdFromCard(card) {
    const source = card.querySelector('.flag')?.getAttribute('src') || '';
    return source.match(/\/([a-z]{2})\.svg(?:[?#].*)?$/i)?.[1]?.toLowerCase() || '';
  }

  function feedbackKey(card) {
    return `${countryIdFromCard(card)}|${card.classList.contains('wrong') ? 'wrong' : 'correct'}`;
  }

  function prepareLocalizedName(card) {
    const language = window.MalaNaukaFlagLanguage;
    return language?.localizeFeedbackName(card, true)
      || card.querySelector('.flag-name')?.textContent
      || '';
  }

  async function showWrongMap(card, key = feedbackKey(card)) {
    const map = window.MalaNaukaContinentMap || window.MalaNaukaEuropeMap;
    const content = card.querySelector('.question-content');
    if (!map || !content || card.dataset.flagMapKey === key) return;

    const countryId = countryIdFromCard(card);
    const language = window.MalaNaukaFlagLanguage;
    const flagRecord = language?.recordForId?.(countryId);
    const continent = flagRecord?.continent || '';
    const continentIds = language?.recordsForContinent?.(continent)?.map(flag => flag.id) || [];
    if (!map.supports(countryId, continent)) return;

    const countryName = language?.nameForId(countryId)
      || card.querySelector('.flag-name')?.getAttribute('aria-label')
      || card.querySelector('.flag-name')?.textContent
      || '';

    card.dataset.flagMapKey = key;
    card.querySelector('.flag-card-map')?.remove();
    const holder = document.createElement('div');
    holder.className = 'flag-card-map';
    holder.innerHTML = '<div data-flag-map></div>';
    content.append(holder);

    const result = await map.mount(holder.querySelector('[data-flag-map]'), {
      countryId,
      countryName,
      continent,
      continentIds,
      language: language?.language || 'pl',
      showCopy: false
    });

    if (!card.isConnected || feedbackKey(card) !== key) return;
    if (!result.found) {
      holder.remove();
      delete card.dataset.flagMapKey;
      return;
    }

    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (card.isConnected && feedbackKey(card) === key) card.classList.add('map-feedback-stage-2');
  }

  function animateCorrectFlagFeedback(card, app) {
    const key = feedbackKey(card);
    if (card.dataset.flagAnimatedKey === key) return;
    card.dataset.flagAnimatedKey = key;
    app.querySelector('.feedback [data-action="next"]')?.remove();

    const name = card.querySelector('.flag-name');
    if (!name) return;
    prepareLocalizedName(card);

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
    const key = feedbackKey(card);
    if (card.dataset.flagAnimatedKey === key) return;
    card.dataset.flagAnimatedKey = key;

    const name = card.querySelector('.flag-name');
    if (!name) return;
    prepareLocalizedName(card);

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
      if (!card.isConnected || feedbackKey(card) !== key) return;
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
      if (!card.isConnected || feedbackKey(card) !== key) return;
      const slot = slots[index];
      slot.classList.remove('is-cycling');
      slot.textContent = targetLetters[index];
      slot.classList.add('is-settled');
      await wait(28);
    }

    await wait(260);
    if (card.isConnected && feedbackKey(card) === key) showWrongMap(card, key);
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

  const observer = new MutationObserver(() => requestAnimationFrame(animateFlagFeedback));

  const start = () => {
    const app = document.querySelector('#app');
    if (!app) return;
    observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    animateFlagFeedback();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
