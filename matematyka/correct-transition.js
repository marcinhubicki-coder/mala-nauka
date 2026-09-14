(() => {
  const TRANSITION_WINDOW = 1700;
  let pending = null;
  let ignoreUntil = 0;

  function currentQuestion() {
    const stage = document.querySelector('.quiz-stage[data-correct-answer][data-operation]');
    if (!stage) return null;
    const correct = Number(stage.dataset.correctAnswer);
    const operation = stage.dataset.operation || '';
    const equation = String(stage.querySelector('.equation')?.textContent || '').replace(/\s+/g, ' ').trim();
    if (!Number.isFinite(correct)) return null;
    return { correct, operation, key: `${operation}:${equation}` };
  }

  function startOutgoing(chosen, selectedIndex) {
    const stage = document.querySelector('.quiz-stage');
    const answers = [...document.querySelectorAll('.answer[data-answer]')];
    if (!stage || !answers.length) return;

    stage.classList.add('correct-transition-out');
    answers.forEach((button, index) => {
      button.disabled = true;
      if (Number(button.dataset.answer) === chosen) {
        button.classList.add('correct-transition-hit', 'correct-transition-late');
      } else {
        button.classList.add('correct-transition-flip');
      }
      if (index === selectedIndex) button.dataset.correctTransitionSlot = '1';
    });
  }

  function animateIncoming(selectedIndex) {
    const stage = document.querySelector('.quiz-stage');
    const answers = [...document.querySelectorAll('.answer[data-answer]')];
    if (!stage || !answers.length) return;

    stage.classList.remove('correct-transition-out');
    stage.classList.add('correct-transition-in');
    answers.forEach((button, index) => {
      if (index === selectedIndex) button.classList.add('correct-transition-late-slot');
    });

    window.setTimeout(() => {
      stage.classList.remove('correct-transition-in');
      answers.forEach(button => button.classList.remove('correct-transition-late-slot'));
    }, 760);
  }

  document.addEventListener('click', event => {
    const answer = event.target.closest?.('.answer[data-answer]');
    if (!answer || performance.now() < ignoreUntil) return;

    const question = currentQuestion();
    if (!question) return;
    const chosen = Number(answer.dataset.answer);
    if (!Number.isFinite(chosen) || chosen !== question.correct) return;

    const answers = [...document.querySelectorAll('.answer[data-answer]')];
    pending = {
      fromKey: question.key,
      chosen,
      selectedIndex: Math.max(0, answers.indexOf(answer)),
      startedAt: performance.now(),
    };

    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (pending) startOutgoing(pending.chosen, pending.selectedIndex);
    }));
  }, true);

  const observer = new MutationObserver(() => {
    if (!pending) return;
    if (performance.now() - pending.startedAt > TRANSITION_WINDOW) {
      pending = null;
      return;
    }

    const question = currentQuestion();
    if (!question || question.key === pending.fromKey) return;

    const selectedIndex = pending.selectedIndex;
    pending = null;
    ignoreUntil = performance.now() + 180;
    requestAnimationFrame(() => animateIncoming(selectedIndex));
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
