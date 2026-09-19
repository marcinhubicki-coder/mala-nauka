import { DURATIONS, Session, validateWords, cleanSettings, accuracy } from './game.mjs?v=reading-phrase-1';
import { MODES, modeIds, cleanConfig, createSource, levelLabel, categoryLabel } from './modes.mjs?v=reading-phrase-1';
import { cleanProgress, migrateProgress, recordResult, localDay } from './progress.mjs?v=reading-phrase-1';
const root=document.querySelector('#app'), modal=document.querySelector('#modal');
const prefix='malaNauka.v1.';
function read(key,fallback=null) {try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function save(key,value) {try{localStorage.setItem(prefix+key,JSON.stringify(value));}catch{document.querySelector('#storage-notice').hidden=false;}}
const oldSettings=cleanSettings(read('maleDyktando.settings.v1',{}));
let settings=cleanSettings(read(prefix+'settings',oldSettings));
const savedConfigs=read(prefix+'configs',{});
let configs=Object.fromEntries(modeIds.map(mode=>[mode,cleanConfig(mode,savedConfigs?.[mode]??{duration:oldSettings.duration})]));
let progress=read(prefix+'progress');
progress=progress===null?migrateProgress(read('maleDyktando.history.v1',[]),read('maleDyktando.best.v1',{})):cleanProgress(progress);
save('progress',progress);
let words=[],game=null,view='home',selectedMode='spelling',lastResult=null,audio=null,renderedState='',renderedQuestion=0,memoryInput=[],phraseInput=[];
let offlineReady=false;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(text,action,cls='secondary',extra='')=>`<button type="button" class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
const minutes=seconds=>`${seconds/60} min`;
const book='<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M5 9c6-2 10 0 15 4 5-4 9-6 15-4v23c-6-2-10-1-15 2-5-3-9-4-15-2V9Z" fill="currentColor" opacity=".18"/><path d="M5 9c6-2 10 0 15 4 5-4 9-6 15-4v23c-6-2-10-1-15 2-5-3-9-4-15-2V9ZM20 13v21" stroke="currentColor" stroke-width="2.7" stroke-linejoin="round"/></svg>';
const globe='<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#2698ed" stroke="#d1f7ff" stroke-width="2"/><path d="m13 5 5 3-2 5-5 2-1 5-6-2a17 17 0 0 1 9-13m5 15 6-1 5 6-3 9-5 3-3-8-5-3zm12-12 6 8-4 5-5-4-2-6Z" fill="#a4e64e"/></svg>';
const englishFlag='<svg viewBox="0 0 60 40" aria-hidden="true"><defs><clipPath id="union-clip"><rect width="60" height="40" rx="6"/></clipPath></defs><g clip-path="url(#union-clip)"><path fill="#204b9b" d="M0 0h60v40H0z"/><path stroke="white" stroke-width="10" d="m0 0 60 40M60 0 0 40"/><path stroke="#eb4267" stroke-width="4" d="m0 0 60 40M60 0 0 40"/><path stroke="white" stroke-width="14" d="M30 0v40M0 20h60"/><path stroke="#eb4267" stroke-width="8" d="M30 0v40M0 20h60"/></g></svg>';
function modeIcon(mode) {return `<span class="mode-icon ${mode==='english'?'hello':''}" aria-hidden="true">${mode==='reading'?book:mode==='flags'?globe:mode==='english'?englishFlag:MODES[mode].icon}</span>`;}
function pageHead(title,action='home') {return `<header class="page-head">${btn('←',action,'icon','aria-label="Wróć"')}<h1 tabindex="-1">${title}</h1></header>`;}
function navigate(next) {
 view=next;root.dataset.view=view;root.dataset.mode=selectedMode;
 if(view==='home')home();if(view==='wizard')wizard();if(view==='settings')settingsPage();if(view==='history')historyPage();
 root.scrollTop=0;(root.querySelector('h1')||root).focus({preventScroll:true});
}
function home() {
 const latest=progress.history[0],today=progress.today.day===localDay()?progress.today.count:0;
 root.innerHTML=`<header class="home-head"><div class="brand"><img src="assets/icon-192.png" alt="" width="38" height="38"><span><span class="logo-first">Mała</span> <span class="logo-letter">N</span><span class="logo-letter">a</span><span class="logo-letter">u</span><span class="logo-letter">k</span><span class="logo-letter">a</span><span class="brand-sub">Małe kroki. Wielkie odkrycia.</span></span></div>${btn('⚙','settings','icon','aria-label="Ustawienia"')}</header>
 <section class="welcome"><div><span class="eyebrow">Hej, odkrywco!</span><h1 tabindex="-1">Co dziś<br>odkryjemy?</h1><p>Czas na małą przygodę<br>z wiedzą!</p></div><img class="lion" src="assets/lion.svg" alt="Przyjazny lew z ołówkiem" width="150" height="138"></section>
 ${btn(`<span><b>${today}</b><small>Dziś rozwiązane</small></span><span><b>${latest?latest.correct+' pkt':'—'}</b><small>${latest?'Ostatnia: '+MODES[latest.mode].name:'Tu rosną postępy'}</small></span><span class="stats-arrow" aria-hidden="true">↗</span>`,'history','home-stats','aria-label="Zobacz swoje wyniki"')}
 <div class="section-label">Wybierz swoją przygodę <span>5 trybów</span></div><nav class="mode-list" aria-label="Wybierz tryb nauki">${modeIds.map(mode=>btn(`${modeIcon(mode)}<span class="mode-copy"><strong>${MODES[mode].name}</strong><small>${MODES[mode].hint}</small></span><span class="mode-arrow" aria-hidden="true">›</span>`,'choose-mode',`mode-tile ${MODES[mode].color}`,`data-mode="${mode}"`)).join('')}</nav>
 <p class="home-foot">Odrobina nauki, mnóstwo radości <span aria-hidden="true">✦</span></p>`;
}
function wizard() {
 const mode=MODES[selectedMode],config=configs[selectedMode];
 root.innerHTML=pageHead(mode.name)+`<section class="wizard-intro ${mode.color}">${modeIcon(selectedMode)}<div><h2>Twoja mała misja</h2><p>${selectedMode==='reading'?'Przeczytaj, zapamiętaj i odpowiedz.':mode.hint+'.'}</p></div></section>
 <form id="setup-form" class="setup-form"><section class="card setup-card"><label class="field-title" for="category"><span class="step-dot">1</span>${selectedMode==='math'?'Jakie działania?':'Co ćwiczymy?'}</label><select id="category" name="category">${mode.categories.map(([id,label])=>`<option value="${id}" ${config.category===id?'selected':''}>${escape(label)}</option>`).join('')}</select>
 <fieldset><legend><span class="step-dot">2</span>${selectedMode==='reading'?'Co czytamy?':'Wybierz poziom'}</legend><div class="choices levels ${selectedMode==='spelling'?'four':''}">${mode.levels.map((label,index)=>{const value=selectedMode==='spelling'?index:index+1;return `<label class="choice"><input type="radio" name="difficulty" value="${value}" ${config.difficulty===value?'checked':''}><span>${label}</span></label>`;}).join('')}</div></fieldset>
 <fieldset><legend><span class="step-dot">3</span>Ile mamy czasu?</legend><div class="choices four">${DURATIONS.map(d=>`<label class="choice"><input type="radio" name="duration" value="${d}" ${config.duration===d?'checked':''}><span>${minutes(d)}</span></label>`).join('')}</div></fieldset></section>
 <p class="wizard-note">${selectedMode==='reading'?'Wersja próbna · Czytaj spokojnie. Liczy się rozumienie.':'Po pomyłce czas czeka, aż poznasz odpowiedź.'}</p><p id="setup-error" role="status" hidden></p><button class="primary start-button" type="submit">Zaczynamy! <span aria-hidden="true">→</span></button></form>`;
}
function offlineStatus(){return offlineReady?'Gotowa do gry bez internetu.':navigator.onLine?'Przygotowujemy grę bez internetu…':'Jesteś offline. Gra korzysta z zapisanych zasobów.';}
function settingsPage() {
 root.innerHTML=pageHead('Ustawienia')+`<section class="card"><label class="setting" for="sound"><span><strong>Dźwięki</strong><small>Krótki dźwięk po odpowiedzi</small></span><input id="sound" type="checkbox" role="switch" ${settings.sound?'checked':''}></label><label class="setting" for="difficulty"><span><strong>Pokazuj poziom</strong><small>Mała etykieta przy pytaniu</small></span><input id="difficulty" type="checkbox" role="switch" ${settings.difficulty?'checked':''}></label></section>
 <section class="card installation"><h2>Mała Nauka zawsze pod ręką</h2><p>Na iPhonie otwórz menu udostępniania w Safari i wybierz „Do ekranu początkowego”.</p><p id="offline-status" role="status">${offlineStatus()}</p></section><div class="stack">${btn('Moje wyniki','history')}${btn('Wyczyść wyniki','clear','danger')}</div><p class="caption">Ustawienia i wyniki zostają na tym urządzeniu.</p>`;
}
function resultScopeLabel(r){const category=categoryLabel(r.mode,r.category);return r.mode==='reading'&&r.category==='memory'?category:`${category} · ${levelLabel(r.mode,r.difficulty)}`;}
function historyPage() {
 root.innerHTML=pageHead('Moje wyniki')+`<section class="card"><h2>Twoje rekordy</h2><p class="muted">Punkty według trybu i czasu rundy.</p><div class="record-table"><table><thead><tr><th scope="col">Tryb</th>${DURATIONS.map(d=>`<th scope="col">${minutes(d)}</th>`).join('')}</tr></thead><tbody>${modeIds.map(mode=>`<tr><th scope="row">${MODES[mode].name}</th>${DURATIONS.map(d=>`<td>${progress.best[`${mode}:${d}`]??'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section><h2 class="space-top">Ostatnie gry</h2>`+
 (progress.history.length?progress.history.map(r=>`<article class="history-item"><div><strong>${MODES[r.mode].name}</strong><b>${r.correct} pkt</b></div><p>${accuracy(r.correct,r.wrong)}% poprawnych · ${r.correct+r.wrong} zadań · ${minutes(r.duration)}</p><small>${escape(resultScopeLabel(r))}<br>${escape(new Date(r.date).toLocaleString('pl-PL',{dateStyle:'short',timeStyle:'short'}))}${r.early?' · zakończona wcześniej':''}</small></article>`).join(''):'<section class="empty card"><span aria-hidden="true">✦</span><h2>Tu pojawią się Twoje przygody</h2><p>Wybierz tryb i zagraj pierwszą rundę.</p>'+btn('Wybierz przygodę','home','primary')+'</section>');
}
function unlockAudio(){if(!settings.sound)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio||=new Audio();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{/* Optional sound. */}}
function beep(correct){if(!settings.sound)return;try{unlockAudio();if(!audio||audio.state!=='running')return;const tone=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;tone.type='sine';tone.frequency.setValueAtTime(correct?660:220,t);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.045,t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+.14);tone.connect(gain);gain.connect(audio.destination);tone.start(t);tone.stop(t+.15);tone.onended=()=>{tone.disconnect();gain.disconnect();};}catch{/* Keep playing without audio. */}}
function start() {
 const config=configs[selectedMode];
 try{game=new Session(createSource(selectedMode,config,words),config.duration);}catch(e){const message=root.querySelector('#setup-error');if(message){message.textContent=e.message;message.hidden=false;}return;}
 game.mode=selectedMode;game.config={...config};save('configs',configs);unlockAudio();lastResult=null;memoryInput=[];phraseInput=[];view='game';root.dataset.view=view;root.dataset.mode=selectedMode;root.scrollTop=0;renderedState='';renderedQuestion=0;renderGame();
}
function balancedReadingPrompt(text){
 const words=String(text||'').trim().split(/\s+/).filter(Boolean);
 if(words.length<4||String(text).length<22)return escape(text);
 let split=1,best=Infinity;
 for(let i=1;i<words.length;i++){
  const left=words.slice(0,i).join(' '),right=words.slice(i).join(' ');
  const delta=Math.abs(left.length-right.length);
  if(delta<best){best=delta;split=i;}
 }
 const left=escape(words.slice(0,split).join(' '));
 const right=escape(words.slice(split).join(' '));
 return '<span class="reading-prompt-line">'+left+'</span><span class="reading-prompt-line">'+right+'</span>';
}
function questionContent(q,feedback,exposing) {
 if(q.kind==='memory'){
  const length=q.sequence.length;
  const seq=(items,rowClass='')=>`<div class="memory-feedback-sequence ${rowClass}" style="--memory-length:${length}">${Array.from({length},(_,i)=>`<span>${escape(items[i]??'–')}</span>`).join('')}</div>`;
  if(exposing)return `<div class="memory-flash" aria-live="off" aria-label="Zapamiętaj kolejną liczbę">&nbsp;</div>`;
  if(feedback){
   const picked=String(game?.selected||'').split('|').filter(Boolean);
   return `<div class="memory-feedback"><div class="memory-feedback-row"><small>Twoja odpowiedź</small>${seq(picked)}</div><div class="memory-feedback-row correct-row"><small>Poprawna kolejność</small>${seq(q.sequence)}</div></div>`;
  }
  return `<div class="memory-recall" style="--memory-length:${length}"><div class="memory-slots" aria-label="Wpisana sekwencja">${Array.from({length},(_,i)=>`<span class="memory-slot ${i<memoryInput.length?'is-filled':''} ${i===memoryInput.length?'is-current':''}">${escape(memoryInput[i]??'')}</span>`).join('')}</div><button type="button" class="memory-backspace" data-action="memory-backspace" aria-label="Usuń ostatnią liczbę" ${memoryInput.length?'':'disabled'}>⌫</button></div>`;
 }
 if(q.kind==='reading-phrase'){
  const words=q.phraseWords||String(q.text||'').trim().split(/\s+/);
  const slots=(items,interactive=false,rowClass='')=>`<div class="phrase-slots ${rowClass}" style="--phrase-length:${words.length}">${words.map((_,i)=>interactive
   ?`<button type="button" class="phrase-slot ${items[i]?'is-filled':''}" data-action="phrase-remove" data-index="${i}" aria-label="${items[i]?'Usuń '+escape(items[i]):'Puste miejsce '+(i+1)}" ${items[i]?'':'disabled'}>${escape(items[i]||'')}</button>`
   :`<span class="phrase-slot ${items[i]?'is-filled':''}">${escape(items[i]||'–')}</span>`).join('')}</div>`;
  if(exposing)return `<div class="reading-text phrase-exposure">${escape(q.text)}</div>`;
  if(feedback){
   const picked=String(game?.selected||'').split('|').filter(Boolean);
   return `<div class="phrase-feedback"><div class="phrase-feedback-row"><small>Twoja fraza</small>${slots(picked,false)}</div><div class="phrase-feedback-row correct-row"><small>Poprawna fraza</small>${slots(words,false)}</div></div>`;
  }
  return `<div class="phrase-build"><p>Ułóż zapamiętaną frazę</p>${slots(phraseInput,true)}</div>`;
 }
 if(q.kind==='spelling') {const [before,after]=q.masked.split('_');return `<div class="word" aria-label="${escape(feedback?q.word:q.masked.replace('_',' – luka – '))}">${escape(before)}<span class="${feedback?'filled':'gap'}">${feedback?escape(q.answer):'_'}</span>${escape(after)}</div>`;}
 if(q.kind==='flags')return `<img class="flag" src="${q.image}" alt="${feedback?'Flaga: '+escape(q.answer):'Flaga do rozpoznania'}" width="240" height="160">${feedback?`<div class="flag-name">${escape(q.answer)}</div>`:''}`;
 if(q.kind==='reading'){
  const content=feedback||exposing?escape(q.text):balancedReadingPrompt(q.prompt);
  const promptClass=!feedback&&!exposing?' reading-question-prompt':'';
  return `<div class="reading-text${promptClass}">${content}</div>${feedback&&q.answer!==q.text?`<div class="reading-answer">${escape(q.answer)}</div>`:''}`;
 }
 return `<div class="question-text ${q.kind}">${escape(feedback?q.full:q.text)}</div>${q.kind==='english'&&feedback?`<p class="translation">${escape(q.text)}</p>`:''}`;
}
function renderMemoryInput() {
 if(!game||game.current?.kind!=='memory'||game.state!=='playing')return;
 const slots=[...root.querySelectorAll('.memory-slot')];
 slots.forEach((slot,index)=>{
  slot.textContent=memoryInput[index]??'';
  slot.classList.toggle('is-filled',index<memoryInput.length);
  slot.classList.toggle('is-current',index===memoryInput.length&&memoryInput.length<slots.length);
 });
 const back=root.querySelector('[data-action="memory-backspace"]');
 if(back)back.disabled=!memoryInput.length;
}
function renderPhraseInput() {
 if(!game||game.current?.kind!=='reading-phrase'||game.state!=='playing')return;
 const slots=[...root.querySelectorAll('.phrase-slot[data-action="phrase-remove"]')];
 slots.forEach((slot,index)=>{
  const value=phraseInput[index]||'';
  slot.textContent=value;
  slot.disabled=!value;
  slot.classList.toggle('is-filled',Boolean(value));
  slot.setAttribute('aria-label',value?'Usuń '+value:'Puste miejsce '+(index+1));
 });
 root.querySelectorAll('[data-action="phrase-word"]').forEach(button=>{
  const value=button.dataset.value;
  const used=phraseInput.includes(value);
  button.disabled=used;
  button.classList.toggle('is-used',used);
 });
}
function renderGame() {
 if(!game||view!=='game')return;if(game.state==='ended'){finish();return;}if(game.state==='paused')return;
 const feedback=game.state.startsWith('feedback'),correct=game.state==='feedback-correct',exposing=game.state==='exposing',q=game.current;
 if(q.kind==='memory'&&renderedQuestion!==game.question)memoryInput=[];
 if(q.kind==='reading-phrase'&&renderedQuestion!==game.question)phraseInput=[];
 const readingAction=q.kind==='reading'
  ?(q.difficulty===1?'Rozpoznaj':'Zrozum')
  :q.kind==='reading-phrase'?'Ułóż':null;
 const badgeLabel=q.kind==='spelling'?escape(q.category)
  :q.kind==='memory'?(exposing?'Zapamiętaj':'Odtwórz')
  :readingAction?(exposing?'Przeczytaj':readingAction)
  :escape(MODES[game.mode].name);
 const levelCopy=q.kind==='memory'?`${q.sequence.length} liczb`:levelLabel(game.mode,q.difficulty);
 const promptText=q.kind==='memory'
  ?(exposing?'Zapamiętaj kolejność':feedback?'Porównaj sekwencje':'Wpisz liczby w tej samej kolejności')
  :q.kind==='reading-phrase'
   ?(exposing?'Przeczytaj i zapamiętaj':feedback?'Porównaj kolejność':'Dotknij słów we właściwej kolejności')
   :(exposing?'Za chwilę tekst zniknie…':q.kind==='reading'?(q.difficulty===1?'Wybierz słowo':'Odpowiedz na pytanie'):escape(q.prompt));
 let answersBlock='';
 if(q.kind==='memory'){
  if(exposing)answersBlock='<div class="answers memory-keypad concealed" inert aria-hidden="true"><div class="memory-wait"><p>Po chwili odtworzysz liczby w tej samej kolejności.</p></div></div>';
  else if(feedback)answersBlock='<div class="answers memory-keypad"><div class="memory-feedback-space"><p>Poprawna sekwencja jest pokazana wyżej.</p></div></div>';
  else answersBlock=`<div class="answers memory-keypad">${Array.from({length:10},(_,i)=>btn(String(i+1),'memory-digit','answer memory-key',`data-value="${i+1}" aria-label="Liczba ${i+1}"`)).join('')}</div>`;
 }else if(q.kind==='reading-phrase'){
  if(exposing)answersBlock='<div class="phrase-word-bank is-waiting" inert aria-hidden="true"><p>Za chwilę ułożysz ją z pojedynczych słów.</p></div>';
  else if(feedback)answersBlock='<div class="phrase-word-bank phrase-feedback-bank"><p>Poprawna kolejność jest pokazana wyżej.</p></div>';
  else answersBlock=`<div class="phrase-word-bank">${game.options.map((word,i)=>btn(escape(word),'phrase-word','answer phrase-word',`data-value="${escape(word)}" data-index="${i}"`)).join('')}</div>`;
 }else{
  answersBlock=`<div class="answers count-${game.options.length} ${exposing?'concealed':''}" ${exposing?'inert aria-hidden="true"':''}>${exposing?'<div class="reading-wait"><span aria-hidden="true">'+book+'</span><p>Teraz czas na czytanie</p></div>':game.options.map((option,i)=>btn(escape(option),'answer',`answer ${q.kind==='spelling'||q.kind==='math'?'short-answer':''} ${feedback&&option===q.answer?'correct':feedback&&option===game.selected?'wrong':''}`,`data-index="${i}" ${feedback?'disabled':''} ${q.kind==='english'?'lang="en"':''}`)).join('')}</div>`;
 }
 root.innerHTML=`<header class="game-bar">${btn('×','exit','icon','aria-label="Wyjdź z rundy"')}<div class="time-block"><span class="timer" aria-label="Pozostały czas"></span><small>${game.state==='feedback-wrong'?'Czas zatrzymany':MODES[game.mode].name}</small></div>${btn('Ⅱ','pause','icon','aria-label="Pauza"')}</header><progress max="${game.duration*1000}" value="${game.remaining}" aria-label="Pozostały czas rundy"></progress><div class="game-meta"><span>Zadanie ${game.question}</span><strong><span aria-hidden="true">✦</span> ${game.correct} pkt</strong></div>
 <section class="question-card card ${feedback?(correct?'correct':'wrong'):''} ${exposing?'exposing':''}" aria-label="Pytanie"><div class="badges"><span class="badge">${badgeLabel}</span>${settings.difficulty?`<span class="badge level">${escape(levelCopy)}</span>`:''}</div><div class="question-content">${questionContent(q,feedback,exposing)}</div>${exposing?'<div class="exposure-track" aria-hidden="true"><span></span></div>':''}</section>
 <p class="prompt">${promptText}</p>${answersBlock}
 <div class="feedback" role="status" aria-live="polite" aria-atomic="true">${feedback?`<div class="feedback-message"><strong>${correct?'✓ Świetnie!':'Spokojnie, zapamiętaj odpowiedź.'}</strong><small>${correct?'Tak właśnie!':'Czas czeka na Ciebie.'}</small></div>${correct?'':btn('Dalej →','next','primary')}`:'<p>Każda próba to krok do przodu.</p>'}</div>`;
 renderedState=game.state;renderedQuestion=game.question;updateClock();
 if(feedback&&!correct)root.querySelector('[data-action="next"]')?.focus({preventScroll:true});else if(!feedback&&!exposing)root.querySelector(q.kind==='memory'?'.memory-key':q.kind==='reading-phrase'?'.phrase-word':'.answer')?.focus({preventScroll:true});
}
function updateClock(){
 const timer=root.querySelector('.timer');if(!timer||!game)return;
 const seconds=Math.ceil(game.remaining/1000),value=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
 if(timer.textContent!==value)timer.textContent=value;
 timer.classList.toggle('urgent',seconds<=15);
 const progressNode=root.querySelector('progress');if(progressNode)progressNode.value=game.remaining;
 const exposure=root.querySelector('.exposure-track span');
 if(exposure&&game.current?.exposureMs)exposure.style.transform=`scaleX(${game.exposureRemaining/game.current.exposureMs})`;
 if(game.current?.kind==='memory'&&game.state==='exposing'){
  const q=game.current,flash=root.querySelector('.memory-flash');
  if(flash){
   const elapsed=Math.max(0,q.exposureMs-game.exposureRemaining);
   const index=Math.min(q.sequence.length-1,Math.floor(elapsed/q.stepMs));
   const visible=(elapsed%q.stepMs)<q.visibleMs&&elapsed<q.exposureMs;
   const step=String(index);
   if(flash.dataset.step!==step){
    flash.dataset.step=step;
    flash.classList.remove('is-new');
    void flash.offsetWidth;
    flash.classList.add('is-new');
   }
   const next=visible?q.sequence[index]:'';
   if(flash.dataset.value!==next){
    flash.dataset.value=next;
    flash.textContent=next||'\u00a0';
    flash.classList.toggle('is-gap',!next);
   }
  }
 }
}
function syncGame(){if(view!=='game'||!game)return;if(game.state==='ended'){finish();return;}if(game.state!=='paused'&&(game.state!==renderedState||game.question!==renderedQuestion))renderGame();updateClock();}
function showModal(title,content){modal.innerHTML=`<h2 id="modal-title">${title}</h2>${content}`;if(!modal.open)modal.showModal();modal.querySelector('button')?.focus();}
function pause(exit=false){if(!game||view!=='game')return;game.pause();syncGame();if(game.state==='ended')return;root.classList.add('paused');showModal(exit?'Wrócić do wyboru przygód?':'Mała przerwa',`<p>${exit?'Zapiszemy dotychczasowy wynik.':'Odpocznij chwilę. Czas na Ciebie czeka.'}</p><div class="stack">${btn(exit?'Graj dalej':'Wracam do gry','resume','primary')}${btn(exit?'Zapisz i wróć do startu':'Zakończ rundę',exit?'end-home':'exit')}</div>`);}
function resume(){modal.close();root.classList.remove('paused');game?.resume();syncGame();root.querySelector(game?.state==='playing'?'.answer':'[data-action="next"]')?.focus({preventScroll:true});}
function finish(early=false,goHome=false){
 if(!game||lastResult)return;game.end();if(modal.open)modal.close();root.classList.remove('paused');
 const result={...game.config,mode:game.mode,correct:game.correct,wrong:game.wrong,date:new Date().toISOString(),early};
 const record=recordResult(progress,result);save('progress',progress);lastResult=result;
 if(goHome){navigate('home');return;}view='results';root.dataset.view=view;
 root.innerHTML=`<section class="result"><div class="result-star" aria-hidden="true">✦</div><span class="eyebrow">Przygoda ukończona</span><h1 tabindex="-1">Dobra robota!</h1><p>Mały trening, kolejny krok do przodu.</p><span class="badge">${MODES[result.mode].name} · ${minutes(result.duration)}</span><div class="stats">${[['Poprawne',result.correct],['Do powtórki',result.wrong],['Razem',result.correct+result.wrong]].map(([label,n])=>`<div class="stat"><b>${n}</b><span>${label}</span></div>`).join('')}</div><p class="accuracy"><strong>${accuracy(result.correct,result.wrong)}%</strong> poprawnych odpowiedzi</p><p class="record">${record?'✦ Twój nowy rekord!':'Każda runda pomaga zapamiętać więcej.'}</p><div class="stack">${btn('Jeszcze jedna runda →','again','primary')}${btn('Wybierz inną przygodę','home')}</div></section>`;root.querySelector('h1').focus({preventScroll:true});
}
function clearPrompt(){showModal('Wyczyścić wyniki?',`<p>Usuniesz historię i rekordy. Ustawienia zostaną zachowane.</p><div class="stack">${btn('Zachowaj wyniki','cancel-clear','primary')}${btn('Wyczyść wyniki','confirm-clear','danger')}</div>`);}
function dispatch(event){const button=event.target.closest('button[data-action]');if(!button||button.disabled)return;const action=button.dataset.action;
 if(['home','settings','history'].includes(action))navigate(action);
 if(action==='choose-mode'){selectedMode=button.dataset.mode;navigate('wizard');}
 if(action==='again'){selectedMode=lastResult.mode;configs[selectedMode]=cleanConfig(selectedMode,lastResult);start();}
 if(action==='phrase-word'&&view==='game'&&!modal.open&&game?.current?.kind==='reading-phrase'&&game.state==='playing'){
  if(phraseInput.length<game.current.phraseWords.length&&!phraseInput.includes(button.dataset.value))phraseInput.push(button.dataset.value);
  renderPhraseInput();
  if(phraseInput.length===game.current.phraseWords.length){
   if(game.answer(phraseInput.join('|')))beep(game.state==='feedback-correct');
   syncGame();
  }
  return;
 }
 if(action==='phrase-remove'&&view==='game'&&!modal.open&&game?.current?.kind==='reading-phrase'&&game.state==='playing'){
  const index=Number(button.dataset.index);
  if(Number.isInteger(index)&&index>=0&&index<phraseInput.length)phraseInput.splice(index,1);
  renderPhraseInput();
  return;
 }
 if(action==='memory-digit'&&view==='game'&&!modal.open&&game?.current?.kind==='memory'&&game.state==='playing'){
  if(memoryInput.length<game.current.sequence.length)memoryInput.push(button.dataset.value);
  renderMemoryInput();
  if(memoryInput.length===game.current.sequence.length){
   if(game.answer(memoryInput.join('|')))beep(game.state==='feedback-correct');
   syncGame();
  }
  return;
 }
 if(action==='memory-backspace'&&view==='game'&&!modal.open&&game?.current?.kind==='memory'&&game.state==='playing'){
  memoryInput.pop();renderMemoryInput();return;
 }
 if(action==='answer'&&view==='game'&&!modal.open){if(game.answer(game.options[Number(button.dataset.index)]))beep(game.state==='feedback-correct');syncGame();}
 if(action==='next'&&view==='game'&&!modal.open){game.skipFeedback();syncGame();}
 if(action==='pause')pause();if(action==='exit')pause(true);if(action==='resume')resume();if(action==='end-home')finish(true,true);
 if(action==='clear')clearPrompt();if(action==='cancel-clear')modal.close();if(action==='confirm-clear'){progress=cleanProgress(null);save('progress',progress);modal.close();navigate(view);}
 if(action==='retry')load();
}
root.addEventListener('click',dispatch);modal.addEventListener('click',dispatch);
modal.addEventListener('cancel',e=>{e.preventDefault();if(view==='game')resume();else modal.close();});
root.addEventListener('submit',e=>{if(e.target.id==='setup-form'){e.preventDefault();start();}});
root.addEventListener('change',e=>{
 if(view==='wizard'){
  const data=new FormData(root.querySelector('#setup-form'));configs[selectedMode]=cleanConfig(selectedMode,{category:data.get('category'),difficulty:Number(data.get('difficulty')),duration:Number(data.get('duration'))});save('configs',configs);
  // Some approved spelling categories have no records at a given difficulty.
  const empty=selectedMode==='spelling'&&!createSource(selectedMode,configs[selectedMode],words).length;
  const message=root.querySelector('#setup-error');message.hidden=!empty;message.textContent=empty?'W tej parze nie ma słów na tym poziomie. Wybierz „Wszystkie” lub inną parę.':'';root.querySelector('.start-button').disabled=empty;
 }
 if(view==='settings'){if(e.target.id==='sound'){settings.sound=e.target.checked;unlockAudio();}if(e.target.id==='difficulty')settings.difficulty=e.target.checked;save('settings',settings);}
});
document.addEventListener('keydown',e=>{if(e.key==='Tab')document.body.classList.add('keyboard');if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||modal.open||view!=='game')return;if(/^[1-6]$/.test(e.key)&&game.state==='playing'){e.preventDefault();root.querySelectorAll('.answer')[Number(e.key)-1]?.click();}if(e.key==='Escape'){e.preventDefault();pause();}});
document.addEventListener('pointerdown',()=>document.body.classList.remove('keyboard'));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&view==='game')pause();});
window.addEventListener('pagehide',()=>{if(view==='game')pause();});
setInterval(()=>{if(view==='game'&&game){game.tick();syncGame();}},50);
async function load(){root.innerHTML='<p class="loading" role="status">Przygotowujemy małe przygody…</p>';try{const parts=await Promise.all(Array.from({length:8},async(_,i)=>{const response=await fetch(`data/words-0${i+1}.json`);if(!response.ok)throw Error('Brak słów');return response.json();}));words=validateWords(parts.flat());navigate('home');}catch{root.innerHTML=`<section class="empty card"><h1>Nie udało się wczytać gry</h1><p>Sprawdź połączenie i spróbuj ponownie.</p>${btn('Spróbuj ponownie','retry','primary')}</section>`;}}
async function registerOffline(){if(!('serviceWorker'in navigator))return;try{await navigator.serviceWorker.register(new URL('./sw.js',import.meta.url),{scope:new URL('./',import.meta.url).pathname});await navigator.serviceWorker.ready;offlineReady=true;}catch{offlineReady=false;}const status=root.querySelector('#offline-status');if(status)status.textContent=offlineReady?offlineStatus():'Nie udało się przygotować gry offline. Otwórz ją ponownie z internetem.';}
load();registerOffline();
