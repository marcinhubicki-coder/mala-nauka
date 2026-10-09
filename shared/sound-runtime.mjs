import {SoundPreviewEngine,normalizeSoundSettings} from './sound-library.mjs';

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
  if(this.engine.playing){void this.engine.adjust(this.settings).catch(()=>{});return;}
  if(this.starting)return;this.starting=true;
  void this.engine.start(this.settings).catch(()=>{}).finally(()=>{this.starting=false;});
 }
 async unlock(){
  if(!this.enabled)return;
  try{await this.engine.ready();this.unlocked=this.engine.ctx.state==='running';this.update();
   const request=this.logoRequest;
   if(request&&this.unlocked){const offset=request.offset+Math.max(0,performance.now()-request.began);if(offset<request.timing.total)void this.engine.logo(request.config,request.timing,offset,this.settings).catch(()=>{});}
  }catch{/* Audio remains optional; never interrupt a question. */}
 }
 cue(id){if(this.enabled&&this.unlocked&&this.engine.ctx?.state==='running')void this.engine.cue(id,this.settings).catch(()=>{});}
 logo(config,timing,offset=0){
  this.pauseLogo();if(!this.enabled||!this.settings.logoEnabled)return;
  this.logoRequest={config,timing,offset,began:performance.now()};
  if(this.unlocked)void this.engine.logo(config,timing,offset,this.settings).catch(()=>{});
 }
 pauseLogo(){this.logoRequest=null;this.engine.pauseLogo();}
}
export const gameSound=new GameSoundController();
export function syncSoundScene(app){
 if(!app)return;
 gameSound.setScene({playing:app.dataset.view==='game',paused:app.dataset.state==='paused'||app.classList.contains('paused')||Boolean(document.querySelector('dialog[open]'))});
}
let installed=false;
export function installGameSounds(app){
 if(installed||!app)return;installed=true;
 const studio=new URLSearchParams(location.search).has('studio');
 if(!studio)try{gameSound.setPreference(JSON.parse(localStorage.getItem('malaNauka.v1.settings')||'{}').sound!==false);}catch{}
 const unlock=event=>{if(event.isTrusted&&event.target.closest?.('button,input,a,[role=button]'))void gameSound.unlock();};
 document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
 document.addEventListener('keydown',event=>{if(['Enter',' ','ArrowLeft','ArrowRight'].includes(event.key))unlock(event);},{capture:true});
 document.addEventListener('click',event=>{
  if(!event.isTrusted)return;
  const button=event.target.closest?.('button,a,[role=button]');
  if(!button||button.disabled||button.closest('[inert]'))return;
  if(button.matches('[data-action=answer],[data-answer],.answer'))return;
  const action=button.dataset.action;
  gameSound.cue(button.matches('.spelling-hint,[data-hint]')||action==='hint'?'hint':action==='next'||button.matches('[data-next-question]')?'next':'tap');
  queueMicrotask(()=>syncSoundScene(app));
 },{capture:true});
 app.addEventListener('change',event=>{
  if(event.target.matches('input,select')&&event.target.id!=='sound')gameSound.cue('toggle');
 });
 document.addEventListener('visibilitychange',()=>gameSound.setVisible(!document.hidden));
 window.addEventListener('pagehide',()=>{gameSound.setVisible(false);void gameSound.engine.close();});
 const observer=new MutationObserver(()=>syncSoundScene(app));
 observer.observe(app,{attributes:true,attributeFilter:['data-view','data-state','class']});
 // Dialogs can pause a game without changing its root state (e.g. a hint).
 new MutationObserver(records=>{if(records.some(row=>row.target.matches?.('dialog')||[...row.addedNodes,...row.removedNodes].some(node=>node.matches?.('dialog'))))syncSoundScene(app);}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
 syncSoundScene(app);
}
