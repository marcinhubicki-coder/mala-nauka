import {SoundPreviewEngine,normalizeSoundSettings} from './sound-library.mjs';
import {soundInteraction,soundBinding,soundSceneView} from './sound-map.mjs';

// Audio follows actual game state, independent of the Studio's synthetic clock.
export class GameSoundController{
 constructor(engine=new SoundPreviewEngine()){
  this.engine=engine;this.settings=normalizeSoundSettings();this.preference=true;this.visible=true;this.scene={playing:false,paused:false};this.unlocked=false;
 }
 get enabled(){return this.preference&&this.settings.enabled&&this.visible;}
 configure(value){this.settings=normalizeSoundSettings(value);this.update();}
 setPreference(value){this.preference=value!==false;this.update();}
 setScene(scene){this.scene=scene;this.update();}
 setVisible(value){this.visible=value;if(!value){this.engine.stop();this.logoRequest=null;}else this.update();}
 update(){
  if(!this.enabled){this.engine.stop();return;}
  const active=this.unlocked&&this.settings.ambientEnabled&&this.scene.playing&&!this.scene.paused;
  if(!active){if(this.engine.playing||this.starting)this.engine.stopAmbience();this.starting=false;return;}
  if(this.engine.playing){void this.engine.adjust(this.settings).catch(error=>this.report(error));return;}
  if(this.starting)return;this.starting=true;
  void this.engine.start(this.settings).catch(error=>this.report(error)).finally(()=>{this.starting=false;});
 }
 unlock(){
  if(!this.enabled)return Promise.resolve();
  if(this.unlocking)return this.unlocking;
  // Keep the promise so the first click's cue waits for resume instead of being dropped.
  this.unlocking=this.engine.ready().then(ctx=>{
   this.unlocked=ctx.state==='running';this.lastError=null;this.update();
   const request=this.logoRequest;
   if(request&&this.unlocked){const offset=request.offset+Math.max(0,performance.now()-request.began);if(offset<request.timing.total)void this.engine.logo(request.config,request.timing,offset,this.settings).catch(error=>this.report(error));}
  }).catch(error=>{this.unlocked=false;this.report(error);}).finally(()=>{this.unlocking=null;});
  return this.unlocking;
 }
 report(error){this.lastError=error?.message||'Nie udało się odtworzyć dźwięku.';}
 async cue(id,{slot,view}={}){
  if(!this.enabled)return;
  const eventView=id==='roundStart'?(this.scene.mode||'spelling')+'-settings':id==='roundEnd'?(this.scene.mode||'spelling')+'-results':this.scene.view;
  const binding=soundBinding(this.settings,view||eventView||'home',slot||{key:'event:'+id,cue:id});
  if(binding.cue==='none'||!binding.volume)return;
  if(this.unlocking)await this.unlocking;
  else if(this.unlocked&&this.engine.ctx?.state!=='running')await this.unlock();
  if(this.enabled&&this.unlocked&&this.engine.ctx?.state==='running')try{await this.engine.cue(binding.cue,this.settings,binding.volume/100);}catch(error){this.report(error);}
 }
 interact(slot,view){return this.cue(slot.cue,{slot,view});}
 logo(config,timing,offset=0){
  this.pauseLogo();if(!this.enabled||!this.settings.logoEnabled)return;
  this.logoRequest={config,timing,offset,began:performance.now()};
  if(this.unlocked)void this.engine.logo(config,timing,offset,this.settings).catch(error=>this.report(error));
 }
 pauseLogo(){this.logoRequest=null;this.engine.pauseLogo();}
}
export const gameSound=new GameSoundController();
export function syncSoundScene(app){
 if(!app)return;
 gameSound.setScene({view:soundSceneView(app),mode:app.dataset.mode||'spelling',playing:app.dataset.view==='game',paused:app.dataset.state==='paused'||app.classList.contains('paused')||Boolean(document.querySelector('dialog[open]'))});
}
let installed=false;
export function installGameSounds(app){
 if(installed||!app)return;installed=true;
 const studio=new URLSearchParams(location.search).has('studio');
 if(!studio)try{gameSound.setPreference(JSON.parse(localStorage.getItem('malaNauka.v1.settings')||'{}').sound!==false);}catch{}
 const targets='button,input,select,a,[role=button],summary';
 const controlFor=target=>{const label=target.closest?.('label');return label?.querySelector('input,select')||target.closest?.(targets);};
 const unlock=event=>{if(event.isTrusted&&controlFor(event.target))void gameSound.unlock();};
 document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
 document.addEventListener('keydown',event=>{if(['Enter',' ','ArrowLeft','ArrowRight'].includes(event.key))unlock(event);},{capture:true});
 const recent=new WeakMap();
 const playControl=(node)=>{
  if(!node||node.disabled||node.closest('[inert]'))return;
  if(node.id==='sound'){if(!node.checked)return;gameSound.setPreference(true);void gameSound.unlock();}
  const now=performance.now();if(now-(recent.get(node)||-1000)<100)return;recent.set(node,now);
  syncSoundScene(app);const slot=soundInteraction(node);if(slot)void gameSound.interact(slot,gameSound.scene.view);
 };
 document.addEventListener('click',event=>{
  if(!event.isTrusted)return;const node=controlFor(event.target);if(!node)return;
  unlock(event);playControl(node);queueMicrotask(()=>syncSoundScene(app));
 },{capture:true});
 document.addEventListener('change',event=>{
  if(!event.target.matches?.('input,select')||(!event.isTrusted&&!gameSound.unlocked))return;
  playControl(event.target);
 },{capture:true});
 app.addEventListener('mala-nauka:continue-sound',()=>{syncSoundScene(app);void gameSound.unlock();void gameSound.interact({key:'continue',cue:'next'},gameSound.scene.view);});
 document.addEventListener('visibilitychange',()=>gameSound.setVisible(!document.hidden));
 window.addEventListener('pagehide',()=>{gameSound.setVisible(false);void gameSound.engine.close();});
 window.addEventListener('pageshow',()=>gameSound.setVisible(!document.hidden));
 const observer=new MutationObserver(()=>syncSoundScene(app));
 observer.observe(app,{attributes:true,attributeFilter:['data-view','data-mode','data-state','data-history-state','class']});
 // Dialogs can pause a game without changing its root state (e.g. a hint).
 new MutationObserver(records=>{if(records.some(row=>row.target.matches?.('dialog')||[...row.addedNodes,...row.removedNodes].some(node=>node.matches?.('dialog'))))syncSoundScene(app);}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
 syncSoundScene(app);
}
