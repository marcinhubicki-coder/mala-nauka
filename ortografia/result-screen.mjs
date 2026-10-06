import {scoreResult} from '../spelling/scoring.mjs';
import { createContinueDrag } from '../spelling/continue-drag.mjs?v=4-jelly-motion';
import { watchScrollEdges } from '../shared/scroll-edges.mjs?v=1';
import { sceneFor, sceneUrl } from '../spelling/scenes.mjs?v=27-final-assets';
import { closeResultRule, openResultRule, eyeSvg } from './result-rules.mjs?v=6-scroll-edges';
import { revealResult, settleResult } from './result-motion.mjs?v=8-staggered-finish';
import { spellingRoundLabel } from '../spelling/round.mjs?v=1';

const resultContexts = new WeakMap();
const scrollCleanups = new WeakMap();
export function stopResultScroll(root){scrollCleanups.get(root)?.forEach(stop=>stop());scrollCleanups.delete(root);}

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
  const visibleRows = Math.min(3, attempts.length);
  const overflow = attempts.length > 3;
  return '<div class="result-word-viewport rows-' + visibleRows + (overflow ? ' has-overflow' : '') + '"><div class="result-word-list" tabindex="0" aria-label="Słowa z tej rundy">' + attempts.map(attempt => {
    const scene = sceneFor(attempt.masked || '', attempt.word || '');
    const image = scene?.asset ? sceneUrl(scene) : '';
    const retained = attempt.correct === true;
    return '<article class="result-word-row ' + (retained ? 'is-retained' : 'is-review') + '">' +
      (image ? '<img class="result-word-thumb" src="' + escape(image) + '" alt="" width="40" height="40" decoding="async">' : '<span class="result-word-thumb result-word-fallback" aria-hidden="true">✦</span>') +
      '<div class="result-word-copy"><strong>' + resultWord(attempt) + '</strong><small>' + (retained ? 'Dziś poszło dobrze' : 'Poprawny zapis') + (attempt.category ? ' · ' + escape(attempt.category.replace('/', ' / ')) : '') + '</small></div>' +
      '<button type="button" class="result-word-state" data-action="show-result-rule" data-rule-index="' + attempt.ruleIndex + '" aria-label="Zasada pisowni słowa ' + escape(attempt.word) + '">Zasada' + eyeSvg + '</button></article>';
  }).join('') + '</div></div>';
}

function stat(label, count, key, open) {
  return '<button type="button" class="result-stat ' + (open ? 'is-active' : '') + '" data-action="toggle-result" data-result="' + key + '" aria-expanded="' + open + '" aria-controls="result-detail-' + key + '"><span class="result-stat-icon" aria-hidden="true">' + (key === 'retained' ? check : repeat) + '</span><span class="result-stat-copy"><b data-count="' + count + '" data-reel="compact2">' + count + '</b><span>' + label + '</span></span>' + sprig + '</button>';
}

function ambient() {
  const sparks = [[11, 14, 4.2, -1.1], [84, 8, 5.6, -2.8], [74, 24, 6.4, -4.1], [20, 5, 4.8, -3.3], [92, 84, 7.1, -1.9], [7, 88, 5.1, -4.7]];
  const orbs = [[4, 18, 43, 7.2, -1.2], [88, 11, 35, 9.1, -3.4], [89, 90, 46, 11, -4.8]];
  return '<div class="result-ambient" aria-hidden="true">' + sparks.map(([left, top, duration, delay]) => '<i class="result-spark" style="left:' + left + '%;top:' + top + '%;--spark-duration:' + duration + 's;--spark-delay:' + delay + 's"></i>').join('') + orbs.map(([left, top, size, duration, delay]) => '<i class="result-orb" style="--orb-left:' + left + '%;--orb-top:' + top + '%;--orb-size:' + size + ';--orb-duration:' + duration + 's;--orb-delay:' + delay + 's"></i>').join('') + '</div>';
}

