import {validateAssets} from './validation.mjs';
import {validateConfig} from './model.mjs';
import {validateRules} from '../shared/rules-library.mjs';
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
const copy=value=>value===undefined?undefined:structuredClone(value);
const safe=key=>!['__proto__','constructor','prototype'].includes(key);

// Keep paths as arrays: a word or filename may legitimately contain a dot.
export function mergeValues(base,local,remote,kind='config',path=[]){
  if(equal(local,remote)||equal(base,local))return {value:copy(remote),conflicts:[]};
  if(equal(base,remote))return {value:copy(local),conflicts:[]};
  if(object(local)&&object(remote)&&(base===undefined||object(base))){
    const value={},conflicts=[];
    for(const key of new Set([...Object.keys(base||{}),...Object.keys(local),...Object.keys(remote)])){
      if(!safe(key))throw Error('Nieprawidłowy klucz podczas scalania.');
      if(path.length===0&&key==='revision'){value[key]=remote[key];continue;}
      const merged=mergeValues(base?.[key],local[key],remote[key],kind,[...path,key]);
      if(merged.value!==undefined)value[key]=merged.value;
      conflicts.push(...merged.conflicts);
    }
    return {value,conflicts};
  }
  const conflict={id:kind+':'+JSON.stringify(path),kind,path,before:copy(base),local:copy(local),remote:copy(remote)};
  return {value:copy(remote),conflicts:[conflict]};
}
const catalogMap=value=>({...value,assets:Object.fromEntries(value.assets.map(asset=>[asset.path,asset]))});
const catalogArray=value=>({...value,assets:Object.values(value.assets).sort((a,b)=>a.path.localeCompare(b.path))});
export function planStudioMerge(base,local,remote){
  const value={},conflicts=[];
  for(const kind of ['config','assets','rules']){
    const convert=kind==='assets'?catalogMap:row=>row;
    const merged=mergeValues(convert(base[kind]),convert(local[kind]),convert(remote[kind]),kind);
    value[kind]=merged.value;conflicts.push(...merged.conflicts);
  }
  return {value,conflicts};
}
export function resolveStudioMerge(plan,choices={}){
  const value=structuredClone(plan.value);
  for(const conflict of plan.conflicts){
    const side=choices[conflict.id];if(!['local','remote'].includes(side))throw Error('Wybierz wersję dla każdego konfliktu.');
    const keys=conflict.path;if(keys.some(key=>!safe(key)))throw Error('Nieprawidłowa ścieżka konfliktu.');
    let cursor=value[conflict.kind];for(const key of keys.slice(0,-1))cursor=cursor[key]||={};
    const next=conflict[side];if(next===undefined)delete cursor[keys.at(-1)];else cursor[keys.at(-1)]=copy(next);
  }
  value.assets=catalogArray(value.assets);
  validateConfig(value.config);validateAssets(value.assets);validateRules(value.rules);
  return value;
}
