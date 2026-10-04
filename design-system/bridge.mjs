import {applyDesign,designReady} from '../shared/design-runtime.mjs';
import {configureAssets,rewriteAssetNodes,previewAssets,assetManifest} from '../shared/asset-loader.mjs';

const query = new URLSearchParams(location.search);
const studio = query.has('studio');
document.documentElement.dataset.dsView = query.get('viewId') || '';
if (studio) {
  document.documentElement.style.setProperty('--app-safe-top','47px');
  document.documentElement.style.setProperty('--app-safe-bottom','34px');
  document.documentElement.dataset.studio = 'true';
}

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
  result.set('layout:root',{id:'layout:root',component:'layout',index:-1,label:'Cały ekran',node:app()});
  for (const component of registry.components) {
    [...document.querySelectorAll(component.selector)].filter(node => app().contains(node) || node.matches('dialog')).forEach((node,index) => {
      const id = `${component.id}:${index}`;
      result.set(id,{id,component:component.id,index,label:caption(node),node});
    });
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
  return {id:item.id,component:item.component,index:item.index,label:item.label,parents,actions:controls(item),metrics:{width:rect.width,height:rect.height,padding:style.padding,fontSize:style.fontSize}};
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
  items = collect();
  applyVisibility();
  paintHighlight();
  emit({type:'inventory',items:[...items.values()].map(({node,...item})=>({...item,visible:visible(node),temporary:temporaryVisibility.get(item.id)||temporaryVisibility.get('component:'+item.component)||'visible'})),selection:selectedDetails()});
}
function scheduleReport() {
  clearTimeout(reportTimer);
  reportTimer=setTimeout(report,70);
}
function focusItem(message) {
  items=collect();
  let item=message.id?items.get(message.id):[...items.values()].find(row=>row.component===message.component && row.index>=0 && visible(row.node));
  if(!item && message.component==='layout')item=items.get('layout:root');
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
    if(message.type==='design'){
      await designReady;applyDesign(message.config);
      if(message.assets){const changed=JSON.stringify(assetManifest().words)!==JSON.stringify(message.assets.words);previewAssets(message.previewURLs);configureAssets(message.assets,window.__DS_ASSET_ORIGIN__||new URL('../',import.meta.url).href);rewriteAssetNodes();if(changed)document.dispatchEvent(new CustomEvent('mala-nauka:assets'));}
      scheduleReport();
    }
    if(message.type==='inspect'){inspecting=Boolean(message.enabled);showHighlight=Boolean(message.highlight);paintHighlight();}
    if(message.type==='focus')focusItem(message);
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
      if(message.mode==='visible')temporaryVisibility.delete(key);else temporaryVisibility.set(key,message.mode);
      report();
    }
    if(message.type==='reset-preview'){temporaryVisibility.clear();selection=null;report();}
  });
  registry=await (await fetch(new URL('./registry.json',import.meta.url))).json();
  await designReady;
  if(app())new MutationObserver(records=>{if(records.some(record=>record.type==='childList'||record.attributeName!=='style'))scheduleReport();}).observe(app(),{childList:true,subtree:true,attributes:true,attributeFilter:['class','open','checked','aria-pressed','data-state']});
  report();emit({type:'ready',view:query.get('viewId')});
}
