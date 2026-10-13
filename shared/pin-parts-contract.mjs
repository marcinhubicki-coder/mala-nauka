// One PIN vocabulary, reused in create, unlock, update and delete flows.
// The field labels, digits and dots are stable atoms, not DOM shapes.
const keyValues=['1','2','3','4','5','6','7','8','9','⌫','0','✓'];
const row=(id,recipe,kind,parent,action='')=>Object.freeze({id,recipe,kind,parent,...(action?{action}:{})});
export const PIN_PARTS=Object.freeze({
 mode:Object.freeze([
  row('pin-mode','control-pin','toggle','pin-card'),
  row('pin-option-pin','pin-option','text','pin-mode'),
  row('pin-option-none','pin-option','text','pin-mode')
 ]),
 code:Object.freeze([
  row('pin-dots','container-pin-dots','container','pin-fields'),
  ...[0,1,2,3].map(n=>row('pin-dot-'+n,'icon-pin-dot','icon','pin-dots')),
  row('pin-keypad','container-pin-keypad','container','pin-fields'),
  ...keyValues.map(key=>row('pin-key-'+(key==='⌫'?'back':key==='✓'?'submit':key),'control-pin-key','key','pin-keypad',key==='⌫'?'pin-backspace':key==='✓'?'submit-pin':'pin-digit'))
 ]),
 none:Object.freeze([
  row('pin-no-code-submit','button-main','button','pin-fields','submit-pin')
 ])
});
const ids=Object.freeze(Object.fromEntries(Object.entries(PIN_PARTS).map(([type,rows])=>[type,new Map(rows.map(row=>[row.id,row]))])));
export function pinAttrs(id){
 const row=Object.values(ids).map(group=>group.get(id)).find(Boolean);
 if(!row)throw Error('Unknown PIN atom '+id);
 return 'data-ds-key="'+id+'" data-ds-recipe="'+row.recipe+'" data-ds-kind="'+row.kind+'"';
}
export function validatePinParts(){
 for(const [name,rows] of Object.entries(PIN_PARTS)){
  if(new Set(rows.map(row=>row.id)).size!==rows.length)throw Error('Duplicate PIN part in '+name);
  if(rows.some(row=>!row.recipe||!row.kind||!row.parent))throw Error('Invalid PIN part '+name);
 }
 if(PIN_PARTS.code.length!==18||PIN_PARTS.mode.length!==3||PIN_PARTS.none.length!==1)throw Error('PIN part vocabulary incomplete');
 return true;
}
// No replacement of the keypad or its buttons: only materialize metadata.
export function hydratePinParts(card,{hasMode=false,hasKeypad=true}={}){
 validatePinParts();
 const expected=[...(hasMode?PIN_PARTS.mode:[]),...(hasKeypad?PIN_PARTS.code:PIN_PARTS.none)];
 const byId=new Map();
 for(const node of card.querySelectorAll('[data-ds-key]')){
  const id=node.dataset.dsKey;
  if(!expected.some(x=>x.id===id))continue;
  if(byId.has(id))throw Error('Duplicate PIN component '+id);
  byId.set(id,node);
 }
 if(byId.size!==expected.length)throw Error('Missing PIN parts '+expected.filter(x=>!byId.has(x.id)).map(x=>x.id).join(','));
 for(const part of expected){
  const node=byId.get(part.id);
  if(node.dataset.dsRecipe!==part.recipe||node.dataset.dsKind!==part.kind)throw Error('PIN recipe mismatch '+part.id);
  if(part.action&&node.dataset.action!==part.action)throw Error('PIN action mismatch '+part.id);
 }
 for(const part of expected){
  const node=byId.get(part.id);
  node.dataset.dsElement=part.id;
  node.dataset.dsBlock='block-'+part.recipe;
  node.dataset.dsMode='spelling'; // canonical editor instance IDs are scoped by the current view
  node.dataset.dsSubcontract='pin-controls';
  node.dataset.dsState||='default';
  if(part.kind==='icon'||part.kind==='text'||part.kind==='button'||part.kind==='key')node.dataset.dsAtomic='true';
 }
 return expected.length;
}
