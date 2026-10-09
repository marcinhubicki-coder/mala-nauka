import {SOUND_COLUMNS,soundSlots,soundBinding,soundViewKey} from '../shared/sound-map.mjs';
import {SOUND_CUES} from '../shared/sound-library.mjs';
import {architectureLinks,startupLinks,routeKey,GAME_MODES} from '../shared/navigation.mjs';
import {outgoing} from '../shared/flow-model.mjs';
const html=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={players:'Wybór gracza','players-empty':'Pierwsze uruchomienie','player-create':'Nowy gracz','player-pin':'PIN / bez PIN-u','player-unlock':'Odblokuj PIN',home:'Ekran startowy',settings:'Ustawienia aplikacji',progress:'Moje wyniki',collection:'Kolekcja',trophies:'Osiągnięcia',categories:'Kategorie',rules:'Zasady',sessions:'Historia rund'};
export class StudioSoundMap{
 constructor({root,registry,getSettings,getDesign,save,play,editCue}){
  Object.assign(this,{root,registry,getSettings,getDesign,save,play,editCue});this.selected='home';this.scope='local';this.sections=new Map();
  root.addEventListener('click',e=>this.click(e));root.addEventListener('change',e=>this.change(e));root.addEventListener('input',e=>this.input(e));
 }
 name(id){return this.registry?.views?.find(v=>v.id===id)?.name||names[id]||id;}
 rows(){return soundSlots(this.selected);}
 bindings(){return this.getSettings().bindings;}
 scopeKey(){return this.scope==='all'?'*':this.selected;}
 binding(row){return soundBinding(this.scope==='all'?{bindings:{'*':this.bindings()['*']}}:this.getSettings(),this.selected,row);}
 section(key,label,rows){return `<details data-sound-map-section="${html(key)}" ${(this.sections.get(key)??key!=='Zdarzenia gry')?'open':''}><summary>${html(label)} · ${rows.length}</summary>${rows.map(r=>this.bindingRow(r)).join('')}</details>`;}
 bindingRow(row){
  const binding=this.binding(row),own=this.bindings()[this.scopeKey()]?.[row.key];
  return `<div class="sound-binding" data-sound-binding-row="${html(row.key)}"><strong>${html(row.label)}</strong><div class="sound-binding-choice"><select data-sound-binding-cue="${html(row.key)}" aria-label="Dźwięk: ${html(row.label)}"><option value="none" ${binding.cue==='none'?'selected':''}>Bez dźwięku</option>${SOUND_CUES.map(([id,name])=>`<option value="${id}" ${binding.cue===id?'selected':''}>${html(name)}</option>`).join('')}</select><button type="button" class="sound-preview-button" data-sound-binding-play="${html(row.key)}" aria-label="Odsłuchaj: ${html(row.label)}">▶</button><button type="button" class="small-button" data-sound-binding-mix="${html(row.key)}" ${binding.cue==='none'?'disabled':''} aria-label="Mikser: ${html(row.label)}">Miks</button></div><label class="sound-binding-volume">Głośność <input type="range" min="0" max="150" value="${binding.volume}" data-sound-binding-volume="${html(row.key)}"><output>${binding.volume}%</output></label><div class="sound-binding-inherit"><small>${own?'Własne przypisanie':this.scope==='all'?'Domyślne przypisanie':this.bindings()['*']?.[row.key]?'Przypisanie wspólne':'Domyślne przypisanie'}</small><button type="button" class="small-button" data-sound-binding-reset="${html(row.key)}" ${own?'':'hidden'}>Przywróć</button></div></div>`;
 }
 render(){
  this.root.innerHTML=`<div class="sound-map-layout"><section class="flow-canvas sound-map-canvas" tabindex="0" aria-label="Mapa dźwięków ekranów. Przesuń poziomo."><div class="architecture-map"><svg class="flow-connections" aria-hidden="true"></svg>${SOUND_COLUMNS.map(([label,ids])=>`<div class="flow-column"><h4 class="flow-column-label">${html(label)}</h4>${ids.map(id=>`<button type="button" class="wire-card" data-sound-map-view="${id}" aria-pressed="${id===this.selected}"><span>${html(this.name(id))}</span><div class="wire-body" aria-hidden="true"><i class="wire-part">Przyciski i sterowanie</i><i class="wire-part">Dźwięki interakcji ♫</i></div><small>${soundSlots(id).length} przypisań</small></button>`).join('')}</div>`).join('')}</div></section><aside class="sound-map-inspector" data-sound-map-inspector></aside></div>`;
  this.renderInspector();const canvas=this.root.querySelector('.sound-map-canvas');let pan;
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,input,select'))return;pan={x:e.clientX,left:canvas.scrollLeft,id:e.pointerId};canvas.setPointerCapture(e.pointerId);canvas.classList.add('panning');});
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
  const id=this.selected,config=this.getDesign().config;
  let rows=id.startsWith('player')?startupLinks(id):id==='home'?GAME_MODES.map(mode=>({from:id,action:'choose-mode',context:mode,to:mode+'-settings'})).concat([{from:id,action:'settings',to:'settings'},{from:id,action:'history',to:'progress'}]):GAME_MODES.flatMap(architectureLinks).filter(r=>r.from===id);
  if(this.registry?.flows)rows=rows.concat(outgoing(this.registry,id).filter(r=>!r.state));
  return [...new Set(rows.map(r=>soundViewKey(config.navigation?.routes?.[routeKey(r.from,r.action,r.context)]||r.to)))];
 }
 drawConnections(){
  const map=this.root.querySelector('.architecture-map'),svg=map?.querySelector('svg');if(!svg)return;
  const cards=[...map.querySelectorAll('[data-sound-map-view]')],from=cards.find(n=>n.dataset.soundMapView===this.selected);if(!from)return;
  const origin=map.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${map.scrollWidth} ${map.scrollHeight}`);
  svg.innerHTML=this.links().filter(id=>id!==this.selected).map(id=>{const target=cards.find(n=>n.dataset.soundMapView===id);if(!target)return '';const a=from.getBoundingClientRect(),b=target.getBoundingClientRect(),right=b.left>a.left,x1=(right?a.right:a.left)-origin.left,y1=a.top+a.height/2-origin.top,x2=(right?b.left:b.right)-origin.left,y2=b.top+b.height/2-origin.top,dx=right?28:-28;return `<path d="M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}"/><circle cx="${x2}" cy="${y2}" r="3"/>`;}).join('');
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
  const button=e.target.closest('button');if(!button)return;const d=button.dataset;
  if(d.soundMapView){this.selected=d.soundMapView;this.root.querySelectorAll('[data-sound-map-view]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.soundMapView===this.selected)));this.renderInspector();this.drawConnections();return;}
  const key=d.soundBindingReset||d.soundBindingPlay||d.soundBindingMix,row=this.rows().find(r=>r.key===key);if(!row)return;
  if(d.soundBindingReset){const scope=this.scopeKey();delete this.bindings()[scope]?.[key];if(!Object.keys(this.bindings()[scope]||{}).length)delete this.bindings()[scope];this.save();this.renderInspector();}
  else if(d.soundBindingPlay){const b=this.binding(row);void this.play(b.cue,b.volume/100);}
  else this.editCue(this.binding(row).cue);
 }
}
