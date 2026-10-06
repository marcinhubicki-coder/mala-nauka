import {collectScreenCopy} from '../shared/screen-copy.mjs';
import {configureRules,ruleLibrary} from '../shared/rules-library.mjs';
import {applyDesign,designReady} from '../shared/design-runtime.mjs';
import {configureAssets,rewriteAssetNodes,previewAssets,assetManifest} from '../shared/asset-loader.mjs';
import {annotateElements,visualValue} from '../shared/element-system.mjs';
import {blueprintTemplate,newLayer,validateBlueprint} from '../shared/component-recipes.mjs';

const query = new URLSearchParams(location.search);
const studio = query.has('studio');
document.documentElement.dataset.dsView = query.get('viewId') || '';
if (studio) {
  document.documentElement.style.setProperty('--app-safe-top','47px');
  document.documentElement.style.setProperty('--app-safe-bottom','34px');
  document.documentElement.dataset.studio = 'true';
}

let copyScanning=false;
let registry, inspecting = false, showHighlight = true, selection = null;
let items = new Map(), actions = new Map(), reportTimer, overlay;
const temporaryVisibility = new Map();
const originalStyles = new WeakMap();
const app = () => document.getElementById('app');
const emit = data => { if (parent !== window) parent.postMessage({channel:'mala-nauka-studio',...data},location.origin); };
const visible = node => {
  if(!node?.getClientRects().length)return false;
  for(let parent=node;parent&&parent!==document.body;parent=parent.parentElement){
    const style=getComputedStyle(parent);
    if(parent.hidden||parent.inert||parent.getAttribute('aria-hidden')==='true'&&!parent.matches('img,svg,.spelling-screen-bg')||style.visibility==='hidden'||style.display==='none'||Number(style.opacity)===0)return false;
  }
  const rect=node.getBoundingClientRect();return rect.width>0&&rect.height>0;
};
const gates = node => {
  const requirements=[];
  if(node.closest('[data-category-panel]'))requirements.push(['[name="spellingScope"][value="categories"], [name="englishScope"][value="categories"]','Kategorie']);
  if(node.closest('[data-dictation-panel]'))requirements.push(['[name="spellingScope"][value="dictation"]','Dyktando']);
  if(app()?.dataset.mode==='english'&&node.closest('fieldset')?.querySelector('[name=duration],[name=difficulty]')&&!node.closest('[data-category-panel]'))requirements.push(['[name=englishEditAction][value=cancel]','Zamknij wybór kategorii']);
  const options=node.closest('[data-round-options]');
  if(options){requirements.push(['[name="spellingScope"][value="all"]','Wszystko']);requirements.push([`[name="limitMode"][value="${options.dataset.roundOptions}"]`,options.dataset.roundOptions==='time'?'Czas':'Słowa']);}
  return requirements;
};
const revealable = node => gates(node).length>0&&gates(node).every(([selector])=>app()?.querySelector(selector));
const blockedByDialog = node => [...document.querySelectorAll('dialog[open]')].some(dialog=>!dialog.contains(node)&&node!==app());

const exposed = item => {
  if(item.id==='layout-root'||item.kind==='background')return true;
  const r=item.node.getBoundingClientRect();
  for(const x of [.2,.5,.8])for(const y of [.2,.5,.8]){
    const px=r.left+r.width*x,py=r.top+r.height*y;
    if(px<0||py<0||px>=innerWidth||py>=innerHeight)continue;
    const hit=document.elementFromPoint(px,py);
    if(hit&&(item.node.contains(hit)||hit.contains(item.node)))return true;
  }
  return false;
};
const caption = node => (node.getAttribute('aria-label') || node.getAttribute('alt') || node.querySelector('legend,h1,h2,h3,.setup-title')?.textContent || node.textContent || '').replace(/\s+/g,' ').trim().slice(0,55);

