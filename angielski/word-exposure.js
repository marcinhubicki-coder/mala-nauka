import { ENGLISH } from '../data/english.mjs';

(() => {
  const STORAGE_KEY = 'malaNauka.v1.englishWordExposure.v1';
  const STYLE_ID = 'english-word-exposure-styles';
  let activeMarker = null;
  let activeWord = null;
  let activeCount = 0;

  function readStats() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function writeStats(stats) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Statystyka jest dodatkiem — gra ma działać także bez localStorage.
    }
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #app[data-mode="english"] .badges .english-seen-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 34px;
        min-height: 25px;
        padding: 4px 8px;
        border: 1px solid rgba(107, 121, 145, .10);
        background: rgba(255,255,255,.58);
        color: #71809a;
        font-size: 9px;
        font-weight: 850;
        letter-spacing: .02em;
        line-height: 1;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
      }

      #app[data-mode="english"] .badges .english-seen-badge.is-new {
        border-color: rgba(128,96,183,.12);
        background: linear-gradient(135deg, rgba(241,232,255,.96), rgba(255,244,222,.88));
        color: #7d5daf;
        letter-spacing: .055em;
      }

      #app[data-mode="english"] .badges .english-seen-badge.is-repeat {
        gap: 3px;
        background: rgba(241,244,248,.88);
        color: #708097;
      }

      #app[data-mode="english"] .badges .english-seen-badge .seen-loop {
        display: inline-block;
        color: #8466b7;
        font-size: 10px;
        line-height: 1;
        transform: translateY(-.2px);
      }

      @media (max-width: 360px) {
        #app[data-mode="english"] .badges .english-seen-badge {
          min-width: 31px;
          padding-left: 6px;
          padding-right: 6px;
          font-size: 8.5px;
        }
      }
    `;
    document.head.append(style);
  }

  function questionNumber(app) {
    const text = app.querySelector('.game-meta > span')?.textContent || '';
    const match = text.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  function currentRecord(card) {
    const main = card.querySelector('.question-text.english');
    if (!main) return null;

    const feedback = card.classList.contains('correct') || card.classList.contains('wrong');
    if (feedback) {
      const english = main.textContent.trim().toLowerCase();
      return ENGLISH.find(item => item.word.toLowerCase() === english) || null;
    }

    const meaning = main.textContent.trim();
    const options = new Set(
      [...document.querySelectorAll('#app[data-mode="english"] .answer')]
        .map(button => button.textContent.trim().toLowerCase())
    );
    const candidates = ENGLISH.filter(item => item.meaning === meaning);
    return candidates.find(item => options.has(item.word.toLowerCase())) || candidates[0] || null;
  }

  function ensureBadge(badges, count) {
    if (!badges || !count) return;
    let badge = badges.querySelector('.english-seen-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'badge english-seen-badge';
      badges.append(badge);
    }

    const isNew = count === 1;
    badge.classList.toggle('is-new', isNew);
    badge.classList.toggle('is-repeat', !isNew);
    badge.setAttribute(
      'aria-label',
      isNew ? 'Nowe słowo. Pojawia się pierwszy raz.' : `To słowo pojawiło się ${count} razy.`
    );
    badge.innerHTML = isNew
      ? 'NEW'
      : `<span class="seen-loop" aria-hidden="true">↻</span><span>${count}×</span>`;
  }

  function update() {
    const app = document.querySelector('#app');
    if (!app || app.dataset.mode !== 'english' || app.dataset.view !== 'game') {
      activeMarker = null;
      activeWord = null;
      activeCount = 0;
      return;
    }

    const card = app.querySelector('.question-card');
    const badges = card?.querySelector('.badges');
    if (!card || !badges) return;

    const record = currentRecord(card);
    if (!record) return;

    const number = questionNumber(app);
    const marker = `${number}:${record.word}`;
    const feedback = card.classList.contains('correct') || card.classList.contains('wrong');
    const stats = readStats();

    if (!feedback && marker !== activeMarker) {
      const nextCount = Math.max(0, Number(stats[record.word]) || 0) + 1;
      stats[record.word] = nextCount;
      writeStats(stats);
      activeMarker = marker;
      activeWord = record.word;
      activeCount = nextCount;
    } else if (activeMarker === marker && activeWord === record.word && activeCount) {
      // Rerender tego samego pytania nie może zwiększać licznika.
    } else {
      activeMarker = marker;
      activeWord = record.word;
      activeCount = Math.max(1, Number(stats[record.word]) || 1);
    }

    ensureBadge(badges, activeCount);
  }

  addStyles();

  const observer = new MutationObserver(() => requestAnimationFrame(update));
  const start = () => {
    const app = document.querySelector('#app');
    if (!app) return;
    observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-view', 'data-mode', 'class'] });
    update();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
