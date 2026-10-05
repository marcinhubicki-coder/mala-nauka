// Static text only. Dynamic words, scores, nicknames and form values are excluded.
let overrides=[];const originals=new WeakMap();
const tags='h1,h2,h3,p,span,button,label,legend,strong';
const excluded='.answer,.result-word,.spelling-word,.word,.masked-word,.player-name,.player-nick,.pin-digits,.clock,.digit,.counter,.collection-word-name,.flag-name,input,textarea,script,style';
const visible=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
const key=text=>{let h=5381;for(const c of text)h=Math.imul(h,33)^c.charCodeAt(0);return 'copy-'+(h>>>0).toString(36);};
export function collectScreenCopy(root=document.getElementById('app')){
  if(!root)return [];const viewId=document.documentElement.dataset.dsView||'';
  const rows=[...root.querySelectorAll(tags)].filter(el=>!el.children.length&&!el.closest(excluded)&&visible(el)).map(el=>{
    const original=originals.get(el)?.original||el.textContent.trim();return {id:key(el.tagName+':'+original),viewId,tag:el.tagName.toLowerCase(),original,text:el.textContent.trim()};
  }).filter(r=>r.original.length<=600&&/[a-ząćęłńóśźż]/i.test(r.original));
  const counts=new Map();for(const r of rows)counts.set(r.id,(counts.get(r.id)||0)+1);
  return rows.map(r=>({...r,ambiguous:counts.get(r.id)>1}));
}
export function configureScreenCopy(value=[]){overrides=value;applyScreenCopy();}
export function applyScreenCopy(){
  const root=document.getElementById('app');if(!root)return;const viewId=document.documentElement.dataset.dsView;
  for(const el of root.querySelectorAll(tags)){
    if(el.children.length||el.closest(excluded))continue;
    const saved=originals.get(el);let original=saved?.original||el.textContent.trim();
    if(saved&&el.textContent.trim()!==saved.last&&el.textContent.trim()!==original){originals.delete(el);original=el.textContent.trim();}
    const match=overrides.find(r=>r.viewId===viewId&&r.tag===el.tagName.toLowerCase()&&r.original===original);
    if(!match&&!saved)continue;
    if(match){const matches=[...root.querySelectorAll(match.tag)].filter(e=>!e.children.length&&((originals.get(e)?.original||e.textContent.trim())===original));if(matches.length!==1)continue;}
    const next=match?.text??original;
    if(el.textContent!==next){const aria=el.getAttribute('aria-label');el.textContent=next;if(aria===original||aria===saved?.last)el.setAttribute('aria-label',next);}
    originals.set(el,{original,last:next});
  }
}