function collect() {
  const result = new Map();
  if (!registry || !app()) return result;
  app().dataset.dsElement='layout-root';app().dataset.dsKind='container';
  result.set('layout-root',{id:'layout-root',component:'layout',index:-1,label:'Cały ekran',node:app()});
  const mapped=annotateElements(app(),window.__MALA_NAUKA_DESIGN__||{},document.documentElement.dataset.dsView);
  for(const item of mapped)result.set(item.id,item);
  for (const component of registry.components.filter(c=>!c.fine)) {
    [...document.querySelectorAll(component.selector)].filter(node => app().contains(node) || node.matches('dialog')).forEach((node,index) => {
      const existing=[...result.values()].find(row=>row.node===node);
      if(existing){if(!['timer','meter','toggle','key','background','icon','image','text'].includes(existing.kind))existing.component=component.id;existing.index=index;}
      else {const id=`${component.id}-${index}`;node.dataset.dsElement=id;result.set(id,{id,component:component.id,index,label:caption(node),node,kind:'container',depth:0,parent:'layout-root'});}
    });
  }
  // Resolve parents after every family has been mapped, including legacy containers.
  const byNode=new Map([...result.values()].map(item=>[item.node,item]));
  let order=0;
  for(const item of result.values()){
    item.order=order++;
    if(item.id==='layout-root'){item.kind='container';item.label='Cały ekran';continue;}
    let parent=item.node.parentElement;
    while(parent&&!byNode.has(parent))parent=parent.parentElement;
    item.parent=byNode.get(parent)?.id||'layout-root';
  }
  for(const item of result.values()){
    item.depth=0;const seen=new Set([item.id]);let parent=result.get(item.parent);
    while(parent&&!seen.has(parent.id)){seen.add(parent.id);item.depth++;parent=result.get(parent.parent);}
  }
  return result;
}

function applyVisibility() {
  for (const item of items.values()) {
    const mode = temporaryVisibility.get(item.id) || temporaryVisibility.get('component:'+item.component);
    const node = item.node;
    if (!originalStyles.has(node)) originalStyles.set(node,{visibility:node.style.getPropertyValue('visibility'),visibilityPriority:node.style.getPropertyPriority('visibility'),display:node.style.getPropertyValue('display'),displayPriority:node.style.getPropertyPriority('display')});
    const saved = originalStyles.get(node);
    if (mode === 'hidden') {node.style.setProperty('visibility','hidden','important');node.style.setProperty('display',saved.display,saved.displayPriority);}
    else if (mode === 'removed') node.style.setProperty('display','none','important');
    else {node.style.setProperty('visibility',saved.visibility,saved.visibilityPriority);node.style.setProperty('display',saved.display,saved.displayPriority);}
  }
}

