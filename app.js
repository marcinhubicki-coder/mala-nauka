import { renderSpellingResult, toggleResultDetail, getResultViewState, showResultRule } from './ortografia/result-screen.mjs?v=13-tuned-progress';
import { transitionToResult, settleResult } from './ortografia/result-motion.mjs?v=5-synced-counters';
import { closeResultRule } from './ortografia/result-rules.mjs?v=5-fixed-rule-scroll';
import { exampleResult } from './ortografia/result-example.mjs?v=1';
import { renderHomeScreen } from './home-screen.mjs?v=20260930-release';
import { DURATIONS, Session, validateWords, cleanSettings, accuracy } from './game.mjs?v=20260930-release';
import { MODES, modeIds, cleanConfig, createSource, levelLabel, categoryLabel } from './modes.mjs?v=30-dyktando-jelly-v4';
import { cleanProgress, migrateProgress, recordResult, localDay } from './progress.mjs?v=3-dyktando-jelly-v4';
import { createSpellingArt } from './spelling/art.mjs?v=20260930-release';
import { playerService } from './player-service.mjs?v=3-retina-3d';
const root=document.querySelector('#app'), modal=document.querySelector('#modal');
const spellingArt=createSpellingArt(root);
const prefix='malaNauka.v1.';
function read(key,fallback=null) {try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function save(key,value) {try{localStorage.setItem(prefix+key,JSON.stringify(value));}catch{document.querySelector('#storage-notice').hidden=false;}}
const oldSettings=cleanSettings(read('maleDyktando.settings.v1',{}));
let settings=cleanSettings(read(prefix+'settings',oldSettings));
const savedConfigs=read(prefix+'configs',{});
let configs=Object.fromEntries(modeIds.map(mode=>[mode,cleanConfig(mode,savedConfigs?.[mode]??{duration:oldSettings.duration})]));
const legacyProgressRaw=read(prefix+'progress');
const legacyProgress=legacyProgressRaw===null?migrateProgress(read('maleDyktando.history.v1',[]),read('maleDyktando.best.v1',{})):cleanProgress(legacyProgressRaw);
let progress=cleanProgress(null);
let activePlayer=null,players=[],selectedPlayerId=null,pendingPlayerId=null,pendingNickname='',pendingAvatarId='a',pinInput='',pinError='';
let words=[],game=null,view='home',selectedMode='spelling',lastResult=null,audio=null,renderedState='',renderedQuestion=0,memoryInput=[],phraseInput=[];
let gameTicker = null;
function stopGameTicker(){clearInterval(gameTicker);gameTicker=null;}
function startGameTicker(){stopGameTicker();gameTicker=setInterval(()=>{if(view!=='game'||!game){stopGameTicker();return;}game.tick();syncGame();},50);}
let offlineReady=false,collectionReturn=null;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(text,action,cls='secondary',extra='')=>`<button type="button" class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
const minutes=seconds=>`${seconds/60} min`;
const book='<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M5 9c6-2 10 0 15 4 5-4 9-6 15-4v23c-6-2-10-1-15 2-5-3-9-4-15-2V9Z" fill="currentColor" opacity=".18"/><path d="M5 9c6-2 10 0 15 4 5-4 9-6 15-4v23c-6-2-10-1-15 2-5-3-9-4-15-2V9ZM20 13v21" stroke="currentColor" stroke-width="2.7" stroke-linejoin="round"/></svg>';
const globe='<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#2698ed" stroke="#d1f7ff" stroke-width="2"/><path d="m13 5 5 3-2 5-5 2-1 5-6-2a17 17 0 0 1 9-13m5 15 6-1 5 6-3 9-5 3-3-8-5-3zm12-12 6 8-4 5-5-4-2-6Z" fill="#a4e64e"/></svg>';
const englishFlag='<svg viewBox="0 0 60 40" aria-hidden="true"><defs><clipPath id="union-clip"><rect width="60" height="40" rx="6"/></clipPath></defs><g clip-path="url(#union-clip)"><path fill="#204b9b" d="M0 0h60v40H0z"/><path stroke="white" stroke-width="10" d="m0 0 60 40M60 0 0 40"/><path stroke="#eb4267" stroke-width="4" d="m0 0 60 40M60 0 0 40"/><path stroke="white" stroke-width="14" d="M30 0v40M0 20h60"/><path stroke="#eb4267" stroke-width="8" d="M30 0v40M0 20h60"/></g></svg>';
const homeTargetIcon='<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="23" cy="25" r="17" fill="#ffedf5"/><circle cx="23" cy="25" r="12" fill="#ff5a9b"/><circle cx="23" cy="25" r="6.5" fill="#fff"/><path d="M25 22 36 11m0 0-1 7 7-1m-7 1 7-7" stroke="#7255e5" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const homeStarIcon='<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="m24 5.5 5.7 11.7 12.9 1.8-9.3 9.1 2.2 12.8L24 34.8l-11.5 6.1 2.2-12.8L5.4 19l12.9-1.8L24 5.5Z" fill="#ffc51e"/><path d="m24 8 4.8 10 11 1.5" stroke="#ffe783" stroke-width="2" stroke-linecap="round" opacity=".85"/></svg>';
const homeChevronIcon='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const homeSettingsIcon='<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m13 3-1 4-4 2-4-1-2 5 3 3v4l-3 2 3 5 4-1 3 2 1 3h6l1-4 4-2 4 1 2-5-3-3v-4l3-2-3-5-4 1-3-2-1-3h-6Z" fill="#81809e"/><circle cx="16" cy="17" r="7" fill="#5a5a77"/><circle cx="16" cy="17" r="4.5" fill="#f0effa"/><circle cx="16" cy="17" r="2.5" fill="#555674"/></svg>';

const brandMark='<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><defs><linearGradient id="brand-grad" x1="12" y1="10" x2="53" y2="54" gradientUnits="userSpaceOnUse"><stop stop-color="#54B9FF"/><stop offset=".48" stop-color="#7C77F3"/><stop offset="1" stop-color="#EE5E9A"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="18" fill="white"/><rect x="4.75" y="4.75" width="54.5" height="54.5" rx="17.25" stroke="#DDE9F7" stroke-width="1.5"/><path d="M14 39c6-2.6 11-1.5 18 3.4V22.8c-6.2-4-11.8-5.1-18-2.5V39Zm36 0c-6-2.6-11-1.5-18 3.4V22.8c6.2-4 11.8-5.1 18-2.5V39Z" fill="#20375B" opacity=".94"/><path d="M17.2 28.2 24 34l8-11 8 11 6.8-5.8" stroke="url(#brand-grad)" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="17" r="3" fill="#EF438F"/><circle cx="47" cy="17" r="3" fill="#F5AB26"/></svg>';
const homeHeroArt='<svg viewBox="0 0 300 190" fill="none" aria-hidden="true"><defs><linearGradient id="hero-shirt" x1="139" y1="95" x2="224" y2="159" gradientUnits="userSpaceOnUse"><stop stop-color="#FFB44D"/><stop offset="1" stop-color="#F0785C"/></linearGradient><linearGradient id="hero-book" x1="127" y1="134" x2="226" y2="177" gradientUnits="userSpaceOnUse"><stop stop-color="#55C3ED"/><stop offset="1" stop-color="#4179D9"/></linearGradient><filter id="hero-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#466487" flood-opacity=".17"/></filter></defs><ellipse cx="190" cy="173" rx="91" ry="11" fill="#8BCB8D" opacity=".24"/><circle cx="258" cy="41" r="20" fill="#fff" opacity=".78"/><circle cx="258" cy="41" r="13.5" fill="#54B8ED"/><path d="M245 39c4-5 8-8 15-9l4 8-5 6 3 8c-7 2-13-1-17-6l4-3-4-4Z" fill="#A9E65C"/><path d="m108 37 4.5 8.5 9.5 1.4-7 6.7 1.7 9.4-8.7-4.5-8.7 4.5 1.7-9.4-7-6.7 9.5-1.4L108 37Z" fill="#FFD85C" opacity=".96"/><g filter="url(#hero-shadow)"><path d="M180 64c0-24 16-40 39-40 22 0 39 16 39 40 0 25-14 45-39 45-25 0-39-20-39-45Z" fill="#F5C88E"/><path d="M181 61c0-25 17-42 40-42 16 0 31 8 37 23-11 4-19 2-26-5-8 10-20 17-38 19-3 0-7 2-13 5Z" fill="#2F4E73"/><circle cx="195" cy="64" r="3.1" fill="#263F60"/><circle cx="238" cy="64" r="3.1" fill="#263F60"/><path d="M205 79c7 6 15 6 22 0" stroke="#263F60" stroke-width="3.2" stroke-linecap="round"/><ellipse cx="188" cy="73" rx="7" ry="4" fill="#EE8E8D" opacity=".55"/><ellipse cx="245" cy="73" rx="7" ry="4" fill="#EE8E8D" opacity=".55"/><path d="M181 111c12-10 25-15 39-15 16 0 31 7 43 20l-12 46H166l-7-35c3-6 11-12 22-16Z" fill="url(#hero-shirt)"/><path d="M159 124c-14 2-27 12-33 26l16 8c6-10 12-16 23-20l-6-14Z" fill="#F5C88E"/><path d="M253 116c10 5 19 13 23 24l-15 8c-5-8-10-13-18-17l10-15Z" fill="#F5C88E"/><path d="M121 147c-7 0-12 5-12 11 0 5 4 9 9 10 8 1 14-4 17-10l-14-11Z" fill="#F5C88E"/><path d="M270 137c7-3 14 0 16 6 2 5-1 10-6 13-7 3-14 0-19-5l9-14Z" fill="#F5C88E"/><path d="M127 139 206 111l7 14-79 30-7-16Z" fill="#35AF9C"/><path d="m206 111 19-9-8 21-4 2-7-14Z" fill="#F8E5BE"/><path d="m225 102 7-3-4 8-3-5Z" fill="#273E5D"/></g><g filter="url(#hero-shadow)"><path d="M127 143c20-8 39-8 58 1v30c-18-9-38-9-58-1v-30Z" fill="#FDFEFF"/><path d="M185 144c20-9 39-9 58-1v30c-20-8-39-8-58 1v-30Z" fill="url(#hero-book)"/><path d="M185 144v30" stroke="#D8E7F8" stroke-width="2"/><path d="M139 152c12-4 23-4 34 0M139 160c12-4 23-4 34 0" stroke="#C6D8EB" stroke-width="2.4" stroke-linecap="round"/><path d="M198 152c10-4 21-4 31 0M198 160c10-4 21-4 31 0" stroke="#C7E8F7" stroke-width="2.4" stroke-linecap="round"/></g><path d="M79 98c0-8 6-14 14-14s14 6 14 14-6 14-14 14-14-6-14-14Z" fill="#fff" opacity=".82"/><path d="M93 89v18M84 98h18" stroke="#8A6BE7" stroke-width="4" stroke-linecap="round"/></svg>';

const avatarThemes={
 a:{bg:'#ffd9e9',hood:'#f45d9b',hair:'#8b4b2b',accent:'#ff8bbb'},
 b:{bg:'#ccecff',hood:'#2687ec',hair:'#7a472d',accent:'#54b6ff'},
 c:{bg:'#ddf3d7',hood:'#4ebc67',hair:'#3b2a28',accent:'#8bdd86'},
 d:{bg:'#fff0c8',hood:'#f3a632',hair:'#c97935',accent:'#ffd45c'}
};
const fallbackAvatarId=player=>{
 const source=String(player?.id||player?.nickname||'a');let sum=0;
 for(let i=0;i<source.length;i++)sum+=source.charCodeAt(i);
 return ['a','b','c','d'][sum%4];
};
function avatarMarkup(player,extra=''){
 const key=avatarThemes[player?.avatarId]?player.avatarId:fallbackAvatarId(player);
 return `<span class="player-avatar-art ${extra}" data-avatar="${key}" aria-hidden="true"></span>`;
}
const resultId=()=>globalThis.crypto?.randomUUID?.()||`result-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
async function refreshPlayers(){
 players=await playerService.listPlayers();
 const remembered=await playerService.getMeta('lastPlayerId');
 if(!players.some(player=>player.id===selectedPlayerId)){
  selectedPlayerId=players.some(player=>player.id===remembered)?remembered:(players[0]?.id||null);
 }
 return players;
}
async function persistProgress(){
 if(!activePlayer?.id)return;
 const playerId=activePlayer.id;
 const snapshot=globalThis.structuredClone?structuredClone(progress):JSON.parse(JSON.stringify(progress));
 try{await playerService.saveProgress(playerId,snapshot);}
 catch{const notice=document.querySelector('#storage-notice');if(notice)notice.hidden=false;}
}
async function activatePlayer(player){
 if(!player)return;
 activePlayer=player;selectedPlayerId=player.id;
 progress=cleanProgress(await playerService.getProgress(player.id));
 pendingPlayerId=null;pendingNickname='';pinInput='';pinError='';
 navigate('home');
}
const playerCheckIcon='<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m7 16 6 6L26 9" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const playerPlusIcon='<svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M14 5v18M5 14h18" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/></svg>';
const playerProgressIcon='<svg viewBox="0 0 72 72" fill="none" aria-hidden="true"><defs><linearGradient id="player-bars" x1="17" y1="25" x2="53" y2="64" gradientUnits="userSpaceOnUse"><stop stop-color="#46c2ff"/><stop offset="1" stop-color="#0588ff"/></linearGradient><linearGradient id="player-star" x1="40" y1="7" x2="57" y2="27" gradientUnits="userSpaceOnUse"><stop stop-color="#ffe35a"/><stop offset="1" stop-color="#ffb300"/></linearGradient></defs><path d="M14 32c16 0 23-7 31-19m-10 0 12-2-1 12" stroke="#0f9bff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><rect x="15" y="45" width="11" height="17" rx="4" fill="url(#player-bars)"/><rect x="31" y="36" width="11" height="26" rx="4" fill="url(#player-bars)"/><rect x="47" y="27" width="11" height="35" rx="4" fill="url(#player-bars)"/><path d="m52 6 4 8 9 1-6.5 6 1.5 9-8-4.2-8 4.2 1.5-9-6.5-6 9-1 4-8Z" fill="url(#player-star)" stroke="#fff3ad" stroke-width="1.5" stroke-linejoin="round"/></svg>';
function setScreenTheme(color){const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=color;}
function playersPage(){
 spellingArt.reset();view='players';root.dataset.view=view;delete root.dataset.mode;setScreenTheme('#fcfdff');
 const hasPlayers=players.length>0;
 const list=hasPlayers
  ?`<div class="player-grid" role="group" aria-label="Zapisane profile">${players.map(player=>{const selected=player.id===selectedPlayerId;return `<button type="button" class="player-card ${selected?'is-selected':''}" data-action="choose-player" data-player="${escape(player.id)}" aria-pressed="${selected}">${avatarMarkup(player)}<strong title="${escape(player.nickname)}">${escape(player.nickname)}</strong><span class="player-select-mark" aria-hidden="true">${selected?`<span class="check">${playerCheckIcon}</span>`:'<span class="empty-check"></span>'}</span></button>`;}).join('')}</div>`
  :`<figure class="player-empty-art" aria-hidden="true"><img src="assets/brand/player-empty-3d.webp" alt="" width="1672" height="941" decoding="async" fetchpriority="high"></figure><div class="player-benefit"><span class="player-benefit-icon" aria-hidden="true">${playerProgressIcon}</span><p>Każdy gracz ma własne<br><strong>postępy i wyniki.</strong></p></div>`;
 const arrow=`<span class="continue-arrow" aria-hidden="true">${homeChevronIcon}</span>`;
 const actions=hasPlayers
  ?`<div class="player-actions">${btn(`<span class="add-icon" aria-hidden="true">${playerPlusIcon}</span> Dodaj gracza`,'add-player','add-player-soft')}${btn(`Dalej ${arrow}`,'continue-player','player-continue',selectedPlayerId?'':'disabled')}</div>`
  :`<div class="player-actions empty-actions">${btn(`Dodaj użytkownika ${arrow}`,'add-player','player-continue')}${btn('Później','guest-player','player-later')}</div>`;
 root.innerHTML=`<section class="player-shell ${hasPlayers?'':'player-shell-empty'}"><img class="player-brand-art" src="assets/brand/player-logo-3d.webp" alt="Mała Nauka — Małe wyzwania. Wielkie postępy." width="1536" height="512" decoding="async" fetchpriority="high"><div class="player-title"><h1 tabindex="-1">Kto dziś <span>gra?</span></h1><p class="${hasPlayers?'':'empty-subtitle'}">${hasPlayers?'Wybierz zapisany profil.':'Dodaj pierwszy profil, aby zacząć zabawę.'}</p></div>${list}${actions}</section>`;
 root.scrollTop=0;root.querySelector('h1')?.focus({preventScroll:true});
}

function playerCreatePage(){
 spellingArt.reset();view='player-create';root.dataset.view=view;delete root.dataset.mode;
 root.innerHTML=pageHead('Nowy gracz','players')+`<section class="player-form-card card"><div class="create-avatar-preview">${avatarMarkup({avatarId:pendingAvatarId},'player-avatar-large')}</div><h2>Jak mamy Cię nazywać?</h2><p>Wystarczy nick. Dane zostają na tym urządzeniu.</p><form id="player-create-form"><label for="player-nickname">Nick</label><input id="player-nickname" name="nickname" class="player-name-input" type="text" maxlength="20" minlength="2" autocomplete="off" autocapitalize="words" placeholder="np. Maja" value="${escape(pendingNickname)}" required><span class="avatar-label">Wybierz avatar</span><div class="avatar-picker" role="group" aria-label="Wybierz avatar">${['a','b','c','d'].map(id=>btn(avatarMarkup({avatarId:id}), 'choose-avatar',`avatar-choice ${pendingAvatarId===id?'is-selected':''}`,`data-avatar="${id}" aria-pressed="${pendingAvatarId===id}" aria-label="Avatar ${id.toUpperCase()}"`)).join('')}</div><button class="primary player-form-next" type="submit">Dalej <span aria-hidden="true">›</span></button></form></section>`;
 requestAnimationFrame(()=>root.querySelector('#player-nickname')?.focus({preventScroll:true}));
}
function playerPinPage(){
 spellingArt.reset();view='player-pin';root.dataset.view=view;delete root.dataset.mode;
 const creating=Boolean(pendingNickname);
 const player=players.find(item=>item.id===pendingPlayerId);
 const tempPlayer=creating?{nickname:pendingNickname,avatarId:pendingAvatarId}:player;
 const name=tempPlayer?.nickname||'Gracz';
 const dots=Array.from({length:4},(_,i)=>`<span class="${i<pinInput.length?'filled':''}"></span>`).join('');
 root.innerHTML=pageHead(creating?'Ustaw PIN':'Wpisz PIN',creating?'add-player':'players')+`<section class="pin-card">${avatarMarkup(tempPlayer,'player-avatar-large')}<h2>${escape(name)}</h2><p>${creating?'Ustaw 4 cyfry. PIN służy tylko do przełączania profili na urządzeniu.':'Wpisz 4-cyfrowy PIN.'}</p><div class="pin-dots" aria-label="Wpisano ${pinInput.length} z 4 cyfr">${dots}</div>${pinError?`<p class="pin-error" role="status">${escape(pinError)}</p>`:''}<div class="pin-keypad" aria-label="Klawiatura PIN">${[1,2,3,4,5,6,7,8,9].map(n=>btn(String(n),'pin-digit','pin-key',`data-digit="${n}" aria-label="Cyfra ${n}"`)).join('')}${btn('⌫','pin-backspace','pin-key pin-back','aria-label="Usuń ostatnią cyfrę"')}${btn('0','pin-digit','pin-key','data-digit="0" aria-label="Cyfra 0"')}${btn('✓','submit-pin','pin-key pin-submit',`${pinInput.length===4?'':'disabled'} aria-label="${creating?'Zapisz profil':'Wejdź do profilu'}"`)}</div></section>`;
}
async function submitPlayerPin(){
 if(pinInput.length!==4)return;
 if(pendingNickname){
  try{
   const firstProfile=players.length===0;
   const player=await playerService.createPlayer({nickname:pendingNickname,pin:pinInput,avatarId:pendingAvatarId});
   if(firstProfile)await playerService.migrateLegacyProgress(player.id,legacyProgress);
   await playerService.useCreatedPlayer(player.id);
   await refreshPlayers();
   await activatePlayer(player);
  }catch(error){pinError=error?.message||'Nie udało się utworzyć profilu.';pinInput='';playerPinPage();}
  return;
 }
 const player=await playerService.unlockPlayer(pendingPlayerId,pinInput);
 if(!player){pinError='Nieprawidłowy PIN. Spróbuj jeszcze raz.';pinInput='';playerPinPage();return;}
 await activatePlayer(player);
}

function modeIcon(mode) {return `<span class="mode-icon ${mode==='english'?'hello':''}" aria-hidden="true">${mode==='reading'?book:mode==='flags'?globe:mode==='english'?englishFlag:MODES[mode].icon}</span>`;}
function pageHead(title,action='home') {return `<header class="page-head">${btn('←',action,'icon','aria-label="Wróć"')}<h1 tabindex="-1">${title}</h1></header>`;}
function navigate(next) {
 stopGameTicker();settleResult(root);
 closeResultRule(root,false);
 if(next!=='history')collectionReturn=null;
 spellingArt.reset();
 view=next;root.dataset.view=view;root.dataset.mode=selectedMode;setScreenTheme(view==='home'?'#ddf3ff':'#f5f8ff');
 if(view==='home')home();if(view==='wizard')wizard();if(view==='settings')settingsPage();if(view==='history')historyPage();
 root.scrollTop=0;(root.querySelector('h1')||root).focus({preventScroll:true});
}
function home() {
 const latest=progress.history[0],today=progress.today.day===localDay()?progress.today.count:0;
 const lastScore=latest?`${latest.correct} pkt`:'0 pkt';
 const lastLabel=latest?`Ostatnia: ${MODES[latest.mode].name}`:'Zagraj pierwszą rundę';
 root.innerHTML=renderHomeScreen({nickname:activePlayer?.nickname||'odkrywco',today,lastScore,lastLabel,modes:MODES,modeIds});
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
 <section class="card player-settings-card"><div>${avatarMarkup(activePlayer,'settings-avatar')}<span><strong>${escape(activePlayer?.nickname||'Gracz')}</strong><small>Aktywny gracz na tym urządzeniu</small></span></div>${btn('Zmień gracza','switch-player','secondary')}</section><section class="card installation"><h2>Mała Nauka zawsze pod ręką</h2><p>Na iPhonie otwórz menu udostępniania w Safari i wybierz „Do ekranu początkowego”.</p><p id="offline-status" role="status">${offlineStatus()}</p></section><div class="stack">${btn('Moje wyniki','history')}${btn('Wyczyść wyniki','clear','danger')}</div><p class="caption">Profil i wyniki są zapisane lokalnie na tym urządzeniu.</p>`;
}
function resultScopeLabel(r){const category=categoryLabel(r.mode,r.category);return r.mode==='reading'&&r.category==='memory'?category:`${category} · ${levelLabel(r.mode,r.difficulty)}`;}
function historyPage() {
 const head=collectionReturn?`<header class="page-head">${btn('×','return-results','icon','aria-label="Zamknij kolekcję i wróć do wyników"')}<h1 tabindex="-1">Moja kolekcja</h1></header>`:pageHead('Moje wyniki');
 root.innerHTML=head+`<section class="card"><h2>Twoje rekordy</h2><p class="muted">Punkty według trybu i czasu rundy.</p><div class="record-table"><table><thead><tr><th scope="col">Tryb</th>${DURATIONS.map(d=>`<th scope="col">${minutes(d)}</th>`).join('')}</tr></thead><tbody>${modeIds.map(mode=>`<tr><th scope="row">${MODES[mode].name}</th>${DURATIONS.map(d=>`<td>${progress.best[`${mode}:${d}`]??'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section><h2 class="space-top">Ostatnie gry</h2>`+
 (progress.history.length?progress.history.map(r=>`<article class="history-item"><div><strong>${MODES[r.mode].name}</strong><b>${r.correct} pkt</b></div><p>${accuracy(r.correct,r.wrong)}% poprawnych · ${r.correct+r.wrong} zadań · ${minutes(r.duration)}</p><small>${escape(resultScopeLabel(r))}<br>${escape(new Date(r.date).toLocaleString('pl-PL',{dateStyle:'short',timeStyle:'short'}))}${r.early?' · zakończona wcześniej':''}</small></article>`).join(''):'<section class="empty card"><span aria-hidden="true">✦</span><h2>Tu pojawią się Twoje przygody</h2><p>Wybierz tryb i zagraj pierwszą rundę.</p>'+btn('Wybierz przygodę','home','primary')+'</section>');
}
function unlockAudio(){if(!settings.sound)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio||=new Audio();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{/* Optional sound. */}}
function beep(correct){if(!settings.sound)return;try{unlockAudio();if(!audio||audio.state!=='running')return;const tone=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;tone.type='sine';tone.frequency.setValueAtTime(correct?660:220,t);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.045,t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+.14);tone.connect(gain);gain.connect(audio.destination);tone.start(t);tone.stop(t+.15);tone.onended=()=>{tone.disconnect();gain.disconnect();};}catch{/* Keep playing without audio. */}}
function start() {
 settleResult(root);
 const config=configs[selectedMode];
 try{const source=createSource(selectedMode,config,words);game=new Session(source,config.duration);if(selectedMode==='spelling'&&config.dyktando){game.untimed=true;game.questionLimit=source.length;}}catch(e){const message=root.querySelector('#setup-error');if(message){message.textContent=e.message;message.hidden=false;}return;}
 game.mode=selectedMode;game.feedbackMs=selectedMode==='spelling'?1400:700;game.config={...config};save('configs',configs);unlockAudio();lastResult=null;memoryInput=[];phraseInput=[];view='game';root.dataset.view=view;root.dataset.mode=selectedMode;root.scrollTop=0;renderedState='';renderedQuestion=0;renderGame();startGameTicker();
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
   if(game?.state==='feedback-correct')return `<div class="phrase-complete">${slots(words,false,'correct-row')}</div>`;
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
 if(game.mode==='spelling'){spellingArt.render(game);renderedState=game.state;renderedQuestion=game.question;updateClock();return;}
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
   ?(exposing?'Przeczytaj i zapamiętaj':feedback?(correct?'Świetnie ułożone!':'Porównaj kolejność'):'Dotknij słów we właściwej kolejności')
   :(exposing?'Za chwilę tekst zniknie…':q.kind==='reading'?(q.difficulty===1?'Wybierz słowo':'Odpowiedz na pytanie'):escape(q.prompt));
 let answersBlock='';
 if(q.kind==='memory'){
  if(exposing)answersBlock='<div class="answers memory-keypad concealed" inert aria-hidden="true"><div class="memory-wait"><p>Po chwili odtworzysz liczby w tej samej kolejności.</p></div></div>';
  else if(feedback)answersBlock='<div class="answers memory-keypad"><div class="memory-feedback-space"><p>Poprawna sekwencja jest pokazana wyżej.</p></div></div>';
  else answersBlock=`<div class="answers memory-keypad">${Array.from({length:10},(_,i)=>btn(String(i+1),'memory-digit','answer memory-key',`data-value="${i+1}" aria-label="Liczba ${i+1}"`)).join('')}</div>`;
 }else if(q.kind==='reading-phrase'){
  if(exposing)answersBlock='<div class="phrase-word-bank is-waiting" inert aria-hidden="true"><p>Za chwilę ułożysz ją z pojedynczych słów.</p></div>';
  else if(feedback)answersBlock=`<div class="phrase-word-bank phrase-feedback-bank ${correct?'is-correct':''}"><p>${correct?'Następna fraza za chwilę.':'Poprawna kolejność jest pokazana wyżej.'}</p></div>`;
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
 const progressNode=root.querySelector('progress');
 if(game.untimed){
  const left=game.questionsRemaining(),value=String(left??0);
  if(timer.textContent!==value)timer.textContent=value;
  timer.classList.remove('urgent');timer.setAttribute('aria-label','Pozostało pytań: '+value);
  if(progressNode){progressNode.max=game.questionLimit||80;progressNode.value=left??0;}
  return;
 }
 const seconds=Math.ceil(game.remaining/1000),value=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
 if(timer.textContent!==value)timer.textContent=value;
 timer.classList.toggle('urgent',seconds<=15);
 if(progressNode)progressNode.value=game.remaining;
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
function pause(exit=false){if(!game||view!=='game')return;stopGameTicker();spellingArt.closeHint();game.pause();syncGame();if(game.state==='ended')return;spellingArt.setPaused(true);root.classList.add('paused');showModal(exit?'Zakończyć tę rundę?':'Mała przerwa',`<p>${exit?'Zapiszemy wynik i pokażemy podsumowanie.':'Odpocznij chwilę. Czas na Ciebie czeka.'}</p><div class="stack">${btn(exit?'Graj dalej':'Wracam do gry','resume','primary')}${btn(exit?'Zakończ i zobacz podsumowanie':'Zakończ rundę',exit?'end-home':'exit')}</div>`);}
function resume(){modal.close();root.classList.remove('paused');game?.resume();spellingArt.setPaused(false);syncGame();if(view==='game')startGameTicker();root.querySelector(game?.state==='playing'?'.answer':'[data-action="next"]')?.focus({preventScroll:true});}
function finish(early=false,goHome=false){
 if(!game||lastResult)return;game.end();if(modal.open)modal.close();root.classList.remove('paused');
 stopGameTicker();
 const result={id:resultId(),playerId:activePlayer?.id||null,...game.config,mode:game.mode,correct:game.correct,wrong:game.wrong,date:new Date().toISOString(),early,attempts:game.mode==='spelling'?[...game.attempts]:undefined};
 const record=recordResult(progress,result);void persistProgress();lastResult=result;
 if(goHome&&result.mode!=='spelling'){navigate('home');return;}view='results';
 if(result.mode==='spelling'){
  const render=(animate=false,delay=1000)=>{spellingArt.reset();setScreenTheme('#dfddfc');renderSpellingResult(root,result,words,null,{animate,delay});};
  void transitionToResult(root,()=>spellingArt.setPaused(true),render).catch(()=>{render();root.inert=false;});return;
 }
 spellingArt.reset();root.dataset.view=view;
 root.innerHTML=`<section class="result"><div class="result-star" aria-hidden="true">✦</div><span class="eyebrow">Przygoda ukończona</span><h1 tabindex="-1">Dobra robota!</h1><p>Mały trening, kolejny krok do przodu.</p><span class="badge">${MODES[result.mode].name} · ${result.dyktando?'Dyktando':minutes(result.duration)}</span><div class="stats">${[['Poprawne',result.correct],['Do powtórki',result.wrong],['Razem',result.correct+result.wrong]].map(([label,n])=>`<div class="stat"><b>${n}</b><span>${label}</span></div>`).join('')}</div><p class="accuracy"><strong>${accuracy(result.correct,result.wrong)}%</strong> poprawnych odpowiedzi</p><p class="record">${record?'✦ Twój nowy rekord!':'Każda runda pomaga zapamiętać więcej.'}</p><div class="stack">${btn('Jeszcze jedna runda →','again','primary')}${btn('Wybierz inną przygodę','home')}</div></section>`;root.querySelector('h1').focus({preventScroll:true});
}
function clearPrompt(){showModal('Wyczyścić wyniki?',`<p>Usuniesz historię i rekordy. Ustawienia zostaną zachowane.</p><div class="stack">${btn('Zachowaj wyniki','cancel-clear','primary')}${btn('Wyczyść wyniki','confirm-clear','danger')}</div>`);}
async function dispatch(event){const button=event.target.closest('button[data-action]');if(!button||button.disabled)return;const action=button.dataset.action;
 if(action==='players'){pendingPlayerId=null;pendingNickname='';pinInput='';pinError='';playersPage();return;}
 if(action==='add-player'){pendingPlayerId=null;pendingNickname='';pendingAvatarId='a';pinInput='';pinError='';playerCreatePage();return;}
 if(action==='choose-player'){
  selectedPlayerId=button.dataset.player;
  root.querySelectorAll('.player-card').forEach(card=>{
   const selected=card.dataset.player===selectedPlayerId;
   card.classList.toggle('is-selected',selected);card.setAttribute('aria-pressed',String(selected));
   card.querySelector('.player-select-mark').innerHTML=selected?`<span class="check">${playerCheckIcon}</span>`:'<span class="empty-check"></span>';
  });
  const next=root.querySelector('[data-action="continue-player"]');if(next)next.disabled=false;
  return;
 }
 if(action==='guest-player'){await activatePlayer(playerService.beginGuestSession());return;}
 if(action==='continue-player'){if(!selectedPlayerId)return;pendingPlayerId=selectedPlayerId;pendingNickname='';pinInput='';pinError='';playerPinPage();return;}
 if(action==='choose-avatar'){pendingAvatarId=button.dataset.avatar||'a';root.querySelectorAll('[data-action="choose-avatar"]').forEach(node=>{const selected=node.dataset.avatar===pendingAvatarId;node.classList.toggle('is-selected',selected);node.setAttribute('aria-pressed',String(selected));});const preview=root.querySelector('.create-avatar-preview');if(preview)preview.innerHTML=avatarMarkup({avatarId:pendingAvatarId},'player-avatar-large');return;}
 if(action==='pin-digit'){if(pinInput.length<4){pinInput+=button.dataset.digit;pinError='';playerPinPage();}return;}
 if(action==='pin-backspace'){pinInput=pinInput.slice(0,-1);pinError='';playerPinPage();return;}
 if(action==='submit-pin'){await submitPlayerPin();return;}
 if(action==='switch-player'){playerService.lockSession();activePlayer=null;pendingPlayerId=null;pendingNickname='';pinInput='';pinError='';await refreshPlayers();playersPage();return;}
 if(['home','settings'].includes(action))navigate(action);
 if(action==='history'){collectionReturn=view==='results'&&lastResult?.mode==='spelling'?{result:lastResult,ui:getResultViewState(root)}:null;navigate('history');}
 if(action==='return-results'&&collectionReturn){const back=collectionReturn;collectionReturn=null;view='results';selectedMode=back.result.mode;setScreenTheme('#dfddfc');renderSpellingResult(root,back.result,words,back.ui);}
 if(action==='show-result-rule'&&view==='results')showResultRule(root,button);
 if(action==='toggle-result'&&view==='results')toggleResultDetail(root,button);
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
 if(action==='clear')clearPrompt();if(action==='cancel-clear')modal.close();if(action==='confirm-clear'){progress=cleanProgress(null);void persistProgress();modal.close();navigate(view);}
 if(action==='retry')load();
}
root.addEventListener('click',dispatch);modal.addEventListener('click',dispatch);
modal.addEventListener('cancel',e=>{e.preventDefault();if(view==='game')resume();else modal.close();});
root.addEventListener('submit',e=>{if(e.target.id==='player-create-form'){e.preventDefault();const data=new FormData(e.target);const nickname=String(data.get('nickname')||'').trim();if(nickname.length<2){e.target.querySelector('#player-nickname')?.focus();return;}pendingNickname=nickname.slice(0,20);pendingPlayerId=null;pinInput='';pinError='';playerPinPage();return;}if(e.target.id==='setup-form'){e.preventDefault();start();}});
root.addEventListener('change',e=>{
 if(view==='wizard'){
  const data=new FormData(root.querySelector('#setup-form'));configs[selectedMode]=cleanConfig(selectedMode,{category:data.get('category'),difficulty:Number(data.get('difficulty')),duration:Number(data.get('duration')),dyktando:selectedMode==='spelling'&&data.get('dyktando')==='1'});save('configs',configs);
  // Some approved spelling categories have no records at a given difficulty.
  const empty=selectedMode==='spelling'&&!createSource(selectedMode,configs[selectedMode],words).length;
  const message=root.querySelector('#setup-error');message.hidden=!empty;message.textContent=empty?'W tym wyborze nie ma słów. Zmień kategorię, poziom albo wyłącz „Tylko dyktando”.':'';root.querySelector('.start-button').disabled=empty;
 }
 if(view==='settings'){if(e.target.id==='sound'){settings.sound=e.target.checked;unlockAudio();}if(e.target.id==='difficulty')settings.difficulty=e.target.checked;save('settings',settings);}
});
document.addEventListener('keydown',e=>{if(e.key==='Tab')document.body.classList.add('keyboard');if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||modal.open||view!=='game')return;if(/^[1-6]$/.test(e.key)&&game.state==='playing'){e.preventDefault();root.querySelectorAll('.answer')[Number(e.key)-1]?.click();}if(e.key==='Escape'){e.preventDefault();pause();}});
document.addEventListener('pointerdown',()=>document.body.classList.remove('keyboard'));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&view==='game')pause();});
window.addEventListener('pagehide',()=>{if(view==='game')pause();});
async function load(){root.innerHTML='<p class="loading" role="status">Przygotowujemy małe przygody…</p>';try{const parts=await Promise.all(Array.from({length:8},async(_,i)=>{const response=await fetch(`data/words-0${i+1}.json`);if(!response.ok)throw Error('Brak słów');return response.json();}));words=validateWords(parts.flat());if(window.__MALA_NAUKA_RESULT_PREVIEW__){selectedMode='spelling';lastResult=exampleResult(words,new URLSearchParams(location.search).get('case')||'mixed');view='results';renderSpellingResult(root,lastResult,words,null,{animate:new URLSearchParams(location.search).has('animate')});window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='result-preview'||!['mixed','completed','correct','review','dyktando','empty'].includes(event.data.scenario))return;lastResult=exampleResult(words,event.data.scenario);collectionReturn=null;view='results';renderSpellingResult(root,lastResult,words);});return;}await playerService.init();await refreshPlayers();const sessionPlayer=await playerService.getSessionPlayer();if(globalThis.__MALA_NAUKA_MODE__&&sessionPlayer)await activatePlayer(sessionPlayer);else playersPage();}catch{root.innerHTML=`<section class="empty card"><h1>Nie udało się wczytać gry</h1><p>Sprawdź połączenie i spróbuj ponownie.</p>${btn('Spróbuj ponownie','retry','primary')}</section>`;}}
async function registerOffline(){if(!('serviceWorker'in navigator))return;try{await navigator.serviceWorker.register(new URL('./sw.js',import.meta.url),{scope:new URL('./',import.meta.url).pathname});await navigator.serviceWorker.ready;offlineReady=true;}catch{offlineReady=false;}const status=root.querySelector('#offline-status');if(status)status.textContent=offlineReady?offlineStatus():'Nie udało się przygotować gry offline. Otwórz ją ponownie z internetem.';}
load();registerOffline();
