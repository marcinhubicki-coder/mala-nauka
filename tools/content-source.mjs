const repository='marcinhubicki-coder/mala-nauka';
export const CENTRAL_DESIGN_BRANCH='refactor/v2-parity-first';
export function usesLocalDesignSnapshot(branch,report){
 if(!branch||['design/system-v1','main','studio/pwa-test'].includes(branch)||branch.startsWith('refactor/v2-'))return true;
 // Redeploying a generated Test PWA by its immutable SHA must retain the same
 // local assets as its branch deployment, rather than turn into a consumer.
 return /^[0-9a-f]{40}$/.test(branch)&&report?.kind==='optimized-pwa-test'&&/^[0-9a-f]{40}$/.test(report.sourceCommit||'');
}
export async function pinnedContentSource({sourceURL,sourceSHA,fetcher=fetch}={}) {
  if(sourceURL){
    const url=new URL(sourceURL);
    if(url.origin!=='https://raw.githubusercontent.com'||!new RegExp(`^/${repository}/[0-9a-f]{40}/$`).test(url.pathname))throw Error('DS_SOURCE_URL musi wskazywać pełny SHA commitu w repozytorium mala-nauka.');
    return url.href;
  }
  let sha=sourceSHA;
  if(!sha){
    const response=await fetcher(`https://api.github.com/repos/${repository}/commits/${encodeURIComponent(CENTRAL_DESIGN_BRANCH)}`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
    if(!response.ok)throw Error('Nie udało się przypiąć źródła danych do commitu.');
    sha=(await response.json()).sha;
  }
  if(!/^[0-9a-f]{40}$/.test(sha||''))throw Error('DS_SOURCE_SHA musi być pełnym SHA commitu.');
  return `https://raw.githubusercontent.com/${repository}/${sha}/`;
}
