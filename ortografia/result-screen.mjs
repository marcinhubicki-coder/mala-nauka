import { sceneFor, sceneUrl } from '../spelling/scenes.mjs?v=27-final-assets';
import { closeResultRule, openResultRule, eyeSvg } from './result-rules.mjs?v=1';
import { spellingRoundLabel } from '../spelling/round.mjs?v=1';

const resultContexts = new WeakMap();

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const asset = name => new URL('../assets/ortografia/' + name, import.meta.url).href;
const check = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m8 16 5.5 6L25 10"/></svg>';
const repeat = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M24 13a9 9 0 0 0-15-4M7 19a9 9 0 0 0 15 4M24 6v7h-7M7 26v-7h7"/></svg>';
const returnArrow = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M18 7a9 9 0 1 0 8 13M18 3l5 5-5 5M22 8h-6"/></svg>';
const sprig = '<svg class="result-sprig" viewBox="0 0 48 64" aria-hidden="true"><path class="sprig-stem" d="M20 66Q24 34 37 8"/><path d="M34 26Q28 12 41 3Q45 19 34 26ZM30 38Q27 22 16 19Q13 36 30 38ZM28 44Q29 26 44 27Q44 43 28 44ZM25 54Q23 37 10 36Q9 52 25 54ZM23 60Q28 44 39 45Q40 59 23 60ZM22 64Q14 49 3 54Q3 65 22 64Z"/></svg>';

function resultWord(attempt) {
  const [before, ...after] = String(attempt.masked || '').split('_');
  return after.length ? escape(before) + '<span class="result-answer-letter">' + escape(attempt.answer) + '</span>' + escape(after.join('_')) : escape(attempt.word || attempt.answer);
}

function resultRows(attempts, emptyCopy) {
  if (!attempts.length) return '<p class="result-detail-empty">' + escape(emptyCopy) + '</p>';
  return '<div class="result-word-list" tabindex="0" aria-label="Słowa z tej rundy">' + attempts.map(attempt => {
    const scene = sceneFor(attempt.masked || '', attempt.word || '');
    const image = scene?.asset ? sceneUrl(scene) : '';
    const retained = attempt.correct === true;
    return '<article class="result-word-row ' + (retained ? 'is-retained' : 'is-review') + '">' +
      (image ? '<img class="result-word-thumb" src="' + escape(image) + '" alt="" width="44" height="44" decoding="async">' : '<span class="result-word-thumb result-word-fallback" aria-hidden="true">✦</span>') +
      '<div class="result-word-copy"><strong>' + resultWord(attempt) + '</strong><small>' + (retained ? 'Dziś poszło dobrze' : 'Poprawny zapis') + (attempt.category ? ' · ' + escape(attempt.category.replace('/', ' / ')) : '') + '</small></div>' +
      '<button type="button" class="result-word-state" data-action="show-result-rule" data-rule-index="' + attempt.ruleIndex + '" aria-label="Zasada pisowni słowa ' + escape(attempt.word) + '">Zasada' + eyeSvg + '</button></article>';
  }).join('') + '</div>';
}

function stat(label, count, key, open) {
  return '<button type="button" class="result-stat ' + (open ? 'is-active' : '') + '" data-action="toggle-result" data-result="' + key + '" aria-expanded="' + open + '" aria-controls="result-detail-' + key + '"><span class="result-stat-icon" aria-hidden="true">' + (key === 'retained' ? check : repeat) + '</span><span class="result-stat-copy"><b>' + count + '</b><span>' + label + '</span></span>' + sprig + '</button>';
}

function ambient() {
  const sparks = [[11, 14, 4.2, -1.1], [84, 8, 5.6, -2.8], [74, 24, 6.4, -4.1], [20, 5, 4.8, -3.3], [92, 84, 7.1, -1.9], [7, 88, 5.1, -4.7]];
  const orbs = [[4, 18, 43, 7.2, -1.2], [88, 11, 35, 9.1, -3.4], [89, 90, 46, 11, -4.8]];
  return '<div class="result-ambient" aria-hidden="true">' + sparks.map(([left, top, duration, delay]) => '<i class="result-spark" style="left:' + left + '%;top:' + top + '%;--spark-duration:' + duration + 's;--spark-delay:' + delay + 's"></i>').join('') + orbs.map(([left, top, size, duration, delay]) => '<i class="result-orb" style="--orb-left:' + left + '%;--orb-top:' + top + '%;--orb-size:' + size + ';--orb-duration:' + duration + 's;--orb-delay:' + delay + 's"></i>').join('') + '</div>';
}