function selectedItem() {
  return items.get(selection) || null;
}
function controls(item) {
  actions = new Map();
  if (!item) return [];
  const result = [];
  for (const node of item.node.querySelectorAll('input[type=radio],input[type=checkbox]')) {
    const target = node.matches('input') ? node.closest('label') || node : node;
    if (!visible(target) || node.disabled || node.closest('[data-ds-element]')?.parentElement.closest('[data-ds-element]')!==item.node && target!==item.node) continue;
    const label = caption(target);
    if (!label || result.some(row=>row.label===label) || result.length>=30) continue;
    const id = 'action:'+result.length;
    const selected = node.checked === true || node.getAttribute('aria-pressed') === 'true' || node.classList.contains('selected') || node.classList.contains('active');
    actions.set(id,{node:target,label});
    result.push({id,label,selected});
  }
  return result;
}
function selectedDetails() {
  const item = selectedItem();
  if (!item) return null;
  const rect = item.node.getBoundingClientRect(),style = getComputedStyle(item.node),parents=[];
  for (let node=item.node.parentElement;node && node!==document.body;node=node.parentElement) {
    const match = [...items.values()].find(row=>row.node===node && row.id!==item.id);
    if(match && !parents.includes(match.id))parents.push(match.id);
  }
  const nativeVariant=item.recipe==='button-answer'?({math:'Matematyka',english:'Angielski',flags:'Flagi',reading:'Czytanie'})[document.documentElement.dataset.dsView.split('-')[0]]||'':'';
  const textNodes=[...item.node.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim());
  return {visible:visible(item.node),editableText:item.kind==='text'&&textNodes.length===1?(item.node.dataset.dsOriginalText||textNodes[0].textContent.trim()):null,id:item.id,component:item.component,kind:item.kind,recipe:item.recipe,nativeVariant,index:item.index,label:item.label,parents,actions:controls(item),metrics:{width:rect.width,height:rect.height,padding:parseFloat(style.padding)||0,gap:parseFloat(style.gap)||0,radius:parseFloat(style.borderRadius)||0,fontSize:parseFloat(style.fontSize)||16,textColor:style.color,background:style.backgroundColor},visual:visualValue(window.__MALA_NAUKA_DESIGN__||{},document.documentElement.dataset.dsView,item)};
}
let dialogOutline;
function paintHighlight() {
  overlay?.remove();
  if(dialogOutline){const {node,value,priority}=dialogOutline;node.style.setProperty('outline',value,priority);dialogOutline=null;}
  if (!showHighlight || !selectedItem()) return;
  const chosen = selectedItem();
  if(chosen.node.closest('dialog[open]')){dialogOutline={node:chosen.node,value:chosen.node.style.getPropertyValue('outline'),priority:chosen.node.style.getPropertyPriority('outline')};chosen.node.style.setProperty('outline','3px solid #315af2','important');return;}
  overlay = Object.assign(document.createElement('div'),{id:'ds-selection-layer'});
  overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden';
  for (const item of items.values()) {
    if (item.id!==chosen.id || !visible(item.node)) continue;
    const rect=item.node.getBoundingClientRect();
    if(!rect.width || !rect.height)continue;
    const box=document.createElement('div');
    box.className='ds-selected-outline';
    box.style.cssText=`position:absolute;left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px;box-sizing:border-box;border:${item.id===chosen.id?'3px solid':'1px dashed'} #315af2;border-radius:8px;background:${item.id===chosen.id?'#315af214':'transparent'}`;
    overlay.append(box);
  }
  document.body.append(overlay);
}
function report() {
  clearTimeout(reportTimer);
  if(copyScanning)emit({type:'copy-list',rows:collectScreenCopy(app())});
  items = collect();
  applyVisibility();
  paintHighlight();
  emit({type:'inventory',viewId:document.documentElement.dataset.dsView,rendered:Boolean(app()?.querySelector('button,input,dialog')&&!app()?.querySelector('.loading')),items:[...items.values()].map(({node,...item})=>({...item,visible:visible(node)&&!blockedByDialog(node),revealable:revealable(node),temporary:temporaryVisibility.get(item.id)||temporaryVisibility.get('component:'+item.component)||'visible'})),selection:selectedDetails()});
}
function scheduleReport() {
  clearTimeout(reportTimer);
  reportTimer=setTimeout(report,70);
}
let focusVersion=0;
async function focusItem(message) {
  const version=++focusVersion;
  items=collect();
  const find=()=>message.selector?[...items.values()].find(row=>row.node.matches(message.selector)):message.id?items.get(message.id):[...items.values()].find(row=>row.component===message.component&&row.index>=0&&(visible(row.node)||revealable(row.node)));
  let item=find();
  if(!item&&message.component==='layout')item=items.get('layout-root');
  if(!item){if(app()?.querySelector('button,input')&&!app()?.querySelector('.loading'))emit({type:'missing',component:message.component});return;}
  const id=item.id;
  if(message.reveal){
    // Restore the actual ancestors, not unrelated hidden families.
    for(let node=item.node;node;node=node.parentElement){const row=[...items.values()].find(r=>r.node===node);if(row){temporaryVisibility.delete(row.id);if(temporaryVisibility.has('component:'+row.component))temporaryVisibility.set(row.id,'visible');}}
    applyVisibility();
    const click=(input,force=false)=>{if(!input||input.checked&&!force)return;const previous=inspecting;inspecting=false;(input.closest('label')||input).click();inspecting=previous;};
    if(!item.node.closest('[data-category-panel]')&&app()?.querySelector('[name="englishEditAction"]:enabled'))click(app().querySelector('[name="englishEditAction"][value="cancel"]'),true);
    for(const [selector]of gates(item.node)){
      // A selected category scope already permits the time/count controls.
      if(selector.includes('spellingScope')&&selector.includes('all')&&!app()?.querySelector('[name="spellingScope"][value="dictation"]:checked'))continue;
      click(app()?.querySelector(selector),!visible(item.node));
    }
    for(const details of document.querySelectorAll('details'))if(details.contains(item.node))details.open=true;
    for(const dialog of document.querySelectorAll('dialog[open]'))if(!dialog.contains(item.node)&&item.node!==app()){
      const close=dialog.querySelector('[data-action="resume"],[data-action="close"],[data-action="close-modal"],button[aria-label*="Zamknij"]');
      if(close){const previous=inspecting;inspecting=false;close.click();inspecting=previous;}else dialog.close();
    }
    const radio=item.node.matches('label')?item.node.querySelector('input[type=radio]'):item.node.closest('label')?.querySelector('input[type=radio]');
    if(radio&&!radio.disabled)click(radio);
    // State adapters may rebuild the DOM; resolve the same stable identity again.
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(version!==focusVersion)return;
    items=collect();item=items.get(id);
    if(item){
      const deadline=performance.now()+1200;
      while((!visible(item.node)||item.node.closest('label')?.querySelector('input')?.disabled)&&performance.now()<deadline){await new Promise(resolve=>requestAnimationFrame(resolve));if(version!==focusVersion)return;}
      if(visible(item.node))item.node.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
    }
  }
  if(!item||!visible(item.node)||blockedByDialog(item.node)||message.reveal&&!exposed(item)){
    emit({type:'missing',component:message.component,message:'Element nie jest dostępny w tym stanie. Wybierz jego kontener lub właściwy ekran.'});return;
  }
  selection=item.id;report();
  emit({type:'focused',explicit:true,...selectedDetails()});
}

