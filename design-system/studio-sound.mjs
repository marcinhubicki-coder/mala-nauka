import {SOUND_CUES,SOUND_LAYERS,SOUND_PRESETS,SOUND_FIELDS,CUE_FIELDS,cueSettings,layerSeconds,DEFAULT_SOUND_SETTINGS,normalizeSoundSettings,SoundPreviewEngine,ambientLevels,generateCue,mixAmbience,wavBlob,zipBlob} from '../shared/sound-library.mjs';
import {StudioSoundMap} from './studio-sound-map.mjs';

import {LogoTransition,logoConfig} from '../shared/logo-transition.mjs';
const MODES=[['spelling','Ortografia','/ortografia/'],['math','Matematyka','/matematyka/'],['english','Angielski','/angielski/'],['reading','Czytanie','/czytanie/'],['flags','Flagi','/flagi/']];
const CHARACTER=[['energy','Energia','Sprężyste, wesołe tony'],['tempo','Tempo melodii','Wspólny rytm dzwonków i akordów'],['variation','Zmienność natury','Różne pluski, śpiewy i szelesty'],['warmth','Ciepło','Więcej = miękkie wysokie tony'],['ducking','Wyciszenie tła przy odpowiedzi','Tło robi miejsce sygnałom'],['logoVolume','Głośność kolorów i blobów','Nutki, rozlanie kolorów i odsłonięcie']];
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fieldUnit=field=>field==='tempo'?' BPM':field==='loopSeconds'?' s':'%';
const slider=(field,label,value,help)=>`<label class="sound-master-field"><span><strong>${label}</strong><small>${help}</small></span><input type="range" min="${SOUND_FIELDS[field][0]}" max="${SOUND_FIELDS[field][1]}" step="1" data-sound-field="${field}" value="${value}"><output data-sound-value="${field}">${value}${fieldUnit(field)}</output></label>`;
const CUE_CONTROLS=[['wood','Drewno','Miękki, krótki ton'],['bell','Dzwonek','Jasny, pogodny blask'],['pop','Sprężynka','Odbicie i pęknięcie bańki'],['air','Powietrze','Delikatny szelest'],['volume','Głośność brzmienia','Wspólna dla jego użyć'],['duration','Długość','Wydłuża cały efekt'],['pitch','Wysokość tonu','Niżej / wyżej'],['attack','Miękkość początku','Więcej = łagodniejsze wejście']];
const cueUnit=key=>key==='pitch'?' półtonów':key==='attack'?' ms':'%';
const switcher=(field,label,help,checked)=>'<label class="sound-switch"><span><strong>'+label+'</strong><small>'+help+'</small></span><input type="checkbox" data-sound-switch="'+field+'" '+(checked?'checked':'')+'><span class="sound-switch-visual" aria-hidden="true"></span></label>';
function saveDownload(blob,name){
 const href=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=href;anchor.download=name;anchor.style.display='none';document.body.append(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(href),10000);
}
export class StudioSound{
 constructor({workspace,registry,getSettings,getDesign,save,notice}){
  Object.assign(this,{workspace,registry,getSettings,getDesign,save,notice});this.engine=new SoundPreviewEngine();this.active=false;this.settings=normalizeSoundSettings();this.busy=false;this.mode='spelling';this.selectedCue='tap';
  this.workspace.addEventListener('click',event=>{void this.click(event);});
  this.workspace.addEventListener('input',event=>this.input(event));
  this.workspace.addEventListener('change',event=>this.change(event));
  window.addEventListener('message',event=>{if(this.active&&event.origin===location.origin&&event.source===this.gameFrame()?.contentWindow&&event.data?.channel==='mala-nauka-studio'&&event.data.type==='ready'){this.sendDesign();this.gameFrame().contentWindow.postMessage({channel:'mala-nauka-studio',type:'inspect',enabled:false,highlight:false},location.origin);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){this.engine.stop();this.logo?.pause();this.status();}});
  window.addEventListener('pagehide',()=>{this.engine.stop();});
 }
 leave(){this.active=false;this.soundMap?.destroy();this.logo?.destroy();this.logo=null;this.engine.stop();this.gameFrame()?.remove();}
 gameFrame(){return this.workspace.querySelector('#sound-game-frame');}
 sendDesign(){this.gameFrame()?.contentWindow?.postMessage({channel:'mala-nauka-studio',type:'design',...this.getDesign()},location.origin);}
 render(){
  this.active=true;this.settings=normalizeSoundSettings(this.getSettings()||DEFAULT_SOUND_SETTINGS);
  const s=this.settings, cues=SOUND_CUES.map(([id,name,hint])=>'<div class="sound-cue"><button type="button" class="sound-cue-select" data-sound-edit-cue="'+id+'" aria-pressed="'+(id===this.selectedCue)+'"><strong>'+name+'</strong><small>'+hint+'</small></button><button type="button" class="sound-preview-button" data-sound-cue="'+id+'" aria-label="Odsłuchaj '+name+'">▶</button></div>').join('');
  const presets=Object.entries(SOUND_PRESETS).map(([id,p])=>'<button type="button" class="sound-preset '+(id===s.ambientPreset?'is-selected':'')+'" data-sound-preset="'+id+'" aria-pressed="'+(id===s.ambientPreset)+'">'+escapeHTML(p.label)+'</button>').join('');
  const layers=SOUND_LAYERS.map(([id,name,hint],i)=>'<label class="sound-channel"><span class="sound-channel-index">'+String(i+1).padStart(2,'0')+'</span><span class="sound-channel-name"><strong>'+name+'</strong><small>'+hint+'</small></span><input type="range" min="0" max="100" step="1" value="'+s.mix[i]+'" data-sound-layer="'+i+'" aria-label="'+name+'"><output data-layer-value="'+i+'">'+s.mix[i]+'%</output></label>').join('');
  this.workspace.innerHTML='<div class="content-page sound-studio" data-sound-studio>'+
   '<header class="sound-hero"><div><span class="inspector-kicker">Dźwięk i koncentracja</span><h2>Sound Lab</h2><p>Miękkie, wesołe brzmienia do nauki i zabawy. Warstwy płyną bez przerwy na końcu pętli. Zapisz miks i posłuchaj go przy prawdziwych zadaniach.</p><div class="sound-transport"><button type="button" class="quiet-button" data-sound-action="check">♫ Sprawdź dźwięk</button><span role="status" data-sound-status aria-live="polite">Odsłuch zatrzymany.</span></div></div><div class="sound-hero-mark" aria-hidden="true">♫</div></header>'+
   '<nav class="sound-transport sound-section-links" aria-label="Pracownie dźwięku"><button type="button" class="quiet-button" data-sound-jump="map-panel">Mapa dźwięków</button><button type="button" class="quiet-button" data-sound-jump="cue-panel">Krótkie brzmienia</button><button type="button" class="quiet-button" data-sound-jump="mixer-panel">Tło i długość pętli</button></nav><section class="sound-panel sound-settings"><div class="sound-panel-heading"><div><h3>Ustawienia aplikacji</h3><p>Miks trafia do wspólnego szkicu gry. Zapisz na GitHub, aby udostępnić go kolejnej wersji testowej.</p></div></div><div class="sound-master-grid">'+
   switcher('enabled','Dźwięki w grze','Kliknięcia, odpowiedzi, nagrody i animacje',s.enabled)+
   switcher('ambientEnabled','Tło podczas nauki','Opcjonalna atmosfera, uruchamiana po świadomym wyborze',s.ambientEnabled)+
   switcher('quietMode','Spokojne brzmienie','Mniej energii i łagodniejsze wysokie tony',s.quietMode)+
   switcher('logoEnabled','Muzyka kolorów i blobów','Nutki zsynchronizowane z animacją',s.logoEnabled)+
   slider('volume','Głośność ogólna',s.volume,'Bezpieczny, ograniczony zakres')+
   slider('cueVolume','Efekty interakcji',s.cueVolume,'Kliknięcia, odpowiedzi i nagrody')+
   slider('ambientVolume','Głośność tła',s.ambientVolume,'Tło ciszej niż komunikaty z gry')+
   '</div><details class="sound-control-group" open><summary>Charakter i układ</summary><div class="sound-master-grid">'+CHARACTER.map(([field,label,help])=>slider(field,label,s[field],help)).join('')+'</div></details></section>'+
   '<section class="sound-panel" data-sound-map-panel><div class="sound-panel-heading"><div><h3>Mapa dźwięków</h3><p>Ten sam podział na ekrany i połączenia co w architekturze. Wybierz ekran, przypisz brzmienia i głośność. Mapę przesuwaj pustym obszarem; zmiany trafiają do gry.</p></div><button type="button" class="solid-button" data-sound-action="save-test">Zapisz i testuj w grze</button></div><div data-sound-map></div></section>'+
   '<section class="sound-panel" data-sound-cue-panel><div class="sound-panel-heading"><div><h3>Mikser krótkich dźwięków</h3><p>Wybierz brzmienie. Połącz drewno, dzwonek, sprężynkę i szelest, a potem ustaw jego długość i ton. Zmiana obejmuje każde miejsce, które korzysta z tego brzmienia.</p></div><button type="button" class="quiet-button" data-sound-action="archive">Pobierz zestaw WAV (.zip)</button></div><div class="sound-cue-grid">'+cues+'</div><div data-sound-cue-mixer></div></section>'+
   '<section class="sound-panel sound-mixer-panel" data-sound-mixer-panel><div class="sound-panel-heading"><div><h3>Mikser natury i muzyki</h3><p>Nieregularne dźwięki natury i pogodna melodia. Suwaki działają na żywo; puszczenie suwaka zapisuje zmianę w szkicu.</p></div><div class="sound-transport"><button type="button" class="solid-button" data-sound-action="play">▶ Odsłuchaj tło</button><button type="button" class="quiet-button" data-sound-action="stop">■ Stop</button></div></div>'+
   '<div class="sound-presets" role="group" aria-label="Presety atmosfery">'+presets+'</div>'+
   '<div class="sound-channels">'+layers+'</div><details class="sound-control-group" open><summary>Długość przed powtórzeniem</summary>'+slider('loopSeconds','Długość podkładu',s.loopSeconds,'24–180 sekund; melodia dopasowuje koniec do pełnej frazy')+'<p class="sound-loop-info" data-sound-loop-info></p></details>'+
   '<div class="sound-lab-actions"><button type="button" class="solid-button" data-sound-action="save-test">Zapisz i testuj w grze</button><button type="button" class="quiet-button" data-sound-action="save">Zapisz miks do gry</button><span role="status" data-sound-status aria-live="polite">Odsłuch zatrzymany.</span><div><button type="button" class="quiet-button" data-sound-action="ambient-download">Pobierz pętlę WAV</button><button type="button" class="quiet-button" data-sound-action="reset">Przywróć wesołą naukę</button></div></div>'+
   '</section><section class="sound-panel"><div class="sound-panel-heading"><div><h3>Kolory i bloby</h3><p>Dźwięk podąża za ustawionym czasem obrotów, kolorów oraz białego bloba.</p></div><button type="button" class="solid-button" data-sound-action="logo">▶ Odtwórz animację z dźwiękiem</button></div><div class="sound-logo-stage"><div class="sound-logo-screen"><span aria-hidden="true">☀</span><strong>Czas na małą przygodę!</strong></div></div></section>'+
   '<section class="sound-panel"><div class="sound-panel-heading"><div><h3>Przetestuj przy zadaniach</h3><p>Ten sam ekran i dźwięk co w Komponentach oraz PWA. Dotknij odpowiedzi w podglądzie, aby włączyć dźwięk.</p></div><div class="sound-transport"><label>Tryb <select data-sound-mode>'+MODES.map(([id,label])=>'<option value="'+id+'" '+(id===this.mode?'selected':'')+'>'+label+'</option>').join('')+'</select></label><button type="button" class="quiet-button" data-sound-action="save-test">Zapisz i otwórz grę</button></div></div><div class="sound-game-stage" data-sound-game-stage><p>Podgląd otworzysz przyciskiem „Zapisz i testuj w grze”.</p></div></section></div>' ;
  this.status();
  this.renderCueMixer();this.updateLoopInfo();
  this.soundMap?.destroy();this.soundMap=new StudioSoundMap({root:this.workspace.querySelector('[data-sound-map]'),registry:this.registry,getSettings:()=>this.settings,getDesign:this.getDesign,save:()=>this.persist(),play:(id,level)=>this.playCue(id,level),editCue:id=>this.selectCue(id,true)});this.soundMap.render();
 }
 renderCueMixer(){
  const id=this.selectedCue,c=cueSettings(id,this.settings),defaults=cueSettings(id),node=this.workspace.querySelector('[data-sound-cue-mixer]');if(!node)return;
  const duration=Math.round(generateCue(id,1000,this.settings).length);
  node.innerHTML='<div class="sound-panel-heading"><h4>'+escapeHTML(SOUND_CUES.find(row=>row[0]===id)?.[1])+' <small data-sound-cue-duration>'+duration+' ms</small></h4><button type="button" class="solid-button" data-sound-cue="'+id+'">▶ Odsłuchaj brzmienie</button></div><div class="sound-cue-controls">'+CUE_CONTROLS.map(([key,label,help])=>{
   const [min,max]=CUE_FIELDS[key],mark=(defaults[key]-min)/(max-min)*100;
   return `<div class="sound-cue-control" data-sound-cue-control="${key}"><label><strong>${label}</strong><small>${help}</small><output>${c[key]}${cueUnit(key)}</output><div class="sound-range-wrap"><input type="range" min="${min}" max="${max}" value="${c[key]}" data-sound-cue-field="${key}"><i class="sound-default-mark" style="left:${mark}%" aria-hidden="true"></i></div></label><div class="sound-binding-inherit"><small>Domyślnie: ${defaults[key]}${cueUnit(key)}</small><button type="button" class="small-button" data-sound-cue-reset="${key}" ${c[key]===defaults[key]?'hidden':''}>Przywróć</button></div></div>`;
  }).join('')+'</div>';
 }
 selectCue(id,scroll=false){if(!SOUND_CUES.some(row=>row[0]===id))return;this.selectedCue=id;this.workspace.querySelectorAll('[data-sound-edit-cue]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.soundEditCue===id)));this.renderCueMixer();if(scroll)this.workspace.querySelector('[data-sound-cue-panel]')?.scrollIntoView({behavior:'smooth',block:'start'});}
 async playCue(id,level=1){
  if(id==='none'||!level){this.status('To działanie jest wyciszone.');return;}
  if(!this.settings.volume||!this.settings.cueVolume||!cueSettings(id,this.settings).volume){this.status('Efekty są wyciszone w mikserze. Podnieś głośność ogólną i efektów.');return;}
  try{await this.engine.cue(id,this.settings,level);this.status('Odtwarzam: '+(SOUND_CUES.find(row=>row[0]===id)?.[1]||'dźwięk')+'.');}catch(error){this.status(error.message);}
 }
 updateLoopInfo(){const node=this.workspace.querySelector('[data-sound-loop-info]');if(node)node.textContent='Melodia: '+Math.round(layerSeconds('pad',this.settings))+' s. Natura: około '+Math.round(layerSeconds('rain',this.settings))+'–'+Math.round(layerSeconds('waves',this.settings))+' s, osobno dla każdej warstwy. Frazy zmieniają się w obrębie podkładu; warstwy nie powtarzają się jednocześnie.';}
 status(message=''){
  this.workspace.querySelectorAll('[data-sound-status]').forEach(el=>{el.textContent=message||(this.engine.playing?'Tło gra. Reguluj suwaki w czasie rzeczywistym.':'Odsłuch zatrzymany.');});
  const play=this.workspace.querySelector('[data-sound-action="play"]');if(play)play.disabled=this.engine.playing;
 }
 persist(){const value=normalizeSoundSettings(this.settings);if(JSON.stringify(value)!==JSON.stringify(this.getSettings()))this.save(value);this.sendDesign();}
 adjust(){void this.engine.adjust(this.settings).catch(error=>this.status(error.message));}
 updateMixUI(){
  this.workspace.querySelectorAll('[data-sound-preset]').forEach(b=>{b.classList.toggle('is-selected',b.dataset.soundPreset===this.settings.ambientPreset);b.setAttribute('aria-pressed',String(b.dataset.soundPreset===this.settings.ambientPreset));});
  SOUND_LAYERS.forEach((row,i)=>{const input=this.workspace.querySelector('[data-sound-layer="'+i+'"]'),out=this.workspace.querySelector('[data-layer-value="'+i+'"]');if(input)input.value=String(this.settings.mix[i]);if(out)out.textContent=this.settings.mix[i]+'%';});
  this.adjust();
 }
 input(event){
  if(!this.active)return;const n=event.target;
  if(n.dataset.soundLayer!==undefined){const i=Number(n.dataset.soundLayer);if(i<0||i>=10)return;this.settings.mix[i]=Math.round(Number(n.value));this.settings.ambientPreset='custom';this.updateMixUI();}
  if(n.dataset.soundField){this.settings[n.dataset.soundField]=Math.round(Number(n.value));const o=this.workspace.querySelector('[data-sound-value="'+n.dataset.soundField+'"]');if(o)o.textContent=n.value+fieldUnit(n.dataset.soundField);if(!['tempo','variation','energy','loopSeconds'].includes(n.dataset.soundField))this.adjust();this.updateLoopInfo();}
  if(n.dataset.soundCueField){const key=n.dataset.soundCueField;this.settings.cues[this.selectedCue]={...cueSettings(this.selectedCue,this.settings),[key]:Math.round(Number(n.value))};const row=n.closest('[data-sound-cue-control]');row.querySelector('output').textContent=n.value+cueUnit(key);row.querySelector('button').hidden=Number(n.value)===cueSettings(this.selectedCue)[key];if(key==='duration')this.workspace.querySelector('[data-sound-cue-duration]').textContent=Math.round(generateCue(this.selectedCue,1000,this.settings).length)+' ms';}
 }
 change(event){
  if(!this.active)return;const n=event.target;
  if(n.dataset.soundSwitch){this.settings[n.dataset.soundSwitch]=n.checked;this.adjust();this.persist();}
  else if(n.dataset.soundField||n.dataset.soundLayer!==undefined){this.adjust();this.persist();}
  else if(n.dataset.soundCueField)this.persist();
  else if(n.matches('[data-sound-mode]')){this.mode=n.value;if(this.gameFrame())this.testGame();}
 }
 testGame(){
  this.persist();this.engine.stop();this.logo?.destroy();this.logo=null;this.status('Zapisany miks jest w podglądzie gry. Kliknij odpowiedź.');
  const row=MODES.find(row=>row[0]===this.mode)||MODES[0],url=new URL(row[2],location.origin);
  url.search=new URLSearchParams({studio:'1',mode:row[0],screen:'game',state:'initial',viewId:row[0]+'-initial',soundLab:'1'});
  const stage=this.workspace.querySelector('[data-sound-game-stage]');stage.innerHTML=`<iframe id="sound-game-frame" title="${row[1]} · odsłuch zapisanego miksu" src="${escapeHTML(url.href)}" width="390" height="844" allow="autoplay"></iframe>`;stage.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 playLogo(){
  this.logo?.destroy();const stage=this.workspace.querySelector('.sound-logo-stage'),app=stage.querySelector('.sound-logo-screen'),overlay=document.createElement('div');overlay.className='sound-logo-overlay';stage.append(overlay);
  this.logo=new LogoTransition({overlay,app,config:logoConfig(this.getDesign().config.logoTransition),audio:{logo:(c,t,offset)=>{if(this.settings.logoEnabled)void this.engine.logo(c,t,offset,this.settings).catch(error=>this.status(error.message));},pauseLogo:()=>this.engine.pauseLogo()},onFinish:()=>{this.logo?.destroy();this.logo=null;}});this.logo.play();
 }
 async click(event){
  if(!this.active)return;const b=event.target.closest('button');if(!b||!this.workspace.contains(b))return;
  try{
   if(b.dataset.soundJump){this.workspace.querySelector('[data-sound-'+b.dataset.soundJump+']')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
   if(b.dataset.soundCue){await this.playCue(b.dataset.soundCue);return;}
   if(b.dataset.soundEditCue){this.selectCue(b.dataset.soundEditCue);return;}
   if(b.dataset.soundCueReset){const key=b.dataset.soundCueReset;this.settings.cues[this.selectedCue]={...cueSettings(this.selectedCue,this.settings),[key]:cueSettings(this.selectedCue)[key]};this.persist();this.renderCueMixer();return;}
   if(b.dataset.soundPreset){const id=b.dataset.soundPreset;this.settings.ambientPreset=id;this.settings.mix=[...SOUND_PRESETS[id].mix];this.updateMixUI();this.persist();return;}
   const action=b.dataset.soundAction;if(!action)return;
   if(action==='check'){await this.engine.cue('correct',DEFAULT_SOUND_SETTINGS);this.status('Ton testowy gra z domyślną głośnością, niezależnie od miksera.');return;}
   if(action==='play'){
    if(!ambientLevels(this.settings).some(level=>level>0)){this.status('Tło jest wyciszone. Podnieś głośność ogólną, tła i przynajmniej jeden kanał.');return;}
    this.status('Przygotowuję podkład…');await this.engine.start(this.settings);this.status();return;
   }
   if(action==='save'){this.persist();this.status('Mapa, krótkie brzmienia i tło zapisane w szkicu i przekazane do gry.');this.notice?.('Dźwięki gotowe do testów. Zapis na GitHub udostępnia je kolejnemu wydaniu.');return;}
   if(action==='save-test'){this.testGame();return;}
   if(action==='logo'){this.playLogo();return;}
   if(action==='stop'){this.logo?.pause();this.engine.stop();this.status();return;}
   if(action==='reset'){const cues=this.settings.cues,bindings=this.settings.bindings;this.settings=normalizeSoundSettings({...DEFAULT_SOUND_SETTINGS,cues,bindings});this.leave();this.save(this.settings);this.render();this.notice?.('Przywrócono wesołą naukę. Mapa i krótkie brzmienia zachowują Twoje ustawienia.');return;}
   if(action==='ambient-download'){saveDownload(wavBlob(mixAmbience(this.settings.mix,undefined,16000,this.settings)),'mala-nauka-ambient-mix.wav');return;}
   if(action==='archive'&&!this.busy){
    this.busy=true;b.disabled=true;this.status('Przygotowuję paczkę dźwięków…');
    const items=[];
    for(const [id] of SOUND_CUES){const data=generateCue(id,16000,this.settings),level=cueSettings(id,this.settings).volume/100;for(let i=0;i<data.length;i++)data[i]*=level;items.push(['effects/'+id+'.wav',new Uint8Array(await wavBlob(data).arrayBuffer())]);}
    for(const [id,preset]of Object.entries(SOUND_PRESETS)){
     if(id==='silence')continue;await new Promise(resolve=>setTimeout(resolve,0));
     items.push(['ambience/'+id+'.wav',new Uint8Array(await wavBlob(mixAmbience(preset.mix,undefined,16000,this.settings)).arrayBuffer())]);
    }
    const readme='Mała Nauka — Sound Lab v2. Proceduralne, bezszwowe pętle; 12 efektów i 7 podkładów. PCM WAV 16 kHz.\n';
    items.push(['mix-settings.json',new TextEncoder().encode(JSON.stringify(this.settings,null,2))]);
    items.push(['README.txt',new TextEncoder().encode(readme)]);
    saveDownload(zipBlob(items),'mala-nauka-sound-kit-v2.zip');this.status('Pobrano zestaw: 12 efektów + 7 podkładów.');
   }
  }catch(error){this.status('Nie udało się odtworzyć: '+(error?.message||'błąd audio'));this.notice?.('Odsłuch się nie uruchomił. Szczegóły są widoczne w Sound Lab.');}
  finally{if(b.dataset.soundAction==='archive'){this.busy=false;b.disabled=false;}}
 }
}
