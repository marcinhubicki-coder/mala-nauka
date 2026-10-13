// A small pure-math viewport calculation shared by all six continent maps.
// No country-specific bitmap or costly camera animation is required.
export function focusedViewBox(base,box,zoom=1.24){
  if(!base||!box||![base.x,base.y,base.width,base.height,box.x,box.y,box.width,box.height].every(Number.isFinite)||
     base.width<=0||base.height<=0||box.width<=0||box.height<=0)return null;
  const z=Math.max(1,Math.min(1.42,zoom));
  const w=base.width/z,h=base.height/z;
  const midX=base.x+base.width/2,midY=base.y+base.height/2;
  const targetX=box.x+box.width/2,targetY=box.y+box.height/2;
  const centerX=midX+(targetX-midX)*.56,centerY=midY+(targetY-midY)*.56;
  const x=Math.max(base.x,Math.min(base.x+base.width-w,centerX-w/2));
  const y=Math.max(base.y,Math.min(base.y+base.height-h,centerY-h/2));
  return [x,y,w,h].map(n=>Number(n.toFixed(2)));
}
export function focusContinentMap(result,{zoom=1.24}={}){
  const svg=result?.svg,active=result?.active;
  if(!svg||!active||!svg.isConnected)return false;
  try{
    const source=svg.viewBox.baseVal,target=active.getBBox();
    const box=focusedViewBox(source,target,zoom);
    if(!box)return false;
    // A second, geometry-identical outline separates the country from the
    // parchment at Retina size; it never changes borders or country shapes.
    if(!svg.querySelector('.country-focus-halo')){
      const halo=active.cloneNode(true);
      halo.removeAttribute('id');
      halo.removeAttribute('data-country');
      halo.removeAttribute('tabindex');
      halo.removeAttribute('role');
      halo.setAttribute('class','country-focus-halo');
      halo.setAttribute('aria-hidden','true');
      active.parentNode.insertBefore(halo,active);
    }
    svg.setAttribute('viewBox',box.join(' '));
    svg.dataset.focusedCountry='true';
    return true;
  }catch{
    // Missing/tiny geometries and microstate markers keep the original SVG.
    return false;
  }
}
// Deterministic, decorative blurred blotches. Only opacity and transform
// animate; never recalculate SVG geography, filters or per-frame masks.
export function dissolveDrops(id,count=11){
  let seed=0x9e3779b9;
  for(const c of String(id))seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
  const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  return Array.from({length:count},(_,index)=>{
    const x=Math.round(12+random()*78);
    const y=Math.round(13+random()*68);
    const size=Math.round(30+random()*44);
    const delay=Math.round(22+index*24+random()*40);
    return '<i class="flag-dissolve-drop" style="--spot-x:'+x+'%;--spot-y:'+y+'%;--spot-size:'+size+'px;--spot-delay:'+delay+'ms" aria-hidden="true"></i>';
  }).join('');
}
