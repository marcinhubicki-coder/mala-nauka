// Stateful dialog components for Orthography. Each overlay has one compact
// declared family; dynamic examples/related words are content, not new atoms.
const row=(id,recipe,kind,parent,action)=>Object.freeze({id,recipe,kind,parent,...(action?{action}:{}),level:parent==='overlay-root'?'family':kind==='container'?'group':'atom'});
export const SPELLING_OVERLAYS=Object.freeze({
 hint:Object.freeze([
  row('hint-shell','family-education-popup','container','overlay-root'),
  row('hint-head','group-popup-head','container','hint-shell'),
  row('hint-title','text-popup-title','text','hint-head'),
  row('hint-dismiss','button-popup-close','button','hint-head','dismiss-hint'),
  row('hint-copy','text-popup-copy','text','hint-shell')
 ]),
 pause:Object.freeze([
  row('pause-shell','family-education-popup','container','overlay-root'),
  row('pause-title','text-popup-title','text','pause-shell'),
  row('pause-copy','text-popup-copy','text','pause-shell'),
  row('pause-resume','button-main','button','pause-shell','resume'),
  Object.freeze({...row('pause-end','button-main','button','pause-shell','exit'),variantActions:Object.freeze({pause:'exit',exit:'exit-confirm'})})
 ]),
 rule:Object.freeze([
  row('rule-shell','family-education-popup','container','overlay-root'),
  row('rule-head','group-popup-head','container','rule-shell'),
  row('rule-dismiss','button-popup-close','button','rule-head','dismiss-rule'),
  row('rule-visual','container-rule-visual','container','rule-shell'),
  row('rule-mastery-art','image-word-award','image','rule-shell'),
  row('rule-mastery-count','text-word-award-count','text','rule-shell'),
  row('rule-star-art','image-word-award','image','rule-shell'),
  row('rule-star-count','text-word-award-count','text','rule-shell'),
  row('rule-families','text-word-families','text','rule-shell'),
  row('rule-word','text-popup-title','text','rule-shell'),
  row('rule-type','text-popup-badge','text','rule-shell'),
  row('rule-scroll','group-rule-scroll','container','rule-shell'),
  row('rule-additional-rules','text-word-rules','text','rule-scroll'),
  row('rule-explanation','group-rule-explanation','container','rule-scroll'),
  row('rule-explanation-title','text-popup-title','text','rule-explanation'),
  row('rule-explanation-copy','text-popup-copy','text','rule-explanation')
 ])
});
const BY_ID=Object.freeze(Object.fromEntries(Object.entries(SPELLING_OVERLAYS).map(([type,items])=>[type,new Map(items.map(item=>[item.id,item]))])));
export function validateSpellingOverlay(type){
 const items=SPELLING_OVERLAYS[type];if(!items)throw Error('Unknown spelling overlay: '+type);
 const ids=BY_ID[type];if(ids.size!==items.length)throw Error('Duplicate overlay ID: '+type);
 for(const item of items){if(item.parent!=='overlay-root'&&!ids.has(item.parent))throw Error('Missing parent for '+item.id);}
 return true;
}
export function overlayAttrs(type,id){
 const item=BY_ID[type]?.get(id);if(!item)throw Error('Unknown overlay component: '+type+'/'+id);
 return 'data-ds-key="'+id+'" data-ds-recipe="'+item.recipe+'" data-ds-kind="'+item.kind+'"';
}
export function hydrateSpellingOverlay(root,type,{variant='pause'}={}){
 validateSpellingOverlay(type);
 const items=SPELLING_OVERLAYS[type],ids=BY_ID[type];
 const found=new Map();
 for(const node of [root,...root.querySelectorAll('[data-ds-key]')]){
  const id=node.dataset.dsKey;
  if(!ids.has(id))continue;
  if(found.has(id))throw Error('Duplicate spelling overlay component: '+id);
  found.set(id,node);
 }
 if(found.size!==items.length)throw Error('Incomplete spelling overlay '+type+': '+items.filter(item=>!found.has(item.id)).map(item=>item.id).join(','));
 for(const item of items){
  const node=found.get(item.id);
  const expected=item.variantActions?.[variant]||item.action;
  if(item.variantActions&&!Object.hasOwn(item.variantActions,variant))throw Error('Unknown overlay variant '+variant);
  if(expected&&node.dataset.action!==expected)throw Error('Wrong overlay action: '+item.id);
  if(node.dataset.dsRecipe&&node.dataset.dsRecipe!==item.recipe)throw Error('Wrong overlay recipe: '+item.id);
 }
 for(const item of items){
  const node=found.get(item.id);
  node.dataset.dsElement=item.id;node.dataset.dsRecipe=item.recipe;
  node.dataset.dsKind=item.kind;node.dataset.dsBlock='block-'+item.recipe;
  node.dataset.dsSubcontract='spelling-'+type;node.dataset.dsMode='spelling';
  node.dataset.dsState||='default';
  if(item.level==='atom')node.dataset.dsAtomic='true';
 }
 return items.length;
}
