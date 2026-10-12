import {studioIcon,mapViewIcon} from './studio-ui.mjs';
import {SOUND_COLUMNS,soundSlots,soundBinding,soundViewKey} from '../shared/sound-map.mjs';
import {SOUND_CUES} from '../shared/sound-library.mjs';
import {screenLinks,routeKey} from '../shared/navigation.mjs';
import {drawMapConnections,focusConnectionControl} from './map-connections.mjs';
const html=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={players:'Wybór gracza','players-empty':'Pierwsze uruchomienie','player-create':'Nowy gracz','player-pin':'PIN / bez PIN-u','player-unlock':'Odblokuj PIN',home:'Ekran startowy',settings:'Ustawienia aplikacji',progress:'Moje wyniki',collection:'Kolekcja',trophies:'Osiągnięcia',categories:'Kategorie',rules:'Zasady',sessions:'Historia rund'};
export class StudioSoundMap{
 constructor({root,registry,getSettings,getDesign,save,play,editCue}){
  Object.assign(this,{root,registry,getSettings,getDesign,save,play,editCue});this.selected='home';this.scope='local';this.sections=new Map();this.connection='';
  root.addEventListener('click',e=>this.click(e));root.addEventListener('keydown',e=>{const n=e.target.closest('[data-map-connection]');if(n&&['Enter',' '].includes(e.key)){e.preventDefault();this.selectConnection(n.dataset.mapConnection);}});root.addEventListener('change',e=>this.change(e));root.addEventListener('input',e=>this.input(e));
 }
 name(id){return this.registry?.views?.find(v=>v.id===id)?.name||names[id]||id;}
 rows(){return soundSlots(this.selected);}
 bindings(){return this.getSettings().bindings;}
 scopeKey(){return this.scope==='all'?'*':this.selected;}
 binding(row){return soundBinding(this.scope==='all'?{bindings:{'*':this.bindings()['*']}}:this.getSettings(),this.selected,row);}
 section(key,label,rows){return `<details data-sound-map-section="${html(key)}" ${(this.sections.get(key)??key!=='Zdarzenia gry')?'open':''}><summary>${html(label)} · ${rows.length}</summary>${rows.map(r=>this.bindingRow(r)).join('')}</details>`;}
 bindingRow(row){
  const binding=this.binding(row),own=this.bindings()[this.scopeKey()]?.[row.key];
  const selected=this.links().find(r=>r.key===this.connection),active=selected&&this.slotForLink(selected)?.key===row.key;
  return `<div class="sound-binding ${active?'is-selected':''}" data-sound-binding-row="${html(row.key)}"><strong>${html(row.label)}</strong><div class="sound-binding-choice"><select data-sound-binding-cue="${html(row.key)}" aria-label="Dźwięk: ${html(row.label)}"><option value="none" ${binding.cue==='none'?'selected':''}>Bez dźwięku</option>${SOUND_CUES.map(([id,name])=>`<option value="${id}" ${binding.cue===id?'selected':''}>${html(name)}</option>`).join('')}</select><button type="button" class="sound-preview-button" data-sound-binding-play="${html(row.key)}" aria-label="Odsłuchaj: ${html(row.label)}">▶</button><button type="button" class="small-button" data-sound-binding-mix="${html(row.key)}" ${binding.cue==='none'?'disabled':''} aria-label="Mikser: ${html(row.label)}">Miks</button></div><label class="sound-binding-volume">Głośność <input type="range" min="0" max="150" value="${binding.volume}" data-sound-binding-volume="${html(row.key)}"><output>${binding.volume}%</output></label><div class="sound-binding-inherit"><small>${own?'Własne przypisanie':this.scope==='all'?'Domyślne przypisanie':this.bindings()['*']?.[row.key]?'Przypisanie wspólne':'Domyślne przypisanie'}</small><button type="button" class="small-button" data-sound-binding-reset="${html(row.key)}" ${own?'':'hidden'}>Przywróć</button></div></div>`;
 }
 render(){
  this.root.innerHTML=`<div class="sound-map-layout"><section class="flow-canvas sound-map-canvas" tabindex="0" aria-label="Mapa dźwięków ekranów. Przesuń poziomo."><div class="architecture-map"><svg class="flow-connections" aria-label="Połączenia ekranów"></svg>${SOUND_COLUMNS.map(([label,ids])=>`<div class="flow-column"><h4 class="flow-column-label">${html(label)}</h4>${ids.map(id=>`<button type="button" class="wire-card" data-sound-map-view="${id}" aria-pressed="${id===this.selected}"><span class=wire-card-title>${studioIcon(mapViewIcon(this.registry?.views?.find(v=>v.id===id)||{id}))}<b>${html(this.name(id))}</b></span><div class="wire-body" aria-hidden="true"><i class="wire-part">Przyciski i sterowanie</i><i class="wire-part">Dźwięki interakcji ♫</i></div><small>${soundSlots(id).length} przypisań</small></button>`).join('')}</div>`).join('')}</div></section><aside class="sound-map-inspector" data-sound-map-inspector></aside></div>`;
  this.renderInspector();const canvas=this.root.querySelector('.sound-map-canvas');let pan;
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,input,select,[data-map-connection]'))return;pan={x:e.clientX,left:canvas.scrollLeft,id:e.pointerId};canvas.setPointerCapture(e.pointerId);canvas.classList.add('panning');});
  canvas.addEventListener('pointermove',e=>{if(pan&&e.pointerId===pan.id)canvas.scrollLeft=pan.left-e.clientX+pan.x;});
  const stop=()=>{pan=null;canvas.classList.remove('panning');};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
  requestAnimationFrame(()=>this.drawConnections());
  this.observer=new ResizeObserver(()=>this.drawConnections());this.observer.observe(canvas);
 }
 destroy(){this.observer?.disconnect();}
 remember(){this.root.querySelectorAll('[data-sound-map-section]').forEach(d=>this.sections.set(d.dataset.soundMapSection,d.open));}
 renderInspector(){
  this.remember();const node=this.root.querySelector('[data-sound-map-inspector]');if(!node)return;
  const groups=new Map();for(const row of this.rows()){if(!groups.has(row.group))groups.set(row.group,[]);groups.get(row.group).push(row);}
  node.innerHTML=`<span class="inspector-kicker">Wybrany ekran</span><h4>${html(this.name(this.selected))}</h4><label class="form-field"><span>Zakres przypisania</span><select data-sound-binding-scope><option value="local" ${this.scope==='local'?'selected':''}>Tylko ten ekran</option><option value="all" ${this.scope==='all'?'selected':''}>To działanie we wszystkich ekranach</option></select></label><p>Jedno przypisanie obejmuje wszystkie opcje danego działania, np. każdą cyfrę PIN-u. Stany dobrej odpowiedzi, błędu i pauzy korzystają z mapy gry.</p>${[...groups].map(([key,rows])=>this.section(key,key,rows)).join('')}`;
 }
 links(){
  const config=this.getDesign().config;
  return screenLinks(this.registry,this.selected).map(r=>({...r,key:routeKey(r.from,r.action,r.context),to:soundViewKey(config.navigation?.routes?.[routeKey(r.from,r.action,r.context)]||r.to)}));
 }
 slotForLink(link){
  const aliases={'enter-player':'action:continue-player','submit-name':'submit:player-create-form','unlock-player':'action:submit-pin'};
  const key=link.action==='start'?(this.selected.startsWith('math-')?'math:start':'submit:setup-form'):aliases[link.action]||'action:'+link.action+(link.context&&link.action==='choose-mode'?':'+link.context:'');
  return this.rows().find(r=>r.key===key)||this.rows().find(r=>r.key==='progress:'+({trophies:'achievements'})[link.to])||this.rows().find(r=>r.key==='progress:'+link.to)||this.rows().find(r=>r.key==='button');
 }
 selectConnection(key){
  const link=this.links().find(r=>r.key===key);if(!link)return;this.connection=key;this.renderInspector();this.drawConnections();
  const slot=this.slotForLink(link),control=slot&&[...this.root.querySelectorAll('[data-sound-binding-cue]')].find(n=>n.dataset.soundBindingCue===slot.key);focusConnectionControl(control);
 }
 drawConnections(){
  const map=this.root.querySelector('.architecture-map'),svg=map?.querySelector('.flow-connections');if(!svg)return;
  drawMapConnections({map,svg,cardSelector:'[data-sound-map-view]',keyAttribute:'data-sound-map-view',links:this.links().map(r=>({...r,label:this.name(r.from)+' → '+this.name(r.to)+' · '+r.label})),selected:this.connection,markerId:'sound-arrow-tip'});
 }

