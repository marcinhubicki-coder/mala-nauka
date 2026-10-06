import {componentTree,screenLabel} from './component-tree.mjs';
import {mountJellies} from './studio-jelly.mjs';
import {html,number,componentName,effectiveValue,savedMarker,rangeFor,FIELD_LABELS,MODE_NAMES,STATE_NAMES,relatedViews,compareSelection} from './preview-model.mjs';
import {CATEGORIES,componentCategories,VISUAL_FIELDS,ICONS,iconSVG,ELEMENT_FAMILIES,ELEMENT_KINDS,visualValue} from '../shared/element-system.mjs';
import {dynamicRange} from './dynamic-range.mjs';
import {tokenBounds} from './validation.mjs';

export class StudioPreview {
  constructor(options) {
    Object.assign(this,options);
    this.viewId='spelling-settings';this.componentId='layout';this.scope='view';this.metricBase=new Map();
    this.editingMode='view';this.compare=false;this.compareViews=[];
    this.picking=false;this.highlight=true;this.showAbsent=false;this.search='';this.zoom='fit';this.wide=false;this.branches=new Map();
    this.inventories=new Map();this.selections=new Map();
    this.workspace.addEventListener('click',event=>this.click(event));
    this.workspace.addEventListener('change',event=>this.change(event));
    this.workspace.addEventListener('input',event=>this.input(event));
    this.workspace.addEventListener('dragstart',event=>{const row=event.target.closest('[data-layer-drag]');if(row){this.draggedLayer=row.dataset.layerDrag;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',this.draggedLayer);}});
    this.workspace.addEventListener('dragover',event=>{if(this.draggedLayer&&event.target.closest('[data-layer-drag]'))event.preventDefault();});
    this.workspace.addEventListener('drop',event=>{const row=event.target.closest('[data-layer-drag]');if(row&&this.draggedLayer&&row.dataset.layerDrag!==this.draggedLayer){event.preventDefault();this.send(this.activeFrame(),'reorder',{id:this.draggedLayer,before:row.dataset.layerDrag});this.draggedLayer='';}});
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
    this.workspace.innerHTML='<div class=component-layout><section class=preview-column><div id=preview-toolbar></div><div class=component-strip id=component-strip></div><div id=preview-controls></div><div class=preview-gallery id=preview-gallery></div></section><button class="inspector-edge tooltip" id=wide-preview aria-label="Schowaj panel ustawień" title="Schowaj panel ustawień" data-tooltip="Schowaj panel ustawień">‹</button><aside id=inspector class=inspector></aside></div>';
    this.renderToolbar();this.renderInspector();this.syncGallery();this.notifyState();
    this.resizeObserver?.disconnect();
    this.resizeObserver=new ResizeObserver(()=>this.resizePhone());
    this.resizeObserver.observe(this.workspace.querySelector('#preview-gallery'));
    this.resizePhone();
  }
  resizePhone(){
    const gallery=this.workspace.querySelector('#preview-gallery');if(!gallery||this.zoom==='100')return;
    const heightScale=(gallery.clientHeight-(this.compare?56:24))/876;
    const scale=Math.max(.24,Math.min(1,heightScale,this.compare?1:(gallery.clientWidth-24)/414));
    gallery.style.setProperty('--preview-phone-scale',String(scale));
    gallery.style.setProperty('--mobile-preview-scale',String(scale));
  }
  iconChoices(name,label,choices,value){return `<fieldset class="studio-choice-field icon-jelly choice-${name}"><legend class=studio-choice-caption>${html(label)}</legend><div class=studio-choice-scroll><div class=studio-jelly data-jelly-nav=${name} role=radiogroup aria-label='${html(label)}'><i class=studio-jelly-ink aria-hidden=true></i>${choices.map(([id,text,icon])=>`<label class=tooltip data-tooltip='${html(text)}' title='${html(text)}'><input type=radio data-studio-nav=${name} name=studio-${name} value='${id}' ${id===value?'checked':''}><span>${iconSVG(icon||'screen')}<b>${html(text)}</b></span></label>`).join('')}</div></div></fieldset>`;}
  stateIcon(view){const value=(view.state||view.screen||view.id).toLowerCase();if(/setting|wizard/.test(value))return'gear';if(/correct|success/.test(value))return'smile';if(/wrong|error|incorrect/.test(value))return'sad';if(/initial|idle|prompt|before/.test(value))return'neutral';if(/finish|result|end|summary/.test(value))return'square';if(/rule/.test(value))return'question';if(/hint|help/.test(value))return'bubble';if(/pause/.test(value))return'pause';if(/home/.test(value))return'star';if(/player|login|pin/.test(value))return'heart';return'screen';}
  previewTools(){return `<fieldset class=studio-tools><legend class=studio-choice-caption>Narzędzia</legend><div class=preview-actions-shell role=group aria-label='Narzędzia podglądu'><label class='preview-action tooltip ${this.highlight?'active':''}' data-tooltip='Pokaż obrys wybranego elementu' title='Pokaż obrys wybranego elementu'><input type=checkbox id=highlight-selection ${this.highlight?'checked':''}><span>${iconSVG('focus')}</span></label><label class='preview-action tooltip ${this.picking?'active':''}' data-tooltip='Zaznaczaj na podglądzie' title='Zaznaczaj na podglądzie'><input type=checkbox id=inspect-mode ${this.picking?'checked':''}><span>${iconSVG('select')}</span></label><button class='preview-action tooltip ${this.zoom==='100'?'active':''}' id=toggle-zoom aria-pressed='${this.zoom==='100'}' aria-label='${this.zoom==='fit'?'Pokaż w skali 100%':'Dopasuj ekran'}' title='${this.zoom==='fit'?'Pokaż w skali 100%':'Dopasuj ekran'}' data-tooltip='${this.zoom==='fit'?'Pokaż w skali 100%':'Dopasuj ekran'}'>${iconSVG('zoom')}</button><button class='preview-action tooltip' id=reset-preview aria-label='Resetuj stan podglądu' title='Resetuj stan podglądu' data-tooltip='Resetuj stan podglądu'>${iconSVG('reset')}</button><a class='preview-action tooltip' href='${this.viewURL(this.view)}' target=_blank rel=noopener data-tooltip='Otwórz sam ekran' title='Otwórz sam ekran' aria-label='Otwórz sam ekran'>${iconSVG('fullscreen')}</a><label class='preview-action tooltip ${this.compare?'active':''}' data-tooltip='Porównaj widoki obok siebie' title='Porównaj widoki obok siebie'><input type=checkbox id=compare-views ${this.compare?'checked':''}><span>${iconSVG('compare')}</span></label></div></fieldset>`;}
  renderToolbar(){
    if(!this.isOpen)return;
    const category=componentCategories(this.view);
    const views=this.editingMode==='component'?relatedViews(this.registry,this.componentId):this.registry.views.filter(row=>componentCategories(row)===category&&(category!=='game'||row.mode===this.view.mode));
    const toolbar=this.workspace.querySelector('#preview-toolbar');
    const focused=document.activeElement?.matches('[data-studio-nav]')?{group:document.activeElement.dataset.studioNav,value:document.activeElement.value}:null;
    const previous=new Map([...toolbar.querySelectorAll('[data-jelly-nav]')].map(node=>[node.dataset.jellyNav,node]));
    const categoryIcons={login:'heart',home:'star',results:'target',game:'screen'},modeIcons={spelling:'check',english:'bubble',flags:'star',reading:'screen',math:'target'};
    toolbar.innerHTML=`<div class=toolbar-primary>${this.iconChoices('editing','Sposób pracy',[['view','Według widoku','screen'],['component','Według elementu','layers']],this.editingMode)}<label class=element-search><span>Szukaj</span><span class=search-box>${iconSVG('search')}<input id=component-search aria-label='Szukaj elementu' placeholder='Nazwa elementu…' value='${html(this.search)}'></span></label>${this.previewTools()}</div><div class=preview-toolbar>${this.iconChoices('category','Kategoria',Object.entries(CATEGORIES).map(([id,text])=>[id,text,categoryIcons[id]]),category)}${category==='game'?this.iconChoices('mode','Tryb gry',Object.entries(MODE_NAMES).map(([id,text])=>[id,text,modeIcons[id]||'screen']),this.view.mode):''}${this.iconChoices('view','Ekran i stan',views.filter(row=>componentCategories(row)===category&&(category!=='game'||row.mode===this.view.mode)).map(row=>[row.id,screenLabel(row),this.stateIcon(row)]),this.viewId)}</div>`;
    mountJellies(toolbar,previous);
    if(focused)[...toolbar.querySelectorAll('[data-studio-nav]')].find(input=>input.dataset.studioNav===focused.group&&input.value===focused.value)?.focus({preventScroll:true});
    this.workspace.querySelector('#preview-controls').innerHTML='<div id=compare-choices></div>';
    this.renderPills();this.renderCompareChoices();
    this.workspace.querySelector('.component-layout').classList.toggle('wide-preview',this.wide);const edge=this.workspace.querySelector('.inspector-edge');if(edge){edge.innerHTML=this.wide?'›':'‹';edge.dataset.tooltip=this.wide?'Pokaż panel ustawień':'Schowaj panel ustawień';edge.title=edge.dataset.tooltip;edge.setAttribute('aria-label',edge.dataset.tooltip);}
  }
  renderPills(){
    const strip=this.workspace.querySelector('#component-strip');if(!strip)return;
    const inventory=this.inventories.get(this.viewId),tree=componentTree(inventory?.items),selected=this.activeSelection();
    const selectedId=tree.byId.has(selected?.id)?selected.id:'layout-root';let branch=tree.byId.has(this.branches.get(this.viewId))?this.branches.get(this.viewId):'layout-root';
    const path=tree.path(branch),children=(tree.children.get(branch)||[]).filter(tree.available);
    const query=this.search.trim().toLocaleLowerCase('pl');
    const rows=query?(inventory?.items||[]).filter(item=>item.id!=='layout-root'&&tree.available(item)&&item.label.toLocaleLowerCase('pl').includes(query)):children;
    const visibleComponents=new Set((inventory?.items||[]).filter(item=>item.visible&&(item.index>=0||item.id==='layout-root')).map(item=>item.component));
    const pillComponents=this.editingMode==='component'?this.registry.components:this.registry.components.filter(component=>visibleComponents.has(component.id));
    const row=(item,level=0)=>{const kids=(tree.children.get(item.id)||[]).filter(tree.available),count=kids.length,mode=item.temporary||'visible',next=mode==='visible'?'hidden':mode==='hidden'?'removed':'visible',tip=mode==='visible'?'Ukryj i zachowaj miejsce':mode==='hidden'?'Usuń z układu':'Pokaż ponownie',expanded=!query&&item.id===selectedId&&count>0&&item.id!==branch,movable=item.kind!=='background';return `<div class='tree-row ${item.id===selectedId?'selected':''} ${expanded?'expanded':''}' style='--tree-level:${level}' draggable=${movable} ${movable?`data-layer-drag='${item.id}'`:''}><button class='tree-eye tooltip' data-layer-visibility-toggle='${item.id}' data-mode='${next}' data-tooltip='${tip}' title='${tip}' aria-label='${tip}'>${iconSVG(mode==='visible'?'eye':mode==='hidden'?'eyeOff':'collapse')}</button><button class=branch-node data-tree-select='${item.id}' aria-expanded='${expanded}'>${movable?'<span class=tree-drag aria-hidden=true>⠿</span>':''}<span class=branch-copy><b>${html(item.label)}</b><small>${query?html(tree.path(item.id).slice(0,-1).map(node=>node.label).join(' › ')):html(ELEMENT_FAMILIES[item.recipe]||ELEMENT_KINDS[item.kind]||'Element')}</small></span>${count?'<span class=branch-chevron aria-hidden=true>›</span>':''}</button></div>${expanded?`<div class=tree-branch>${kids.map(child=>row(child,level+1)).join('')}</div>`:''}`;};
    const branchItem=tree.byId.get(branch),gap=Math.round(branchItem?.layoutGap||0);
    strip.innerHTML=`<div class=family-choices aria-label='Elementy widoczne w tym trybie'>${pillComponents.map(component=>`<button data-component=${component.id} class='${component.id===this.componentId?'selected':''}'>${html(this.name(component))}</button>`).join('')||'<span class=family-empty>Brak widocznych elementów</span>'}</div><section class=component-navigation aria-label='Hierarchia elementów'><nav class=component-crumbs aria-label='Ścieżka elementu'>${path.map((item,i)=>`${i?'<span aria-hidden=true>›</span>':''}<button data-tree-enter='${item.id}' ${item.id===branch?'aria-current=location':''}>${html(item.label)}</button>`).join('')||'Wczytywanie hierarchii…'}</nav><div class=branch-heading><strong>${query?'Wyniki w całym ekranie':'Zawartość · '+html(branchItem?.label||'Ekran')}</strong><label class=branch-gap>Odstęp <input type=number min=0 max=120 step=1 value=${gap} data-branch-gap='${branch}' aria-label='Odstęp między elementami w pikselach'><span>px</span></label></div><div class=branch-children>${rows.map(item=>row(item)).join('')||'<p class=branch-empty>To ostatni poziom. Wróć ścieżką do rodzica.</p>'}</div></section>`;
  }
  renderCompareChoices(){
    const node=this.workspace.querySelector('#compare-choices');if(!node)return;
    node.innerHTML=this.compare?`<div class=compare-choices><div class=compare-heading><strong>Widoki do porównania</strong><button class=small-button id=compare-similar>Ustawienia gier</button></div><div class=compare-checkboxes>${relatedViews(this.registry,this.componentId).map(view=>`<label><input type=checkbox data-compare-view=${view.id} ${this.compareViews.includes(view.id)?'checked':''}>${html(view.name)}</label>`).join('')}</div></div>`:'';
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
    gallery.classList.toggle('comparison',this.compare);gallery.classList.toggle('native-size',this.zoom==='100');
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
    this.search='';this.viewId=id;this.branches.set(id,'layout-root');
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
    inspector.innerHTML=`<div class=inspector-title><div><span class=inspector-kicker>Wybrany element</span><h2>${html(this.name())}</h2></div><button id=rename-component class=icon-button title='Zmień nazwę elementu' aria-label='Zmień nazwę elementu'>✎</button></div><div id=selected-element></div><label class=scope><span>Zakres zmiany</span><select id=scope-select><option value=global ${this.scope==='global'?'selected':''}>Wspólnie · wszystkie użycia</option><option value=view ${this.scope==='view'?'selected':''}>Lokalnie · ${html(this.view.name)}</option></select></label><div id=visual-editor></div><div class=inspector-controls>${group?`<details class=shared-recipe><summary>Wymiary całej rodziny</summary>${Object.keys(this.config.tokens[group]).filter(key=>typeof this.config.tokens[group][key]==='number').map(key=>this.control(group,key)).join('')}</details>`:''}</div>${group?'<button class=small-button id=reset-component>Przywróć zapisany przepis rodziny</button>':''}<details class=advanced-element><summary>Więcej · użycia i Builder</summary><div class=related-views><strong>Występuje w ${used.length} widokach</strong><button class=small-button id=start-compare>Porównaj użycia</button><button class=small-button id=send-to-builder>Otwórz kopię w Builderze</button><details><summary>Pokaż powiązane ekrany</summary><div class=affected-links>${used.map(view=>`<button class=small-button data-open-view=${view.id}>${html(view.name)}</button>`).join('')}</div></details></div></details>`;
    this.renderSelectionPanel();this.renderLayers();this.renderVisual();
  }
  renderSelectionPanel(){
    const node=this.workspace.querySelector('#selected-element');if(!node)return;
    const selected=this.activeSelection();
    node.innerHTML=selected?`<section class=selected-element><h3>${html(selected.label)}</h3><p class=element-measure>${number(selected.metrics.width)} × ${number(selected.metrics.height)} px</p>${selected.layoutSpacing?`<p class=spacing-source>Przed elementem: <b>${number(selected.layoutSpacing.before)} px</b> · ${html(selected.layoutSpacing.source)}<br>Gap rodzica: <b>${number(selected.layoutSpacing.gap)} px</b></p>`:''}${selected.parents?.length?'<button class=small-button id=select-parent>‹ Kontener wyżej</button>':''}<p class=selection-status data-status='${selected.visible===false?'missing':'visible'}'>${selected.visible===false?'Element jest ukryty w tym stanie. Wybierz go ponownie, aby odsłonić.':'Wybrany element w podglądzie'}</p>${selected.actions?.length?`<details class=live-states><summary>Stan tego elementu</summary><p>Zmienia tylko przykład w podglądzie.</p><div>${selected.actions.map(action=>`<button class='state-pill ${action.selected?'active':''}' data-preview-action='${action.id}' data-action-label='${html(action.label)}'>${html(action.label)}</button>`).join('')}</div></details>`:''}</section>`:'<p class=empty-hint>Wybierz kontener, a potem schodź po jego gałęziach.</p>';
  }
  renderLayers(){
    const node=this.workspace.querySelector('#preview-layers');if(!node)return;
    node.innerHTML='';
  }
  visibilityOptions(mode='visible'){return [['visible','Widoczny'],['hidden','Ukryj — zachowaj miejsce'],['removed','Ukryj — przesuń pozostałe']].map(([id,label])=>`<option value=${id} ${mode===id?'selected':''}>${label}</option>`).join('');}
  savedVisual(key){const item=this.activeSelection();if(!item)return 0;return visualValue(this.getBase(),this.viewId,item)[key]??this.metricBase.get(this.viewId+':'+item.id)?.[key]??0;}
  writeVisual(key,value){const item=this.activeSelection();if(!item)return;this.edit(this.scope==='global'?`elementStyles.${item.recipe||item.kind||'container'}.${key}`:`elementOverrides.${this.viewId}.${item.id}.${key}`,value===''?undefined:value);}
  writeVisualFor(item,key,value){if(!item)return;this.edit(`elementOverrides.${this.viewId}.${item.id}.${key}`,value);}
  renderVisual(){
    const node=this.workspace.querySelector('#visual-editor'),item=this.activeSelection();if(!node||!item||document.activeElement?.closest('#visual-editor'))return;
    const baseKey=this.viewId+':'+item.id;if(!this.metricBase.has(baseKey))this.metricBase.set(baseKey,{...item.metrics});
    const global={...this.config.elementStyles?.[item.kind],...this.config.elementStyles?.[item.recipe]},local=this.config.elementOverrides?.[this.viewId]?.[item.id]||{},style=visualValue(this.config,this.viewId,item);
    const hex=value=>{if(/^#/.test(value||''))return value.slice(0,7);const rgb=(value||'').match(/\d+/g);return rgb&&rgb.length>=3?'#'+rgb.slice(0,3).map(v=>Number(v).toString(16).padStart(2,'0')).join(''):'#ffffff';};
    const keys=[...(item.kind==='text'?['fontSize','width','padding']:item.kind==='icon'?['width','height','padding']:['width','height','padding','gap','radius',...(['button','timer','key','toggle'].includes(item.kind)?['fontSize']:[])]),'opacity','offsetX','offsetY'];
    const numeric=key=>{const [min,hard,label]=VISUAL_FIELDS[key],fallback={opacity:1,offsetX:0,offsetY:0,originX:50,originY:50,imageScale:1,imageX:50,imageY:50}[key]??this.metricBase.get(baseKey)[key]??0,savedValue=visualValue(this.getBase(),this.viewId,item)[key]??this.metricBase.get(baseKey)?.[key]??fallback,saved=Math.min(hard,Math.max(min,savedValue)),value=Math.min(hard,Math.max(min,style[key]??fallback)),[a,b]=dynamicRange(value,saved,min,key==='width'?390:key==='height'?200:key==='fontSize'?48:hard,hard);return `<div class=control><div class=control-top><label>${label}</label><span class=control-value><input type=number aria-label='Element · ${label}' data-visual-number=${key} min=${min} max=${hard} value=${value.toFixed(2)} step=${key==='opacity'||key==='imageScale'?'.05':'.5'}></span></div><div class=range-wrap><input type=range aria-label='Element · ${label}' data-visual-number=${key} min=${a} max=${b} step=${key==='opacity'||key==='imageScale'?'.05':'.5'} value=${value}><span class=saved-mark style='--saved-position:${savedMarker(saved,a,b)/100}'></span></div><div class=saved-value><span>Zapisane: ${number(saved)} · <b>${Object.hasOwn(local,key)?'Lokalne':Object.hasOwn(global,key)?'Globalne':'Styl komponentu'}</b></span><button data-visual-reset=${key}>Dziedzicz</button></div></div>`;};
    const imageControls=['imageScale','imageX','imageY','originX','originY'].map(numeric).join('');
    node.innerHTML=`<section class=visual-properties><h3>Wygląd tego elementu</h3><p class=scope-help>${this.scope==='view'?'Zmiana tylko tutaj.':'Wspólny przepis: '+html(ELEMENT_FAMILIES[item.recipe]||item.label||ELEMENT_KINDS[item.kind]||'Kontener')}. <span class=source-badge>${Object.keys(local).length?'Ma wyjątki lokalne':item.nativeVariant?'Wariant lokalny · '+html(item.nativeVariant):'Dziedziczy wspólny wygląd'}</span></p>${keys.map(numeric).join('')}${item.editableText&&this.scope==='view'?`<label class='form-field local-copy'><span>Tekst tylko w tym miejscu</span><textarea data-visual-field=text maxlength=600 aria-label='Tekst elementu'>${html(style.text??item.editableText)}</textarea><button data-visual-reset=text>Przywróć tekst</button></label>`:''}<div class=visual-colors>${[['textColor','Kolor tekstu / ikony'],['background','Kolor tła']].map(([key,label])=>`<label>${label}<input type=color aria-label='${label}' data-visual-field=${key} value='${hex(style[key]||item.metrics[key])}'><small>${Object.hasOwn(local,key)?'Lokalne':'Dziedziczone'}</small></label>`).join('')}</div>${item.kind==='icon'?`<label class=form-field><span>Ikona</span><select data-visual-field=icon aria-label='Zamień ikonę'><option value=''>Obecna</option>${Object.entries(ICONS).map(([id,name])=>`<option value=${id} ${style.icon===id?'selected':''}>${name}</option>`).join('')}</select></label>`:''}${['image','background'].includes(item.kind)?`<section class=image-controls><h4>Grafika i kadr</h4><label class=form-field><span>Dopasowanie grafiki</span><select data-visual-field=fit><option value=cover ${style.fit!=='contain'?'selected':''}>Wypełnij i przytnij</option><option value=contain ${style.fit==='contain'?'selected':''}>Pokaż całą</option></select></label><label class=form-field><span>Grafika z bazy</span><select data-visual-field=asset><option value=''>Obecna grafika</option>${(this.getDesign().assets?.assets||[]).filter(a=>/\.(webp|png|jpg|svg)$/.test(a.path)).map(a=>`<option value='${html(a.path)}' ${style.asset===a.path?'selected':''}>${html(a.path.replace('assets/',''))}</option>`).join('')}</select></label><button class=small-button id=upload-element-asset>${iconSVG('upload')} Dodaj nową grafikę</button>${imageControls}</section>`:''}${['container','background'].includes(item.kind)?`<label class=form-field><span>Zawartość poza kontenerem</span><select data-visual-field=overflow><option value=visible ${style.overflow!=='clip'?'selected':''}>Pozwól wychodzić poza obszar</option><option value=clip ${style.overflow==='clip'?'selected':''}>Przycinaj do obiektu</option></select></label>`:''}<details><summary>Wspólny wygląd i zamiana</summary><p>Zamiana przejmuje przepis wizualny. Funkcja i połączenia zostają.</p><select data-visual-field=replacement><option value=''>Oryginalny przepis</option>${[...Object.keys(ELEMENT_FAMILIES),'container','text','icon','image'].map(kind=>`<option value=${kind} ${local.replacement===kind?'selected':''}>${html(ELEMENT_FAMILIES[kind]||ELEMENT_KINDS[kind]||kind)}</option>`).join('')}</select><button class=small-button id=visual-reset-local>Scal ze wspólnym · usuń wyjątki</button></details></section>`;
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
      const tree=componentTree(this.inventories.get(id)?.items),parent=tree.byId.get(message.id)?.parent;if(parent)this.branches.set(id,parent);
      this.notifyState();this.updateActiveFrame();this.renderToolbar();this.renderPills();this.renderInspector();
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
    if(button.dataset.treeEnter){this.search='';this.branches.set(this.viewId,button.dataset.treeEnter);this.renderPills();this.send(this.activeFrame(),'focus',{id:button.dataset.treeEnter,reveal:true});}
    if(button.dataset.treeSelect){this.search='';const id=button.dataset.treeSelect,tree=componentTree(this.inventories.get(this.viewId)?.items),hasChildren=(tree.children.get(id)||[]).filter(tree.available).length;if(this.activeSelection()?.id===id&&hasChildren){this.branches.set(this.viewId,id);this.renderPills();}else this.send(this.activeFrame(),'focus',{id,reveal:true});}
    if(button.dataset.component)this.chooseComponent(button.dataset.component);
    if(button.dataset.openView)this.openView(button.dataset.openView);
    if(button.dataset.activeView)this.openView(button.dataset.activeView);
    if(button.dataset.visualReset){this.writeVisual(button.dataset.visualReset,undefined);this.renderVisual();}
    if(button.id==='visual-reset-local'){const selected=this.activeSelection();if(selected){for(const key of Object.keys(this.config.elementOverrides?.[this.viewId]?.[selected.id]||{}))this.edit(`elementOverrides.${this.viewId}.${selected.id}.${key}`,undefined);this.renderVisual();}}
    if(button.id==='send-to-builder'){this.send(this.activeFrame(),'blueprint',{id:this.activeSelection()?.id});}
    if(button.id==='rename-component')this.rename(this.component);
    if(button.id==='reset-component'&&this.component.tokenGroup){this.reset(this.component.tokenGroup,null,this.scope,this.viewId);this.updateSavedIndicators();}
    if(button.dataset.resetField){const [group,key]=button.dataset.resetField.split('.');this.reset(group,key,this.scope,this.viewId);this.updateSavedIndicators();}
    if(button.id==='wide-preview'){this.wide=!this.wide;this.workspace.querySelector('.component-layout')?.classList.toggle('wide-preview',this.wide);button.innerHTML=this.wide?'›':'‹';button.dataset.tooltip=this.wide?'Pokaż panel ustawień':'Schowaj panel ustawień';button.title=button.dataset.tooltip;button.setAttribute('aria-label',button.dataset.tooltip);this.resizePhone();}
    if(button.dataset.layerSelect)this.send(this.activeFrame(),'focus',{id:button.dataset.layerSelect,reveal:true});
    if(button.dataset.layerVisibilityToggle)this.send(this.activeFrame(),'visibility',{id:button.dataset.layerVisibilityToggle,mode:button.dataset.mode});
    if(button.dataset.layerMove)this.send(this.activeFrame(),'reorder',{id:button.dataset.layerMove,direction:Number(button.dataset.direction)});
    if(button.id==='add-spacer')this.send(this.activeFrame(),'insert-spacer',{after:this.activeSelection()?.id});
    if(button.id==='restore-layers')this.send(this.activeFrame(),'reset-visibility');
    if(button.id==='select-parent'){const id=this.activeSelection()?.parents?.[0];if(id)this.send(this.activeFrame(),'focus',{id,reveal:true});}
    if(button.dataset.previewAction)this.send(this.activeFrame(),'action',{id:button.dataset.previewAction,label:button.dataset.actionLabel});
    if(button.id==='reset-preview'){this.broadcast('reset-preview');for(const frame of this.frames())frame.src=frame.src;this.notice('Przywrócono początkowy stan przykładu. Zmiany wyglądu zostają w szkicu.');}
    if(button.id==='toggle-zoom'){this.zoom=this.zoom==='fit'?'100':'fit';this.renderToolbar();this.syncGallery();}
    if(button.id==='upload-element-asset')this.upload?.(this.activeSelection());
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
    if(target.id==='compare-views'){this.compare=target.checked;if(this.compare)this.editingMode='component';this.compareViews=relatedViews(this.registry,this.componentId).slice(0,2).map(view=>view.id);if(this.compare&&!this.compareViews.includes(this.viewId))this.compareViews.unshift(this.viewId);this.renderToolbar();this.syncGallery();}
    if(target.dataset.compareView){const id=target.dataset.compareView;if(!target.checked&&this.compareViews.length===1){target.checked=true;this.notice('Pozostaw co najmniej jeden ekran do porównania.');return;}this.compareViews=target.checked?[...this.compareViews,id]:this.compareViews.filter(view=>view!==id);if(this.compareViews.length&&!this.compareViews.includes(this.viewId))this.viewId=this.compareViews[0];this.notifyState();this.syncGallery();this.renderToolbar();this.renderInspector();}
    if(target.id==='selected-visibility'){const selected=this.activeSelection();if(selected)this.send(this.activeFrame(),'visibility',this.workspace.querySelector('#hide-whole-family').checked?{component:selected.component,mode:target.value}:{id:selected.id,mode:target.value});}
    if(target.dataset.layerVisibility)this.send(this.activeFrame(),'visibility',{id:target.dataset.layerVisibility,mode:target.value});
    if(target.dataset.branchGap){const item=this.inventories.get(this.viewId)?.items.find(row=>row.id===target.dataset.branchGap),value=Number(target.value);if(Number.isFinite(value)&&value>=0&&value<=120)this.writeVisualFor(item,'gap',value);}
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
