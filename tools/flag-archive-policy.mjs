// This is a deployment contract, not a second copy of the asset database.
// The published assets hostname points to this frozen commit. Updating a
// flag requires publishing a new verified library release FIRST.
export const FLAG_ARCHIVE_SHA='e9e4f8f7a1140cce3b347e7778c490ed929afa21';
export const FLAG_ARCHIVE_INDEX='https://raw.githubusercontent.com/marcinhubicki-coder/mala-nauka/'+FLAG_ARCHIVE_SHA+'/design-system/assets.json';
export const isFrozenFlagFile=path=>/^assets\/flags\/.+\.(?:svg|webp)$/i.test(path);
export function assertFlagArchive(current,archive){
 if(!Array.isArray(current?.assets)||!Array.isArray(archive?.assets))throw Error('Brak pełnego indeksu flag w archiwum');
 const currentFlags=new Map(current.assets.filter(a=>isFrozenFlagFile(a.path)).map(a=>[a.path,a.sha]));
 const frozen=new Map(archive.assets.filter(a=>isFrozenFlagFile(a.path)).map(a=>[a.path,a.sha]));
 if(currentFlags.size<200)throw Error('Indeks flag jest niekompletny — publikacja zatrzymana');
 for(const [path,sha]of currentFlags){
  if(!frozen.has(path))throw Error('Nieopublikowana flaga: '+path);
  if(frozen.get(path)!==sha)throw Error('Inna zawartość flagi niż w archiwum: '+path);
 }
 for(const path of frozen.keys())if(!currentFlags.has(path))
  throw Error('W archiwum jest flaga nieobecna w bieżącym indeksie: '+path);
 return {count:currentFlags.size};
}
