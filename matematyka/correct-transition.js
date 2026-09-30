(() => {
  const TRANSITION_WINDOW = 1800;
  let pending = null;

  function currentQuestion() {
    const stage = document.querySelector('.quiz-stage[data-correct-answer][data-operation]');
    if (!stage) return null;
    const correct = Number(stage.dataset.correctAnswer);
    const operation = stage.dataset.operation || '';
    const equation = String(stage.querySelector('.equation')?.textContent || '').replace(/\s+/g, ' ').trim();
    if (!Number.isFinite(correct)) return null;
    return { stage, correct, operation, key: `${operation}:${equation}` };
  }

  /* Nie animujemy już starego DOM-u. Aplikacja po poprawnej odpowiedzi
     renderuje ten sam układ ponownie, więc próba flipa podczas tego renderu
     powodowała zniknięcia i przeskoki. Zielony feedback robi klasa .correct,
     a animujemy dopiero nowy, docelowy układ pytania. */
  document.addEventListener('click', event => {
    const answer = event.target.closest?.('.answer[data-answer]');
    if (!answer) return;

    const question = currentQuestion();
    if (!question) return;
    const chosen = Number(answer.dataset.answer);
    if (!Number.isFinite(chosen) || chosen !== question.correct) return;

    pending = {
      fromKey: question.key,
      startedAt: performance.now(),
    };
  }, true);

  function animateIncoming(stage) {
    if (!stage?.isConnected) return;
    stage.classList.add('correct-transition-in');
    window.setTimeout(() => {
      if (stage.isConnected) stage.classList.remove('correct-transition-in');
    }, 560);
  }

  const observer = new MutationObserver(() => {
    if (!pending) return;
    if (performance.now() - pending.startedAt > TRANSITION_WINDOW) {
      pending = null;
      return;
    }

    const question = currentQuestion();
    if (!question || question.key === pending.fromKey) return;

    pending = null;
    requestAnimationFrame(() => requestAnimationFrame(() => animateIncoming(question.stage)));
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
