import {performanceStatus,STATUS_NAMES,PERFORMANCE_HELP} from '../spelling/performance-model.mjs';
import {html,number,savedMarker} from './preview-model.mjs';
import {get} from './model.mjs';
import {DEFAULT_EFFECTS,EFFECT_STYLES,effectBudget,createEffectPicker,frameStats} from '../spelling/effect-model.mjs';
import {DEFAULT_SCORING,scoreAttempts,scoreResult} from '../spelling/scoring.mjs';

const labels={duration:'Czas efektu',particles:'Liczba drobinek',spread:'Zasięg',scale:'Powiększenie bańki',speed:'Tempo bańki',amplitude:'Falowanie',orbit:'Ruch wokół środka',transitionDuration:'Zmiana obrazka',transitionBlur:'Rozmycie przy zmianie',transitionSparks:'Drobinki przy zmianie',particleBudget:'Maksimum drobinek',comboEvery:'Combo co tyle odpowiedzi',comboBoost:'Siła combo',shake:'Drgnięcie przy błędzie',correctPoints:'Punkty za poprawną',wrongPenalty:'Odjęcie za błąd',hintPercent:'Punkty z podpowiedzią (%)',comboBonus:'Bonus combo'};
export class StudioPlay {
 constructor({workspace,getDesign,getBase,edit,endEdit,notice}){
  Object.assign(this,{workspace,getDesign,getBase,edit,endEdit,notice});
  this.id='spark';this.event='correct';this.loop=false;this.delay=1000;this.running=false;this.ready=false;this.run=0;this.pick=createEffectPicker();this.sample={correct:8,wrong:2,hints:0,order:'series',mode:'count',duration:180};
  workspace.addEventListener('click',e=>this.click(e));workspace.addEventListener('input',e=>this.input(e));workspace.addEventListener('change',e=>this.change(e));
  window.addEventListener('message',e=>this.message(e));document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();});
  document.addEventListener('mala-nauka:studio-pane',e=>{if(!this.isOpen)return;if(e.detail.pane==='preview')this.post('resume');else this.stop();});
 }
 get config(){const c=this.getDesign().config;return {...c,effects:c.effects||DEFAULT_EFFECTS,scoring:c.scoring||DEFAULT_SCORING};}
 get effects(){return this.config.effects||DEFAULT_EFFECTS;}
 get isOpen(){return Boolean(this.workspace.querySelector('[data-play-lab]'));}
 leave(){this.stop();this.resize?.disconnect();this.ready=false;}
 post(type,extra={}){this.workspace.querySelector('#effect-frame')?.contentWindow?.postMessage({channel:'mala-nauka-effects',type,...extra},location.origin);}
 sendDesign(){if(this.isOpen){this.post('design',this.getDesign());this.updateBudget();}}
 control(path,label,min,max,step=1,unit=''){
  const value=get(this.config,path),saved=get(this.getBase(),path)??value;
  return `<div class="control-row play-control"><label for="range-${path}">${html(label||labels[path.split('.').at(-1)])}</label><div class=control-value><input type=number data-play-value="${path}" min=${min} max=${max} step=${step} value=${value} aria-label="${html(label||labels[path.split('.').at(-1)])}"><span>${unit}</span></div><div class=control-track><input id="range-${path}" type=range data-play-value="${path}" min=${min} max=${max} step=${step} value=${value} aria-label="${html(label||labels[path.split('.').at(-1)])}"><i class=saved-tick style="left:${savedMarker(saved,min,max)}%" title="Zapisane: ${saved}"></i></div><div class=control-caption><span>zapisane: ${number(saved)} ${unit}</span><button class=small-button data-play-reset="${path}">Przywróć</button></div></div>`;
 }
 render(){
  this.leave();const p=this.effects.presets[this.id];
  this.workspace.innerHTML=`<div class="motion-workspace effect-workspace ${this.event==='wrong'?'wrong-event':''}" data-play-lab=effects><section class="motion-preview"><div class=page-intro><div><h2>Efekty odpowiedzi i bańka</h2><p>Wybierz efekt → ustaw ruch → odtwórz. Zapis zmienia ten sam silnik w grze.</p></div></div><div class="motion-route effect-route"><label class=form-field><span>Sytuacja</span><select id=effect-event><option value=correct ${this.event==='correct'?'selected':''}>Poprawna odpowiedź</option><option value=wrong ${this.event==='wrong'?'selected':''}>Niepoprawna odpowiedź</option><option value=combo ${this.event==='combo'?'selected':''}>Combo</option></select></label><label class=form-field><span>Losowanie w grze</span><select id=effect-random><option value=true ${this.effects.randomize?'selected':''}>Losowo, bez powtórki efektu</option><option value=false ${!this.effects.randomize?'selected':''}>Pierwszy aktywny efekt</option></select></label></div><div class="motion-shortcuts effect-presets" aria-label="Biblioteka dziesięciu efektów">${Object.entries(this.effects.presets).map(([id,row],i)=>`<button data-effect-id=${id} class="${id===this.id?'active':''} ${row.enabled?'':'disabled-preset'}" aria-pressed=${id===this.id}><span class=preset-dot style="background:${row.color}"></span><span>${i+1}. ${html(row.name)}</span>${row.enabled?'':' · wyłączony'}</button>`).join('')}</div><div class=motion-playbar><button class=solid-button id=effect-play disabled>▶ Odtwórz efekt</button><button class=quiet-button id=effect-stop>Zatrzymaj</button><label><input id=effect-loop type=checkbox ${this.loop?'checked':''}>Pętla</label><label>Przerwa <input type=number id=effect-delay min=250 max=5000 step=250 value=${this.delay} aria-label="Przerwa między efektami"> ms</label><button class=quiet-button id=effect-tour>Przejdź przez 10 efektów</button></div><div class="motion-status effect-meter" id=effect-meter role=status>Ładujemy podgląd bańki i ilustrację…</div><div class="motion-stage effect-stage"><div class="motion-phone effect-phone"><div class=phone-inner><iframe id=effect-frame class="active device-frame" src="effect-preview.html" title="Podgląd bańki i efektu na iPhone 13 Pro"></iframe></div><div class=phone-notch></div><div class=phone-homebar></div></div></div></section><aside class=inspector id=play-inspector>${this.effectInspector(p)}</aside></div>`;
  this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(this.workspace.querySelector('.effect-stage'));this.fit();
 }
 fit(){const stage=this.workspace.querySelector('.effect-stage');if(stage){const scale=Math.min(1,(stage.clientWidth-20)/414,(stage.clientHeight-12)/876);stage.style.setProperty('--motion-scale',Math.max(.2,scale));}}
 effectInspector(p){
  const wrong=`<h2>Reakcja na błąd</h2><p class=description>Delikatny sygnał, poprawny zapis i suwak przejścia w grze.</p>${this.control('effects.wrong.duration','Czas reakcji na błąd',100,1000,10,'ms')}${this.control('effects.wrong.shake',null,0,12,1,'px')}<label class=form-field><span>Kolor sygnału błędu</span><input type=color id=wrong-color value=${this.effects.wrong.color}></label>`;
  const selected=`<h2>${html(p.name)}</h2><label class=form-field><span>Nazwa efektu</span><input id=effect-name maxlength=50 value="${html(p.name)}"></label><label class=play-check><input type=checkbox id=effect-enabled ${p.enabled?'checked':''}>Aktywny w losowaniu</label><label class=form-field><span>Kształt drobinek</span><select id=effect-style>${Object.entries(EFFECT_STYLES).map(([id,label])=>`<option value=${id} ${id===p.style?'selected':''}>${label}</option>`).join('')}</select></label><label class=form-field><span>Kolor efektu</span><input type=color id=effect-color value=${p.color}></label>${this.control(`effects.presets.${this.id}.duration`,null,200,1400,50,'ms')}${this.control(`effects.presets.${this.id}.particles`,null,0,48)}${this.control(`effects.presets.${this.id}.spread`,null,20,140,2,'px')}${this.control(`effects.presets.${this.id}.scale`,null,1,1.18,.01,'×')}`;
  return `<span class=eyebrow>Ustawienia odpowiedzi</span><label class=play-check><input type=checkbox id=all-effects-enabled ${this.effects.enabled?'checked':''}>Efekty odpowiedzi włączone</label><div id=effect-budget class=budget-note></div><p class=description>Biały znacznik na suwaku pokazuje ostatni zapis. Przywróć lub Cofnij pozwala wrócić do poprzedniej wartości.</p>${this.event==='wrong'?wrong:selected}<details class=play-details><summary>Combo i budżet dla wszystkich efektów</summary>${this.control('effects.comboEvery',null,2,12)}${this.control('effects.comboBoost',null,1,1.8,.05,'×')}${this.control('effects.particleBudget',null,0,48)}</details><details class=play-details><summary>Bańka i zmiana obrazka</summary><label class=form-field><span>Przeliczanie kształtu bańki</span><select id=bubble-frame-rate>${[15,24,30].map(hz=>`<option value=${hz} ${(this.effects.bubble.frameRate||24)===hz?'selected':''}>${hz} Hz · ${hz===15?'oszczędne':hz===24?'domyślne':'częstsze'}</option>`).join('')}</select></label><p class=description>${PERFORMANCE_HELP.economical}</p><p>Te ustawienia obowiązują we wszystkich bańkach: grze, podpowiedziach i ekranach zasad.</p>${this.control('effects.bubble.speed',null,2.2,6.6,.1)}${this.control('effects.bubble.amplitude',null,0,5,.05)}${this.control('effects.bubble.orbit',null,0,2,.05)}${this.control('effects.bubble.transitionDuration',null,200,1500,50,'ms')}${this.control('effects.bubble.transitionBlur',null,0,6,.1,'px')}${this.control('effects.bubble.transitionSparks',null,0,24)}<button class=quiet-button id=effect-change-picture>Odtwórz zmianę obrazka</button></details>${this.event==='wrong'?'':`<details class=play-details><summary>Niepoprawna odpowiedź</summary>${wrong}</details>`}<div class=effect-timeline aria-label="Przebieg efektu"><span>0 ms</span><b>${this.event==='wrong'?'Drgnięcie':'Bańka'}</b><b>${this.event==='wrong'?'Sygnał błędu':'Drobinki'}</b><span>Powrót</span></div><p class=description>Ograniczony ruch urządzenia jest respektowany automatycznie. Jeden efekt naraz. Pętla zatrzymuje się po opuszczeniu podglądu.</p>`;
 }
 updateBudget(){
  const node=this.workspace.querySelector('#effect-budget');if(!node)return;
  const p=this.effects.presets[this.id],b=effectBudget(this.effects,p,this.event==='combo');
  node.innerHTML=`<meter class=budget-meter min=0 max=48 value=${b.particles} aria-label="Budżet drobinek"></meter><strong>${this.event==='wrong'?'Sygnał błędu':`${b.particles} drobinek · ${b.duration} ms`}</strong><span>${b.capped?'Budżet przycina liczbę drobinek — także przy combo.':'W granicach budżetu. Transformacje i przezroczystość.'}</span><small>Limit 48 drobinek zapobiega nieograniczonemu wzrostowi efektu. Płynność mierzymy w podglądzie.</small>`;
 }
 play(tour=false){
  if(!this.ready)return;this.stop();this.running=true;this.measurements=[];this.touring=tour;this.tourIndex=0;this.playOne();
 }
 playOne(){
  if(!this.running||document.hidden)return;
  const ids=Object.keys(this.effects.presets),id=this.touring?ids[this.tourIndex%ids.length]:this.id;
  this.post('resume');this.post('play',{id,event:this.event,streak:this.effects.comboEvery,run:++this.run});
  this.workspace.querySelector('#effect-play').textContent='▶ Odtwórz ponownie';
 }
 stop(){this.running=false;clearTimeout(this.timer);this.post('stop');}
 message(e){
  const frame=this.workspace.querySelector('#effect-frame');if(e.origin!==location.origin||e.source!==frame?.contentWindow||e.data?.channel!=='mala-nauka-effects')return;
  if(e.data.type==='ready'){this.ready=true;this.sendDesign();this.post(document.body.classList.contains('mobile-editor')&&document.body.dataset.mobilePane!=='preview'?'stop':'resume');this.workspace.querySelector('#effect-play').disabled=false;this.workspace.querySelector('#effect-meter').textContent='Podgląd gotowy. Odtwórz efekt lub włącz pętlę, aby zmierzyć płynność.';this.updateBudget();}
  if(e.data.type==='played'&&e.data.run===0){this.run=0;this.running=false;this.measurements=[];}
  if(e.data.type==='metrics'){
   if(e.data.run!==this.run)return;
   const m=e.data.metrics;this.measurements=[...(this.measurements||[]),...(m.intervals||[])].slice(-300);Object.assign(m,frameStats(this.measurements));const node=this.workspace.querySelector('#effect-meter');
   if(node){const result=performanceStatus(m);node.innerHTML=m.disabled?'Efekty wyłączone w ustawieniach.':`<strong class="performance-status ${result.overall}"><i></i>${STATUS_NAMES[result.overall]} · ${html(m.presetName||'Efekt')}${m.reduced?' · ograniczony ruch':''}</strong><div class=performance-cards>${result.cards.map(c=>`<div class="performance-card ${c.status}"><span>${c.label}</span><b>${c.value}</b><small>${c.detail}</small><strong><i></i>${STATUS_NAMES[c.status]}</strong></div>`).join('')}</div>${!m.ready?'<p>Próbka: ${m.samples||0} klatek. Włącz pętlę, aby zebrać dłuższy pomiar.</p>':''}<details class=performance-help><summary>Jak czytać kolory i ograniczać obciążenie?</summary>${Object.entries(PERFORMANCE_HELP).filter(([key])=>key==='economical'||result.cards.some(c=>c.id===key)).map(([key,text])=>`<p>${html(text)}</p>`).join('')}<p>Próbuj mniejszej liczby drobinek i krótszego efektu. Najpierw ogranicz rozmycie i drobinki zmiany obrazka. Karta w tle i zdalny podgląd mogą obniżać FPS. Zielony wynik z desktopu nie zastępuje sprawdzenia na telefonie.</p><a href="https://web.dev/articles/animations-overview" target=_blank rel=noopener>Wytyczne animacji przeglądarkowych ↗</a></details>${result.overall==='red'||result.overall==='yellow'?'<button class=quiet-button id=effect-economical>Wypróbuj 15 Hz dla kształtu bańki</button>':''}`;}

   if(this.running&&(this.loop||this.touring)){
    if(this.touring&&++this.tourIndex>=10){this.running=false;return;}
    this.timer=setTimeout(()=>this.playOne(),this.delay);
   }else this.running=false;
  }
 }
 click(e){
  if(!this.isOpen)return;const b=e.target.closest('button');if(!b)return;
  if(b.dataset.effectId){this.stop();this.id=b.dataset.effectId;this.workspace.querySelectorAll('[data-effect-id]').forEach(n=>{n.classList.toggle('active',n.dataset.effectId===this.id);n.setAttribute('aria-pressed',String(n.dataset.effectId===this.id));});this.workspace.querySelector('#play-inspector').innerHTML=this.effectInspector(this.effects.presets[this.id]);this.updateBudget();}
  if(b.id==='effect-economical'){this.edit('effects.bubble.frameRate',15);this.endEdit();const select=this.workspace.querySelector('#bubble-frame-rate');if(select)select.value='15';this.notice('Kształt bańki jest przeliczany 15 razy/s. Odtwórz ponownie i porównaj.');}
  if(b.id==='effect-play')this.play();if(b.id==='effect-stop')this.stop();if(b.id==='effect-tour')this.play(true);
  if(b.id==='effect-change-picture'){this.stop();this.post('picture');}
  if(b.dataset.playReset){const path=b.dataset.playReset;this.edit(path,get(this.getBase(),path)??get({effects:DEFAULT_EFFECTS,scoring:DEFAULT_SCORING},path));this.endEdit();this.refreshControl(path);if(this.workspace.querySelector('[data-play-lab=scoring]'))this.updateScore();}
  if(b.id==='score-load-last')void this.loadLastRound();
  if(b.dataset.scoreScenario){this.loadedResult=null;this.sample={...this.sample,...{perfect:{correct:10,wrong:0,hints:0,order:'series'},mistakes:{correct:7,wrong:3,hints:0,order:'mixed'},help:{correct:8,wrong:2,hints:3,order:'series'},empty:{correct:0,wrong:0,hints:0,order:'series'}}[b.dataset.scoreScenario]};this.renderScoring();}
 }
 refreshControl(path){for(const n of this.workspace.querySelectorAll('[data-play-value]'))if(n.dataset.playValue===path)n.value=get(this.config,path);}
 input(e){
  if(!this.isOpen)return;const n=e.target,path=n.dataset.playValue;
  if(path){const v=Number(n.value);if(!n.value||!n.validity.valid)return;this.edit(path,v);this.refreshControl(path);this.updateScore();}
  if(n.dataset.scoreInput){if(n.validity.valid){this.sample[n.dataset.scoreInput]=Number(n.value);this.updateScore();}}
  const colors={'effect-color':`effects.presets.${this.id}.color`,'wrong-color':'effects.wrong.color'};
  if(colors[n.id])this.edit(colors[n.id],n.value);
 }
 change(e){
  if(e.target.id==='bubble-frame-rate'){this.edit('effects.bubble.frameRate',Number(e.target.value));this.endEdit();return;}
  if(!this.isOpen)return;const n=e.target;
  if(n.dataset.playValue){this.endEdit();return;}
  if(n.id==='effect-event'){this.stop();this.event=n.value;this.workspace.querySelector('.effect-workspace').classList.toggle('wrong-event',this.event==='wrong');this.workspace.querySelector('#play-inspector').innerHTML=this.effectInspector(this.effects.presets[this.id]);this.updateBudget();}
  if(n.id==='effect-loop')this.loop=n.checked;
  if(n.id==='effect-delay')this.delay=Math.min(5000,Math.max(250,Number(n.value)||1000));
  const paths={'effect-random':'effects.randomize','effect-enabled':`effects.presets.${this.id}.enabled`,'all-effects-enabled':'effects.enabled','effect-style':`effects.presets.${this.id}.style`,'effect-name':`effects.presets.${this.id}.name`};
  if(paths[n.id]){
   let v=['effect-enabled','all-effects-enabled'].includes(n.id)?n.checked:n.id==='effect-random'?n.value==='true':n.value.trim();
   if(n.id==='effect-name'&&(!v||v.length>50||/[<>\u0000-\u001f]/.test(v))){n.value=this.effects.presets[this.id].name;this.notice('Wpisz nazwę efektu, do 50 znaków.');return;}
   if(n.id==='effect-enabled'&&!v&&Object.values(this.effects.presets).filter(p=>p.enabled).length===1){n.checked=true;this.notice('Zostaw jeden aktywny efekt. Całość możesz wyłączyć głównym przełącznikiem.');return;}
   this.edit(paths[n.id],v);this.endEdit();
   if(n.id==='effect-name')this.workspace.querySelector('#play-inspector h2').textContent=this.effects.presets[this.id].name;
   this.workspace.querySelectorAll('[data-effect-id]').forEach(b=>{const p=this.effects.presets[b.dataset.effectId];b.querySelector('span:last-child').textContent=`${Object.keys(this.effects.presets).indexOf(b.dataset.effectId)+1}. ${p.name}`;b.classList.toggle('disabled-preset',!p.enabled);});
  }
  if(n.id==='score-order'){this.sample.order=n.value;this.updateScore();}
  if(n.id==='score-mode'){this.sample.mode=n.value;this.updateScore();}
 }
 attempts(){
  if(this.loadedResult)return structuredClone(this.loadedResult.attempts);
  const {correct,wrong,hints,order}=this.sample,rows=[];let c=0,w=0,h=0;
  for(let i=0;i<correct+wrong;i++){
   const good=order==='series'?i<correct:c<correct&&(w>=wrong||i%3!==2);
   if(good)c++;else w++;
   const hintUsed=good&&h<Math.min(hints,correct);if(hintUsed)h++;
   rows.push({word:`Słowo ${i+1}`,correct:good,hintUsed});
  }
  return rows;
 }
 async loadLastRound(){
  const status=this.workspace.querySelector('#score-load-status');status.textContent='Sprawdzamy ostatnią zakończoną rundę na tym urządzeniu…';
  try{
   const {playerService}=await import('../player-service.mjs');const player=await playerService.getSessionPlayer();
   const progress=player?await playerService.getProgress(player.id):null;
   const result=progress?.history?.find(r=>r.mode==='spelling'&&Array.isArray(r.attempts)&&r.attempts.length>0&&r.attempts.length<=500);
   if(!result){status.textContent='Brak zakończonej rundy ortografii aktywnego gracza na tym urządzeniu. Zagraj rundę w tej samej karcie lub wybierz scenariusz próby.';return;}
   if(!this.workspace.querySelector('[data-play-lab=scoring]'))return;
   this.loadedResult=structuredClone(result);const rows=result.attempts;
   this.sample={correct:rows.filter(r=>r.correct===true).length,wrong:rows.filter(r=>r.correct!==true).length,hints:rows.filter(r=>r.correct&&r.hintUsed).length,order:'series',mode:result.limitMode==='count'?'count':'time',duration:result.duration};
   this.renderScoring();this.workspace.querySelector('#score-load-status').textContent='Wczytano ostatnią rundę. Dane są lokalne; ten podgląd nie zapisuje wyników gracza.';
  }catch{if(status.isConnected)status.textContent='Nie udało się odczytać lokalnego wyniku. Scenariusze próby nadal działają.';}
 }
 renderScoring(){
  this.leave();this.workspace.innerHTML=`<div class="content-page score-workspace" data-play-lab=scoring><div class=page-intro><div><h2>Jak naliczamy wynik?</h2><p>Te same zasady obliczają wynik gry. Wypróbuj rundę, porównaj z zapisanym ustawieniem i sprawdź każdą odpowiedź.</p></div></div><div class=score-mini aria-live=polite></div><div class=score-grid><section class=panel><h3>${this.loadedResult?'Zakończona lokalna runda':'Przykładowa runda'}</h3><button class=quiet-button id=score-load-last>Wczytaj ostatnią lokalną rundę</button><p id=score-load-status class=description></p><div class=score-scenarios>${[['perfect','Bez błędu'],['mistakes','Z potknięciami'],['help','Z podpowiedziami'],['empty','Pusta runda']].map(([id,label])=>`<button class=quiet-button data-score-scenario=${id}>${label}</button>`).join('')}</div>${[['correct','Poprawne',0,80],['wrong','Błędne',0,80],['hints','Poprawne z podpowiedzią',0,80]].map(([key,label,min,max])=>`<label class=form-field><span>${label}</span><input type=number data-score-input=${key} value=${this.sample[key]} min=${min} max=${this.loadedResult?500:max} ${this.loadedResult?'disabled':''} aria-label="${label}"></label>`).join('')}<label class=form-field><span>Kolejność odpowiedzi</span><select id=score-order ${this.loadedResult?'disabled':''}><option value=series ${this.sample.order==='series'?'selected':''}>Poprawne jedna po drugiej</option><option value=mixed ${this.sample.order==='mixed'?'selected':''}>Błędy przerywają serie</option></select></label><label class=form-field><span>Rodzaj rundy</span><select id=score-mode ${this.loadedResult?'disabled':''}><option value=count ${this.sample.mode==='count'?'selected':''}>Limit słów / kategorie</option><option value=time ${this.sample.mode==='time'?'selected':''}>Na czas</option></select></label><p class=description>Dane próby nie trafiają do wyników gracza. Wczytana runda zachowuje własną kolejność i podpowiedzi; wybierz scenariusz, aby wrócić do próby. Podpowiedź przerywa serię bonusu. Słowo liczymy raz, niezależnie od liczby jego kategorii.</p></section><section class=panel><h3>Zasady dla ortografii</h3>${this.control('scoring.correctPoints',null,1,20)}${this.control('scoring.wrongPenalty',null,0,20)}${this.control('scoring.hintPercent',null,0,100,1,'%')}${this.control('scoring.comboEvery','Bonus co tyle poprawnych',2,12)}${this.control('scoring.comboBonus',null,0,20)}<p class=description>Początkowo: 1 punkt za poprawną odpowiedź, bez kar i bonusu. Skuteczność i liczba utrwalonych słów zachowują własne znaczenie. Rekordy porównujemy liczbą poprawnych odpowiedzi.</p></section><section class="panel score-output" id=score-output aria-live=polite></section></div><section class=panel><h3>Przeliczenie odpowiedź po odpowiedzi</h3><div class=table-wrap id=score-rows></div></section></div>`;this.updateScore();
 }
 updateScore(){
  const node=this.workspace.querySelector('#score-output');if(!node)return;
  const rows=this.attempts(),s=scoreAttempts(rows,this.config.scoring||DEFAULT_SCORING),saved=scoreAttempts(rows,this.getBase().scoring||DEFAULT_SCORING);
  const mini=this.workspace.querySelector('.score-mini');if(mini)mini.textContent=`Podgląd: ${number(s.total)} pkt · zapisane: ${number(saved.total)} pkt`;
  node.innerHTML=`<span class=eyebrow>Wynik tej próby</span><strong class=score-total>${number(s.total)} <small>pkt</small></strong><span class=score-comparison>Zapisane ustawienia: ${number(saved.total)} pkt</span>${this.loadedResult?`<p>Naliczone w chwili gry: <strong>${number(scoreResult(this.loadedResult).total)} pkt</strong>. Historia pozostaje zachowana.</p>`:''}<dl class=score-breakdown>${[['Za poprawne',s.base],['Z podpowiedzią odejmujemy',-s.hintDiscount],['Za błędy odejmujemy',-s.penalty],['Bonus combo',s.combo],['Skuteczność',s.accuracy+'%'],['Najdłuższa seria',s.bestStreak]].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><p>${this.sample.mode==='time'?'Runda na czas może poprawić rekord poprawnych odpowiedzi.':'Runda na liczbę słów nie nadpisuje rekordu rundy na czas.'}</p><p>Wynik nie spada poniżej zera. Historyczne rundy zachowują zasady z dnia gry.</p>${this.config.scoring.comboBonus&&this.config.scoring.comboEvery!==this.effects.comboEvery?`<p class=budget-note>Progi combo różnią się: efekt co ${this.effects.comboEvery}, bonus punktowy co ${this.config.scoring.comboEvery}. Możesz ustawić tę samą wartość w obu sekcjach.</p>`:''}${this.sample.hints>this.sample.correct?'<p class=budget-note>Podpowiedzi ograniczono do liczby poprawnych odpowiedzi.</p>':''}`;
  this.workspace.querySelector('#score-rows').innerHTML=`<table class=table><thead><tr><th>Nr</th><th>Słowo</th><th>Odpowiedź</th><th>Podpowiedź</th><th>Seria</th><th>Podstawa</th><th>Kara</th><th>Bonus</th><th>Zmiana</th></tr></thead><tbody>${s.rows.map(r=>`<tr><td>${r.index}</td><td>${html(r.word)}</td><td>${r.correct?'Poprawna':'Błędna'}</td><td>${r.hintUsed?'Tak':'—'}</td><td>${r.streak}</td><td>${number(r.base-r.hintDiscount)}</td><td>${r.penalty?'−'+r.penalty:'—'}</td><td>${r.combo||'—'}</td><td>${number(r.delta)}</td></tr>`).join('')||'<tr><td colspan=9>Bez odpowiedzi: 0 punktów i 0% skuteczności.</td></tr>'}</tbody></table>`;
 }
}
