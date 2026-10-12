// Canonical approved 853 x 1844 Home composition in artboard coordinates.
// View components and Design Studio use this same data, never visual DOM scans.
export const HOME_WIDTH=853,HOME_TOP=100,HOME_CONTENT_HEIGHT=1670;
export const HOME_SETTINGS=[709,122,103,103];
export const HOME_STATS=[10,940,833,210];
export const HOME_WELCOME_BOUNDS=[10,220,833,930];
export const HOME_MODES_BOUNDS=[26,1240,801,521];
export const HOME_TILES=Object.freeze({
 spelling:[26,1240,269,260],
 math:[295,1240,266,260],
 english:[560,1240,267,260],
 flags:[26,1499,398,262],
 reading:[428,1499,399,262]
});
const artboard=[0,HOME_TOP,HOME_WIDTH,HOME_CONTENT_HEIGHT];
export const HOME_RECTS=Object.freeze({
 'home-logo':{rect:[26,102,180,140],basis:artboard},
 'home-settings':{rect:HOME_SETTINGS,basis:artboard},
 'home-welcome':{rect:HOME_WELCOME_BOUNDS,basis:artboard},
 'home-hero':{rect:[22,220,810,820],basis:HOME_WELCOME_BOUNDS},
 'home-stats':{rect:HOME_STATS,basis:HOME_WELCOME_BOUNDS},
 'home-adventures':{rect:[26,1162,801,68],basis:artboard},
 'home-modes':{rect:HOME_MODES_BOUNDS,basis:artboard},
 ...Object.fromEntries(Object.entries(HOME_TILES).map(([mode,rect])=>['home-mode-'+mode,{rect,basis:HOME_MODES_BOUNDS}]))
});
const number=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
export function validateHomeLayout(config){
 const overrides=config.layoutOverrides?.home||{};
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides))throw Error('Invalid Home layout overrides');
 for(const [id,rect]of Object.entries(overrides)){
  if(!Object.hasOwn(HOME_RECTS,id)||!rect||Array.isArray(rect)||typeof rect!=='object'||!Object.keys(rect).length)throw Error('Unknown Home layout block: '+id);
  if(Object.keys(rect).some(key=>!['x','y','w','h'].includes(key)))throw Error('Invalid Home geometry attribute: '+id);
  const target={...Object.fromEntries(['x','y','w','h'].map((k,i)=>[k,HOME_RECTS[id].rect[i]])),...rect};
  for(const [key,value]of Object.entries(rect))if(!Number.isFinite(value))throw Error('Home geometry must be finite: '+id+'/'+key);
  if(!number(target.x,0,HOME_WIDTH)||!number(target.y,HOME_TOP,HOME_TOP+HOME_CONTENT_HEIGHT)||!number(target.w,1,HOME_WIDTH)||!number(target.h,1,HOME_CONTENT_HEIGHT)||target.x+target.w>HOME_WIDTH||target.y+target.h>HOME_TOP+HOME_CONTENT_HEIGHT)throw Error('Home block outside the canvas: '+id);
 }
 return true;
}
export function homeRect(config,id){
 const row=HOME_RECTS[id];if(!row)throw Error('Unknown Home block: '+id);
 const {x,y,w,h}=config?.layoutOverrides?.home?.[id]||{};
 const rect=[x??row.rect[0],y??row.rect[1],w??row.rect[2],h??row.rect[3]];
 return {id,rect,basis:row.basis};
}
export function homePosition(config,id){
 const {rect,basis}=homeRect(config,id);
 return 'left:'+((rect[0]-basis[0])/basis[2]*100)+'%;top:'+((rect[1]-basis[1])/basis[3]*100)+'%;width:'+(rect[2]/basis[2]*100)+'%;height:'+(rect[3]/basis[3]*100)+'%';
}
export function applyHomeGeometry(root,config){
 if(!root||root.dataset.view!=='home')return 0;
 validateHomeLayout(config);
 let applied=0;
 for(const id of Object.keys(HOME_RECTS)){
  const node=root.querySelector('[data-ds-element="'+id+'"]');
  if(!node)continue;
  const {rect,basis}=homeRect(config,id),values=[(rect[0]-basis[0])/basis[2]*100,(rect[1]-basis[1])/basis[3]*100,rect[2]/basis[2]*100,rect[3]/basis[3]*100];
  for(const [index,name]of ['left','top','width','height'].entries()){
   const value=values[index]+'%';if(node.style[name]!==value)node.style[name]=value;
  }
  applied++;
 }
 return applied;
}
