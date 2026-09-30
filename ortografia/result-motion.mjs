// The counters stay compact; the score bar uses the tuned Progress Bar Lab preset.
const NUMBER_DURATION = 900;
const PROGRESS_DURATION = 3000;
const PROGRESS_EASE_POWER = 3.2 / 1.75;
const PROGRESS_STRETCH = .5;
const PROGRESS_BOUNCE = 2.1;
const PROGRESS_WOBBLE = .2;
const PROGRESS_START_KICK = 2;
const PROGRESS_FLASH = .35;
const PROGRESS_FINISH_MS = 950;
const HANDOFF = 120;
const presentations = new WeakMap();
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function settleResult(root) {
  presentations.get(root)?.();
}

export function revealResult(root, delay = 1000) {
  settleResult(root);
  if (reduced() || document.hidden) return;
  const section = root.querySelector('.result-v4');
  if (!section) return;
  const jobs = [...section.querySelectorAll('[data-count]')].map(host => {
    const overlay = document.createElement('span');
    overlay.className = 'result-number-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.textContent = '0';
    host.style.setProperty('--count-color', getComputedStyle(host).color);
    host.classList.add('result-counting');
    host.append(overlay);
    return {host, overlay, value: Number(host.dataset.count), delay: delay + (host.closest('.learning-stats-two') ? 260 : 120), last: 0};
  });
  const fill = section.querySelector('.round-progress-fill');
  if (!fill) return;
  const cap = fill.querySelector('.round-progress-cap');
  const target = clamp(Number(fill.dataset.percent) || 0, 0, 100);
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  fill.style.width = '0%';
  fill.style.transform = '';
  section.classList.remove('progress-complete');
  section.classList.add('result-entering');
  section.style.setProperty('--reveal-delay', delay + 'ms');
  let frame = 0, timer = 0, handoff = 0, started = performance.now(), done = false, finishStarted = false;
  const finishAnimations = [];

  function cleanup() {
    if (done) return;
    done = true;
    cancelAnimationFrame(frame); clearTimeout(timer); clearTimeout(handoff);
    finishAnimations.forEach(animation => { try { animation.cancel(); } catch {} });
    jobs.forEach(({host, overlay}) => {overlay.remove(); host.classList.remove('result-counting', 'result-count-handoff'); host.style.removeProperty('--count-color');});
    fill.style.width = target + '%';
    fill.style.transform = '';
    section.classList.remove('result-entering', 'progress-complete');
    section.style.removeProperty('--reveal-delay');
    document.removeEventListener('visibilitychange', visibility);
    preference.removeEventListener('change', preferenceChanged);
    if (presentations.get(root) === cleanup) presentations.delete(root);
  }

  function finishProgress() {
    if (finishStarted || target <= 0) return;
    finishStarted = true;
    section.classList.add('progress-complete');
    if (reduced()) return;

    if (cap) {
      const pop = 1 + .025 * PROGRESS_BOUNCE;
      const peak = pop + .035 * PROGRESS_STRETCH;
      const recoil = 1 - .018 * PROGRESS_BOUNCE;
      finishAnimations.push(cap.animate([
        {transform:'scaleX(1) scaleY(1)',filter:'brightness(1)'},
        {transform:`scaleX(${peak.toFixed(3)}) scaleY(1)`,filter:`brightness(${(1 + .18 * PROGRESS_FLASH).toFixed(3)})`,offset:.38},
        {transform:`scaleX(${recoil.toFixed(3)}) scaleY(1.015)`,filter:'brightness(1.05)',offset:.72},
        {transform:'scaleX(1) scaleY(1)',filter:'brightness(1)'}
      ],{duration:Math.round(520 + 160 * PROGRESS_BOUNCE),easing:'cubic-bezier(.16,.78,.2,1)'}));
    }

    finishAnimations.push(fill.animate([
      {filter:'brightness(1.15)'},
      {filter:`brightness(${(1.15 * (1 + .18 * PROGRESS_FLASH)).toFixed(3)})`,offset:.42},
      {filter:'brightness(1.15)'}
    ],{duration:Math.round(560 + 120 * PROGRESS_FLASH),easing:'ease-out'}));
  }

  function visibility() {if (document.hidden) cleanup();}
  function preferenceChanged() {if (preference.matches) cleanup();}

  function tick(now) {
    if (!section.isConnected || reduced()) return cleanup();
    const elapsed = now - started;
    let unfinished = false;

    jobs.forEach(job => {
      const t = clamp((elapsed - job.delay) / NUMBER_DURATION, 0, 1);
      const value = Math.round(job.value * (1 - (1 - t) ** 3));
      if (job.last !== value) {job.overlay.textContent = String(value); job.last = value;}
      if (t < 1) unfinished = true;
      else job.host.classList.add('result-count-handoff');
    });

    const progressT = clamp((elapsed - delay - 120) / PROGRESS_DURATION, 0, 1);
    const eased = 1 - Math.pow(1 - progressT, PROGRESS_EASE_POWER);
    const kick = target > 0 ? PROGRESS_START_KICK * Math.exp(-progressT * 9) * Math.sin(progressT * Math.PI * 3.2) * 1.2 : 0;
    const wobble = target > 0 ? PROGRESS_WOBBLE * Math.sin(progressT * Math.PI * 4.3) * Math.pow(1 - progressT, 1.7) : 0;
    const visual = progressT >= 1 ? target : clamp(target * eased + kick + wobble, 0, target);
    fill.style.width = visual + '%';

    const stretch = 1 + PROGRESS_STRETCH * Math.sin(Math.min(1, progressT * 1.45) * Math.PI) * .035;
    fill.style.transform = progressT >= 1 ? '' : `scaleX(${stretch.toFixed(4)})`;

    if (progressT < 1) unfinished = true;

    if (unfinished) {
      frame = requestAnimationFrame(tick);
    } else {
      fill.style.width = target + '%';
      fill.style.transform = '';
      finishProgress();
      handoff = setTimeout(cleanup, target > 0 ? PROGRESS_FINISH_MS + 100 : HANDOFF + 24);
    }
  }

  timer = setTimeout(() => {frame = requestAnimationFrame(tick);}, delay + 120);
  presentations.set(root, cleanup);
  document.addEventListener('visibilitychange', visibility);
  preference.addEventListener('change', preferenceChanged);
}

