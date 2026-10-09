import {renderSpellingResult,toggleResultDetail,stopResultScroll} from '../ortografia/result-screen.mjs';
import {renderProgressScreen,destroyProgressScreen} from '../progress-screen.mjs';
import {exampleProgress} from '../progress-example.mjs';
import {resolveRoute} from '../shared/navigation.mjs';
import {loadWords} from '../shared/asset-loader.mjs';
import { Session } from '../game.mjs?v=20261001-adventure';
import { cleanProgress, recordResult } from '../progress.mjs?v=3-local-profiles';
import { playerService } from '../player-service.mjs?v=1-local-profiles';

const CLOCK_SOURCE = () => ({ options: ['_'], answer: '_', exposureMs: 0 });
const labels = { add: 'Dodawanie', subtract: 'Odejmowanie', multiply: 'Mnożenie', divide: 'Dzielenie' };

let clock = null;
let currentMode = 'multiply';
let currentDuration = 180;
let correct = 0;
let wrong = 0;
let cancelled = false;
let lastResult;
let historyOrigin='';

function formatRemaining(milliseconds) {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function syncTimerSnapshot() {
  if (!clock) {
    window.__mathTimerSnapshot = { active: false, text: '', percent: 0, paused: false };
    return window.__mathTimerSnapshot;
  }

  const paused = clock.state === 'paused';
  const percent = Math.max(0, Math.min(100, clock.remaining / (clock.duration * 1000) * 100));
  window.__mathTimerSnapshot = {
    active: true,
    paused,
    remaining: clock.remaining,
    duration: clock.duration,
    percent,
    text: `${paused ? 'Ⅱ ' : ''}${formatRemaining(clock.remaining)}`,
  };
  return window.__mathTimerSnapshot;
}

window.__mathTimerSnapshot = { active: false, text: '', percent: 0, paused: false };
window.__getMathTimerSnapshot = () => ({ ...window.__mathTimerSnapshot });

function startClock(mode, duration) {
  currentMode = mode;
  currentDuration = duration;
  clock = new Session(CLOCK_SOURCE, duration);
  correct = 0;
  wrong = 0;
  cancelled = false;
  syncTimerSnapshot();
}

function ensureTimerUi() {
  const quiz = document.querySelector('[data-math-quiz]');
  if (!quiz || !clock) return;
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  const snapshot = syncTimerSnapshot();
  topbar.classList.add('math-timed');
  const slot = topbar.lastElementChild;
  if (slot && !slot.querySelector('.math-round-time')) {
    slot.innerHTML = `<div class="math-round-time ${snapshot.paused ? 'is-paused' : ''}" aria-label="Pozostały czas rundy"><span>${snapshot.text}</span></div>`;
  }
  if (!document.querySelector('.math-round-progress')) {
    const progress = document.createElement('div');
    progress.className = 'math-round-progress';
    progress.innerHTML = `<span style="width:${snapshot.percent}%"></span>`;
    topbar.insertAdjacentElement('afterend', progress);
  }
}

function updateTimerUi() {
  if (!clock) return;
  const snapshot = syncTimerSnapshot();
  const time = document.querySelector('.math-round-time');
  const text = time?.querySelector('span');
  const bar = document.querySelector('.math-round-progress > span');
  if (text && text.textContent !== snapshot.text) text.textContent = snapshot.text;
  time?.classList.toggle('is-paused', snapshot.paused);
  if (bar) bar.style.width = `${snapshot.percent}%`;
}

function accuracy() {
  return correct + wrong ? Math.round(correct * 100 / (correct + wrong)) : 0;
}

async function saveMathProgress(early=false) {
  if (new URLSearchParams(location.search).has('studio')) return;
  const snapshot = {
    category: currentMode,
    duration: currentDuration,
    correct,
    wrong,
    date: new Date().toISOString(),
  };
  try {
    await playerService.init();
    const player = await playerService.getSessionPlayer();
    if (!player) return;
    const progress = cleanProgress(await playerService.getProgress(player.id));
    const result = {
      id: globalThis.crypto?.randomUUID?.() || `math-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      playerId: player.id,
      mode: 'math',
      category: snapshot.category,
      difficulty: 1,
      duration: snapshot.duration,
      correct: snapshot.correct,
      wrong: snapshot.wrong,
      date: snapshot.date,
      early,
    };
    recordResult(progress, result);
    await playerService.saveProgress(player.id, progress);
  } catch {
    // The round should still finish even when local persistence is unavailable.
  }
}

function endRound() {
  if (!clock || cancelled || document.querySelector('.math-round-summary')) return;
  if (document.querySelector('.feedback.good') || document.querySelector('.correct-transition-out')) return;

  clock.end();
  syncTimerSnapshot();
  renderRoundSummary();
  void saveMathProgress();
  clock = null;
  syncTimerSnapshot();
}

function renderRoundSummary() {
 const app=document.querySelector('#app');if(!app)return;
 lastResult={mode:'math',category:currentMode,duration:currentDuration,correct,wrong};
 renderSpellingResult(app,lastResult,[],null,{animate:true,delay:200});
 app.querySelector('.result-v4').classList.add('math-round-summary');
}
function goRoute(action){
 const app=document.querySelector('#app'),from=document.documentElement.dataset.dsView||'math-results';
 const to=resolveRoute(globalThis.__MALA_NAUKA_DESIGN__,action==='exit-confirm'?'math-initial':from,action,'math',action==='return-results'?historyOrigin:'');
 stopResultScroll(app);destroyProgressScreen(app);
 if(to==='math-settings'){window.dispatchEvent(new CustomEvent('math-back-to-setup'));return;}
 if(to==='math-results'&&lastResult){renderRoundSummary();return;}
 if(to==='progress'){historyOrigin=from==='math-results'?'math-results':'home';void showHistory();return;}
 const target=to==='settings'?'?open=settings':to==='players'?'?open=players':to.endsWith('-settings')?to.slice(0,-9)+'/':'';
 const folder={spelling:'ortografia',english:'angielski',reading:'czytanie',flags:'flagi'}[to.slice(0,-9)];
 location.href=new URL(folder?'../'+folder+'/':'../'+target,import.meta.url).href;
}
async function showHistory(){
 const app=document.querySelector('#app');const words=await loadWords();
 const studio=new URLSearchParams(location.search).has('studio');
 let progress=exampleProgress(words);
 if(!studio){await playerService.init();const profile=await playerService.getSessionPlayer();progress=cleanProgress(profile?await playerService.getProgress(profile.id):null);}
 app.dataset.view='history';app.dataset.mode='math';
 renderProgressScreen(app,{progress,words,initialMode:'math',backAction:historyOrigin==='math-results'?'return-results':'home',onPractice:mode=>{if(mode==='math'){goRoute('result-back');return;}const folder={spelling:'ortografia',english:'angielski',reading:'czytanie',flags:'flagi'}[mode];if(folder)location.href=new URL('../'+folder+'/',import.meta.url).href;}});
}
window.addEventListener('math-request-exit',()=>{
 if(document.querySelector('.math-exit-dialog[open]'))return;
 clock?.pause();const dialog=document.createElement('dialog');dialog.className='math-exit-dialog';
 dialog.innerHTML='<h2>Zakończyć tę rundę?</h2><p>Zapiszemy wynik i wrócimy do ustawień Matematyki.</p><button data-math-resume>Graj dalej</button><button data-math-exit>Wyjdź do ustawień</button>';document.body.append(dialog);dialog.showModal();
 const close=()=>{dialog.remove();clock?.resume();};dialog.addEventListener('cancel',close);dialog.querySelector('[data-math-resume]').onclick=close;
 dialog.querySelector('[data-math-exit]').onclick=()=>{void saveMathProgress(true);clock?.end();cancelled=true;clock=null;dialog.remove();goRoute('exit-confirm');};
});

export function renderMathStudioResult(fixture) {
  if (!new URLSearchParams(location.search).has('studio')) return;
  currentMode = fixture.mode; currentDuration = fixture.duration;
  correct = fixture.correct; wrong = fixture.wrong;
  clock = null; syncTimerSnapshot(); renderRoundSummary();
}

document.querySelector('#app').addEventListener('spelling-repeat-request',()=>{stopResultScroll(document.querySelector('#app'));window.dispatchEvent(new CustomEvent('math-restart',{detail:{mode:currentMode,duration:currentDuration}}));});
window.addEventListener('math-round-start', event => {
  startClock(event.detail?.mode || 'multiply', Number(event.detail?.duration) || 180);
});

window.addEventListener('math-round-cancel', () => {
  cancelled = true;
  clock = null;
  syncTimerSnapshot();
});

document.addEventListener('click', event => {
  const answer = event.target.closest?.('[data-answer]');
  if (answer && clock && clock.state !== 'ended') {
    const quiz = answer.closest('[data-math-quiz]');
    const expected = Number(quiz?.dataset.correctAnswer);
    const chosen = Number(answer.dataset.answer);
    if (Number.isFinite(expected) && Number.isFinite(chosen)) {
      if (chosen === expected) correct += 1;
      else wrong += 1;
    }
    return;
  }

  const action=event.target.closest?.('[data-action]')?.dataset.action;
  if(action==='toggle-result'){toggleResultDetail(document.querySelector('#app'),event.target.closest('[data-action]'));return;}
  if(['result-back','history','return-results','home','settings'].includes(action)){event.preventDefault();goRoute(action);}

}, true);

document.addEventListener('visibilitychange', () => {
  if (!clock) return;
  if (document.hidden && clock.state !== 'paused' && clock.state !== 'ended') clock.pause();
  if (!document.hidden && !document.documentElement.classList.contains('landscape-blocked') && clock.state === 'paused' && !document.querySelector('.quiz-stage.has-explainer')) clock.resume();
  syncTimerSnapshot();
});

setInterval(() => {
  if (!clock) return;
  const quiz = document.querySelector('[data-math-quiz]');
  if (!quiz) return;

  ensureTimerUi();
  const hasExplainer = Boolean(document.querySelector('.quiz-stage.has-explainer'));
  const shouldPause = hasExplainer || document.hidden || document.documentElement.classList.contains('landscape-blocked') || Boolean(document.querySelector('.math-exit-dialog[open]'));

  if (shouldPause && clock.state !== 'paused' && clock.state !== 'ended') clock.pause();
  if (!shouldPause && clock.state === 'paused') clock.resume();

  clock.tick();
  updateTimerUi();
  if (clock.state === 'ended' || clock.remaining <= 0) endRound();
}, 50);
