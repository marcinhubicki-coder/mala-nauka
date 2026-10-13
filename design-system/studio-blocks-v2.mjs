import {runtimeCatalog,semanticCatalog,runtimeStack,BLOCK_LEVELS} from '../shared/runtime-blocks.mjs';
import {RuntimeCatalog} from './runtime-catalog.mjs';
import {VISUAL_FIELDS,ICONS,rawVisualValue} from '../shared/element-system.mjs';
import {behaviorPicker} from './behavior-picker.mjs';
import {surfaceEditor,selectSurface} from './surface-editor.mjs';
import {html} from './preview-model.mjs';
import {PART_BY_ID} from '../shared/structure-model.mjs';
import {TYPE_STYLE_IDS} from '../shared/type-system.mjs';
import {ATOM_TYPE_IDS,ATOM_TYPES,atomTypeFor,countDesignConcepts} from '../shared/atom-vocabulary.mjs';

export class StudioBlocksV2 {
 constructor(owner){this.owner=owner;this.scanner=new RuntimeCatalog(owner);this.scanner.subscribe(()=>{this.libraryCache=null;this.refresh();});this.level='family';this.atomFilter='';this.viewFilter='';this.search='';this.details=false;this.part='';this.useIndex=0;this.isolated=true;this.scope='global';this.groups=new Map();window.addEventListener('message',e=>this.receive(e));}
 get workspace(){return this.owner.workspace;}
 get config(){return this.owner.getDesign().config;}
 get open(){return Boolean(this.workspace.querySelector('[data-block-library-v2]'));}
 catalog(){if(!this.libraryCache){const raw=runtimeCatalog(this.owner.registry,this.owner.getInventories());this.libraryCache={raw,shared:semanticCatalog(raw)};}return this.details?this.libraryCache.raw:this.libraryCache.shared;}
 visibleRecords(){return this.catalog().filter(r=>this.details||(r.registered&&(this.viewFilter?r.uses.some(u=>u.view===this.viewFilter):new Set(r.uses.map(u=>u.view)).size>=2)));}
 get record(){return this.catalog().find(r=>r.id===this.part);}
 get use(){return this.record?.uses[this.useIndex]||this.record?.uses[0];}
 selectPart(id,context={}){
  const inventory=this.owner.getInventories().get(context.view)?.items||[],item=inventory.find(i=>i.id===context.id);
  const record=this.catalog().find(r=>r.id===(context.blockId||item?.blockId||id)||r.recipe===item?.recipe||r.recipe===id||r.uses.some(use=>use.blockId===id));
  this.part=record?.id||id;if(record&&!record.registered)this.details=true;this.level=record?.level||'family';this.useIndex=Math.max(0,record?.uses.findIndex(u=>u.view===context.view&&(!context.id||u.id===context.id))||0);this.scope='global';
 }
 path(key){const use=this.use;if(['background','textColor'].includes(key)&&['spelling','english','flags','reading','math'].includes(use.mode))return `familyStyles.${use.mode}.${this.part}.${key}`;return this.scope==='view'?`elementOverrides.${use.view}.${use.id}.${key}`:`elementStyles.${this.part}.${key}`;}
 style(){const u=this.use;if(!u)return{};return rawVisualValue(this.config,u.view,{...u,recipe:this.record.recipe,kind:this.record.kind});}
 send(type,data={}){this.frame?.contentWindow?.postMessage({channel:'mala-nauka-studio',type,...data},location.origin);}
 sendDesign(){this.send('design',this.owner.getDesign());if(this.open&&!document.activeElement?.closest('.block-properties'))this.renderControls();}
 status(){const n=this.scanner.done.size,total=this.owner.registry.views.length;return this.scanner.complete?`Odczytano wszystkie ekrany (${total}/${total}).`:this.scanner.current?`Odczyt ekranów: ${n}/${total} · ${this.scanner.current.name}`:this.scanner.failures.size?`Nie udało się odczytać ${this.scanner.failures.size} ekranów.`:'Odczytywanie ekranów…';}
 render(){
  this.scanner.start();
  const metrics=countDesignConcepts(semanticCatalog(runtimeCatalog(this.owner.registry,this.owner.getInventories())));
  this.workspace.innerHTML=`<div class=block-library-v2 data-block-library-v2><header class=block-library-heading><div><span class=section-kicker>DESIGN STUDIO V2</span><h2>Biblioteka klocków</h2><p>${ATOM_TYPE_IDS.length} typów atomów · ${metrics.sharedBuildingBlocks} wspólnych klocków · rodziny i grupy z jednego źródła.</p></div><span class=block-scan-status role=status>${html(this.status())}</span></header><div class=block-library-grid><aside class="panel block-catalog"><label class=form-field><span>Zakres biblioteki</span><select data-block-details><option value=core ${!this.details?'selected':''}>Wspólne klocki</option><option value=all ${this.details?'selected':''}>Wszystkie szczegóły</option></select></label><label class=form-field><span>Poziom</span><select data-block-level>${Object.entries(BLOCK_LEVELS).map(([id,name])=>`<option value=${id} ${id===this.level?'selected':''}>${name}</option>`).join('')}</select></label><label class=form-field><span>Typ atomu</span><select data-block-atom><option value=''>Wszystkie rodzaje</option>${ATOM_TYPE_IDS.map(id=>`<option value=${id} ${this.atomFilter===id?'selected':''}>${html(ATOM_TYPES[id].name)}</option>`).join('')}</select></label><label class=form-field><span>Ekran</span><select data-block-view><option value="">Wszystkie ekrany</option>${this.owner.registry.views.map(v=>`<option value=${v.id} ${v.id===this.viewFilter?'selected':''}>${html(v.name)}</option>`).join('')}</select></label><label class=form-field><span>Szukaj klocka</span><input data-block-search type=search value="${html(this.search)}"></label><div class=block-catalog-rows></div><div class=block-catalog-errors></div></aside><section class="panel block-preview"><div class=block-preview-heading></div><div class=block-preview-tools><button class=quiet-button data-block-isolate aria-pressed=${this.isolated}>Sam klocek</button><button class=quiet-button data-block-context aria-pressed=${!this.isolated}>Na ekranie</button><button class=quiet-button data-block-edit-screen>Edytuj ekran ↗</button></div><label class=form-field><span>Użycie · treść i theme z ekranu</span><select data-block-use></select></label><div class=block-runtime-stage><div class=block-runtime-crop></div></div><p class=block-preview-status role=status>Wybierz klocek z listy.</p></section><aside class="panel block-controls"><div class=block-properties></div></aside></div></div>`;
  this.refresh();
  this.resize?.disconnect();this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(this.workspace.querySelector('.block-runtime-stage'));
 }
 refresh(){if(!this.open)return;const records=this.visibleRecords();if(records.length&&!records.some(r=>r.id===this.part)){const initial=records.find(r=>r.level===this.level)||records[0];this.part=initial.id;this.level=initial.level;this.useIndex=0;}
  this.workspace.querySelector('.block-scan-status').textContent=this.status();this.renderRows();if(!document.activeElement?.closest('.block-properties'))this.renderControls();this.mount();
 }
 renderRows(){
  const query=this.search.toLocaleLowerCase('pl'),records=this.visibleRecords().filter(r=>r.level===this.level&&(!this.atomFilter||atomTypeFor(r)===this.atomFilter)&&(!this.viewFilter||r.uses.some(u=>u.view===this.viewFilter))&&(!query||[r.name,...r.uses.map(u=>u.label)].join(' ').toLocaleLowerCase('pl').includes(query)));
  this.workspace.querySelector('.block-catalog-rows').innerHTML=records.map(r=>`<button class="block-catalog-row ${r.id===this.part?'active':''}" data-block-select="${r.id}" aria-pressed=${r.id===this.part}><strong>${html(r.name)}</strong><small>${BLOCK_LEVELS[r.level]} · ${r.uses.length} ${r.uses.length===1?'użycie':'użyć'}</small></button>`).join('')||'<p>Brak klocków w tym wyborze.</p>';
  this.workspace.querySelector('.block-catalog-errors').innerHTML=this.scanner.failures.size?`<p>${html(this.status())}</p>${[...this.scanner.failures.keys()].map(id=>`<p>${html(this.owner.registry.views.find(v=>v.id===id)?.name||id)}</p>`).join('')}<button class=quiet-button data-block-retry>Ponów odczyt</button>`:'';
 }
 renderControls(){
  const r=this.record,u=this.use,node=this.workspace.querySelector('.block-properties');if(!node||!r||!u)return;
  const scroll=this.workspace.querySelector('.block-controls').scrollTop;
  const s=this.style(),items=this.owner.getInventories().get(u.view)?.items||[],item=items.find(i=>i.id===u.id),view=this.owner.registry.views.find(v=>v.id===u.view),stack=runtimeStack(view,item,items);
  const metrics=this.selection?.id===u.id?this.selection.metrics:item?.metrics;
  const group=(id,title,content,open=false)=>`<details data-block-group=${id} ${(this.groups.get(id)??open)?'open':''}><summary>${title}</summary>${content}</details>`;
  const numeric=key=>{const [min,max,label]=VISUAL_FIELDS[key],value=s[key]??metrics?.[key]??({scale:1,opacity:1,originX:50,originY:50,imageScale:1,imageX:50,imageY:50})[key]??0;return `<label class=form-field><span>${label}</span><input type=number data-block-number=${key} min=${min} max=${max} step=${['scale','opacity','imageScale'].includes(key)?'.05':'1'} value=${value}></label>`;};
  this.workspace.querySelector('.block-preview-heading').innerHTML=`<small>${BLOCK_LEVELS[r.level]}</small><h3>${html(r.name)}</h3>`;
  this.workspace.querySelector('[data-block-use]').innerHTML=r.uses.map((use,i)=>`<option value=${i} ${i===this.useIndex?'selected':''}>${html(this.owner.registry.views.find(v=>v.id===use.view)?.name||use.view)} · ${html(use.label)}</option>`).join('');
  const text=item?.editableText,hex=value=>{if(/^#/.test(value||''))return value.slice(0,7);const rgb=(value||'').match(/\d+/g);return rgb&&rgb.length>=3?'#'+rgb.slice(0,3).map(v=>Number(v).toString(16).padStart(2,'0')).join(''):'#ffffff';};
  node.innerHTML=`<nav class=block-stack aria-label="Rodzina, grupa, atom">${stack.map(p=>`<button class=structure-link data-block-select=${p.libraryId}><small>${BLOCK_LEVELS[p.level]}</small>${html(p.label)}</button>`).join('')}</nav><label class=form-field><span>Zakres zmiany</span><select data-block-scope><option value=global ${this.scope==='global'?'selected':''}>Wspólny klocek · wszystkie użycia</option><option value=view ${this.scope==='view'?'selected':''}>To użycie na ekranie</option></select></label>${r.kind==='text'?group('typography','Styl tekstu',`<label class=form-field><span>Styl typografii</span><select data-block-field=typeStyle><option value='' ${!s.typeStyle?'selected':''}>Zachowaj istniejący wygląd</option>${TYPE_STYLE_IDS.map(id=>`<option value=${id} ${s.typeStyle===id?'selected':''}>${id.toUpperCase()}</option>`).join('')}</select></label><p>Jeden atom Tekst, dziesięć styli. Zmiana dotyczy wybranego zakresu.</p>`,true):''}${group('geometry','Rozmiar i pozycja',['width','height','padding','gap','radius','scale','opacity','offsetX','offsetY',...(['text','input','button','key'].includes(r.kind)?['fontSize']:[])].map(numeric).join(''),true)}${group('motion','Animacje i efekty',['animation','activeAnimation','idleAnimation','enterAnimation','exitAnimation'].map(key=>behaviorPicker(this.config,'animation',s[key]||'',{label:({animation:'Ruch',activeAnimation:'Aktywny',idleAnimation:'Nieaktywny',enterAnimation:'Wejście',exitAnimation:'Wyjście'})[key],attribute:`data-block-field=${key}`,inherit:true})).join('')+behaviorPicker(this.config,'state',s.statePreset||'',{label:'Zmiana rozmiaru',attribute:'data-block-field=statePreset',inherit:true})+surfaceEditor(s,this.surfaceIndex||0,this.config))}${group('theme','Theme i kolory',`<p>Kolory dotyczą theme wybranego użycia. Wariant koloru pozostaje tym samym klockiem.</p><button class=quiet-button data-studio-open=colors>Otwórz theme</button>${[['background','Tło','#ffffff'],['textColor','Tekst i ikona','#09043f']].map(([key,label,fallback])=>`<label class=form-field><span>${label}</span><input type=color data-block-field=${key} value="${hex(s[key]||metrics?.[key]||fallback)}"></label>`).join('')}`)}${['image','background'].includes(r.kind)?group('asset','Grafika i kadr',`<label class=form-field><span>Dopasowanie</span><select data-block-field=fit><option value=cover ${s.fit!=='contain'?'selected':''}>Wypełnij i przytnij</option><option value=contain ${s.fit==='contain'?'selected':''}>Pokaż całą</option></select></label><label class=form-field><span>Grafika</span><select data-block-field=asset><option value="">Z ekranu</option>${(this.owner.getDesign().assets?.assets||[]).filter(a=>/\.(png|jpg|webp|svg)$/.test(a.path)).map(a=>`<option value="${html(a.path)}" ${s.asset===a.path?'selected':''}>${html(a.path)}</option>`).join('')}</select></label>`+['imageScale','imageX','imageY'].map(numeric).join('')):''}${r.kind==='icon'?group('icon','Ikona',`<label class=form-field><span>Zamień ikonę</span><select data-block-field=icon><option value=''>Obecna</option>${Object.entries(ICONS).map(([id,name])=>`<option value=${id} ${s.icon===id?'selected':''}>${html(name)}</option>`).join('')}</select></label>`):''}${text&&this.scope==='view'?group('text','Treść tego użycia',`<textarea data-block-field=text>${html(s.text??text)}</textarea>`):''}<h4>Zawartość</h4><div class=block-children>${r.children.map(id=>{const child=this.catalog().find(c=>c.id===id);return child?`<button class=structure-link data-block-select=${id}><small>${BLOCK_LEVELS[child.level]}</small>${html(child.name)}</button>`:'';}).join('')||'<p>Samodzielny atom.</p>'}</div><h4>Wszystkie użycia</h4>${r.uses.map((use,i)=>`<button class=structure-link data-block-choose-use=${i}>${html(this.owner.registry.views.find(v=>v.id===use.view)?.name||use.view)} · ${html(use.label)}</button>`).join('')}`;
  this.workspace.querySelector('.block-controls').scrollTop=scroll;
  for(const details of node.querySelectorAll('details[data-block-group]'))details.addEventListener('toggle',()=>this.groups.set(details.dataset.blockGroup,details.open));
 }
 mount(){const u=this.use;if(!u)return;const stage=this.workspace.querySelector('.block-runtime-crop'),view=this.owner.registry.views.find(v=>v.id===u.view),url=this.scanner.url(view);
  if(this.frame?.isConnected&&this.frame.src===url){this.focus();return;}
  this.rect=null;stage.innerHTML='';this.ready=false;const frame=document.createElement('iframe');this.frame=frame;frame.className='block-runtime-frame';frame.title='Klocek z ekranu: '+view.name;frame.src=url;frame.addEventListener('load',()=>{this.send('design',this.owner.getDesign());this.send('inspect',{enabled:false,highlight:false});this.send('inventory-request');});stage.append(frame);this.fit();
 }
 focus(){const u=this.use;if(u)this.send('library-preview',{id:u.id,blockId:u.blockId,isolated:this.isolated});}
 receive(event){if(event.origin!==location.origin||event.source!==this.frame?.contentWindow||event.data?.channel!=='mala-nauka-studio')return;const m=event.data;
  if(m.type==='ready'){this.send('design',this.owner.getDesign());this.send('inspect',{enabled:false,highlight:false});this.send('inventory-request');}
  if(m.type==='inventory'&&m.rendered&&m.viewId===this.use?.view&&!this.ready){this.ready=true;this.focus();}
  if(m.type==='library-preview'&&m.id===this.use?.id){this.rect=m.rect;this.selection=m.selection;this.fit();if(!document.activeElement?.closest('.block-properties'))this.renderControls();if(!m.rect?.height||m.selection?.visible===false){this.workspace.querySelector('.block-preview-status').textContent='Odsłanianie wybranego klocka…';return;}this.workspace.querySelector('.block-preview-status').textContent=this.isolated?'Prawdziwy klocek z wybranego ekranu.':'Prawdziwy ekran z wybranym klockiem.';}
  if(m.type==='missing')this.workspace.querySelector('.block-preview-status').textContent='Odczytywanie właściwego stanu elementu…';
 }
 fit(){const stage=this.workspace.querySelector('.block-runtime-stage'),crop=this.workspace.querySelector('.block-runtime-crop');if(!stage||!crop||!this.frame)return;const r=this.isolated&&this.rect?.width&&this.rect?.height?this.rect:{x:0,y:0,width:390,height:844},pad=this.isolated?12:0,w=r.width+pad*2,h=r.height+pad*2,scale=Math.min(1,(stage.clientWidth-24)/w,(stage.clientHeight-24)/h);crop.style.cssText=`width:${w}px;height:${h}px;transform:translate(-50%,-50%) scale(${Math.max(.01,scale)})`;this.frame.style.left=-(r.x-pad)+'px';this.frame.style.top=-(r.y-pad)+'px';}
 write(key,value){this.owner.editLibrary(this.path(key),value);}
 handle(event){if(!this.open)return false;const n=event.target,b=n.closest('button');
  if(event.type==='click'&&b){
   if(b.dataset.blockSelect){this.selectPart(b.dataset.blockSelect,{view:this.use?.view});this.ready=false;this.renderRows();this.renderControls();this.mount();}
   if(b.hasAttribute('data-block-isolate')||b.hasAttribute('data-block-context')){this.isolated=b.hasAttribute('data-block-isolate');this.workspace.querySelector('[data-block-isolate]').setAttribute('aria-pressed',String(this.isolated));this.workspace.querySelector('[data-block-context]').setAttribute('aria-pressed',String(!this.isolated));this.focus();}
   if(b.dataset.blockChooseUse!==undefined){this.useIndex=+b.dataset.blockChooseUse;this.ready=false;this.renderControls();this.mount();}
   if(b.hasAttribute('data-block-edit-screen')&&this.use)this.owner.openElement(this.use.view,`[data-ds-element="${this.use.id}"]`);
   if(b.hasAttribute('data-block-retry'))this.scanner.retry();
   if(b.dataset.surfaceSelect!==undefined){this.surfaceIndex=+b.dataset.surfaceSelect;this.renderControls();}
   if(b.hasAttribute('data-surface-add')||b.hasAttribute('data-surface-remove')){const rows=structuredClone(this.style().surfaceEffects||[]);if(b.hasAttribute('data-surface-add')&&rows.length<4){rows.push({preset:'surface-bokeh'});this.surfaceIndex=rows.length-1;}else if(b.hasAttribute('data-surface-remove')){rows.splice(this.surfaceIndex||0,1);this.surfaceIndex=0;}this.write('surfaceEffects',rows);}
  }
  if(event.type==='input'&&n.hasAttribute('data-block-search')){this.search=n.value;this.renderRows();}
  if(event.type==='input'&&n.dataset.blockNumber){const key=n.dataset.blockNumber,[min,max]=VISUAL_FIELDS[key],value=+n.value;if(Number.isFinite(value)&&value>=min&&value<=max)this.write(key,value);}
  if(event.type==='change'){
   if(n.hasAttribute('data-block-details')){this.details=n.value==='all';this.part='';this.refresh();}
   if(n.hasAttribute('data-block-atom')){this.atomFilter=n.value;this.level='atom';this.part='';this.refresh();}
   if(n.hasAttribute('data-block-level')){this.level=n.value;this.part='';this.refresh();}
   if(n.hasAttribute('data-block-view')){this.viewFilter=n.value;this.part='';this.refresh();}
   if(n.hasAttribute('data-block-use')){this.useIndex=+n.value;this.ready=false;this.renderControls();this.mount();}
   if(n.hasAttribute('data-block-scope')){this.scope=n.value;this.renderControls();}
   if(n.dataset.blockField)this.write(n.dataset.blockField,n.value||undefined);
   if(n.dataset.surfacePreset!==undefined)this.write('surfaceEffects',selectSurface(this.style(),this.surfaceIndex||0,n.value));
  }
  return true;
 }
 leave(){this.resize?.disconnect();this.frame=null;this.ready=false;}
}