 edit(key,patch){
  const row=this.rows().find(r=>r.key===key);if(!row)return;
  const scope=this.scopeKey(),bindings=this.bindings();bindings[scope]??={};bindings[scope][key]={...this.binding(row),...patch};
 }
 input(e){const key=e.target.dataset.soundBindingVolume;if(!key)return;this.edit(key,{volume:Number(e.target.value)});const row=e.target.closest('[data-sound-binding-row]');row.querySelector('output').textContent=e.target.value+'%';row.querySelector('[data-sound-binding-reset]').hidden=false;row.querySelector('small').textContent='Własne przypisanie';}
 change(e){
  const d=e.target.dataset;if(d.soundBindingScope!==undefined){this.scope=e.target.value;this.renderInspector();return;}
  if(d.soundBindingCue){this.edit(d.soundBindingCue,{cue:e.target.value});this.save();this.renderInspector();}
  else if(d.soundBindingVolume)this.save();
 }
 click(e){
  const edge=e.target.closest('[data-map-connection]');if(edge){this.selectConnection(edge.dataset.mapConnection);return;}const button=e.target.closest('button');if(!button)return;const d=button.dataset;
  if(d.soundMapView){this.connection='';this.selected=d.soundMapView;this.root.querySelectorAll('[data-sound-map-view]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.soundMapView===this.selected)));this.renderInspector();this.drawConnections();return;}
  const key=d.soundBindingReset||d.soundBindingPlay||d.soundBindingMix,row=this.rows().find(r=>r.key===key);if(!row)return;
  if(d.soundBindingReset){const scope=this.scopeKey();delete this.bindings()[scope]?.[key];if(!Object.keys(this.bindings()[scope]||{}).length)delete this.bindings()[scope];this.save();this.renderInspector();}
  else if(d.soundBindingPlay){const b=this.binding(row);void this.play(b.cue,b.volume/100);}
  else this.editCue(this.binding(row).cue);
 }
}
