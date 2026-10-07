import {burstFireworks} from './fireworks.mjs';
import { createContinueDrag } from './continue-drag.mjs?v=4-jelly-motion';
import {DEFAULT_EFFECTS,createEffectPicker,normalizeEffectsConfig} from './effect-model.mjs';
import {playResponseEffect,applyBubbleSettings,createScreenAtmosphere} from './response-effects.mjs';
import {createComboGlobalEffects} from './combo-global.mjs';
import { sceneFor, sceneUrl } from './scenes.mjs?v=27-final-assets';
import {createHTMLBubble} from './bubble-html.mjs';
import {createWordParticles} from './word-particles.mjs';
import { createWord, revealWord, flowInk } from './word-reveal.mjs?v=9-simple-text';
import { RULES, lightbulbSvg } from './hints.mjs';

// One session owns one scene. Only its picture and ink change between questions.
export function createSpellingArt(app, { onContinue } = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pickEffect=createEffectPicker();
  let sourceEffects,normalizedEffects;
  const effectConfig=()=>{const value=globalThis.__MALA_NAUKA_DESIGN__?.effects||DEFAULT_EFFECTS;if(value!==sourceEffects){sourceEffects=value;normalizedEffects=normalizeEffectsConfig(value);}return normalizedEffects;};
  let effectPreview=null,renderer;
  let session, shownQuestion = 0, shownState = '', bubble, nodes, hint, generation = 0;
  let animations = [], resizeObserver,resizeFrame, background, continueDrag, stopFireworks, atmosphere, comboGlobal, wordParticles;
  const stopComboGlobal=()=>comboGlobal?.stop();
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const originalTheme = themeMeta?.getAttribute('content');
  function closeHint() {
    if (!hint) return;
    hint.close(); hint.remove(); hint = null;
    if (session?.state === 'paused' && session.resumeState === 'playing') session.resume();
    app.classList.remove('spelling-hint-open');
    bubble?.setPaused(app.classList.contains('paused'));wordParticles?.setPaused(app.classList.contains('paused'));
    nodes?.hint.focus({ preventScroll: true });
  }
  function reset() {
    generation++;
    wordParticles?.destroy();wordParticles=null;
    continueDrag?.destroy();continueDrag=null;stopFireworks?.();stopFireworks=null;stopComboGlobal();comboGlobal?.destroy();comboGlobal=null;atmosphere?.destroy();atmosphere=null;
    if (hint) { hint.close(); hint.remove(); hint = null; }
    animations.forEach(animation => animation.cancel()); animations = [];
    bubble?.destroy(); bubble = null;
    resizeObserver?.disconnect();cancelAnimationFrame(resizeFrame);
    session?.setPresentationHold(false);
    session = nodes = undefined; shownQuestion = 0; shownState = '';
    app.classList.remove('spelling-art-ready', 'spelling-correct-feedback', 'spelling-has-feedback', 'spelling-hint-open', 'ink-changing');
    delete app.dataset.artScene;
    background?.remove(); background = null;
    document.documentElement.classList.remove('spelling-playing');
    if (originalTheme) themeMeta?.setAttribute('content', originalTheme);
  }
  function openHint() {
    if (!session || session.state !== 'playing' || session.presentationHeld) return;
    session.hintUsed=true;session.pause(); bubble.setPaused(true);wordParticles?.setPaused(true);
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
    document.documentElement.classList.add('spelling-playing');
    themeMeta?.setAttribute('content', '#65b6ff');
    background = document.createElement('img');
    background.className = 'spelling-screen-bg'; background.alt = '';
    background.src = new URL('../assets/ortografia/game-meadow-v1.webp', import.meta.url).href;
    background.width = 711; background.height = 1536;
    background.decoding = 'async'; background.fetchPriority = 'high';
    document.body.prepend(background);
    const statusBlock=game.untimed
      ? `<div class="time-block dictation-count"><span class="timer" aria-label="Pytanie w rundzie"></span><progress max="${game.questionLimit||80}" value="${game.questionsRemaining()??game.questionLimit??80}" aria-label="Postęp rundy"></progress></div>`
      : `<div class="time-block"><span class="timer" aria-label="Pozostały czas"></span><progress max="${game.duration * 1000}" value="${game.remaining}" aria-label="Pozostały czas rundy"></progress></div>`;
    app.innerHTML = `
      <header class="game-bar">
        <button type="button" class="icon" data-action="exit" aria-label="Wyjdź z rundy"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button>
        ${statusBlock}
        <button type="button" class="icon" data-action="pause" aria-label="Pauza"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg></button>
      </header>
      <h1 class="spelling-title">Jak jest poprawnie?</h1>
      <div class="spelling-visual" aria-hidden="true"></div>
      <section class="spelling-question-card" aria-label="Uzupełnij słowo"><div class="question-content"></div></section>
      <div class="answers count-2">
        <button type="button" class="answer" data-action="answer" data-index="0"><span class="answer-ink"></span></button>
        <button type="button" class="answer" data-action="answer" data-index="1"><span class="answer-ink"></span></button>
      </div>
      <div class="spelling-action-row"><button type="button" class="spelling-hint">${lightbulbSvg()}<span>Potrzebujesz podpowiedzi?</span></button><div class="spelling-next spelling-continue-rail" role="slider" tabindex="0" aria-label="Przesuń od początku do końca, aby przejść dalej" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" hidden><span class="continue-handle" aria-hidden="true"></span><span class="continue-chevrons" aria-hidden="true">› › ›</span><span class="continue-copy">Przesuń, aby przejść dalej</span></div></div>
      <div class="feedback" role="status" aria-live="polite" aria-atomic="true"></div>`;
    atmosphere=createScreenAtmosphere(app,effectConfig());
    comboGlobal=createComboGlobalEffects(app);
    nodes = {
      word: app.querySelector('.question-content'), answers: [...app.querySelectorAll('.answer')],
      hint: app.querySelector('.spelling-hint'), next: app.querySelector('.spelling-next'), feedback: app.querySelector('.feedback'),
    };
    wordParticles=createWordParticles(nodes.word,effectConfig);
    nodes.hint.addEventListener('click', openHint);
    continueDrag=createContinueDrag(nodes.next,{variant:'wrong',canContinue:()=>session===game&&game.state==='feedback-wrong'&&!app.classList.contains('paused'),onComplete:()=>{game.skipFeedback();onContinue?.();}});
    renderer='composited';
    bubble=createHTMLBubble(app.querySelector('.spelling-visual'));
    applyBubbleSettings(bubble,effectConfig());
    let observedWidth=-1;
    resizeObserver = new ResizeObserver(entries=>{
      const width=entries[0]?.contentRect.width;if(width===undefined||Math.abs(width-observedWidth)<.5)return;observedWidth=width;
      // Fit after observer delivery, and only when container width changes.
      // Fitting on its own height change created a WebKit observer loop.
      cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{fitWord();wordParticles?.refresh();});
    });resizeObserver.observe(nodes.word);
    document.fonts.ready.then(() => { if (session === game){fitWord();wordParticles?.refresh();} });
  }
  function fitWord() {
    const word = nodes?.word.firstElementChild; if (!word) return;
    word.style.removeProperty('font-size');
    const width = word.getBoundingClientRect().width, available = nodes.word.clientWidth - 8;
    if (width > available) word.style.fontSize = `${parseFloat(getComputedStyle(word).fontSize) * available / width}px`;
  }
  async function animateInk(direction) {
    if (reduced.matches || !nodes) return;
    const blocks = [...(effectConfig().wordTransition?.style==='particles'?[]:[nodes.word.firstElementChild]), ...app.querySelectorAll('.answer-ink')].filter(Boolean);
    // Optional dots run beside existing 140/180ms ink motion, without adding delay.
    const particleMotion=wordParticles?.play(direction);
    animations = flowInk(blocks, direction);
    if (session?.state === 'paused') animations.forEach(animation => animation.pause());
    const active = animations,finished=Promise.all(active.map(animation => animation.finished.catch(() => {})));
    if(effectConfig().wordTransition?.style==='particles')await particleMotion;
    await finished;
    active.forEach(animation => animation.cancel());
    if (animations === active) animations = [];
  }
  function preloadQueuedScene(game) {
    const next = game?.queue?.[0];
    if (!next?.masked) return;
    const nextScene = sceneFor(next.masked, next.word);
    if (nextScene?.asset) bubble?.preloadScene(sceneUrl(nextScene));
  }

  async function present(game, first) {
    const token = ++generation;
    stopFireworks?.();stopFireworks=null;stopComboGlobal();continueDrag?.reset();
    game.setPresentationHold(true); app.classList.add('ink-changing');
    nodes.answers.forEach(button => { button.disabled = true; });
    nodes.hint.disabled = true; nodes.next.hidden = true;

    const q = game.current, scene = sceneFor(q.masked, q.word);
    const pictureUrl = scene?.asset ? sceneUrl(scene) : '';

    // Keep the current question visible while the next picture decodes.
    // Once ready, text/answers and picture start entering together.
    if (pictureUrl) await bubble.preloadScene(pictureUrl);
    if (token !== generation || session !== game) return;
    if (!first) await animateInk('out');
    if (token !== generation || session !== game) return;

    app.dataset.artScene = scene?.key || 'calm'; app.classList.remove('spelling-has-feedback','spelling-correct-feedback');
    nodes.word.dataset.answerLength=String(q.answer.length);
    nodes.word.replaceChildren(createWord(q.masked));
    nodes.word.setAttribute('aria-label', `Uzupełnij: ${q.masked.replace('_', ' — luka — ')}`);
    nodes.answers.forEach((button, index) => {
      button.querySelector('.answer-ink').textContent = game.options[index];
      button.classList.remove('correct', 'wrong'); button.setAttribute('aria-label', game.options[index]);
    });
    nodes.feedback.textContent = ''; nodes.hint.hidden = false; fitWord();

    const pictureChange = bubble.transitionToScene(pictureUrl, scene, first);
    const inkChange = animateInk('in');
    await Promise.all([inkChange, pictureChange]);
    if (token !== generation || session !== game) return;

    game.setPresentationHold(false); app.classList.remove('ink-changing');
    nodes.answers.forEach(button => { button.disabled = false; }); nodes.hint.disabled = false;
    preloadQueuedScene(game);
    if (document.body.classList.contains('keyboard')) nodes.answers[0].focus({ preventScroll: true });
  }
  function render(game) {
    app.dataset.state=game.state;
    if (session !== game || !nodes?.word.isConnected) mount(game);
    if (shownQuestion !== game.question) {
      const first = shownQuestion === 0; shownQuestion = game.question; shownState = game.state; return present(game, first);
    } else if (shownState !== game.state && game.state.startsWith('feedback')) {
      shownState = game.state; const correct = game.state === 'feedback-correct';
      app.classList.add('spelling-has-feedback');
      nodes.word.setAttribute('aria-label', `Poprawnie: ${game.current.word}`);
      const reveal=()=>revealWord(nodes.word.firstElementChild,game.current.answer,reduced.matches).then(()=>{if(session===game)fitWord();});
      if(effectConfig().wordTransition?.style==='particles'){const feedbackGeneration=generation;game.setPresentationHold(true);void wordParticles?.reveal(game.current.answer,reveal,game.options.indexOf(game.selected)===0?-1:1).finally(()=>{if(session===game&&generation===feedbackGeneration)game.setPresentationHold(false);});}else void reveal();
      preloadQueuedScene(game);
      nodes.answers.forEach((button, index) => {
        button.disabled = true;
        button.classList.toggle('correct', game.options[index] === game.current.answer);
        button.classList.toggle('wrong', !correct && game.options[index] === game.selected);
      });
      nodes.hint.hidden = !correct; nodes.hint.disabled = true; nodes.next.hidden = correct;
      const rays='<svg class="feedback-rays" viewBox="0 0 30 42" fill="none" aria-hidden="true"><path d="m24 11-10-6M19 21H7m17 10-10 6" stroke="#ffd43b" stroke-width="5.5" stroke-linecap="round"/><path d="m24 10-9-5M18 20H7m16 10-9 6" stroke="#ffe879" stroke-width="1.2" stroke-linecap="round"/></svg>';
      nodes.feedback.innerHTML=correct?`${rays}<span class="feedback-copy">Pięknie!</span>${rays}`:'';
      app.classList.toggle('spelling-correct-feedback',correct);
      const effects=effectConfig(),combo=correct&&game.streak>0&&game.streak%effects.comboEvery===0;
      bubble?.react(combo?'combo':correct?'correct':'wrong');
      const preset=effects.presets[effectPreview?.id]||pickEffect(effects).preset;stopFireworks?.();stopFireworks=null;stopComboGlobal();
      if(combo&&effects.comboGlobal?.enabled!==false){comboGlobal?.play(effects);}
      else if(correct&&effects.enabled&&effects.correctStyle==='production'&&(!effectPreview?.id||effectPreview.id==='confetti'))stopFireworks=burstFireworks(app.querySelector('.spelling-visual'));
      else stopFireworks=playResponseEffect(app.querySelector('.spelling-visual'),{config:effects,preset,event:correct?'correct':'wrong',combo:false,target:app.querySelector('.soap-svg')||app.querySelector('.mn-soap-shell'),onMetrics:effectPreview?.onMetrics});
      if(combo)nodes.feedback.querySelector('.feedback-copy').textContent=`Świetna seria ×${game.streak}!`;
      if(!correct){continueDrag?.reset();nodes.next.focus({ preventScroll: true });}
    }
  }
  function setPaused(paused) {
    bubble?.setPaused(paused || Boolean(hint));
    wordParticles?.setPaused(paused);if(!paused)wordParticles?.refresh();
    if(paused){continueDrag?.reset();stopFireworks?.();stopComboGlobal();}
    animations.forEach(animation => paused ? animation.pause() : animation.play());
  }
  reduced.addEventListener('change', () => { if (reduced.matches) animations.forEach(animation => animation.finish()); });
  document.addEventListener('mala-nauka:design',()=>{if(bubble&&session&&renderer!==(effectConfig().bubble?.renderer||'classic')){const game=session;mount(game);render(game);}if(bubble)applyBubbleSettings(bubble,effectConfig());atmosphere?.update(effectConfig());wordParticles?.refresh();});
  return { render, reset, setPaused, closeHint, setEffectPreview(value){effectPreview=value;},previewReact(event){bubble?.react(event);},stopPreviewEffect(){stopFireworks?.();stopComboGlobal();} };
}
