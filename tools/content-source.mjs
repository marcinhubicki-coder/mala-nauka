const repository='marcinhubicki-coder/mala-nauka';
export async function pinnedContentSource({sourceURL,sourceSHA,fetcher=fetch}={}) {
  if(sourceURL){
    const url=new URL(sourceURL);
    if(url.origin!=='https://raw.githubusercontent.com'||!new RegExp(`^/${repository}/[0-9a-f]{40}/$`).test(url.pathname))throw Error('DS_SOURCE_URL musi wskazywać pełny SHA commitu w repozytorium mala-nauka.');
    return url.href;
  }
  let sha=sourceSHA;
  if(!sha){
    const response=await fetcher(`https://api.github.com/repos/${repository}/commits/design%2Fsystem-v1`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
    if(!response.ok)throw Error('Nie udało się przypiąć źródła danych do commitu.');
    sha=(await response.json()).sha;
  }
  if(!/^[0-9a-f]{40}$/.test(sha||''))throw Error('DS_SOURCE_SHA musi być pełnym SHA commitu.');
  return `https://raw.githubusercontent.com/${repository}/${sha}/`;
}
