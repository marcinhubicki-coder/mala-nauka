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
const visible = node => Boolean(node?.getClientRects().length) && getComputedStyle(node).visibility !== 'hidden' && getComputedStyle(node).display !== 'none';
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
  // Children sit above their containers; decorative backdrops and canvas are last.
  return new Map([...result].sort(([,a],[,b])=>(a.index===-1?1:b.index===-1?-1:a.kind==='background'?1:b.kind==='background'?-1:(b.depth||0)-(a.depth||0))));
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
  for (const node of item.node.querySelectorAll('button,input[type=radio],input[type=checkbox]')) {
    const target = node.matches('input') ? node.closest('label') || node : node;
    if (!visible(target) || node.disabled) continue;
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
  return {id:item.id,component:item.component,kind:item.kind,index:item.index,label:item.label,parents,actions:controls(item),metrics:{width:rect.width,height:rect.height,padding:parseFloat(style.padding)||0,gap:parseFloat(style.gap)||0,radius:parseFloat(style.borderRadius)||0,fontSize:parseFloat(style.fontSize)||16,textColor:style.color,background:style.backgroundColor},visual:visualValue(window.__MALA_NAUKA_DESIGN__||{},document.documentElement.dataset.dsView,item)};
}
function paintHighlight() {
  overlay?.remove();
  if (!showHighlight || !selectedItem()) return;
  const chosen = selectedItem();
  overlay = Object.assign(document.createElement('div'),{id:'ds-selection-layer'});
  overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden';
  for (const item of items.values()) {
    if (item.component!==chosen.component || !visible(item.node)) continue;
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
  emit({type:'inventory',rendered:Boolean(app()?.querySelector('button,input,dialog')&&!app()?.querySelector('.loading')),items:[...items.values()].map(({node,...item})=>({...item,visible:visible(node),temporary:temporaryVisibility.get(item.id)||temporaryVisibility.get('component:'+item.component)||'visible'})),selection:selectedDetails()});
}
function scheduleReport() {
  clearTimeout(reportTimer);
  reportTimer=setTimeout(report,70);
}
function focusItem(message) {
  items=collect();
  let item=message.selector?[...items.values()].find(row=>row.node.matches(message.selector)):message.id?items.get(message.id):[...items.values()].find(row=>row.component===message.component && row.index>=0 && visible(row.node));
  if(!item && message.component==='layout')item=items.get('layout-root');
  if(!item){selection=null;overlay?.remove();emit({type:'missing',component:message.component});return;}
  selection=item.id;
  if(message.reveal && visible(item.node))item.node.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
  report();
  emit({type:'focused',explicit:Boolean(message.id),...selectedDetails()});
}

if (studio) {
  document.addEventListener('click',event=>{
    if(!inspecting || !registry || overlay?.contains(event.target))return;
    items=collect();
    const candidates=[...items.values()].filter(item=>item.node.contains(event.target));
    candidates.sort((a,b)=>a.node===b.node?(a.component==='toggle'?-1:b.component==='toggle'?1:0):a.node.contains(b.node)?1:-1);
    const item=candidates[0];
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
      if(message.assets){const changed=JSON.stringify(assetManifest().words)!==JSON.stringify(message.assets.words);previewAssets(message.previewURLs);configureAssets(message.assets,window.__DS_ASSET_ORIGIN__||new URL('../',import.meta.url).href);rewriteAssetNodes();if(changed)document.dispatchEvent(new CustomEvent('mala-nauka:assets'));}
      if(message.rules&&JSON.stringify(ruleLibrary())!==JSON.stringify(message.rules)){configureRules(message.rules);document.dispatchEvent(new CustomEvent('mala-nauka:rules'));}
      scheduleReport();
    }
    if(message.type==='inspect'){inspecting=Boolean(message.enabled);showHighlight=Boolean(message.highlight);paintHighlight();}
    if(message.type==='focus')focusItem(message);
    if(message.type==='blueprint'){
      const source=items.get(message.id);if(!source)return;
      const value=blueprintTemplate(),rows=[...items.values()];let count=0;
      const make=(item,depth=0)=>{const type=item.node.matches('button')?'button':item.kind==='icon'?'icon':item.kind==='image'?'image':item.kind==='text'?'subtitle':'group',n=newLayer(type),s=getComputedStyle(item.node);count++;n.text=(item.label||'Element').slice(0,140);n.width=Math.min(390,Math.round(item.node.getBoundingClientRect().width));n.height=0;n.padding=Math.min(120,parseFloat(s.padding)||0);n.gap=Math.min(120,parseFloat(s.gap)||0);n.layout=s.display==='grid'?'grid':s.flexDirection==='row'?'row':'column';if(n.layout==='grid')n.columns=Math.min(5,s.gridTemplateColumns.split(' ').length);const color=(s.color.match(/\d+/g)||[]).slice(0,3);if(color.length===3)n.textColor='#'+color.map(v=>Number(v).toString(16).padStart(2,'0')).join('');if(type==='icon')n.icon=item.node.dataset.dsIcon||'star';const src=item.node.getAttribute('src');if(type==='image'&&src?.startsWith('assets/'))n.asset=src;if(['button','group'].includes(type)&&depth<4&&count<40)n.children=rows.filter(r=>r.parent===item.id).slice(0,8).map(r=>make(r,depth+1));else n.children=[];return n;};
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
    if(message.type==='reset-visibility'){temporaryVisibility.clear();report();}
    if(message.type==='reset-preview'){temporaryVisibility.clear();selection=null;report();}
  });
  registry=await (await fetch(new URL('./registry.json',import.meta.url))).json();
  await designReady;
  if(app())new MutationObserver(records=>{if(records.some(record=>record.type==='childList'||record.attributeName!=='style'))scheduleReport();}).observe(app(),{childList:true,subtree:true,attributes:true,attributeFilter:['class','open','checked','aria-pressed','data-state']});
  report();emit({type:'ready',view:query.get('viewId')});
}
