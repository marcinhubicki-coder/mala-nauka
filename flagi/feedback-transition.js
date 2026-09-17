(() => {
  const STYLE_ID = 'flags-feedback-transition-styles';
  const SCRAMBLE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
  const CONTINENT_NAMES = Object.freeze({
    europe: { pl: 'Europa', en: 'Europe' },
    asia: { pl: 'Azja', en: 'Asia' },
    africa: { pl: 'Afryka', en: 'Africa' },
    'north-america': { pl: 'Ameryka Północna', en: 'North America' },
    'south-america': { pl: 'Ameryka Południowa', en: 'South America' },
    oceania: { pl: 'Oceania', en: 'Oceania' }
  });
  const CAPITAL_PL = Object.freeze({
    pl:'Warszawa', cz:'Praga', ru:'Moskwa', ua:'Kijów', ro:'Bukareszt', at:'Wiedeń', dk:'Kopenhaga',
    rs:'Belgrad', it:'Rzym', fr:'Paryż', ch:'Berno', be:'Bruksela', gr:'Ateny', gb:'Londyn', pt:'Lizbona',
    ge:'Tbilisi', am:'Erywań', az:'Baku', tr:'Ankara', eg:'Kair', cn:'Pekin', jp:'Tokio', kr:'Seul',
    kp:'Pjongjang', in:'Nowe Delhi', mn:'Ułan Bator', sy:'Damaszek', il:'Jerozolima', sa:'Rijad', ir:'Teheran',
    iq:'Bagdad', us:'Waszyngton', mx:'Meksyk', cu:'Hawana'
  });

  document.getElementById(STYLE_ID)?.remove();
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #app[data-mode="flags"] .question-card:is(.correct,.wrong) .question-content {
      position: relative;
    }

    /* Stage 1: the flag stays exactly where it was before the answer. */
    #app[data-mode="flags"] .question-card:is(.correct,.wrong):not(.map-feedback-prep) .question-content .flag {
      position: static;
      transform: none;
      margin: 0;
    }

    #app[data-mode="flags"] .question-card:is(.correct,.wrong):not(.map-feedback-prep) .flag-name {
      position: absolute;
      left: 50%;
      top: calc(50% + clamp(78px, 20vw, 86px));
      width: min(92%, 360px);
      transform: translateX(-50%);
      margin: 0;
      white-space: normal;
      line-height: 1.08;
      z-index: 3;
    }

    #app[data-mode="flags"] .question-card.wrong .badges {
      transition: opacity .24s ease, transform .34s ease;
    }

    /* Freeze the exact stage-1 geometry before flying to the map layout. */
    #app[data-mode="flags"] .question-card.wrong.map-feedback-prep .question-content {
      position: static;
    }

    #app[data-mode="flags"] .question-card.wrong.map-feedback-prep .question-content .flag {
      position: absolute;
      left: var(--flag-start-left);
      top: var(--flag-start-top);
      width: var(--flag-start-width);
      height: var(--flag-start-height);
      max-width: none;
      max-height: none;
      margin: 0;
      transform: none;
      transform-origin: top left;
      object-fit: contain;
      transition:
        left .56s cubic-bezier(.2,.8,.25,1),
        top .56s cubic-bezier(.2,.8,.25,1),
        width .56s cubic-bezier(.2,.8,.25,1),
        height .56s cubic-bezier(.2,.8,.25,1),
        filter .38s ease;
      z-index: 4;
    }

    #app[data-mode="flags"] .question-card.wrong.map-feedback-prep .flag-name {
      position: absolute;
      left: var(--name-start-left);
      top: var(--name-start-top);
      width: var(--name-start-width);
      transform: none;
      margin: 0;
      white-space: nowrap;
      overflow: visible;
      line-height: 1.02;
      text-align: left;
      font-size: 25px;
      transition:
        left .52s cubic-bezier(.2,.8,.25,1),
        top .52s cubic-bezier(.2,.8,.25,1),
        width .52s cubic-bezier(.2,.8,.25,1),
        font-size .46s cubic-bezier(.2,.8,.25,1);
      z-index: 4;
    }

    #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 .badges {
      opacity: 0;
      transform: translateY(-5px);
      pointer-events: none;
    }

    #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 .question-content .flag {
      left: calc(100% - 90px);
      top: 17px;
      width: 72px;
      height: 48px;
      filter: drop-shadow(0 5px 8px rgba(32,55,91,.12));
    }

    #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 .flag-name {
      left: 18px;
      top: 17px;
      width: calc(100% - 122px);
      font-size: var(--flag-map-name-size, 23px);
    }

    #app[data-mode="flags"] .flag-map-capital {
      position: absolute;
      left: 18px;
      top: 47px;
      width: calc(100% - 122px);
      margin: 0;
      color: #74839a;
      font-size: var(--flag-map-capital-size, 11px);
      line-height: 1.1;
      font-weight: 650;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity .28s ease .25s, transform .38s ease .22s;
      z-index: 4;
    }

    #app[data-mode="flags"] .flag-map-capital strong {
      color: #566a86;
      font-weight: 800;
    }

    #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 .flag-map-capital {
      opacity: 1;
      transform: translateY(0);
    }

    #app[data-mode="flags"] .flag-card-map {
      position: absolute;
      left: 4px;
      right: 4px;
      top: 74px;
      bottom: 8px;
      width: auto;
      min-height: 0;
      margin: 0;
      opacity: 0;
      transform: translateY(12px) scale(.965);
      pointer-events: none;
      transition:
        opacity .34s ease .18s,
        transform .5s cubic-bezier(.2,.8,.25,1) .12s;
      z-index: 2;
    }

    #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 .flag-card-map {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 + .flag-continent-label + .prompt,
    #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 + .flag-continent-label + .prompt + .answers,
    #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 + .prompt,
    #app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2 + .prompt + .answers {
      display: none;
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
    #app[data-mode="flags"] .flag-letter-slot.is-cycling { animation: flag-letter-cycle .13s ease both; }
    #app[data-mode="flags"] .flag-letter-slot.is-settled { animation: flag-letter-settle .24s cubic-bezier(.2,.8,.25,1) both; }
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
      0% { opacity: .58; transform: translateY(3px) scale(.94); filter: blur(.4px); }
      55% { opacity: 1; transform: translateY(-1px) scale(1.045); filter: blur(0); }
      100% { opacity: .88; transform: translateY(0) scale(1); filter: blur(0); }
    }
    @keyframes flag-letter-settle {
      0% { opacity: .76; transform: translateY(2px) scale(.95); }
      70% { opacity: 1; transform: translateY(-1px) scale(1.04); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    @media (prefers-reduced-motion: reduce) {
      #app[data-mode="flags"] .flag-letter-in,
      #app[data-mode="flags"] .flag-letter-slot,
      #app[data-mode="flags"] .question-card.wrong.map-feedback-prep .question-content .flag,
      #app[data-mode="flags"] .question-card.wrong.map-feedback-prep .flag-name,
      #app[data-mode="flags"] .flag-map-capital,
      #app[data-mode="flags"] .flag-card-map {
        animation: none !important;
        transition: none !important;
      }
    }
  `;
  document.head.append(style);

  const safe = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

  function randomLetter(target = '') {
    let next = SCRAMBLE_ALPHABET[Math.floor(Math.random() * SCRAMBLE_ALPHABET.length)];
    if (next === target.toLowerCase()) next = SCRAMBLE_ALPHABET[(SCRAMBLE_ALPHABET.indexOf(next) + 7) % SCRAMBLE_ALPHABET.length];
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

  function displayCapital(record, language) {
    if (!record) return '';
    if (language === 'pl') return CAPITAL_PL[record.id] || record.capital || '';
    return record.capital || '';
  }

  function mapNameSize(name) {
    const length = Array.from(String(name || '')).length;
    return length > 29 ? 15 : length > 23 ? 17 : length > 17 ? 19 : length > 12 ? 21 : 23;
  }

  function capitalSize(capital) {
    const length = Array.from(String(capital || '')).length;
    return length > 26 ? 9 : length > 20 ? 10 : 11;
  }

  function ensureMapMeta(card, record) {
    if (!record) return { continentLabel: null, capital: null };
    const languageApi = window.MalaNaukaFlagLanguage;
    const lang = languageApi?.language === 'en' ? 'en' : 'pl';
    const countryName = languageApi?.nameForId(record.id) || record.country || '';
    const capitalText = displayCapital(record, lang);
    card.style.setProperty('--flag-map-name-size', `${mapNameSize(countryName)}px`);
    card.style.setProperty('--flag-map-capital-size', `${capitalSize(capitalText)}px`);

    let capital = card.querySelector('.flag-map-capital');
    if (!capital) {
      capital = document.createElement('p');
      capital.className = 'flag-map-capital';
      card.querySelector('.question-content')?.append(capital);
    }
    const capitalLabel = lang === 'en' ? 'Capital' : 'Stolica';
    capital.innerHTML = `${capitalLabel}: <strong>${safe(capitalText)}</strong>`;

    const app = card.closest('#app');
    let continentLabel = app?.querySelector('.flag-continent-label');
    if (!continentLabel && app) {
      continentLabel = document.createElement('div');
      continentLabel.className = 'flag-continent-label';
      continentLabel.hidden = true;
      card.after(continentLabel);
    }
    if (continentLabel) {
      continentLabel.dataset.continent = record.continent;
      continentLabel.textContent = CONTINENT_NAMES[record.continent]?.[lang] || record.continent;
    }
    return { continentLabel, capital };
  }

  function freezeStageOne(card) {
    const flag = card.querySelector('.flag');
    const name = card.querySelector('.flag-name');
    if (!flag || !name) return false;
    const cardRect = card.getBoundingClientRect();
    const flagRect = flag.getBoundingClientRect();
    const nameRect = name.getBoundingClientRect();
    card.style.setProperty('--flag-start-left', `${flagRect.left - cardRect.left}px`);
    card.style.setProperty('--flag-start-top', `${flagRect.top - cardRect.top}px`);
    card.style.setProperty('--flag-start-width', `${flagRect.width}px`);
    card.style.setProperty('--flag-start-height', `${flagRect.height}px`);
    card.style.setProperty('--name-start-left', `${nameRect.left - cardRect.left}px`);
    card.style.setProperty('--name-start-top', `${nameRect.top - cardRect.top}px`);
    card.style.setProperty('--name-start-width', `${nameRect.width}px`);
    card.classList.add('map-feedback-prep');
    return true;
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
    if (!flagRecord || !map.supports(countryId, continent)) return;

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

    const { continentLabel } = ensureMapMeta(card, flagRecord);
    if (!freezeStageOne(card)) return;
    await nextFrame();
    await nextFrame();
    if (!card.isConnected || feedbackKey(card) !== key) return;
    card.classList.add('map-feedback-stage-2');
    if (continentLabel) continentLabel.hidden = false;
  }

  function animateCorrectFlagFeedback(card, app) {
    const key = feedbackKey(card);
    if (card.dataset.flagAnimatedKey === key) return;
    card.dataset.flagAnimatedKey = key;
    app.querySelector('.feedback [data-action="next"]')?.remove();

    const name = card.querySelector('.flag-name');
    if (!name) return;
    prepareLocalizedName(card);
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
    const key = feedbackKey(card);
    if (card.dataset.flagAnimatedKey === key) return;
    card.dataset.flagAnimatedKey = key;

    const name = card.querySelector('.flag-name');
    if (!name) return;
    prepareLocalizedName(card);
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

    for (let frame = 0; frame < 5; frame += 1) {
      if (!card.isConnected || feedbackKey(card) !== key) return;
      slots.forEach((slot, index) => {
        slot.classList.remove('is-cycling');
        void slot.offsetWidth;
        slot.textContent = randomLetter(targetLetters[index]);
        slot.classList.add('is-cycling');
      });
      await wait(82);
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
      await wait(30);
    }

    await wait(360);
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

  function refreshVisibleMeta() {
    const card = document.querySelector('#app[data-mode="flags"] .question-card.wrong.map-feedback-stage-2');
    if (!card) return;
    const record = window.MalaNaukaFlagLanguage?.recordForId?.(countryIdFromCard(card));
    if (!record) return;
    const { continentLabel } = ensureMapMeta(card, record);
    if (continentLabel) continentLabel.hidden = false;
  }

  const observer = new MutationObserver(() => requestAnimationFrame(animateFlagFeedback));
  const start = () => {
    const app = document.querySelector('#app');
    if (!app) return;
    observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    animateFlagFeedback();
  };

  document.addEventListener('mala-nauka:flag-language-change', () => requestAnimationFrame(refreshVisibleMeta));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
