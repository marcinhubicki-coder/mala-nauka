(() => {
  let pending = null;
  let applying = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function center(rect) {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function captureWrongTransition(button, stage) {
    const label = stage.querySelector('.question-label');
    const equation = stage.querySelector('.equation');
    if (!label || !equation) return;

    pending = {
      labelRect: label.getBoundingClientRect(),
      equationRect: equation.getBoundingClientRect(),
      createdAt: performance.now(),
    };
  }

  /* interaction-v45 blokuje pierwszy click, robi shake i po 500 ms wysyła drugi
     programowy click. Ten listener widzi właśnie ten drugi click i zapamiętuje
     geometrię pytania tuż przed renderem explainera. */
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-answer]');
    if (!button || button.disabled) return;

    const stage = button.closest('.quiz-stage');
    if (!stage || stage.classList.contains('has-explainer')) return;

    const selected = Number(button.dataset.answer);
    const correct = Number(stage.dataset.correctAnswer);
    if (!Number.isFinite(selected) || !Number.isFinite(correct) || selected === correct) return;

    captureWrongTransition(button, stage);
  }, true);

  function animateFromOldRect(element, oldRect, { scale = false, duration = 560 } = {}) {
    if (!element || !oldRect || reducedMotion.matches) return;

    const nextRect = element.getBoundingClientRect();
    if (!nextRect.width || !nextRect.height) return;

    const oldCenter = center(oldRect);
    const nextCenter = center(nextRect);
    const dx = oldCenter.x - nextCenter.x;
    const dy = oldCenter.y - nextCenter.y;
    const factor = scale ? Math.max(.82, Math.min(1.45, oldRect.height / nextRect.height)) : 1;

    const animation = element.animate([
      {
        transform: `translate3d(${dx}px, ${dy}px, 0) scale(${factor})`,
        opacity: 1,
      },
      {
        transform: 'translate3d(0, 0, 0) scale(1)',
        opacity: 1,
      },
    ], {
      duration,
      easing: 'cubic-bezier(.2,.78,.22,1)',
      fill: 'both',
    });

    animation.finished.finally(() => animation.cancel());
  }

  function armActionsAfterDemo(stage) {
    const buttons = [...stage.querySelectorAll('.row-expression')];
    if (!buttons.length) return;

    const maybeReady = () => {
      if (!stage.isConnected) return true;
      if (buttons.every(button => !button.disabled)) {
        stage.classList.add('sequence-actions-ready');
        return true;
      }
      return false;
    };

    if (maybeReady()) return;

    const observer = new MutationObserver(() => {
      if (maybeReady()) observer.disconnect();
    });
    buttons.forEach(button => observer.observe(button, { attributes: true, attributeFilter: ['disabled'] }));

    window.setTimeout(() => {
      if (stage.isConnected) stage.classList.add('sequence-actions-ready');
      observer.disconnect();
    }, 3900);
  }

  function applySequence(stage) {
    if (!pending || applying || !stage?.isConnected || !stage.classList.contains('has-explainer')) return;
    applying = true;

    const snapshot = pending;
    pending = null;
    stage.classList.add('wrong-transition-sequence');

    const label = stage.querySelector('.question-label');
    const equation = stage.querySelector('.equation');

    animateFromOldRect(label, snapshot.labelRect, { scale: false, duration: 520 });
    animateFromOldRect(equation, snapshot.equationRect, { scale: true, duration: 580 });
    armActionsAfterDemo(stage);

    queueMicrotask(() => { applying = false; });
  }

  function scan() {
    if (!pending) return;
    const stage = document.querySelector('#app .quiz-stage.has-explainer');
    if (stage) applySequence(stage);
  }

  const start = () => {
    const app = document.querySelector('#app');
    if (!app) return;

    const observer = new MutationObserver(scan);
    observer.observe(app, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
