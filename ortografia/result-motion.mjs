// Match mathematics/stability-v33: cubic count-up, 620 ms, 120 ms glyph handoff.
const DURATION = 620, HANDOFF = 120;
const presentations = new WeakMap();
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  const target = Number(fill.dataset.percent);
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  fill.style.width = '0%';
  section.classList.add('result-entering');
  section.style.setProperty('--reveal-delay', delay + 'ms');
  let frame = 0, timer = 0, handoff = 0, started = performance.now(), done = false;
  function cleanup() {
    if (done) return;
    done = true;
    cancelAnimationFrame(frame); clearTimeout(timer); clearTimeout(handoff);
    jobs.forEach(({host, overlay}) => {overlay.remove(); host.classList.remove('result-counting', 'result-count-handoff'); host.style.removeProperty('--count-color');});
    fill.style.width = target + '%';
    section.classList.remove('result-entering');
    section.style.removeProperty('--reveal-delay');
    document.removeEventListener('visibilitychange', visibility);
    preference.removeEventListener('change', preferenceChanged);
    if (presentations.get(root) === cleanup) presentations.delete(root);
  }
  function visibility() {if (document.hidden) cleanup();}
  function preferenceChanged() {if (preference.matches) cleanup();}
  function tick(now) {
    if (!section.isConnected || reduced()) return cleanup();
    const elapsed = now - started;
    let unfinished = false;
    jobs.forEach(job => {
      const t = Math.max(0, Math.min(1, (elapsed - job.delay) / DURATION));
      const value = Math.round(job.value * (1 - (1-t) ** 3));
      if (job.last !== value) {job.overlay.textContent = String(value); job.last = value;}
      if (t < 1) unfinished = true;
      else job.host.classList.add('result-count-handoff');
    });
    const t = Math.max(0, Math.min(1, (elapsed - delay - 120) / DURATION));
    fill.style.width = target * (1 - (1-t) ** 3) + '%';
    if (unfinished) frame = requestAnimationFrame(tick);
    else handoff = setTimeout(cleanup, HANDOFF + 24);
  }
  // One finite RAF loop for every counter and the fill, started only when visible.
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
  }
}
