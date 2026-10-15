import {validateAssets} from './validation.mjs';

// The CDN catalog is regenerated FROM actual archive bytes on every asset
// release. It is the authoritative binary index; V2 tracks word assignments.
export const LIBRARY_CATALOG_URL='https://mala-nauka-assets.vercel.app/asset-catalog.json';
const REPO='marcinhubicki-coder/mala-nauka';
const CURRENT_URL='https://raw.githubusercontent.com/'+REPO+'/refactor/v2-parity-first/design-system/assets.json';
export function validatePublishedCatalog(value){
 if(value?.schemaVersion!==1||!Array.isArray(value.files))throw Error('Nieprawidłowy opublikowany indeks grafik.');
 const paths=new Set(),hashes=new Set();
 for(const file of value.files){
  if(!/^assets\/[a-zA-Z0-9._/-]+$/.test(file.path)||paths.has(file.path)||!/^[0-9a-f]{64}$/.test(file.sha256)||!Number.isFinite(file.size)||file.size<0)throw Error('Nieprawidłowy plik w indeksie CDN.');
  paths.add(file.path);
  // The asset archive may include historical aliases with the same bytes.
  // Each canonical manifest entry in Studio still has exactly one hash.
  if(/^assets\/managed\//.test(file.path)){
   if(hashes.has(file.sha256))throw Error('Zdublowany upload zarządzany: '+file.path);
   hashes.add(file.sha256);
  }
 }
 return value;
}
export async function fetchLibraryIndexes(fetcher=globalThis.fetch.bind(globalThis)){
 const get=async url=>{
  const fresh=new URL(url);fresh.searchParams.set('check',String(Date.now()));
  const response=await fetcher(fresh.href,{cache:'no-store'});
  if(!response.ok)throw Error('Indeks '+fresh.hostname+' nie odpowiada: HTTP '+response.status);
  return response.json();
 };
 const [current,archive]=await Promise.all([get(CURRENT_URL),get(LIBRARY_CATALOG_URL)]);
 return {current:validateAssets(current),archive:validatePublishedCatalog(archive)};
}
export function libraryIndexReport(current,archive,local){
 validateAssets(current);validatePublishedCatalog(archive);if(local)validateAssets(local);
 const published=new Map(archive.files.map(file=>[file.path,file]));
 const issues=[];
 for(const asset of current.assets.filter(a=>/^(assets\/(scenes|managed|flags)\/)/.test(a.path))){
  const file=published.get(asset.path);
  if(!file)issues.push('Brak opublikowanego pliku: '+asset.path);
  else if(file.sha256!==asset.sha||file.size!==asset.size)issues.push('Niezgodna zawartość na CDN: '+asset.path);
 }
 if(local&&(local.revision!==current.revision||
  JSON.stringify(local.assets.map(a=>[a.path,a.sha]))!==JSON.stringify(current.assets.map(a=>[a.path,a.sha]))||
  JSON.stringify(local.aliases)!==JSON.stringify(current.aliases)||
  JSON.stringify(local.words)!==JSON.stringify(current.words)))
   issues.push('Indeks w szkicu różni się od GitHuba. Odśwież i scal zmiany przed publikacją.');
 return {total:current.assets.length,
  scenes:current.assets.filter(a=>a.path.startsWith('assets/scenes/')).length,
  managed:current.assets.filter(a=>a.path.startsWith('assets/managed/')).length,
  aliases:Object.keys(current.aliases).length,
  currentRevision:current.revision,archiveRevision:archive.sourceCommit?.slice(0,10)||'opublikowany',
  issues};
}
