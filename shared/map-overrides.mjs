// One country calibration is consumed by Flags, Countries, Capitals and Studio.
import {FLAGS} from '../data/flags.mjs';
const ids=new Set(FLAGS.map(r=>r.id)),object=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function validateMapOverrides(value={}){
 if(!object(value)||Object.keys(value).length>FLAGS.length)throw Error('Nieprawidłowe ustawienia map.');
 for(const [id,entry]of Object.entries(value)){
  if(!ids.has(id)||!object(entry)||Object.keys(entry).some(k=>!['near','full','labels','modes'].includes(k)))throw Error('Nieznany kraj lub parametr mapy: '+id);
  if(entry.modes){if(!object(entry.modes)||Object.keys(entry.modes).some(m=>!['flags','countries','capitals'].includes(m)))throw Error('Nieprawidłowy tryb etykiet.');for(const row of Object.values(entry.modes)){if(!object(row)||Object.keys(row).some(k=>k!=='labels'))throw Error('Tryb może zmieniać tylko etykiety.');validateMapOverrides({[id]:row});}}
  for(const view of ['near','full'])if(entry[view]){
   const camera=entry[view];if(!object(camera)||Object.keys(camera).some(k=>!['zoom','x','y'].includes(k))||!Number.isFinite(camera.zoom)||camera.zoom<.25||camera.zoom>8||['x','y'].some(k=>camera[k]!==undefined&&(!Number.isFinite(camera[k])||Math.abs(camera[k])>20000)))throw Error('Nieprawidłowe zbliżenie: '+id);
  }
  if(entry.labels){if(!object(entry.labels)||Object.keys(entry.labels).some(k=>!['near','full'].includes(k)))throw Error('Nieprawidłowy widok etykiet.');
   for(const labels of Object.values(entry.labels)){
    if(!object(labels)||Object.keys(labels).length>FLAGS.length+1)throw Error('Nieprawidłowe etykiety.');
    for(const [key,label]of Object.entries(labels))if(!/^(country|capital):[a-z]{2}$/.test(key)||!ids.has(key.split(':')[1])||!object(label)||Object.keys(label).some(k=>!['x','y','visible','flag'].includes(k))||['x','y'].some(k=>label[k]!==undefined&&(!Number.isFinite(label[k])||label[k]<0||label[k]>1))||['visible','flag'].some(k=>label[k]!==undefined&&typeof label[k]!=='boolean'))throw Error('Nieprawidłowa pozycja etykiety: '+key);
   }
  }
 }
 return value;
}
export function calibrateFrame(frame,override,bounds){
 if(!override)return {...frame};
 const ratio=frame.w/frame.h,w=Math.min(frame.w/override.zoom,bounds.w,bounds.h*ratio),h=w/ratio,cx=override.x??frame.x+frame.w/2,cy=override.y??frame.y+frame.h/2;
 return {x:Math.max(bounds.x,Math.min(bounds.x+bounds.w-w,cx-w/2)),y:Math.max(bounds.y,Math.min(bounds.y+bounds.h-h,cy-h/2)),w,h};
}
export function calibratedFrames(frames,id,bounds,overrides={}){const row=overrides[id]||{};return {near:calibrateFrame(frames.near,row.near,bounds),full:calibrateFrame(frames.full,row.full,bounds)};}
export function applyLabelCalibration(auto,available,overrides={},width,height,{allowed=()=>true}={}){
 const rows=new Map(auto.map(row=>[row.key,{...row}]));
 for(const [key,setting]of Object.entries(overrides)){
  if(setting.visible===false){rows.delete(key);continue;}
  let row=rows.get(key);
  if(!row&&setting.visible===true){const item=available.find(r=>r.key===key);if(item)row={...item,lines:[item.name],box:{x:0,y:0,w:Math.min(width-16,item.name.length*6.5+10),h:item.flag?28:16},x:item.ax,y:item.ay,leader:false};}
  if(!row)continue;
  row.x=setting.x===undefined?row.x:setting.x*width;row.y=setting.y===undefined?row.y:setting.y*height;row.flag=setting.flag??row.flag;row.flagForce=setting.flag===true;row.leader=false;
  row.x=Math.max(row.box.w/2+4,Math.min(width-row.box.w/2-4,row.x));row.y=Math.max(4,Math.min(height-row.box.h-4,row.y));
  row.box={...row.box,x:row.x-row.box.w/2,y:row.y-2};rows.set(key,row);
 }
 const overlap=(a,b)=>a.x<b.x+b.w+3&&a.x+a.w+3>b.x&&a.y<b.y+b.h+3&&a.y+a.h+3>b.y,locked=new Set(Object.entries(overrides).filter(([,s])=>s.x!==undefined||s.y!==undefined).map(([k])=>k)),placed=[...rows.values()].filter(r=>locked.has(r.key));
 for(const row of [...rows.values()].filter(r=>!locked.has(r.key))){
  if(placed.some(p=>overlap(row.box,p.box))){let position;for(const dy of [0,-24,24,-48,48,-72,72]){for(const dx of [0,-24,24,-48,48]){const box={...row.box,x:row.box.x+dx,y:row.box.y+dy};if(box.x>=4&&box.y>=4&&box.x+box.w<=width-4&&box.y+box.h<=height-4&&allowed(box)&&!placed.some(p=>overlap(box,p.box))){position={box,dx,dy};break;}}if(position)break;}if(position){row.box=position.box;row.x+=position.dx;row.y+=position.dy;row.leader=Math.abs(position.dx)+Math.abs(position.dy)>30;}}
  placed.push(row);
 }
 return [...rows.values()];
}

const merge=(a={},b={})=>({...a,...b,labels:{near:{...a.labels?.near,...b.labels?.near},full:{...a.labels?.full,...b.labels?.full}}});
export function mapSettings(config,id,mode='flags'){
 const d=config?.mapDefaults||{},base=merge({near:{zoom:d.near||1},full:{zoom:d.full||1}},d.countries?.[id]),override=config?.mapOverrides?.[id]||{};
 return merge(merge(base,override),override.modes?.[mode]);
}
export function effectiveMapOverrides(config,mode='flags'){return Object.fromEntries(FLAGS.map(r=>[r.id,mapSettings(config,r.id,mode)]));}
export function validateMapDefaults(value){if(value===undefined)return;if(!object(value)||value.version!==1||!['near','full'].every(k=>Number.isFinite(value[k])&&value[k]>=.25&&value[k]<=8))throw Error('Nieprawidłowa baza map.');validateMapOverrides(value.countries||{});}
export function migrateMapBaseline(config,initial){
 if(!initial?.mapDefaults)return config;const next={...config,mapDefaults:structuredClone(initial.mapDefaults),mapOverrides:{...config.mapOverrides}};
 for(const [id,row]of Object.entries(next.mapOverrides))if(JSON.stringify(row)===JSON.stringify(initial.mapDefaults.countries?.[id]))delete next.mapOverrides[id];return next;
}
