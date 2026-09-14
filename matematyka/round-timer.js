(() => {
  const DURATIONS = [60, 120, 180, 300];
  const STORAGE_KEY = 'malaNauka.math.duration';
  const SHARED_CONFIG_KEY = 'malaNauka.v1.configs';

  let selectedDuration = readDuration();
  let round = null;
  let startingFromButton = false;

  function readDuration() {
    try {
      const direct = Number(localStorage.getItem(STORAGE_KEY));
      if (DURATIONS.includes(direct)) return direct;
      const configs = JSON.parse(localStorage.getItem(SHARED_CONFIG_KEY) || '{}');
      const shared = Number(configs?.math?.duration);
      if (DURATIONS.includes(shared)) return shared;
    } catch {}
    return 180;
  }

  function saveDuration(duration) {
    if (!DURATIONS.includes(duration)) return;
    selectedDuration = duration;
    try {
      localStorage.setItem(STORAGE_KEY, String(duration));
      const configs = JSON.parse(localStorage.getItem(SHARED_CONFIG_KEY) || '{}');
      configs.math = { ...(configs.math || {}), duration };
      localStorage.setItem(SHARED_CONFIG_KEY, JSON.stringify(configs));
    } catch {}
  }

  function formatDuration(seconds) {
    return `${seconds / 60} min`;
  }

  function formatRemaining(milliseconds) {
    const total = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function decorateSetupHeader() {
    const categories = document.querySelector('.category-grid');
    const quiz = document.querySelector('.quiz-screen');
    if (!categories || quiz) return;

    const brand = document.querySelector('.topbar .brand');
    if (brand && !brand.querySelector('.math-home-link')) {
      brand.innerHTML = `
        <a class="math-home-link" href="../" aria-label="Wróć do Małej Nauki i wybierz tryb">
          <img src="../assets/icon-192.png" alt="" width="24" height="24">
          <span>Mała Nauka</span>
        </a>
      `;
    }

    // Usuwamy opis prototypu — na tym ekranie zostaje tylko decyzja: czas i tryb.
    document.querySelector('.hero > p:not(.eyebrow)')?.remove();
  }

  function installSetupControls() {
    const grid = document.querySelector('.category-grid');
    if (!grid || !grid.parentElement) return;

    let timerPanel = document.querySelector('.math-duration-setup');
    if (!timerPanel) {
      timerPanel = document.createElement('section');
      timerPanel.className = 'math-duration-setup';
      timerPanel.innerHTML = `
        <div class="math-duration-heading">Czas rozgrywki</div>
        <div class="math-duration-choices" role="group" aria-label="Czas rundy">
          ${DURATIONS.map((duration) => `
            <button type="button" class="math-duration-choice ${duration === selectedDuration ? 'is-selected' : ''}" data-math-duration="${duration}">
              ${formatDuration(duration)}
            </button>
          `).join('')}
        </div>
      `;
    }

    if (timerPanel.nextElementSibling !== grid) {
      grid.parentElement.insertBefore(timerPanel, grid);
    }

    let startPanel = document.querySelector('.math-start-panel');
    if (!startPanel) {
      startPanel = document.createElement('div');
      startPanel.className = 'math-start-panel';
      startPanel.innerHTML = `
        <button type="button" class="math-start-button" data-math-start>
          Rozpocznij
          <span aria-hidden="true">→</span>
        </button>
      `;
    }

    if (grid.nextElementSibling !== startPanel) {
      grid.insertAdjacentElement('afterend', startPanel);
    }
  }

  function startRound() {
    round = {
      duration: selectedDuration * 1000,
      remaining: selectedDuration * 1000,
      lastTime: performance.now(),
      correct: 0,
      wrong: 0,
      ended: false,
    };
  }

  function ensureTimerUi() {
    const quiz = document.querySelector('.quiz-screen');
    if (!quiz) return;
    if (!round || round.ended) {
      if (!round) startRound();
      if (round?.ended) return;
    }

    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    topbar.classList.add('math-timed');

    const slot = topbar.lastElementChild;
    if (slot && !slot.querySelector('.math-round-time')) {
      slot.innerHTML = '<div class="math-round-time" aria-label="Pozostały czas rundy"><span></span></div>';
    }

    if (!document.querySelector('.math-round-progress')) {
      const progress = document.createElement('div');
      progress.className = 'math-round-progress';
      progress.innerHTML = '<span></span>';
      topbar.insertAdjacentElement('afterend', progress);
    }

    updateTimerUi();
  }

  function updateTimerUi() {
    if (!round) return;
    const paused = Boolean(document.querySelector('.quiz-stage.has-explainer'));
    const time = document.querySelector('.math-round-time');
    const text = time?.querySelector('span');
    const bar = document.querySelector('.math-round-progress > span');

    if (text) text.textContent = `${paused ? 'Ⅱ ' : ''}${formatRemaining(round.remaining)}`;
    time?.classList.toggle('is-paused', paused);
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, round.remaining / round.duration * 100))}%`;
  }

  function equationResult() {
    const values = [...document.querySelectorAll('.question-block .equation-number')]
      .map((node) => Number(node.textContent));
    if (values.length < 2 || values.some((value) => !Number.isFinite(value))) return null;
    return values[0] * values[1];
  }

  function endRound() {
    if (!round || round.ended) return;
    round.ended = true;
    round.remaining = 0;
    updateTimerUi();

    const overlay = document.createElement('div');
    overlay.className = 'math-time-over';
    overlay.innerHTML = `
      <section class="math-time-over-card" role="dialog" aria-modal="true" aria-labelledby="math-time-over-title">
        <span class="math-time-over-icon" aria-hidden="true">✦</span>
        <h2 id="math-time-over-title">Koniec czasu</h2>
        <p><strong>${round.correct}</strong> poprawnych · <strong>${round.wrong}</strong> błędnych</p>
        <div class="math-time-over-actions">
          <button type="button" class="math-time-again">Jeszcze raz</button>
          <button type="button" class="math-time-back">Wróć</button>
        </div>
      </section>
    `;
    document.body.append(overlay);
  }

  function scan() {
    const quiz = document.querySelector('.quiz-screen');
    const categories = document.querySelector('.category-grid');

    if (categories && !quiz) {
      if (round && !round.ended) round = null;
      decorateSetupHeader();
      installSetupControls();
      return;
    }

    if (quiz) ensureTimerUi();
  }

  // Capture pozwala rozdzielić wybór „Mnożenie” od uruchomienia rundy.
  // Jedynym startem jest teraz wyraźny przycisk „Rozpocznij”.
  document.addEventListener('click', (event) => {
    const durationButton = event.target.closest?.('[data-math-duration]');
    if (durationButton) {
      const duration = Number(durationButton.dataset.mathDuration);
      saveDuration(duration);
      document.querySelectorAll('[data-math-duration]').forEach((button) => {
        button.classList.toggle('is-selected', Number(button.dataset.mathDuration) === duration);
      });
      return;
    }

    const multiply = event.target.closest?.('[data-category="multiply"]');
    if (multiply && !startingFromButton && document.querySelector('.category-grid')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.querySelectorAll('.category-card').forEach((card) => card.classList.remove('is-selected-mode'));
      multiply.classList.add('is-selected-mode');
      return;
    }

    const startButton = event.target.closest?.('[data-math-start]');
    if (startButton) {
      const target = document.querySelector('[data-category="multiply"]');
      if (!target) return;
      startingFromButton = true;
      startRound();
      target.click();
      window.setTimeout(() => { startingFromButton = false; }, 0);
      return;
    }

    const answer = event.target.closest?.('[data-answer]');
    if (answer && round && !round.ended && document.querySelector('.quiz-screen')) {
      const correct = equationResult();
      const chosen = Number(answer.dataset.answer);
      if (Number.isFinite(correct) && Number.isFinite(chosen)) {
        if (chosen === correct) round.correct += 1;
        else round.wrong += 1;
      }
      return;
    }

    if (event.target.closest?.('.math-time-again')) {
      location.reload();
      return;
    }

    if (event.target.closest?.('.math-time-back')) {
      location.reload();
    }
  }, true);

  document.addEventListener('visibilitychange', () => {
    if (round) round.lastTime = performance.now();
  });

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  function tick(now) {
    if (round && !round.ended && document.querySelector('.quiz-screen')) {
      const paused = document.hidden || Boolean(document.querySelector('.quiz-stage.has-explainer'));
      const elapsed = Math.max(0, now - round.lastTime);
      round.lastTime = now;

      if (!paused) {
        round.remaining = Math.max(0, round.remaining - elapsed);
        if (round.remaining <= 0) endRound();
      }
      updateTimerUi();
    }
    requestAnimationFrame(tick);
  }

  scan();
  requestAnimationFrame(tick);
})();