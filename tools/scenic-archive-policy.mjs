// Scene CSS and tiled atlases reference assets outside the Studio upload list.
// Keep their complete, hash-pinned dependency closure in the release gate too.
export function assertScenicArchive(required,published){
 const index=new Map(published.files.map(file=>[file.path,file]));
 for(const file of required.files){
  const actual=index.get(file.path);
  if(!actual||actual.sha256!==file.sha256||actual.size!==file.size)throw Error('Brak lub niezgodny plik sceny Flagi w bibliotece: '+file.path);
 }
}
