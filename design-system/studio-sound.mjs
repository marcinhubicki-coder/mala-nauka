import {SOUND_CUES,SOUND_LAYERS,SOUND_PRESETS,DEFAULT_SOUND_SETTINGS,normalizeSoundSettings,SoundPreviewEngine,generateCue,mixAmbience,wavBlob,zipBlob} from '../shared/sound-library.mjs';

const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slider=(field,label,value,help)=>'<label class="sound-master-field"><span><strong>'+label+'</strong><small>'+help+'</small></span><input type="range" min="0" max="100" step="1" data-sound-field="'+field+'" value="'+value+'"><output data-sound-value="'+field+'">'+value+'%</output></label>';
const switcher=(field,label,help,checked)=>'<label class="sound-switch"><span><strong>'+label+'</strong><small>'+help+'</small></span><input type="checkbox" data-sound-switch="'+field+'" '+(checked?'checked':'')+'><span class="sound-switch-visual" aria-hidden="true"></span></label>';
function saveDownload(blob,name){
 const href=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=href;anchor.download=name;anchor.style.display='none';document.body.append(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(href),10000);
}
export class StudioSound{
 constructor({workspace,getSettings,save,notice}){
  Object.assign(this,{workspace,getSettings,save,notice});this.engine=new SoundPreviewEngine();this.active=false;this.settings=normalizeSoundSettings();this.busy=false;
  this.workspace.addEventListener('click',event=>{void this.click(event);});
  this.workspace.addEventListener('input',event=>this.input(event));
  this.workspace.addEventListener('change',event=>this.change(event));
  window.addEventListener('pagehide',()=>{this.engine.stop();});
 }
 leave(){this.active=false;this.engine.stop();}
 render(){
  this.active=true;this.settings=normalizeSoundSettings(this.getSettings()||DEFAULT_SOUND_SETTINGS);
  const s=this.settings, cues=SOUND_CUES.map(([id,name,hint])=>'<div class="sound-cue"><div><strong>'+name+'</strong><small>'+hint+'</small></div><button type="button" class="sound-preview-button" data-sound-cue="'+id+'" aria-label="Odsłuchaj '+name+'">▶</button></div>').join('');
  const presets=Object.entries(SOUND_PRESETS).map(([id,p])=>'<button type="button" class="sound-preset '+(id===s.ambientPreset?'is-selected':'')+'" data-sound-preset="'+id+'" aria-pressed="'+(id===s.ambientPreset)+'">'+escapeHTML(p.label)+'</button>').join('');
  const layers=SOUND_LAYERS.map(([id,name,hint],i)=>'<label class="sound-channel"><span class="sound-channel-index">'+String(i+1).padStart(2,'0')+'</span><span class="sound-channel-name"><strong>'+name+'</strong><small>'+hint+'</small></span><input type="range" min="0" max="100" step="1" value="'+s.mix[i]+'" data-sound-layer="'+i+'" aria-label="'+name+'"><output data-layer-value="'+i+'">'+s.mix[i]+'%</output></label>').join('');
  this.workspace.innerHTML='<div class="content-page sound-studio" data-sound-studio>'+
   '<header class="sound-hero"><div><span class="inspector-kicker">Dźwięk i koncentracja</span><h2>Sound Lab</h2><p>Spokojne brzmienia wspierające rytm zabawy. Odsłuch jest ręczny — żaden dźwięk nie uruchamia się sam. Stwórz własne tło z dziesięciu niezależnych warstw.</p></div><div class="sound-hero-mark" aria-hidden="true">♫</div></header>'+
   '<section class="sound-panel sound-settings"><div class="sound-panel-heading"><div><h3>Ustawienia aplikacji</h3><p>Dźwięk w rozgrywce pozostaje domyślnie wyłączony. Włączenie tutaj zapisuje wybór do kontraktu Design Studio.</p></div></div><div class="sound-master-grid">'+
   switcher('enabled','Dźwięki w grze','Reakcje i nagrody (do podłączenia w modułach gry)',s.enabled)+
   switcher('ambientEnabled','Tło podczas nauki','Opcjonalna atmosfera, uruchamiana po świadomym wyborze',s.ambientEnabled)+
   switcher('quietMode','Tryb spokojny','Miękkie brzmienie, bez ostrych alarmów i głośnych niespodzianek',s.quietMode)+
   slider('volume','Głośność ogólna',s.volume,'Bezpieczny, ograniczony zakres')+
   slider('cueVolume','Efekty interakcji',s.cueVolume,'Kliknięcia, odpowiedzi i nagrody')+
   slider('ambientVolume','Głośność tła',s.ambientVolume,'Tło ciszej niż komunikaty z gry')+
   '</div></section>'+
   '<section class="sound-panel"><div class="sound-panel-heading"><div><h3>Biblioteka zdarzeń</h3><p>12 oryginalnych, syntetyzowanych efektów. Błąd to delikatna wskazówka, a nie kara. Każdy efekt można odsłuchać i wyeksportować.</p></div><button type="button" class="quiet-button" data-sound-action="archive">Pobierz zestaw WAV (.zip)</button></div><div class="sound-cue-grid">'+cues+'</div></section>'+
   '<section class="sound-panel sound-mixer-panel"><div class="sound-panel-heading"><div><h3>10-kanałowy mikser natury i ambientu</h3><p>Inspiracja: niezależne suwaki i presety myNoise. Własny silnik i własne brzmienia, bez pobierania cudzych nagrań.</p></div><div class="sound-transport"><button type="button" class="solid-button" data-sound-action="play">▶ Odsłuchaj tło</button><button type="button" class="quiet-button" data-sound-action="stop">■ Stop</button></div></div>'+
   '<div class="sound-presets" role="group" aria-label="Presety atmosfery">'+presets+'</div>'+
   '<div class="sound-channels">'+layers+'</div>'+
   '<div class="sound-lab-actions"><span role="status" data-sound-status aria-live="polite">Odsłuch zatrzymany.</span><div><button type="button" class="quiet-button" data-sound-action="ambient-download">Pobierz 6 s miksu WAV</button><button type="button" class="quiet-button" data-sound-action="reset">Przywróć spokojne ustawienia</button></div></div>'+
   '</section><section class="sound-learning-note"><strong>Zaprojektowane z myślą o nauce</strong><p>Unikamy alarmów, intensywnych wysokich tonów i karzących komunikatów. Krótkie efekty nie powinny zasłaniać instrukcji ani czytanych słów. Dla dzieci wrażliwych na bodźce najlepszą opcją może być całkowita cisza. Bez automatycznego odtwarzania, bez dźwięków reklamowych i bez obiecywania poprawy koncentracji.</p></section></div>';
  this.status();
 }
 status(message=''){
  const el=this.workspace.querySelector('[data-sound-status]');if(el)el.textContent=message||(this.engine.playing?'Tło gra. Reguluj suwaki w czasie rzeczywistym.':'Odsłuch zatrzymany.');
  const play=this.workspace.querySelector('[data-sound-action="play"]');if(play)play.disabled=this.engine.playing;
 }
 persist(){this.save(normalizeSoundSettings(this.settings));}
 updateMixUI(){
  this.workspace.querySelectorAll('[data-sound-preset]').forEach(b=>{b.classList.toggle('is-selected',b.dataset.soundPreset===this.settings.ambientPreset);b.setAttribute('aria-pressed',String(b.dataset.soundPreset===this.settings.ambientPreset));});
  SOUND_LAYERS.forEach((row,i)=>{const input=this.workspace.querySelector('[data-sound-layer="'+i+'"]'),out=this.workspace.querySelector('[data-layer-value="'+i+'"]');if(input)input.value=String(this.settings.mix[i]);if(out)out.textContent=this.settings.mix[i]+'%';});
  this.engine.adjust(this.settings);
 }
 input(event){
  if(!this.active)return;const n=event.target;
  if(n.dataset.soundLayer!==undefined){const i=Number(n.dataset.soundLayer);if(i<0||i>=10)return;this.settings.mix[i]=Math.round(Number(n.value));this.settings.ambientPreset='custom';this.updateMixUI();}
  if(n.dataset.soundField){this.settings[n.dataset.soundField]=Math.round(Number(n.value));const o=this.workspace.querySelector('[data-sound-value="'+n.dataset.soundField+'"]');if(o)o.textContent=n.value+'%';this.engine.adjust(this.settings);}
 }
 change(event){
  if(!this.active)return;const n=event.target;
  if(n.dataset.soundSwitch){this.settings[n.dataset.soundSwitch]=n.checked;this.persist();}
  else if(n.dataset.soundField||n.dataset.soundLayer!==undefined)this.persist();
 }
 async click(event){
  if(!this.active)return;const b=event.target.closest('button');if(!b||!this.workspace.contains(b))return;
  try{
   if(b.dataset.soundCue){await this.engine.cue(b.dataset.soundCue,this.settings);return;}
   if(b.dataset.soundPreset){const id=b.dataset.soundPreset;this.settings.ambientPreset=id;this.settings.mix=[...SOUND_PRESETS[id].mix];this.updateMixUI();this.persist();return;}
   const action=b.dataset.soundAction;if(!action)return;
   if(action==='play'){await this.engine.start(this.settings);this.status();return;}
   if(action==='stop'){this.engine.stop();this.status();return;}
   if(action==='reset'){this.settings=normalizeSoundSettings(DEFAULT_SOUND_SETTINGS);this.engine.stop();this.persist();this.render();this.notice?.('Przywrócono spokojny preset i wyłączono dźwięk w grze.');return;}
   if(action==='ambient-download'){saveDownload(wavBlob(mixAmbience(this.settings.mix)),'mala-nauka-ambient-mix.wav');return;}
   if(action==='archive'&&!this.busy){
    this.busy=true;b.disabled=true;this.status('Przygotowuję paczkę dźwięków…');
    const items=[];
    for(const [id] of SOUND_CUES)items.push(['effects/'+id+'.wav',new Uint8Array(await wavBlob(generateCue(id)).arrayBuffer())]);
    for(const [id,preset]of Object.entries(SOUND_PRESETS)){
     if(id==='silence')continue;
     items.push(['ambience/'+id+'.wav',new Uint8Array(await wavBlob(mixAmbience(preset.mix)).arrayBuffer())]);
    }
    const readme='Mała Nauka — Sound Lab\n12 krótkich efektów + 6 próbek atmosfery (6 s), WAV PCM 16 bit mono / 16 kHz.\nBrzmienia stworzone proceduralnie dla Małej Nauki. Niskie poziomy, delikatne przejścia, domyślnie bez autoplay.\nPliki ambientu są próbkami miksu do odsłuchu; w Studio mikser zapętla niezależne warstwy.\n';
    items.push(['README.txt',new TextEncoder().encode(readme)]);
    saveDownload(zipBlob(items),'mala-nauka-sound-kit-v1.zip');this.status('Pobrano zestaw: 12 efektów + 6 próbek ambientu.');
   }
  }catch(error){this.status('Nie udało się odtworzyć: '+(error?.message||'błąd audio'));this.notice?.('Sprawdź głośność telefonu oraz zgodę przeglądarki na dźwięk.');}
  finally{if(b.dataset.soundAction==='archive'){this.busy=false;b.disabled=false;}}
 }
}
