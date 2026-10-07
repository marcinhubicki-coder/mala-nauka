// Temporary, full-screen combo art. Only compositor-friendly CSS transforms and
// opacity animate: no dynamic SVG turbulence, canvas, WebGL, or per-frame writes.
export const COMBO_GLOBAL_STYLES=['watercolor','tri-wave','noise','still-fire','liquid-flame','fun-flames'];
export const COMBO_GLOBAL_LABELS={watercolor:'Akwarelowy rozbłysk','tri-wave':'Trzy fale','noise':'Sztuka ziarna','still-fire':'Zatrzymany żar','liquid-flame':'Płynny płomień','fun-flames':'Tańczące płomienie'};
export const COMBO_GLOBAL_DEFAULTS=Object.freeze({enabled:true,style:'cycle',duration:1850,intensity:.62});

export function nextComboStyle(previous=-1,style='cycle'){
 if(COMBO_GLOBAL_STYLES.includes(style))return {style,index:COMBO_GLOBAL_STYLES.indexOf(style)};
 const index=(previous+1)%COMBO_GLOBAL_STYLES.length;
 return {style:COMBO_GLOBAL_STYLES[index],index};
}

function ensureStyle(){
 if(document.querySelector('link[data-combo-global]'))return;
 const link=document.createElement('link');
 link.rel='stylesheet';link.dataset.comboGlobal='1';
 link.href=new URL('./combo-global.css',import.meta.url).href;
 document.head.append(link);
}

export function createComboGlobalEffects(host){
 ensureStyle();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let active=null,timer=0,index=-1;
 const clear=()=>{
  clearTimeout(timer);timer=0;
  active?.remove();active=null;
 };
 const play=(config={})=>{
  clear();
  const settings={...COMBO_GLOBAL_DEFAULTS,...(config.comboGlobal||{})};
  if(!config.enabled||settings.enabled===false||document.hidden||reduced.matches)return null;
  const next=nextComboStyle(index,settings.style);
  index=next.index;
  const layer=document.createElement('div');
  // WebKit loses frames on full-screen moving gradients; crossfade the
  // prepainted layers instead. Full motion stays enabled in Chromium/Firefox.
  const webkit=/AppleWebKit/i.test(navigator.userAgent)&&!/Chrome|Chromium|CriOS|Edg/i.test(navigator.userAgent);
  layer.className='mn-combo-global mn-combo-'+next.style+(webkit?' mn-combo-webkit':'');
  layer.setAttribute('aria-hidden','true');
  const duration=Math.max(700,Math.min(3400,Number(settings.duration)||1850));
  layer.style.setProperty('--mn-combo-duration',duration+'ms');
  layer.style.setProperty('--mn-combo-opacity',String(Math.max(.15,Math.min(1,Number(settings.intensity)||.62))));
  // At most three painted gradients; only the warm ember effect gets eight CSS sparks.
  for(let i=0;i<3;i++)layer.append(document.createElement('i'));
  if(next.style==='still-fire')for(let i=0;i<8;i++){
   const spark=document.createElement('b');spark.style.setProperty('--spark-index',i);
   spark.style.left=(12+(i*23)%79)+'%';
   spark.style.bottom=(6+(i*29)%32)+'%';
   spark.style.animationDelay=-(i%5)*.16+'s';
   layer.append(spark);
  }
  host.append(layer);
  active=layer;
  timer=setTimeout(()=>{if(active===layer)clear();},duration+80);
  return next.style;
 };
 return {play,stop:clear,destroy:clear,getActive:()=>active?.className||'',getIndex:()=>index};
}
