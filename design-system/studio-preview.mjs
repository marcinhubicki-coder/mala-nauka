import {componentTree,screenLabel} from './component-tree.mjs';
import {jellyChoices,mountJellies} from './studio-jelly.mjs';
import {html,number,componentName,effectiveValue,savedMarker,rangeFor,FIELD_LABELS,MODE_NAMES,STATE_NAMES,relatedViews,compareSelection} from './preview-model.mjs';
import {CATEGORIES,componentCategories,VISUAL_FIELDS,ICONS,ELEMENT_FAMILIES,ELEMENT_KINDS,visualValue} from '../shared/element-system.mjs';
import {dynamicRange} from './dynamic-range.mjs';
import {tokenBounds} from './validation.mjs';

export class StudioPreview {
  constructor(options) {
    Object.assign(this,options);
    this.viewId='spelling-settings';this.componentId='layout';this.scope='view';this.metricBase=new Map();
    this.editingMode='view';this.compare=false;this.compareViews=[];
    this.picking=false;this.highlight=true;this.showAbsent=false;this.search='';this.zoom='fit';this.wide=false;
    this.inventories=new Map();this.selections=new Map();
    this.workspace.addEventListener('click',event=>this.click(event));
    this.workspace.addEventListener('change',event=>this.change(event));
    this.workspace.addEventListener('input',event=>this.input(event));
    this.workspace.addEventListener('keydown',event=>{if(event.target.dataset.studioNav&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))this.keyboardNav=true;else this.returnNavFocus=null;});
    this.workspace.addEventListener('pointerdown',()=>{this.keyboardNav=false;this.returnNavFocus=null;});
    this.workspace.addEventListener('focusout',()=>this.endEdit?.());
    window.addEventListener('message',event=>this.receive(event));
  }
  get view(){return this.registry.views.find(row=>row.id===this.viewId)||this.registry.views[0];}
  get component(){return this.registry.components.find(row=>row.id===this.componentId)||this.registry.components[0];}
  get config(){return this.getDesign().config;}
  get isOpen(){return Boolean(this.workspace.querySelector('.component-layout'));}
  frames(){return [...this.workspace.querySelectorAll('.device-frame')];}
  notifyState(){this.onState?.({viewId:this.viewId,componentId:this.componentId,scope:this.scope});}
  send(frame,type,data={}){frame?.contentWindow?.postMessage({channel:'mala-nauka-studio',type,...data},location.origin);}
  broadcast(type,data={}){for(const frame of this.frames())this.send(frame,type,data);}
  sendDesign(){this.broadcast('design',this.getDesign());this.updateSavedIndicators();this.renderPills();}
  viewURL(view){const url=new URL(view.route,location.origin);url.search=new URLSearchParams({studio:'1',mode:view.mode,screen:view.screen,state:view.state,viewId:view.id});return url.href;}
  name(component=this.component){return componentName(component,this.config);}
  available(){const inventory=this.inventories.get(this.viewId);return new Set(inventory?.items.some(item=>item.index>=0&&item.visible)?inventory.items.filter(item=>item.visible||item.temporary!=='visible').map(item=>item.component):this.view.components);}
  activeSelection(){return this.selections.get(this.viewId);}
  activeFrame(){return this.frames().find(frame=>frame.dataset.previewView===this.viewId);}

  render(){
    this.workspace.innerHTML='<div class=component-layout><section class=preview-column><div id=preview-toolbar></div><div class=preview-guide id=preview-guide></div><div class=component-strip id=component-strip></div><div id=preview-controls></div><div class=preview-gallery id=preview-gallery></div></section><aside id=inspector class=inspector></aside></div>';
    this.renderToolbar();this.renderInspector();this.syncGallery();this.notifyState();
    this.resizeObserver?.disconnect();
    this.resizeObserver=new ResizeObserver(()=>this.resizePhone());
    this.resizeObserver.observe(this.workspace.querySelector('#preview-gallery'));
    this.resizePhone();
  }
  resizePhone(){
    const gallery=this.workspace.querySelector('#preview-gallery');if(!gallery||this.compare||this.zoom==='100')return;
    const scale=Math.max(.28,Math.min(1,(gallery.clientWidth-24)/414,(gallery.clientHeight-30)/876));
    gallery.style.setProperty('--preview-phone-scale',String(scale));
  }
  renderToolbar(){
    if(!this.isOpen)return;
    const category=componentCategories(this.view);
    const views=this.editingMode==='component'?relatedViews(this.registry,this.componentId):this.registry.views.filter(row=>componentCategories(row)===category&&(category!=='game'||row.mode===this.view.mode));
    const toolbar=this.workspace.querySelector('#preview-toolbar');
    const focused=document.activeElement?.matches('[data-studio-nav]')?{group:document.activeElement.dataset.studioNav,value:document.activeElement.value}:null;
    const previous=new Map([...toolbar.querySelectorAll('[data-jelly-nav]')].map(node=>[node.dataset.jellyNav,node]));
    toolbar.innerHTML=jellyChoices('editing','Sposób pracy',[['view','Według widoku'],['component','Według elementu']],this.editingMode)+`<div class=preview-toolbar>${jellyChoices('category','Kategoria',Object.entries(CATEGORIES),category)}${category==='game'?jellyChoices('mode','Tryb gry',Object.entries(MODE_NAMES),this.view.mode):''}${jellyChoices('view','Ekran i stan',views.filter(row=>componentCategories(row)===category&&(category!=='game'||row.mode===this.view.mode)).map(row=>[row.id,screenLabel(row)]),this.viewId)}</div><div class=element-search><input id=component-search aria-label='Szukaj elementu' placeholder='Szukaj w gałęziach tego ekranu…' value='${html(this.search)}'></div>`;
    mountJellies(toolbar,previous);
    if(focused)[...toolbar.querySelectorAll('[data-studio-nav]')].find(input=>input.dataset.studioNav===focused.group&&input.value===focused.value)?.focus({preventScroll:true});
    this.workspace.querySelector('#preview-guide').textContent='Od kontenera do szczegółu. Wybór odsłania element; ścieżka pozwala wrócić do dowolnego rodzica.';
    this.workspace.querySelector('#preview-controls').innerHTML=`<div class=preview-subbar><div class=preview-switches><label><input type=checkbox id=highlight-selection ${this.highlight?'checked':''}>Pokaż wybrany element</label><label><input type=checkbox id=inspect-mode ${this.picking?'checked':''}>Wybierz kliknięciem</label></div><button class=small-button id=wide-preview>${this.wide?'Pokaż ustawienia':'Więcej miejsca na ekrany'}</button></div><div class=preview-options>${this.editingMode==='component'?`<label><input type=checkbox id=compare-views ${this.compare?'checked':''}>Porównaj widoki obok siebie</label>`:''}<label>Powiększenie<select id=preview-zoom ${this.compare?'disabled':''}><option value=fit ${this.zoom==='fit'?'selected':''}>Dopasuj telefon</option><option value=100 ${this.zoom==='100'?'selected':''}>100% — rzeczywisty rozmiar</option></select></label><button class=quiet-button id=reset-preview>Zresetuj stan podglądu</button><a class=preview-open href='${this.viewURL(this.view)}' target=_blank rel=noopener>Otwórz sam ekran ↗</a></div><div id=compare-choices></div>`;
    this.renderPills();this.renderCompareChoices();
    this.workspace.querySelector('.component-layout').classList.toggle('wide-preview',this.wide);
  }
  renderPills(){
    const strip=this.workspace.querySelector('#component-strip');if(!strip)return;
    const inventory=this.inventories.get(this.viewId),tree=componentTree(inventory?.items),selected=this.activeSelection();
    const id=tree.byId.has(selected?.id)?selected.id:'layout-root',path=tree.path(id),children=(tree.children.get(id)||[]).filter(tree.available);
    const parent=tree.byId.get(id)?.parent,branch=children.length?id:parent||'layout-root';
    const query=this.search.trim().toLocaleLowerCase('pl');
    const rows=query?(inventory?.items||[]).filter(item=>item.id!=='layout-root'&&tree.available(item)&&item.label.toLocaleLowerCase('pl').includes(query)):(children.length?children:(tree.children.get(branch)||[]).filter(tree.available));
    strip.innerHTML=(this.editingMode==='component'?`<div class=family-choices aria-label='Rodziny elementów'>${this.registry.components.map(component=>`<button data-component=${component.id} class='${component.id===this.componentId?'selected':''}'>${html(this.name(component))}</button>`).join('')}</div>`:'')+`<section class=component-navigation aria-label='Hierarchia elementów'><nav class=component-crumbs aria-label='Ścieżka elementu'>${path.map((item,i)=>`${i?'<span aria-hidden=true>›</span>':''}<button data-tree-select='${item.id}' ${item.id===id?'aria-current=location':''}>${html(item.label)}</button>`).join('')||'Wczytywanie hierarchii…'}</nav><div class=branch-heading><strong>${query?'Wyniki w całym ekranie':children.length?'Dzieci · '+html(tree.byId.get(id)?.label||'Ekran'):'Ten sam poziom · '+html(tree.byId.get(branch)?.label||'Ekran')}</strong><span>${rows.length} ${query?'wyników':'elementów'}</span></div><div class=branch-children>${rows.map(item=>{const count=(tree.children.get(item.id)||[]).filter(tree.available).length;return `<button class='branch-node ${item.id===id?'selected':''}' data-tree-select='${item.id}' aria-label='Wybierz: ${html(item.label)}'><span class=branch-symbol aria-hidden=true>${item.kind==='background'?'▧':count?'▦':'·'}</span><span><b>${html(item.label)}</b><small>${query?html(tree.path(item.id).slice(0,-1).map(row=>row.label).join(' › ')):html(ELEMENT_FAMILIES[item.recipe]||ELEMENT_KINDS[item.kind]||'Element')}${!item.visible?' · odsłoń w podglądzie':''}</small></span>${count?`<span class=branch-arrow>${count} ›</span>`:''}</button>`;}).join('')||'<p class=branch-empty>Brak dalszych elementów. Wróć ścieżką do rodzica.</p>'}</div></section>`;
  }
  renderCompareChoices(){
    const node=this.workspace.querySelector('#compare-choices');if(!node)return;
    node.innerHTML=this.compare?`<div class=compare-choices><div class=compare-heading><strong>Widoki do porównania</strong><button class=small-button id=compare-similar>Ustawienia gier</button></div><p>Każdy ekran ma 390 × 844. Gdy brakuje miejsca, kolejny przechodzi do następnego rzędu.</p><div class=compare-checkboxes>${relatedViews(this.registry,this.componentId).map(view=>`<label><input type=checkbox data-compare-view=${view.id} ${this.compareViews.includes(view.id)?'checked':''}>${html(view.name)}</label>`).join('')}</div></div>`:'';
  }
  tile(view){
    const tile=document.createElement('article');tile.className='preview-tile';tile.dataset.tileView=view.id;
    tile.innerHTML=`<button class=preview-tile-heading data-active-view=${view.id}>${html(view.name)}<span>Edytuj ten ekran</span></button><div class=phone-zone><div class=phone-outer><div class=phone-inner><iframe class=device-frame data-preview-view=${view.id} ${view.id===this.viewId?'id=device-frame':''} title='Podgląd: ${html(view.name)}' src='${this.viewURL(view)}' loading=lazy></iframe><div class=phone-notch></div><div class=phone-status><span>9:41</span><span class=phone-signals>▮▮▮ ◔ ▰</span></div><div class=phone-homebar></div></div><span class=phone-note>390 × 844 · iPhone 13 Pro</span></div></div>`;
    tile.querySelector('iframe').addEventListener('load',()=>this.prepare(tile.querySelector('iframe')));
    return tile;
  }
  syncGallery(){
    const gallery=this.workspace.querySelector('#preview-gallery');if(!gallery)return;
    this.compareViews=compareSelection(this.registry,this.componentId,this.compareViews,this.viewId);
    const ids=this.compare&&this.editingMode==='component'?this.compareViews:[this.viewId];
    for(const tile of gallery.querySelectorAll('.preview-tile'))if(!ids.includes(tile.dataset.tileView))tile.remove();
    for(const id of ids)if(!gallery.querySelector(`[data-tile-view='${id}']`))gallery.append(this.tile(this.registry.views.find(view=>view.id===id)));
    gallery.classList.toggle('comparison',this.compare);gallery.classList.toggle('native-size',this.compare||this.zoom==='100');
    this.updateActiveFrame();this.renderCompareChoices();
    this.resizePhone();
  }
  updateActiveFrame(){
    for(const tile of this.workspace.querySelectorAll('.preview-tile'))tile.classList.toggle('active',tile.dataset.tileView===this.viewId);
    for(const frame of this.frames())frame.id=frame.dataset.previewView===this.viewId?'device-frame':'preview-'+frame.dataset.previewView;
  }
  prepare(frame){
    this.send(frame,'design',this.getDesign());this.send(frame,'inspect',{enabled:this.picking,highlight:this.highlight});
    this.send(frame,'focus',this.editingMode==='view'&&!this.pendingSelector?{id:this.selections.get(frame.dataset.previewView)?.id||'layout-root',reveal:false}:{component:this.componentId,selector:this.pendingSelector,reveal:true});this.pendingSelector='';
  }
  focus(reveal=true){
    for(const frame of this.frames())this.send(frame,'focus',{component:this.componentId,reveal:reveal&&frame===this.activeFrame()});
  }
  openView(id){
    if(!this.registry.views.some(view=>view.id===id))return;
    this.search='';this.viewId=id;
    if(this.editingMode==='view'&&!this.view.components.includes(this.componentId))this.componentId=this.view.components[0];
    if(this.compare&&!this.compareViews.includes(id))this.compareViews.push(id);
    this.notifyState();
    if(this.isOpen){this.renderToolbar();this.renderInspector();this.syncGallery();this.send(this.activeFrame(),'focus',{id:'layout-root',reveal:true});}
  }
  chooseComponent(id){
    if(!this.registry.components.some(component=>component.id===id))return;
    this.componentId=id;
    if(this.editingMode==='component'&&!this.view.components.includes(id))this.viewId=relatedViews(this.registry,id)[0]?.id||this.viewId;
    this.compareViews=compareSelection(this.registry,id,this.compareViews,this.viewId);
    this.notifyState();this.renderToolbar();this.renderInspector();this.syncGallery();this.focus();
  }
  control(group,key){
    const [min,soft,step,unit]=rangeFor(group,key),value=effectiveValue(this.config,this.viewId,group,key,this.scope),saved=effectiveValue(this.getBase(),this.viewId,group,key,this.scope),[,hard]=tokenBounds(group,key),[,max]=dynamicRange(value,saved,min,soft,hard);
    return `<div class='control ${value!==saved?'changed':''}' data-control='${group}.${key}'><div class=control-top><label for=range-${group}-${key}>${FIELD_LABELS[key]||key}</label><span class=control-value><input aria-label='${FIELD_LABELS[key]||key}' type=number data-token='${group}.${key}' value=${value} min=${min} max=${max} step=${step}><span>${unit}</span></span></div><div class=range-wrap><input id=range-${group}-${key} aria-label='${FIELD_LABELS[key]||key}' type=range data-token='${group}.${key}' min=${min} max=${max} step=${step} value=${value}><span class=saved-mark style='--saved-position:${savedMarker(saved,min,max)/100}' title='Ostatnio zapisano: ${number(saved)} ${unit}'></span></div><div class=saved-value><span>Ostatnio zapisano: <strong>${number(saved)} ${unit}</strong></span><button data-reset-field='${group}.${key}' aria-label='Przywróć: ${FIELD_LABELS[key]||key}' ${value===saved?'disabled':''}>Przywróć</button></div></div>`;
  }
  renderInspector(){
    const inspector=this.workspace.querySelector('#inspector');if(!inspector)return;
    const component=this.component,used=relatedViews(this.registry,component.id),group=component.tokenGroup;
    inspector.innerHTML=`<div class=inspector-title><div><span class=inspector-kicker>Wybrany element</span><h2>${html(this.name())}</h2></div><button id=rename-component class=icon-button title='Zmień nazwę elementu' aria-label='Zmień nazwę elementu'>✎</button></div><p class=description>${html(component.description)}</p><div id=selected-element></div><label class=scope><span>Gdzie zastosować zmianę?</span><select id=scope-select><option value=global ${this.scope==='global'?'selected':''}>W każdym widoku z tym elementem</option><option value=view ${this.scope==='view'?'selected':''}>Tylko: ${html(this.view.name)}</option></select></label><p class=scope-help>${this.scope==='view'?'To będzie wyjątek dla tego ekranu. Pozostałe widoki zachowają wspólną wartość.':`Zmiana wspólna. Sprawdź ${used.length} powiązanych widoków poniżej.`}</p><div id=visual-editor></div><div class=inspector-controls>${group?`<details class=shared-recipe><summary>Przepis wspólny · ${html(this.name())}</summary><p>Wymiary rodziny elementów. Lokalne wyjątki mają pierwszeństwo.</p>${Object.keys(this.config.tokens[group]).filter(key=>typeof this.config.tokens[group][key]==='number').map(key=>this.control(group,key)).join('')}</details>`:''}</div>${group?'<button class=small-button id=reset-component>Przywróć zapisany przepis rodziny</button>':''}<details class=component-conditions><summary>Kiedy i jak działa?</summary><p>${(component.states||[]).map(state=>STATE_NAMES[state]||state).join(' · ')}</p><ul>${(component.conditions||[]).map(value=>`<li>${html(value)}</li>`).join('')}</ul></details><div id=preview-layers></div><div class=related-views><strong>Występuje w ${used.length} widokach</strong><button class=small-button id=start-compare>Porównaj użycia</button><details><summary>Pokaż listę powiązanych ekranów</summary><div class=affected-links>${used.map(view=>`<button class=small-button data-open-view=${view.id}>${html(view.name)}</button>`).join('')}</div></details></div>`;
    this.renderSelectionPanel();this.renderLayers();this.renderVisual();
  }
  renderSelectionPanel(){
    const node=this.workspace.querySelector('#selected-element');if(!node)return;
    const selected=this.activeSelection();
    node.innerHTML=selected?`<section class=selected-element><h3>${html(selected.label)}</h3><p class=element-measure>${number(selected.metrics.width)} × ${number(selected.metrics.height)} px</p>${selected.parents?.length?'<button class=small-button id=select-parent>‹ Kontener wyżej</button>':''}<p class=selection-status data-status='${selected.visible===false?'missing':'visible'}'>${selected.visible===false?'Element jest ukryty w tym stanie. Wybierz go ponownie, aby odsłonić.':'Wybrany element w podglądzie'}</p>${selected.actions?.length?`<details class=live-states><summary>Stan tego elementu</summary><p>Zmienia tylko przykład w podglądzie.</p><div>${selected.actions.map(action=>`<button class='state-pill ${action.selected?'active':''}' data-preview-action='${action.id}' data-action-label='${html(action.label)}'>${html(action.label)}</button>`).join('')}</div></details>`:''}</section>`:'<p class=empty-hint>Wybierz kontener, a potem schodź po jego gałęziach.</p>';
  }
  renderLayers(){
    const node=this.workspace.querySelector('#preview-layers');if(!node)return;
    const selected=this.activeSelection(),inventory=this.inventories.get(this.viewId),items=inventory?.items||[];
    const hidden=items.filter(item=>item.temporary!=='visible'),oldOpen=node.querySelector('details')?.open;
    node.innerHTML=`<details class=preview-layers ${oldOpen?'open':''}><summary>Warstwy i widoczność ${hidden.length?'· ukryte: '+hidden.length:''}</summary><p>Zmiany są chwilowe, tylko w tym podglądzie. Nie trafią do zapisu na GitHub.</p>${selected?`<label>Wybrany element<select id=selected-visibility aria-label='Widoczność wybranego elementu'>${this.visibilityOptions(items.find(item=>item.id===selected.id)?.temporary)}</select></label><label><input id=hide-whole-family type=checkbox>Wszystkie elementy tej rodziny w ekranie</label>`:''}<div class=layer-list>${items.filter(item=>item.visible||item.temporary!=='visible').map(item=>{const component=this.registry.components.find(row=>row.id===item.component);return `<div><button class=layer-name style='padding-left:${Math.min(40,(item.depth||0)*8)}px' data-layer-select='${item.id}' title='Pokaż na ekranie'>${html(item.index===-1?'Cały ekran':this.name(component))}<small>${html(item.label)}</small></button><select data-layer-visibility='${item.id}' aria-label='Widoczność: ${html(item.label||this.name(component))}'>${this.visibilityOptions(item.temporary)}</select></div>`;}).join('')}</div><button class=small-button id=restore-layers ${hidden.length?'':'disabled'}>Pokaż wszystkie warstwy</button></details>`;
  }
  visibilityOptions(mode='visible'){return [['visible','Widoczny'],['hidden','Ukryj — zachowaj miejsce'],['removed','Ukryj — przesuń pozostałe']].map(([id,label])=>`<option value=${id} ${mode===id?'selected':''}>${label}</option>`).join('');}
  savedVisual(key){const item=this.activeSelection();if(!item)return 0;return visualValue(this.getBase(),this.viewId,item)[key]??this.metricBase.get(this.viewId+':'+item.id)?.[key]??0;}
  writeVisual(key,value){const item=this.activeSelection();if(!item)return;this.edit(this.scope==='global'?`elementStyles.${item.recipe||item.kind||'container'}.${key}`:`elementOverrides.${this.viewId}.${item.id}.${key}`,value===''?undefined:value);}
  renderVisual(){
    const node=this.workspace.querySelector('#visual-editor'),item=this.activeSelection();if(!node||!item||document.activeElement?.closest('#visual-editor'))return;
    const baseKey=this.viewId+':'+item.id;if(!this.metricBase.has(baseKey))this.metricBase.set(baseKey,{...item.metrics});
    const global={...this.config.elementStyles?.[item.kind],...this.config.elementStyles?.[item.recipe]},local=this.config.elementOverrides?.[this.viewId]?.[item.id]||{},style=visualValue(this.config,this.viewId,item);
    const hex=value=>{if(/^#/.test(value||''))return value.slice(0,7);const rgb=(value||'').match(/\d+/g);return rgb&&rgb.length>=3?'#'+rgb.slice(0,3).map(v=>Number(v).toString(16).padStart(2,'0')).join(''):'#ffffff';};
    const keys=item.kind==='text'?['fontSize','width','padding']:item.kind==='icon'?['width','height','padding']:['width','height','padding','gap','radius',...(['button','timer','key','toggle'].includes(item.kind)?['fontSize']:[])];
    node.innerHTML=`<section class=visual-properties><h3>Wygląd tego elementu</h3><p class=scope-help>${this.scope==='view'?'Zmiana tylko tutaj.':'Wspólny przepis: '+html(ELEMENT_FAMILIES[item.recipe]||item.label||ELEMENT_KINDS[item.kind]||'Kontener')}. <span class=source-badge>${Object.keys(local).length?'Ma wyjątki lokalne':item.nativeVariant?'Wariant lokalny · '+html(item.nativeVariant):'Dziedziczy wspólny wygląd'}</span></p>${keys.map(key=>{const [min,hard,label]=VISUAL_FIELDS[key],saved=Math.min(hard,Math.max(min,this.savedVisual(key))),value=Math.min(hard,Math.max(min,style[key]??this.metricBase.get(baseKey)[key]??0)),[a,b]=dynamicRange(value,saved,min,key==='width'?390:key==='height'?200:key==='fontSize'?48:hard,hard);return `<div class=control><div class=control-top><label>${label}</label><span class=control-value><input type=number aria-label='Element · ${label}' data-visual-number=${key} min=${min} max=${hard} value=${value.toFixed(1)} step=.5></span></div><div class=range-wrap><input type=range aria-label='Element · ${label}' data-visual-number=${key} min=${a} max=${b} step=.5 value=${value}><span class=saved-mark style='--saved-position:${savedMarker(saved,a,b)/100}'></span></div><div class=saved-value><span>Zapisane: ${number(saved)} · <b>${Object.hasOwn(local,key)?'Lokalne':Object.hasOwn(global,key)?'Globalne':item.nativeVariant?'Wariant trybu · '+html(item.nativeVariant):'Styl komponentu'}</b></span><button data-visual-reset=${key}>Dziedzicz</button></div></div>`;}).join('')}${item.editableText&&this.scope==='view'?`<label class='form-field local-copy'><span>Tekst tylko w tym miejscu</span><textarea data-visual-field=text maxlength=600 aria-label='Tekst elementu'>${html(style.text??item.editableText)}</textarea><button data-visual-reset=text>Przywróć tekst</button></label>`:''}<div class=visual-colors>${[['textColor','Kolor tekstu / ikony'],['background','Kolor tła']].map(([key,label])=>`<label>${label}<input type=color aria-label='${label}' data-visual-field=${key} value='${hex(style[key]||item.metrics[key])}'><small>${Object.hasOwn(local,key)?'Lokalne':'Dziedziczone'}</small></label>`).join('')}</div>${item.kind==='icon'?`<label class=form-field><span>Ikona</span><select data-visual-field=icon aria-label='Zamień ikonę'><option value=''>Obecna</option>${Object.entries(ICONS).map(([id,name])=>`<option value=${id} ${style.icon===id?'selected':''}>${name}</option>`).join('')}</select></label>`:''}${['image','background'].includes(item.kind)?`<label class=form-field><span>Dopasowanie grafiki</span><select data-visual-field=fit aria-label='Dopasowanie grafiki'><option value=cover ${style.fit!=='contain'?'selected':''}>Wypełnij</option><option value=contain ${style.fit==='contain'?'selected':''}>Pokaż całą</option></select></label><label class=form-field><span>Grafika z bazy</span><select data-visual-field=asset aria-label='Grafika elementu'><option value=''>Obecna grafika</option>${(this.getDesign().assets?.assets||[]).filter(a=>/\.(webp|png|jpg|svg)$/.test(a.path)).map(a=>`<option value='${html(a.path)}' ${style.asset===a.path?'selected':''}>${html(a.path.replace('assets/',''))}</option>`).join('')}</select></label>${['imageScale','imageX','imageY','opacity'].map(key=>{const [min,max,label]=VISUAL_FIELDS[key];return `<label class=form-field><span>${label}</span><input type=number aria-label='${label}' data-visual-number=${key} min=${min} max=${max} step=.05 value=${style[key]??({imageScale:1,imageX:50,imageY:50,opacity:1})[key]}></label>`;}).join('')}`:''}<details><summary>Wspólny wygląd i zamiana</summary><p>Zamiana przejmuje przepis wizualny. Funkcja przycisku i jego połączenia zostają.</p><select data-visual-field=replacement aria-label='Zastąp przepis elementu'><option value=''>Oryginalny przepis</option>${[...Object.keys(ELEMENT_FAMILIES),'container','text','icon','image'].map(kind=>`<option value=${kind} ${local.replacement===kind?'selected':''}>${html(ELEMENT_FAMILIES[kind]||ELEMENT_KINDS[kind]||kind)}</option>`).join('')}</select><button class=small-button id=visual-reset-local>Scal ze wspólnym · usuń wyjątki</button></details><button class=small-button id=send-to-builder>Otwórz kopię w builderze</button></section>`;
  }
  updateSavedIndicators(){
    for(const row of this.workspace.querySelectorAll('[data-control]')){
      const [group,key]=row.dataset.control.split('.'),value=effectiveValue(this.config,this.viewId,group,key,this.scope),saved=effectiveValue(this.getBase(),this.viewId,group,key,this.scope),[min,soft,,unit]=rangeFor(group,key),[,hard]=tokenBounds(group,key),[,max]=dynamicRange(value,saved,min,soft,hard);for(const input of row.querySelectorAll('input[type=range]')){input.min=min;input.max=max;}
      row.classList.toggle('changed',value!==saved);
      for(const input of row.querySelectorAll('[data-token]'))if(document.activeElement!==input)input.value=value;
      row.querySelector('.saved-mark').style.setProperty('--saved-position',String(savedMarker(saved,min,max)/100));
      row.querySelector('.saved-value strong').textContent=number(saved)+' '+unit;
      row.querySelector('[data-reset-field]').disabled=value===saved;
    }
  }
  receive(event){
    if(event.origin!==location.origin||event.data?.channel!=='mala-nauka-studio')return;
    const frame=this.frames().find(frame=>frame.contentWindow===event.source);if(!frame)return;
    const message=event.data;let id=frame.dataset.previewView;
    if(message.type==='inventory'&&message.rendered&&message.viewId&&message.viewId!==id&&this.registry.views.some(v=>v.id===message.viewId)){
      const old=id,next=message.viewId,tile=frame.closest('.preview-tile'),view=this.registry.views.find(v=>v.id===next);
      this.inventories.delete(old);this.selections.delete(old);frame.dataset.previewView=next;frame.title='Podgląd: '+view.name;tile.dataset.tileView=next;const heading=tile.querySelector('.preview-tile-heading');heading.dataset.activeView=next;heading.innerHTML=html(view.name)+'<span>Edytuj ten ekran</span>';
      this.compareViews=this.compareViews.map(v=>v===old?next:v);if(this.viewId===old){this.viewId=next;this.renderToolbar();this.renderInspector();this.notifyState();}id=next;this.updateActiveFrame();
    }
    if(message.type==='preview-interaction')this.returnNavFocus=null;
    if(message.type==='preview-focus'&&this.returnNavFocus){const pending=this.returnNavFocus;requestAnimationFrame(()=>[...this.workspace.querySelectorAll('[data-studio-nav]')].find(input=>input.dataset.studioNav===pending.group&&input.value===pending.value)?.focus({preventScroll:true}));}
    if(message.type==='ready'){this.prepare(frame);return;}
    if(message.type==='inventory'){
      this.inventories.set(id,{items:message.items||[]});
      if(message.selection)this.selections.set(id,message.selection);else this.selections.delete(id);
      if(id===this.viewId){
        const available=this.available();
        if(!available.has(this.componentId)){this.componentId=message.items.find(item=>item.visible&&item.index>=0)?.component||'layout';this.renderInspector();this.notifyState();}
        if(!message.selection && available.has(this.componentId))this.send(frame,'focus',{component:this.componentId,reveal:false});
        this.renderPills();this.renderSelectionPanel();this.renderLayers();this.renderVisual();
        if(message.rendered&&this.returnNavFocus){const pending=this.returnNavFocus;requestAnimationFrame(()=>[...this.workspace.querySelectorAll('[data-studio-nav]')].find(input=>input.dataset.studioNav===pending.group&&input.value===pending.value)?.focus({preventScroll:true}));}
      }
    }
    if(message.type==='select'||message.type==='focused'&&message.explicit){
      this.viewId=id;this.componentId=message.component;this.selections.set(id,message);
      this.notifyState();this.updateActiveFrame();this.renderToolbar();this.renderInspector();
    }
    if(message.type==='blueprint')this.toBuilder?.(message.value);
    if(message.type==='missing'){this.selections.delete(id);this.renderInspector();this.notice(message.message||'Ten element nie występuje w bieżącym stanie. Wybierz go w hierarchii właściwego ekranu.');}
    if(message.type==='notice')this.notice(message.message);
  }
  click(event){
    if(!event.target.closest('.component-layout'))return;
    const button=event.target.closest('button');if(!button)return;
    event.stopImmediatePropagation();
    if(button.dataset.editingMode){this.editingMode=button.dataset.editingMode;this.compare=false;if(this.editingMode==='view'&&!this.available().has(this.componentId))this.componentId=this.view.components[0];this.renderToolbar();this.renderInspector();this.syncGallery();this.focus(false);}
    if(button.dataset.treeSelect){this.search='';this.send(this.activeFrame(),'focus',{id:button.dataset.treeSelect,reveal:true});}
    if(button.dataset.component)this.chooseComponent(button.dataset.component);
    if(button.dataset.openView)this.openView(button.dataset.openView);
    if(button.dataset.activeView)this.openView(button.dataset.activeView);
    if(button.dataset.visualReset){this.writeVisual(button.dataset.visualReset,undefined);this.renderVisual();}
    if(button.id==='visual-reset-local'){const selected=this.activeSelection();if(selected){for(const key of Object.keys(this.config.elementOverrides?.[this.viewId]?.[selected.id]||{}))this.edit(`elementOverrides.${this.viewId}.${selected.id}.${key}`,undefined);this.renderVisual();}}
    if(button.id==='send-to-builder'){this.send(this.activeFrame(),'blueprint',{id:this.activeSelection()?.id});}
    if(button.id==='rename-component')this.rename(this.component);
    if(button.id==='reset-component'&&this.component.tokenGroup){this.reset(this.component.tokenGroup,null,this.scope,this.viewId);this.updateSavedIndicators();}
    if(button.dataset.resetField){const [group,key]=button.dataset.resetField.split('.');this.reset(group,key,this.scope,this.viewId);this.updateSavedIndicators();}
    if(button.id==='wide-preview'){this.wide=!this.wide;this.renderToolbar();}
    if(button.dataset.layerSelect)this.send(this.activeFrame(),'focus',{id:button.dataset.layerSelect,reveal:true});
    if(button.id==='restore-layers')this.send(this.activeFrame(),'reset-visibility');
    if(button.id==='select-parent'){const id=this.activeSelection()?.parents?.[0];if(id)this.send(this.activeFrame(),'focus',{id,reveal:true});}
    if(button.dataset.previewAction)this.send(this.activeFrame(),'action',{id:button.dataset.previewAction,label:button.dataset.actionLabel});
    if(button.id==='reset-preview'){this.broadcast('reset-preview');for(const frame of this.frames())frame.src=frame.src;this.notice('Przywrócono początkowy stan przykładu. Zmiany wyglądu zostają w szkicu.');}
    if(button.id==='start-compare'){this.editingMode='component';this.compare=true;this.compareViews=relatedViews(this.registry,this.componentId).slice(0,2).map(view=>view.id);if(!this.compareViews.includes(this.viewId))this.viewId=this.compareViews[0];this.renderToolbar();this.renderInspector();this.syncGallery();this.focus(false);this.notifyState();}
    if(button.id==='compare-similar'){const views=relatedViews(this.registry,this.componentId).filter(view=>view.screen==='wizard');if(!views.length){this.notice('Ten element nie występuje w ustawieniach gier. Zaznacz odpowiednie ekrany poniżej.');return;}this.compareViews=views.map(view=>view.id);this.viewId=this.compareViews[0];this.syncGallery();this.renderToolbar();this.renderInspector();this.notifyState();}
  }
  change(event){
    const target=event.target;if(!target.closest('.component-layout'))return;
    event.stopImmediatePropagation();
    if(target.dataset.studioNav){const kind=target.dataset.studioNav;if(this.keyboardNav){this.returnNavFocus={group:kind,value:target.value};this.keyboardNav=false;}if(kind==='editing'){this.editingMode=target.value;this.compare=false;this.renderToolbar();this.renderPills();this.syncGallery();}if(kind==='category'){this.scope='view';this.openView(this.registry.views.find(v=>componentCategories(v)===target.value)?.id);}if(kind==='mode')this.openView(target.value+'-settings');if(kind==='view')this.openView(target.value);if(event.isTrusted){const value=target.value;requestAnimationFrame(()=>[...this.workspace.querySelectorAll('[data-studio-nav]')].find(input=>input.dataset.studioNav===kind&&input.value===value)?.focus({preventScroll:true}));}return;}
    if(target.id==='category-select'){this.scope='view';this.openView(this.registry.views.find(v=>componentCategories(v)===target.value)?.id);}
    if(target.id==='mode-select'){this.openView(target.value+'-settings');}
    if(target.id==='view-select')this.openView(target.value);
    if(target.id==='scope-select'){this.scope=target.value;this.notifyState();this.renderInspector();}
    if(target.id==='inspect-mode'||target.id==='highlight-selection'){this.picking=this.workspace.querySelector('#inspect-mode').checked;this.highlight=this.workspace.querySelector('#highlight-selection').checked;this.broadcast('inspect',{enabled:this.picking,highlight:this.highlight});this.focus(false);}
    if(target.id==='show-absent'){this.showAbsent=target.checked;this.renderPills();}
    if(target.id==='preview-zoom'){this.zoom=target.value;this.syncGallery();}
    if(target.id==='compare-views'){this.compare=target.checked;this.compareViews=relatedViews(this.registry,this.componentId).slice(0,2).map(view=>view.id);if(this.compare&&!this.compareViews.includes(this.viewId))this.compareViews.unshift(this.viewId);this.renderToolbar();this.syncGallery();}
    if(target.dataset.compareView){const id=target.dataset.compareView;if(!target.checked&&this.compareViews.length===1){target.checked=true;this.notice('Pozostaw co najmniej jeden ekran do porównania.');return;}this.compareViews=target.checked?[...this.compareViews,id]:this.compareViews.filter(view=>view!==id);if(this.compareViews.length&&!this.compareViews.includes(this.viewId))this.viewId=this.compareViews[0];this.notifyState();this.syncGallery();this.renderToolbar();this.renderInspector();}
    if(target.id==='selected-visibility'){const selected=this.activeSelection();if(selected)this.send(this.activeFrame(),'visibility',this.workspace.querySelector('#hide-whole-family').checked?{component:selected.component,mode:target.value}:{id:selected.id,mode:target.value});}
    if(target.dataset.layerVisibility)this.send(this.activeFrame(),'visibility',{id:target.dataset.layerVisibility,mode:target.value});
    if(target.dataset.visualField){this.writeVisual(target.dataset.visualField,target.value);}
    if(target.id==='selected-instance')this.send(this.activeFrame(),'focus',{id:target.value,reveal:true});
  }
  input(event){
    const target=event.target;if(!target.closest('.component-layout'))return;
    event.stopImmediatePropagation();
    if(target.id==='component-search'){this.search=target.value;this.renderPills();return;}
    if(target.dataset.visualNumber){const key=target.dataset.visualNumber,[min,max]=VISUAL_FIELDS[key],value=Number(target.value);if(Number.isFinite(value)&&value>=min&&value<=max){this.writeVisual(key,value);const [a,b]=dynamicRange(value,this.savedVisual(key),min,key==='width'?390:key==='height'?200:key==='fontSize'?48:max,max);for(const input of this.workspace.querySelectorAll(`[data-visual-number="${key}"]`)){if(input.type==='range'){input.min=a;input.max=b;}if(input!==target)input.value=value;}}else this.notice(`Bezpieczny zakres: ${min}–${max}.`);return;}
    if(!target.dataset.token)return;
    const [group,key]=target.dataset.token.split('.'),[min,max]=tokenBounds(group,key),value=Number(target.value);
    if(!Number.isFinite(value)||value<min||value>max)return;
    const path=this.scope==='view'?`overrides.${this.viewId}.${group}.${key}`:`tokens.${group}.${key}`;
    this.edit(path,value);this.updateSavedIndicators();
  }
}
