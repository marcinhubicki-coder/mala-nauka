// Reel counters and the score bar share one 3 s timeline.
const PROGRESS_DURATION = 3000;
const PROGRESS_EASE_POWER = 3.2 / 1.75;
const PROGRESS_STRETCH = .5;
const PROGRESS_BOUNCE = 2.1;
const PROGRESS_WOBBLE = .2;
const PROGRESS_START_KICK = 2;
const PROGRESS_FLASH = .35;
const PROGRESS_FINISH_MS = 950;
const REEL_SETTLE_START = .76;
const HUNDRED_PAUSE = 120;
const HUNDRED_KICK = 180;
const HANDOFF = 120;
const presentations = new WeakMap();
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function makeRng(seed) {
  let x = (seed >>> 0) || 0x6d2b79f5;
  return () => {
    x += 0x6d2b79f5;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spinDigit(span, digit, duration = 90) {
  const text = String(digit);
  if (span.textContent === text) return;
  span.textContent = text;
  span.getAnimations?.().forEach(animation => animation.cancel());
  span.animate?.([
    { transform: 'translateY(-13%) rotateX(20deg)', filter: 'blur(.8px)', opacity: .72 },
    { transform: 'translateY(0) rotateX(0)', filter: 'blur(0)', opacity: 1 }
  ], {
    duration: clamp(duration, 70, 180),
    easing: 'cubic-bezier(.2,.72,.2,1)'
  });
}

function setupReel(host, index) {
  const value = Math.max(0, Math.round(Number(host.dataset.count) || 0));
  const mode = host.dataset.reel || 'compact2';
  const hundred = mode === 'percent' && value === 100;
  const reelTarget = hundred ? 99 : clamp(value, 0, 99);
  const target = String(reelTarget).padStart(2, '0').slice(-2).split('').map(Number);
  const seed = ((value + 17) * 2654435761) ^ ((index + 1) * 1597334677) ^ Math.floor(performance.now());
  const rng = makeRng(seed);
  host.classList.add('result-reel');
  host.setAttribute('aria-label', String(value));

  if (mode === 'percent') {
    host.innerHTML = '<span class="result-reel-digit result-reel-hundreds" aria-hidden="true">1</span><span class="result-reel-digit" aria-hidden="true">0</span><span class="result-reel-digit" aria-hidden="true">0</span>';
  } else {
    host.innerHTML = '<span class="result-reel-digit" aria-hidden="true">0</span><span class="result-reel-digit" aria-hidden="true">0</span>';
  }

  const allDigits = [...host.querySelectorAll('.result-reel-digit')];
  const digits = allDigits.slice(-2);
  return {
    host, value, mode, hundred, target, digits,
    hundredDigit: mode === 'percent' ? allDigits[0] : null,
    current: [0, 0],
    nextShuffle: [0, 18 + rng() * 20],
    plans: null,
    finalized: false,
    rng
  };
}

function beginSettle(job) {
  if (job.plans) return;
  job.plans = job.current.map((start, index) => {
    const target = job.target[index];
    const turns = 1 + Math.floor(job.rng() * 3) + (index === 1 ? 1 : 0);
    const offset = (target - start + 10) % 10;
    return { start, target, total: turns * 10 + offset, lastStep: 0 };
  });
}

function hideLeadingZero(job) {
  if (job.value >= 10 || job.hundred) return;
  job.digits[0]?.classList.add('is-leading-zero-hidden');
}

function updateReel(job, t, elapsed) {
  if (t < REEL_SETTLE_START) {
    const local = t / REEL_SETTLE_START;
    job.digits.forEach((span, index) => {
      if (elapsed < job.nextShuffle[index]) return;
      let next = Math.floor(job.rng() * 10);
      if (next === job.current[index]) next = (next + 1 + Math.floor(job.rng() * 8)) % 10;
      job.current[index] = next;
      const interval = 42 + 60 * local * local + job.rng() * 28;
      job.nextShuffle[index] = elapsed + interval * (1 + index * .08);
      spinDigit(span, next, interval);
    });
    return;
  }

  beginSettle(job);
  const settleT = clamp((t - REEL_SETTLE_START) / (1 - REEL_SETTLE_START), 0, 1);
  const slowed = 1 - Math.pow(1 - settleT, 2.15);
  job.plans.forEach((plan, index) => {
    const step = settleT >= 1 ? plan.total : Math.floor(plan.total * slowed);
    if (step === plan.lastStep && settleT < 1) return;
    plan.lastStep = step;
    const digit = (plan.start + step) % 10;
    job.current[index] = digit;
    spinDigit(job.digits[index], digit, 92 + settleT * 85);
  });

  if (settleT >= 1 && !job.finalized && !job.hundred) {
    job.finalized = true;
    hideLeadingZero(job);
  }
}

function finishHundred(job, timers, onKick) {
  if (!job?.hundred || job.finalized) return;
  job.finalized = true;
  timers.push(setTimeout(() => {
    job.host.classList.add('is-hundred-kick');
    job.hundredDigit?.classList.add('is-visible');
    spinDigit(job.digits[0], 0, HUNDRED_KICK);
    spinDigit(job.digits[1], 0, HUNDRED_KICK);
    job.hundredDigit?.animate?.([
      { opacity: 0, transform: 'translateX(.32em) scale(.7)' },
      { opacity: 1, transform: 'translateX(0) scale(1.08)', offset: .72 },
      { opacity: 1, transform: 'translateX(0) scale(1)' }
    ], { duration: HUNDRED_KICK, easing: 'cubic-bezier(.2,.78,.2,1)', fill: 'both' });
    onKick();
  }, HUNDRED_PAUSE));
}

export function settleResult(root) {
  presentations.get(root)?.();
}

export function revealResult(root, delay = 1000) {
  settleResult(root);
  if (reduced() || document.hidden) return;
  const section = root.querySelector('.result-v4');
  if (!section) return;

  const jobs = [...section.querySelectorAll('[data-count][data-reel]')].map(setupReel);
  const hundredJob = jobs.find(job => job.hundred);
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

  let frame = 0, startTimer = 0, handoff = 0, started = performance.now(), done = false, finishStarted = false, hundredStarted = false;
  const timers = [];
  const finishAnimations = [];

  function cleanup() {
    if (done) return;
    done = true;
    cancelAnimationFrame(frame);
    clearTimeout(startTimer);
    clearTimeout(handoff);
    timers.forEach(clearTimeout);
    finishAnimations.forEach(animation => { try { animation.cancel(); } catch {} });
    jobs.forEach(job => {
      job.host.getAnimations?.().forEach(animation => animation.cancel());
      job.host.querySelectorAll('.result-reel-digit').forEach(digit => digit.getAnimations?.().forEach(animation => animation.cancel()));
      job.host.classList.remove('result-reel', 'is-hundred-kick');
      job.host.removeAttribute('aria-label');
      job.host.textContent = String(job.value);
    });
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
    const progressT = clamp((elapsed - delay - 120) / PROGRESS_DURATION, 0, 1);
    const eased = 1 - Math.pow(1 - progressT, PROGRESS_EASE_POWER);

    jobs.forEach(job => updateReel(job, progressT, elapsed));

    const kick = target > 0 ? PROGRESS_START_KICK * Math.exp(-progressT * 9) * Math.sin(progressT * Math.PI * 3.2) * 1.2 : 0;
    const wobble = target > 0 ? PROGRESS_WOBBLE * Math.sin(progressT * Math.PI * 4.3) * Math.pow(1 - progressT, 1.7) : 0;
    const visual = progressT >= 1 ? target : clamp(target * eased + kick + wobble, 0, target);
    fill.style.width = visual + '%';

    const stretch = 1 + PROGRESS_STRETCH * Math.sin(Math.min(1, progressT * 1.45) * Math.PI) * .035;
    fill.style.transform = progressT >= 1 ? '' : `scaleX(${stretch.toFixed(4)})`;

    if (progressT < 1) {
      frame = requestAnimationFrame(tick);
      return;
    }

    fill.style.width = target + '%';
    fill.style.transform = '';

    if (hundredJob && !hundredStarted) {
      hundredStarted = true;
      finishHundred(hundredJob, timers, finishProgress);
      handoff = setTimeout(cleanup, HUNDRED_PAUSE + HUNDRED_KICK + PROGRESS_FINISH_MS + 140);
    } else if (!hundredJob) {
      finishProgress();
      handoff = setTimeout(cleanup, target > 0 ? PROGRESS_FINISH_MS + 100 : HANDOFF + 24);
    }
  }

  startTimer = setTimeout(() => {frame = requestAnimationFrame(tick);}, delay + 120);
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
