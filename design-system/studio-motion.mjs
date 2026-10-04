import {html,number,savedMarker} from './preview-model.mjs';
import {DEFAULT_MOTION,animateScreen,PlaybackClock} from '../shared/screen-motion.mjs';

export class StudioMotion {
  constructor(options){
    Object.assign(this,options);this.from='home';this.to='spelling-settings';this.current=this.from;this.loop=false;this.delay=1400;this.clock=new PlaybackClock();this.ready=new Set();this.waiters=new Map();this.playing=false;
    this.workspace.addEventListener('click',event=>this.click(event));
    this.workspace.addEventListener('change',event=>this.change(event));
    this.workspace.addEventListener('input',event=>this.input(event));
    this.workspace.addEventListener('focusout',()=>this.endEdit?.());
    window.addEventListener('message',event=>this.receive(event));
  }
  get isOpen(){return Boolean(this.workspace.querySelector('.motion-workspace'));}
  get motion(){return this.getDesign().config.motion||DEFAULT_MOTION;}
  get saved(){return this.getBase().motion||DEFAULT_MOTION;}
  frames(){return [...this.workspace.querySelectorAll('[data-motion-view]')];}
  url(view){const url=new URL(view.route,location.origin);url.search=new URLSearchParams({studio:'1',mode:view.mode,screen:view.screen,state:view.state,viewId:view.id});return url.href;}
  select(id,value){return `<select id=${id}>${this.registry.views.map(view=>`<option value=${view.id} ${view.id===value?'selected':''}>${html(view.name)}</option>`).join('')}</select>`;}
  control(key,label,min,max,unit){
    return `<div class=control data-motion-control=${key}><div class=control-top><label for=motion-${key}>${label}</label><span class=control-value><input type=number aria-label='${label}' data-motion-value=${key} value=${this.motion[key]} min=${min} max=${max} step=${key==='duration'?20:1}><span>${unit}</span></span></div><div class=range-wrap><input id=motion-${key} type=range aria-label='${label}' data-motion-value=${key} min=${min} max=${max} step=${key==='duration'?20:1} value=${this.motion[key]}><span class=saved-mark style='--saved-position:${savedMarker(this.saved[key],min,max)/100}'></span></div><div class=saved-value><span>Ostatnio zapisano: <strong>${number(this.saved[key])} ${unit}</strong></span><button data-motion-reset=${key}>Przywróć</button></div></div>`;
  }
  render(){
    this.stop();this.ready.clear();this.waiters.clear();this.current=this.from;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.workspace.innerHTML=`<div class=motion-workspace><section class=motion-preview><div class=page-intro><div><h2>Przejścia między ekranami</h2><p>Odtwórz przejście na prawdziwych ekranach aplikacji. Pętla i przerwa służą do spokojnego oglądania.</p></div></div><div class=motion-route><label>Ekran początkowy${this.select('motion-from',this.from)}</label><span aria-hidden=true>→</span><label>Ekran następny${this.select('motion-to',this.to)}</label></div><div class=motion-shortcuts>${[['home','spelling-settings','Start → Ortografia'],['spelling-settings','spelling-initial','Ustawienia → Gra'],['spelling-initial','spelling-wrong','Gra → Błąd'],['progress','trophies','Wyniki → Puchary']].map(([from,to,label])=>`<button class=small-button data-motion-pair='${from},${to}'>${label}</button>`).join('')}</div><div class=motion-playbar><button class=solid-button id=motion-play>▶ Odtwórz przejście</button><label><input type=checkbox id=motion-loop ${this.loop?'checked':''}>Pętla</label><label>Przerwa między ekranami<input type=number id=motion-delay min=300 max=10000 step=100 value=${this.delay}>ms</label></div>${reduced?'<p class=warning-panel>Przeglądarka ma włączone ograniczanie ruchu. Zobaczysz zmianę ekranu bez animacji.</p>':''}<p class=motion-status id=motion-status role=status>Wczytywanie dwóch ekranów…</p><div class=motion-stage><div class=motion-phone><div class=phone-inner id=motion-screen-stack></div><div class=phone-notch></div><div class=phone-status><span>9:41</span><span>▮▮▮ ◔ ▰</span></div><div class=phone-homebar></div><span class=phone-note>390 × 844 · iPhone 13 Pro</span></div></div><div class=motion-manual><button class=small-button id=motion-first>Pokaż pierwszy ekran</button><button class=small-button id=motion-second>Pokaż następny ekran</button></div></section><aside class=inspector><span class=inspector-kicker>Wspólna animacja ekranów</span><h2>Jak zmienia się ekran?</h2><p class=description>Zapisane ustawienia dotyczą przejść ekranów w aplikacji. Ruch przełącznika jelly ma osobne ustawienia w Komponentach.</p><label class=form-field><span>Styl przejścia</span><select id=motion-style><option value=none ${this.motion.style==='none'?'selected':''}>Bez animacji</option><option value=fade ${this.motion.style==='fade'?'selected':''}>Łagodne pojawienie</option><option value=slide ${this.motion.style==='slide'?'selected':''}>Przesunięcie z prawej</option></select></label>${this.control('duration','Czas przejścia',0,2000,'ms')}${this.control('distance','Odległość przesunięcia',0,120,'px')}<label class=form-field><span>Tempo ruchu</span><select id=motion-easing>${[['ease','Łagodne'],['ease-out','Zwalnia na końcu'],['ease-in-out','Łagodny początek i koniec'],['linear','Stała prędkość']].map(([id,label])=>`<option value=${id} ${this.motion.easing===id?'selected':''}>${label}</option>`).join('')}</select></label><p class=scope-help>Pętla, przerwa i wybrane przykłady pozostają ustawieniami podglądu.</p><button class=small-button id=motion-reset-all>Przywróć zapisane przejście</button></aside></div>`;
    this.syncFrames();this.updateIndicators();
    this.resizeObserver?.disconnect();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.workspace.querySelector('.motion-stage'));this.resize();
  }
  resize(){const stage=this.workspace.querySelector('.motion-stage');if(stage)stage.style.setProperty('--motion-scale',String(Math.min(1,Math.max(.3,Math.min((stage.clientWidth-28)/414,(stage.clientHeight-22)/876)))));}
  send(frame,type,data={}){frame.contentWindow?.postMessage({channel:'mala-nauka-studio',type,...data},location.origin);}
  sendDesign(){if(!this.isOpen)return;for(const frame of this.frames())this.send(frame,'design',this.getDesign());this.updateIndicators();}
  syncFrames(){
    const stack=this.workspace.querySelector('#motion-screen-stack');if(!stack)return;
    const ids=[...new Set([this.from,this.to])];
    for(const frame of this.frames())if(!ids.includes(frame.dataset.motionView)){this.ready.delete(frame.dataset.motionView);frame.remove();}
    for(const id of ids)if(!this.frames().some(frame=>frame.dataset.motionView===id)){
      const frame=document.createElement('iframe'),view=this.registry.views.find(row=>row.id===id);
      frame.dataset.motionView=id;frame.title='Podgląd animacji: '+view.name;frame.src=this.url(view);frame.width='390';frame.height='844';frame.onload=()=>{this.send(frame,'design',this.getDesign());this.send(frame,'inspect',{enabled:false,highlight:false});};stack.append(frame);
    }
    this.show(this.from,false);this.updateStatus();
  }
  updateStatus(message){const status=this.workspace.querySelector('#motion-status');if(!status)return;status.textContent=message||([...new Set([this.from,this.to])].every(id=>this.ready.has(id))?`Gotowe · ${this.registry.views.find(view=>view.id===this.current)?.name}`:'Wczytywanie dwóch ekranów…');}
  updateIndicators(){
    if(!this.isOpen)return;
    for(const row of this.workspace.querySelectorAll('[data-motion-control]')){
      const key=row.dataset.motionControl,[min,max]=key==='duration'?[0,2000]:[0,120];
      for(const input of row.querySelectorAll('[data-motion-value]'))if(document.activeElement!==input)input.value=this.motion[key];
      row.classList.toggle('changed',this.motion[key]!==this.saved[key]);row.querySelector('.saved-mark').style.setProperty('--saved-position',String(savedMarker(this.saved[key],min,max)/100));row.querySelector('[data-motion-reset]').disabled=this.motion[key]===this.saved[key];row.querySelector('.saved-value strong').textContent=number(this.saved[key])+' '+(key==='duration'?'ms':'px');
    }
    this.workspace.querySelector('#motion-style').value=this.motion.style;this.workspace.querySelector('#motion-easing').value=this.motion.easing;
  }
  waitReady(id){
    if(this.ready.has(id))return Promise.resolve(true);
    return new Promise(resolve=>{
      const done=(success=true)=>{clearTimeout(timer);if(this.waiters.get(id)===done)this.waiters.delete(id);resolve(success);};
      const timer=setTimeout(()=>done(false),12000);this.waiters.set(id,done);
    });
  }
  async show(id,animated){
    this.animation?.cancel();this.current=id;
    const frame=this.frames().find(frame=>frame.dataset.motionView===id);if(!frame)return;
    for(const other of this.frames()){const active=other===frame;other.classList.toggle('active',active);other.setAttribute('aria-hidden',String(!active));other.tabIndex=active?0:-1;}
    this.updateStatus();
    if(animated){this.animation=animateScreen(frame,this.motion);try{await this.animation?.finished;}catch{}}
  }
  async play(){
    if(this.playing)return;
    if(this.from===this.to){this.notice('Wybierz dwa różne ekrany.');return;}
    this.playing=true;const generation=this.clock.start();this.playButton();
    const ready=await Promise.all([this.waitReady(this.from),this.waitReady(this.to)]);
    if(!this.clock.valid(generation))return;
    if(ready.some(value=>!value)){this.stop();this.updateStatus('Ekran nie wczytał się. Wybierz inny przykład lub otwórz podgląd ponownie.');return;}
    await this.show(this.from,false);
    if(!await this.clock.pause(Math.min(this.delay,1000),generation))return;
    do{
      await this.show(this.to,true);if(!this.clock.valid(generation))return;
      if(!this.loop)break;
      if(!await this.clock.pause(this.delay,generation))return;
      await this.show(this.from,true);if(!this.clock.valid(generation))return;
      if(!await this.clock.pause(this.delay,generation))return;
    }while(this.loop&&this.clock.valid(generation));
    this.playing=false;this.playButton();this.updateStatus();
  }
  playButton(){const button=this.workspace.querySelector('#motion-play');if(button)button.textContent=this.playing?'■ Zatrzymaj':'▶ Odtwórz przejście';}
  stop(){for(const done of [...this.waiters.values()])done(false);this.waiters.clear();this.clock.cancel();this.animation?.cancel();this.playing=false;this.playButton();}
  leave(){this.stop();this.resizeObserver?.disconnect();for(const done of this.waiters.values())done();this.waiters.clear();}
  receive(event){
    if(!this.isOpen||event.origin!==location.origin||event.data?.channel!=='mala-nauka-studio')return;
    const frame=this.frames().find(row=>row.contentWindow===event.source);if(!frame)return;
    if(event.data.type==='ready'){this.send(frame,'design',this.getDesign());this.send(frame,'inspect',{enabled:false,highlight:false});}
    if(event.data.type==='inventory'&&event.data.items?.some(item=>item.index>=0&&item.visible)){const id=frame.dataset.motionView;this.ready.add(id);this.waiters.get(id)?.();this.updateStatus();}
  }
  choosePair(from,to){this.stop();this.from=from;this.to=to;this.current=from;this.workspace.querySelector('#motion-from').value=from;this.workspace.querySelector('#motion-to').value=to;this.syncFrames();}
  click(event){
    if(!this.isOpen)return;const button=event.target.closest('button');if(!button)return;
    if(button.id==='motion-play'){if(this.playing)this.stop();else void this.play();}
    if(button.id==='motion-first'||button.id==='motion-second'){this.stop();void this.show(button.id==='motion-first'?this.from:this.to,false);}
    if(button.dataset.motionPair)this.choosePair(...button.dataset.motionPair.split(','));
    if(button.dataset.motionReset)this.edit('motion.'+button.dataset.motionReset,this.saved[button.dataset.motionReset]);
    if(button.id==='motion-reset-all'){this.edit('motion',{...this.saved});this.endEdit?.();}
  }
  change(event){
    if(!this.isOpen)return;const target=event.target;
    if(target.id==='motion-from'||target.id==='motion-to')this.choosePair(this.workspace.querySelector('#motion-from').value,this.workspace.querySelector('#motion-to').value);
    if(target.id==='motion-loop')this.loop=target.checked;
    if(target.id==='motion-delay'){this.delay=Math.min(10000,Math.max(300,Number(target.value)||1400));target.value=this.delay;}
    if(target.id==='motion-style'||target.id==='motion-easing'){this.edit(target.id==='motion-style'?'motion.style':'motion.easing',target.value);this.endEdit?.();}
  }
  input(event){
    if(!this.isOpen||!event.target.dataset.motionValue)return;
    const target=event.target,key=target.dataset.motionValue,value=Number(target.value);if(!Number.isFinite(value)||value<0||value>(key==='duration'?2000:120))return;
    this.edit('motion.'+key,value);
  }
}
