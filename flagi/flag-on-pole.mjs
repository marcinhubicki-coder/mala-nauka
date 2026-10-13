import { renderFlagCloth, prewarmFlagCloth } from './flag-cloth.mjs?v=8';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// All 195 countries use prerendered WebP; Canvas remains the on-demand fallback.
const preloadJobs = new Map();
const prebakedUrl = id => new URL('assets/flags/cloth-prebaked/' + id + '.webp', document.baseURI).href;

// SVG is still the canonical country-specific source, including Nepal's alpha.
export function flagOnPole(record,{label='Flaga do rozpoznania'}={}){
  const source=new URL(record.flagSvg,document.baseURI).href;
  const ratio=record.id==='ch'||record.id==='va'?1:4/3;
  const image='<img class="flag-cloth-prebaked" src="' + esc(prebakedUrl(record.id)) + '" alt="" decoding="async">';
  return '<div class="flag-on-pole" role="img" aria-label="' + esc(label) + '" data-flag-source="' + esc(source) + '" style="--flag-ratio:' + ratio + '"><div class="flag-camera"><span class="flag-scene-sky" aria-hidden="true"></span><div class="flag-rig"><span class="flag-pole" aria-hidden="true"><i></i><b></b></span><div class="flag-cloth" aria-hidden="true"><img class="flag-cloth-fallback" src="' + esc(source) + '" alt="" width="640" height="480">' + image + '<canvas class="flag-cloth-canvas" data-cloth-source="' + esc(source) + '" data-cloth-ratio="' + ratio + '"></canvas></div><span class="flag-clouds" aria-hidden="true"></span></div></div></div>';
}

export function paintFlags(root){
  for(const canvas of root.querySelectorAll('.flag-cloth-canvas')){
    const cloth=canvas.closest('.flag-cloth');
    const baked=cloth?.querySelector('.flag-cloth-prebaked');
    if(!baked){void renderFlagCloth(canvas);continue;}
    if(baked.dataset.loadState==='ready')continue;
    if(baked.dataset.loadState==='fallback'){void renderFlagCloth(canvas);continue;}
    const fallback=()=>{
      if(baked.dataset.loadState==='fallback')return;
      baked.dataset.loadState='fallback';
      void renderFlagCloth(canvas);
    };
    if(baked.complete){
      if(baked.naturalWidth){
        baked.dataset.loadState='ready';
        cloth.classList.add('is-prebaked');
      }else fallback();
    }else if(!baked.dataset.loadState){
      baked.dataset.loadState='loading';
      baked.addEventListener('load',()=>{
        if(!cloth.isConnected)return;
        baked.dataset.loadState='ready';
        cloth.classList.add('is-prebaked');
      },{once:true});
      baked.addEventListener('error',fallback,{once:true});
    }
  }
}

function preloadWebp(id){
  const url=prebakedUrl(id);
  if(!preloadJobs.has(url)){
    const task=new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(new Error('Prebaked WebP unavailable: ' + id));
      image.src=url;
    });
    preloadJobs.set(url,task);
    task.catch(()=>preloadJobs.delete(url));
    while(preloadJobs.size>6)preloadJobs.delete(preloadJobs.keys().next().value);
  }
  return preloadJobs.get(url);
}
export function prepareFlag(record,host){
  if(!record||!host)return Promise.resolve();
  const ratio=(record.id==='ch'||record.id==='va'?1:4/3)/1.15;
  const source=new URL(record.flagSvg,document.baseURI).href;
  const width=Math.min(host.clientWidth*.71,host.clientHeight*.67*ratio);
  const fallback=()=>prewarmFlagCloth(source,width,width/ratio);
  return preloadWebp(record.id).catch(fallback);
}
