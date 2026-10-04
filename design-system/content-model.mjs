import {validateAssets} from './validation.mjs';
export const wordsUsingAsset=(catalog,path)=>Object.entries(catalog.words).filter(([,row])=>(catalog.aliases[row.path]||row.path)===(catalog.aliases[path]||path)).map(([word])=>word).sort((a,b)=>a.localeCompare(b,'pl'));
export function mergeAssetAssignments(catalog,paths,target){
  const unique=[...new Set(paths)];
  if(unique.length<2||!unique.includes(target))throw Error('Wybierz co najmniej dwie grafiki i jedną grafikę docelową.');
  const known=new Map(catalog.assets.map(row=>[row.path,row]));
  if(unique.some(path=>!['scenes','managed'].includes(known.get(path)?.group)||catalog.aliases[path]))throw Error('Scalaj aktywne ilustracje słów.');
  const next=structuredClone(catalog),sources=unique.filter(path=>path!==target);
  for(const row of Object.values(next.words))if(sources.includes(row.path))row.path=target;
  for(const [from,to]of Object.entries(next.aliases))if(sources.includes(to))next.aliases[from]=target;
  for(const path of sources)next.aliases[path]=target;
  return validateAssets(next);
}
