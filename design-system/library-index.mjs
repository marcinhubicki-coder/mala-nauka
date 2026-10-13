import {validateAssets} from './validation.mjs';

// Read-only check. The archive is intentionally immutable in migration stage 1.
// V2 is currently the live assignment index; archive serves large scene files.
const REPO='marcinhubicki-coder/mala-nauka';
const URLS=Object.freeze({
 current:'https://raw.githubusercontent.com/'+REPO+'/refactor/v2-parity-first/design-system/assets.json',
 archive:'https://raw.githubusercontent.com/'+REPO+'/assets/library-v1/design-system/assets.json'
});
export async function fetchLibraryIndexes(fetcher=globalThis.fetch.bind(globalThis)){
 const read=async key=>{
  const url=new URL(URLS[key]);url.searchParams.set('check',String(Date.now()));
  const response=await fetcher(url.href,{cache:'no-store'});
  if(!response.ok)throw Error('Źródło '+key+' nie odpowiada: HTTP '+response.status);
  return validateAssets(await response.json());
 };
 const [current,archive]=await Promise.all([read('current'),read('archive')]);
 return {current,archive};
}
export function libraryIndexReport(current,archive,local){
 validateAssets(current);validateAssets(archive);if(local)validateAssets(local);
 const issues=[],published=new Map(archive.assets.filter(a=>a.group==='scenes').map(a=>[a.path,a.sha]));
 for(const asset of current.assets.filter(a=>a.group==='scenes')){
  if(!published.has(asset.path))issues.push('Scena niedostępna w archiwum: '+asset.path);
  else if(published.get(asset.path)!==asset.sha)issues.push('Inna wersja sceny: '+asset.path);
 }
 // Local index revision may be stale while the Studio draft is kept intact.
 if(local&&(local.revision!==current.revision||
  JSON.stringify(local.assets.map(a=>[a.path,a.sha]))!==JSON.stringify(current.assets.map(a=>[a.path,a.sha]))||
  JSON.stringify(local.aliases)!==JSON.stringify(current.aliases)||
  JSON.stringify(local.words)!==JSON.stringify(current.words)))
  issues.push('Lokalny indeks różni się od GitHuba. Wczytaj i scal zmiany przed publikacją.');
 return {
  total:current.assets.length,scenes:current.assets.filter(a=>a.group==='scenes').length,
  aliases:Object.keys(current.aliases).length,currentRevision:current.revision,
  archiveRevision:archive.revision,issues
 };
}
