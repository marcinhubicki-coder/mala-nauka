// Change individual static text nodes; retain child controls, numbers and listeners.
let overrides=[];const originals=new WeakMap();
const tags='h1,h2,h3,p,span,button,label,legend,strong';
const excluded='.loading,.answer,.result-word,.spelling-word,.word,.masked-word,.player-name,.player-nick,.pin-digits,.clock,.digit,.counter,.collection-word-name,.flag-name,input,textarea,script,style,[data-dynamic]';
const visible=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
const key=text=>{let h=5381;for(const c of text)h=Math.imul(h,33)^c.charCodeAt(0);return 'copy-'+(h>>>0).toString(36);};
function nodes(root){return [...root.querySelectorAll(tags)].filter(el=>!el.closest(excluded)).flatMap(el=>[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(node=>({el,node})));}
export function collectScreenCopy(root=document.getElementById('app')){
  if(!root)return [];const viewId=document.documentElement.dataset.dsView||'';
  const rows=nodes(root).filter(({el})=>visible(el)).map(({el,node})=>{const original=originals.get(node)?.original||node.textContent.trim();return {id:key(el.tagName+':'+original),viewId,tag:el.tagName.toLowerCase(),original,text:node.textContent.trim()};}).filter(r=>r.original.length<=600&&/[a-ząćęłńóśźż]/i.test(r.original));
  const counts=new Map();for(const r of rows)counts.set(r.id,(counts.get(r.id)||0)+1);
  return rows.map(r=>({...r,ambiguous:counts.get(r.id)>1}));
}
export function configureScreenCopy(value=[]){overrides=value;applyScreenCopy();}
export function applyScreenCopy(){
  const root=document.getElementById('app');if(!root)return;const viewId=document.documentElement.dataset.dsView,list=nodes(root);
  for(const {el,node}of list){
    const saved=originals.get(node);let original=saved?.original||node.textContent.trim();
    if(saved&&node.textContent.trim()!==saved.last&&node.textContent.trim()!==original){originals.delete(node);original=node.textContent.trim();}
    const match=overrides.find(r=>r.viewId===viewId&&r.tag===el.tagName.toLowerCase()&&r.original===original);
    if(!match&&!saved)continue;
    if(match&&list.filter(({el:e,node:n})=>e.tagName===el.tagName&&(originals.get(n)?.original||n.textContent.trim())===original).length!==1)continue;
    const next=match?.text??original;
    if(node.textContent.trim()!==next){const aria=el.getAttribute('aria-label'),left=node.textContent.match(/^\s*/)[0],right=node.textContent.match(/\s*$/)[0];node.textContent=left+next+right;if(aria===original||aria===saved?.last)el.setAttribute('aria-label',next);}
    originals.set(node,{original,last:next});
  }
}
