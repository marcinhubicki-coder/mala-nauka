// The inventory is the renderer's hierarchy, never a second catalogue of screens.
export function componentTree(items=[]){
 const byId=new Map(items.map(item=>[item.id,item]));
 const children=new Map();
 for(const item of items){
  if(item.id==='layout-root')continue;
  const parent=byId.has(item.parent)&&item.parent!==item.id?item.parent:'layout-root';
  if(!children.has(parent))children.set(parent,[]);
  children.get(parent).push(item);
 }
 for(const rows of children.values())rows.sort((a,b)=>(a.kind==='background'?-1:0)-(b.kind==='background'?-1:0)||(a.order??0)-(b.order??0));
 const path=id=>{const result=[],seen=new Set();let item=byId.get(id);while(item&&!seen.has(item.id)){seen.add(item.id);result.unshift(item);item=byId.get(item.parent);}return result;};
 const available=item=>Boolean(item.visible||item.revealable||item.temporary&&item.temporary!=='visible'||item.configuredVisibility&&item.configuredVisibility!=='visible');
 return {byId,children,path,available};
}
export function screenLabel(view){return view.name.replace(/^[^·]+\s*·\s*/,'').replace(/^./,c=>c.toLocaleUpperCase('pl'));}
