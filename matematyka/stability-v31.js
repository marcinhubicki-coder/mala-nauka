(() => {
  let cachedGeometry = null;
  let cachedViewport = '';
  let raf = 0;

  function viewportKey() {
    return `${window.innerWidth}x${window.innerHeight}`;
  }

  function ensureTimerScaffold() {
    const quiz = document.querySelector('[data-math-quiz]');
    const app = document.querySelector('#app');
    const topbar = app?.querySelector(':scope > .topbar');
    if (!quiz || !topbar) return false;

    topbar.classList.add('math-timed');
    const slot = topbar.lastElementChild;
    if (slot && !slot.querySelector('.math-round-time')) {
      slot.innerHTML = '<div class="math-round-time" aria-label="Pozostały czas rundy"><span></span></div>';
    }

    let progress = app.querySelector(':scope > .math-round-progress');
    if (!progress) {
      progress = document.createElement('div');
      progress.className = 'math-round-progress';
      progress.innerHTML = '<span></span>';
      topbar.insertAdjacentElement('afterend', progress);
    }
    return true;
  }

  function clearInlineLock(stage) {
    if (!stage) return;
    stage.removeAttribute('data-normal-geometry-locked');
    stage.style.removeProperty('--normal-stage-height');
    stage.style.removeProperty('--normal-question-top');
    stage.style.removeProperty('--normal-question-height');
    stage.style.removeProperty('--normal-answers-top');
    stage.style.removeProperty('--normal-answers-height');
    stage.style.removeProperty('--normal-feedback-top');
    stage.style.removeProperty('--normal-feedback-height');
  }

  function measure(stage) {
    const question = stage.querySelector('.question-block');
    const answers = stage.querySelector('.answer-grid');
    const feedback = stage.querySelector('.feedback');
    if (!question || !answers || !feedback) return null;

    const stageRect = stage.getBoundingClientRect();
    const questionRect = question.getBoundingClientRect();
    const answersRect = answers.getBoundingClientRect();
    const feedbackRect = feedback.getBoundingClientRect();
    if (!(stageRect.height > 0 && answersRect.height > 0)) return null;

    return {
      stageHeight: stageRect.height,
      questionTop: questionRect.top - stageRect.top,
      questionHeight: questionRect.height,
      answersTop: answersRect.top - stageRect.top,
      answersHeight: answersRect.height,
      feedbackTop: feedbackRect.top - stageRect.top,
      feedbackHeight: Math.max(26, feedbackRect.height),
    };
  }

  function apply(stage, geometry) {
    if (!stage || !geometry) return;
    stage.style.setProperty('--normal-stage-height', `${geometry.stageHeight}px`);
    stage.style.setProperty('--normal-question-top', `${geometry.questionTop}px`);
    stage.style.setProperty('--normal-question-height', `${geometry.questionHeight}px`);
    stage.style.setProperty('--normal-answers-top', `${geometry.answersTop}px`);
    stage.style.setProperty('--normal-answers-height', `${geometry.answersHeight}px`);
    stage.style.setProperty('--normal-feedback-top', `${geometry.feedbackTop}px`);
    stage.style.setProperty('--normal-feedback-height', `${geometry.feedbackHeight}px`);
    stage.dataset.normalGeometryLocked = '1';
  }

  function lockNormalStage(stage) {
    if (!stage?.isConnected || stage.classList.contains('has-explainer')) return;
    if (!stage.querySelector('.answer-grid')) return;

    const key = viewportKey();
    if (cachedGeometry && cachedViewport === key) {
      apply(stage, cachedGeometry);
      return;
    }

    clearInlineLock(stage);
    const geometry = measure(stage);
    if (!geometry) return;
    cachedGeometry = geometry;
    cachedViewport = key;
    apply(stage, geometry);
  }

  function stabilize() {
    /* Najpierw stały topbar + pasek. Dopiero z takim finalnym szkieletem
       mierzymy ekran pytania. MutationObserver wykonuje się przed paintem. */
    ensureTimerScaffold();
    document.querySelectorAll('.quiz-stage:not(.has-explainer)').forEach(lockNormalStage);
  }

  function schedule() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(stabilize);
  }

  const observer = new MutationObserver(() => {
    /* Tutaj nie czekamy na timeouty animacji. Struktura i wysokości są ustalone
       zanim przeglądarka pokaże nowy render pytania. */
    stabilize();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('resize', () => {
    cachedGeometry = null;
    cachedViewport = '';
    document.querySelectorAll('.quiz-stage[data-normal-geometry-locked="1"]').forEach(clearInlineLock);
    schedule();
  }, { passive: true });

  stabilize();
})();
