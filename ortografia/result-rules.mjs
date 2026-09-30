import { createBubble } from '../spelling/bubble.mjs?v=42-live-fixed-rule';
import { sceneFor, sceneUrl } from '../spelling/scenes.mjs?v=27-final-assets';
import { LEARNING_TYPES, validLearning } from '../spelling/learning.mjs?v=1';

const dialogs = new WeakMap();
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
export const eyeSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const chips = (items, answer) => items.map(word => {
  const at = word.indexOf(answer);
  const label = at < 0 ? escape(word) : escape(word.slice(0, at)) + '<span class="result-answer-letter">' + escape(answer) + '</span>' + escape(word.slice(at + answer.length));
  return '<span class="rule-word-chip">' + label + '</span>';
}).join('');

export function closeResultRule(root, restoreFocus = true) {
  const active = dialogs.get(root);
  if (!active) return;
  dialogs.delete(root);
  clearTimeout(active.loaderTimeout);
  root.classList.remove('result-rule-open');
  active.resizeObserver?.disconnect();
  active.bubble?.destroy();
  if (active.dialog.open) active.dialog.close();
  active.dialog.remove();
  if (restoreFocus && active.trigger.isConnected) active.trigger.focus({preventScroll: true});
}

export function openResultRule(root, attempt, trigger) {
  if (!attempt) return;
  closeResultRule(root, false);
  const candidate = attempt.learning;
  const learning = candidate && validLearning(candidate) ? candidate : {
    type: 'memory', title: 'Poprawny zapis',
    explanation: 'Przyjrzyj się zaznaczonej części słowa. Zapamiętaj poprawny zapis i skojarz go z obrazkiem.',
    examples: [], relatedWords: [], forms: [], sources: [],
  };
  const scene = sceneFor(attempt.masked || '', attempt.word || '');
  const image = scene?.asset ? sceneUrl(scene) : '';
  const dialog = document.createElement('dialog');
  dialog.className = 'result-rule-dialog';
  dialog.setAttribute('aria-labelledby', 'result-rule-title');
  const [before, ...after] = String(attempt.masked || '').split('_');
  const word = after.length ? escape(before) + '<span class="result-answer-letter">' + escape(attempt.answer) + '</span>' + escape(after.join('_')) : escape(attempt.word);
  dialog.innerHTML = '<header class="rule-dialog-head"><span>' + eyeSvg + ' Mała podpowiedź</span><button type="button" class="rule-close" aria-label="Zamknij zasadę i wróć do wyników">×</button></header>' +
    '<div class="rule-dialog-body"><div class="rule-dialog-fixed"><div class="rule-visual" role="img" aria-label="Ilustracja do słowa ' + escape(attempt.word) + '"><div class="rule-bubble"></div></div><span class="rule-image-loader" role="status" aria-label="Ładowanie ilustracji" hidden><span class="rule-loader-orbit" aria-hidden="true">' + Array.from({length: 6}, (_, index) => '<i style="--bubble-index:' + index + '"></i>').join('') + '</span></span><p class="rule-image-error" role="status" hidden>Przyjrzyj się poprawnemu zapisowi poniżej.</p>' +
    '<h2 id="result-rule-title">' + word + '</h2><span class="rule-type" data-rule-type="' + escape(learning.type) + '">' + escape(LEARNING_TYPES[learning.type]) + '</span></div>' +
    '<div class="rule-scroll-shell"><div class="rule-dialog-scroll" tabindex="0" aria-label="Szczegóły zasady"><section class="rule-explanation"><h3>' + escape(learning.title) + '</h3><p>' + escape(learning.explanation) + '</p>' +
    (learning.examples.length ? '<div class="rule-exchanges">' + learning.examples.map(example => '<div><strong>' + escape(example.from) + '</strong><span aria-hidden="true">' + (learning.type === 'exchange' ? '↔' : '·') + '</span><strong>' + escape(example.to) + '</strong><small>' + escape(example.change) + '</small></div>').join('') + '</div>' : '') + '</section>' +
    (learning.relatedWords.length ? '<section class="rule-family"><h3>Rodzina wyrazów</h3><p>Podobne słowa pomagają zapamiętać pisownię.</p><div class="rule-chips">' + chips(learning.relatedWords, attempt.answer) + '</div></section>' : '') +
    (learning.forms.length ? '<section class="rule-family"><h3>Formy wyrazów z tej rodziny</h3><div class="rule-chips">' + chips(learning.forms, attempt.answer) + '</div></section>' : '') +
    (learning.sources.length ? '<details class="rule-sources"><summary>Dla ciekawych: słownik i zasady</summary>' + learning.sources.map(source => '<a href="' + escape(source.url) + '" target="_blank" rel="noopener noreferrer">' + escape(source.label) + ' ↗</a>').join('') + '</details>' : '') + '</div></div></div>';
  document.body.append(dialog);
  const active = {dialog, trigger, bubble: null, resizeObserver: null, loaderTimeout: null};
  dialogs.set(root, active);
  root.classList.add('result-rule-open');
  const close = () => closeResultRule(root);
  dialog.querySelector('.rule-close').addEventListener('click', close);
  dialog.addEventListener('cancel', event => {event.preventDefault(); close();});
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
  });
  dialog.showModal();
  dialog.querySelector('.rule-close').focus({preventScroll: true});
  const scroll = dialog.querySelector('.rule-dialog-scroll');
  const updateScrollCue = () => {
    if (dialogs.get(root) !== active) return;
    dialog.classList.toggle('has-scroll-top', scroll.scrollTop > 2);
    dialog.classList.toggle('has-scroll-more', scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop > 2);
  };
  scroll.addEventListener('scroll', updateScrollCue, {passive: true});
  dialog.querySelector('.rule-sources')?.addEventListener('toggle', updateScrollCue);
  active.resizeObserver = new ResizeObserver(updateScrollCue);
  active.resizeObserver.observe(scroll);
  [...scroll.children].forEach(child => active.resizeObserver.observe(child));
  updateScrollCue();
  // The rule artwork uses the same live bubble motion as the spelling game.
  active.bubble = createBubble(dialog.querySelector('.rule-bubble'));
  const loader = dialog.querySelector('.rule-image-loader');
  active.loaderTimeout = setTimeout(() => {
    if (dialogs.get(root) === active) { loader.hidden = false; updateScrollCue(); }
  }, 180);
  active.bubble.preloadScene(image).then(loaded => {
    if (dialogs.get(root) !== active) return;
    clearTimeout(active.loaderTimeout);
    loader.hidden = true;
    dialog.querySelector('.rule-image-error').hidden = Boolean(loaded);
    if (loaded) void active.bubble.transitionToScene(image, scene, true);
    updateScrollCue();
  });
}
