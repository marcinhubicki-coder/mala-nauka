import {effectiveTokens} from '../design-system/model.mjs';
// The defaults preserve the approved result motion. Design Studio may tune each
// phase without changing the geometry of the result screen.
export function resultMotionSettings(){
  const progress={duration:3000,easePower:3.2/1.75,stretch:.5,bounce:2.1,wobble:.2,startKick:2,flash:.35,finishDuration:950,...effectiveTokens('progress')};
  const text={settlePercent:76,rollDuration:250,hundredPause:90,hundredStagger:24,hundredRevealDelay:210,kickDuration:220,handoffDelay:120,...effectiveTokens('resultText')};
  return {progress:{...progress,duration:Math.max(1,progress.duration)},text:{...text,settleStart:text.settlePercent/100}};
}
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

function rollDigitTo(span, digit, duration = 220, animations = []) {
  if (!span) return;
  const text = String(digit);
  const oldText = span.textContent || '';
  if (oldText === text) return;

  span.getAnimations?.().forEach(animation => animation.cancel());
  span.classList.add('is-final-rolling');
  span.textContent = '';

  const oldLayer = document.createElement('span');
  oldLayer.className = 'result-reel-roll-layer';
  oldLayer.textContent = oldText;
  const newLayer = document.createElement('span');
  newLayer.className = 'result-reel-roll-layer';
  newLayer.textContent = text;
  span.append(oldLayer, newLayer);

  const oldAnimation = oldLayer.animate([
    { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' },
    { transform: 'translateY(-72%)', opacity: .12, filter: 'blur(.7px)' }
  ], { duration, easing: 'cubic-bezier(.2,.72,.2,1)', fill: 'forwards' });

  const newAnimation = newLayer.animate([
    { transform: 'translateY(72%)', opacity: .12, filter: 'blur(.7px)' },
    { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' }
  ], { duration, easing: 'cubic-bezier(.2,.72,.2,1)', fill: 'forwards' });

  animations.push(oldAnimation, newAnimation);
  newAnimation.finished.then(() => {
    if (!span.isConnected) return;
    span.textContent = text;
    span.classList.remove('is-final-rolling');
  }).catch(() => {});
}

function setupReel(host, index) {
  const value = Math.max(0, Math.round(Number(host.dataset.count) || 0));
  const mode = host.dataset.reel || 'compact2';
  const hundred = mode === 'percent' && value === 100;
  const reelTarget = hundred ? 99 : value;
  const places=hundred||value<100?2:String(value).length;
  const target = String(reelTarget).padStart(places, '0').split('').map(Number);
  const seed = ((value + 17) * 2654435761) ^ ((index + 1) * 1597334677) ^ Math.floor(performance.now());
  const rng = makeRng(seed);
  host.classList.add('result-reel');
  host.setAttribute('aria-label', String(value));

  // Every reel starts as exactly two visible digit positions.
  // The third digit is created only for the special 99 → 100 finish.
  host.innerHTML = '<span class="result-reel-digit" aria-hidden="true">0</span>'.repeat(places);

  const digits = [...host.querySelectorAll('.result-reel-digit')];
  return {
    host, value, mode, hundred, target, digits,
    hundredDigit: null,
    current: Array(places).fill(0),
    nextShuffle: Array.from({length:places},(_,i)=>i*(18+rng()*20)),
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
  const leading = job.digits[0], remaining = job.digits[1];
  if (!leading || leading.classList.contains('is-leading-zero-hidden')) return;
  leading.classList.add('is-leading-zero-hidden');
  remaining?.classList.add('is-compacting-neighbor');
}

function updateReel(job, t, elapsed, settings) {
  if (t < settings.settleStart) {
    const local = t / settings.settleStart;
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
  const settleT = clamp((t - settings.settleStart) / (1 - settings.settleStart), 0, 1);
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

function finishHundred(job, timers, animations, onKick, settings) {
  if (!job?.hundred || job.finalized) return;
  job.finalized = true;

  // Hold 99 for a tiny beat, then gently roll both reels to 00.
  timers.push(setTimeout(() => {
    rollDigitTo(job.digits[0], 0, settings.rollDuration, animations);
  }, settings.hundredPause));

  timers.push(setTimeout(() => {
    rollDigitTo(job.digits[1], 0, settings.rollDuration, animations);
  }, settings.hundredPause + settings.hundredStagger));

  // Only now does a third digit exist. It grows into the layout from the left,
  // so 99 becomes 00 and then resolves naturally into 100.
  timers.push(setTimeout(() => {
    job.host.classList.add('is-hundred-kick');
    const hundredDigit = document.createElement('span');
    hundredDigit.className = 'result-reel-digit result-reel-hundreds';
    hundredDigit.setAttribute('aria-hidden', 'true');
    hundredDigit.textContent = '1';
    job.host.prepend(hundredDigit);
    job.hundredDigit = hundredDigit;
    requestAnimationFrame(() => hundredDigit.classList.add('is-visible'));
    onKick();
  }, settings.hundredPause + settings.hundredRevealDelay));
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
  const settings=resultMotionSettings(),progressSettings=settings.progress,textSettings=settings.text;

  fill.style.width = '0%';
  fill.style.transform = '';
  section.classList.remove('progress-complete');
  section.classList.add('result-entering');
  section.style.setProperty('--reveal-delay', delay + 'ms');

  let frame = 0, startTimer = 0, handoff = 0, started = performance.now(), done = false, finishStarted = false, hundredStarted = false;
  const timers = [];
  const finishAnimations = [];

  function cleanup(preserveVisual = false) {
    if (done) return;
    done = true;
    cancelAnimationFrame(frame);
    clearTimeout(startTimer);
    clearTimeout(handoff);
    timers.forEach(clearTimeout);
    finishAnimations.forEach(animation => { try { animation.cancel(); } catch {} });
    jobs.forEach(job => {
      if (preserveVisual) return;
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
      const pop = 1 + .025 * progressSettings.bounce;
      const peak = pop + .035 * progressSettings.stretch;
      const recoil = 1 - .018 * progressSettings.bounce;
      finishAnimations.push(cap.animate([
        {transform:'scaleX(1) scaleY(1)',filter:'brightness(1)'},
        {transform:`scaleX(${peak.toFixed(3)}) scaleY(1)`,filter:`brightness(${(1 + .18 * progressSettings.flash).toFixed(3)})`,offset:.38},
        {transform:`scaleX(${recoil.toFixed(3)}) scaleY(1.015)`,filter:'brightness(1.05)',offset:.72},
        {transform:'scaleX(1) scaleY(1)',filter:'brightness(1)'}
      ],{duration:Math.min(progressSettings.finishDuration,Math.round(520 + 160 * progressSettings.bounce)),easing:'cubic-bezier(.16,.78,.2,1)'}));
    }

    finishAnimations.push(fill.animate([
      {filter:'brightness(1.15)'},
      {filter:`brightness(${(1.15 * (1 + .18 * progressSettings.flash)).toFixed(3)})`,offset:.42},
      {filter:'brightness(1.15)'}
    ],{duration:Math.min(progressSettings.finishDuration,Math.round(560 + 120 * progressSettings.flash)),easing:'ease-out'}));
  }

  function visibility() {if (document.hidden) cleanup();}
  function preferenceChanged() {if (preference.matches) cleanup();}

  function tick(now) {
    if (!section.isConnected || reduced()) return cleanup();
    const elapsed = now - started;
    const progressT = clamp((elapsed - delay - 120) / progressSettings.duration, 0, 1);
    const eased = 1 - Math.pow(1 - progressT, progressSettings.easePower);

    jobs.forEach(job => {
      const t=job.mode==='percent'?progressT:clamp((elapsed-delay-120)/(Math.max(1,progressSettings.duration-100)),0,1);
      updateReel(job,t,elapsed,textSettings);
    });

    const kick = target > 0 ? progressSettings.startKick * Math.exp(-progressT * 9) * Math.sin(progressT * Math.PI * 3.2) * 1.2 : 0;
    const wobble = target > 0 ? progressSettings.wobble * Math.sin(progressT * Math.PI * 4.3) * Math.pow(1 - progressT, 1.7) : 0;
    const visual = progressT >= 1 ? target : clamp(target * eased + kick + wobble, 0, target);
    fill.style.width = visual + '%';

    const stretch = 1 + progressSettings.stretch * Math.sin(Math.min(1, progressT * 1.45) * Math.PI) * .035;
    fill.style.transform = progressT >= 1 ? '' : `scaleX(${stretch.toFixed(4)})`;

    if (progressT < 1) {
      frame = requestAnimationFrame(tick);
      return;
    }

    fill.style.width = target + '%';
    fill.style.transform = '';

    if (hundredJob && !hundredStarted) {
      hundredStarted = true;
      finishHundred(hundredJob, timers, finishAnimations, finishProgress, textSettings);
      handoff = setTimeout(() => cleanup(true), textSettings.hundredPause + textSettings.hundredRevealDelay + textSettings.kickDuration + progressSettings.finishDuration + 160);
    } else if (!hundredJob) {
      finishProgress();
      handoff = setTimeout(() => cleanup(true), target > 0 ? progressSettings.finishDuration + 100 : textSettings.handoffDelay + 24);
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
