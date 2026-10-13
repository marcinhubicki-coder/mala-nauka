// Studio v2 derives reusable blocks from the production renderer's inventory.
// There is no sample markup or parallel list of parts in this contract.
import {PART_BY_ID} from './structure-model.mjs';

const transient = /^(?:selected|active|disabled|correct|wrong|pressed|complete|paused|is-.+|jelly-v4-.+|.+-(?:selecting|deselecting|start-pop)|ds-.+|has-selection)$/;
export function blockHash(value){let hash=2166136261;for(const char of value){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(36);}
export function blockSignature(node,recipe){
 const shape=n=>{
  const classes=[...n.classList].filter(c=>!transient.test(c)).sort().join('.');
  const vector=n.localName==='svg'||n.closest('svg');
  // Colours belong to a theme; vector paths and geometry define the atom.
  const detail=vector?['viewBox','d','points','x','y','width','height','rx','ry','cx','cy','r'].map(k=>n.getAttribute(k)||'').join('|'):'';
  return [n.localName,classes,n.getAttribute('type')||'',n.dataset.segmented||'',detail,[...n.children].filter(c=>!c.matches('defs,[data-mn-decoration],.jelly-v4-indicator,.effect-particle,.response-particle')).map(shape).join('/')].join(':');
 };
 // Anonymous text/containers inherit appearance from their nearest host.
 // Keep those contracts apart while ignoring content and theme colours.
 const context=['text','container','icon','image'].includes(recipe)?[node.parentElement,node.parentElement?.parentElement].filter(Boolean).map(n=>n.localName+'.'+[...n.classList].filter(c=>!transient.test(c)).sort().join('.')).join('/'):'';
 return recipe+'|'+context+'|'+shape(node);
}
export function blockIdentity(node,recipe){return 'block-'+recipe.replace(/[^a-z0-9_-]/gi,'-')+'-'+blockHash(blockSignature(node,recipe));}
export function runtimeLevel(item,items){
 if(item.id==='layout-root')return 'family';
 const children=items.filter(row=>row.parent===item.id);
 if(!children.length)return 'atom';
 if(PART_BY_ID[item.recipe]?.level==='family')return 'family';
 if(item.parent==='layout-root'&&item.kind==='container')return 'family';
 return 'group';
}
export const BLOCK_LEVELS={family:'Rodzina',group:'Grupa',atom:'Atom'};
export function runtimeRendererReady(root){
 if(!root||root.querySelector('.loading'))return false;
 const wizard=({spelling:'.spelling-wizard-v2',english:'.english-wizard-v2',reading:'.reading-wizard-v2'})[root.dataset.mode];
 return root.dataset.view!=='wizard'||!wizard||Boolean(root.querySelector(wizard));
}
export function runtimeCatalog(registry,inventories=new Map()){
 const records=new Map();
 for(const view of registry.views){
  const items=inventories.get(view.id)?.items||[];
  // Match Edit Screen: include painted/revealable blocks and deliberate hidden
  // overrides, plus their actual ancestors. Dormant loaders are not samples.
  const byId=new Map(items.map(item=>[item.id,item])),included=new Set(),children=new Map();
  for(const item of items){if(!children.has(item.parent))children.set(item.parent,[]);children.get(item.parent).push(item);}
  for(const item of items)if(item.id==='layout-root'||item.visible!==false||item.revealable||['hidden','removed'].includes(item.configuredVisibility)){
   let current=item;const seen=new Set();while(current&&!seen.has(current.id)){seen.add(current.id);included.add(current.id);current=byId.get(current.parent);}
  }
  for(const item of items.filter(item=>included.has(item.id))){
   const id=item.blockId||(item.id==='layout-root'?'screen-'+view.id:item.recipe);
   if(!id)continue;
   let record=records.get(id);
   if(!record){record={id,recipe:item.recipe||'layout',kind:item.kind||'container',name:item.id==='layout-root'?view.name:PART_BY_ID[item.recipe]?.name||item.label,level:runtimeLevel(item,items),children:[],uses:[]};records.set(id,record);}
   const use={view:view.id,id:item.id,blockId:id,label:item.label,mode:item.mode||view.mode,state:item.state||'default',visible:item.visible,revealable:item.revealable};
   if(!record.uses.some(u=>u.view===use.view&&u.id===use.id))record.uses.push(use);
   for(const child of (children.get(item.id)||[]).filter(row=>included.has(row.id))){const childId=child.blockId||child.recipe;if(childId&&!record.children.includes(childId))record.children.push(childId);}
  }
 }
 return [...records.values()];
}
export function runtimeStack(view,selected,items){
 const result=[],seen=new Set();let item=items.find(row=>row.id===selected?.id)||selected;
 while(item&&!seen.has(item.id)){seen.add(item.id);result.unshift({...item,level:runtimeLevel(item,items),libraryId:item.blockId||(item.id==='layout-root'?'screen-'+view.id:item.recipe)});item=items.find(row=>row.id===item.parent);}
 return result;
}

export function semanticCatalog(records){
 const groups=new Map(),canonical=new Map();
 for(const item of records){
  const part=PART_BY_ID[item.recipe],key=part?.id||item.id;
  canonical.set(item.id,key);
  let row=groups.get(key);
  if(!row){row={...item,id:key,registered:Boolean(part),name:part?.name||item.name,level:part?.level||item.level,variants:[],children:[],uses:[]};groups.set(key,row);}
  row.variants.push(item.id);
  for(const use of item.uses)row.uses.push(use);
 }
 for(const item of records){
  const row=groups.get(canonical.get(item.id));
  for(const originalId of item.children){
   const key=canonical.get(originalId);
   if(key&&key!==row.id&&!row.children.includes(key))row.children.push(key);
  }
 }
 return [...groups.values()];
}
