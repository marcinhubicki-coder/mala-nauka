import { FLAGS } from '../data/flags.mjs';

const STORAGE_KEY = 'malaNauka.v1.flagsLanguage';
const STYLE_ID = 'flags-language-toggle-styles';
const byId = new Map(FLAGS.map(flag => [flag.id, flag]));
const byPl = new Map(FLAGS.map(flag => [flag.country.toLocaleLowerCase('pl-PL'), flag]));
const byEn = new Map(FLAGS.map(flag => [flag.countryEn.toLocaleLowerCase('en-US'), flag]));
let language = readLanguage();

function readLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'pl';
  } catch {
    return 'pl';
  }
}

function saveLanguage() {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // The app can still work when local storage is unavailable.
  }
}

function countryIdFromCard(card) {
  const source = card?.querySelector('.flag')?.getAttribute('src') || '';
  return source.match(/\/([a-z]{2})\.svg(?:[?#].*)?$/i)?.[1]?.toLowerCase() || '';
}

function flagFromName(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  return byPl.get(normalized.toLocaleLowerCase('pl-PL'))
    || byEn.get(normalized.toLocaleLowerCase('en-US'))
    || null;
}

function nameForId(id, requestedLanguage = language) {
  const flag = byId.get(String(id || '').toLowerCase());
  if (!flag) return '';
  return requestedLanguage === 'en' ? flag.countryEn : flag.country;
}

function nameFromAny(value, requestedLanguage = language) {
  const flag = flagFromName(value);
  if (!flag) return String(value || '');
  return requestedLanguage === 'en' ? flag.countryEn : flag.country;
}

function localizeFeedbackName(card, force = false) {
  const name = card?.querySelector('.flag-name');
  if (!name) return '';
  if (!force && name.dataset.flagAnimated === 'true') return name.getAttribute('aria-label') || name.textContent || '';

  const id = countryIdFromCard(card);
  const localized = nameForId(id) || nameFromAny(name.getAttribute('aria-label') || name.textContent || '');
  if (!localized) return '';

  if (name.textContent !== localized) name.textContent = localized;
  if (name.getAttribute('aria-label') !== localized) name.setAttribute('aria-label', localized);
  return localized;
}

function localizeAnswers(root) {
  root.querySelectorAll('.answers .answer').forEach(button => {
    const localized = nameFromAny(button.textContent);
    if (localized && button.textContent !== localized) button.textContent = localized;
    if (language === 'en') button.setAttribute('lang', 'en');
    else button.removeAttribute('lang');
  });
}

function localizeVisibleMap(root) {
  const card = root.querySelector('.question-card');
  if (!card) return;
  const id = countryIdFromCard(card);
  const name = nameForId(id);
  const copy = root.querySelector('.europe-map-copy strong');
  if (copy && name && copy.textContent !== name) copy.textContent = name;
}

function ensureToggle(root) {
  if (root.dataset.mode !== 'flags') return;

  if (root.dataset.view === 'wizard') {
    const intro = root.querySelector('.wizard-intro');
    if (intro && !intro.querySelector('[data-flag-language]')) {
      intro.classList.add('has-flag-language');
      intro.insertAdjacentHTML('beforeend', '<div class="flag-language-slot"><button type="button" class="flag-language-toggle" data-flag-language aria-label="Zmień język nazw krajów"></button></div>');
    }
  }

  if (root.dataset.view === 'game') {
    const meta = root.querySelector('.game-meta');
    if (meta && !meta.querySelector('[data-flag-language]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'flag-language-toggle in-game';
      button.dataset.flagLanguage = '';
      button.setAttribute('aria-label', 'Zmień język nazw krajów');
      const score = meta.querySelector('strong');
      if (score) score.before(button);
      else meta.append(button);
    }
  }

  root.querySelectorAll('[data-flag-language]').forEach(button => {
    const code = language.toUpperCase();
    if (button.textContent !== code) button.textContent = code;
    button.setAttribute('aria-label', language === 'pl'
      ? 'Język nazw krajów: polski. Zmień na angielski.'
      : 'Język nazw krajów: angielski. Zmień na polski.');
    button.title = language === 'pl' ? 'Nazwy krajów: polski' : 'Country names: English';
  });
}

function refresh({ forceFeedback = false } = {}) {
  const root = document.querySelector('#app');
  if (!root || root.dataset.mode !== 'flags') return;
  ensureToggle(root);
  localizeAnswers(root);

  const card = root.querySelector('.question-card');
  if (card && (forceFeedback || !card.querySelector('.flag-name')?.dataset.flagAnimated)) {
    localizeFeedbackName(card, forceFeedback);
  }
  localizeVisibleMap(root);
}

function setLanguage(next) {
  language = next === 'en' ? 'en' : 'pl';
  saveLanguage();
  refresh({ forceFeedback: true });
  document.dispatchEvent(new CustomEvent('mala-nauka:flag-language-change', { detail: { language } }));
}

function toggleLanguage() {
  setLanguage(language === 'pl' ? 'en' : 'pl');
}

if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #app[data-mode="flags"] .wizard-intro.has-flag-language {
      position: relative;
      padding-right: 78px;
    }

    #app[data-mode="flags"] .flag-language-slot {
      position: absolute;
      right: 16px;
      top: 50%;
      translate: 0 -50%;
    }

    #app[data-mode="flags"] .flag-language-toggle {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      padding: 0;
      border: 1px solid rgba(172,105,37,.18);
      border-radius: 50%;
      background: rgba(255,255,255,.86);
      color: #8c5b2b;
      box-shadow: 0 5px 16px rgba(85,58,31,.09);
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .4px;
      line-height: 1;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    #app[data-mode="flags"] .flag-language-toggle.in-game {
      width: 34px;
      height: 34px;
      flex: 0 0 34px;
      font-size: 10px;
      box-shadow: none;
      background: #fffaf2;
    }

    #app[data-mode="flags"] .flag-language-toggle:active {
      scale: .96;
    }

    @media (prefers-reduced-motion: reduce) {
      #app[data-mode="flags"] .flag-language-toggle {
        transition: none !important;
      }
    }
  `;
  document.head.append(style);
}

document.addEventListener('click', event => {
  const button = event.target.closest?.('[data-flag-language]');
  if (!button) return;
  event.preventDefault();
  toggleLanguage();
});

const observer = new MutationObserver(() => queueMicrotask(() => refresh()));
const start = () => {
  const root = document.querySelector('#app');
  if (!root) return;
  observer.observe(root, { childList: true, subtree: true });
  refresh();
};

window.MalaNaukaFlagLanguage = Object.freeze({
  get language() { return language; },
  nameForId,
  nameFromAny,
  localizeFeedbackName,
  refresh,
  setLanguage
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