function progressParticles(percent) {
  if (!percent) return '';
  const count = 12, spreadBase = 52, sizeBase = 6.5, durationBase = 950, alpha = .592;
  return '<span class="progress-particles" aria-hidden="true">' + Array.from({ length: count }, (_, index) => {
    const angle = (-105 + 210 * (index / Math.max(1, count - 1))) * Math.PI / 180;
    const spread = spreadBase * (.55 + (index % 4) * .15);
    const x = Math.cos(angle) * spread, y = Math.sin(angle) * spread;
    const size = sizeBase * (.75 + (index % 3) * .18);
    const duration = Math.round(durationBase * (.82 + (index % 4) * .08));
    return '<i style="--particle-x:' + x.toFixed(1) + ';--particle-y:' + y.toFixed(1) + ';--particle-size:' + size.toFixed(1) + ';--particle-ms:' + duration + 'ms;--particle-alpha:' + alpha + '"></i>';
  }).join('') + '</span>';
}

export function renderSpellingResult(root, result, words = [], ui = null, motion = null) {
  settleResult(root);
  stopResultScroll(root);
  closeResultRule(root, false);
  const learning = new Map(words.filter(word => word.learning).map(word => [word.word, word.learning]));
  const attempts = Array.isArray(result.attempts) ? result.attempts.filter(attempt => attempt?.kind === 'spelling').map((attempt, ruleIndex) => ({...attempt, ruleIndex, learning: attempt.learning || learning.get(attempt.word)})) : [];
  resultContexts.set(root, attempts);
  const retained = attempts.filter(attempt => attempt.correct), review = attempts.filter(attempt => !attempt.correct), total = attempts.length;
  const points=scoreResult(result);
  const scorePct = total ? Math.round(retained.length / total * 100) : 0;
  const heading = total ? (scorePct >= 87 ? 'Dobra robota<span class="result-exclamation">!</span>' : 'Dobra robota!') : 'Na dziś wystarczy!';
  const intro = total ? 'Brawo za Twój wysiłek!' : 'Każda próba ma znaczenie.';

  const modeLabel = 'Ortografia · ' + spellingRoundLabel(result);
  const reviewPanel = review.length
    ? '<section id="result-detail-review" class="result-detail is-review" data-result-panel="review"><div class="result-detail-head"><div><strong>Tu były małe potknięcia</strong><p>Zapamiętaj poprawną formę.</p></div><span aria-hidden="true">' + returnArrow + '</span></div>' + resultRows(review, '') + '</section>'
    : '<section id="result-detail-review" class="result-detail is-retained is-congrats" data-result-panel="review"><div class="result-detail-head"><div><strong>' + (total ? 'Dziś bez potknięć!' : 'Jeszcze wszystko przed nami') + '</strong><p>' + (total ? 'Świetnie — nie ma nic do powtórki.' : 'Wróć, kiedy będziesz mieć ochotę.') + '</p></div><span aria-hidden="true">' + check + '</span></div><div class="result-congrats"><span aria-hidden="true">' + check + '</span><p>' + (total ? 'Wrócimy do tych słów później, żeby sprawdzić, co zostało w pamięci.' : 'Każda próba to krok do przodu.') + '</p></div></section>';
  root.dataset.view = 'results'; root.dataset.mode = 'spelling';
  root.innerHTML = '<section class="result learning-result result-v4' + (total ? (scorePct >= 87 ? ' result-high-score' : '') : ' result-empty') + '">' +
    ambient() +
    '<button type="button" class="result-close" data-action="home" aria-label="Zamknij podsumowanie i wróć do wyboru gry"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button>' +
    '<div class="result-points-bubble" data-ds-key="result-points-bubble" data-ds-label="Bańka punktów" role="status" aria-label="Bańka punktów · zdobyte punkty: ' + escape(points.total) + '"><span class="result-points-core"><strong><span data-count="' + escape(points.total) + '" data-reel="score">' + escape(points.total) + '</span></strong><small>pkt</small><i aria-hidden="true">✦</i></span></div>' +
    '<div class="result-sheet"><div class="result-heading"><div class="result-title-wrap">'+(scorePct>=87?'<img class="result-title-star" src="'+asset('happy-star-v1.jpeg')+'" alt="" width="143" height="150">':'<svg class="result-rays result-rays-left" viewBox="0 0 26 28" aria-hidden="true"><path d="m5 4 5 9M4 20l8 3"/></svg>')+'<h1 tabindex="-1">' + heading + '</h1><svg class="result-rays result-rays-right" viewBox="0 0 26 28" aria-hidden="true"><path d="m21 4-5 9m6 7-8 3"/></svg></div><p>' + intro + '</p></div>' +
    '<div class="round-summary" aria-label="Podsumowanie rundy"><div class="round-summary-line"><div class="round-score"><strong><span class="result-count" data-count="' + retained.length + '" data-reel="compact2">' + retained.length + '</span> / <span class="result-count" data-count="' + total + '" data-reel="compact2">' + total + '</span></strong></div><span class="round-mode-pill">' + modeLabel + '</span><em><span class="result-count" data-count="' + scorePct + '" data-reel="percent">' + scorePct + '</span>%</em></div><div class="round-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + scorePct + '" aria-label="' + scorePct + ' procent poprawnych"><span class="round-progress-fill" data-percent="' + scorePct + '" style="width:' + scorePct + '%"><span class="round-progress-cap" aria-hidden="true"></span>' + progressParticles(scorePct) + '</span></div></div>' +
    '<div class="learning-stats-two">' + stat('Utrwalone', retained.length, 'retained', false) + stat('Do powtórki', review.length, 'review', true) + '</div>' +
    '<div class="result-details"><section id="result-detail-retained" class="result-detail is-retained" data-result-panel="retained" hidden><div class="result-detail-head"><div><strong>To dziś było pewne</strong><p>Te słowa poszły poprawnie.</p></div><span aria-hidden="true">' + check + '</span></div>' + resultRows(retained, 'Jeszcze nic tutaj nie ma.') + '</section>' + reviewPanel + '</div>' +
    '<div class="result-actions"><div class="primary result-again result-continue-rail" role="slider" tabindex="0" aria-label="Przesuń od początku do końca, aby rozpocząć kolejną rundę" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="continue-handle" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m9 5 7 7-7 7"/></svg></span><i class="cta-star star-1" aria-hidden="true"></i><i class="cta-star star-2" aria-hidden="true"></i><i class="cta-star star-3" aria-hidden="true"></i><i class="cta-star star-4" aria-hidden="true"></i><i class="cta-star star-5" aria-hidden="true"></i><span class="continue-copy">Jeszcze jedna runda <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></span><span class="continue-done" aria-hidden="true">Zaczynamy! ✓</span></div><button type="button" class="result-collection" data-action="history">Moja kolekcja</button></div>' +
    '</div></section>';
  root.querySelector('h1')?.focus({ preventScroll: true });
  if (ui?.panel) {
    const selected = root.querySelector('[data-result="' + (ui.panel === 'retained' ? 'retained' : 'review') + '"]');
    toggleResultDetail(root, selected);
    root.querySelectorAll('[data-result-panel]').forEach(panel => { const list = panel.querySelector('.result-word-list'); if (list) list.scrollTop = Math.max(0, Number(ui.scroll?.[panel.dataset.resultPanel]) || 0); });
  }
  const rail=root.querySelector('.result-continue-rail');
  const drag=createContinueDrag(rail,{variant:'result',canContinue:()=>root.dataset.view==='results'&&!root.inert,onComplete:()=>root.dispatchEvent(new CustomEvent('spelling-repeat-request',{bubbles:true}))});
  scrollCleanups.set(root,[()=>drag.destroy(),...[...root.querySelectorAll('.result-word-viewport')].map(shell=>watchScrollEdges(shell,shell.querySelector('.result-word-list')))]);
  if (motion?.animate) revealResult(root, motion.delay ?? 1000);
}

export function getResultViewState(root) {
  return {panel: root.querySelector('[data-result-panel]:not([hidden])')?.dataset.resultPanel || 'review',
    scroll: Object.fromEntries([...root.querySelectorAll('[data-result-panel]')].map(panel => [panel.dataset.resultPanel, panel.querySelector('.result-word-list')?.scrollTop || 0]))};
}

export function showResultRule(root, button) {
  const index = Number(button?.dataset.ruleIndex);
  if (!Number.isInteger(index) || index < 0) return;
  settleResult(root);
  openResultRule(root, resultContexts.get(root)?.[index], button);
}

export function toggleResultDetail(root, button) {
  const key = button?.dataset.result, panel = key ? root.querySelector('[data-result-panel="' + key + '"]') : null;
  if (!panel) return;
  root.querySelectorAll('[data-action="toggle-result"]').forEach(item => { item.classList.toggle('is-active', item === button); item.setAttribute('aria-expanded', String(item === button)); });
  root.querySelectorAll('[data-result-panel]').forEach(item => { item.hidden = item !== panel; });
}
