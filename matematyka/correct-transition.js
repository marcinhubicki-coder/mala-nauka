(() => {
  const TRANSITION_WINDOW = 1700;
  let pending = null;
  let ignoreUntil = 0;

  function numberFromText(node) {
    const value = Number(String(node?.textContent || '').replace(/[^0-9-]/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  function currentEquation() {
    const values = [...document.querySelectorAll('.question-block .equation-number')].map(numberFromText);
    if (values.length < 2 || values.some((value) => value == null)) return null;
    return { a: values[0], b: values[1], result: values[0] * values[1] };
  }

  function questionKey() {
    const q = currentEquation();
    return q ? `${q.a}x${q.b}` : '';
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
      answers.forEach((button) => button.classList.remove('correct-transition-late-slot'));
    }, 760);
  }

  document.addEventListener('click', (event) => {
    const answer = event.target.closest?.('.answer[data-answer]');
    if (!answer || performance.now() < ignoreUntil) return;

    const equation = currentEquation();
    if (!equation) return;
    const chosen = Number(answer.dataset.answer);
    if (!Number.isFinite(chosen) || chosen !== equation.result) return;

    const answers = [...document.querySelectorAll('.answer[data-answer]')];
    const selectedIndex = Math.max(0, answers.indexOf(answer));
    pending = {
      fromKey: questionKey(),
      chosen,
      selectedIndex,
      startedAt: performance.now(),
    };

    // Bazowa aplikacja natychmiast renderuje stan „Dobrze!”. Poczekaj na ten render
    // i animuj właśnie jego kafle, nie stary DOM spod palca.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!pending) return;
      startOutgoing(pending.chosen, pending.selectedIndex);
    }));
  }, true);

  const observer = new MutationObserver(() => {
    if (!pending) return;
    if (performance.now() - pending.startedAt > TRANSITION_WINDOW) {
      pending = null;
      return;
    }

    const key = questionKey();
    if (!key || key === pending.fromKey) return;

    const selectedIndex = pending.selectedIndex;
    pending = null;
    ignoreUntil = performance.now() + 180;
    requestAnimationFrame(() => animateIncoming(selectedIndex));
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
