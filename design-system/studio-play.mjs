import {html,number,savedMarker} from './preview-model.mjs';
import {get} from './model.mjs';
import {DEFAULT_EFFECTS,EFFECT_STYLES,effectBudget,createEffectPicker} from '../spelling/effect-model.mjs';
import {DEFAULT_SCORING,scoreAttempts} from '../spelling/scoring.mjs';

const labels={duration:'Czas efektu',particles:'Liczba drobinek',spread:'Zasięg',scale:'Powiększenie bańki',speed:'Tempo bańki',amplitude:'Falowanie',orbit:'Ruch wokół środka',transitionDuration:'Zmiana obrazka',transitionBlur:'Rozmycie przy zmianie',transitionSparks:'Drobinki przy zmianie',particleBudget:'Maksimum drobinek',comboEvery:'Combo co tyle odpowiedzi',comboBoost:'Siła combo',shake:'Drgnięcie przy błędzie',correctPoints:'Punkty za poprawną',wrongPenalty:'Odjęcie za błąd',hintPercent:'Punkty z podpowiedzią (%)',comboBonus:'Bonus combo'};
export class StudioPlay {
 constructor({workspace,getDesign,getBase,edit,endEdit,notice}){
  Object.assign(this,{workspace,getDesign,getBase,edit,endEdit,notice});
  this.id='spark';this.event='correct';this.loop=false;this.delay=1000;this.running=false;this.ready=false;this.run=0;this.pick=createEffectPicker();this.sample={correct:8,wrong:2,hints:0,order:'series',mode:'count',duration:180};
  workspace.addEventListener('click',e=>this.click(e));workspace.addEventListener('input',e=>this.input(e));workspace.addEventListener('change',e=>this.change(e));
  window.addEventListener('message',e=>this.message(e));document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();});
  document.addEventListener('mala-nauka:studio-pane',e=>{if(!this.isOpen)return;if(e.detail.pane==='preview')this.post('resume');else this.stop();});
 }
 get config(){return this.getDesign().config;}
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
  this.workspace.innerHTML=`<div class="motion-workspace effect-workspace" data-play-lab=effects><section class="motion-preview"><div class=page-intro><div><h2>Efekty odpowiedzi i bańka</h2><p>Wybierz efekt → ustaw ruch → odtwórz. Zapis zmienia ten sam silnik w grze.</p></div></div><div class="motion-route effect-route"><label class=form-field><span>Sytuacja</span><select id=effect-event><option value=correct ${this.event==='correct'?'selected':''}>Poprawna odpowiedź</option><option value=wrong ${this.event==='wrong'?'selected':''}>Niepoprawna odpowiedź</option><option value=combo ${this.event==='combo'?'selected':''}>Combo</option></select></label><label class=form-field><span>Losowanie w grze</span><select id=effect-random><option value=true ${this.effects.randomize?'selected':''}>Losowo, bez powtórki efektu</option><option value=false ${!this.effects.randomize?'selected':''}>Pierwszy aktywny efekt</option></select></label></div><div class="motion-shortcuts effect-presets" aria-label="Biblioteka dziesięciu efektów">${Object.entries(this.effects.presets).map(([id,row],i)=>`<button data-effect-id=${id} class="${id===this.id?'active':''} ${row.enabled?'':'disabled-preset'}" aria-pressed=${id===this.id}><span class=preset-dot style="background:${row.color}"></span><span>${i+1}. ${html(row.name)}</span>${row.enabled?'':' · wyłączony'}</button>`).join('')}</div><div class=motion-playbar><button class=solid-button id=effect-play disabled>▶ Odtwórz efekt</button><button class=quiet-button id=effect-stop>Zatrzymaj</button><label><input id=effect-loop type=checkbox ${this.loop?'checked':''}>Pętla</label><label>Przerwa <input type=number id=effect-delay min=250 max=5000 step=250 value=${this.delay} aria-label="Przerwa między efektami"> ms</label><button class=quiet-button id=effect-tour>Przejdź przez 10 efektów</button></div><div class="motion-status effect-meter" id=effect-meter role=status>Pomiary pojawią się po odtworzeniu. To test tej przeglądarki.</div><div class="motion-stage effect-stage"><div class="motion-phone effect-phone"><div class=phone-inner><iframe id=effect-frame class="active device-frame" src="effect-preview.html" title="Podgląd bańki i efektu na iPhone 13 Pro"></iframe></div><div class=phone-notch></div><div class=phone-homebar></div></div></div></section><aside class=inspector id=play-inspector>${this.effectInspector(p)}</aside></div>`;
  this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(this.workspace.querySelector('.effect-stage'));this.fit();
 }
 fit(){const stage=this.workspace.querySelector('.effect-stage');if(stage){const scale=Math.min(1,(stage.clientWidth-20)/414,(stage.clientHeight-12)/876);stage.style.setProperty('--motion-scale',Math.max(.2,scale));}}
 effectInspector(p){
  return `<span class=eyebrow>Edytujesz zapisany zestaw</span><h2>${html(p.name)}</h2><label class=form-field><span>Nazwa efektu</span><input id=effect-name maxlength=50 value="${html(p.name)}"></label><label class=play-check><input type=checkbox id=effect-enabled ${p.enabled?'checked':''}>Aktywny w losowaniu</label><label class=play-check><input type=checkbox id=all-effects-enabled ${this.effects.enabled?'checked':''}>Efekty odpowiedzi włączone</label><label class=form-field><span>Kształt drobinek</span><select id=effect-style>${Object.entries(EFFECT_STYLES).map(([id,label])=>`<option value=${id} ${id===p.style?'selected':''}>${label}</option>`).join('')}</select></label><label class=form-field><span>Kolor efektu</span><input type=color id=effect-color value=${p.color}></label><div id=effect-budget class=budget-note></div><p class=description>Biały znacznik na suwaku pokazuje ostatni zapis. Ustawienia działają dla wybranego zestawu.</p>${this.control(`effects.presets.${this.id}.duration`,null,200,1400,50,'ms')}${this.control(`effects.presets.${this.id}.particles`,null,0,48)}${this.control(`effects.presets.${this.id}.spread`,null,20,140,2,'px')}${this.control(`effects.presets.${this.id}.scale`,null,1,1.18,.01,'×')}<details class=play-details><summary>Combo i budżet dla wszystkich efektów</summary>${this.control('effects.comboEvery',null,2,12)}${this.control('effects.comboBoost',null,1,1.8,.05,'×')}${this.control('effects.particleBudget',null,0,48)}</details><details class=play-details><summary>Bańka i zmiana obrazka</summary><p>Te ustawienia obowiązują także między pytaniami w grze.</p>${this.control('effects.bubble.speed',null,2.2,6.6,.1)}${this.control('effects.bubble.amplitude',null,0,5,.05)}${this.control('effects.bubble.orbit',null,0,2,.05)}${this.control('effects.bubble.transitionDuration',null,200,1500,50,'ms')}${this.control('effects.bubble.transitionBlur',null,0,6,.1,'px')}${this.control('effects.bubble.transitionSparks',null,0,24)}<button class=quiet-button id=effect-change-picture>Odtwórz zmianę obrazka</button></details><details class=play-details ${this.event==='wrong'?'open':''}><summary>Niepoprawna odpowiedź</summary>${this.control('effects.wrong.duration','Czas reakcji na błąd',100,1000,50,'ms')}${this.control('effects.wrong.shake',null,0,12,1,'px')}<label class=form-field><span>Kolor sygnału błędu</span><input type=color id=wrong-color value=${this.effects.wrong.color}></label><p>Delikatny sygnał, poprawny zapis i suwak przejścia w grze. Bez karzących fajerwerków.</p></details><div class=effect-timeline aria-label="Przebieg efektu"><span>0 ms</span><b style="width:44%">Bańka</b><b>Drobinki</b><span>Powrót</span></div><p class=description>Tryb ograniczonego ruchu urządzenia jest respektowany automatycznie. Maksymalnie jeden efekt naraz.</p>`;
 }
 updateBudget(){
  const node=this.workspace.querySelector('#effect-budget');if(!node)return;
  const p=this.effects.presets[this.id],b=effectBudget(this.effects,p,this.event==='combo');
  node.innerHTML=`<strong>${this.event==='wrong'?'Sygnał błędu':`${b.particles} drobinek · ${b.duration} ms`}</strong><span>${b.capped?'Budżet przycina liczbę drobinek — także przy combo.':'W granicach budżetu. Transformacje i przezroczystość.'}</span><small>Obciążenie GPU: szacunek geometrii, ${b.load}. Moc/energia w watach niedostępna.</small>`;
 }
 play(tour=false){
  if(!this.ready)return;this.stop();this.running=true;this.touring=tour;this.tourIndex=0;this.playOne();
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
  if(e.data.type==='ready'){this.ready=true;this.sendDesign();this.post(document.body.classList.contains('mobile-editor')&&document.body.dataset.mobilePane!=='preview'?'stop':'resume');this.workspace.querySelector('#effect-play').disabled=false;this.updateBudget();}
  if(e.data.type==='metrics'){
   if(e.data.run!==this.run)return;
   const m=e.data.metrics,node=this.workspace.querySelector('#effect-meter');
   if(node)node.innerHTML=m.disabled?'Efekty wyłączone w ustawieniach.':`<strong>${m.reduced?'Ograniczony ruch':m.ready?`${m.fps} FPS · ${m.rating}`:'Za krótka próbka'}</strong><span>${m.ready?`95% klatek ≤ ${m.p95} ms · ${m.longFrames} klatek powyżej 25 ms`:'Odtwórz ponownie, aby zebrać klatki.'}</span><span>CPU / JS: przygotowanie ${m.setupMs??0} ms · ${m.particles} drobinek</span><small>${m.memory?`Pamięć JS: ${m.memory.heapMB} MB (cała karta)`:'Pamięć: pomiar niedostępny w tej przeglądarce'} · moc/energia: brak pomiaru</small>`;
   if(this.running&&(this.loop||this.touring)){
    if(this.touring&&++this.tourIndex>=10){this.running=false;return;}
    this.timer=setTimeout(()=>this.playOne(),this.delay);
   }else this.running=false;
  }
 }
 click(e){
  if(!this.isOpen)return;const b=e.target.closest('button');if(!b)return;
  if(b.dataset.effectId){this.stop();this.id=b.dataset.effectId;this.workspace.querySelectorAll('[data-effect-id]').forEach(n=>{n.classList.toggle('active',n.dataset.effectId===this.id);n.setAttribute('aria-pressed',String(n.dataset.effectId===this.id));});this.workspace.querySelector('#play-inspector').innerHTML=this.effectInspector(this.effects.presets[this.id]);this.updateBudget();}
  if(b.id==='effect-play')this.play();if(b.id==='effect-stop')this.stop();if(b.id==='effect-tour')this.play(true);
  if(b.id==='effect-change-picture')this.post('picture');
  if(b.dataset.playReset){const path=b.dataset.playReset;this.edit(path,get(this.getBase(),path));this.endEdit();this.refreshControl(path);if(this.workspace.querySelector('[data-play-lab=scoring]'))this.updateScore();}
  if(b.dataset.scoreScenario){this.sample={...this.sample,...{perfect:{correct:10,wrong:0,hints:0,order:'series'},mistakes:{correct:7,wrong:3,hints:0,order:'mixed'},help:{correct:8,wrong:2,hints:3,order:'series'},empty:{correct:0,wrong:0,hints:0,order:'series'}}[b.dataset.scoreScenario]};this.renderScoring();}
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
  if(!this.isOpen)return;const n=e.target;
  if(n.dataset.playValue){this.endEdit();return;}
  if(n.id==='effect-event'){this.stop();this.event=n.value;this.workspace.querySelector('#play-inspector').innerHTML=this.effectInspector(this.effects.presets[this.id]);this.updateBudget();}
  if(n.id==='effect-loop')this.loop=n.checked;
  if(n.id==='effect-delay')this.delay=Math.min(5000,Math.max(250,Number(n.value)||1000));
  const paths={'effect-random':'effects.randomize','effect-enabled':`effects.presets.${this.id}.enabled`,'all-effects-enabled':'effects.enabled','effect-style':`effects.presets.${this.id}.style`,'effect-name':`effects.presets.${this.id}.name`};
  if(paths[n.id]){
   let v=['effect-enabled','all-effects-enabled'].includes(n.id)?n.checked:n.id==='effect-random'?n.value==='true':n.value.trim();
   if(n.id==='effect-name'&&(!v||v.length>50||/[<>\u0000-\u001f]/.test(v))){n.value=this.effects.presets[this.id].name;this.notice('Wpisz nazwę efektu, do 50 znaków.');return;}
   if(n.id==='effect-enabled'&&!v&&Object.values(this.effects.presets).filter(p=>p.enabled).length===1){n.checked=true;this.notice('Zostaw jeden aktywny efekt. Całość możesz wyłączyć głównym przełącznikiem.');return;}
   this.edit(paths[n.id],v);this.endEdit();
   this.workspace.querySelectorAll('[data-effect-id]').forEach(b=>{const p=this.effects.presets[b.dataset.effectId];b.querySelector('span:last-child').textContent=`${Object.keys(this.effects.presets).indexOf(b.dataset.effectId)+1}. ${p.name}`;b.classList.toggle('disabled-preset',!p.enabled);});
  }
  if(n.id==='score-order'){this.sample.order=n.value;this.updateScore();}
  if(n.id==='score-mode'){this.sample.mode=n.value;this.updateScore();}
 }
 attempts(){
  const {correct,wrong,hints,order}=this.sample,rows=[];let c=0,w=0,h=0;
  for(let i=0;i<correct+wrong;i++){
   const good=order==='series'?i<correct:c<correct&&(w>=wrong||i%3!==2);
   if(good)c++;else w++;
   const hintUsed=good&&h<Math.min(hints,correct);if(hintUsed)h++;
   rows.push({word:`Słowo ${i+1}`,correct:good,hintUsed});
  }
  return rows;
 }
 renderScoring(){
  this.leave();this.workspace.innerHTML=`<div class="content-page score-workspace" data-play-lab=scoring><div class=page-intro><div><h2>Jak naliczamy wynik?</h2><p>Te same zasady obliczają wynik gry. Wypróbuj rundę, porównaj z zapisanym ustawieniem i sprawdź każdą odpowiedź.</p></div></div><div class=score-grid><section class=panel><h3>Przykładowa runda</h3><div class=score-scenarios>${[['perfect','Bez błędu'],['mistakes','Z potknięciami'],['help','Z podpowiedziami'],['empty','Pusta runda']].map(([id,label])=>`<button class=quiet-button data-score-scenario=${id}>${label}</button>`).join('')}</div>${[['correct','Poprawne',0,80],['wrong','Błędne',0,80],['hints','Poprawne z podpowiedzią',0,80]].map(([key,label,min,max])=>`<label class=form-field><span>${label}</span><input type=number data-score-input=${key} value=${this.sample[key]} min=${min} max=${max} aria-label="${label}"></label>`).join('')}<label class=form-field><span>Kolejność odpowiedzi</span><select id=score-order><option value=series ${this.sample.order==='series'?'selected':''}>Poprawne jedna po drugiej</option><option value=mixed ${this.sample.order==='mixed'?'selected':''}>Błędy przerywają serie</option></select></label><label class=form-field><span>Rodzaj rundy</span><select id=score-mode><option value=count ${this.sample.mode==='count'?'selected':''}>Limit słów / kategorie</option><option value=time ${this.sample.mode==='time'?'selected':''}>Na czas</option></select></label><p class=description>Dane próby nie trafiają do wyników gracza. Podpowiedź przerywa serię bonusu. Słowo liczymy raz, niezależnie od liczby jego kategorii.</p></section><section class=panel><h3>Zasady dla ortografii</h3>${this.control('scoring.correctPoints',null,1,20)}${this.control('scoring.wrongPenalty',null,0,20)}${this.control('scoring.hintPercent',null,0,100,5,'%')}${this.control('scoring.comboEvery','Bonus co tyle poprawnych',2,12)}${this.control('scoring.comboBonus',null,0,20)}<p class=description>Początkowo: 1 punkt za poprawną odpowiedź, bez kar i bonusu. Skuteczność i liczba utrwalonych słów zachowują własne znaczenie. Rekordy porównujemy liczbą poprawnych odpowiedzi.</p></section><section class="panel score-output" id=score-output aria-live=polite></section></div><section class=panel><h3>Przeliczenie odpowiedź po odpowiedzi</h3><div class=table-wrap id=score-rows></div></section></div>`;this.updateScore();
 }
 updateScore(){
  const node=this.workspace.querySelector('#score-output');if(!node)return;
  const rows=this.attempts(),s=scoreAttempts(rows,this.config.scoring||DEFAULT_SCORING),saved=scoreAttempts(rows,this.getBase().scoring||DEFAULT_SCORING);
  node.innerHTML=`<span class=eyebrow>Wynik tej próby</span><strong class=score-total>${number(s.total)} <small>pkt</small></strong><span class=score-comparison>Zapisane ustawienia: ${number(saved.total)} pkt</span><dl class=score-breakdown>${[['Za poprawne',s.base],['Z podpowiedzią odejmujemy',-s.hintDiscount],['Za błędy odejmujemy',-s.penalty],['Bonus combo',s.combo],['Skuteczność',s.accuracy+'%'],['Najdłuższa seria',s.bestStreak]].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><p>${this.sample.mode==='time'?'Runda na czas może poprawić rekord poprawnych odpowiedzi.':'Runda na liczbę słów nie nadpisuje rekordu rundy na czas.'}</p><p>Wynik nie spada poniżej zera. Historyczne rundy zachowują zasady z dnia gry.</p>${this.sample.hints>this.sample.correct?'<p class=budget-note>Podpowiedzi ograniczono do liczby poprawnych odpowiedzi.</p>':''}`;
  this.workspace.querySelector('#score-rows').innerHTML=`<table class=table><thead><tr><th>Nr</th><th>Odpowiedź</th><th>Podpowiedź</th><th>Seria</th><th>Podstawa</th><th>Kara</th><th>Bonus</th><th>Zmiana</th></tr></thead><tbody>${s.rows.map(r=>`<tr><td>${r.index}</td><td>${r.correct?'Poprawna':'Błędna'}</td><td>${r.hintUsed?'Tak':'—'}</td><td>${r.streak}</td><td>${number(r.base-r.hintDiscount)}</td><td>${r.penalty?'−'+r.penalty:'—'}</td><td>${r.combo||'—'}</td><td>${number(r.delta)}</td></tr>`).join('')||'<tr><td colspan=8>Bez odpowiedzi: 0 punktów i 0% skuteczności.</td></tr>'}</tbody></table>`;
 }
}
