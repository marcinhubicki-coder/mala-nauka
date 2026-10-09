import {html,MODE_NAMES} from './preview-model.mjs';
import {viewParts,viewType,LEVEL_NAMES} from '../shared/structure-model.mjs';
import {architectureLinks,routeKey,routeTargets,startupLinks,playerSelectionSettings,PLAYER_SELECTION_DEFAULTS} from '../shared/navigation.mjs';
const SCENARIOS={players:{one:'1 gracz',two:'2 graczy',initial:'3 graczy'},'players-empty':{empty:'Pierwsze uruchomienie · brak graczy'},'player-pin':{initial:'Ustaw PIN', 'no-pin':'Bez PIN-u'},'player-unlock':{unlock:'Wpisz PIN · przykład 1234'}};
export class StudioFlow{
 constructor(options){
  Object.assign(this,options);this.selected='home';this.detail=false;this.context='home';this.scenarios=new Map();this.sections=new Map();
  this.workspace.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   if(b.dataset.flowSelect){this.saveSections();this.selected=b.dataset.flowSelect;this.renderInspector();this.workspace.querySelectorAll('[data-flow-select]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.flowSelect===this.selected)));this.drawConnections();}
   if(b.dataset.flowOpen)this.openView(b.dataset.flowOpen,this.scenarios.get(b.dataset.flowOpen));
   if(b.dataset.flowPart)this.openElement(this.selected,b.dataset.flowPart,this.scenarios.get(this.selected));
   if(b.dataset.flowRecipe)this.openRecipe?.(b.dataset.flowRecipe);
   if(b.hasAttribute('data-flow-detail')){this.detail=!this.detail;this.render();}
   if(b.dataset.flowReset){this.saveSections();this.editRoute(b.dataset.flowReset,'');this.renderInspector();this.drawConnections();}
   if(b.dataset.flowSelectionReset){this.editSelection(b.dataset.flowSelectionReset,undefined);this.renderInspector();}
  });
  this.workspace.addEventListener('change',e=>{const n=e.target;
   if(n.dataset.flowRoute){this.saveSections();this.editRoute(n.dataset.flowRoute,n.value);this.renderInspector();this.drawConnections();}
   if(n.id==='flow-context'){this.context=n.value;this.renderInspector();this.drawConnections();}
   if(n.id==='flow-scenario'){this.scenarios.set(this.selected,n.value);}
   if(n.dataset.flowSelection){this.saveSections();this.editSelection(n.dataset.flowSelection,n.type==='checkbox'?n.checked:Number(n.value));this.renderInspector();}
  });
 }
 name(id){return this.registry.views.find(v=>v.id===id)?.name||({players:'Wybór gracza',home:'Ekran startowy',progress:'Moje wyniki'})[id]||id;}
 view(id=this.selected){return this.registry.views.find(v=>v.id===id);}
 parts(id=this.selected){return viewParts(this.view(id),this.getInventories?.().get(id));}
 saveSections(){for(const d of this.workspace.querySelectorAll('[data-flow-section]'))this.sections.set(d.dataset.flowSection,d.open);}
 section(id,name,content,open=false){return `<details data-flow-section=${id} ${(this.sections.get(id)??open)?'open':''}><summary>${name}</summary>${content}</details>`;}
 card(id){const parts=this.parts(id);return `<button class=wire-card data-flow-select=${id} aria-pressed=${this.selected===id}><span>${html(this.name(id))}</span>${this.view(id)?.mode&&/-settings$|-initial$|-results$/.test(id)?`<small class=wire-mode>${MODE_NAMES[this.view(id).mode]}</small>`:''}<div class=wire-body aria-hidden=true>${parts.slice(0,this.detail?6:3).map((p,i)=>`<i class=wire-part>${this.detail?html(p.name):['━━━━━━','▤','▰ ▰ ▰'][i%3]}</i>`).join('')}</div>${this.detail?`<small>${parts.length} części · ${LEVEL_NAMES.family}</small>`:''}</button>`;}
 links(){const id=this.selected;
  if(['players','players-empty','player-create','player-pin','player-unlock'].includes(id))return startupLinks(id);
  if(id==='home')return Object.keys(MODE_NAMES).map(m=>({from:id,action:'choose-mode',context:m,label:'Zagraj: '+MODE_NAMES[m],to:m+'-settings'})).concat({from:id,action:'settings',label:'Ustawienia',to:'settings'},{from:id,action:'history',label:'Moje wyniki',to:'progress'});
  if(id==='settings')return [{from:id,action:'home',label:'Powrót',to:'home'},{from:id,action:'switch-player',label:'Zmień gracza',to:'players'}];
  let links=Object.keys(MODE_NAMES).flatMap(architectureLinks).filter(e=>e.from===id);
  if(id==='progress')links=links.filter(e=>this.context==='home'?e.action==='home':e.context===this.context);
  return links;
 }
 render(){
  this.saveSections();const left=this.workspace.querySelector('.flow-canvas')?.scrollLeft||0;
  const cols=[['Logowanie',['players-empty','players','player-create','player-pin','player-unlock']],['Ekran startowy',['home','settings']],['Opcje rozgrywki',Object.keys(MODE_NAMES).map(m=>m+'-settings')],['Początek gry',Object.keys(MODE_NAMES).map(m=>m+'-initial')],['Koniec gry',Object.keys(MODE_NAMES).map(m=>m+'-results')],['Statystyki',['progress','collection','trophies','sessions']]];
  this.workspace.innerHTML=`<div class="content-page flow-workspace"><div class=page-intro><div><h2>Architektura widoków</h2><p>Wybierz widok, zmień połączenia lub przejdź do jego części. Mapę przesuwaj pustym obszarem.</p></div><button class=quiet-button data-flow-detail aria-pressed=${this.detail}>${this.detail?'Uprość widok':'Pokaż strukturę'}</button></div><div class=architecture-layout><section class=flow-canvas tabindex=0 aria-label="Pozioma mapa widoków"><div class=architecture-map><svg class=flow-connections aria-hidden=true></svg>${cols.map(([label,ids])=>`<div class=flow-column><h3 class=flow-column-label>${label}</h3>${ids.filter(id=>this.view(id)).map(id=>this.card(id)).join('')}</div>`).join('')}</div></section><aside class="panel flow-inspector" id=flow-inspector></aside></div></div>`;
  this.renderInspector();const canvas=this.workspace.querySelector('.flow-canvas');canvas.scrollLeft=left;let pan;
  canvas.addEventListener('pointerdown',e=>{if(e.target.closest('button,input,select')||e.button!==0)return;pan={x:e.clientX,left:canvas.scrollLeft,id:e.pointerId};canvas.setPointerCapture(e.pointerId);canvas.classList.add('panning');});
  canvas.addEventListener('pointermove',e=>{if(pan&&pan.id===e.pointerId)canvas.scrollLeft=pan.left-(e.clientX-pan.x);});
  const stop=()=>{pan=null;canvas.classList.remove('panning');};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
  requestAnimationFrame(()=>this.drawConnections());
 }
 partTree(parts){return parts.map(p=>`<div class=flow-part-row><button class=structure-link data-flow-part="${html(p.selector)}"><small>${LEVEL_NAMES[p.level]}</small>${html(p.name)}</button><button class=structure-recipe-link data-flow-recipe="${html(p.recipe)}" title="Przepis wspólny" aria-label="Przepis: ${html(p.name)}">↗</button>${p.children.length?`<details><summary>W środku · ${p.children.length}</summary>${this.partTree(p.children)}</details>`:''}</div>`).join('');}
 renderInspector(){
  const node=this.workspace.querySelector('#flow-inspector');if(!node)return;const c=this.getDesign(),id=this.selected,type=viewType(this.view()),parts=this.parts(),links=this.links();
  const effects=c.screenEffects?.[id]?.surfaceEffects||[],animations=Object.entries({...c.elementOverrides?.[id],...c.elementStates?.[id]?.default}).filter(([,r])=>r.animation||r.enterAnimation||r.activeAnimation);
  const states=SCENARIOS[id]||(type==='settings'?{initial:'Domyślny'}:type==='game'?{initial:'Przed odpowiedzią',correct:'Dobra odpowiedź',wrong:'Błąd',pause:'Pauza'}:{initial:'Domyślny'});
  const routes=links.map(e=>{const key=routeKey(e.from,e.action,e.context),saved=c.navigation?.routes?.[key],to=saved||e.to;return `<div class=flow-route><label class=form-field><span>${html(e.label)}</span>${e.fixed?`<b>${html(this.name(to))}</b>`:`<select data-flow-route="${key}" aria-label="Dokąd: ${html(e.label)}">${(e.targets||routeTargets.filter(v=>!v.endsWith('-results')||v===e.to)).map(v=>`<option value=${v} ${to===v?'selected':''}>${html(this.name(v))}</option>`).join('')}</select>`}</label>${e.condition?`<small>${html(e.condition)}</small>`:''}${saved&&saved!==e.to?`<button class=small-button data-flow-reset="${key}">Przywróć: ${html(this.name(e.to))}</button>`:''}</div>`;}).join('');
  const selection=playerSelectionSettings(c),selectionControls=this.section('selection','Przejście po wyborze gracza',`<label class=compact-check><input type=checkbox data-flow-selection=autoContinue ${selection.autoContinue?'checked':''}> Przechodź po zaznaczeniu</label>${['delay','fadeDuration','otherOpacity'].map(key=>`<label class=form-field><span>${{delay:'Czas na pokazanie wyboru (ms)',fadeDuration:'Płynne wejście ekranu (ms)',otherOpacity:'Widoczność pozostałych graczy'}[key]}</span><input type=number min=0 max=${key==='otherOpacity'?1:key==='delay'?2000:1500} step=${key==='otherOpacity'?.05:20} data-flow-selection=${key} value=${selection[key]}></label>${selection[key]!==PLAYER_SELECTION_DEFAULTS[key]?`<button class=small-button data-flow-selection-reset=${key}>Przywróć</button>`:''}`).join('')}`,true);
  node.innerHTML=`<span class=section-kicker>RODZINA · WYBRANY WIDOK</span><h3>${html(this.name(id))}</h3><button class=quiet-button data-flow-open=${id}>Otwórz w Komponentach</button>${id==='progress'?`<label class=form-field><span>Skąd otwarto wyniki?</span><select id=flow-context><option value=home ${this.context==='home'?'selected':''}>Ekran startowy</option>${Object.keys(MODE_NAMES).map(m=>`<option value=${m}-results ${this.context===m+'-results'?'selected':''}>Koniec rundy · ${MODE_NAMES[m]}</option>`).join('')}</select></label>`:''}${this.section('parts','Części widoku · '+parts.length,this.partTree(parts),true)}${this.section('states','Scenariusze i stany · '+Object.keys(states).length,`<label class=form-field><span>Przykład w podglądzie</span><select id=flow-scenario>${Object.entries(states).map(([key,label])=>`<option value=${key} ${(this.scenarios.get(id)||this.view()?.state)===key?'selected':''}>${label}</option>`).join('')}</select></label><button class=small-button data-flow-open=${id}>Otwórz wybrany stan</button>${id==='player-unlock'?'<p>Testowy PIN: 1234. Podgląd nie zapisuje prawdziwych profili.</p>':''}`,true)}${id.startsWith('players')?selectionControls:''}${this.section('routes','Przyciski i połączenia · '+links.length,routes||'<p>Wybierz część widoku, aby edytować jej stany i animacje.</p>',true)}${id==='player-pin'?this.section('pinActions','Klawiatura i warianty',`<button class=structure-link data-flow-part=".pin-mode">PIN / bez PIN-u → przepis jelly</button><button class=structure-link data-flow-part=".pin-keypad">Cyfry 0–9, usuń, zatwierdź</button><button class=structure-link data-flow-part=".pin-fields">Wysokość kafla i przejście między stanami</button>`):''}${this.section('effects','Efekty i animacje',`<p>${effects.map(e=>html(e.effect)).join(', ')||'Brak efektów ekranu'}</p><p>Przejście: ${html(c.motion?.style||'fade')} · ${c.motion?.duration||0} ms</p>${animations.map(([k,r])=>`<button class=structure-link data-flow-part='[data-ds-element="${html(k)}"]'>${html(k)} · ${html(r.animation||r.enterAnimation||r.activeAnimation)}</button>`).join('')}<button class=small-button data-flow-open=${id}>Edytuj animacje części</button>`)}`;
 }
 drawConnections(){
  const map=this.workspace.querySelector('.architecture-map'),svg=map?.querySelector('.flow-connections');if(!svg)return;
  const origin=map.getBoundingClientRect(),cards=[...map.querySelectorAll('[data-flow-select]')],from=cards.find(n=>n.dataset.flowSelect===this.selected);svg.setAttribute('viewBox',`0 0 ${map.scrollWidth} ${map.scrollHeight}`);if(!from){svg.innerHTML='';return;}
  const c=this.getDesign();svg.innerHTML=[...new Set(this.links().map(e=>c.navigation?.routes?.[routeKey(e.from,e.action,e.context)]||e.to))].filter(to=>to!==this.selected).map(to=>{const target=cards.find(n=>n.dataset.flowSelect===to);if(!target)return '';const a=from.getBoundingClientRect(),b=target.getBoundingClientRect(),right=b.left>a.left,x1=(right?a.right:a.left)-origin.left,y1=a.top+a.height/2-origin.top,x2=(right?b.left:b.right)-origin.left,y2=b.top+b.height/2-origin.top,dx=right?22:-22;return `<path d="M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}"/><circle cx=${x2} cy=${y2} r=3/>`;}).join('');
 }
}