export function renderSpellingResult(root, result, words = [], ui = null) {
  closeResultRule(root, false);
  const learning = new Map(words.filter(word => word.learning).map(word => [word.word, word.learning]));
  const attempts = Array.isArray(result.attempts) ? result.attempts.filter(attempt => attempt?.kind === 'spelling').map((attempt, ruleIndex) => ({...attempt, ruleIndex, learning: attempt.learning || learning.get(attempt.word)})) : [];
  resultContexts.set(root, attempts);
  const retained = attempts.filter(attempt => attempt.correct), review = attempts.filter(attempt => !attempt.correct), total = attempts.length;
  const scorePct = total ? Math.round(retained.length / total * 100) : 0;
  const eyebrow = result.early ? 'Runda zakończona wcześniej' : 'Przygoda ukończona';
  const heading = total ? 'Dobra robota!' : 'Na dziś wystarczy!';
  const intro = total ? (result.early ? 'To, co już zrobione, też się liczy. Zobacz, co dziś było pewne i do czego warto wrócić.' : 'Mały trening, kolejny krok do przodu.') : 'Nie zdążyliśmy jeszcze przećwiczyć słowa. Wróć, kiedy będziesz mieć ochotę.';
  const modeLabel = 'Ortografia · ' + spellingRoundLabel(result);
  const reviewPanel = review.length
    ? '<section id="result-detail-review" class="result-detail is-review" data-result-panel="review"><div class="result-detail-head"><div><strong>Tu były małe potknięcia</strong><p>Zapamiętaj poprawną formę.</p></div><span aria-hidden="true">' + returnArrow + '</span></div>' + resultRows(review, '') + '</section>'
    : '<section id="result-detail-review" class="result-detail is-retained is-congrats" data-result-panel="review"><div class="result-detail-head"><div><strong>' + (total ? 'Dziś bez potknięć!' : 'Jeszcze wszystko przed nami') + '</strong><p>' + (total ? 'Świetnie — nie ma nic do powtórki.' : 'Wróć, kiedy będziesz mieć ochotę.') + '</p></div><span aria-hidden="true">' + check + '</span></div><div class="result-congrats"><span aria-hidden="true">' + check + '</span><p>' + (total ? 'Wrócimy do tych słów później, żeby sprawdzić, co zostało w pamięci.' : 'Każda próba to krok do przodu.') + '</p></div></section>';
  root.dataset.view = 'results'; root.dataset.mode = 'spelling';
  root.innerHTML = '<section class="result learning-result result-v4' + (total ? '' : ' result-empty') + '">' +
    ambient() +
    '<button type="button" class="result-close" data-action="home" aria-label="Zamknij podsumowanie i wróć do wyboru gry"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button>' +
    '<div class="result-sheet"><div class="result-heading"><span class="eyebrow">' + eyebrow + '</span><div class="result-title-wrap"><svg class="result-rays result-rays-left" viewBox="0 0 26 28" aria-hidden="true"><path d="m5 4 5 9M4 20l8 3"/></svg><h1 tabindex="-1">' + heading + '</h1><svg class="result-rays result-rays-right" viewBox="0 0 26 28" aria-hidden="true"><path d="m21 4-5 9m6 7-8 3"/></svg></div><p>' + intro + '</p></div>' +
    '<div class="round-summary" aria-label="Podsumowanie rundy"><div class="round-summary-line"><div class="round-score"><strong>' + retained.length + ' / ' + total + '</strong><span>poprawnie</span></div><span class="round-mode-pill">' + modeLabel + '</span><em>' + scorePct + '%</em></div><div class="round-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + scorePct + '" aria-label="' + scorePct + ' procent poprawnych"><span style="width:' + scorePct + '%"></span></div></div>' +
    '<div class="learning-stats-two">' + stat('Utrwalone', retained.length, 'retained', false) + stat('Do powtórki', review.length, 'review', true) + '</div>' +
    '<div class="result-details"><section id="result-detail-retained" class="result-detail is-retained" data-result-panel="retained" hidden><div class="result-detail-head"><div><strong>To dziś było pewne</strong><p>Te słowa poszły poprawnie.</p></div><span aria-hidden="true">' + check + '</span></div>' + resultRows(retained, 'Jeszcze nic tutaj nie ma.') + '</section>' + reviewPanel + '</div>' +
    '<div class="result-actions"><button type="button" class="primary result-again" data-action="again"><i class="cta-star star-1" aria-hidden="true"></i><i class="cta-star star-2" aria-hidden="true"></i><i class="cta-star star-3" aria-hidden="true"></i><i class="cta-star star-4" aria-hidden="true"></i><i class="cta-star star-5" aria-hidden="true"></i><span>Jeszcze jedna runda</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button><button type="button" class="result-collection" data-action="history">Moja kolekcja</button></div>' +
    '</div></section>';
  root.querySelector('h1')?.focus({ preventScroll: true });
  if (ui?.panel) {
    const selected = root.querySelector('[data-result="' + (ui.panel === 'retained' ? 'retained' : 'review') + '"]');
    toggleResultDetail(root, selected);
    root.querySelectorAll('[data-result-panel]').forEach(panel => { const list = panel.querySelector('.result-word-list'); if (list) list.scrollTop = Math.max(0, Number(ui.scroll?.[panel.dataset.resultPanel]) || 0); });
  }
}

export function getResultViewState(root) {
  return {panel: root.querySelector('[data-result-panel]:not([hidden])')?.dataset.resultPanel || 'review',
    scroll: Object.fromEntries([...root.querySelectorAll('[data-result-panel]')].map(panel => [panel.dataset.resultPanel, panel.querySelector('.result-word-list')?.scrollTop || 0]))};
}

export function showResultRule(root, button) {
  const index = Number(button?.dataset.ruleIndex);
  if (!Number.isInteger(index) || index < 0) return;
  openResultRule(root, resultContexts.get(root)?.[index], button);
}

export function toggleResultDetail(root, button) {
  const key = button?.dataset.result, panel = key ? root.querySelector('[data-result-panel="' + key + '"]') : null;
  if (!panel) return;
  root.querySelectorAll('[data-action="toggle-result"]').forEach(item => { item.classList.toggle('is-active', item === button); item.setAttribute('aria-expanded', String(item === button)); });
  root.querySelectorAll('[data-result-panel]').forEach(item => { item.hidden = item !== panel; });
}
