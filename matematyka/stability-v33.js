(() => {
  const DURATION = 620;
  const ANSWER_STAGGER = 26;
  let pending = null;
  let frame = 0;

  function number(value) {
    const parsed = Number(String(value ?? '').replace(/[^0-9-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function currentQuestion() {
    const stage = document.querySelector('.quiz-stage[data-correct-answer][data-operation]:not(.has-explainer)');
    if (!stage || !stage.querySelector('.answer-grid')) return null;
    const equation = [...stage.querySelectorAll('.equation-number')].map(node => number(node.textContent));
    const answers = [...stage.querySelectorAll('.answer[data-answer]')].map(node => number(node.dataset.answer));
    const correct = Number(stage.dataset.correctAnswer);
    const operation = stage.dataset.operation || '';
    if (!Number.isFinite(correct) || equation.some(v => v === null) || answers.some(v => v === null)) return null;
    return {
      stage,
      equation,
      answers,
      correct,
      key: `${operation}:${equation.join(':')}:${correct}`,
    };
  }

  function ease(t) {
    // miękkie ease-out bez overshootu; pozycja hosta nigdy się nie zmienia
    return 1 - Math.pow(1 - t, 3);
  }

  function animateValue(host, from, to, delay = 0) {
    if (!host || !Number.isFinite(from) || !Number.isFinite(to) || from === to) return;

    const color = getComputedStyle(host).color;
    host.style.setProperty('--math-overlay-color', color);
    host.classList.add('math-value-host', 'math-value-animating');

    const overlay = document.createElement('span');
    overlay.className = 'math-number-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.textContent = String(Math.round(from));
    host.appendChild(overlay);

    const start = performance.now() + delay;

    const tick = now => {
      if (!host.isConnected || !overlay.isConnected) return;
      if (now < start) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const t = Math.min(1, (now - start) / DURATION);
      const value = Math.round(from + (to - from) * ease(t));
      overlay.textContent = String(value);

      if (t < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }

      overlay.remove();
      host.classList.remove('math-value-animating', 'math-value-host');
      host.style.removeProperty('--math-overlay-color');
    };

    frame = requestAnimationFrame(tick);
  }

  function animateInto(stage, snapshot) {
    if (!stage?.isConnected || !snapshot) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const equationHosts = [...stage.querySelectorAll('.equation-number')];
    equationHosts.forEach((host, index) => {
      animateValue(host, snapshot.equation[index], number(host.textContent), 0);
    });

    const answerHosts = [...stage.querySelectorAll('.answer[data-answer]')];
    answerHosts.forEach((host, index) => {
      animateValue(host, snapshot.answers[index], number(host.dataset.answer), index * ANSWER_STAGGER);
    });
  }

  document.addEventListener('click', event => {
    const answer = event.target.closest?.('.answer[data-answer]');
    if (!answer) return;
    const question = currentQuestion();
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

    const question = currentQuestion();
    if (!question || question.key === pending.key) return;

    const snapshot = pending;
    pending = null;
    animateInto(question.stage, snapshot);
  }

  const observer = new MutationObserver(process);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
