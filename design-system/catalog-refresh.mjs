import {validateAssets} from './validation.mjs';
// Unindexed images are visible immediately, but never assigned by filename.
export async function discoverImages(catalog,tree,readBytes){
  if(tree.truncated)throw Error('GitHub zwrócił niepełny katalog plików. Odświeżenie przerwane.');
  const next=structuredClone(catalog),known=new Set([...next.assets.map(a=>a.path),...Object.keys(next.aliases)]);
  for(const file of tree.tree){
    if(file.type!=='blob'||!/^assets\/.*\.(png|jpe?g|webp|avif|svg)$/i.test(file.path)||known.has(file.path))continue;
    const bytes=await readBytes(file.path);
    const hash=await crypto.subtle.digest('SHA-256',bytes);
    const sha=Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
    const same=next.assets.find(a=>a.sha===sha);
    if(same)next.aliases[file.path]=same.path;
    else next.assets.push({path:file.path,sha,id:sha.slice(0,16),size:bytes.byteLength,type:file.path.split('.').at(-1),group:file.path.split('/')[1],references:[]});
  }
  next.assets.sort((a,b)=>a.path.localeCompare(b.path));
  return validateAssets(next);
}
