(() => {
  const TWEEN_MS = 620;
  let pending = null;

  function number(value) {
    const parsed = Number(String(value ?? '').replace(/[^0-9-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function currentNormalQuestion() {
    const stage = document.querySelector('.quiz-stage[data-correct-answer][data-operation]:not(.has-explainer)');
    if (!stage || !stage.querySelector('.answer-grid')) return null;
    const equation = [...stage.querySelectorAll('.equation-number')].map(node => number(node.textContent));
    const answers = [...stage.querySelectorAll('.answer[data-answer]')].map(node => number(node.dataset.answer));
    const operation = stage.dataset.operation || '';
    const correct = Number(stage.dataset.correctAnswer);
    if (!Number.isFinite(correct) || equation.some(value => value === null) || answers.some(value => value === null)) return null;
    return {
      stage,
      operation,
      correct,
      equation,
      answers,
      key: `${operation}:${equation.join(':')}:${correct}`,
    };
  }

  function prepare(element, from, to, delay = 0) {
    if (!element || !Number.isFinite(from) || !Number.isFinite(to) || from === to) return null;
    const color = getComputedStyle(element).color;
    element.style.setProperty('--math-counter-color', color);
    element.style.setProperty('--math-counter', String(Math.round(from)));
    element.style.setProperty('--math-counter-delay', `${delay}ms`);
    element.classList.add('math-counter-tween');
    getComputedStyle(element).getPropertyValue('--math-counter');
    return { element, to: Math.round(to) };
  }

  function animateInto(stage, snapshot) {
    if (!stage?.isConnected || !snapshot) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tweens = [];
    [...stage.querySelectorAll('.equation-number')].forEach((element, index) => {
      const item = prepare(element, snapshot.equation[index], number(element.textContent), 0);
      if (item) tweens.push(item);
    });

    [...stage.querySelectorAll('.answer[data-answer]')].forEach((element, index) => {
      const item = prepare(element, snapshot.answers[index], number(element.dataset.answer), index * 28);
      if (item) tweens.push(item);
    });

    if (!tweens.length) return;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      tweens.forEach(({ element, to }) => {
        if (element.isConnected) element.style.setProperty('--math-counter', String(to));
      });
    }));

    window.setTimeout(() => {
      tweens.forEach(({ element }) => {
        if (!element.isConnected) return;
        element.classList.remove('math-counter-tween');
        element.style.removeProperty('--math-counter');
        element.style.removeProperty('--math-counter-color');
        element.style.removeProperty('--math-counter-delay');
      });
    }, TWEEN_MS + 220);
  }

  document.addEventListener('click', event => {
    const answer = event.target.closest?.('.answer[data-answer]');
    if (!answer) return;
    const question = currentNormalQuestion();
    if (!question) return;
    if (number(answer.dataset.answer) !== question.correct) return;

    pending = {
      key: question.key,
      equation: question.equation,
      answers: question.answers,
      startedAt: performance.now(),
    };
  }, true);

  function process() {
    if (!pending) return;
    if (performance.now() - pending.startedAt > 2400) {
      pending = null;
      return;
    }

    const question = currentNormalQuestion();
    if (!question || question.key === pending.key) return;

    const snapshot = pending;
    pending = null;
    animateInto(question.stage, snapshot);
  }

  const observer = new MutationObserver(process);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
