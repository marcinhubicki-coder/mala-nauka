// Declarative view contract. Editor and renderer share stable IDs; no DOM shape hashes.
import {homeDecorationAtoms} from './home-atoms.mjs';
import {SPELLING_SETTINGS_CONTRACT} from './spelling-settings-contract.mjs';

const MODES=['spelling','math','english','flags','reading'];
const row=(id,recipe,kind,parent,level='atom',action=null,mode=null)=>({id,recipe,kind,parent,level,...(action?{action}:{}),...(mode?{mode}:{})});
const home=[
 row('home-background','background-home','background','layout-root'),
 row('home-logo','image-home-logo-art','image','layout-root'),
 row('home-settings','button-home-settings','button','layout-root','atom','settings'),
 row('home-welcome','family-home-welcome','container','layout-root','family'),
 row('home-hero','container-home-hero','container','home-welcome','group'),
 row('home-hero-backing','background-home-hero','background','home-hero'),
 row('home-hero-photo','image-home-hero','image','home-hero'),
 row('home-greeting','text-home-greeting','text','home-hero'),
 row('home-headline','text-home-headline','text','home-hero'),
 row('home-subtitle','text-home-subtitle','text','home-hero'),
 row('home-stats','container-home-stats','container','home-welcome','group'),
 row('home-stats-outer','background-home-stats-outer','background','home-stats'),
 row('home-stats-inner','background-home-stats-inner','background','home-stats'),
 row('home-today','container-home-stat','container','home-stats','group'),
 row('home-target','icon-home-target','icon','home-today'),
 row('home-today-value','text-home-stat-value','text','home-today'),
 row('home-today-label','text-home-stat-label','text','home-today'),
 row('home-stat-divider','background-home-stat-divider','background','home-stats'),
 row('home-last','container-home-last','container','home-stats','group'),
 row('home-star','icon-home-star','icon','home-last'),
 row('home-last-value','text-home-stat-value','text','home-last'),
 row('home-last-label','text-home-stat-label','text','home-last'),
 row('home-progress-arrow','button-home-progress','button','home-last','atom','history'),
 row('home-adventures','container-home-adventures','container','layout-root','group'),
 row('home-adventure-title','text-home-adventure-title','text','home-adventures'),
 row('home-mode-count','text-home-mode-count','text','home-adventures'),
 row('home-modes','family-home-modes','container','layout-root','family')
];
for(const mode of MODES){
 const card='home-mode-'+mode;
 home.push(row(card,'button-home-card','button','home-modes','group','choose-mode',mode));
 home.push(row('home-'+mode+'-surface','icon-home-tile-surface','icon',card));
 home.push(row('home-'+mode+'-decoration','container-home-decoration','container',card,'group'));
 for(const atom of homeDecorationAtoms(mode)){
  const id='home-'+mode+'-'+atom.id;
  home.push(row(id,'icon-home-decoration-'+atom.id.split('-')[0],'icon','home-'+mode+'-decoration'));
 }
 home.push(row('home-'+mode+'-badge','container-home-badge','container',card,'group'));
 home.push(row('home-'+mode+'-badge-surface','icon-home-badge-surface','icon','home-'+mode+'-badge'));
 home.push(row('home-'+mode+(mode==='spelling'||mode==='math'?'-symbol':'-glyph'),mode==='spelling'||mode==='math'?'text-home-mode-symbol':'icon-home-mode-glyph',mode==='spelling'||mode==='math'?'text':'icon','home-'+mode+'-badge'));
 home.push(row('home-'+mode+'-name','text-mode-name','text',card));
}
const playersEmpty=[
 row('player-shell','family-player-empty','container','layout-root','family'),
 row('player-brand-art','image-player-brand-art','image','player-shell'),
 row('player-title','container-player-title','container','player-shell','group'),
 row('player-heading','text-player-title','text','player-title'),
 row('player-subtitle','text-player-copy','text','player-title'),
 row('player-empty-illustration','image-player-empty-art','image','player-shell'),
 row('player-benefit','group-player-benefit','container','player-shell','group'),
 row('player-benefit-icon','icon-player-benefit-icon','icon','player-benefit'),
 row('player-benefit-copy','text-player-copy','text','player-benefit'),
 row('player-add','button-main','button','player-shell','atom','add-player'),
 row('player-guest','button-player-later','button','player-shell','atom','guest-player')
];
const mathSettings=[
 row('math-back','button-back','button','layout-root','atom','home'),
 row('math-heading','text-math-setup-title','text','layout-root'),
 row('math-mission','container-mission','container','layout-root','group'),
 row('mission-illustration','image-mission','image','math-mission'),
 row('math-mission-title','text-mission-title','text','math-mission'),
 row('math-mission-hint','text-mission-hint','text','math-mission'),
 row('math-duration','container-math-duration-setup','container','layout-root','group'),
 ...[60,120,180,300].map(duration=>row('math-duration-'+duration,'button-math-duration','button','math-duration','atom','choose-duration')),
 row('math-categories','group-math-categories','container','layout-root','group'),
 ...['add','subtract','multiply','divide'].map(id=>row('math-category-'+id,'button-math-category','button','math-categories','atom','choose-category')),
 row('math-start','button-game-start','button','layout-root','atom','start-game')
];
const playerCreate=[
 {...row('create-back','button-back','button','layout-root','atom','players'),variantActions:Object.freeze({create:'players',edit:'settings'})},
 row('create-page-title','text-player-title','text','layout-root'),
 row('create-card','container-player-form-card','container','layout-root','family'),
 row('create-preview','image-player-avatar-art','image','create-card'),
 row('create-heading','text-player-form-title','text','create-card'),
 row('create-copy','text-player-copy','text','create-card'),
 row('create-form','container-player-form','container','create-card','group'),
 row('create-name-label','text-field-label','text','create-form'),
 row('create-name-input','input-player-name','input','create-form'),
 row('create-name-help','text-nickname-help','text','create-form'),
 row('create-avatar-label','text-field-label','text','create-form'),
 row('create-avatar-picker','container-avatar-picker','container','create-form','group'),
 ...'abcdefghijkl'.split('').map(letter=>row('create-avatar-'+letter,'button-avatar-choice','button','create-avatar-picker','group','choose-avatar')),
 row('create-submit','button-main','button','create-form','atom','submit-player-form')
];
// PIN variants share the same stable shell; its inner keypad/dots can change
// state without invalidating the family's identity. The key atoms migrate next.
const pinFrame=backAction=>[
 row('pin-back','button-back','button','layout-root','atom',backAction),
 row('pin-page-title','text-player-title','text','layout-root'),
 row('pin-card','container-pin-card','container','layout-root','family'),
 row('pin-profile','container-pin-profile','container','pin-card','group'),
 row('pin-avatar','image-player-avatar-art','image','pin-profile'),
 row('pin-nickname','text-nickname','text','pin-profile'),
 row('pin-fields','container-pin-fields','container','pin-card','group'),
 row('pin-error','text-pin-error','text','layout-root')
];
const playerPin=pinFrame('edit-player');
playerPin[0]={...playerPin[0],variantActions:Object.freeze({create:'edit-player',edit:'settings',delete:'settings'})};
const playerUnlock=pinFrame('players');
const spellingSettings=Object.values(SPELLING_SETTINGS_CONTRACT).map(item=>({
 ...item,
 ...(item.id==='spelling-back'?{action:'home'}:{}),
 ...(item.id==='spelling-start'?{action:'submit-setup'}:{})
}));
export const VIEW_CONTRACTS=Object.freeze({home:Object.freeze(home.map(item=>Object.freeze(item))),'players-empty':Object.freeze(playersEmpty.map(item=>Object.freeze(item))),'math-settings':Object.freeze(mathSettings.map(item=>Object.freeze(item))),'player-create':Object.freeze(playerCreate.map(item=>Object.freeze(item))),'player-pin':Object.freeze(playerPin.map(item=>Object.freeze(item))),'player-unlock':Object.freeze(playerUnlock.map(item=>Object.freeze(item))),'spelling-settings':Object.freeze(spellingSettings.map(item=>Object.freeze(item)))});
// Build the immutable contract index once. Renderers reuse it instead of
// repeatedly scanning up to 90 entries for each labelled component.
const VIEW_INDEX=Object.freeze(Object.fromEntries(Object.entries(VIEW_CONTRACTS).map(([view,items])=>[view,new Map(items.map(item=>[item.id,item]))])));
export const hasViewContract=view=>Object.hasOwn(VIEW_CONTRACTS,view);
export function inheritedMode(view,id){
 const byId=VIEW_INDEX[view]||new Map();
 let item=byId.get(id);
 while(item){if(item.mode)return item.mode;item=byId.get(item.parent);}
 return view;
}
export function validateViewContract(view,items=VIEW_CONTRACTS[view]){
 if(!items?.length)throw Error('Missing view contract: '+view);
 const ids=new Map();
 for(const item of items){
  if(!/^[a-z0-9-]+$/.test(item.id)||ids.has(item.id))throw Error('Duplicate/invalid component ID: '+item.id);
  if(!item.recipe||!item.kind||!['atom','group','family'].includes(item.level))throw Error('Invalid component contract: '+item.id);
  if(item.kind==='button'&&!item.action)throw Error('Button has no explicit action: '+item.id);
  if(item.variantActions){
   if(item.kind!=='button'||!Object.keys(item.variantActions).length||Object.values(item.variantActions).some(action=>typeof action!=='string'||!action))throw Error('Invalid action variants: '+item.id);
  }
  ids.set(item.id,item);
 }
 for(const item of items){
  if(item.parent!=='layout-root'&&!ids.has(item.parent))throw Error('Unknown component parent: '+item.id);
  const seen=new Set([item.id]);let next=item;
  while(next.parent!=='layout-root'){next=ids.get(next.parent);if(seen.has(next.id))throw Error('Cyclic contract: '+item.id);seen.add(next.id);}
 }
 for(const item of items)if(item.level==='atom'&&items.some(child=>child.parent===item.id))throw Error('Atom cannot own blocks: '+item.id);
 return true;
}
export function viewContract(view){return VIEW_CONTRACTS[view]||[];}
export function viewKey(view,id){const item=VIEW_INDEX[view]?.get(id);if(!item)throw Error('Unknown component in view: '+view+'/'+id);return 'data-ds-key="'+id+'"';}
export function viewAttrs(view,id){const item=VIEW_INDEX[view]?.get(id);if(!item)throw Error('Unknown component in view: '+view+'/'+id);return 'data-ds-key="'+id+'" data-ds-recipe="'+item.recipe+'" data-ds-kind="'+item.kind+'"';}
export function staticViewInventory(view){
 const items=viewContract(view);
 validateViewContract(view,items);
 return [{id:'layout-root',blockId:'screen-'+view,recipe:'layout',kind:'container',parent:null,mode:view,level:'family',state:'default',visible:true,label:'Ekran główny'},
 ...items.map(item=>({id:item.id,blockId:'block-'+item.recipe,recipe:item.recipe,kind:item.kind,parent:item.parent,mode:inheritedMode(view,item.id),level:item.level,state:'default',visible:true,label:item.id,action:item.action}))];
}
// Convert an already-rendered component tree into a lightweight, declarative DOM.
// Only contract IDs are accepted; design attributes never change the geometry.
// Hydrate an already-mounted screen *without* innerHTML replacement. Used by
// screens whose existing renderer owns stateful DOM nodes (jelly, sliders,
// animations). O(n) over labelled components once per mount, not a DOM classifier.
export function hydrateViewContract(root,view,{variant='create'}={}){
 const items=viewContract(view);validateViewContract(view,items);
 const nodes=[...root.querySelectorAll('[data-ds-key]')];
 const byId=new Map();
 for(const node of nodes){const id=node.dataset.dsKey;if(VIEW_INDEX[view].has(id)){if(byId.has(id))throw Error('Duplicate rendered component: '+id);byId.set(id,node);}}
 if(byId.size!==items.length)throw Error('Incomplete mounted contract: '+view+' ('+byId.size+'/'+items.length+') missing: '+items.filter(x=>!byId.has(x.id)).map(x=>x.id).join(','));
 for(const item of items){
  const node=byId.get(item.id);
  if(node.dataset.dsRecipe&&node.dataset.dsRecipe!==item.recipe)throw Error('Recipe mismatch: '+item.id);
  if(node.dataset.dsKind&&node.dataset.dsKind!==item.kind)throw Error('Kind mismatch: '+item.id);
  const action=item.variantActions?.[variant]||item.action;
  if(item.variantActions&&!Object.hasOwn(item.variantActions,variant))throw Error('Unknown action variant: '+item.id+'/'+variant);
  if(action&&node.dataset.action!==action)throw Error('Action mismatch: '+item.id+'/'+variant);
 }
 for(const item of items){
  const node=byId.get(item.id);
  node.dataset.dsElement=item.id;
  node.dataset.dsRecipe=item.recipe;
  node.dataset.dsKind=item.kind;
  node.dataset.dsBlock='block-'+item.recipe;
  node.dataset.dsContract='v2';
  node.dataset.dsMode||=inheritedMode(view,item.id);
  node.dataset.dsState||='default';
  if(item.level==='atom'&&['button','icon','image','text'].includes(item.kind))node.dataset.dsAtomic='true';
 }
 return items.length;
}
export function compileViewMarkup(view,markup,{variant='create'}={}){
 const items=viewContract(view);validateViewContract(view,items);
 const byId=VIEW_INDEX[view],used=new Set();
 const result=markup.replace(/<([a-z][\w-]*)([^>]*\sdata-ds-key="([^"]+)"[^>]*)>/gi,(whole,tag,attrs,id)=>{
  const component=byId.get(id);
  if(!component)throw Error('Renderer emitted an undeclared component: '+id);
  if(used.has(id))throw Error('Renderer emitted duplicate component ID: '+id);
  used.add(id);
  if(!attrs.includes('data-ds-recipe="'+component.recipe+'"'))throw Error('Recipe mismatch: '+id);
  if(!attrs.includes('data-ds-kind="'+component.kind+'"'))throw Error('Kind mismatch: '+id);
  const expectedAction=component.variantActions?.[variant]||component.action;
  if(component.variantActions&&!Object.hasOwn(component.variantActions,variant))throw Error('Unknown action variant: '+id+'/'+variant);
  if(expectedAction&&!attrs.includes('data-action="'+expectedAction+'"'))throw Error('Action mismatch: '+id+'/'+variant);
  const atomic=component.level==='atom'&&['button','icon','image','text'].includes(component.kind)?' data-ds-atomic="true"':'';
  const mode=!attrs.includes('data-ds-mode=')?' data-ds-mode="'+inheritedMode(view,id)+'"':'';
  return '<'+tag+attrs+' data-ds-contract="v2" data-ds-element="'+id+'" data-ds-block="block-'+component.recipe+'" data-ds-state="default"'+mode+(attrs.includes('data-ds-atomic=')?'':atomic)+'>';
 });
 if(used.size!==items.length)throw Error('Renderer omitted '+(items.length-used.size)+' declared blocks from '+view+': '+items.filter(i=>!used.has(i.id)).map(i=>i.id).slice(0,8).join(','));
 return result;
}
