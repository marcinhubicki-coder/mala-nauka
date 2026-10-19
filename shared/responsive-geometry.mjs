// Saved coordinates are fractions of the containing block, never device pixels.
export function validateResponsiveGeometry(config){
 for(const [scope,rows]of Object.entries(config.responsiveGeometry||{})){if(!['global','views'].includes(scope)||!rows||typeof rows!=='object')throw Error('Nieprawidłowy zakres układu.');const sets=scope==='global'?[rows]:Object.values(rows);for(const set of sets)for(const [id,r]of Object.entries(set)){if(!/^[a-zA-Z0-9:_-]{1,180}$/.test(id)||!r||Object.keys(r).some(k=>!['x','y','width','aspect'].includes(k))||!Number.isFinite(r.x)||Math.abs(r.x)>2||!Number.isFinite(r.y)||Math.abs(r.y)>2||r.width!==undefined&&(!Number.isFinite(r.width)||r.width<.01||r.width>3)||r.aspect!==undefined&&(!Number.isFinite(r.aspect)||r.aspect<.02||r.aspect>100))throw Error('Nieprawidłowe współrzędne elementu.');}}
 return config;
}
const originals=new WeakMap(),observed=new WeakSet();let pending=0,current;
function restore(n,old){for(const [k,v]of Object.entries(old))v?n.style.setProperty(k,v.value,v.priority):n.style.removeProperty(k);}
let observer;
export function applyResponsiveGeometry(config,root=document.getElementById('app'),view=document.documentElement.dataset.dsView){
 if(!root)return;current={config,root,view};observer||=new ResizeObserver(()=>{if(!pending)pending=requestAnimationFrame(()=>{pending=0;if(current)applyResponsiveGeometry(current.config,current.root,current.view);});});
 for(const node of root.querySelectorAll('[data-ds-element],[data-ds-key]')){
 const id=node.dataset.dsElement||node.dataset.dsKey,recipe=node.dataset.dsRecipe,r=config.responsiveGeometry?.views?.[view]?.[id]||config.responsiveGeometry?.global?.[recipe],old=originals.get(node);
 if(!r){if(old){restore(node,old);originals.delete(node);}continue;}
 if(!old){const values={};for(const k of ['translate','width','height','aspect-ratio','min-height'])values[k]=node.style.getPropertyValue(k)?{value:node.style.getPropertyValue(k),priority:node.style.getPropertyPriority(k)}:null;originals.set(node,values);}
 const parent=node.parentElement;if(!parent)continue;if(!observed.has(parent)){observed.add(parent);observer.observe(parent);}
 node.style.setProperty('translate',`${r.x*parent.clientWidth}px ${r.y*parent.clientHeight}px`,'important');
 if(r.width!==undefined){node.style.setProperty('width',r.width*100+'%','important');node.style.setProperty('height','auto','important');if(r.aspect!==undefined){node.style.setProperty('aspect-ratio',String(r.aspect));node.style.setProperty('min-height','min-content');}}
 }
}
