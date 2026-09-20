import { sceneFor, sceneUrl } from './scenes.mjs?v=11-batch80';
import { createBubble } from './bubble.mjs?v=8-mechanics';
import { createWord, revealWord, flowInk } from './word-reveal.mjs?v=8-mechanics';
import { RULES, lightbulbSvg } from './hints.mjs';

// One session owns one scene. Only its picture and ink change between questions.
export function createSpellingArt(app) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let session, shownQuestion = 0, shownState = '', bubble, nodes, hint, generation = 0;
  let animations = [], resizeObserver;
  function closeHint() {
    if (!hint) return;
    hint.close(); hint.remove(); hint = null;
    if (session?.state === 'paused' && session.resumeState === 'playing') session.resume();
    app.classList.remove('spelling-hint-open');
    bubble?.setPaused(app.classList.contains('paused'));
    nodes?.hint.focus({ preventScroll: true });
  }
  function reset() {
    generation++;
    if (hint) { hint.close(); hint.remove(); hint = null; }
    animations.forEach(animation => animation.cancel()); animations = [];
    bubble?.destroy(); bubble = null;
    resizeObserver?.disconnect();
    session?.setPresentationHold(false);
    session = nodes = undefined; shownQuestion = 0; shownState = '';
    app.classList.remove('spelling-art-ready', 'spelling-has-feedback', 'spelling-hint-open', 'ink-changing');
    delete app.dataset.artScene;
  }
  function openHint() {
    if (!session || session.state !== 'playing' || session.presentationHeld) return;
    session.pause(); bubble.setPaused(true);
    app.classList.add('spelling-hint-open');
    hint = document.createElement('dialog'); hint.className = 'spelling-hint-sheet';
    hint.setAttribute('aria-labelledby', 'spelling-hint-title');
    hint.innerHTML = `<div class="hint-sheet-head">${lightbulbSvg()}<h2 id="spelling-hint-title">Mała podpowiedź</h2><button type="button" class="hint-dismiss" aria-label="Zamknij podpowiedź">×</button></div><p>${RULES[session.current.category] || 'Spróbuj przypomnieć sobie podobny wyraz i porównać jego zapis.'}</p>`;
    hint.querySelector('button').addEventListener('click', closeHint);
    hint.addEventListener('cancel', event => { event.preventDefault(); closeHint(); });
    hint.addEventListener('keydown', event => event.stopPropagation());
    hint.addEventListener('click', event => { if (event.target === hint) closeHint(); });
    app.append(hint); hint.showModal();
  }
  function mount(game) {
    reset(); session = game; app.classList.add('spelling-art-ready');
    app.innerHTML = `
      <img class="spelling-screen-bg" src="assets/ortografia/lake-background.webp" alt="" width="711" height="1536" decoding="async" fetchpriority="high">
      <header class="game-bar">
        <button type="button" class="icon" data-action="exit" aria-label="Wyjdź z rundy"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button>
        <div class="time-block"><span class="timer" aria-label="Pozostały czas"></span><progress max="${game.duration * 1000}" value="${game.remaining}" aria-label="Pozostały czas rundy"></progress></div>
        <button type="button" class="icon" data-action="pause" aria-label="Pauza"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg></button>
      </header>
      <h1 class="spelling-title">Jak jest poprawnie?</h1>
      <div class="spelling-visual" aria-hidden="true"></div>
      <section class="spelling-question-card" aria-label="Uzupełnij słowo"><div class="question-content"></div></section>
      <div class="answers count-2">
        <button type="button" class="answer" data-action="answer" data-index="0"><span class="answer-ink"></span></button>
        <button type="button" class="answer" data-action="answer" data-index="1"><span class="answer-ink"></span></button>
      </div>
      <div class="spelling-action-row"><button type="button" class="spelling-hint">${lightbulbSvg()}<span>Potrzebujesz podpowiedzi?</span></button><button type="button" class="spelling-next" data-action="next" hidden>Dalej <span aria-hidden="true">→</span></button></div>
      <div class="feedback" role="status" aria-live="polite" aria-atomic="true"></div>`;
    nodes = {
      word: app.querySelector('.question-content'), answers: [...app.querySelectorAll('.answer')],
      hint: app.querySelector('.spelling-hint'), next: app.querySelector('.spelling-next'), feedback: app.querySelector('.feedback'),
    };
    nodes.hint.addEventListener('click', openHint);
    bubble = createBubble(app.querySelector('.spelling-visual'));
    resizeObserver = new ResizeObserver(fitWord); resizeObserver.observe(nodes.word);
    document.fonts.ready.then(() => { if (session === game) fitWord(); });
  }
  function fitWord() {
    const word = nodes?.word.firstElementChild; if (!word) return;
    word.style.removeProperty('font-size');
    const width = word.getBoundingClientRect().width, available = nodes.word.clientWidth - 8;
    if (width > available) word.style.fontSize = `${parseFloat(getComputedStyle(word).fontSize) * available / width}px`;
  }
  async function animateInk(direction) {
    if (reduced.matches || !nodes) return;
    const letters = [...nodes.word.querySelectorAll('.ink-letter,.gap'), ...app.querySelectorAll('.answer-ink')];
    animations = flowInk(letters, direction);
    if (session?.state === 'paused') animations.forEach(animation => animation.pause());
    const active = animations;
    await Promise.all(active.map(animation => animation.finished.catch(() => {})));
    active.forEach(animation => animation.cancel());
    if (animations === active) animations = [];
  }
  async function present(game, first) {
    const token = ++generation;
    game.setPresentationHold(true); app.classList.add('ink-changing');
    nodes.answers.forEach(button => { button.disabled = true; });
    nodes.hint.disabled = true; nodes.next.hidden = true;

    const q = game.current, scene = sceneFor(q.masked, q.word);
    if (!first) await animateInk('out');
    if (token !== generation || session !== game) return;

    app.dataset.artScene = scene?.key || 'calm'; app.classList.remove('spelling-has-feedback');
    nodes.word.replaceChildren(createWord(q.masked));
    nodes.word.setAttribute('aria-label', `Uzupełnij: ${q.masked.replace('_', ' — luka — ')}`);
    nodes.answers.forEach((button, index) => {
      button.querySelector('.answer-ink').textContent = game.options[index];
      button.classList.remove('correct', 'wrong'); button.setAttribute('aria-label', game.options[index]);
    });
    nodes.feedback.textContent = ''; nodes.hint.hidden = false; fitWord();

    const pictureChange = bubble.transitionToScene(scene?.asset ? sceneUrl(scene) : '', scene, first);
    await Promise.all([animateInk('in'), pictureChange]);
    if (token !== generation || session !== game) return;

    game.setPresentationHold(false); app.classList.remove('ink-changing');
    nodes.answers.forEach(button => { button.disabled = false; }); nodes.hint.disabled = false;
    if (document.body.classList.contains('keyboard')) nodes.answers[0].focus({ preventScroll: true });
  }
  function render(game) {
    if (session !== game || !nodes?.word.isConnected) mount(game);
    if (shownQuestion !== game.question) {
      const first = shownQuestion === 0; shownQuestion = game.question; shownState = game.state; present(game, first);
    } else if (shownState !== game.state && game.state.startsWith('feedback')) {
      shownState = game.state; const correct = game.state === 'feedback-correct';
      app.classList.add('spelling-has-feedback');
      nodes.word.setAttribute('aria-label', `Poprawnie: ${game.current.word}`);
      revealWord(nodes.word.firstElementChild, game.current.answer, reduced.matches).then(() => { if (session === game) fitWord(); });
      nodes.answers.forEach((button, index) => {
        button.disabled = true;
        button.classList.toggle('correct', game.options[index] === game.current.answer);
        button.classList.toggle('wrong', !correct && game.options[index] === game.selected);
      });
      nodes.hint.hidden = !correct; nodes.hint.disabled = true; nodes.next.hidden = correct;
      nodes.feedback.textContent = correct ? 'Pięknie!' : `Zapamiętaj: ${game.current.word}.`;
      if (!correct) nodes.next.focus({ preventScroll: true });
    }
  }
  function setPaused(paused) {
    bubble?.setPaused(paused || Boolean(hint));
    animations.forEach(animation => paused ? animation.pause() : animation.play());
  }
  reduced.addEventListener('change', () => { if (reduced.matches) animations.forEach(animation => animation.finish()); });
  return { render, reset, setPaused, closeHint };
}