export async function transitionToResult(root, freeze, render) {
  if (reduced() || document.hidden) {render(false); return;}
  freeze();
  root.inert = true;
  document.documentElement.classList.add('result-transition');
  let transition, animation;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const skip = () => {transition?.skipTransition(); animation?.finish(); settleResult(root);};
  const visibility = () => {if (document.hidden) skip();};
  const preferenceChanged = () => {if (preference.matches) skip();};
  document.addEventListener('visibilitychange', visibility);
  preference.addEventListener('change', preferenceChanged);
  try {
    if (document.startViewTransition) {
      // The outgoing scene is a browser snapshot; its game simulation is paused.
      transition = document.startViewTransition(() => render(true, 2500));
      await transition.ready.catch(() => {settleResult(root);});
      await transition.finished;
    } else {
      // Older iOS: keep the paused scene in place, including its body background.
      document.documentElement.classList.add('result-transition-fallback');
      const body = document.body;
      document.getAnimations().forEach(animation => animation.pause());
      animation = body.animate([{filter:'blur(0)',opacity:1},{filter:'blur(28px)',opacity:0}],{duration:1500,easing:'ease-in',fill:'forwards'});
      await animation.finished; render(true, 1000); animation.cancel();
      if (!document.hidden && !reduced()) {
        animation = body.animate([{filter:'blur(28px)',opacity:0},{filter:'blur(0)',opacity:1}],{duration:1500,easing:'ease-out'});
        await animation.finished;
      }
    }
  } finally {
    document.removeEventListener('visibilitychange', visibility);
    preference.removeEventListener('change', preferenceChanged);
    document.documentElement.classList.remove('result-transition', 'result-transition-fallback');
    root.inert = false;
    if (!document.hidden && root.dataset.view === 'results') root.querySelector('h1')?.focus({preventScroll: true});
  }
}
