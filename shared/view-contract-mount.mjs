import {BOUND_VIEW_CONTRACTS,VIEW_COMPANIONS} from './view-bindings.mjs';
import {PIN_PARTS} from './pin-parts-contract.mjs';
import {SPELLING_OVERLAYS} from './spelling-overlays.mjs';
import {viewContract,validateViewContract} from './view-contracts.mjs';
// Encode domain keys, not DOM shape, labels or measured geometry. Inserting or
// reordering another record never changes an existing instance's identity.
export function contractInstanceKey(value){
 if(value===undefined||value===null||String(value)==='')throw Error('Missing contract instance key');
 return 'k'+[...new TextEncoder().encode(String(value))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
function keyFor(node,spec){
 for(const option of spec.split('|')){
  const [selector,attribute]=option.includes('@')?option.split('@'):['',option];
  const value=(selector?node.querySelector(selector):node)?.getAttribute(attribute);
  if(value!==null&&value!==undefined)return value;
 }
 throw Error('Missing domain key '+spec);
}
const boundNodes=new WeakMap();
function mountBindings(root,view,contract,{companion=false,base=[]}={}){
 const namespace=companion?'companions':'view';
 const mounted=[],contexts=new Map(),usedNodes=new Set(),usedIds=new Set();
 for(const item of contract){
  const scopes=item.within?contexts.get(item.within)||[]:[{node:root}];
  const instances=[];
  for(const scope of scopes){
   const nodes=[...scope.node.querySelectorAll(item.selector)];
   if(item.repeatKey){
    if(nodes.length<(item.min||0)||nodes.length>(item.max??10000))throw Error('Invalid repeat count: '+view+'/'+item.id+' ('+nodes.length+')');
   }else if(nodes.length!==1&&!(nodes.length===0&&item.optional))throw Error('Mount binding mismatch: '+view+'/'+item.id+' ('+nodes.length+')');
   for(const node of nodes){
    const prefix=item.within?scope.id+'-'+item.id:item.id;
    const id=item.scopeOnly?node.dataset.dsElement:item.repeatKey?prefix+'-'+contractInstanceKey(keyFor(node,item.repeatKey)):prefix;
    if(item.scopeOnly){if(!id)throw Error('Missing declared scope '+item.id);instances.push({...item,id,node});continue;}
    if(usedIds.has(id)||usedNodes.has(node))throw Error('Duplicate mounted component: '+view+'/'+id);
    const parent=item.within?scope.id:item.parent;
    if(parent!=='layout-root'&&![...base,...mounted].some(row=>row.id===parent))throw Error('Missing mounted parent: '+view+'/'+id+' -> '+parent);
    const expected=item.actions||[item.action];
    const attr=item.actionAttribute||'data-action';
    if(item.action&&attr==='submit'){
     if(node.type!=='submit'||!node.closest('form'))throw Error('Submit binding mismatch: '+id);
    }else if(item.action&&attr!=='event'&&!expected.includes(node.getAttribute(attr)))throw Error('Action binding mismatch: '+view+'/'+id);
    const row={...item,id,parent,node};mounted.push(row);instances.push(row);usedIds.add(id);usedNodes.add(node);
   }
  }
  contexts.set(item.id,instances);
 }
 // All checks precede mutation. A malformed renderer cannot silently publish a
 // partial inventory. Old metadata on reused nodes is explicitly withdrawn.
 const previous=boundNodes.get(root)||new Map();
 for(const node of previous.get(namespace)||[])if(node.isConnected&&!usedNodes.has(node))for(const key of ['dsContract','dsElement','dsBlock','dsRecipe','dsKind','dsBinding','dsParent','dsLevel'])delete node.dataset[key];
 for(const item of mounted){
  const node=item.node;
  if(companion)node.dataset.dsSubcontract='view-parts';else node.dataset.dsContract='v2';node.dataset.dsElement=item.id;node.dataset.dsKey=item.id;
  node.dataset.dsRecipe=item.recipe;node.dataset.dsKind=item.kind;
  node.dataset.dsBlock='block-'+item.recipe;node.dataset.dsBinding=item.within||item.repeatKey?item.id:'';
  node.dataset.dsParent=item.parent;node.dataset.dsLevel=item.level;
  node.dataset.dsMode=item.mode||root.dataset.mode||view;node.dataset.dsState||='default';
  if(item.level==='atom'&&['button','icon','image','text'].includes(item.kind))node.dataset.dsAtomic='true';
 }
 previous.set(namespace,usedNodes);boundNodes.set(root,previous);root.dataset.dsMountedView=view;
 return mounted;
}
export function mountBoundView(root,view){const contract=BOUND_VIEW_CONTRACTS[view];if(!contract)return null;validateViewContract(view,contract);return mountBindings(root,view,contract);}
function baseMounted(root,view){
 const mounted=mountBoundView(root,view);if(mounted)return mounted;
 const contract=viewContract(view);validateViewContract(view,contract);
 const nodes=new Map([...root.querySelectorAll('[data-ds-contract="v2"]')].map(n=>[n.dataset.dsElement,n]));
 if(nodes.size!==contract.length)throw Error('Compiled view is incomplete: '+view+' ('+nodes.size+'/'+contract.length+')');
 return contract.map(item=>{
  const node=nodes.get(item.id);
  if(!node||node.dataset.dsRecipe!==item.recipe||node.dataset.dsBlock!=='block-'+item.recipe)throw Error('Component is out of sync: '+item.id);
  return {...item,node};
 });
}

export function mountedViewContract(root,view){
 const base=baseMounted(root,view);
 const extra=VIEW_COMPANIONS[view]?mountBindings(root,view,VIEW_COMPANIONS[view],{companion:true,base}):[];
 const all=[...base,...extra],ids=new Set(all.map(item=>item.id));
 const known=Object.fromEntries([...Object.values(PIN_PARTS).flat(),...Object.values(SPELLING_OVERLAYS).flat()].map(row=>[row.id,row]));
 for(const node of root.ownerDocument.querySelectorAll('[data-ds-subcontract]')){
  if(node.dataset.dsSubcontract==='view-parts')continue;
  // A closed pause/hint dialog can remain in the document after navigation.
  // Only parts owned by this screen or an open dialog belong to its inventory.
  if(!root.contains(node)&&!node.closest('dialog[open]'))continue;
  const item=known[node.dataset.dsElement];if(!item)throw Error('Undeclared nested contract '+node.dataset.dsElement);
  if(ids.has(item.id))throw Error('Duplicate nested component '+item.id);
  if(node.dataset.dsRecipe!==item.recipe||node.dataset.dsKind!==item.kind)throw Error('Nested recipe mismatch '+item.id);
  all.push({...item,parent:item.parent==='overlay-root'?'layout-root':item.parent,level:item.level||(item.kind==='container'?'group':'atom'),node});ids.add(item.id);
 }
 return all;
}