if (studio) {
  document.addEventListener('pointerdown',()=>emit({type:'preview-interaction'}),true);
  document.addEventListener('focusin',()=>emit({type:'preview-focus'}));
  document.addEventListener('click',event=>{
    if(!inspecting || !registry || overlay?.contains(event.target))return;
    items=collect();
    const candidates=[...items.values()].filter(item=>item.node.contains(event.target)&&item.id!=='layout-root').sort((a,b)=>(a.depth||0)-(b.depth||0)||(a.order||0)-(b.order||0));
    const current=candidates.findIndex(item=>item.id===selection),item=candidates[Math.min(candidates.length-1,current<0?0:current+1)];
    if(!item)return;
    event.preventDefault();event.stopImmediatePropagation();
    selection=item.id;
    report();emit({type:'select',...selectedDetails()});
  },true);
  document.addEventListener('click',scheduleReport);
  document.addEventListener('change',scheduleReport);
  document.addEventListener('scroll',paintHighlight,true);
  window.addEventListener('resize',scheduleReport);
  window.addEventListener('message',async event=>{
    if(event.origin!==location.origin || event.source!==parent || event.data?.channel!=='mala-nauka-studio')return;
    const message=event.data;
    if(message.type==='copy-scan'){await designReady;copyScanning=true;emit({type:'copy-list',rows:collectScreenCopy(app())});}
    if(message.type==='design'){
      await designReady;applyDesign(message.config);
      if(message.assets){const changed=JSON.stringify(assetManifest().words)!==JSON.stringify(message.assets.words);previewAssets(message.previewURLs);configureAssets(message.assets,message.contentOrigin||window.__DS_ASSET_ORIGIN__||new URL('../',import.meta.url).href);rewriteAssetNodes();if(changed)document.dispatchEvent(new CustomEvent('mala-nauka:assets'));}
      if(message.rules&&JSON.stringify(ruleLibrary())!==JSON.stringify(message.rules)){configureRules(message.rules);document.dispatchEvent(new CustomEvent('mala-nauka:rules'));}
      if(message.words)document.dispatchEvent(new CustomEvent('mala-nauka:words',{detail:message.words}));
      scheduleReport();
    }
    if(message.type==='inspect'){inspecting=Boolean(message.enabled);showHighlight=Boolean(message.highlight);paintHighlight();}
    if(message.type==='focus')focusItem(message);
    if(message.type==='blueprint'){
      const source=items.get(message.id);if(!source)return;
      const value=blueprintTemplate(),rows=[...items.values()];let count=0;
      const make=(item,depth=0)=>{const type=item.node.matches('button')?'button':item.kind==='icon'?'icon':['image','background'].includes(item.kind)?'image':item.kind==='text'?'subtitle':'group',n=newLayer(type),s=getComputedStyle(item.node);count++;n.text=(item.label||'Element').slice(0,140);n.width=Math.min(390,Math.round(item.node.getBoundingClientRect().width));n.height=0;n.padding=Math.min(120,parseFloat(s.padding)||0);n.gap=Math.min(120,parseFloat(s.gap)||0);n.radius=Math.min(200,parseFloat(s.borderRadius)||0);n.opacity=Math.min(1,Math.max(0,parseFloat(s.opacity)||0));n.overflow=s.overflow==='hidden'||s.overflow==='clip'?'clip':'visible';const transform=s.translate&&s.translate!=='none'?s.translate.split(' ').map(parseFloat):[0,0];n.offsetX=Math.max(-390,Math.min(390,transform[0]||0));n.offsetY=Math.max(-844,Math.min(844,transform[1]||0));const origin=s.transformOrigin.split(' ').map(parseFloat),rect=item.node.getBoundingClientRect();n.originX=rect.width?Math.max(0,Math.min(100,(origin[0]||rect.width/2)/rect.width*100)):50;n.originY=rect.height?Math.max(0,Math.min(100,(origin[1]||rect.height/2)/rect.height*100)):50;n.layout=s.display==='grid'?'grid':s.flexDirection==='row'?'row':'column';if(n.layout==='grid')n.columns=Math.min(5,s.gridTemplateColumns.split(' ').length);const color=(s.color.match(/\d+/g)||[]).slice(0,3);if(color.length===3)n.textColor='#'+color.map(v=>Number(v).toString(16).padStart(2,'0')).join('');if(type==='icon')n.icon=item.node.dataset.dsIcon||'star';const src=item.node.getAttribute('src')||item.node.querySelector('image')?.getAttribute('href')||s.backgroundImage.match(/(?:^|["'(])([^"')]*\/assets\/[a-zA-Z0-9._/-]+)/)?.[1];if(type==='image'){n.fit=s.objectFit==='cover'?'cover':'contain';const position=s.objectPosition.split(' ').map(parseFloat);n.imageX=Math.max(0,Math.min(100,position[0]||50));n.imageY=Math.max(0,Math.min(100,position[1]||50));const scale=parseFloat(s.scale);n.imageScale=Number.isFinite(scale)?Math.max(.25,Math.min(3,scale)):1;}if(type==='image'&&src){const path=src.match(/(?:^|\/)assets\/[a-zA-Z0-9._/-]+/)?.[0]?.replace(/^\//,'');if(path&&!path.includes('..'))n.asset=path;}if(['button','group'].includes(type)&&depth<4&&count<40)n.children=rows.filter(r=>r.parent===item.id).slice(0,8).map(r=>make(r,depth+1));else n.children=[];return n;};
      value.name=('Szkic · '+source.label).slice(0,60);value.root.children=[make(source)];try{validateBlueprint(value);emit({type:'blueprint',value});}catch(e){emit({type:'notice',message:e.message});}
    }
    if(message.type==='action'){
      const action=actions.get(message.id);
      if(!action?.node.isConnected || action.label!==message.label){emit({type:'notice',message:'Ekran zmienił się. Wybierz stan ponownie.'});report();return;}
      const previous=inspecting;inspecting=false;action.node.click();inspecting=previous;scheduleReport();
    }
    if(message.type==='visibility'){
      if(!['visible','hidden','removed'].includes(message.mode))return;
      if(message.id && !items.has(message.id))return;
      if(message.component && !registry.components.some(item=>item.id===message.component))return;
      const key=message.id||'component:'+message.component;
      if(message.component){for(const old of temporaryVisibility.keys())if(old.startsWith(message.component+':'))temporaryVisibility.delete(old);}
      if(message.mode==='visible'&&(!message.id||!temporaryVisibility.has('component:'+items.get(message.id)?.component)))temporaryVisibility.delete(key);else temporaryVisibility.set(key,message.mode);
      report();
    }
    if(message.type==='reorder'){
      const item=items.get(message.id);if(!item||item.id==='layout-root'||item.kind==='background')return;
      const before=items.get(message.before);if(before&&before.node.parentElement===item.node.parentElement&&before.kind!=='background'){item.node.parentElement.insertBefore(item.node,before.node);selection=item.id;report();return;}
      const siblings=[...item.node.parentElement.children].filter(node=>[...items.values()].some(row=>row.node===node&&row.kind!=='background')),
        index=siblings.indexOf(item.node),target=siblings[index+Number(message.direction)];
      if(!target)return;
      if(Number(message.direction)<0)item.node.parentElement.insertBefore(item.node,target);else item.node.parentElement.insertBefore(target,item.node);
      selection=item.id;report();
    }
    if(message.type==='insert-spacer'){
      const selected=items.get(message.after)||items.get(selection),host=selected?.node?.parentElement||app();if(!host)return;
      const spacer=document.createElement('div');spacer.className='ds-preview-spacer';spacer.dataset.dsKey='spacer-'+Date.now().toString(36);spacer.dataset.dsKind='container';spacer.dataset.dsLabel='Spacer';spacer.setAttribute('aria-label','Spacer');spacer.style.cssText='height:24px;min-height:24px;border:1px dashed #6d8ee8;border-radius:8px;background:#315af20b;flex:0 0 24px';
      if(selected?.node?.parentElement===host)selected.node.after(spacer);else host.append(spacer);selection=spacer.dataset.dsKey;report();
    }
    if(message.type==='reset-visibility'){temporaryVisibility.clear();report();}
    if(message.type==='reset-preview'){temporaryVisibility.clear();selection=null;report();}
  });
  registry=await (await fetch(new URL('./registry.json',import.meta.url))).json();
  await designReady;
  if(app())new MutationObserver(records=>{if(records.some(record=>record.type==='childList'||record.attributeName!=='style'))scheduleReport();}).observe(app(),{childList:true,subtree:true,attributes:true,attributeFilter:['class','open','checked','aria-pressed','data-state']});
  report();emit({type:'ready',view:query.get('viewId')});
}
