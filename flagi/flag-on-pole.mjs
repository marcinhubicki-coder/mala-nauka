import { renderFlagCloth, prewarmFlagCloth } from './flag-cloth.mjs?v=4';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// SVG is the only country-specific input. Source alpha preserves Nepal's shape.
export function flagOnPole(record,{label='Flaga do rozpoznania'}={}){
  const source=new URL(record.flagSvg,document.baseURI).href;
  const ratio=record.id==='ch'||record.id==='va'?1:4/3;
  return `<div class="flag-on-pole" role="img" aria-label="${esc(label)}" data-flag-source="${esc(source)}" style="--flag-ratio:${ratio}"><span class="flag-pole" aria-hidden="true"><i></i><b></b></span><div class="flag-cloth" aria-hidden="true"><img class="flag-cloth-fallback" src="${esc(source)}" alt="" width="640" height="480"><canvas class="flag-cloth-canvas" data-cloth-source="${esc(source)}" data-cloth-ratio="${ratio}"></canvas></div><span class="flag-clouds" aria-hidden="true"></span></div>`;
}
export function paintFlags(root){
  for(const canvas of root.querySelectorAll('.flag-cloth-canvas'))renderFlagCloth(canvas);
}

export function prepareFlag(record,host){
  if(!record||!host)return Promise.resolve();
  const ratio=(record.id==='ch'||record.id==='va'?1:4/3)/1.15;
  const source=new URL(record.flagSvg,document.baseURI).href;
  return Promise.all([.49,.71].map(share=>{
    const width=Math.min(host.clientWidth*share,host.clientHeight*.67*ratio);
    return prewarmFlagCloth(source,width,width/ratio);
  }));
}
